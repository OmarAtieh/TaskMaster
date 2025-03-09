// notification-manager.js - Browser notification system

class NotificationManager {
    constructor(app) {
      this.app = app;
      this.storage = app.storage;
      this.hasPermission = false;
      this.pendingNotifications = [];
      this.reminderTimeout = null;
      
      // Check permission status
      if ('Notification' in window) {
        this.hasPermission = Notification.permission === 'granted';
      }
    }
    
    // Set up notifications
    async setupNotifications() {
      if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
      }
      
      if (Notification.permission === 'granted') {
        this.hasPermission = true;
        
        // Schedule daily reminder if enabled
        this.scheduleDailyReminder();
        
        // Schedule task due reminders
        this.scheduleDueTaskReminders();
        
        return true;
      } else if (Notification.permission !== 'denied') {
        // Request permission
        return this.requestPermission();
      } else {
        console.log('Notification permission denied');
        return false;
      }
    }
    
    // Request notification permission
    async requestPermission() {
      try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          this.hasPermission = true;
          
          // Schedule notifications now that we have permission
          this.scheduleDailyReminder();
          this.scheduleDueTaskReminders();
          
          return true;
        } else {
          console.log('Notification permission denied');
          this.hasPermission = false;
          return false;
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }
    
    // Show a notification
    showNotification(title, body, options = {}) {
      if (!this.hasPermission) {
        // Add to pending notifications
        this.pendingNotifications.push({ title, body, options });
        return false;
      }
      
      try {
        // If we have sound and it's enabled, play the notification sound
        if (this.app.sound && this.app.preferences.soundEnabled) {
          this.app.sound.play('notification');
        }
        
        // Create notification
        const notification = new Notification(title, {
          body,
          icon: options.icon || '',
          badge: options.badge || '',
          tag: options.tag || 'taskmaster-notification',
          renotify: options.renotify || false,
          data: options.data || {}
        });
        
        // Add click handler
        notification.onclick = () => {
          // Focus on the app window
          window.focus();
          
          // Close the notification
          notification.close();
          
          // Handle specific notification actions
          if (options.data && options.data.action) {
            this.handleNotificationAction(options.data.action, options.data);
          }
        };
        
        return true;
      } catch (error) {
        console.error('Error showing notification:', error);
        return false;
      }
    }
    
    // Check for pending notifications
    checkPendingNotifications() {
      if (this.pendingNotifications.length === 0 || !this.hasPermission) {
        return;
      }
      
      // Show each pending notification
      for (const notification of this.pendingNotifications) {
        this.showNotification(notification.title, notification.body, notification.options);
      }
      
      // Clear pending notifications
      this.pendingNotifications = [];
    }
    
    // Handle notification action
    handleNotificationAction(action, data) {
      switch (action) {
        case 'view_task':
          // Navigate to the task view
          if (this.app.ui) {
            this.app.ui.switchView('tasks');
            
            // Highlight the specific task if we have its ID
            if (data.taskId) {
              // Implementation would depend on how tasks are displayed
              console.log('Navigating to task:', data.taskId);
            }
          }
          break;
          
        case 'daily_summary':
          // Show daily summary
          if (this.app.ui) {
            this.app.ui.switchView('daily');
          }
          break;
          
        default:
          console.log('Unknown notification action:', action);
      }
    }
    
    // Schedule daily reminder
    scheduleDailyReminder() {
      // Clear any existing timeout
      if (this.reminderTimeout) {
        clearTimeout(this.reminderTimeout);
        this.reminderTimeout = null;
      }
      
      if (!this.app.preferences.dailyReminderEnabled) {
        return;
      }
      
      const reminderTime = this.app.preferences.dailyReminderTime || '09:00';
      const [hours, minutes] = reminderTime.split(':').map(num => parseInt(num, 10));
      
      // Calculate time until next reminder
      const now = new Date();
      const reminderDate = new Date(now);
      reminderDate.setHours(hours, minutes, 0, 0);
      
      // If reminder time has passed today, schedule for tomorrow
      if (reminderDate <= now) {
        reminderDate.setDate(reminderDate.getDate() + 1);
      }
      
      const timeUntilReminder = reminderDate.getTime() - now.getTime();
      
      // Schedule reminder
      this.reminderTimeout = setTimeout(() => {
        this.showDailyReminder();
        
        // Schedule the next day's reminder
        this.scheduleDailyReminder();
      }, timeUntilReminder);
      
      console.log(`Daily reminder scheduled for ${reminderDate.toLocaleString()}`);
    }
    
    // Show daily reminder notification
  async showDailyReminder() {
    try {
      // Get tasks for today
      const tasks = await this.app.tasks.getDailyTasks();
      const taskCount = tasks.length;
      
      // Determine streak
      const streak = this.app.gamification?.userProfile?.current_streak_days || 0;
      let streakText = '';
      
      if (streak > 0) {
        streakText = ` You're on a ${streak}-day streak!`;
      }
      
      // Create notification
      let title, body;
      
      if (taskCount > 0) {
        title = 'Your Day Ahead';
        body = `You have ${taskCount} task${taskCount !== 1 ? 's' : ''} for today.${streakText}`;
      } else {
        title = 'Plan Your Day';
        body = `You don't have any tasks scheduled for today.${streakText}`;
      }
      
      this.showNotification(title, body, {
        tag: 'daily-reminder',
        data: {
          action: 'daily_summary'
        }
      });
    } catch (error) {
      console.error('Error showing daily reminder:', error);
    }
  }
  
  // Schedule reminders for due tasks
  async scheduleDueTaskReminders() {
    if (!this.app.preferences.notificationsEnabled) {
      return;
    }
    
    try {
      // Get tasks with due dates
      const tasks = await this.app.tasks.getTasks();
      const tasksWithDueDateTime = tasks.filter(task => 
        task.status !== 'completed' && task.due_date && task.due_time
      );
      
      // Clear existing reminder timeouts
      if (this.taskReminders) {
        for (const timeout of this.taskReminders) {
          clearTimeout(timeout);
        }
      }
      
      this.taskReminders = [];
      
      // Schedule reminders for each task
      for (const task of tasksWithDueDateTime) {
        const dueDateTime = new Date(`${task.due_date}T${task.due_time}`);
        const now = new Date();
        
        // Calculate reminder time (default 30 minutes before)
        const reminderMinutes = this.app.preferences.reminderMinutesBefore || 30;
        const reminderTime = new Date(dueDateTime.getTime() - (reminderMinutes * 60 * 1000));
        
        // Only schedule if reminder time is in the future
        if (reminderTime > now) {
          const timeUntilReminder = reminderTime.getTime() - now.getTime();
          
          const timeout = setTimeout(() => {
            this.showTaskReminder(task);
          }, timeUntilReminder);
          
          this.taskReminders.push(timeout);
          
          console.log(`Reminder scheduled for task "${task.title}" at ${reminderTime.toLocaleString()}`);
        }
      }
    } catch (error) {
      console.error('Error scheduling task reminders:', error);
    }
  }
  
  // Show task reminder notification
  showTaskReminder(task) {
    const title = 'Task Reminder';
    const body = `"${task.title}" is due soon.`;
    
    this.showNotification(title, body, {
      tag: `task-reminder-${task.id}`,
      data: {
        action: 'view_task',
        taskId: task.id
      }
    });
  }
}

// Export the class if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NotificationManager };
} else {
  // Browser context
  window.NotificationManager = NotificationManager;
}