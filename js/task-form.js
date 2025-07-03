// task-form.js - Task add/edit form functionality

class TaskForm {
    constructor(app) {
      this.app = app;
      this.isEdit = false;
      this.currentTask = null;
    }
    
    // Show form for adding a new task
    showAddForm() {
      this.isEdit = false;
      this.currentTask = null;
      
      this.showForm({
        title: '',
        description: '',
        category_id: '',
        subcategory_id: '',
        priority: 3,
        difficulty: 3,
        estimated_minutes: 30,
        due_date: '',
        due_time: '',
        is_recurring: false,
        recurrence_pattern: {},
        progress_type: 'boolean',
        tags: []
      });
    }
    
    // Show form for editing an existing task
    async showEditForm(taskId) {
      this.isEdit = true;
      
      try {
        const task = await this.app.tasks.getTask(taskId);
        
        if (!task) {
          throw new Error(`Task with ID ${taskId} not found`);
        }
        
        this.currentTask = task;
        this.showForm(task);
      } catch (error) {
        console.error('Error loading task for edit:', error);
        // TODO: Implement non-blocking user notification (e.g., this.app.ui.showNotification('Error message', 'error'))
        // alert('Could not load task: ' + error.message);
      }
    }
    
    // Show the task form dialog
    showForm(taskData) {
      // Create dialog overlay
      const overlay = document.createElement('div');
      overlay.className = 'overlay';
      
      // Create form dialog
      const formHtml = this.generateFormHtml(taskData);
      overlay.innerHTML = formHtml;
      
      // Add to document
      document.body.appendChild(overlay);
      
      // Initialize form controls
      this.initializeFormControls(taskData);
    }
    
    async showTaskDetails(taskId) {
        try {
          const task = await this.app.tasks.getTask(taskId);
          
          if (!task) {
            throw new Error(`Task with ID ${taskId} not found`);
          }
          
          this.currentTask = task;
          
          // Create dialog overlay
          const overlay = document.createElement('div');
          overlay.className = 'overlay';
          
          // Create details dialog
          overlay.innerHTML = this.generateDetailsHtml(task);
          
          // Add to document
          document.body.appendChild(overlay);
          
          // Initialize controls
          this.initializeDetailsControls(task);
        } catch (error) {
          console.error('Error loading task details:', error);
          // TODO: Implement non-blocking user notification (e.g., this.app.ui.showNotification('Error message', 'error'))
          // alert('Could not load task details: ' + error.message);
        }
      }
      
