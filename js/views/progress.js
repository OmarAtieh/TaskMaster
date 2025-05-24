// views/progress.js - Progress tracking view

class ProgressView {
    constructor(app) {
      this.app = app;
      this.tasks = [];
      this.dailyMissions = null;
      this.filterSettings = {
        category: '',
        priority: '',
        dueDate: '',
        searchTerm: ''
      };
    }
    
    async render() {
      // Load data
      const loadSuccess = await this.loadData();

      if (!loadSuccess && (!this.tasks || this.tasks.length === 0) && !this.dailyMissions) {
        return `
        <div class="progress-view">
          <p class="error-message">Could not load progress data. Please try again later.</p>
        </div>
        `;
      }
      
      return `
        <div class="progress-view">
          <div class="view-header">
            <h2>My Progress</h2>
            <div class="view-actions">
              <input type="text" id="task-search" class="search-input" placeholder="Search tasks..." value="${this.filterSettings.searchTerm}">
            </div>
          </div>
          
          <div class="filter-bar">
            <div class="filter-group">
              <label for="category-filter">Category:</label>
              <select id="category-filter" class="filter-select">
                <option value="">All Categories</option>
                ${this.renderCategoryOptions()}
              </select>
            </div>
            
            <div class="filter-group">
              <label for="priority-filter">Priority:</label>
              <select id="priority-filter" class="filter-select">
                <option value="">All Priorities</option>
                <option value="1" ${this.filterSettings.priority === '1' ? 'selected' : ''}>P1 - Highest</option>
                <option value="2" ${this.filterSettings.priority === '2' ? 'selected' : ''}>P2 - High</option>
                <option value="3" ${this.filterSettings.priority === '3' ? 'selected' : ''}>P3 - Medium</option>
                <option value="4" ${this.filterSettings.priority === '4' ? 'selected' : ''}>P4 - Low</option>
                <option value="5" ${this.filterSettings.priority === '5' ? 'selected' : ''}>P5 - Lowest</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="due-date-filter">Due:</label>
              <select id="due-date-filter" class="filter-select">
                <option value="">All Dates</option>
                <option value="today" ${this.filterSettings.dueDate === 'today' ? 'selected' : ''}>Today</option>
                <option value="tomorrow" ${this.filterSettings.dueDate === 'tomorrow' ? 'selected' : ''}>Tomorrow</option>
                <option value="this_week" ${this.filterSettings.dueDate === 'this_week' ? 'selected' : ''}>This Week</option>
                <option value="overdue" ${this.filterSettings.dueDate === 'overdue' ? 'selected' : ''}>Overdue</option>
                <option value="no_date" ${this.filterSettings.dueDate === 'no_date' ? 'selected' : ''}>No Due Date</option>
              </select>
            </div>
            
            <button id="reset-filters" class="filter-reset">Reset</button>
          </div>
          
          <!-- Daily Missions Section -->
          ${this.renderDailyMissionsSection()}
          
          <!-- Tasks Section -->
          <div class="tasks-section">
            <h3 class="section-title">Tasks</h3>
            <div class="task-list">
              ${this.renderFilteredTasks()}
            </div>
          </div>
          
          <!-- Summary Statistics -->
          <div class="stats-summary">
            <div class="stat-card">
              <div class="stat-title">Tasks Remaining</div>
              <div class="stat-value">${this.getRemainingTasksCount()}</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-title">Completed Today</div>
              <div class="stat-value">${this.getCompletedTodayCount()}</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-title">Current Level</div>
              <div class="stat-value">${this.app.gamification?.userProfile?.level || 1}</div>
            </div>
          </div>
        </div>
      `;
    }
    
