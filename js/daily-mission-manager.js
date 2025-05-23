// daily-mission-manager.js - Daily missions functionality

class DailyMissionManager {
    constructor(app) {
      this.app = app;
      this.storage = app.storage;
      this.dailyMissions = null;
      this.lastGeneratedDate = null;
    }
    
    // Load daily missions from storage
    async loadDailyMissions() {
      try {
        const missions = await this.storage.get('daily_missions');
        
        if (missions) {
          this.dailyMissions = missions;
          this.lastGeneratedDate = missions.date;
        } else {
          this.dailyMissions = null;
          this.lastGeneratedDate = null;
        }
        
        return this.dailyMissions;
      } catch (error) {
        console.error('Error loading daily missions:', error);
        this.dailyMissions = null;
        return null;
      }
    }
    
    // Check if we need to generate new daily missions
    async checkAndGenerateDailyMissions() {
      await this.loadDailyMissions();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayStr = today.toISOString().split('T')[0];
      
      // If we don't have missions or they're from a different day, generate new ones
      if (!this.dailyMissions || this.lastGeneratedDate !== todayStr) {
        await this.generateDailyMissions();
      }
      
      return this.dailyMissions;
    }
    
    // Generate new daily missions
    async generateDailyMissions() {
      try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Get all available tasks
        const allTasks = await this.app.tasks.getTasks();
        
        // Filter out completed tasks and those without categories
        const availableTasks = allTasks.filter(task => 
          task.status !== 'completed' && task.category_id
        );
        
        // Get recurring tasks first
        const recurringTasks = availableTasks.filter(task => task.is_recurring);
        
        // Get tasks due today
        const tasksForToday = availableTasks.filter(task => 
          task.due_date === todayStr
        );
        
        // Get other tasks (not due today and not recurring)
        const otherTasks = availableTasks.filter(task => 
          !task.is_recurring && task.due_date !== todayStr
        );
        
        // Determine how many missions to generate (3-5)
        const missionCount = Math.min(5, Math.max(3, availableTasks.length));
        
        // Initialize missions array
        const missionTasks = [];
        
        // First add tasks due today
        for (const task of tasksForToday) {
          if (missionTasks.length < missionCount) {
            missionTasks.push(task);
          } else {
            break;
          }
        }
        
        // Then add recurring tasks
        if (missionTasks.length < missionCount) {
          const remainingSlots = missionCount - missionTasks.length;
          const selectedRecurring = this.selectTasks(recurringTasks, remainingSlots);
          
          missionTasks.push(...selectedRecurring);
        }
        
        // Finally, fill remaining slots with other tasks
        if (missionTasks.length < missionCount) {
          const remainingSlots = missionCount - missionTasks.length;
          const selectedOther = this.selectTasks(otherTasks, remainingSlots);
          
          missionTasks.push(...selectedOther);
        }
        
        // Create daily missions object
        this.dailyMissions = {
          date: todayStr,
          missions: missionTasks.map(task => ({
            id: task.id,
            title: task.title,
            category_id: task.category_id,
            priority: task.priority,
            difficulty: task.difficulty,
            completed: task.status === 'completed',
            points: this.calculateMissionPoints(task)
          })),
          allCompleted: false,
          bonus: 50 // Bonus points for completing all missions
        };
        
        // Save to storage
        await this.storage.set('daily_missions', this.dailyMissions);
        
        return this.dailyMissions;
      } catch (error) {
        console.error('Error generating daily missions:', error);
        return null;
      }
    }
    
    // Select a balanced set of tasks
    selectTasks(tasks, count) {
      if (tasks.length <= count) {
        return [...tasks];
      }
      
      // Sort by priority first, then difficulty
      const sortedTasks = [...tasks].sort((a, b) => {
        // Sort by priority (P1 is highest)
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        
        // Then by difficulty (D5 is hardest)
        return b.difficulty - a.difficulty;
      });
      
      // Take top N tasks, but ensure we have a mix of categories if possible
      const selectedTasks = [];
      const selectedCategories = new Set();
      
      // First pass - try to get one task from each category
      for (const task of sortedTasks) {
        if (selectedTasks.length >= count) break;
        
        if (!selectedCategories.has(task.category_id)) {
          selectedTasks.push(task);
          selectedCategories.add(task.category_id);
        }
      }
      
      // Second pass - fill remaining slots
      if (selectedTasks.length < count) {
        for (const task of sortedTasks) {
          if (selectedTasks.length >= count) break;
          
          if (!selectedTasks.includes(task)) {
            selectedTasks.push(task);
          }
        }
      }
      
      return selectedTasks;
    }
    
    // Calculate points for a mission
    calculateMissionPoints(task) {
      // Base points - same as regular task calculation
      // (6 - Priority) × Difficulty × TimeFactor
      const priority = task.priority || 3;
      const difficulty = task.difficulty || 3;
      const estimatedMinutes = task.estimated_minutes || 30;
      
      // Time factor: sqrt(EstimatedMinutes / 30)
      const timeFactor = Math.sqrt(estimatedMinutes / 30);
      
      // Calculate base points
      let points = (6 - priority) * difficulty * timeFactor;
      
      // Add daily mission bonus (25%)
      points *= 1.25;
      
      // Round to nearest integer
      return Math.round(points);
    }
    
    // Update mission completion status
    async updateMissionStatus(taskId, completed) {
      if (!this.dailyMissions) {
        await this.loadDailyMissions();
        
        if (!this.dailyMissions) {
          return false;
        }
      }
      
      // Find the mission
      const mission = this.dailyMissions.missions.find(m => m.id === taskId);
      
      if (!mission) {
        return false;
      }
      
      // Update completion status
      mission.completed = completed;
      
      // Check if all missions are completed
      const allCompleted = this.dailyMissions.missions.every(m => m.completed);
      this.dailyMissions.allCompleted = allCompleted;
      
      // Save changes
      await this.storage.set('daily_missions', this.dailyMissions);
      
      // If all missions are completed, award bonus points
      if (allCompleted && this.app.gamification) {
        // Award bonus points for completing all daily missions
        await this.app.gamification.awardBonusPoints(
          this.dailyMissions.bonus,
          'daily_missions_completion',
          'Completed all daily missions'
        );
      }
      
      return true;
    }
    
    // Get total possible points for daily missions
    getTotalPossiblePoints() {
      if (!this.dailyMissions) {
        return 0;
      }
      
      // Sum mission points
      const missionPoints = this.dailyMissions.missions.reduce(
        (total, mission) => total + mission.points, 0
      );
      
      // Add bonus if applicable
      return missionPoints + this.dailyMissions.bonus;
    }
    
    // Get earned points so far
    getEarnedPoints() {
      if (!this.dailyMissions) {
        return 0;
      }
      
      // Sum points for completed missions
      const completedPoints = this.dailyMissions.missions
        .filter(mission => mission.completed)
        .reduce((total, mission) => total + mission.points, 0);
      
      // Add bonus if all completed
      if (this.dailyMissions.allCompleted) {
        return completedPoints + this.dailyMissions.bonus;
      }
      
      return completedPoints;
    }
  }
  
  // Export the class if in Node.js environment
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DailyMissionManager };
  } else {
    // Browser context
    window.DailyMissionManager = DailyMissionManager;
  }