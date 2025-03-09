// views/achievements.js - Achievements view

class AchievementsView {
    constructor(app) {
      this.app = app;
      this.achievements = [];
      this.userProfile = null;
    }
    
    async render() {
      // Load achievements and user profile
      await this.loadData();
      
      return `
        <div class="achievements-view">
          <div class="view-header">
            <h2>Achievements</h2>
            <div class="achievement-stats">
              <span id="unlocked-count">${this.getUnlockedCount()}</span>/<span id="total-count">${this.achievements.length}</span> unlocked
            </div>
          </div>
          
          <div class="level-progress-card">
            <div class="level-info">
              <div class="level-container">
                <div class="current-level">Level <span id="user-level-display">${this.userProfile?.level || 1}</span></div>
                <div class="level-title" id="level-title">${this.getLevelTitle()}</div>
              </div>
              
              <div class="points-info">
                <div class="total-points">${this.userProfile?.total_points || 0} total points</div>
                <div class="next-level">Next level: ${this.getNextLevelXP()} XP</div>
              </div>
            </div>
            
            <div class="exp-bar-container">
              <div class="exp-bar" style="width: ${this.getLevelProgress()}%"></div>
              <div class="exp-text">
                <span id="current-exp">${this.getCurrentLevelExp()}</span>/<span id="next-level-exp">${this.getNextLevelXP()}</span> XP
              </div>
            </div>
          </div>
          
          <div class="achievement-categories">
            <div class="category-tab active" data-category="all">All</div>
            <div class="category-tab" data-category="unlocked">Unlocked</div>
            <div class="category-tab" data-category="locked">In Progress</div>
          </div>
          
          <div class="achievements-container">
            ${this.renderAchievements('all')}
          </div>
        </div>
      `;
    }
    
