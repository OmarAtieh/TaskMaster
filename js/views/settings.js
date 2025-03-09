// views/settings.js - Settings view

class SettingsView {
    constructor(app) {
      this.app = app;
    }
    
    async render() {
      const { preferences } = this.app;
      
      // Get Google auth status
      const isGoogleAuthorized = this.app.sync.isAuthorized;
      
      return `
        <div class="settings-view">
          <div class="view-header">
            <h2>Settings</h2>
          </div>
          
          <div class="settings-sections">
            <div class="settings-section">
              <h3 class="settings-section-title">
                <span class="settings-icon">🎨</span>
                Appearance
              </h3>
              
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
              <h3 class="settings-section-title">
                <span class="settings-icon">🔔</span>
                Notifications
              </h3>
              
              <div class="setting-item">
                <div class="setting-row">
                  <label class="switch-label" for="notifications-setting">Enable Notifications</label>
                  <label class="switch">
                    <input type="checkbox" id="notifications-setting" ${preferences.notificationsEnabled ? 'checked' : ''}>
                    <span class="slider round"></span>
                  </label>
                </div>
              </div>
              
              <div class="setting-item">
                <div class="setting-row">
                  <label class="switch-label" for="daily-reminder-setting">Daily Reminder</label>
                  <label class="switch">
                    <input type="checkbox" id="daily-reminder-setting" ${preferences.dailyReminderEnabled ? 'checked' : ''}>
                    <span class="slider round"></span>
                  </label>
                </div>
              </div>
              
              <div class="setting-item" id="reminder-time-container" ${!preferences.dailyReminderEnabled ? 'style="display:none"' : ''}>
                <label for="reminder-time-setting">Reminder Time</label>
                <input type="time" id="reminder-time-setting" class="form-control" value="${preferences.dailyReminderTime || '09:00'}">
              </div>
            </div>
            
            <div class="settings-section">
              <h3 class="settings-section-title">
                <span class="settings-icon">🔊</span>
                Sound Effects
              </h3>
              
              <div class="setting-item">
                <div class="setting-row">
                  <label class="switch-label" for="sounds-setting">Enable Sounds</label>
                  <label class="switch">
                    <input type="checkbox" id="sounds-setting" ${preferences.soundEnabled ? 'checked' : ''}>
                    <span class="slider round"></span>
                  </label>
                </div>
              </div>
            </div>
            
            <div class="settings-section">
              <h3 class="settings-section-title">
                <span class="settings-icon">🔄</span>
                Synchronization
              </h3>
              
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
                <div class="setting-row">
                  <div>
                    <label>Google Sheets Status</label>
                    <div class="status-indicator">
                      <span class="status-dot ${isGoogleAuthorized ? 'connected' : 'disconnected'}"></span>
                      <span>${isGoogleAuthorized ? 'Connected' : 'Disconnected'}</span>
                    </div>
                  </div>
                  <button id="sync-now-button" class="secondary-button" ${!isGoogleAuthorized ? 'disabled' : ''}>
                    Sync Now
                  </button>
                </div>
              </div>
              
              <div class="setting-item">
                <label>Sheet ID</label>
                <div class="setting-row">
                  <input type="text" class="form-control" id="spreadsheet-id" value="${this.app.sync.spreadsheetId || 'Not set'}" readonly>
                  <button id="copy-sheet-id" class="icon-button" title="Copy to clipboard">📋</button>
                </div>
              </div>
            </div>
            
            <div class="settings-section">
              <h3 class="settings-section-title">
                <span class="settings-icon">ℹ️</span>
                About
              </h3>
              
              <div class="setting-item">
                <label>Version</label>
                <div>${this.app.config.version}</div>
              </div>
              
              <div class="setting-item">
                <label>Storage Usage</label>
                <div id="storage-usage">Calculating...</div>
              </div>
              
              <div class="danger-zone">
                <h4>Danger Zone</h4>
                <button id="reset-app" class="danger-button">Reset Application</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    
    initializeEventListeners() {
      // Theme setting
      document.getElementById('theme-setting')?.addEventListener('change', (e) => {
        this.app.savePreferences({ theme: e.target.value });
      });
      
      // Title theme setting
      document.getElementById('title-theme-setting')?.addEventListener('change', (e) => {
        this.app.savePreferences({ titleTheme: e.target.value });
      });
      
      // Notifications setting
      document.getElementById('notifications-setting')?.addEventListener('change', (e) => {
        this.app.savePreferences({ notificationsEnabled: e.target.checked });
        
        if (e.target.checked) {
          this.app.notifications.requestPermission();
        }
      });
      
      // Daily reminder setting
      document.getElementById('daily-reminder-setting')?.addEventListener('change', (e) => {
        this.app.savePreferences({ dailyReminderEnabled: e.target.checked });
        
        const timeContainer = document.getElementById('reminder-time-container');
        if (timeContainer) {
          timeContainer.style.display = e.target.checked ? 'block' : 'none';
        }
      });
      
      // Reminder time setting
      document.getElementById('reminder-time-setting')?.addEventListener('change', (e) => {
        this.app.savePreferences({ dailyReminderTime: e.target.value });
      });
      
      // Sound effects setting
      document.getElementById('sounds-setting')?.addEventListener('change', (e) => {
        this.app.savePreferences({ soundEnabled: e.target.checked });
        this.app.sound.setEnabled(e.target.checked);
      });
      
      // Sync interval setting
      document.getElementById('sync-interval-setting')?.addEventListener('change', (e) => {
        const interval = parseInt(e.target.value, 10);
        this.app.savePreferences({ syncIntervalMinutes: interval });
        this.app.sync.updateSyncInterval(interval);
      });
      
      // Sync now button
      document.getElementById('sync-now-button')?.addEventListener('click', () => {
        if (this.app.online) {
          this.app.sync.syncNow();
          alert('Synchronization started');
        } else {
          alert('Cannot sync while offline. Please check your internet connection.');
        }
      });
      
      // Copy sheet ID
      document.getElementById('copy-sheet-id')?.addEventListener('click', () => {
        const sheetIdInput = document.getElementById('spreadsheet-id');
        if (sheetIdInput) {
          sheetIdInput.select();
          document.execCommand('copy');
          alert('Sheet ID copied to clipboard!');
        }
      });
      
      // Reset app button
      document.getElementById('reset-app')?.addEventListener('click', () => {
        if (confirm('WARNING: This will reset the entire application and delete all your data. This action cannot be undone. Are you absolutely sure?')) {
          this.resetApplication();
        }
      });
      
      // Calculate storage usage
      this.calculateStorageUsage();
    }
    
    async calculateStorageUsage() {
      const usageElement = document.getElementById('storage-usage');
      if (!usageElement) return;
      
      try {
        // Get IndexedDB database size (estimated)
        const estimate = await navigator.storage?.estimate();
        
        if (estimate) {
          const usedMB = (estimate.usage / (1024 * 1024)).toFixed(2);
          const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(2);
          
          usageElement.textContent = `${usedMB} MB used of ${quotaMB} MB`;
        } else {
          usageElement.textContent = 'Unknown';
        }
      } catch (error) {
        console.error('Error calculating storage usage:', error);
        usageElement.textContent = 'Unable to calculate';
      }
    }
    
    async resetApplication() {
      try {
        // Clear all storage
        await this.app.storage.clear('tasks');
        await this.app.storage.clear('categories');
        await this.app.storage.clear('user_data');
        await this.app.storage.clear('sync_queue');
        
        // Remove app_initialized flag
        await this.app.storage.delete('app_initialized', 'user_data');
        
        // Show success message
        alert('Application reset successful. The page will now reload.');
        
        // Reload the page
        window.location.reload();
      } catch (error) {
        console.error('Error resetting application:', error);
        alert('Failed to reset application: ' + error.message);
      }
    }
  }
  
  // Export the class if in Node.js environment
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SettingsView };
  } else {
    // Browser context
    window.SettingsView = SettingsView;
  }