// app.js - Main Application Entry Point
const APP_VERSION = '0.0.5'; // Increment this with each change
const BUILD_DATE = '2025-07-03';
const BUILD_NUMBER = '20'; // Can be incremented with each build
const environment = process.env.NODE_ENV || 'dev'; // Default to 'dev' if not set
const config = require('./config.json')[environment]; // Load environment-specific config
import { loadTranslations } from './translation-utils.js';

document.addEventListener('DOMContentLoaded', () => {
const app = new QuestifyApp();
});

class QuestifyApp {
    constructor() {
        this.config = {
            appName: 'Questify',
            version: '1.0.0',
            gSheetName: 'Questify-Data',
            syncIntervalMinutes: 5,
            notificationsEnabled: true,
            theme: 'auto', // 'light', 'dark', or 'auto'
            titleTheme: 'fantasy', // 'fantasy', 'professional', 'academic', etc.
            soundEnabled: true
        };
        // State
        this.initialized = false;
        this.online = navigator.onLine;
        this.syncPending = false;
        // Initialize modules
        this.initializeApp();
    }

    logAppVersion() {
        // Log version info to console
        console.log(
          `%c Questify v${APP_VERSION} (Build #${BUILD_NUMBER} - ${BUILD_DATE}) %c`,
          'background: #4a6fa5; color: white; padding: 5px; border-radius: 3px; font-weight: bold;',
          'color: #4a6fa5;'
        );
        // Log environment details
        console.log(`Running on: ${navigator.userAgent}`);
        console.log(`PWA installed: ${window.matchMedia('(display-mode: standalone)').matches ? 'Yes' : 'No'}`);
        // Ensure the version is displayed in the UI
        const versionDisplay = document.getElementById('version-display');
        if (versionDisplay) {
          versionDisplay.textContent = `v${APP_VERSION} (${BUILD_NUMBER})`;
          versionDisplay.title = `Built on ${BUILD_DATE}`;
        } else {
          console.warn('Version display element not found in the DOM');
        }
      }