    initializeEventListeners() {
      // Category tabs
      document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          // Update active tab
          document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
          e.target.classList.add('active');
          
          // Get category and update achievements display
          const category = e.target.dataset.category;
          this.updateAchievementsDisplay(category);
        });
      });
      
      // Achievement cards (show details)
      document.querySelectorAll('.achievement-card').forEach(card => {
        card.addEventListener('click', (e) => {
          const achievementId = card.dataset.achievementId;
          this.showAchievementDetails(achievementId);
        });
      });
    }
    
    async loadData() {
      try {
        // Get achievements from gamification system
        if (this.app.gamification) {
          this.achievements = this.app.gamification.getAchievementsWithProgress();
          this.userProfile = this.app.gamification.userProfile;
        }
        
        return true;
      } catch (error) {
        console.error('Error loading achievements data:', error);
        this.achievements = [];
        this.userProfile = null;
        return false;
      }
    }
    
    renderAchievements(category) {
      if (!this.achievements || this.achievements.length === 0) {
        return `
          <div class="empty-state">
            <p>No achievements available. Complete tasks to unlock achievements!</p>
          </div>
        `;
      }
      
      // Filter achievements by category
      let filteredAchievements = [...this.achievements];
      
      if (category === 'unlocked') {
        filteredAchievements = filteredAchievements.filter(a => a.unlocked);
      } else if (category === 'locked') {
        filteredAchievements = filteredAchievements.filter(a => !a.unlocked);
      }
      
      if (filteredAchievements.length === 0) {
        return `
          <div class="empty-state">
            <p>${category === 'unlocked' ? 'No achievements unlocked yet. Keep working!' : 'No achievements available in this category.'}</p>
          </div>
        `;
      }
      
      return filteredAchievements.map(achievement => this.renderAchievementCard(achievement)).join('');
    }
    
    renderAchievementCard(achievement) {
      // Determine rarity color
      const rarityColors = {
        common: '#78909C',
        uncommon: '#26A69A',
        rare: '#5C6BC0',
        epic: '#AB47BC',
        legendary: '#FFB300'
      };
      
      const rarityColor = rarityColors[achievement.rarity] || rarityColors.common;
      
      const progressText = achievement.unlocked ? 
        'Completed' : 
        `${achievement.progress}% complete`;
      
      return `
        <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}" data-achievement-id="${achievement.id}">
          <div class="achievement-icon" style="background-color: ${rarityColor}">
            ${this.getAchievementIcon(achievement.icon)}
          </div>
          
          <div class="achievement-content">
            <div class="achievement-title">${achievement.title}</div>
            <div class="achievement-description">${achievement.description}</div>
            
            <div class="achievement-progress">
              <div class="progress-bar">
                <div class="progress-bar-fill" style="width: ${achievement.progress}%"></div>
              </div>
              <div class="progress-text">${progressText}</div>
            </div>
          </div>
          
          <div class="achievement-reward" title="XP reward">
            +${achievement.reward.experience_points} XP
          </div>
        </div>
      `;
    }
    
    updateAchievementsDisplay(category) {
      const container = document.querySelector('.achievements-container');
      if (container) {
        container.innerHTML = this.renderAchievements(category);
        
        // Re-attach event listeners
        document.querySelectorAll('.achievement-card').forEach(card => {
          card.addEventListener('click', (e) => {
            const achievementId = card.dataset.achievementId;
            this.showAchievementDetails(achievementId);
          });
        });
      }
    }
    
    showAchievementDetails(achievementId) {
      const achievement = this.achievements.find(a => a.id === achievementId);
      if (!achievement) return;
      
      // Create dialog overlay
      const overlay = document.createElement('div');
      overlay.className = 'overlay';
      
      // Determine rarity color
      const rarityColors = {
        common: '#78909C',
        uncommon: '#26A69A',
        rare: '#5C6BC0',
        epic: '#AB47BC',
        legendary: '#FFB300'
      };
      
      const rarityColor = rarityColors[achievement.rarity] || rarityColors.common;
      
      // Create details dialog
      overlay.innerHTML = `
        <div class="dialog achievement-details-dialog">
          <div class="dialog-header">
            <h2>Achievement Details</h2>
            <button type="button" class="close-button" id="close-achievement-details">×</button>
          </div>
          
          <div class="dialog-content">
            <div class="achievement-details-header">
              <div class="achievement-icon large" style="background-color: ${rarityColor}">
                ${this.getAchievementIcon(achievement.icon)}
              </div>
              
              <div class="achievement-info">
                <h3>${achievement.title}</h3>
                <div class="achievement-rarity">${achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}</div>
              </div>
            </div>
            
            <p class="achievement-details-description">${achievement.description}</p>
            
            <div class="achievement-progress-details">
              <div class="progress-label">Progress: ${achievement.progress}%</div>
              <div class="progress-bar-large">
                <div class="progress-bar-fill" style="width: ${achievement.progress}%"></div>
              </div>
            </div>
            
            <div class="achievement-rewards">
              <h4>Rewards</h4>
              <div class="reward-item">
                <div class="reward-icon">✨</div>
                <div class="reward-details">
                  <div class="reward-name">Experience Points</div>
                  <div class="reward-value">+${achievement.reward.experience_points} XP</div>
                </div>
              </div>
            </div>
            
            ${achievement.unlocked ? `
              <div class="achievement-unlock-info">
                <p>Unlocked on ${this.formatUnlockDate(achievement.unlocked_at)}</p>
              </div>
            ` : ''}
          </div>
        </div>
      `;
      
      // Add to document
      document.body.appendChild(overlay);
      
      // Add close button listener
      document.getElementById('close-achievement-details')?.addEventListener('click', () => {
        overlay.remove();
      });
    }
    
    getAchievementIcon(iconName) {
      const icons = {
        check: '✓',
        streak: '🔥',
        priority: '⚡',
        difficulty: '🏆',
        time: '⏱️',
        category: '📂'
      };
      
      return icons[iconName] || '🎯';
    }
    
    formatUnlockDate(dateString) {
      if (!dateString) return 'Unknown date';
      
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    
    getUnlockedCount() {
      if (!this.achievements) return 0;
      return this.achievements.filter(a => a.unlocked).length;
    }
    
    getLevelTitle() {
      if (!this.app.gamification) return 'Novice';
      return this.app.gamification.getCurrentTitle();
    }
    
    getLevelProgress() {
      if (!this.app.gamification) return 0;
      return this.app.gamification.getLevelProgress();
    }
    
    getCurrentLevelExp() {
      if (!this.userProfile) return 0;
      
      const currentLevel = this.userProfile.level;
      const totalExp = this.userProfile.total_experience;
      let prevLevelExp;
      
      if (currentLevel <= 1) {
        return totalExp;
      } else if (currentLevel <= 10) {
        prevLevelExp = 100 * Math.pow(currentLevel - 1, 2);
      } else if (currentLevel <= 25) {
        prevLevelExp = 150 * Math.pow(currentLevel - 1, 2);
      } else if (currentLevel <= 50) {
        prevLevelExp = 200 * Math.pow(currentLevel - 1, 2);
      } else {
        prevLevelExp = 250 * Math.pow(currentLevel - 1, 2);
      }
      
      return totalExp - prevLevelExp;
    }
    
    getNextLevelXP() {
      if (!this.app.gamification || !this.userProfile) return 100;
      
      const currentLevel = this.userProfile.level;
      let currentLevelExp;
      
      if (currentLevel < 10) {
        currentLevelExp = 100 * Math.pow(currentLevel, 2);
      } else if (currentLevel < 25) {
        currentLevelExp = 150 * Math.pow(currentLevel, 2);
      } else if (currentLevel < 50) {
        currentLevelExp = 200 * Math.pow(currentLevel, 2);
      } else {
        currentLevelExp = 250 * Math.pow(currentLevel, 2);
      }
      
      let nextLevelExp;
      
      if (currentLevel + 1 <= 10) {
        nextLevelExp = 100 * Math.pow(currentLevel + 1, 2);
      } else if (currentLevel + 1 <= 25) {
        nextLevelExp = 150 * Math.pow(currentLevel + 1, 2);
      } else if (currentLevel + 1 <= 50) {
        nextLevelExp = 200 * Math.pow(currentLevel + 1, 2);
      } else {
        nextLevelExp = 250 * Math.pow(currentLevel + 1, 2);
      }
      
      return nextLevelExp - currentLevelExp;
    }
  }
  
  // Export the class if in Node.js environment
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AchievementsView };
  } else {
    // Browser context
    window.AchievementsView = AchievementsView;
  }