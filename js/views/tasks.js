// views/tasks.js - Task list view

class TasksView {
    constructor(app) {
      this.app = app;
    }
    
    async render() {
      return `
        <div class="tasks-view">
          <div class="view-header">
            <h2>My Tasks</h2>
            <div class="view-actions">
              <select id="task-filter" class="form-control form-control-sm">
                <option value="all">All Tasks</option>
                <option value="today">Due Today</option>
                <option value="upcoming">Upcoming</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
          
          <div id="task-list" class="task-list">
            <div class="empty-state">
              <p>No tasks yet. Click the + button to add your first task.</p>
            </div>
          </div>
        </div>
      `;
    }
    
    initializeEventListeners() {
      const filterSelect = document.getElementById('task-filter');
      if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
          this.filterTasks(e.target.value);
        });
      }
    }
    
    filterTasks(filterType) {
      console.log('Filtering tasks by:', filterType);
      // We'll implement this when we build the task system
    }
  }
  
  // Export the class if in Node.js environment
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TasksView };
  } else {
    // Browser context
    window.TasksView = TasksView;
  }