      // Generate HTML for task details view
    generateDetailsHtml(task) {
        // Get category and subcategory names
        let categoryName = 'Uncategorized';
        let subcategoryName = '';
        
        if (task.category_id) {
        const category = this.app.categories.getCategory(task.category_id);
        if (category) {
            categoryName = category.name;
            
            if (task.subcategory_id) {
            const subcategory = category.subcategories?.find(s => s.id === task.subcategory_id);
            if (subcategory) {
                subcategoryName = subcategory.name;
            }
            }
        }
        }
        
        // Format dates
        const formattedCreatedDate = task.created_at ? new Date(task.created_at).toLocaleString() : 'Unknown';
        const formattedDueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'None';
        const formattedDueTime = task.due_time || 'None';
        
        // Get status and progress
        let statusText = 'Not Started';
        let progressHtml = '';
        
        if (task.status === 'completed') {
        statusText = 'Completed';
        
        if (task.completed_at) {
            statusText += ` on ${new Date(task.completed_at).toLocaleString()}`;
        }
        } else if (task.status === 'in_progress') {
        statusText = 'In Progress';
        
        if (task.progress_type === 'incremental') {
            progressHtml = `
            <div class="progress-bar-large">
                <div class="progress-bar-fill" style="width: ${task.progress_percentage}%"></div>
                <span class="progress-text">${task.progress_percentage}%</span>
            </div>
            `;
        }
        }
        
        // Add progress adjustment controls for incremental tasks
        if (task.progress_type === 'incremental' && task.status !== 'completed') {
        progressHtml += `
            <div class="progress-adjust-controls">
            <button class="progress-adjust-btn" data-adjust="-10">-10%</button>
            <button class="progress-adjust-btn" data-adjust="-5">-5%</button>
            <input type="range" id="progress-slider" min="0" max="100" step="5" value="${task.progress_percentage}">
            <button class="progress-adjust-btn" data-adjust="+5">+5%</button>
            <button class="progress-adjust-btn" data-adjust="+10">+10%</button>
            <span id="progress-value">${task.progress_percentage}%</span>
            </div>
        `;
        }
        
        // Recurrence info
        let recurrenceText = 'No';
        if (task.is_recurring && task.recurrence_pattern) {
        const pattern = task.recurrence_pattern;
        const interval = pattern.interval || 1;
        
        switch (pattern.type) {
            case 'daily':
            recurrenceText = `Yes, every ${interval} day${interval > 1 ? 's' : ''}`;
            break;
            case 'weekly':
            recurrenceText = `Yes, every ${interval} week${interval > 1 ? 's' : ''}`;
            break;
            case 'monthly':
            recurrenceText = `Yes, every ${interval} month${interval > 1 ? 's' : ''}`;
            break;
            default:
            recurrenceText = 'Yes';
        }
        }
        
        return `
        <div class="dialog task-details-dialog">
            <div class="dialog-header">
            <h2>Task Details</h2>
            <button type="button" class="close-button" id="close-details">×</button>
            </div>
            
            <div class="dialog-content">
            <div class="task-details-header">
                <h3 class="task-details-title">${task.title}</h3>
                <div class="task-badges">
                <span class="badge priority-badge priority-${task.priority}">P${task.priority}</span>
                <span class="badge difficulty-badge difficulty-${task.difficulty}">D${task.difficulty}</span>
                </div>
            </div>
            
            ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
            
            ${progressHtml}
            
            <div class="detail-section">
                <div class="detail-row">
                <div class="detail-label">Status:</div>
                <div class="detail-value">${statusText}</div>
                </div>
                
                <div class="detail-row">
                <div class="detail-label">Category:</div>
                <div class="detail-value">${categoryName}</div>
                </div>
                
                ${subcategoryName ? `
                <div class="detail-row">
                    <div class="detail-label">Subcategory:</div>
                    <div class="detail-value">${subcategoryName}</div>
                </div>
                ` : ''}
                
                <div class="detail-row">
                <div class="detail-label">Due Date:</div>
                <div class="detail-value">${formattedDueDate}</div>
                </div>
                
                <div class="detail-row">
                <div class="detail-label">Due Time:</div>
                <div class="detail-value">${formattedDueTime}</div>
                </div>
                
                <div class="detail-row">
                <div class="detail-label">Estimated Time:</div>
                <div class="detail-value">${task.estimated_minutes} minutes</div>
                </div>
                
                <div class="detail-row">
                <div class="detail-label">Recurring:</div>
                <div class="detail-value">${recurrenceText}</div>
                </div>
                
                <div class="detail-row">
                <div class="detail-label">Created:</div>
                <div class="detail-value">${formattedCreatedDate}</div>
                </div>
                
                ${task.notes ? `
                <div class="detail-section">
                    <h4>Notes</h4>
                    <p>${task.notes}</p>
                </div>
                ` : ''}
            </div>
            </div>
            
            <div class="dialog-actions">
            ${task.status !== 'completed' ? `
                <button type="button" id="complete-task" class="secondary-button">Mark Complete</button>
            ` : ''}
            <button type="button" id="edit-task" class="secondary-button">Edit Task</button>
            <button type="button" id="delete-task" class="danger-button">Delete</button>
            </div>
        </div>
        `;
    }
      
      // Initialize controls for task details
    initializeDetailsControls(task) {
        // Close button
        document.getElementById('close-details')?.addEventListener('click', () => {
        this.closeForm();
        });
        
        // Progress slider for incremental tasks
        const progressSlider = document.getElementById('progress-slider');
        if (progressSlider) {
        progressSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('progress-value').textContent = value + '%';
        });
        
