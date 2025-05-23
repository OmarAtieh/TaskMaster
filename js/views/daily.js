// views/daily.js - Daily missions view

class DailyView {
    constructor(app) {
      this.app = app;
      this.dailyMissions = null;
    }
    
    async render() {
      // Load daily missions
      await this.loadDailyMissions();
      
      return `
        <div class="daily-view">
          <div class="view-header">
            <h2>Daily Missions</h2>
            <div class="streak-badge">
              <span class="streak-count">${this.getCurrentStreak()}</span> day streak
            </div>
          </div>
          
          <div class="daily-stats">
            <div class="stat-card">
              <div class="stat-title">Points Earned</div>
              <div class="stat-value">${this.app.dailyMissions.getEarnedPoints()}</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-title">Missions Completed</div>
              <div class="stat-value">${this.getCompletedCount()}/${this.dailyMissions?.missions.length || 0}</div>
            </div>
          </div>
          
          <div class="daily-missions">
            ${this.renderMissions()}
          </div>
          
          <div class="daily-bonus">
            <h3>Daily Bonus</h3>
            <p>Complete all missions to earn a bonus of ${this.dailyMissions?.bonus || 0} points!</p>
            <div class="progress-bar-large">
              <div class="progress-bar-fill" style="width: ${this.getCompletionPercentage()}%"></div>
              <span class="progress-text">${this.getCompletionPercentage()}%</span>
            </div>
          </div>
          
          <div class="daily-actions">
            <button id="regenerate-missions" class="secondary-button">Regenerate Missions</button>
          </div>
        </div>
      `;
    }
    
