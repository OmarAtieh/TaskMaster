// ui-manager.js - UI components and interactions

class UIManager {
    constructor(app) {
      this.app = app;
      this.graphics = app.graphics;
      this.currentView = 'tasks';
      this.views = {
        tasks: null,
        daily: null,
        progress: null,
        achievements: null,
        settings: null
      };
      
      // Setup DOM references
      this.appElement = document.getElementById('app');
    }
    
    // Show the initial onboarding UI
    showOnboarding() {
        const titleThemes = [
          { id: 'fantasy', name: 'Fantasy Adventure' },
          { id: 'professional', name: 'Career Growth' },
          { id: 'academic', name: 'Academic Achievement' },
          { id: 'athletic', name: 'Athletic Progress' },
          { id: 'spiritual', name: 'Spiritual Journey' }
        ];
        
        // Replace the loading screen with onboarding UI
        this.appElement.innerHTML = `
          <div class="onboarding-container">
            <div class="onboarding-header">
              <div class="app-logo">${this.graphics.getAppLogo(80)}</div>
              <h1>Welcome to TaskMaster</h1>
            </div>
            
            <div class="onboarding-steps">
              <div class="step active" id="step-1">
                <h2>Let's personalize your experience</h2>
                <p>Choose how TaskMaster should motivate you:</p>
                
                <div class="form-group">
                  <label for="title-theme">Achievement Style:</label>
                  <select id="title-theme" class="form-control">
                    ${titleThemes.map(theme => 
                      `<option value="${theme.id}">${theme.name}</option>`
                    ).join('')}
                  </select>
                  <p class="help-text">This determines how your progress titles will be themed</p>
                </div>
                
                <div class="form-group">
                  <label for="theme-preference">Theme:</label>
                  <select id="theme-preference" class="form-control">
                    <option value="auto">Auto (Follow System)</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label>
                    <input type="checkbox" id="enable-notifications" checked>
                    Enable notifications for task reminders
                  </label>
                </div>
                
                <div class="form-group">
                  <label>
                    <input type="checkbox" id="enable-sounds" checked>
                    Enable sound effects
                  </label>
                </div>
                
                <button id="next-button" class="primary-button">Continue</button>
              </div>
              
              <div class="step" id="step-2">
                <h2>Set up Google API</h2>
                <p>TaskMaster uses Google Sheets to securely store and sync your tasks across devices.</p>
                <p>You'll need to provide your own Google API credentials:</p>
                
                <div class="form-group">
                  <label for="google-client-id">Client ID:</label>
                  <input type="text" id="google-client-id" class="form-control" placeholder="Your Google OAuth 2.0 Client ID">
                </div>
                
                <div class="form-group">
                  <label for="google-api-key">API Key:</label>
                  <input type="text" id="google-api-key" class="form-control" placeholder="Your Google API Key">
                </div>
                
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
                
                <button id="prev-button-2" class="secondary-button">Back</button>
                <button id="next-button-2" class="primary-button">Continue</button>
              </div>
              
              <div class="step" id="step-3">
                <h2>Connect to Google</h2>
                <p>Now let's connect to your Google account to set up the spreadsheet.</p>
                <p>Your data remains private in your own Google account.</p>
                
                <button id="google-auth-button" class="primary-button">
                  Connect with Google
                </button>
                
                <p class="help-text">We only request access to a single spreadsheet created specifically for TaskMaster.</p>
                
                <button id="prev-button-3" class="secondary-button">Back</button>
              </div>
              
              <div class="step" id="step-4">
                <h2>You're all set!</h2>
                <p>TaskMaster is ready to help you be more productive.</p>
                <p>We've set up some default categories to get you started:</p>
                
                <ul class="category-list">
                  <li>Work</li>
                  <li>Personal</li>
                  <li>Health</li>
                  <li>Education</li>
                  <li>Finance</li>
                  <li>Spiritual</li>
                  <li>Mental Wellbeing</li>
                </ul>
                
                <button id="finish-setup-button" class="primary-button">Get Started</button>
              </div>
            </div>
          </div>
        `;
        
        // Add event listeners
        document.getElementById('next-button').addEventListener('click', () => {
          this.saveInitialPreferences();
          this.showOnboardingStep(2);
        });
        
        document.getElementById('prev-button-2').addEventListener('click', () => {
          this.showOnboardingStep(1);
        });
        
        document.getElementById('next-button-2').addEventListener('click', async () => {
          const clientId = document.getElementById('google-client-id').value.trim();
          const apiKey = document.getElementById('google-api-key').value.trim();
          
          if (!clientId || !apiKey) {
            alert('Please enter both Google API credentials to continue.');
            return;
          }
          
          try {
            // Save credentials
            await this.app.storage.set('google_client_id', clientId);
            await this.app.storage.set('google_api_key', apiKey);
            
            // Update sync manager
            this.app.sync.CLIENT_ID = clientId;
            this.app.sync.API_KEY = apiKey;
            
            this.showOnboardingStep(3);
          } catch (error) {
            console.error('Error saving credentials:', error);
            alert('Error saving credentials: ' + error.message);
          }
        });
        
        document.getElementById('prev-button-3').addEventListener('click', () => {
          this.showOnboardingStep(2);
        });
        
        document.getElementById('google-auth-button').addEventListener('click', async () => {
          try {
            await this.app.sync.authorize();
            this.showOnboardingStep(4);
          } catch (error) {
            console.error('Google authorization failed:', error);
            alert('Google authorization failed: ' + error.message);
          }
        });
        
        document.getElementById('finish-setup-button').addEventListener('click', async () => {
          try {
            await this.completeSetup();
          } catch (error) {
            console.error('Setup completion failed:', error);
            alert('Setup failed: ' + error.message);
          }
        });
        
        // Apply theme preference immediately if changed
        document.getElementById('theme-preference').addEventListener('change', (e) => {
          this.app.applyTheme(e.target.value);
        });
      }
    
