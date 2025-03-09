// views/settings.js - Settings view

class SettingsView {
    constructor(app) {
      this.app = app;
    }
    
    async render() {
      const { preferences } = this.app;
      
      return `
        <div class="settings-view">
          <div class="view-header">
            <h2>Settings</h2>
          </div>
          
          <div class="settings-section">
            <h3>Appearance</h3>
            
            <div class="setting-item">
              <label for="theme-setting">Theme</label>
              <select id="theme-setting" class="form-control">
                <option value="auto" ${preferences.theme === 'auto' ? 'selected' : ''}>Auto (Follow System)</option>
                <option value="light" ${preferences.theme === 'light' ? 'selected' : ''}>Light</option>
                <option value="dark" ${preferences.theme === 'dark' ? 'selected' : ''}>Dark</option>
              </select>
            </div>
            
            <div class="setting-item">
              <label for="title-theme-setting">Achievement Style</label>
              <select id="title-theme-setting" class="form-control">
                <option value="fantasy" ${preferences.titleTheme === 'fantasy' ? 'selected' : ''}>Fantasy Adventure</option>
                <option value="professional" ${preferences.titleTheme === 'professional' ? 'selected' : ''}>Career Growth</option>
                <option value="academic" ${preferences.titleTheme === 'academic' ? 'selected' : ''}>Academic Achievement</option>
                <option value="athletic" ${preferences.titleTheme === 'athletic' ? 'selected' : ''}>Athletic Progress</option>
                <option value="spiritual" ${preferences.titleTheme === 'spiritual' ? 'selected' : ''}>Spiritual Journey</option>
              </select>
            </div>
          </div>
          
          <div class="settings-section">
            <h3>Notifications</h3>
            
            <div class="setting-item">
              <label class="toggle-label">
                <span>Enable Notifications</span>
                <input type="checkbox" id="notifications-setting" ${preferences.notificationsEnabled ? 'checked' : ''}>
                <span class="toggle-switch"></span>
              </label>
            </div>
            
            <div class="setting-item">
              <label class="toggle-label">
                <span>Daily Reminder</span>
                <input type="checkbox" id="daily-reminder-setting" ${preferences.dailyReminderEnabled ? 'checked' : ''}>
                <span class="toggle-switch"></span>
              </label>
            </div>
            
            <div class="setting-item" id="reminder-time-container" ${!preferences.dailyReminderEnabled ? 'style="display:none"' : ''}>
              <label for="reminder-time-setting">Reminder Time</label>
              <input type="time" id="reminder-time-setting" class="form-control" value="${preferences.dailyReminderTime || '09:00'}">
            </div>
          </div>
          
          <div class="settings-section">
            <h3>Sound Effects</h3>
            
            <div class="setting-item">
              <label class="toggle-label">
                <span>Enable Sounds</span>
                <input type="checkbox" id="sounds-setting" ${preferences.soundEnabled ? 'checked' : ''}>
                <span class="toggle-switch"></span>
              </label>
            </div>
          </div>
          
          <div class="settings-section">
            <h3>Synchronization</h3>
            
            <div class="setting-item">
              <label for="sync-interval-setting">Sync Frequency</label>
              <select id="sync-interval-setting" class="form-control">
                <option value="1" ${preferences.syncIntervalMinutes === 1 ? 'selected' : ''}>Every minute</option>
                <option value="5" ${preferences.syncIntervalMinutes === 5 ? 'selected' : ''}>Every 5 minutes</option>
                <option value="15" ${preferences.syncIntervalMinutes === 15 ? 'selected' : ''}>Every 15 minutes</option>
                <option value="30" ${preferences.syncIntervalMinutes === 30 ? 'selected' : ''}>Every 30 minutes</option>
                <option value="60" ${preferences.syncIntervalMinutes === 60 ? 'selected' : ''}>Every hour</option>
              </select>
            </div>
            
            <div class="setting-item">
              <label>Google Sheets Status</label>
              <div class="status-indicator">
                <span class="status-dot ${this.app.online ? 'connected' : 'disconnected'}"></span>
                <span>${this.app.online ? 'Connected' : 'Disconnected'}</span>
              </div>
              <button id="sync-now-button" class="secondary-button">Sync Now</button>
            </div>
          </div>
          
          <div class="settings-section">
            <h3>About</h3>
            
            <div class="setting-item">
              <label>Version</label>
              <div>${this.app.config.version}</div>
            </div>
          </div>
        </div>
      `;
    }
    
    initializeEventListeners() {
      // Theme setting
      document.getElementById('theme-setting').addEventListener('change', (e) => {
        this.app.savePreferences({ theme: e.target.value });
      });
      
      // Title theme setting
      document.getElementById('title-theme-setting').addEventListener('change', (e) => {
        this.app.savePreferences({ titleTheme: e.target.value });
      });
      
      // Notifications setting
      document.getElementById('notifications-setting').addEventListener('change', (e) => {
        this.app.savePreferences({ notificationsEnabled: e.target.checked });
        
        if (e.target.checked) {
          this.app.notifications.requestPermission();
        }
      });
      
      // Daily reminder setting
      document.getElementById('daily-reminder-setting').addEventListener('change', (e) => {
        this.app.savePreferences({ dailyReminderEnabled: e.target.checked });
        
        const timeContainer = document.getElementById('reminder-time-container');
        if (timeContainer) {
          timeContainer.style.display = e.target.checked ? 'block' : 'none';
        }
      });
      
      // Reminder time setting
      document.getElementById('reminder-time-setting').addEventListener('change', (e) => {
        this.app.savePreferences({ dailyReminderTime: e.target.value });
      });
      
      // Sound effects setting
      document.getElementById('sounds-setting').addEventListener('change', (e) => {
        this.app.savePreferences({ soundEnabled: e.target.checked });
        this.app.sound.setEnabled(e.target.checked);
      });
      
      // Sync interval setting
      document.getElementById('sync-interval-setting').addEventListener('change', (e) => {
        const interval = parseInt(e.target.value, 10);
        this.app.savePreferences({ syncIntervalMinutes: interval });
        this.app.sync.updateSyncInterval(interval);
      });
      
      // Sync now button
      document.getElementById('sync-now-button').addEventListener('click', () => {
        if (this.app.online) {
          this.app.sync.syncNow();
        } else {
          alert('Cannot sync while offline. Please check your internet connection.');
        }
      });
    }
  }
  
  // Export the class if in Node.js environment
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SettingsView };
  } else {
    // Browser context
    window.SettingsView = SettingsView;
  }