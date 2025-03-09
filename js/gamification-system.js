// gamification-system.js - Points, levels, and achievements

class GamificationSystem {
    constructor(app) {
      this.app = app;
      this.storage = app.storage;
      this.userProfile = null;
      
      // Title themes
      this.titleThemes = {
        fantasy: [
          { level: 1, title: 'Apprentice' },
          { level: 5, title: 'Adventurer' },
          { level: 10, title: 'Knight' },
          { level: 15, title: 'Warrior' },
          { level: 20, title: 'Hero' },
          { level: 30, title: 'Champion' },
          { level: 40, title: 'Legendary Hero' },
          { level: 50, title: 'Mythical Legend' },
          { level: 75, title: 'Realm Defender' },
          { level: 100, title: 'Legendary Dragonslayer' }
        ],
        professional: [
          { level: 1, title: 'Intern' },
          { level: 5, title: 'Assistant' },
          { level: 10, title: 'Associate' },
          { level: 15, title: 'Specialist' },
          { level: 20, title: 'Manager' },
          { level: 30, title: 'Director' },
          { level: 40, title: 'Executive' },
          { level: 50, title: 'Vice President' },
          { level: 75, title: 'President' },
          { level: 100, title: 'Global CEO' }
        ],
        academic: [
          { level: 1, title: 'Student' },
          { level: 5, title: 'Graduate' },
          { level: 10, title: 'Research Assistant' },
          { level: 15, title: 'Lecturer' },
          { level: 20, title: 'Professor' },
          { level: 30, title: 'Department Chair' },
          { level: 40, title: 'Dean' },
          { level: 50, title: 'Distinguished Scholar' },
          { level: 75, title: 'Nobel Laureate' },
          { level: 100, title: 'Legendary Thinker' }
        ],
        athletic: [
          { level: 1, title: 'Rookie' },
          { level: 5, title: 'Amateur' },
          { level: 10, title: 'Competitor' },
          { level: 15, title: 'Athlete' },
          { level: 20, title: 'Champion' },
          { level: 30, title: 'All-Star' },
          { level: 40, title: 'MVP' },
          { level: 50, title: 'Hall of Famer' },
          { level: 75, title: 'Legendary Athlete' },
          { level: 100, title: 'GOAT (Greatest Of All Time)' }
        ],
        spiritual: [
          { level: 1, title: 'Seeker' },
          { level: 5, title: 'Disciple' },
          { level: 10, title: 'Devotee' },
          { level: 15, title: 'Mystic' },
          { level: 20, title: 'Oracle' },
          { level: 30, title: 'Sage' },
          { level: 40, title: 'Visionary' },
          { level: 50, title: 'Enlightened' },
          { level: 75, title: 'Transcendent' },
          { level: 100, title: 'Ascended Master' }
        ]
      };
      
      // Define achievements
      this.achievements = this.defineAchievements();
    }
    
    // Load user profile from storage
    async loadUserProfile() {
      try {
        let profile = await this.storage.get('user_profile');
        
        // If no profile exists, create default
        if (!profile) {
          profile = this.createDefaultProfile();
          await this.storage.set('user_profile', profile);
        }
        
        this.userProfile = profile;
        return profile;
      } catch (error) {
        console.error('Error loading user profile:', error);
        this.userProfile = this.createDefaultProfile();
        return this.userProfile;
      }
    }
    
    // Create default user profile
    createDefaultProfile() {
      return {
        level: 1,
        total_experience: 0,
        total_points: 0,
        tasks_completed: 0,
        tasks_completed_by_priority: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        tasks_completed_by_difficulty: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        current_streak_days: 0,
        longest_streak_days: 0,
        current_week_completions: 0,
        best_week_completions: 0,
        last_task_date: null,
        unlocked_achievements: [],
        achievement_progress: {}
      };
    }
    
