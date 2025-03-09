// task-manager.js - Task operations

class TaskManager {
    constructor(app) {
      this.app = app;
      this.storage = app.storage;
      this.tasks = [];
      this.loaded = false;
    }
    
    // Load tasks from storage
    async loadTasks() {
      try {
        const tasks = await this.storage.get(null, 'tasks');
        this.tasks = tasks || [];
        this.loaded = true;
        
        console.log(`Loaded ${this.tasks.length} tasks`);
        return this.tasks;
      } catch (error) {
        console.error('Error loading tasks:', error);
        this.tasks = [];
        throw error;
      }
    }
    
    // Save all tasks
    async saveTasks() {
      try {
        await this.storage.clear('tasks');
        if (this.tasks.length > 0) {
          for (const task of this.tasks) {
            await this.storage.set(task.id, task, 'tasks');
          }
        }
        return true;
      } catch (error) {
        console.error('Error saving tasks:', error);
        throw error;
      }
    }
    
    // Get all tasks
    async getTasks() {
      if (!this.loaded) {
        await this.loadTasks();
      }
      return [...this.tasks];
    }
    
    // Get tasks filtered by criteria
    async getFilteredTasks(filterCriteria = {}) {
      if (!this.loaded) {
        await this.loadTasks();
      }
      
      let filteredTasks = [...this.tasks];
      
      // Apply filters
      if (filterCriteria.status) {
        filteredTasks = filteredTasks.filter(task => task.status === filterCriteria.status);
      }
      
      if (filterCriteria.category_id) {
        filteredTasks = filteredTasks.filter(task => task.category_id === filterCriteria.category_id);
      }
      
      if (filterCriteria.priority) {
        filteredTasks = filteredTasks.filter(task => task.priority === filterCriteria.priority);
      }
      
      if (filterCriteria.dueToday) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        filteredTasks = filteredTasks.filter(task => {
          if (!task.due_date) return false;
          
          const dueDate = new Date(task.due_date);
          dueDate.setHours(0, 0, 0, 0);
          
          return dueDate.getTime() === today.getTime();
        });
      }
      