      ensureUIMethodsExist() {
        // Make sure we have a reference to the app container
        this.appElement = this.appElement || document.getElementById('app') || document.body;
        
        // Create UI object if it doesn't exist
        if (!this.ui) {
          this.ui = {};
        }
        
        // Add showAuthError if not defined
        if (!this.ui.showAuthError) {
          this.ui.showAuthError = (message, retryCallback) => {
            this.appElement.innerHTML = `
              <div class="error-container">
                <div class="error-header">
                  ${this.graphics && this.graphics.getAppLogo ? 
                    `<div class="app-logo">${this.graphics.getAppLogo(64)}</div>` : 
                    '<div class="app-logo">📝</div>'}
                  <h1>Google Authorization Failed</h1>
                </div>
                
                <div class="error-content">
                  <p>${message}</p>
                  
                  <div class="error-actions">
                    <button id="retry-auth" class="primary-button">Try Again</button>
                    <button id="setup-credentials" class="secondary-button">Update Credentials</button>
                  </div>
                </div>
              </div>
            `;
            
            document.getElementById('retry-auth').addEventListener('click', () => {
              if (typeof retryCallback === 'function') {
                retryCallback();
              } else {
                window.location.reload();
              }
            });
            
            document.getElementById('setup-credentials').addEventListener('click', () => {
              if (this.showCredentialsForm) {
                this.showCredentialsForm();
              } else {
                window.location.reload();
              }
            });
          };
        }
        
        // Add showSheetsInitError if not defined
        if (!this.ui.showSheetsInitError) {
          this.ui.showSheetsInitError = (message, retryCallback) => {
            this.appElement.innerHTML = `
              <div class="error-container">
                <div class="error-header">
                  ${this.graphics && this.graphics.getAppLogo ? 
                    `<div class="app-logo">${this.graphics.getAppLogo(64)}</div>` : 
                    '<div class="app-logo">📝</div>'}
                  <h1>Google Sheets Setup Failed</h1>
                </div>
                
                <div class="error-content">
                  <p>${message}</p>
                  <p>This could be due to API restrictions or permissions issues.</p>
                  
                  <div class="help-text">
                    <strong>Possible solutions:</strong>
                    <ul>
                      <li>Make sure Google Sheets API is enabled in your Google Cloud project</li>
                      <li>Verify your API credentials have the correct permissions</li>
                      <li>Check that your domain is authorized in the Google Cloud Console</li>
                    </ul>
                  </div>
                  
                  <div class="error-actions">
                    <button id="retry-sheets" class="primary-button">Try Again</button>
                    <button id="update-credentials" class="secondary-button">Update Credentials</button>
                  </div>
                </div>
              </div>
            `;
            
            document.getElementById('retry-sheets').addEventListener('click', () => {
              if (typeof retryCallback === 'function') {
                retryCallback();
              } else {
                window.location.reload();
              }
            });
            
            document.getElementById('update-credentials').addEventListener('click', () => {
              if (this.ui.showCredentialsForm) {
                this.ui.showCredentialsForm();
              } else if (this.showCredentialsForm) {
                this.showCredentialsForm();
              } else {
                window.location.reload();
              }
            });
          };
        }
        
        // Add showSetupOptionsError if not defined
        if (!this.ui.showSetupOptionsError) {
          this.ui.showSetupOptionsError = (error, retryCallback) => {
            this.appElement.innerHTML = `
              <div class="error-container">
                <div class="error-header">
                  ${this.graphics && this.graphics.getAppLogo ? 
                    `<div class="app-logo">${this.graphics.getAppLogo(64)}</div>` : 
                    '<div class="app-logo">📝</div>'}
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
            
            document.getElementById('retry-setup').addEventListener('click', () => {
              if (typeof retryCallback === 'function') {
                retryCallback();
              } else {
                window.location.reload();
              }
            });
            
            document.getElementById('update-api-credentials').addEventListener('click', () => {
              if (this.ui.showCredentialsForm) {
                this.ui.showCredentialsForm();
              } else if (this.showCredentialsForm) {
                this.showCredentialsForm();
              } else {
                window.location.reload();
              }
            });
            
            document.getElementById('reset-app').addEventListener('click', async () => {
              if (confirm('This will reset the application completely. Continue?')) {
                if (this.storage) {
                  try {
                    await this.storage.clear();
                  } catch (e) {
                    console.error('Error clearing storage:', e);
                  }
                }
                window.location.reload();
              }
            });
          };
        }
        
        // Add showOnboardingError if not defined
        if (!this.ui.showOnboardingError) {
          this.ui.showOnboardingError = (message) => {
            this.appElement.innerHTML = `
              <div class="error-container">
                <div class="error-header">
                  ${this.graphics && this.graphics.getAppLogo ? 
                    `<div class="app-logo">${this.graphics.getAppLogo(64)}</div>` : 
                    '<div class="app-logo">📝</div>'}
                  <h1>Onboarding Error</h1>
                </div>
                
                <div class="error-content">
                  <p>${message}</p>
                  <button id="restart-button" class="primary-button">Restart Setup</button>
                </div>
              </div>
            `;
            
            document.getElementById('restart-button').addEventListener('click', () => {
              window.location.reload();
            });
          };
        }
        
        // Add checkPendingNotifications for NotificationManager compatibility
        if (this.notifications && !this.notifications.checkForPendingNotifications) {
          this.notifications.checkForPendingNotifications = () => {
            // If the actual method exists with a different name, call it
            if (this.notifications.checkPendingNotifications) {
              return this.notifications.checkPendingNotifications();
            }
            console.log('Pending notifications check skipped - method not implemented');
          };
        }
      }

      async checkResumeActions() {
        try {
          // Check if we need to resume an action after redirect
          const resumeAction = await this.storage.get('resumeAction');
          if (resumeAction) {
            // Clear the resume action right away to prevent loops
            await this.storage.remove('resumeAction');
            
            console.log('Resuming action after authentication:', resumeAction);
            
            // Make sure token is applied
            if (this.sync.gapi && this.sync.gapi.client && this.sync.gapi.client.getToken()) {
              console.log('Token is available for resumed action');
            } else {
              console.warn('No token available for resumed action!');
            }
            
            switch (resumeAction) {
              case 'createSpreadsheet':
                // Continue with spreadsheet creation
                try {
                  console.log('Resuming spreadsheet creation...');
                  // Defensive check for token availability after redirect
                  if (!this.sync.isAuthorized && !(this.sync.gapi && this.sync.gapi.client && this.sync.gapi.client.getToken())) {
                    console.warn('Token not available after redirect in checkResumeActions, attempting re-auth or showing error');
                    // Optionally, trigger re-authentication or show an error to the user
                    // For example:
                    // this.ui.showAuthError("Authentication token was not found after redirect. Please try signing in again.", () => this.sync.authorize());
                    // return; 
                    // Depending on desired UX, you might allow initializeSheets to proceed, 
                    // as it has its own auth checks, or handle it more directly here.
                    // For now, logging and allowing initializeSheets to handle it as it might attempt re-auth.
                  }
                  const sheetResult = await this.sync.initializeSheets();
                  console.log('Sheet initialization result:', sheetResult);
                  
                  if (sheetResult && sheetResult.success) {
                    console.log('Successfully created spreadsheet after redirect');
                    // Successful sheet initialization, continue with setup
                    await this.completeSetup();
                  } else {
                    // Handle sheet initialization failure
                    const errorMessage = sheetResult ? sheetResult.message : 'Unknown error';
                    console.error('Sheet init failed after redirect:', errorMessage);
                    
                    // Make sure we have appElement defined
                    this.appElement = this.appElement || document.getElementById('app');
                    
                    if (this.ui && this.ui.showSheetsInitError) {
                      this.ui.showSheetsInitError(errorMessage, () => this.firstTimeSetup());
                    } else {
                      this.showErrorScreen('Google Sheets Setup Failed', errorMessage, 
                        () => this.firstTimeSetup());
                    }
                  }
                } catch (error) {
                  console.error('Error initializing sheets after redirect:', error);
                  
                  // Make sure we have appElement defined
                  this.appElement = this.appElement || document.getElementById('app');
                  
                  if (this.ui && this.ui.showSheetsInitError) {
                    this.ui.showSheetsInitError(error.message, () => this.firstTimeSetup());
                  } else {
                    this.showErrorScreen('Google Sheets Setup Failed', error.message, 
                      () => this.firstTimeSetup());
                  }
                }
                break;
                
              default:
                console.warn('Unknown resume action:', resumeAction);
            }
          }
        } catch (error) {
          console.error('Error checking resume actions:', error);
        }
      }


      
    
      async initializeApp() {
        try {
            const userLocale = navigator.language || 'en'; // Get user's preferred locale
            this.translations = await loadTranslations(userLocale);
            console.log("Initializing application...");
            await this.initializeStorage();
            await this.initializeUI();
            await this.loadCredentials();
            await this.initializeModules();
            await this.startApplication();
        } catch (error) {
            console.error("Critical initialization error:", error);
            this.ui.showStartError(error); 
        }
    }
    
    async initializeStorage() {
        try {
            this.storage = new StorageManager();
            console.log("Initializing storage manager...");
            await this.storage.initialize();
            console.log("Storage manager initialized.");
        } catch (error) {
            console.error("Error initializing storage:", error);
            throw new Error("Failed to initialize local storage. Please check browser settings.");
        }
    }
    
    async initializeUI() {
        try {
            this.ui = new UIManager(this);
            console.log("UI manager initialized.");
            this.ensureUIMethodsExist(); // Ensure essential UI methods exist
        } catch (error) {
            console.error("Error initializing UI:", error);
            throw new Error("Failed to initialize UI elements. Please refresh the page.");
        }
    }
    
    async loadCredentials() {
        try {
            this.CLIENT_ID = await this.storage.get("google_client_id");
            this.API_KEY = await this.storage.get("google_api_key");
            this.AUTO_LOGIN = await this.storage.get("auto_login") === "true";

            console.log("Retrieved Client ID:", this.CLIENT_ID);
            console.log("Retrieved API Key:", this.API_KEY);
            console.log("Auto-login enabled:", this.AUTO_LOGIN);

            // Google credentials are now optional. Only warn, don't block app startup.
            if (!this.CLIENT_ID || this.CLIENT_ID.trim() === "" || !this.API_KEY || this.API_KEY.trim() === "") {
                console.warn("Google API credentials missing. Drive sync/backup will be disabled until linked.");
                this.googleLinked = false;
            } else {
                this.googleLinked = true;
            }
        } catch (error) {
            console.error("Error loading credentials:", error);
            // Credentials are optional, so don't throw
            this.googleLinked = false;
        }
    }
    
    async initializeModules() {
        try {
            this.preferences = await this.loadPreferences();
            this.graphics = new UIGraphics(this.preferences.theme);
            this.sound = new SoundEffects();
            this.tasks = new TaskManager(this);
            this.categories = new CategoryManager(this);
            this.sync = new SyncManager(this);
            this.notifications = new NotificationManager(this);
            this.gamification = new GamificationSystem(this);
            this.taskForm = new TaskForm(this);
            this.dailyMissions = new DailyMissionManager(this);
            console.log("Application modules initialized.");
        } catch (error) {
            console.error("Error initializing modules:", error);
            throw new Error("Failed to initialize application modules. Please refresh the page.");
        }
    }
    
    async startApplication() {
        try {
            const isFirstRun = !(await this.storage.get("app_initialized"));
            if (isFirstRun) {
                await this.firstTimeSetup();
            } else {
                await this.normalStartup();
            }
        } catch (error) {
            console.error("Error starting application:", error);
            throw error;
        }
    }
    
    
    
    
    async loadPreferences() {
        // Get stored preferences or use defaults
        const stored = await this.storage.get('user_preferences');
        return {
            ...this.config, // Default values
            ...(stored || {}) // Override with any stored values
        };
    }
    
    async savePreferences(updates) {
        // Update preferences with new values
        this.preferences = {
            ...this.preferences,
            ...updates
        };
        
        // Save to storage
        await this.storage.set('user_preferences', this.preferences);
        
        // Apply any visual changes
        if (updates.theme) {
            this.applyTheme(updates.theme);
        }
        
        return this.preferences;
    }
    
    applyTheme(theme) {
        // Determine which theme to apply
        let themeMode = theme;
        if (theme === 'auto') {
            themeMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 
                      'dark' : 'light';
        }
        
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', themeMode);
        
        // Update status bar color for mobile
        const metaThemeColor = document.querySelector('meta[name=theme-color]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', 
                themeMode === 'dark' ? '#121212' : '#4a6fa5');
        }
    }
    
    async firstTimeSetup() {
        try {
          // Show onboarding UI
          this.ui.showOnboarding();

          // Google linking is optional. Only attempt if credentials are present.
          let googleSetupSuccess = false;
          if (this.googleLinked) {
            // Wait for Google authorization
            const authResult = await this.sync.authorize();
            if (!authResult.success) {
              this.ui.showAuthError(authResult.message, () => this.firstTimeSetup());
              return;
            }
            // Initialize Google Sheet structure
            const sheetResult = await this.sync.initializeSheets();
            if (!sheetResult.success) {
              this.ui.showSheetsInitError(sheetResult.message, () => this.firstTimeSetup());
              return;
            }
            googleSetupSuccess = true;
          }

          // Create default categories
          await this.categories.createDefaultCategories();

          // Complete setup - This will now likely be called by UIManager.hideOnboarding() or app.completeSetup()
          // await this.storage.set('app_initialized', true); 

          // Start app normally - This will also be triggered after onboarding is complete.
          // await this.normalStartup(); 

          // Show PWA installation prompt if appropriate - This can also be part of onboarding or called after.
          // this.checkForPWAInstall();

          // Error handling remains important, though some errors might be caught within OnboardingView/UIManager
        } catch (error) {
          console.error('First-time setup failed:', error);
          // Show a user-friendly error with options
          // This error handling might need adjustment depending on how onboarding flow manages errors.
          if (this.ui && this.ui.showSetupOptionsError) {
            this.ui.showSetupOptionsError(error, () => this.firstTimeSetup());
          } else if (this.showErrorScreen) { // Fallback if ui.showSetupOptionsError is not available
            this.showErrorScreen('Setup Failed', error.message, () => this.firstTimeSetup());
          } else {
            // Basic fallback
            alert(`Critical setup error: ${error.message}. Please reload the application.`);
          }
        }
      }
    
    async normalStartup() {
        try {
            // Ensure UI methods before checking resume actions
            this.ensureUIMethodsExist();
            // Check for resume actions
            await this.checkResumeActions();
            // Show loading screen with rotating motivational quotes
            this.showLoadingScreenWithQuotes();

            // If Google is linked, try to authorize, else skip
            let authResult = { success: false };
            if (this.googleLinked) {
                this.showLoadingMessage('Checking authorization...');
                authResult = await this.sync.authorize();
                if (!authResult.success && authResult.reason === 'missing_credentials') {
                    this.ui.showCredentialsForm();
                    return;
                }
                if (!authResult.success) {
                    this.showErrorScreen('Authorization Failed', authResult.message, () => this.normalStartup());
                    return;
                }
            }

            this.showLoadingMessage('Loading data...');
            // Load data (in parallel for speed)
            await Promise.all([
                this.tasks.loadTasks(),
                this.categories.loadCategories(),
                this.gamification.loadUserProfile()
            ]);

            // Start sync if online and Google is linked
            if (this.online && this.googleLinked) {
                this.sync.startPeriodicSync();
            }

            // Setup notifications
            if (this.preferences.notificationsEnabled) {
                await this.notifications.setupNotifications();
            }

            // Render main UI
            this.ui.renderMainApp();

            // Mark as initialized
            this.initialized = true;

            // Check for pending notifications
            this.notifications.checkPendingNotifications();
        } catch (error) {
            console.error('Normal startup failed:', error);
            this.showErrorScreen('Startup failed', error.message);
        }
    }
    showLoadingScreenWithQuotes() {
        // Motivational quotes array
        const quotes = [
            "Every quest begins with a single step.",
            "Small actions every day lead to great achievements.",
            "Stay focused on your journey, not the destination.",
            "Progress, not perfection.",
            "Your future is created by what you do today, not tomorrow.",
            "Success is the sum of small efforts repeated day in and day out.",
            "You are the hero of your own story.",
            "Great things never come from comfort zones.",
            "Dream big. Start small. Act now.",
            "The secret of getting ahead is getting started."
        ];
        let current = 0;
        let loadingScreen = document.getElementById('loading-screen');
        if (!loadingScreen) {
            loadingScreen = document.createElement('div');
            loadingScreen.id = 'loading-screen';
            loadingScreen.style.position = 'fixed';
            loadingScreen.style.top = '0';
            loadingScreen.style.left = '0';
            loadingScreen.style.width = '100vw';
            loadingScreen.style.height = '100vh';
            loadingScreen.style.background = 'linear-gradient(135deg, #4a6fa5 0%, #121212 100%)';
            loadingScreen.style.display = 'flex';
            loadingScreen.style.flexDirection = 'column';
            loadingScreen.style.justifyContent = 'center';
            loadingScreen.style.alignItems = 'center';
            loadingScreen.style.zIndex = '9999';
            loadingScreen.innerHTML = `
                <div style="font-size:2.5rem;font-weight:bold;color:#fff;letter-spacing:2px;margin-bottom:1.5rem;">Questify</div>
                <div id="loading-quote" style="font-size:1.3rem;color:#fff;text-align:center;max-width:80vw;"></div>
                <div class="spinner" style="margin-top:2rem;width:48px;height:48px;border:6px solid #fff;border-top:6px solid #4a6fa5;border-radius:50%;animation:spin 1s linear infinite;"></div>
                <style>@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}</style>
            `;
            document.body.appendChild(loadingScreen);
        }
        const quoteEl = loadingScreen.querySelector('#loading-quote');
        function showQuote(idx) {
            if (quoteEl) quoteEl.textContent = quotes[idx];
        }
        showQuote(current);
        // Rotate every 6 seconds
        let interval = setInterval(() => {
            current = (current + 1) % quotes.length;
            showQuote(current);
        }, 6000);
        // Remove loading screen after main UI is rendered
        const removeLoading = () => {
            clearInterval(interval);
            if (loadingScreen && loadingScreen.parentNode) {
                loadingScreen.parentNode.removeChild(loadingScreen);
            }
        };
        // Attach to UIManager so it can be removed after renderMainApp
        if (this.ui) {
            this.ui.removeLoadingScreen = removeLoading;
        } else {
            setTimeout(removeLoading, 12000); // Fallback: remove after 12s
        }
    }
    
    handleOnlineStatus(isOnline) {
        this.online = isOnline;
        
        if (isOnline && this.initialized) {
            // Sync pending changes when coming back online
            if (this.syncPending) {
                this.sync.syncNow();
                this.syncPending = false;
            }
            
            // Restart periodic sync
            this.sync.startPeriodicSync();
        } else {
            // Stop sync attempts when offline
            this.sync.stopPeriodicSync();
            this.syncPending = true;
        }
        
        // Update UI to reflect connectivity status
        if (this.ui && this.ui.updateConnectionStatus) {
            this.ui.updateConnectionStatus(isOnline);
        }
    }
    
    checkForPWAInstall() {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return; // Already installed
        }
        
        // Show install prompt based on platform
        if (/Android/i.test(navigator.userAgent)) {
            // For Android, show custom "Add to Home Screen" guidance
            setTimeout(() => {
                this.ui.showInstallPrompt();
            }, 30000); // Show after 30 seconds of usage
        }
    }
    
    showLoadingMessage(message) {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            let messageEl = loadingScreen.querySelector('#loading-message');
            if (!messageEl) {
                messageEl = document.createElement('div');
                messageEl.id = 'loading-message';
                messageEl.style.color = '#fff';
                messageEl.style.marginTop = '1rem';
                loadingScreen.appendChild(messageEl);
            }
            messageEl.textContent = message;
        }
    }
    
    showErrorScreen(title, message, retryCallback = null) {
        const appEl = document.getElementById('app');
        appEl.innerHTML = `
            <div class="error-screen">
                <h1>${title}</h1>
                <p>${message}</p>
                ${retryCallback ? '<button id="retry-button">Try Again</button>' : ''}
            </div>
        `;
        if (this.ui && this.ui.removeLoadingScreen) {
            this.ui.removeLoadingScreen();
        }
        if (retryCallback) {
            document.getElementById('retry-button').addEventListener('click', retryCallback);
        }
    }

    // Show auth error with retry option
showAuthError(message, retryCallback) {
    this.appElement.innerHTML = `
      <div class="error-container">
        <div class="error-header">
          <div class="app-logo">${this.graphics.getAppLogo(64)}</div>
          <h1>Google Authorization Failed</h1>
        </div>
        
        <div class="error-content">
          <p>${message}</p>
          
          <div class="error-actions">
            <button id="retry-auth" class="primary-button">Try Again</button>
            <button id="setup-credentials" class="secondary-button">Update Credentials</button>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('retry-auth').addEventListener('click', retryCallback);
    document.getElementById('setup-credentials').addEventListener('click', () => {
      this.showCredentialsForm();
    });
  }
  
  // Show sheets initialization error with options
  showSheetsInitError(message, retryCallback) {
    this.appElement.innerHTML = `
      <div class="error-container">
        <div class="error-header">
          <div class="app-logo">${this.graphics.getAppLogo(64)}</div>
          <h1>Google Sheets Setup Failed</h1>
        </div>
        
        <div class="error-content">
          <p>${message}</p>
          <p>This could be due to API restrictions or permissions issues.</p>
          
          <div class="help-text">
            <strong>Possible solutions:</strong>
            <ul>
              <li>Make sure Google Sheets API is enabled in your Google Cloud project</li>
              <li>Verify your API credentials have the correct permissions</li>
              <li>Check that your domain is authorized in the Google Cloud Console</li>
            </ul>
          </div>
          
          <div class="error-actions">
            <button id="retry-sheets" class="primary-button">Try Again</button>
            <button id="update-credentials" class="secondary-button">Update Credentials</button>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('retry-sheets').addEventListener('click', retryCallback);
    document.getElementById('update-credentials').addEventListener('click', () => {
      this.showCredentialsForm();
    });
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
  async completeSetup() {
    try {
      // Create default categories
      await this.categories.createDefaultCategories();
      
      // Mark app as initialized
      await this.storage.set('app_initialized', true);
      
      // Start app normally
      await this.normalStartup();
      
      // Show PWA installation prompt if appropriate
      this.checkForPWAInstall();
      
      return true;
    } catch (error) {
      console.error('Setup completion failed:', error);
      this.ui.showOnboardingError('Failed to complete setup: ' + error.message);
      return false;
    }
  }
  
}

// Register Service Worker for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}