    // Save user profile to storage
    async saveUserProfile() {
      try {
        await this.storage.set('user_profile', this.userProfile);
        
        // Update UI if it exists
        if (this.app.ui) {
          this.app.ui.updateUserInfo();
        }
        
        return true;
      } catch (error) {
        console.error('Error saving user profile:', error);
        return false;
      }
    }
    
    // Initialize user profile
    async initializeUserProfile(userName) {
      const profile = this.createDefaultProfile();
      
      // Add any custom initialization here
      profile.user_name = userName || 'User';
      
      this.userProfile = profile;
      await this.saveUserProfile();
      
      return profile;
    }
    
    // Award points for task completion
    async awardTaskPoints(task) {
      if (!this.userProfile) {
        await this.loadUserProfile();
      }
      
      let points = task.points_value || 0;
      
      // Calculate any multipliers
      const multipliers = await this.calculateMultipliers(task);
      points = Math.round(points * multipliers.total);
      
      // Update user profile
      this.userProfile.total_points += points;
      this.userProfile.total_experience += points;
      this.userProfile.tasks_completed += 1;
      
      // Update priority statistics
      const priority = String(task.priority);
      if (!this.userProfile.tasks_completed_by_priority[priority]) {
        this.userProfile.tasks_completed_by_priority[priority] = 0;
      }
      this.userProfile.tasks_completed_by_priority[priority] += 1;
      
      // Update difficulty statistics
      const difficulty = String(task.difficulty);
      if (!this.userProfile.tasks_completed_by_difficulty[difficulty]) {
        this.userProfile.tasks_completed_by_difficulty[difficulty] = 0;
      }
      this.userProfile.tasks_completed_by_difficulty[difficulty] += 1;
      
      // Update streak
      await this.updateStreak(task.completed_at);
      
      // Check for level up
      const oldLevel = this.userProfile.level;
      this.userProfile.level = this.calculateLevel(this.userProfile.total_experience);
      
      // Save updated profile
      await this.saveUserProfile();
      
      // Check for achievements
      await this.checkAchievements();
      
      // Return result object
      return {
        points,
        multipliers,
        levelUp: this.userProfile.level > oldLevel,
        newLevel: this.userProfile.level,
        newTitle: this.getCurrentTitle()
      };
    }
    
    // Calculate any applicable multipliers
    async calculateMultipliers(task) {
      // Initialize multipliers
      const multipliers = {
        streak: 1.0,
        earlyCompletion: 1.0,
        dailyMission: 1.0,
        bonus: 1.0,
        total: 1.0
      };
      
      // Streak multiplier: 1 + (0.05 × consecutive days), capped at 2.0× (20 days)
      if (this.userProfile.current_streak_days > 1) {
        multipliers.streak = Math.min(1 + (0.05 * this.userProfile.current_streak_days), 2.0);
      }
      
      // Early completion multiplier (1.5× for tasks completed before 50% of available time)
      if (task.due_date) {
        // This would be more complex in a real implementation
        // We'd need to compare creation date, due date, and completion date
        // For simplicity, just randomly apply this bonus sometimes
        if (Math.random() > 0.7) {
          multipliers.earlyCompletion = 1.5;
        }
      }
      
      // Daily mission bonus (1.25× for tasks that are part of daily missions)
      // This would require integration with the daily mission system
      // For now, just a placeholder
      
      // Calculate total multiplier
      multipliers.total = multipliers.streak * multipliers.earlyCompletion * 
                          multipliers.dailyMission * multipliers.bonus;
      
      return multipliers;
    }
    