      if (filterCriteria.overdue) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        filteredTasks = filteredTasks.filter(task => {
          if (!task.due_date || task.status === 'completed') return false;
          
          const dueDate = new Date(task.due_date);
          dueDate.setHours(0, 0, 0, 0);
          
          return dueDate.getTime() < today.getTime();
        });
      }
      
      // Apply sorting
      if (filterCriteria.sortBy) {
        filteredTasks.sort((a, b) => {
          switch (filterCriteria.sortBy) {
            case 'priority':
              return a.priority - b.priority;
            case 'due_date':
              if (!a.due_date) return 1;
              if (!b.due_date) return -1;
              return new Date(a.due_date) - new Date(b.due_date);
            case 'title':
              return a.title.localeCompare(b.title);
            default:
              return 0;
          }
        });
        
        // Handle reverse sort
        if (filterCriteria.sortDirection === 'desc') {
          filteredTasks.reverse();
        }
      }
      
      return filteredTasks;
    }
    
    // Get task by ID
    async getTask(id) {
      if (!this.loaded) {
        await this.loadTasks();
      }
      
      return this.tasks.find(task => task.id === id);
    }
    
    // Create a new task
    async createTask(taskData) {
      if (!this.loaded) {
        await this.loadTasks();
      }
      
      // Generate unique ID
      const id = 'task_' + Date.now();
      
      // Set defaults for required fields
      const now = new Date().toISOString();
      
      const newTask = {
        id,
        title: taskData.title,
        description: taskData.description || '',
        category_id: taskData.category_id || '',
        subcategory_id: taskData.subcategory_id || '',
        priority: taskData.priority || 3,
        difficulty: taskData.difficulty || 3,
        estimated_minutes: taskData.estimated_minutes || 0,
        due_date: taskData.due_date || null,
        due_time: taskData.due_time || null,
        status: 'not_started',
        progress_type: taskData.progress_type || 'boolean',
        progress_percentage: 0,
        is_recurring: taskData.is_recurring || false,
        recurrence_pattern: taskData.recurrence_pattern || null,
        created_at: now,
        modified_at: now,
        completed_at: null,
        tags: taskData.tags || [],
        notes: taskData.notes || '',
        points_value: this.calculateBasePoints(taskData),
        sync_version: 1
      };
      
      // Add task to collection
      this.tasks.push(newTask);
      
      // Save to storage
      await this.storage.set(id, newTask, 'tasks');
      
      // Trigger sync if online
      if (this.app.online) {
        this.app.sync.syncTasks().catch(error => {
          console.error('Error syncing after task creation:', error);
        });
      }
      
      return newTask;
    }
    
    // Update an existing task
    async updateTask(id, updates) {
      if (!this.loaded) {
        await this.loadTasks();
      }
      
      // Find task index
      const index = this.tasks.findIndex(task => task.id === id);
      
      if (index === -1) {
        throw new Error(`Task with ID ${id} not found`);
      }
      
      // Get task
      const task = this.tasks[index];
      
      // Apply updates
      const updatedTask = {
        ...task,
        ...updates,
        modified_at: new Date().toISOString(),
        sync_version: (task.sync_version || 0) + 1
      };
      
      // Check if task is being completed
      if (updates.status === 'completed' && task.status !== 'completed') {
        updatedTask.completed_at = new Date().toISOString();
        
        // Handle recurrence if needed
        if (task.is_recurring && task.recurrence_pattern) {
          await this.handleRecurringTaskCompletion(updatedTask);
        }
        
        // Award points
        if (this.app.gamification) {
          await this.app.gamification.awardTaskPoints(updatedTask);
        }
      }
      
      // Update in memory array
      this.tasks[index] = updatedTask;
      
      // Save to storage
      await this.storage.set(id, updatedTask, 'tasks');
      
      // Trigger sync if online
      if (this.app.online) {
        this.app.sync.syncTasks().catch(error => {
          console.error('Error syncing after task update:', error);
        });
      }
      
      return updatedTask;
    }
    
    // Delete a task
    async deleteTask(id) {
      if (!this.loaded) {
        await this.loadTasks();
      }
      
      // Find task index
      const index = this.tasks.findIndex(task => task.id === id);
      
      if (index === -1) {
        throw new Error(`Task with ID ${id} not found`);
      }
      
      // Remove from array
      this.tasks.splice(index, 1);
      
      // Remove from storage
      await this.storage.delete(id, 'tasks');
      
      // Trigger sync if online
      if (this.app.online) {
        this.app.sync.syncTasks().catch(error => {
          console.error('Error syncing after task deletion:', error);
        });
      }
      
      return true;
    }
    
    // Calculate base points for a task
    calculateBasePoints(taskData) {
      // Base formula: (6 - Priority) × Difficulty × TimeFactor
      const priority = taskData.priority || 3;
      const difficulty = taskData.difficulty || 3;
      const estimatedMinutes = taskData.estimated_minutes || 30;
      
      // Time factor: sqrt(EstimatedMinutes / 30)
      const timeFactor = Math.sqrt(estimatedMinutes / 30);
      
      // Calculate base points
      const basePoints = (6 - priority) * difficulty * timeFactor;
      
      // Round to nearest integer
      return Math.round(basePoints);
    }
    
    // Handle the completion of a recurring task
    async handleRecurringTaskCompletion(completedTask) {
      try {
        if (!completedTask.is_recurring || !completedTask.recurrence_pattern) {
          return;
        }
        
        // Create a clone of the completed task for the next occurrence
        const pattern = completedTask.recurrence_pattern;
        
        // Calculate next occurrence date
        const nextDate = this.calculateNextOccurrence(completedTask);
        
        if (!nextDate) {
          // No more occurrences
          return;
        }
        
        // Create the next occurrence
        const nextTask = {
          ...completedTask,
          id: 'task_' + Date.now(),
          status: 'not_started',
          progress_percentage: 0,
          due_date: nextDate.toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          modified_at: new Date().toISOString(),
          completed_at: null,
          last_completed_date: completedTask.due_date,
          sync_version: 1
        };
        
        // Add to tasks collection
        this.tasks.push(nextTask);
        
        // Save to storage
        await this.storage.set(nextTask.id, nextTask, 'tasks');
        
        return nextTask;
      } catch (error) {
        console.error('Error handling recurring task:', error);
      }
    }
    
    // Calculate the next occurrence date based on recurrence pattern
    calculateNextOccurrence(task) {
      if (!task.due_date) {
        return null;
      }
      
      const pattern = task.recurrence_pattern;
      const dueDate = new Date(task.due_date);
      
      if (!pattern || !pattern.type) {
        return null;
      }
      
      let nextDate;
      
      switch (pattern.type) {
        case 'daily':
          nextDate = new Date(dueDate);
          nextDate.setDate(nextDate.getDate() + (pattern.interval || 1));
          break;
          
        case 'weekly':
          nextDate = new Date(dueDate);
          nextDate.setDate(nextDate.getDate() + (7 * (pattern.interval || 1)));
          break;
          
        case 'monthly':
          nextDate = new Date(dueDate);
          nextDate.setMonth(nextDate.getMonth() + (pattern.interval || 1));
          break;
          
        case 'custom':
          // For custom, we just add the interval in days
          nextDate = new Date(dueDate);
          nextDate.setDate(nextDate.getDate() + (pattern.interval || 1));
          break;
          
        default:
          return null;
      }
      
      // Check if we've reached the end date
      if (pattern.end_date) {
        const endDate = new Date(pattern.end_date);
        if (nextDate > endDate) {
          return null;
        }
      }
      
      // Check if we've reached max occurrences
      if (pattern.end_after_occurrences) {
        // We would need to track occurrences count somewhere
        // For simplicity, we'll skip this check for now
      }
      
      return nextDate;
    }
    
    // Get daily tasks for today
    async getDailyTasks() {
      return this.getFilteredTasks({ dueToday: true });
    }
    
    // Get overdue tasks
    async getOverdueTasks() {
      return this.getFilteredTasks({ overdue: true });
    }
  }
  
  // Export the class if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TaskManager };
  } else {
    // Browser context
    window.TaskManager = TaskManager;
  }