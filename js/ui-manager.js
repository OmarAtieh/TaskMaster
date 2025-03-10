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
    async showOnboarding() {
      // Show initial onboarding UI with first step only
      this.appElement.innerHTML = `
        <div class="onboarding-container">
          <div class="onboarding-header">
            <div class="app-logo">${this.graphics.getAppLogo(80)}</div>
            <h1>Welcome to TaskMaster</h1>
          </div>
          
          <div class="onboarding-content">
            <div class="step-indicator">
              <div class="step active">1</div>
              <div class="step-line"></div>
              <div class="step">2</div>
              <div class="step-line"></div>
              <div class="step">3</div>
              <div class="step-line"></div>
              <div class="step">4</div>
            </div>
            
            <div id="onboarding-step-content">
              <!-- Step content will be loaded here -->
            </div>
          </div>
        </div>
      `;
      
      // Start the sequential onboarding process
      await this.startOnboardingSequence();
    }
    
    // New method to handle the sequential onboarding process
    async startOnboardingSequence() {
      try {
        // Step 1: Personalization preferences
        await this.showOnboardingStep1();
        
        // Step 2: Check and collect API credentials
        const hasCredentials = await this.checkAndCollectCredentials();
        if (!hasCredentials) return; // Process paused for user input
        
        // Step 3: Authenticate with Google
        const isAuthenticated = await this.checkAndPerformAuthentication();
        if (!isAuthenticated) return; // Process paused for user action
        
        // Step 4: Initialize Google Sheets
        const sheetInitialized = await this.checkAndInitializeSheets();
        if (!sheetInitialized) return; // Process paused for user action
        
        // Final step: Setup complete
        await this.showOnboardingComplete();
        
        // Complete the onboarding process
        await this.app.completeSetup();
      } catch (error) {
        console.error('Onboarding sequence error:', error);
        this.showOnboardingError(error.message);
      }
    }
    
    // Step 1: Collect personalization preferences
    async showOnboardingStep1() {
      const titleThemes = [
        { id: 'fantasy', name: 'Fantasy Adventure' },
        { id: 'professional', name: 'Career Growth' },
        { id: 'academic', name: 'Academic Achievement' },
        { id: 'athletic', name: 'Athletic Progress' },
        { id: 'spiritual', name: 'Spiritual Journey' }
      ];
      
      const stepContent = document.getElementById('onboarding-step-content');
      stepContent.innerHTML = `
        <div class="onboarding-step">
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
          
          <div class="onboarding-actions">
            <button id="next-button" class="primary-button">Continue</button>
          </div>
        </div>
      `;
      
      // Update the step indicators
      this.updateStepIndicators(1);
      
      // Return a promise that resolves when the user clicks Continue
      return new Promise(resolve => {
        document.getElementById('next-button').addEventListener('click', () => {
          this.saveInitialPreferences();
          resolve(true);
        });
        
        // Apply theme preference immediately if changed
        document.getElementById('theme-preference').addEventListener('change', (e) => {
          this.app.applyTheme(e.target.value);
        });
      });
    }
    
    // Step 2: Check for API credentials and collect if needed
    async checkAndCollectCredentials() {
      // Check if credentials exist
      let clientId = await this.app.storage.get('google_client_id');
      let apiKey = await this.app.storage.get('google_api_key');
  
      // Ensure credentials are not just empty strings
      if (clientId && apiKey && clientId.trim() !== "" && apiKey.trim() !== "") {
          this.app.sync.CLIENT_ID = clientId;
          this.app.sync.API_KEY = apiKey;
          
          // Update step indicators and move to the next step
          this.updateStepIndicators(2, true);
          return true;
      }
  
      // No valid credentials, prompt user to enter them
      this.showCredentialsForm();
      return false;
  }
    
    // Step 3: Check and perform Google authentication
    async checkAndPerformAuthentication() {
      // Ensure authentication only starts when the user clicks the button
      const stepContent = document.getElementById('onboarding-step-content');
      stepContent.innerHTML = `
          <div class="onboarding-step">
              <h2>Connect to Google</h2>
              <p>Click below to authorize TaskMaster to access Google Sheets.</p>
              <div class="onboarding-actions">
                  <button id="prev-button" class="secondary-button">Back</button>
                  <button id="auth-button" class="primary-button">Connect with Google</button>
              </div>
          </div>
      `;
  
      document.getElementById('prev-button').addEventListener('click', () => {
          this.checkAndCollectCredentials();
      });
  
      return new Promise(resolve => {
          document.getElementById('auth-button').addEventListener('click', async () => {
              try {
                  const authResult = await this.app.sync.authorize();
                  if (authResult.success) {
                      resolve(true);
                  } else {
                      throw new Error(authResult.message);
                  }
              } catch (error) {
                  console.error('Authentication failed:', error);
                  this.showCredentialEntryScreen(error.message);
                  resolve(false);
              }
          });
      });
  }
  
  
    
    // Step 4: Check and initialize Google Sheets
    async checkAndInitializeSheets() {
      // Show initialization step
      const stepContent = document.getElementById('onboarding-step-content');
      stepContent.innerHTML = `
        <div class="onboarding-step">
          <h2>Setting up Google Sheets</h2>
          <p>We're creating a spreadsheet to store your tasks and progress.</p>
          
          <div class="loading-status" id="sheets-status">
            <div class="spinner"></div>
            <p>Setting up Google Sheets...</p>
          </div>
          
          <div class="onboarding-actions" id="sheets-actions" style="display: none;">
            <button id="prev-button" class="secondary-button">Back</button>
            <button id="retry-button" class="primary-button">Retry</button>
          </div>
        </div>
      `;
      
      // Update the step indicators
      this.updateStepIndicators(4);
      
      // Try to initialize sheets
      try {
        const result = await this.app.sync.initializeSheets();
        
        const statusDiv = document.getElementById('sheets-status');
        
        if (result.success) {
          // Successful initialization
          statusDiv.innerHTML = `
            <div class="success-icon">✓</div>
            <p>Google Sheets setup complete!</p>
          `;
          
          // Short delay then move to next step
          await new Promise(resolve => setTimeout(resolve, 1500));
          return true;
        } else {
          // Initialization failed
          statusDiv.innerHTML = `
            <div class="error-icon">❌</div>
            <p>Google Sheets setup failed: ${result.message}</p>
          `;
          
          document.getElementById('sheets-actions').style.display = 'flex';
          
          // Return a promise that resolves when sheets are initialized
          return new Promise(resolve => {
            document.getElementById('prev-button').addEventListener('click', () => {
              this.checkAndPerformAuthentication().then(() => resolve(false));
            });
            
            document.getElementById('retry-button').addEventListener('click', async () => {
              try {
                statusDiv.innerHTML = `
                  <div class="spinner"></div>
                  <p>Retrying Google Sheets setup...</p>
                `;
                document.getElementById('sheets-actions').style.display = 'none';
                
                const newResult = await this.app.sync.initializeSheets();
                
                if (newResult.success) {
                  statusDiv.innerHTML = `
                    <div class="success-icon">✓</div>
                    <p>Google Sheets setup complete!</p>
                  `;
                  
                  // Short delay then move to next step
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  resolve(true);
                } else {
                  throw new Error(newResult.message);
                }
              } catch (error) {
                console.error('Sheets initialization failed:', error);
                statusDiv.innerHTML = `
                  <div class="error-icon">❌</div>
                  <p>Google Sheets setup failed: ${error.message}</p>
                `;
                document.getElementById('sheets-actions').style.display = 'flex';
              }
            });
          });
        }
      } catch (error) {
        console.error('Error initializing sheets:', error);
        
        const statusDiv = document.getElementById('sheets-status');
        statusDiv.innerHTML = `
          <div class="error-icon">❌</div>
          <p>Error initializing Google Sheets: ${error.message}</p>
        `;
        
        document.getElementById('sheets-actions').style.display = 'flex';
        
        // Return a promise that resolves when sheets are initialized
        return new Promise(resolve => {
          document.getElementById('prev-button').addEventListener('click', () => {
            this.checkAndPerformAuthentication().then(() => resolve(false));
          });
          
          document.getElementById('retry-button').addEventListener('click', async () => {
            try {
              statusDiv.innerHTML = `
                <div class="spinner"></div>
                <p>Retrying Google Sheets setup...</p>
              `;
              document.getElementById('sheets-actions').style.display = 'none';
              
              const result = await this.app.sync.initializeSheets();
              
              if (result.success) {
                resolve(true);
              } else {
                throw new Error(result.message);
              }
            } catch (error) {
              console.error('Sheets initialization failed:', error);
              alert('Sheets initialization failed: ' + error.message);
            }
          });
        });
      }
    }
    
    // Show the completion step
    async showOnboardingComplete() {
      const stepContent = document.getElementById('onboarding-step-content');
      stepContent.innerHTML = `
        <div class="onboarding-step">
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
          
          <div class="onboarding-actions">
            <button id="finish-button" class="primary-button">Get Started</button>
          </div>
        </div>
      `;
      
      // Complete all step indicators
      this.updateAllStepIndicators();
      
      // Return a promise that resolves when user clicks Get Started
      return new Promise(resolve => {
        document.getElementById('finish-button').addEventListener('click', () => {
          resolve(true);
        });
      });
    }
    
    // Show an error during onboarding
    showOnboardingError(message) {
      const stepContent = document.getElementById('onboarding-step-content');
      stepContent.innerHTML = `
        <div class="onboarding-step">
          <h2>Oops! Something went wrong</h2>
          <p>${message}</p>
          
          <div class="onboarding-actions">
            <button id="restart-button" class="primary-button">Restart Setup</button>
          </div>
        </div>
      `;
      
      document.getElementById('restart-button').addEventListener('click', () => {
        window.location.reload();
      });
    }
    
    // Update step indicators to show current step
    updateStepIndicators(currentStep) {
      const stepIndicators = document.querySelectorAll('.step-indicator .step');
      
      stepIndicators.forEach((indicator, index) => {
        // Step number is index + 1
        const stepNumber = index + 1;
        
        if (stepNumber < currentStep) {
          // Previous steps are completed
          indicator.classList.remove('active');
          indicator.classList.add('completed');
        } else if (stepNumber === currentStep) {
          // Current step is active
          indicator.classList.add('active');
          indicator.classList.remove('completed');
        } else {
          // Future steps are neither active nor completed
          indicator.classList.remove('active');
          indicator.classList.remove('completed');
        }
      });
    }
    
    // Mark a specific step as completed
    updateStepIndicators(stepNumber, completed = false) {
      const stepIndicators = document.querySelectorAll('.step-indicator .step');
      
      stepIndicators.forEach((indicator, index) => {
        const thisStepNumber = index + 1;
        
        if (thisStepNumber === stepNumber) {
          if (completed) {
            indicator.classList.remove('active');
            indicator.classList.add('completed');
          } else {
            indicator.classList.add('active');
            indicator.classList.remove('completed');
          }
        }
      });
    }
    
    // Mark all steps as completed
    updateAllStepIndicators() {
      const stepIndicators = document.querySelectorAll('.step-indicator .step');
      
      stepIndicators.forEach(indicator => {
        indicator.classList.remove('active');
        indicator.classList.add('completed');
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
    showCredentialsForm() {
      // Replace the current content with credentials form
      this.appElement.innerHTML = `
        <div class="credentials-container">
          <div class="credentials-header">
            <div class="app-logo">${this.graphics.getAppLogo(80)}</div>
            <h1>Google API Setup Required</h1>
          </div>
          
          <div class="credentials-content">
            <p>TaskMaster needs Google API credentials to sync with Google Sheets.</p>
            <p>You only need to set this up once.</p>
            
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
            
            <div class="credentials-actions">
              <button id="save-credentials-btn" class="primary-button">Save Credentials</button>
            </div>
          </div>
        </div>
      `;
      
      // Add event listener for the save button
      document.getElementById('save-credentials-btn').addEventListener('click', async () => {
        const clientId = document.getElementById('google-client-id').value.trim();
        const apiKey = document.getElementById('google-api-key').value.trim();
        
        if (!clientId || !apiKey) {
          alert('Please enter both Google API credentials to continue.');
          return;
        }
        
        try {
          // Show loading message
          this.showLoadingOverlay('Saving credentials...');
          
          // Save credentials
          await this.app.storage.set('google_client_id', clientId);
          await this.app.storage.set('google_api_key', apiKey);
          
          // Update sync manager
          this.app.sync.CLIENT_ID = clientId;
          this.app.sync.API_KEY = apiKey;
          
          // Try to authorize with the new credentials
          this.showLoadingOverlay('Connecting to Google...');
          
          try {
            const authResult = await this.app.sync.authorize();
            
            // Add explicit null/undefined check
            if (!authResult) {
              throw new Error('Authorization returned no result');
            }
            
            if (authResult.success) {
              // Authorization successful
              this.showLoadingOverlay('Setting up Google Sheets...');
              
              try {
                // Try to initialize sheets
                const sheetResult = await this.app.sync.initializeSheets();
                
                if (!sheetResult) {
                  throw new Error('Sheet initialization returned no result');
                }
                
                if (sheetResult.success) {
                  // Sheets initialized successfully
                  this.showLoadingOverlay('Setup complete, loading app...');
                  await this.app.normalStartup();
                } else {
                  // Sheet initialization failed
                  throw new Error(sheetResult.message || 'Failed to initialize Google Sheets');
                }
              } catch (sheetError) {
                console.error('Sheet initialization error:', sheetError);
                alert('Credentials saved and authorized, but sheet setup failed: ' + 
                      (sheetError.message || 'Unknown error'));
                window.location.reload();
              }
            } else {
              // Authorization failed with an error object
              throw new Error(authResult.message || 'Authorization failed with no details');
            }
          } catch (authError) {
            // Handle authorization errors
            console.error('Authorization error:', authError);
            alert('Credentials saved, but Google authorization failed: ' + 
                  (authError.message || 'Unknown authorization error'));
            
            // Reload to try again
            window.location.reload();
          }
        } catch (error) {
          // Handle general errors
          console.error('Error saving credentials:', error);
          alert('Error saving credentials: ' + (error.message || 'Unknown error'));
        }
      });
    }
    
    // Helper method to show loading overlay
    showLoadingOverlay(message) {
      // Create or update loading overlay
      let overlay = document.querySelector('.loading-overlay');
      
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        document.body.appendChild(overlay);
      }
      
      overlay.innerHTML = `
        <div class="loading-content">
          <div class="spinner"></div>
          <p>${message}</p>
        </div>
      `;
    }
    
    // Add a helper method to show loading overlay
    showLoadingOverlay(message) {
      // Create or update loading overlay
      let overlay = document.querySelector('.loading-overlay');
      
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        document.body.appendChild(overlay);
      }
      
      overlay.innerHTML = `
        <div class="loading-content">
          <div class="spinner"></div>
          <p>${message}</p>
        </div>
      `;
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
    // Show a more user-friendly setup error with options
    showSetupOptionsError(error, retryCallback) {
      this.appElement.innerHTML = `
        <div class="error-container">
          <div class="error-header">
            <div class="app-logo">${this.graphics.getAppLogo(64)}</div>
            <h1>Setup Encountered an Issue</h1>
          </div>
          
          <div class="error-content">
            <p>${error.message || 'An error occurred during setup.'}</p>
            
            <div class="error-options">
              <div class="error-option">
                <h3>Try Again</h3>
                <p>Retry the setup process from the beginning.</p>
                <button id="retry-setup" class="primary-button">Retry Setup</button>
              </div>
              
              <div class="error-option">
                <h3>Update Google API Credentials</h3>
                <p>Enter new Google API credentials.</p>
                <button id="update-api-credentials" class="secondary-button">Update Credentials</button>
              </div>
              
              <div class="error-option">
                <h3>Start Fresh</h3>
                <p>Reset the application and start from scratch.</p>
                <button id="reset-app" class="tertiary-button">Reset Application</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      document.getElementById('retry-setup').addEventListener('click', retryCallback);
      document.getElementById('update-api-credentials').addEventListener('click', () => {
        this.showCredentialsForm();
      });
      document.getElementById('reset-app').addEventListener('click', async () => {
        if (confirm('This will reset the application completely. Continue?')) {
          await this.app.storage.clear('user_data');
          window.location.reload();
        }
      });
    }

    showStartError(error) {
      this.appElement.innerHTML = `
        <div class="error-container">
          <div class="error-header">
            <div class="app-logo">${this.graphics.getAppLogo(64)}</div>
            <h1>Startup Error</h1>
          </div>
          
          <div class="error-content">
            <p>${error.message || 'An error occurred during startup.'}</p>
            
            <div class="error-options">
              <div class="error-option">
                <h3>Try Again</h3>
                <p>Retry loading the application.</p>
                <button id="retry-startup" class="primary-button">Retry</button>
              </div>
              
              <div class="error-option">
                <h3>Update Google API Credentials</h3>
                <p>Update your Google API credentials.</p>
                <button id="update-credentials" class="secondary-button">Update Credentials</button>
              </div>
              
              <div class="error-option">
                <h3>Reset Application</h3>
                <p>Clear all data and start fresh.</p>
                <button id="reset-app" class="tertiary-button">Reset Application</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      document.getElementById('retry-startup').addEventListener('click', () => {
        window.location.reload();
      });
      
      document.getElementById('update-credentials').addEventListener('click', () => {
        this.showCredentialsForm();
      });
      
      document.getElementById('reset-app').addEventListener('click', async () => {
        if (confirm('This will reset the application completely. All data will be lost. Continue?')) {
          await this.app.storage.clear('user_data');
          window.location.reload();
        }
      });
    }

    showCredentialEntryScreen(errorMessage = "Authentication failed. Please re-enter your credentials.") {
      const appElement = document.getElementById('app');
      appElement.innerHTML = `
          <div class="auth-error-screen">
              <h2>Google Authentication Required</h2>
              <p>${errorMessage}</p>
              <button id="retry-auth" class="primary-button">Re-enter Credentials</button>
          </div>
      `;
  
      document.getElementById("retry-auth").addEventListener("click", async () => {
          console.log("User opted to re-enter credentials.");
          await this.app.storage.remove("google_client_id");
          await this.app.storage.remove("google_api_key");
          this.showCredentialsForm();
      });
  }
  
  }
  
  // Export the class if in Node.js environment
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIManager };
  } else {
    // Browser context
    window.UIManager = UIManager;
  }