    // Show specific onboarding step
    showOnboardingStep(stepNumber) {
      const steps = document.querySelectorAll('.onboarding-steps .step');
      steps.forEach((step, index) => {
        if (index + 1 === stepNumber) {
          step.classList.add('active');
        } else {
          step.classList.remove('active');
        }
      });
    }
    
    // Save initial user preferences
    async saveInitialPreferences() {
      const titleTheme = document.getElementById('title-theme').value;
      const themePreference = document.getElementById('theme-preference').value;
      const notificationsEnabled = document.getElementById('enable-notifications').checked;
      const soundEnabled = document.getElementById('enable-sounds').checked;
      
      const preferences = {
        titleTheme,
        theme: themePreference,
        notificationsEnabled,
        soundEnabled,
        // Additional default settings
        syncIntervalMinutes: 5,
        dailyReminderEnabled: true,
        dailyReminderTime: '09:00',
        setup_completed_at: new Date().toISOString()
      };
      
      await this.app.savePreferences(preferences);
    }
    
    // Complete the setup process
    async completeSetup() {
      // This will be called when the user finishes onboarding
      await this.app.storage.set('app_initialized', true);
      await this.app.normalStartup();
    }
    
    // Render the main application UI
    renderMainApp() {
      // Replace current content with app layout
      this.appElement.innerHTML = `
        <div class="app-container">
          <header class="app-header">
            <div class="app-title-container">
              <div class="app-logo-small">${this.graphics.getAppLogo(32)}</div>
              <h1 class="app-title">TaskMaster</h1>
            </div>
            <div class="header-actions">
              <button id="theme-toggle" class="icon-button" title="Toggle theme">
                ${this.getThemeIcon()}
              </button>
              <div class="level-indicator" title="Current level">
                <span id="user-level">5</span>
              </div>
            </div>
          </header>
          
          <nav class="tab-bar">
            <div class="tab active" data-view="tasks">Tasks</div>
            <div class="tab" data-view="daily">Daily</div>
            <div class="tab" data-view="progress">Progress</div>
            <div class="tab" data-view="achievements">Achievements</div>
            <div class="tab" data-view="settings">Settings</div>
          </nav>
          
          <main class="content-area" id="view-container">
            <!-- View content will be rendered here -->
            <div class="loading">Loading view...</div>
          </main>
          
          <nav class="bottom-nav">
            <div class="nav-item active" data-view="tasks">
              <span class="nav-icon">📋</span>
              <span class="nav-label">Tasks</span>
            </div>
            <div class="nav-item" data-view="daily">
              <span class="nav-icon">📅</span>
              <span class="nav-label">Daily</span>
            </div>
            <div class="nav-item" data-view="progress">
              <span class="nav-icon">📊</span>
              <span class="nav-label">Progress</span>
            </div>
            <div class="nav-item" data-view="settings">
              <span class="nav-icon">⚙️</span>
              <span class="nav-label">Settings</span>
            </div>
          </nav>
          
          <div class="fab" id="add-task-button">+</div>
        </div>
      `;
      
      // Add event listeners
      this.addEventListeners();
      
      // Initialize and render the default view
      this.switchView('tasks');
      
      // Update UI with user data
      this.updateUserInfo();
    }
    