    // Update streak based on task completion date
    async updateStreak(completionDate) {
      if (!completionDate) {
        completionDate = new Date().toISOString();
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const completionDay = new Date(completionDate);
      completionDay.setHours(0, 0, 0, 0);
      
      const lastTaskDate = this.userProfile.last_task_date ? 
        new Date(this.userProfile.last_task_date) : null;
      
      if (lastTaskDate) {
        lastTaskDate.setHours(0, 0, 0, 0);
        
        // Check if we already completed a task today
        if (completionDay.getTime() === today.getTime() && 
            lastTaskDate.getTime() === today.getTime()) {
          // Already counted for today, no change to streak
          return;
        }
        
        // Check if this is the next day (continuing streak)
        const yesterdayTime = today.getTime() - (24 * 60 * 60 * 1000);
        
        if (lastTaskDate.getTime() === yesterdayTime) {
          // Continuing streak
          this.userProfile.current_streak_days += 1;
        } else if (completionDay.getTime() === today.getTime() && 
                  lastTaskDate.getTime() < yesterdayTime) {
          // Broke streak and starting new one
          this.userProfile.current_streak_days = 1;
        }
        // (If completing a task for a past date, don't change streak)
      } else {
        // First task ever completed
        this.userProfile.current_streak_days = 1;
      }
      
      // Update longest streak if current is longer
      if (this.userProfile.current_streak_days > this.userProfile.longest_streak_days) {
        this.userProfile.longest_streak_days = this.userProfile.current_streak_days;
      }
      
      // Update last task date to task completion date
      this.userProfile.last_task_date = completionDate;
    }
    
    // Calculate level based on total experience
    calculateLevel(experience) {
      // Level formula varies by level range to create a nice curve
      if (experience < 1000) {
        // Level 1-10: 100 × Level² XP
        return Math.max(1, Math.floor(Math.sqrt(experience / 100)));
      } else if (experience < 10000) {
        // Level 11-25: 150 × Level² XP
        return Math.floor(Math.sqrt(experience / 150));
      } else if (experience < 50000) {
        // Level 26-50: 200 × Level² XP
        return Math.floor(Math.sqrt(experience / 200));
      } else {
        // Level 51+: 250 × Level² XP
        return Math.floor(Math.sqrt(experience / 250));
      }
    }
    
    // Get XP required for next level
    getNextLevelXP() {
      const currentLevel = this.userProfile.level;
      let xpRequired;
      
      if (currentLevel < 10) {
        xpRequired = 100 * Math.pow(currentLevel + 1, 2);
      } else if (currentLevel < 25) {
        xpRequired = 150 * Math.pow(currentLevel + 1, 2);
      } else if (currentLevel < 50) {
        xpRequired = 200 * Math.pow(currentLevel + 1, 2);
      } else {
        xpRequired = 250 * Math.pow(currentLevel + 1, 2);
      }
      
      return xpRequired;
    }
    
    // Get current progress percentage to next level
    getLevelProgress() {
      const currentXP = this.userProfile.total_experience;
      const currentLevel = this.userProfile.level;
      
      let currentLevelXP;
      if (currentLevel === 1) {
        currentLevelXP = 0;
      } else if (currentLevel <= 10) {
        currentLevelXP = 100 * Math.pow(currentLevel, 2);
      } else if (currentLevel <= 25) {
        currentLevelXP = 150 * Math.pow(currentLevel, 2);
      } else if (currentLevel <= 50) {
        currentLevelXP = 200 * Math.pow(currentLevel, 2);
      } else {
        currentLevelXP = 250 * Math.pow(currentLevel, 2);
      }
      
      const nextLevelXP = this.getNextLevelXP();
      const xpForThisLevel = nextLevelXP - currentLevelXP;
      const progressInThisLevel = currentXP - currentLevelXP;
      
      return Math.floor((progressInThisLevel / xpForThisLevel) * 100);
    }
    
    // Get the current title based on level and theme
    getCurrentTitle() {
      const level = this.userProfile.level;
      const theme = this.app.preferences.titleTheme || 'fantasy';
      
      // Get titles for selected theme
      const titles = this.titleThemes[theme] || this.titleThemes.fantasy;
      
      // Find the highest title for current level
      let currentTitle = titles[0].title; // Default to lowest
      
      for (const title of titles) {
        if (level >= title.level) {
          currentTitle = title.title;
        } else {
          break;
        }
      }
      
      return currentTitle;
    }
    
    // Define the achievements
    defineAchievements() {
      return [
        // Completion achievements
        {
          id: 'complete_10_tasks',
          title: 'Beginner',
          description: 'Complete 10 tasks',
          icon: 'check',
          type: 'completion',
          criteria: {
            type: 'task_count',
            target_value: 10
          },
          reward: {
            experience_points: 100
          },
          rarity: 'common',
          hidden: false
        },
        {
          id: 'complete_50_tasks',
          title: 'Taskmaster',
          description: 'Complete 50 tasks',
          icon: 'check',
          type: 'completion',
          criteria: {
            type: 'task_count',
            target_value: 50
          },
          reward: {
            experience_points: 300
          },
          rarity: 'uncommon',
          hidden: false
        },
        {
          id: 'complete_100_tasks',
          title: 'Centurion',
          description: 'Complete 100 tasks',
          icon: 'check',
          type: 'completion',
          criteria: {
            type: 'task_count',
            target_value: 100
          },
          reward: {
            experience_points: 500
          },
          rarity: 'rare',
          hidden: false
        },
        
        // Priority achievements
        {
          id: 'complete_10_p1_tasks',
          title: 'Priority First',
          description: 'Complete 10 high-priority (P1) tasks',
          icon: 'priority',
          type: 'completion',
          criteria: {
            type: 'task_count_priority',
            target_value: 10,
            priority_max: 1
          },
          reward: {
            experience_points: 200
          },
          rarity: 'uncommon',
          hidden: false
        },
        
        // Difficulty achievements
        {
          id: 'complete_10_d5_tasks',
          title: 'Challenge Seeker',
          description: 'Complete 10 very hard (D5) tasks',
          icon: 'difficulty',
          type: 'completion',
          criteria: {
            type: 'task_count_difficulty',
            target_value: 10,
            difficulty_min: 5
          },
          reward: {
            experience_points: 300
          },
          rarity: 'uncommon',
          hidden: false
        },
        
        // Streak achievements
        {
          id: 'streak_7_days',
          title: 'Weekly Warrior',
          description: 'Maintain a 7-day streak',
          icon: 'streak',
          type: 'streak',
          criteria: {
            type: 'streak_days',
            target_value: 7
          },
          reward: {
            experience_points: 300
          },
          rarity: 'uncommon',
          hidden: false
        },
        {
          id: 'streak_30_days',
          title: 'Monthly Maestro',
          description: 'Maintain a 30-day streak',
          icon: 'streak',
          type: 'streak',
          criteria: {
            type: 'streak_days',
            target_value: 30
          },
          reward: {
            experience_points: 1000
          },
          rarity: 'epic',
          hidden: false
        },
        {
          id: 'streak_100_days',
          title: 'Centurion Streaker',
          description: 'Maintain a 100-day streak',
          icon: 'streak',
          type: 'streak',
          criteria: {
            type: 'streak_days',
            target_value: 100
          },
          reward: {
            experience_points: 3000
          },
          rarity: 'legendary',
          hidden: false
        }
      ];
    }
    
    // Check if any achievements have been unlocked
    async checkAchievements() {
      if (!this.userProfile) {
        await this.loadUserProfile();
      }
      
      const newAchievements = [];
      
      for (const achievement of this.achievements) {
        // Skip if already unlocked
        if (this.userProfile.unlocked_achievements.includes(achievement.id)) {
          continue;
        }
        
        // Check if achievement is unlocked
        const isUnlocked = this.checkAchievementCriteria(achievement);
        
        if (isUnlocked) {
          // Add to unlocked achievements
          this.userProfile.unlocked_achievements.push(achievement.id);
          
          // Add experience points
          this.userProfile.total_experience += achievement.reward.experience_points || 0;
          
          // Check for level up
          this.userProfile.level = this.calculateLevel(this.userProfile.total_experience);
          
          // Add to new achievements list
          newAchievements.push(achievement);
        }
      }
      
      // If we unlocked any achievements, save the profile
      if (newAchievements.length > 0) {
        await this.saveUserProfile();
        
        // Show notifications for new achievements
        this.notifyAchievements(newAchievements);
      }
      
      return newAchievements;
    }
    
    // Check if an achievement's criteria have been met
    checkAchievementCriteria(achievement) {
      const criteria = achievement.criteria;
      
      switch (criteria.type) {
        case 'task_count':
          return this.userProfile.tasks_completed >= criteria.target_value;
          
        case 'task_count_priority':
          const priorityCount = Object.entries(this.userProfile.tasks_completed_by_priority)
            .filter(([priority, count]) => parseInt(priority) <= criteria.priority_max)
            .reduce((total, [priority, count]) => total + count, 0);
          return priorityCount >= criteria.target_value;
          
        case 'task_count_difficulty':
          const difficultyCount = Object.entries(this.userProfile.tasks_completed_by_difficulty)
            .filter(([difficulty, count]) => parseInt(difficulty) >= criteria.difficulty_min)
            .reduce((total, [difficulty, count]) => total + count, 0);
          return difficultyCount >= criteria.target_value;
          
        case 'streak_days':
          return this.userProfile.longest_streak_days >= criteria.target_value;
          
        default:
          return false;
      }
    }
    
    // Notify the user of newly unlocked achievements
    notifyAchievements(achievements) {
      for (const achievement of achievements) {
        // If we have notifications, show a notification
        if (this.app.notifications && this.app.preferences.notificationsEnabled) {
          this.app.notifications.showNotification(
            'Achievement Unlocked!',
            `${achievement.title} - ${achievement.description}`,
            { icon: 'achievement' }
          );
        }
        
        // If we have sound effects, play a sound
        if (this.app.sound && this.app.preferences.soundEnabled) {
          this.app.sound.play('achievement');
        }
        
        console.log('Achievement unlocked:', achievement.title);
      }
    }
    
    // Get all achievements with progress
    getAchievementsWithProgress() {
      const achievementsWithProgress = this.achievements.map(achievement => {
        const isUnlocked = this.userProfile.unlocked_achievements.includes(achievement.id);
        const progress = this.calculateAchievementProgress(achievement);
        
        return {
          ...achievement,
          unlocked: isUnlocked,
          progress
        };
      });
      
      return achievementsWithProgress;
    }
    
    // Calculate progress percentage for an achievement
    calculateAchievementProgress(achievement) {
      const criteria = achievement.criteria;
      
      switch (criteria.type) {
        case 'task_count':
          return Math.min(100, Math.floor((this.userProfile.tasks_completed / criteria.target_value) * 100));
          
        case 'task_count_priority':
          const priorityCount = Object.entries(this.userProfile.tasks_completed_by_priority)
            .filter(([priority, count]) => parseInt(priority) <= criteria.priority_max)
            .reduce((total, [priority, count]) => total + count, 0);
          return Math.min(100, Math.floor((priorityCount / criteria.target_value) * 100));
          
        case 'task_count_difficulty':
          const difficultyCount = Object.entries(this.userProfile.tasks_completed_by_difficulty)
            .filter(([difficulty, count]) => parseInt(difficulty) >= criteria.difficulty_min)
            .reduce((total, [difficulty, count]) => total + count, 0);
          return Math.min(100, Math.floor((difficultyCount / criteria.target_value) * 100));
          
        case 'streak_days':
          return Math.min(100, Math.floor((this.userProfile.longest_streak_days / criteria.target_value) * 100));
          
        default:
          return 0;
      }
    }
  }
  
  // Export the class if in Node.js environment
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GamificationSystem };
  } else {
    // Browser context
    window.GamificationSystem = GamificationSystem;
  }