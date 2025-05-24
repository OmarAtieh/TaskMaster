// views/achievements.js - Achievements view

class AchievementsView {
    constructor(app) {
      this.app = app;
      this.achievements = [];
      this.userProfile = null;
    }
    
    async render() {
      // Load achievements and user profile
      const loadSuccess = await this.loadData(); // loadData should return true on success, false on error

      if (!loadSuccess && (!this.achievements || this.achievements.length === 0) && !this.userProfile) {
        return `
        <div class="achievements-view">
          <p class="error-message">Could not load achievement data. Please try again later.</p>
        </div>
        `;
      }
      
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
                <div class="next-level">Next level: ${this.app.gamification ? this.app.gamification.getNextLevelXP() : 'N/A'} XP</div>
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
        if (this.app && this.app.notificationUI) {
            this.app.notificationUI.showNotification('Error loading achievements data: ' + error.message, 'error', 5000);
        }
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

    // Helper function to get the total XP required to reach a specific level
    _getXPForLevelThreshold(level) {
      if (level <= 1) return 0;
      // This logic should mirror GamificationSystem.calculateLevel's inverse or GamificationSystem.getNextLevelXP's base
      // It's the XP needed to *reach* this level.
      // Example: Level 2 needs 100XP total. Level 1 needs 0XP total.
      // The formula in GamificationSystem's calculateLevel is:
      // Lvl 1-10: XP = 100 * Lvl^2 (This seems to be threshold TO REACH Lvl+1, or current total XP for current level)
      // GamificationSystem.getNextLevelXP() actually calculates threshold for (Lvl+1)
      // Let's use the logic from GamificationSystem.getNextLevelXP() for consistency for specific level thresholds.
      // This is the XP needed to *reach* 'level'.
      if (level <= 10) {
        return 100 * Math.pow(level, 2);
      } else if (level <= 25) {
        // XP to reach level 11 is 150 * 11^2, but level 10 was 100*10^2. The curve definition is a bit tricky.
        // Let's assume the GamificationSystem.getNextLevelXP() gives the threshold for level L+1.
        // So, XP for current level L's threshold is what GamificationSystem.getNextLevelXP() would give for L-1.
        // For level L, the XP threshold is based on (L-1) using the getNextLevelXP logic for L.
        // This means, if we are at level L, the XP accumulated to *start* this level L is calculated based on L.
        // This is confusing. Let's use GamificationSystem's definition:
        // getLevelProgress currentLevelXP is calculated using L (currentLevel).
        // Let's define it as: XP needed to start 'level'.
        // Level 1 starts at 0 XP.
        // Level 2 starts at 100 * 1^2 = 100 XP (from GamificationSystem.userProfile.level = 1, getNextLevelXP() = 100 * 2^2 = 400, currentLevelXP = 100 * 1^2 = 100)
        // No, this is simpler: use the formula for XP required FOR that level.
        // XP to START level L:
        if (level <= 1) return 0; // XP to start level 1 is 0
        // XP to START level L (L > 1) is the threshold of level L.
        // GamificationSystem.getNextLevelXP() calculates XP for (currentLevel + 1).
        // So, XP for currentLevel is GamificationSystem.calculateLevel's inverse.
        // Let's adopt the formulas from GamificationSystem.calculateLevel (inverse logic)
        // For level L, the total XP accumulated to reach this level is:
        // For level L, the threshold is based on (L-1) in the GamificationSystem.getNextLevelXP logic for L.
        // The XP threshold for Level L is:
        // if L-1 < 10 (i.e. L < 11): 100 * (L-1)^2
        // if L-1 < 25 (i.e. L < 26): 150 * (L-1)^2
        // if L-1 < 50 (i.e. L < 51): 200 * (L-1)^2
        // else: 250 * (L-1)^2

        // This is the XP needed to START level `level`.
        const effectiveLevelForCalc = level -1; // XP needed to complete level `effectiveLevelForCalc`
        if (effectiveLevelForCalc === 0) return 0; // Start of level 1

        if (effectiveLevelForCalc < 10) {
            return 100 * Math.pow(effectiveLevelForCalc, 2);
        } else if (effectiveLevelForCalc < 25) {
            // This needs to account for the previous tiers' total
            // XP for level 10: 100 * 9^2 = 8100 (to start L10)
            // XP for level 10 by old formula: 100 * 10^2 = 10000 (to start L11)
            // The formulas in gamification system define the total XP for THAT level.
            // So getNextLevelXP() in gamification system is actually XP for (currentLevel+1)
            // And currentLevelXP for getLevelProgress is XP for currentLevel.
            // So _getXPForLevelThreshold(level) should be total XP to *be* at 'level'.
            if (level <= 10) return 100 * Math.pow(level, 2); // Total XP to be at level 'level'
            if (level <= 25) return 150 * Math.pow(level, 2);
            if (level <= 50) return 200 * Math.pow(level, 2);
            return 250 * Math.pow(level, 2);
        }
        // This seems to be the definition from `GamificationSystem.getNextLevelXP`'s `currentLevelExp`
        // and `AchievementsView.getCurrentLevelExp`'s `prevLevelExp`.
        // It's the XP required to *start* the given level.
        let prevLevel = level -1;
        if (prevLevel <= 0) return 0;

        if (prevLevel < 10) return 100 * Math.pow(prevLevel, 2);
        if (prevLevel < 25) return 150 * Math.pow(prevLevel, 2);
        if (prevLevel < 50) return 200 * Math.pow(prevLevel, 2);
        return 250 * Math.pow(prevLevel, 2);
    }
    
    getNextLevelXP() { // This method in AchievementsView calculates the SPAN of XP for the current level
      if (!this.app.gamification || !this.userProfile) return 100; // Default span if no data
      
      const currentLevel = this.userProfile.level;
      
      // XP threshold to START currentLevel
      const currentLevelStartXP = this._getXPForLevelThreshold(currentLevel);
      // XP threshold to START nextLevel
      const nextLevelStartXP = this._getXPForLevelThreshold(currentLevel + 1);
      
      const span = nextLevelStartXP - currentLevelStartXP;
      return span > 0 ? span : 100; // Return calculated span, or default if something is off
    }
  }
  
  // Export the class if in Node.js environment
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AchievementsView };
  } else {
    // Browser context
    window.AchievementsView = AchievementsView;
  }