    initializeEventListeners() {
      // Filter events
      document.getElementById('category-filter')?.addEventListener('change', (e) => {
        this.filterSettings.category = e.target.value;
        this.refreshView();
      });
      
      document.getElementById('priority-filter')?.addEventListener('change', (e) => {
        this.filterSettings.priority = e.target.value;
        this.refreshView();
      });
      
      document.getElementById('due-date-filter')?.addEventListener('change', (e) => {
        this.filterSettings.dueDate = e.target.value;
        this.refreshView();
      });
      
      document.getElementById('task-search')?.addEventListener('input', (e) => {
        this.filterSettings.searchTerm = e.target.value;
        this.refreshView();
      });
      
      document.getElementById('reset-filters')?.addEventListener('click', () => {
        this.filterSettings = {
          category: '',
          priority: '',
          dueDate: '',
          searchTerm: ''
        };
        this.refreshView(true);
      });
      
      // Task card actions
      document.querySelectorAll('.task-complete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const taskId = e.currentTarget.dataset.taskId;
          await this.completeTask(taskId);
        });
      });
      
      document.querySelectorAll('.task-card, .mission-card').forEach(card => {
        card.addEventListener('click', (e) => {
          const taskId = card.dataset.taskId;
          this.app.taskForm.showTaskDetails(taskId);
        });
      });
    }
    
    async loadData() {
      try {
        // Load tasks
        this.tasks = await this.app.tasks.getTasks();
        
        // Load daily missions
        this.dailyMissions = await this.app.dailyMissions.loadDailyMissions();
        
        return true;
      } catch (error) {
        console.error('Error loading data for progress view:', error);
        return false;
      }
    }
    
    renderCategoryOptions() {
      const categories = this.app.categories.getCategories();
      if (!categories || categories.length === 0) {
        return '';
      }
      
      return categories.map(category => 
        `<option value="${category.id}" ${this.filterSettings.category === category.id ? 'selected' : ''}>${category.name}</option>`
      ).join('');
    }
    
    renderDailyMissionsSection() {
      if (!this.dailyMissions || !this.dailyMissions.missions || this.dailyMissions.missions.length === 0) {
        return '';
      }
      
      // Get missions that match the current filters
      const filteredMissions = this.filterMissionsWithSettings(this.dailyMissions.missions);
      
      // If no missions match the filters, hide the section
      if (filteredMissions.length === 0) {
        return '';
      }
      
      return `
        <div class="daily-missions-section">
          <h3 class="section-title">Daily Missions</h3>
          <div class="mission-list">
            ${filteredMissions.map(mission => this.renderMissionCard(mission)).join('')}
          </div>
          <div class="mission-progress">
            <div class="mission-progress-text">
              ${this.getMissionsCompletedCount()} of ${this.dailyMissions.missions.length} missions completed
            </div>
            <div class="progress-bar">
              <div class="progress-bar-fill" style="width: ${this.getMissionsCompletionPercentage()}%"></div>
            </div>
          </div>
        </div>
      `;
    }
    
    renderMissionCard(mission) {
      // Get the full task data to display due date
      const taskData = this.tasks.find(task => task.id === mission.id) || mission;
      
      // Get category name
      let categoryName = 'Uncategorized';
      if (mission.category_id) {
        const category = this.app.categories.getCategory(mission.category_id);
        if (category) {
          categoryName = category.name;
        }
      }
      
      // Get due info
      const dueText = taskData.due_date ? 
        this.getRelativeDueDate(taskData.due_date, taskData.due_time) : 
        'No due date';
      
      return `
        <div class="mission-card ${mission.completed ? 'mission-completed' : ''}" data-task-id="${mission.id}">
          <div class="priority-indicator priority-${mission.priority}"></div>
          
          <div class="mission-content">
            <div class="mission-title">${mission.title}</div>
            <div class="mission-details">${categoryName} • ${dueText}</div>
          </div>
          
          <div class="mission-actions">
            <div class="mission-points">${mission.points} pts</div>
            <button class="mission-complete-btn ${mission.completed ? 'completed' : ''}" 
                    data-task-id="${mission.id}" 
                    title="${mission.completed ? 'Mark as incomplete' : 'Mark as completed'}">
              ${mission.completed ? '✓' : ''}
            </button>
          </div>
        </div>
      `;
    }
    
    renderFilteredTasks() {
      // Filter and sort tasks
      const filteredTasks = this.getFilteredTasks();
      
      if (filteredTasks.length === 0) {
        return `
          <div class="empty-state">
            <p>No tasks match your filters. Try adjusting your criteria or add new tasks.</p>
          </div>
        `;
      }
      
      return filteredTasks.map(task => this.renderTaskCard(task)).join('');
    }
    
    renderTaskCard(task) {
      // Skip if task is part of daily missions (to avoid duplication)
      if (this.isTaskInDailyMissions(task.id)) {
        return '';
      }
      
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
            <div class="task-points">${task.points_value || 0} pts</div>
            <button class="task-complete-btn" data-task-id="${task.id}" title="Mark as completed">
              ${task.status === 'completed' ? '✓' : ''}
            </button>
          </div>
        </div>
      `;
    }
    
    getFilteredTasks() {
      if (!this.tasks || this.tasks.length === 0) {
        return [];
      }
      
      // Apply filters
      let filteredTasks = [...this.tasks];
      
      // Filter by search term
      if (this.filterSettings.searchTerm) {
        const searchLower = this.filterSettings.searchTerm.toLowerCase();
        filteredTasks = filteredTasks.filter(task => 
          task.title.toLowerCase().includes(searchLower) || 
          (task.description && task.description.toLowerCase().includes(searchLower))
        );
      }
      
      // Filter by category
      if (this.filterSettings.category) {
        filteredTasks = filteredTasks.filter(task => 
          task.category_id === this.filterSettings.category
        );
      }
      
      // Filter by priority
      if (this.filterSettings.priority) {
        filteredTasks = filteredTasks.filter(task => 
          task.priority === parseInt(this.filterSettings.priority, 10)
        );
      }
      
      // Filter by due date
      if (this.filterSettings.dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        switch (this.filterSettings.dueDate) {
          case 'today':
            filteredTasks = filteredTasks.filter(task => {
              if (!task.due_date) return false;
              const dueDate = new Date(task.due_date);
              dueDate.setHours(0, 0, 0, 0);
              return dueDate.getTime() === today.getTime();
            });
            break;
            
          case 'tomorrow':
            filteredTasks = filteredTasks.filter(task => {
              if (!task.due_date) return false;
              const dueDate = new Date(task.due_date);
              dueDate.setHours(0, 0, 0, 0);
              return dueDate.getTime() === tomorrow.getTime();
            });
            break;
            
          case 'this_week':
            filteredTasks = filteredTasks.filter(task => {
              if (!task.due_date) return false;
              const dueDate = new Date(task.due_date);
              dueDate.setHours(0, 0, 0, 0);
              return dueDate >= today && dueDate < nextWeek;
            });
            break;
            
          case 'overdue':
            filteredTasks = filteredTasks.filter(task => {
              if (!task.due_date || task.status === 'completed') return false;
              const dueDate = new Date(task.due_date);
              dueDate.setHours(0, 0, 0, 0);
              return dueDate < today;
            });
            break;
            
          case 'no_date':
            filteredTasks = filteredTasks.filter(task => !task.due_date);
            break;
        }
      }
      
      // Sort tasks by combination of priority and due date
      return this.sortTasks(filteredTasks);
    }
    
    sortTasks(tasks) {
      return [...tasks].sort((a, b) => {
        // First sort by status (incomplete first)
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
        
        // For tasks with the same completion status, sort by priority
        if (a.priority !== b.priority) {
          return a.priority - b.priority; // Lower priority number = higher priority
        }
        
        // For tasks with same priority, sort by due date
        if (a.due_date && b.due_date) {
          return new Date(a.due_date) - new Date(b.due_date);
        }
        
        // Tasks with due dates come before tasks without due dates
        if (a.due_date && !b.due_date) return -1;
        if (!a.due_date && b.due_date) return 1;
        
        // If everything else is equal, sort by difficulty
        return (b.difficulty || 3) - (a.difficulty || 3);
      });
    }
    
    filterMissionsWithSettings(missions) {
      if (!missions || missions.length === 0) {
        return [];
      }
      
      // Start with all missions
      let filteredMissions = [...missions];
      
      // Filter by search term
      if (this.filterSettings.searchTerm) {
        const searchLower = this.filterSettings.searchTerm.toLowerCase();
        filteredMissions = filteredMissions.filter(mission => 
          mission.title.toLowerCase().includes(searchLower)
        );
      }
      
      // Filter by category
      if (this.filterSettings.category) {
        filteredMissions = filteredMissions.filter(mission => 
          mission.category_id === this.filterSettings.category
        );
      }
      
      // Filter by priority
      if (this.filterSettings.priority) {
        filteredMissions = filteredMissions.filter(mission => 
          mission.priority === parseInt(this.filterSettings.priority, 10)
        );
      }
      
      // Due date filtering doesn't apply to missions as they're always for today
      
      return filteredMissions;
    }
    
    isTaskInDailyMissions(taskId) {
      if (!this.dailyMissions || !this.dailyMissions.missions) {
        return false;
      }
      
      return this.dailyMissions.missions.some(mission => mission.id === taskId);
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
        const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"], .mission-card[data-task-id="${taskId}"]`);
        
        // Add completion animation
        if (taskCard) {
          taskCard.classList.add('task-complete');
          
          // Play task completion sound
          if (this.app.sound && this.app.preferences.soundEnabled) {
            this.app.sound.play('taskComplete');
          }
        }
        
        // Mark task as completed
        await this.app.tasks.updateTask(taskId, {
          status: 'completed',
          progress_percentage: 100
        });
        
        // Update mission status if needed
        if (this.isTaskInDailyMissions(taskId)) {
          await this.app.dailyMissions.updateMissionStatus(taskId, true);
        }
        
        // Wait for animation to finish
        setTimeout(() => {
          this.refreshView();
        }, 500);
      } catch (error) {
        console.error('Error completing task:', error);
        if (this.app && this.app.notificationUI) {
          this.app.notificationUI.showNotification('Error completing task: ' + error.message, 'error', 5000);
        }
      }
    }
    
    async refreshView(resetFilters = false) {
      // If requested, reset filter form controls
      if (resetFilters) {
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) categoryFilter.value = '';
        
        const priorityFilter = document.getElementById('priority-filter');
        if (priorityFilter) priorityFilter.value = '';
        
        const dueDateFilter = document.getElementById('due-date-filter');
        if (dueDateFilter) dueDateFilter.value = '';
        
        const searchInput = document.getElementById('task-search');
        if (searchInput) searchInput.value = '';
      }
      
      // Reload data
      await this.loadData();
      
      // Update view
      const progressView = document.querySelector('.progress-view');
      if (progressView) {
        progressView.innerHTML = await this.render();
        this.initializeEventListeners();
      }
    }
    
    // TODO: Refactor getRelativeDueDate to a shared utility function
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
    
    getRemainingTasksCount() {
      if (!this.tasks) return 0;
      return this.tasks.filter(task => task.status !== 'completed').length;
    }
    
    getCompletedTodayCount() {
      if (!this.tasks) return 0;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return this.tasks.filter(task => {
        if (task.status !== 'completed' || !task.completed_at) return false;
        
        const completedDate = new Date(task.completed_at);
        completedDate.setHours(0, 0, 0, 0);
        
        return completedDate.getTime() === today.getTime();
      }).length;
    }
    
    getMissionsCompletedCount() {
      if (!this.dailyMissions || !this.dailyMissions.missions) {
        return 0;
      }
      
      return this.dailyMissions.missions.filter(mission => mission.completed).length;
    }
    
    getMissionsCompletionPercentage() {
      if (!this.dailyMissions || !this.dailyMissions.missions || this.dailyMissions.missions.length === 0) {
        return 0;
      }
      
      const completed = this.getMissionsCompletedCount();
      const total = this.dailyMissions.missions.length;
      
      return Math.round((completed / total) * 100);
    }
  }
  
  // Export the class if in Node.js environment
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProgressView };
  } else {
    // Browser context
    window.ProgressView = ProgressView;
  }