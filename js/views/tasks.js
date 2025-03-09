// views/tasks.js - Task list view

class TasksView {
    constructor(app) {
      this.app = app;
      this.tasks = [];
      this.filterType = 'all';
      this.sortBy = 'priority';
      this.sortDirection = 'asc';
    }
    
    async render() {
      // Load tasks
      await this.loadTasks();
      
      return `
        <div class="tasks-view">
          <div class="view-header">
            <h2>My Tasks</h2>
            <div class="view-actions">
              <select id="task-filter" class="form-control form-control-sm">
                <option value="all" ${this.filterType === 'all' ? 'selected' : ''}>All Tasks</option>
                <option value="today" ${this.filterType === 'today' ? 'selected' : ''}>Due Today</option>
                <option value="upcoming" ${this.filterType === 'upcoming' ? 'selected' : ''}>Upcoming</option>
                <option value="overdue" ${this.filterType === 'overdue' ? 'selected' : ''}>Overdue</option>
                <option value="completed" ${this.filterType === 'completed' ? 'selected' : ''}>Completed</option>
              </select>
              
              <select id="task-sort" class="form-control form-control-sm ml-2">
                <option value="priority" ${this.sortBy === 'priority' ? 'selected' : ''}>Priority</option>
                <option value="due_date" ${this.sortBy === 'due_date' ? 'selected' : ''}>Due Date</option>
                <option value="title" ${this.sortBy === 'title' ? 'selected' : ''}>Title</option>
              </select>
              
              <button id="sort-direction" class="icon-button" title="Toggle sort direction">
                ${this.sortDirection === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
          
          <div id="task-list" class="task-list">
            ${this.renderTaskList()}
          </div>
        </div>
      `;
    }
    