    initializeEventListeners() {
      // Mission toggle buttons
      document.querySelectorAll('.mission-complete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const taskId = e.currentTarget.dataset.taskId;
          const isCompleted = e.currentTarget.classList.contains('completed');
          
          await this.toggleMissionCompletion(taskId, !isCompleted);
        });
      });
      
      // Mission cards (open task details)
      document.querySelectorAll('.mission-card').forEach(card => {
        card.addEventListener('click', (e) => {
          const taskId = card.dataset.taskId;
          this.app.taskForm.showTaskDetails(taskId);
        });
      });
      
      // Regenerate button
      document.getElementById('regenerate-missions')?.addEventListener('click', async () => {
        if (confirm('Are you sure you want to regenerate your daily missions? This will reset your current progress.')) {
          await this.regenerateMissions();
        }
      });
    }
    
    async loadDailyMissions() {
      try {
        this.dailyMissions = await this.app.dailyMissions.checkAndGenerateDailyMissions();

        if (this.dailyMissions && this.dailyMissions.missions) {
          let allMissionsNowCompleted = true;
          for (const mission of this.dailyMissions.missions) {
            try {
              const task = await this.app.tasks.getTask(mission.id);
              if (task) {
                mission.completed = (task.status === 'completed');
              } else {
                // Task associated with mission not found, treat as not completed or handle as error
                mission.completed = false; 
                console.warn(`Task ID ${mission.id} for daily mission not found.`);
              }
            } catch (taskError) {
              console.error(`Error fetching task ${mission.id} for daily mission sync:`, taskError);
              mission.completed = false; // Assume not completed on error
            }
            if (!mission.completed) {
              allMissionsNowCompleted = false;
            }
          }
          this.dailyMissions.allCompleted = allMissionsNowCompleted;
          
          // Optional: Persist these refreshed statuses.
          // For now, this is a view-level refresh. If persistence is needed:
          // await this.app.dailyMissions.storage.set('daily_missions', this.dailyMissions);
          // Or a dedicated method in DailyMissionManager to update statuses without awarding points again.
          console.log('Daily missions status synced with current task statuses.');
        }
        return this.dailyMissions;
      } catch (error) {
        console.error('Error loading daily missions:', error);
        this.dailyMissions = null;
        return null;
      }
    }
    
    renderMissions() {
      if (!this.dailyMissions || !this.dailyMissions.missions || this.dailyMissions.missions.length === 0) {
        return `
          <div class="empty-state">
            <p>No missions available. Click "Regenerate Missions" to create new ones.</p>
          </div>
        `;
      }
      
      return this.dailyMissions.missions.map(mission => this.renderMissionCard(mission)).join('');
    }
    
    renderMissionCard(mission) {
      // Get category name
      let categoryName = 'Uncategorized';
      if (mission.category_id) {
        const category = this.app.categories.getCategory(mission.category_id);
        if (category) {
          categoryName = category.name;
        }
      }
      
      return `
        <div class="mission-card ${mission.completed ? 'mission-completed' : ''}" data-task-id="${mission.id}">
          <div class="priority-indicator priority-${mission.priority}"></div>
          
          <div class="mission-content">
            <div class="mission-title">${mission.title}</div>
            <div class="mission-details">${categoryName} • ${mission.points} points</div>
          </div>
          
          <div class="mission-actions">
            <button class="mission-complete-btn ${mission.completed ? 'completed' : ''}" 
                    data-task-id="${mission.id}" 
                    title="${mission.completed ? 'Mark as incomplete' : 'Mark as completed'}">
              ${mission.completed ? '✓' : ''}
            </button>
          </div>
        </div>
      `;
    }
    
    async toggleMissionCompletion(taskId, completed) {
      try {
        // Update the mission status
        await this.app.dailyMissions.updateMissionStatus(taskId, completed);
        
        // Also update the actual task
        if (completed) {
          await this.app.tasks.updateTask(taskId, {
            status: 'completed',
            progress_percentage: 100
          });
          
          // Play completion sound
          if (this.app.sound && this.app.preferences.soundEnabled) {
            this.app.sound.play('taskComplete');
          }
        } else {
          await this.app.tasks.updateTask(taskId, {
            status: 'not_started',
            progress_percentage: 0
          });
        }
        
        // Refresh view
        const dailyView = document.querySelector('.daily-view');
        if (dailyView) {
          dailyView.innerHTML = await this.render();
          this.initializeEventListeners();
        }
        
        // Check if all missions are now completed
        if (this.getCompletedCount() === this.dailyMissions.missions.length && completed) {
          // Play achievement sound
          if (this.app.sound && this.app.preferences.soundEnabled) {
            this.app.sound.play('achievement');
          }
          
          // Show congratulations message
          // TODO: Implement non-blocking user notification for all daily missions completed (e.g., this.app.ui.showNotification('All daily missions complete! Bonus awarded!', 'success'))
          // alert('Congratulations! You completed all daily missions and earned a bonus of ' + 
          //       this.dailyMissions.bonus + ' points!');
        }
      } catch (error) {
        console.error('Error toggling mission completion:', error);
        // TODO: Implement non-blocking user notification (e.g., this.app.ui.showNotification('Error message', 'error'))
        // alert('Error updating mission: ' + error.message);
      }
    }
    
    async regenerateMissions() {
      try {
        await this.app.dailyMissions.generateDailyMissions();
        
        // Reload missions and refresh view
        await this.loadDailyMissions();
        
        const dailyView = document.querySelector('.daily-view');
        if (dailyView) {
          dailyView.innerHTML = await this.render();
          this.initializeEventListeners();
        }
        
        // Play sound
        if (this.app.sound && this.app.preferences.soundEnabled) {
          this.app.sound.play('click');
        }
      } catch (error) {
        console.error('Error regenerating missions:', error);
        // TODO: Implement non-blocking user notification (e.g., this.app.ui.showNotification('Error message', 'error'))
        // alert('Error regenerating missions: ' + error.message);
      }
    }
    
    getCurrentStreak() {
      return this.app.gamification?.userProfile?.current_streak_days || 0;
    }
    
    getCompletedCount() {
      if (!this.dailyMissions || !this.dailyMissions.missions) {
        return 0;
      }
      
      return this.dailyMissions.missions.filter(mission => mission.completed).length;
    }
    
    getCompletionPercentage() {
      if (!this.dailyMissions || !this.dailyMissions.missions || this.dailyMissions.missions.length === 0) {
        return 0;
      }
      
      const completed = this.getCompletedCount();
      const total = this.dailyMissions.missions.length;
      
      return Math.round((completed / total) * 100);
    }
  }
  
  // Export the class if in Node.js environment
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DailyView };
  } else {
    // Browser context
    window.DailyView = DailyView;
  }