    // Add event listeners to the main UI
    addEventListeners() {
      // Tab navigation
      document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          this.switchView(e.target.dataset.view);
        });
      });
      
      // Mobile bottom navigation
      document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
          const view = e.currentTarget.dataset.view;
          this.switchView(view);
        });
      });
      
      // Add task button
      document.getElementById('add-task-button').addEventListener('click', () => {
        this.showAddTaskDialog();
      });
      
      // Theme toggle
      document.getElementById('theme-toggle').addEventListener('click', () => {
        this.toggleTheme();
      });
    }
    
    // Switch between views
    switchView(viewName) {
      // Validate view name
      if (!['tasks', 'daily', 'progress', 'achievements', 'settings'].includes(viewName)) {
        console.error('Invalid view name:', viewName);
        return;
      }
      
      // Update active tab indicators
      document.querySelectorAll('.tab').forEach(tab => {
        if (tab.dataset.view === viewName) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
      
      // Update mobile navigation
      document.querySelectorAll('.nav-item').forEach(item => {
        if (item.dataset.view === viewName) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
      
      // Store current view
      this.currentView = viewName;
      
      // Load and render the view
      this.loadView(viewName);
    }
    
    // Load and initialize a view
    async loadView(viewName) {
      const viewContainer = document.getElementById('view-container');
      viewContainer.innerHTML = '<div class="loading">Loading view...</div>';
      
      try {
        // Initialize the view if it hasn't been loaded yet
        if (!this.views[viewName]) {
          // This would normally dynamically import the view module
          // For now, we'll assume the global objects exist from script tags
          switch (viewName) {
            case 'tasks':
              this.views.tasks = new TasksView(this.app);
              break;
            case 'daily':
              this.views.daily = new DailyView(this.app);
              break;
            case 'progress':
              this.views.progress = new ProgressView(this.app);
              break;
            case 'achievements':
              this.views.achievements = new AchievementsView(this.app);
              break;
            case 'settings':
              this.views.settings = new SettingsView(this.app);
              break;
            default:
              throw new Error(`Unknown view: ${viewName}`);
          }
        }
        
        // Render the view
        const viewContent = await this.views[viewName].render();
        viewContainer.innerHTML = viewContent;
        
        // Initialize view-specific event handlers
        this.views[viewName].initializeEventListeners();
      } catch (error) {
        console.error(`Error loading view ${viewName}:`, error);
        viewContainer.innerHTML = `
          <div class="error-message">
            <h3>Error Loading View</h3>
            <p>${error.message}</p>
            <button class="retry-button">Retry</button>
          </div>
        `;
        
        // Add retry button listener
        viewContainer.querySelector('.retry-button').addEventListener('click', () => {
          this.loadView(viewName);
        });
      }
    }
    
    // Show add task dialog
    showAddTaskDialog() {
      // Implementation for add task dialog
      console.log('Add task dialog would appear here');
      // We'll implement this later
    }
    
    // Toggle between light and dark theme
    toggleTheme() {
      const currentTheme = this.app.preferences.theme;
      let newTheme;
      
      if (currentTheme === 'light') {
        newTheme = 'dark';
      } else if (currentTheme === 'dark') {
        newTheme = 'light';
      } else {
        // If it's 'auto', toggle between light and dark
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        newTheme = systemDark ? 'light' : 'dark';
      }
      
      // Update theme
      this.app.savePreferences({ theme: newTheme });
      
      // Update theme toggle icon
      document.getElementById('theme-toggle').innerHTML = this.getThemeIcon();
    }
    
    // Get theme toggle icon based on current theme
    getThemeIcon() {
      const currentTheme = this.app.preferences.theme;
      const isDark = currentTheme === 'dark' || 
                    (currentTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      if (isDark) {
        return '☀️'; // Sun for dark mode (switch to light)
      } else {
        return '🌙'; // Moon for light mode (switch to dark)
      }
    }
    
    // Update user info displays (level, points, etc)
    updateUserInfo() {
      const userLevel = document.getElementById('user-level');
      if (userLevel && this.app.gamification) {
        userLevel.textContent = this.app.gamification.userProfile.level || 1;
      }
      
      // We'll add more user info updates as those components are built
    }
    
    // Show the PWA installation prompt
    showInstallPrompt() {
      const prompt = document.createElement('div');
      prompt.className = 'install-prompt';
      prompt.innerHTML = `
        <div class="install-prompt-content">
          <h3>Add TaskMaster to Home Screen</h3>
          <p>Install TaskMaster for a better experience and offline access</p>
          <div class="install-buttons">
            <button id="install-later">Later</button>
            <button id="install-now" class="primary-button">Install</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(prompt);
      
      // Add event listeners
      document.getElementById('install-now').addEventListener('click', () => {
        // Show installation instructions
        prompt.innerHTML = `
          <div class="install-prompt-content">
            <h3>Installation Instructions</h3>
            <p>To install TaskMaster:</p>
            <ol>
              <li>Tap the menu button (⋮) in your browser</li>
              <li>Select "Add to Home Screen"</li>
              <li>Tap "Add" to confirm</li>
            </ol>
            <button id="install-close" class="primary-button">Got it</button>
          </div>
        `;
        
        document.getElementById('install-close').addEventListener('click', () => {
          prompt.remove();
        });
      });
      
      document.getElementById('install-later').addEventListener('click', () => {
        prompt.remove();
      });
    }
    
    // Update connection status indicator
    updateConnectionStatus(isOnline) {
      // Implementation depends on how we want to show connection status
      console.log('Connection status:', isOnline ? 'Online' : 'Offline');
      // We could add a visual indicator in the UI
    }
    
    // Show error screen
    showErrorScreen(title, message, retryCallback = null) {
      this.appElement.innerHTML = `
        <div class="error-screen">
          <div class="app-logo">${this.graphics.getAppLogo(64)}</div>
          <h1>${title}</h1>
          <p>${message}</p>
          ${retryCallback ? '<button id="retry-button" class="primary-button">Try Again</button>' : ''}
        </div>
      `;
      
      if (retryCallback) {
        document.getElementById('retry-button').addEventListener('click', retryCallback);
      }
    }
  }
  
  // Export the class if in Node.js environment
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIManager };
  } else {
    // Browser context
    window.UIManager = UIManager;
  }