    initializeEventListeners() {
      // Filter and sort controls
      const filterSelect = document.getElementById('task-filter');
      if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
          this.filterType = e.target.value;
          this.refreshTaskList();
        });
      }
      
      const sortSelect = document.getElementById('task-sort');
      if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
          this.sortBy = e.target.value;
          this.refreshTaskList();
        });
      }
      
      const sortDirectionBtn = document.getElementById('sort-direction');
      if (sortDirectionBtn) {
        sortDirectionBtn.addEventListener('click', () => {
          this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
          sortDirectionBtn.textContent = this.sortDirection === 'asc' ? '↑' : '↓';
          this.refreshTaskList();
        });
      }
      
      // Task actions
      document.querySelectorAll('.task-complete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const taskId = e.currentTarget.dataset.taskId;
          await this.completeTask(taskId);
        });
      });
      
      document.querySelectorAll('.task-card').forEach(card => {
        card.addEventListener('click', (e) => {
          const taskId = card.dataset.taskId;
          this.openTaskDetails(taskId);
        });
      });
      
      // Add task button in main UI
      const addTaskBtn = document.getElementById('add-task-button');
      if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
          this.showAddTaskForm();
        });
      }
    }
    
    async loadTasks() {
      try {
        // Get filter criteria based on filter type
        const filterCriteria = this.getFilterCriteria();
        
        // Include sort options
        filterCriteria.sortBy = this.sortBy;
        filterCriteria.sortDirection = this.sortDirection;
        
        // Get filtered and sorted tasks
        this.tasks = await this.app.tasks.getFilteredTasks(filterCriteria);
        
        return this.tasks;
      } catch (error) {
        console.error('Error loading tasks:', error);
        this.tasks = [];
        return [];
      }
    }
    
    getFilterCriteria() {
      switch (this.filterType) {
        case 'today':
          return { dueToday: true };
        case 'upcoming':
          // Only include non-overdue future tasks
          return { status: 'not_started' }; // This is simplified - a real implementation would filter by date
        case 'overdue':
          return { overdue: true };
        case 'completed':
          return { status: 'completed' };
        case 'all':
        default:
          return {};
      }
    }
    
    renderTaskList() {
      if (!this.tasks || this.tasks.length === 0) {
        return `
          <div class="empty-state">
            <p>No tasks found. Click the + button to add your first task.</p>
          </div>
        `;
      }
      
      return this.tasks.map(task => this.renderTaskCard(task)).join('');
    }
    
    renderTaskCard(task) {
      // Get relative due date text
      const dueText = this.getRelativeDueDate(task.due_date, task.due_time);
      
      // Determine status class
      let statusClass = '';
      if (task.status === 'completed') {
        statusClass = 'task-completed';
      } else if (task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed') {
        statusClass = 'task-overdue';
      }
      
      // Get category name
      let categoryName = 'Uncategorized';
      if (task.category_id) {
        const category = this.app.categories.getCategory(task.category_id);
        if (category) {
          categoryName = category.name;
        }
      }
      
      // Render progress bar for incremental tasks
      let progressBar = '';
      if (task.progress_type === 'incremental' && task.status !== 'completed') {
        progressBar = `
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${task.progress_percentage}%"></div>
            <span class="progress-text">${task.progress_percentage}%</span>
          </div>
        `;
      }
      
      return `
        <div class="task-card ${statusClass}" data-task-id="${task.id}">
          <div class="priority-indicator priority-${task.priority}"></div>
          
          <div class="task-content">
            <div class="task-title">${task.title}</div>
            <div class="task-details">${categoryName} • ${dueText}</div>
            ${progressBar}
          </div>
          
          <div class="task-actions">
            <button class="task-complete-btn" data-task-id="${task.id}" title="Mark as completed">
              ✓
            </button>
          </div>
        </div>
      `;
    }
    
    getRelativeDueDate(dueDate, dueTime) {
      if (!dueDate) {
        return 'No due date';
      }
      
      const now = new Date();
      const due = new Date(dueDate);
      
      // Add time if available
      if (dueTime) {
        const [hours, minutes] = dueTime.split(':');
        due.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      } else {
        due.setHours(23, 59, 59);
      }
      
      const diffMs = due - now;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return Math.abs(diffDays) === 1 ? 'Due yesterday' : `Overdue by ${Math.abs(diffDays)} days`;
      } else if (diffDays === 0) {
        // Due today
        if (dueTime) {
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          if (diffHours < 1) {
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            if (diffMinutes < 0) {
              return 'Overdue';
            } else if (diffMinutes < 60) {
              return `Due in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
            }
          }
          return `Due in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
        }
        return 'Due today';
      } else if (diffDays === 1) {
        return 'Due tomorrow';
      } else if (diffDays < 7) {
        return `Due in ${diffDays} days`;
      } else {
        return `Due on ${due.toLocaleDateString()}`;
      }
    }
    
    async refreshTaskList() {
      await this.loadTasks();
      
      const taskListContainer = document.getElementById('task-list');
      if (taskListContainer) {
        taskListContainer.innerHTML = this.renderTaskList();
        
        // Re-attach event listeners
        document.querySelectorAll('.task-complete-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const taskId = e.currentTarget.dataset.taskId;
            await this.completeTask(taskId);
          });
        });
        
        document.querySelectorAll('.task-card').forEach(card => {
          card.addEventListener('click', (e) => {
            const taskId = card.dataset.taskId;
            this.openTaskDetails(taskId);
          });
        });
      }
    }
    
    async completeTask(taskId) {
      try {
        const task = await this.app.tasks.getTask(taskId);
        
        if (!task) {
          console.error('Task not found:', taskId);
          return;
        }
        
        // If task is already completed, do nothing
        if (task.status === 'completed') {
          return;
        }
        
        // Get the task card element
        const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
        
        // Add completion animation
        if (taskCard) {
          taskCard.classList.add('task-complete');
          
          // Play task completion sound
          if (this.app.sound && this.app.preferences.soundEnabled) {
            this.app.sound.play('taskComplete');
          }
        }
        
        // Mark task as completed
        const updatedTask = await this.app.tasks.updateTask(taskId, {
          status: 'completed',
          progress_percentage: 100
        });
        
        // Wait for animation to finish
        setTimeout(() => {
          this.refreshTaskList();
        }, 500);
        
        return updatedTask;
      } catch (error) {
        console.error('Error completing task:', error);
      }
    }
    
    openTaskDetails(taskId) {
      console.log('Opening task details for:', taskId);
      // We'll implement this in a future update
      alert('Task details view not implemented yet');
    }
    
    showAddTaskForm() {
      // For now, just a simple prompt
      const taskTitle = prompt('Enter task title:');
      
      if (taskTitle) {
        this.createTask(taskTitle);
      }
    }
    
    async createTask(title) {
      try {
        // Create a basic task with the title
        const newTask = await this.app.tasks.createTask({
          title,
          priority: 3,
          difficulty: 3
        });
        
        // Refresh the task list
        await this.refreshTaskList();
        
        return newTask;
      } catch (error) {
        console.error('Error creating task:', error);
        alert('Failed to create task: ' + error.message);
      }
    }
  }
  
  // Export the class if in Node.js environment
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TasksView };
  } else {
    // Browser context
    window.TasksView = TasksView;
  }