// views/settings.js - Settings view

class SettingsView {
    constructor(app) {
      this.app = app;
    }
    
    getObfuscatedValue(value) {
        if (!value) return '';
        
        // Show first 4 and last 4 characters, hide the rest with asterisks
        if (value.length <= 8) return value;
        
        const firstChars = value.substring(0, 4);
        const lastChars = value.substring(value.length - 4);
        const middleLength = value.length - 8;
        const asterisks = '*'.repeat(middleLength);
        
        return `${firstChars}${asterisks}${lastChars}`;
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
                <div class="setting-row auth-buttons">
                  <button id="sign-out-button" class="secondary-button" ${!isGoogleAuthorized ? 'style="display:none;"' : ''}>Sign Out from Google</button>
                  <button id="sign-in-button" class="primary-button" ${isGoogleAuthorized ? 'style="display:none;"' : ''}>Sign In with Google</button>
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
            <div class="settings-section">

            <h3 class="settings-section-title">
                <span class="settings-icon">🔐</span>
                Google API Credentials
            </h3>
            
            <div class="setting-item">
                <label for="google-client-id">Client ID</label>
                <div class="setting-row">
                <input type="password" class="form-control" id="google-client-id" value="${this.getObfuscatedValue(this.app.sync.CLIENT_ID)}" 
                    placeholder="Enter your Google Client ID">
                <button id="show-client-id" class="icon-button" title="Show/Hide">👁️</button>
                </div>
                <div class="help-text">From Google Cloud Console OAuth 2.0 credentials</div>
            </div>
            
            <div class="setting-item">
                <label for="google-api-key">API Key</label>
                <div class="setting-row">
                <input type="password" class="form-control" id="google-api-key" value="${this.getObfuscatedValue(this.app.sync.API_KEY)}"
                    placeholder="Enter your Google API Key">
                <button id="show-api-key" class="icon-button" title="Show/Hide">👁️</button>
                </div>
                <div class="help-text">From Google Cloud Console API Keys</div>
            </div>
            
            <div class="setting-item">
                <button id="save-credentials" class="primary-button">Save Credentials</button>
                <div id="credentials-status" class="status-text"></div>
            </div>
            
            <div class="setting-item">
                <div class="help-text">
                <strong>How to get credentials:</strong>
                <ol>
                    <li>Go to <a href="https://console.cloud.google.com" target="_blank">Google Cloud Console</a></li>
                    <li>Create a project</li>
                    <li>Enable Google Sheets API and Google Drive API</li>
                    <li>Create OAuth 2.0 credentials and an API Key</li>
                    <li>Add your domain to authorized JavaScript origins</li>
                </ol>
                </div>
            </div>
            </div>
          </div>
        </div>
        <div class="danger-zone">
            <h4>Danger Zone</h4>
            <p class="danger-text">The following actions are destructive and cannot be undone.</p>
            
            <div class="danger-actions">
                <div class="danger-action">
                <div>
                    <h5>Reset Application</h5>
                    <p>This will reset the app settings and clear local data, but preserves your Google Sheet.</p>
                </div>
                <button id="reset-app" class="danger-button">Reset App</button>
                </div>
                
                <div class="danger-action">
                <div>
                    <h5>Clear All Data</h5>
                    <p>This will permanently delete all tasks, categories, and progress. Your Google Sheet will also be cleared.</p>
                </div>
                <button id="clear-all-data" class="danger-button">Clear All Data</button>
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
          // TODO: Implement non-blocking user notification (e.g., this.app.ui.showNotification('Synchronization started', 'info'))
          // alert('Synchronization started');
        } else {
          // TODO: Implement non-blocking user notification (e.g., this.app.ui.showNotification('Cannot sync while offline. Please check your internet connection.', 'warning'))
          // alert('Cannot sync while offline. Please check your internet connection.');
        }
      });
      
      // Copy sheet ID
      document.getElementById('copy-sheet-id')?.addEventListener('click', () => {
        const sheetIdInput = document.getElementById('spreadsheet-id');
        if (sheetIdInput) {
          sheetIdInput.select();
          document.execCommand('copy');
          // TODO: Implement non-blocking user notification (e.g., this.app.ui.showNotification('Sheet ID copied to clipboard!', 'success'))
          // alert('Sheet ID copied to clipboard!');
        }
      });
      
      // Reset app button
      document.getElementById('reset-app')?.addEventListener('click', () => {
        // The confirm dialog is a blocking operation, which is acceptable for such a destructive action.
        // We might replace it with a custom modal in the future for better UX, but for now, it's fine.
        if (confirm('WARNING: This will reset the entire application and delete all your data. This action cannot be undone. Are you absolutely sure?')) {
          this.resetApplication();
        }
      });
      // Clear all data button
    document.getElementById('clear-all-data')?.addEventListener('click', () => {
            this.showClearDataConfirmation();
        });
    
    // Show/hide credentials
    document.getElementById('show-client-id')?.addEventListener('click', () => {
        const input = document.getElementById('google-client-id');
        if (input.type === 'password') {
            input.type = 'text';
        } else {
            input.type = 'password';
        }
        });

    document.getElementById('show-api-key')?.addEventListener('click', () => {
    const input = document.getElementById('google-api-key');
    if (input.type === 'password') {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
    });

    // Save credentials
    document.getElementById('save-credentials')?.addEventListener('click', async () => {
    const clientId = document.getElementById('google-client-id').value.trim();
    const apiKey = document.getElementById('google-api-key').value.trim();
    const statusElement = document.getElementById('credentials-status');
    
    if (!clientId || !apiKey) {
        statusElement.textContent = 'Both fields are required';
        statusElement.className = 'status-text error';
        return;
    }
    
    try {
        // Save to storage
        await this.app.storage.set('google_client_id', clientId);
        await this.app.storage.set('google_api_key', apiKey);
        
        // Update in sync manager
        this.app.sync.CLIENT_ID = clientId;
        this.app.sync.API_KEY = apiKey;
        
        statusElement.textContent = 'Credentials saved successfully';
        statusElement.className = 'status-text success';
        
        // If sync was previously unauthorized due to missing credentials, re-authorize
        if (!this.app.sync.isAuthorized) {
        setTimeout(() => {
            statusElement.textContent = 'Attempting to authenticate with Google...';
            this.app.sync.authorize().then(() => {
            statusElement.textContent = 'Authentication successful!';
            this.refreshView();
            }).catch(error => {
            statusElement.textContent = 'Authentication failed: ' + error.message;
            statusElement.className = 'status-text error';
            });
        }, 1000);
        }
    } catch (error) {
        console.error('Error saving credentials:', error);
        statusElement.textContent = 'Error saving credentials: ' + error.message;
        statusElement.className = 'status-text error';
    }
    });
      // Calculate storage usage
      this.calculateStorageUsage();

      // Sign Out button
      document.getElementById('sign-out-button')?.addEventListener('click', async () => {
        try {
          await this.app.sync.signOut();
          // TODO: Show non-blocking notification for sign-out success/failure (e.g., this.app.ui.showNotification('Signed out successfully.', 'success'))
          await this.refreshView();
        } catch (error) {
          console.error('Error during sign out:', error);
          // TODO: Show non-blocking notification for sign-out success/failure (e.g., this.app.ui.showNotification('Sign out failed.', 'error'))
        }
      });

      // Sign In button
      document.getElementById('sign-in-button')?.addEventListener('click', async () => {
        try {
          // TODO: Show non-blocking notification for sign-in attempt/redirect (e.g., this.app.ui.showNotification('Redirecting to Google for sign-in...', 'info'))
          await this.app.sync.authorize();
          // If authorize() doesn't always redirect or for future proofing:
          // await this.refreshView(); 
        } catch (error) {
          console.error('Error during sign in:', error);
          // TODO: Show non-blocking notification for sign-in attempt/redirect (e.g., this.app.ui.showNotification('Sign in failed.', 'error'))
        }
      });
    }

    async refreshView() {
      const viewContainer = document.querySelector('.settings-view'); // Or specific container if settings view is nested
      if (viewContainer) {
        // If settings-view is the top-level container rendered by UIManager for this view
        if (this.app.ui.currentView === 'settings') { // Check if settings is the active view
            const mainContent = document.getElementById('view-container'); // Assuming 'view-container' is UIManager's target
            if (mainContent) {
                mainContent.innerHTML = await this.render();
            } else {
                 // Fallback if view-container is not found, directly update .settings-view's parent or self.
                 // This depends on how UIManager renders views. For simplicity, let's assume settings-view is the root.
                if (viewContainer.parentElement && viewContainer.parentElement.id === 'view-container') {
                    viewContainer.parentElement.innerHTML = await this.render();
                } else { // If settings-view is the direct child of view-container or structure is different
                    viewContainer.innerHTML = await this.render(); // This might cause nested settings-view if not handled carefully
                }
            }
        }
      } else {
          // If the primary container isn't found, attempt to re-render through UIManager if possible
          // This path is less ideal as it implies the view structure is not as expected.
          console.warn('Settings view container not found, attempting full UIManager view switch.');
          if (this.app.ui && this.app.ui.switchView) {
            this.app.ui.switchView('settings'); // This will re-render and re-initialize
            return; // switchView usually handles re-initialization.
          }
      }
      this.initializeEventListeners(); // Re-attach listeners to the new DOM
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

    // Show multi-step confirmation dialog for clearing all data
    showClearDataConfirmation() {
        // Create dialog overlay
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        
        // Create confirmation dialog
        overlay.innerHTML = `
        <div class="dialog clear-data-dialog">
            <div class="dialog-header">
            <h2>Clear All Data</h2>
            <button type="button" class="close-button" id="cancel-clear-data">×</button>
            </div>
            
            <div class="dialog-content">
            <div class="warning-icon">⚠️</div>
            <h3>Warning: Destructive Action</h3>
            <p>You are about to permanently delete <strong>all</strong> of your TaskMaster data, including:</p>
            <ul>
                <li>All tasks (completed and pending)</li>
                <li>All categories and subcategories</li>
                <li>Your progress, level, and achievements</li>
                <li>All data in your Google Sheet</li>
            </ul>
            
            <p class="warning-text">This action <strong>cannot be undone</strong>. Deleted data cannot be recovered.</p>
            
            <div class="confirmation-input">
                <label for="confirmation-text">Type "DELETE ALL MY DATA" to confirm:</label>
                <input type="text" id="confirmation-text" class="form-control" placeholder="Type confirmation phrase here">
            </div>
            </div>
            
            <div class="dialog-actions">
            <button type="button" id="cancel-clear-data-btn" class="secondary-button">Cancel</button>
            <button type="button" id="confirm-clear-data" class="danger-button" disabled>Clear All Data</button>
            </div>
        </div>
        `;
        
        // Add to document
        document.body.appendChild(overlay);
        
        // Add event listeners
        document.getElementById('cancel-clear-data')?.addEventListener('click', () => {
        overlay.remove();
        });
        
        document.getElementById('cancel-clear-data-btn')?.addEventListener('click', () => {
        overlay.remove();
        });
        
        // Enable/disable confirm button based on correct confirmation text
        const confirmInput = document.getElementById('confirmation-text');
        const confirmButton = document.getElementById('confirm-clear-data');
        
        confirmInput?.addEventListener('input', (e) => {
        if (confirmButton) {
            confirmButton.disabled = e.target.value !== 'DELETE ALL MY DATA';
        }
        });
        
        // Handle final confirmation
        confirmButton?.addEventListener('click', async () => {
        if (confirmInput?.value === 'DELETE ALL MY DATA') {
            overlay.remove();
            this.showFinalConfirmation();
        }
        });
    }
    
    // Show final confirmation with countdown
    showFinalConfirmation() {
        // Create dialog overlay
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        
        // Create confirmation dialog
        overlay.innerHTML = `
        <div class="dialog clear-data-dialog">
            <div class="dialog-header">
            <h2>Final Confirmation</h2>
            <button type="button" class="close-button" id="cancel-final-clear">×</button>
            </div>
            
            <div class="dialog-content">
            <div class="warning-icon">🛑</div>
            <h3>Point of No Return</h3>
            <p>Are you absolutely certain you want to delete all your data?</p>
            <p>Once you click "Confirm", the process will begin and cannot be stopped.</p>
            
            <div class="countdown-timer">
                <p>Proceeding in <span id="countdown">5</span> seconds...</p>
                <div class="progress-bar-large">
                <div class="progress-bar-fill" id="countdown-bar" style="width: 100%"></div>
                </div>
            </div>
            </div>
            
            <div class="dialog-actions">
            <button type="button" id="cancel-final-clear-btn" class="secondary-button">Cancel</button>
            <button type="button" id="confirm-final-clear" class="danger-button">Confirm</button>
            </div>
        </div>
        `;
        
        // Add to document
        document.body.appendChild(overlay);
        
        // Add event listeners for cancel buttons
        document.getElementById('cancel-final-clear')?.addEventListener('click', () => {
        clearInterval(countdownInterval);
        overlay.remove();
        });
        
        document.getElementById('cancel-final-clear-btn')?.addEventListener('click', () => {
        clearInterval(countdownInterval);
        overlay.remove();
        });
        
        // Final confirmation button
        document.getElementById('confirm-final-clear')?.addEventListener('click', () => {
        clearInterval(countdownInterval);
        overlay.remove();
        this.executeDataClear();
        });
        
        // Countdown timer
        let seconds = 5;
        const countdownElement = document.getElementById('countdown');
        const countdownBar = document.getElementById('countdown-bar');
        
        const countdownInterval = setInterval(() => {
        seconds--;
        
        if (countdownElement) {
            countdownElement.textContent = seconds;
        }
        
        if (countdownBar) {
            countdownBar.style.width = `${(seconds / 5) * 100}%`;
        }
        
        if (seconds <= 0) {
            clearInterval(countdownInterval);
            overlay.remove();
            this.executeDataClear();
        }
        }, 1000);
    }
    
    // Actually perform the data clearing
    async executeDataClear() {
        try {
        // Show loading overlay
        this.app.ui.showLoadingMessage('Clearing all data...');
        
        // 1. Clear Google Sheet
        if (this.app.sync.isAuthorized && this.app.sync.spreadsheetId) {
            await this.clearGoogleSheet();
        }
        
        // 2. Clear all local storage
        await this.app.storage.clear('tasks');
        await this.app.storage.clear('categories');
        await this.app.storage.clear('user_data');
        await this.app.storage.clear('sync_queue');
        
        // 3. Reset gamification system
        if (this.app.gamification) {
            await this.app.gamification.initializeUserProfile();
        }
        
        // 4. Reset daily missions
        if (this.app.dailyMissions) {
            await this.app.storage.delete('daily_missions', 'user_data');
        }
        
        // 5. Keep API credentials to avoid re-setup
        // (We don't clear google_client_id and google_api_key)
        
        // 6. Show success message
        // TODO: Implement non-blocking user notification (e.g., this.app.ui.showNotification('All data has been successfully cleared.', 'success'))
        // alert('All data has been successfully cleared.');
        
        // 7. Reload the application (like a fresh start)
        window.location.reload();
        } catch (error) {
        console.error('Error clearing data:', error);
        // TODO: Implement non-blocking user notification (e.g., this.app.ui.showNotification('An error occurred while clearing data: ' + error.message, 'error'))
        // alert('An error occurred while clearing data: ' + error.message);
        }
    }
    
    // Clear Google Sheet data
    async clearGoogleSheet() {
        try {
        // First, ensure we're authorized
        if (!this.app.sync.isAuthorized) {
            await this.app.sync.authorize();
        }
        
        // For each sheet, clear all data except headers
        const sheets = ['Tasks', 'Categories', 'UserProfile', 'Settings'];
        
        for (const sheetName of sheets) {
            // Clear all data except headers (row 1)
            await this.app.sync.gapi.client.sheets.spreadsheets.values.clear({
            spreadsheetId: this.app.sync.spreadsheetId,
            range: `${sheetName}!A2:Z`
            });
        }
        
        return true;
        } catch (error) {
        console.error('Error clearing Google Sheet:', error);
        throw new Error('Failed to clear Google Sheet: ' + error.message);
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
        // TODO: Implement non-blocking user notification (e.g., this.app.ui.showNotification('Application reset successful. The page will now reload.', 'success'))
        // alert('Application reset successful. The page will now reload.');
        
        // Reload the page
        window.location.reload();
      } catch (error) {
        console.error('Error resetting application:', error);
        // TODO: Implement non-blocking user notification (e.g., this.app.ui.showNotification('Failed to reset application: ' + error.message, 'error'))
        // alert('Failed to reset application: ' + error.message);
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