        progressSlider.addEventListener('change', async (e) => {
            const newValue = parseInt(e.target.value, 10);
            await this.app.tasks.updateTask(task.id, {
            progress_percentage: newValue
            });
        });
        }
        
        // Progress adjustment buttons
        document.querySelectorAll('.progress-adjust-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const adjustment = parseInt(btn.dataset.adjust, 10);
            const newValue = Math.min(100, Math.max(0, task.progress_percentage + adjustment));
            
            if (progressSlider) {
            progressSlider.value = newValue;
            document.getElementById('progress-value').textContent = newValue + '%';
            }
            
            await this.app.tasks.updateTask(task.id, {
            progress_percentage: newValue
            });
        });
        });
        
        // Complete button
        const completeBtn = document.getElementById('complete-task');
        if (completeBtn && task.status !== 'completed') {
        completeBtn.addEventListener('click', async () => {
            try {
            await this.app.tasks.updateTask(task.id, {
                status: 'completed',
                progress_percentage: 100
            });
            
            // Close dialog
            this.closeForm();
            
            // Refresh task list
            if (window.TasksView && this.app.ui.views.tasks) {
                this.app.ui.views.tasks.refreshTaskList();
            }
            
            // Play sound
            if (this.app.sound && this.app.preferences.soundEnabled) {
                this.app.sound.play('taskComplete');
            }
            } catch (error) {
            console.error('Error completing task:', error);
            // TODO: Implement non-blocking user notification (e.g., this.app.ui.showNotification('Error message', 'error'))
            // alert('Error completing task: ' + error.message);
            }
        });
        }
        
        // Edit button
        document.getElementById('edit-task')?.addEventListener('click', () => {
        this.closeForm();
        this.showEditForm(task.id);
        });
        
        // Delete button
        document.getElementById('delete-task')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this task? This cannot be undone.')) {
            this.deleteTask(task.id);
        }
        });
    }
      
      // Delete a task
      async deleteTask(taskId) {
        try {
          await this.app.tasks.deleteTask(taskId);
          
          // Close dialog
          this.closeForm();
          
          // Refresh task list
          if (window.TasksView && this.app.ui.views.tasks) {
            this.app.ui.views.tasks.refreshTaskList();
          }
          
          // Play sound
          if (this.app.sound && this.app.preferences.soundEnabled) {
            this.app.sound.play('click');
          }
        } catch (error) {
          console.error('Error deleting task:', error);
          // TODO: Implement non-blocking user notification (e.g., this.app.ui.showNotification('Error message', 'error'))
          // alert('Error deleting task: ' + error.message);
        }
      }
      
    // Generate task form HTML
    generateFormHtml(taskData) {
      return `
        <div class="dialog task-form-dialog">
          <div class="dialog-header">
            <h2>${this.isEdit ? 'Edit Task' : 'Add Task'}</h2>
            <button type="button" class="close-button" id="close-form">×</button>
          </div>
          
          <form id="task-form" class="dialog-content">
            <div class="form-group">
              <label for="task-title">Title *</label>
              <input type="text" id="task-title" class="form-control" value="${taskData.title}" required>
            </div>
            
            <div class="form-group">
              <label for="task-description">Description</label>
              <textarea id="task-description" class="form-control" rows="3">${taskData.description || ''}</textarea>
            </div>
            
            <div class="form-row">
              <div class="form-group col-6">
                <label for="task-category">Category</label>
                <select id="task-category" class="form-control">
                  <option value="">-- Select Category --</option>
                  <!-- Categories will be loaded dynamically -->
                </select>
              </div>
              
              <div class="form-group col-6">
                <label for="task-subcategory">Subcategory</label>
                <select id="task-subcategory" class="form-control" disabled>
                  <option value="">-- Select Subcategory --</option>
                  <!-- Subcategories will be loaded dynamically -->
                </select>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group col-6">
                <label for="task-priority">Priority</label>
                <select id="task-priority" class="form-control">
                  <option value="1" ${taskData.priority === 1 ? 'selected' : ''}>P1 - Highest</option>
                  <option value="2" ${taskData.priority === 2 ? 'selected' : ''}>P2 - High</option>
                  <option value="3" ${taskData.priority === 3 ? 'selected' : ''}>P3 - Medium</option>
                  <option value="4" ${taskData.priority === 4 ? 'selected' : ''}>P4 - Low</option>
                  <option value="5" ${taskData.priority === 5 ? 'selected' : ''}>P5 - Lowest</option>
                </select>
              </div>
              
              <div class="form-group col-6">
                <label for="task-difficulty">Difficulty</label>
                <select id="task-difficulty" class="form-control">
                  <option value="1" ${taskData.difficulty === 1 ? 'selected' : ''}>D1 - Very Easy</option>
                  <option value="2" ${taskData.difficulty === 2 ? 'selected' : ''}>D2 - Easy</option>
                  <option value="3" ${taskData.difficulty === 3 ? 'selected' : ''}>D3 - Medium</option>
                  <option value="4" ${taskData.difficulty === 4 ? 'selected' : ''}>D4 - Hard</option>
                  <option value="5" ${taskData.difficulty === 5 ? 'selected' : ''}>D5 - Very Hard</option>
                </select>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group col-6">
                <label for="task-due-date">Due Date</label>
                <input type="date" id="task-due-date" class="form-control" value="${taskData.due_date || ''}">
              </div>
              
              <div class="form-group col-6">
                <label for="task-due-time">Due Time</label>
                <input type="time" id="task-due-time" class="form-control" value="${taskData.due_time || ''}">
              </div>
            </div>
            
            <div class="form-group">
              <label for="task-estimated-time">Estimated Time (minutes)</label>
              <input type="number" id="task-estimated-time" class="form-control" min="1" step="1" value="${taskData.estimated_minutes || 30}">
            </div>
            
            <div class="form-group">
              <label for="task-progress-type">Progress Tracking</label>
              <select id="task-progress-type" class="form-control">
                <option value="boolean" ${taskData.progress_type === 'boolean' ? 'selected' : ''}>Simple (Done/Not Done)</option>
                <option value="incremental" ${taskData.progress_type === 'incremental' ? 'selected' : ''}>Percentage (Partial Progress)</option>
              </select>
            </div>
            
            <div class="form-group form-check">
              <input type="checkbox" id="task-recurring" class="form-check-input" ${taskData.is_recurring ? 'checked' : ''}>
              <label for="task-recurring" class="form-check-label">Recurring Task</label>
            </div>
            
            <div id="recurrence-options" class="form-group" style="display: ${taskData.is_recurring ? 'block' : 'none'}">
              <label>Recurrence Pattern</label>
              <div class="form-check">
                <input type="radio" id="recurrence-daily" name="recurrence-type" class="form-check-input" value="daily" ${taskData.recurrence_pattern?.type === 'daily' ? 'checked' : ''}>
                <label for="recurrence-daily" class="form-check-label">Daily</label>
              </div>
              
              <div class="form-check">
                <input type="radio" id="recurrence-weekly" name="recurrence-type" class="form-check-input" value="weekly" ${taskData.recurrence_pattern?.type === 'weekly' ? 'checked' : ''}>
                <label for="recurrence-weekly" class="form-check-label">Weekly</label>
              </div>
              
              <div class="form-check">
                <input type="radio" id="recurrence-monthly" name="recurrence-type" class="form-check-input" value="monthly" ${taskData.recurrence_pattern?.type === 'monthly' ? 'checked' : ''}>
                <label for="recurrence-monthly" class="form-check-label">Monthly</label>
              </div>
              
              <div class="form-group mt-2">
                <label for="recurrence-interval">Repeat every</label>
                <div class="input-group">
                  <input type="number" id="recurrence-interval" class="form-control" min="1" value="${taskData.recurrence_pattern?.interval || 1}">
                  <div class="input-group-append">
                    <span class="input-group-text" id="interval-label">day(s)</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label for="task-notes">Notes</label>
              <textarea id="task-notes" class="form-control" rows="2">${taskData.notes || ''}</textarea>
            </div>
            
            <div class="dialog-actions">
              <button type="button" id="cancel-task" class="secondary-button">Cancel</button>
              <button type="submit" class="primary-button">${this.isEdit ? 'Update Task' : 'Add Task'}</button>
            </div>
          </form>
        </div>
      `;
    }
    
    // Initialize form controls and event listeners
    initializeFormControls(taskData) {
      // Load categories
      this.loadCategories(taskData.category_id, taskData.subcategory_id);
      
      // Category change event
      const categorySelect = document.getElementById('task-category');
      if (categorySelect) {
        categorySelect.addEventListener('change', () => {
          this.loadSubcategories(categorySelect.value);
        });
      }
      
      // Recurring task controls
      const recurringCheckbox = document.getElementById('task-recurring');
      const recurrenceOptions = document.getElementById('recurrence-options');
      
      if (recurringCheckbox && recurrenceOptions) {
        recurringCheckbox.addEventListener('change', () => {
          recurrenceOptions.style.display = recurringCheckbox.checked ? 'block' : 'none';
        });
      }
      
      // Recurrence type change
      document.querySelectorAll('input[name="recurrence-type"]').forEach(radio => {
        radio.addEventListener('change', () => {
          const intervalLabel = document.getElementById('interval-label');
          if (intervalLabel) {
            switch (radio.value) {
              case 'daily':
                intervalLabel.textContent = 'day(s)';
                break;
              case 'weekly':
                intervalLabel.textContent = 'week(s)';
                break;
              case 'monthly':
                intervalLabel.textContent = 'month(s)';
                break;
            }
          }
        });
      });
      
      // Form submission
      const form = document.getElementById('task-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.submitForm();
        });
      }
      
      // Cancel and close buttons
      document.getElementById('cancel-task')?.addEventListener('click', () => {
        this.closeForm();
      });
      
      document.getElementById('close-form')?.addEventListener('click', () => {
        this.closeForm();
      });
    }
    
    // Load categories into select dropdown
    async loadCategories(selectedCategoryId = '', selectedSubcategoryId = '') {
      const categorySelect = document.getElementById('task-category');
      if (!categorySelect) return;
      
      try {
        const categories = await this.app.categories.getCategories();
        
        // Clear existing options (except the first one)
        while (categorySelect.options.length > 1) {
          categorySelect.remove(1);
        }
        
        // Add category options
        categories.forEach(category => {
          const option = document.createElement('option');
          option.value = category.id;
          option.textContent = category.name;
          categorySelect.appendChild(option);
        });
        
        // Set selected category if provided
        if (selectedCategoryId) {
          categorySelect.value = selectedCategoryId;
          
          // Load subcategories for this category
          await this.loadSubcategories(selectedCategoryId, selectedSubcategoryId);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    }
    
    // Load subcategories for selected category
    async loadSubcategories(categoryId, selectedSubcategoryId = '') {
      const subcategorySelect = document.getElementById('task-subcategory');
      if (!subcategorySelect) return;
      
      try {
        // Clear existing options
        while (subcategorySelect.options.length > 1) {
          subcategorySelect.remove(1);
        }
        
        if (!categoryId) {
          subcategorySelect.disabled = true;
          return;
        }
        
        const subcategories = await this.app.categories.getSubcategories(categoryId);
        
        if (subcategories && subcategories.length > 0) {
          subcategorySelect.disabled = false;
          
          // Add subcategory options
          subcategories.forEach(subcategory => {
            const option = document.createElement('option');
            option.value = subcategory.id;
            option.textContent = subcategory.name;
            subcategorySelect.appendChild(option);
          });
          
          // Set selected subcategory if provided
          if (selectedSubcategoryId) {
            subcategorySelect.value = selectedSubcategoryId;
          }
        } else {
          subcategorySelect.disabled = true;
        }
      } catch (error) {
        console.error('Error loading subcategories:', error);
        subcategorySelect.disabled = true;
      }
    }
    
    // Submit the form to create or update a task
    async submitForm() {
      try {
        // Get all form values
        const formData = {
          title: document.getElementById('task-title').value,
          description: document.getElementById('task-description').value,
          category_id: document.getElementById('task-category').value,
          subcategory_id: document.getElementById('task-subcategory').value,
          priority: parseInt(document.getElementById('task-priority').value, 10),
          difficulty: parseInt(document.getElementById('task-difficulty').value, 10),
          estimated_minutes: parseInt(document.getElementById('task-estimated-time').value, 10),
          due_date: document.getElementById('task-due-date').value || null,
          due_time: document.getElementById('task-due-time').value || null,
          progress_type: document.getElementById('task-progress-type').value,
          is_recurring: document.getElementById('task-recurring').checked,
          notes: document.getElementById('task-notes').value
        };
        
        // Validate required fields
        if (!formData.title.trim()) {
          // TODO: Implement non-blocking user notification (e.g., this.app.ui.showNotification('Error message', 'error'))
          // alert('Please enter a task title');
          return;
        }
        
        // Handle recurrence pattern
        if (formData.is_recurring) {
          const recurrenceType = document.querySelector('input[name="recurrence-type"]:checked')?.value || 'daily';
          const interval = parseInt(document.getElementById('recurrence-interval').value, 10) || 1;
          
          formData.recurrence_pattern = {
            type: recurrenceType,
            interval: interval
          };
        } else {
          formData.recurrence_pattern = null;
        }
        
        // Create or update task
        let task;
        
        if (this.isEdit && this.currentTask) {
          task = await this.app.tasks.updateTask(this.currentTask.id, formData);
        } else {
          task = await this.app.tasks.createTask(formData);
        }
        
        // Close the form
        this.closeForm();
        
        // Refresh the task list
        if (window.TasksView && this.app.ui.views.tasks) {
          this.app.ui.views.tasks.refreshTaskList();
        }
        
        // Play sound
        if (this.app.sound && this.app.preferences.soundEnabled) {
          this.app.sound.play('click');
        }

        if (this.isEdit) {
          console.log(`TaskForm: Task ${task.id} updated. UI should ideally highlight this task.`);
        } else {
          console.log(`TaskForm: Task ${task.id} created. UI should ideally highlight this new task.`);
        }
        
        return task;
      } catch (error) {
        console.error('Error saving task:', error);
        // TODO: Implement non-blocking user notification (e.g., this.app.ui.showNotification('Error message', 'error'))
        // alert('Error saving task: ' + error.message);
      }
    }
    
    // Close the form
    closeForm() {
      const overlay = document.querySelector('.overlay');
      if (overlay) {
        overlay.remove();
      }
    }
  }
  
  // Export the class if in Node.js environment
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TaskForm };
  } else {
    // Browser context
    window.TaskForm = TaskForm;
  }

