// app.js - Main Application Entry Point

document.addEventListener('DOMContentLoaded', () => {
    const app = new TaskMasterApp();
});

class TaskMasterApp {
    constructor() {
        this.config = {
            appName: 'TaskMaster',
            version: '1.0.0',
            gSheetName: 'TaskMaster-Data',
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
    
    async initializeApp() {
        try {
            // Set up event listeners for online/offline status
            window.addEventListener('online', () => this.handleOnlineStatus(true));
            window.addEventListener('offline', () => this.handleOnlineStatus(false));
            
            // Apply theme immediately to prevent flash
            this.applyTheme(this.config.theme);
            
            // Show loading message
            this.showLoadingMessage('Initializing...');

            // Initialize storage - we need this first
            this.storage = new StorageManager();
            await this.storage.initialize();
            this.showLoadingMessage('Storage initialized...');
            
            // Load or create user preferences
            this.preferences = await this.loadPreferences();
            
            // Initialize core modules (sequential for now)
            this.graphics = new UIGraphics(this.preferences.theme);
            this.sound = new SoundEffects();
            this.tasks = new TaskManager(this);
            this.categories = new CategoryManager(this);
            this.sync = new SyncManager(this);
            this.notifications = new NotificationManager(this);
            this.gamification = new GamificationSystem(this);
            this.taskForm = new TaskForm(this);
            this.dailyMissions = new DailyMissionManager(this);
            
            this.showLoadingMessage('Modules loaded...');
            
            // Initialize UI manager last (depends on other modules)
            this.ui = new UIManager(this);
            
            // Check if this is first run
            const isFirstRun = !(await this.storage.get('app_initialized'));
            if (isFirstRun) {
                await this.firstTimeSetup();
            } else {
                await this.normalStartup();
            }
        } catch (error) {
            console.error('Application initialization failed:', error);
            this.showErrorScreen('Initialization failed', error.message);
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
            this.showLoadingMessage('Setting up for first time...');
            // Show simple onboarding UI
            this.ui.showOnboarding();
            
            // Wait for Google authorization
            await this.sync.authorize();
            
            // Create default categories
            await this.categories.createDefaultCategories();
            
            // Initialize Google Sheet structure
            await this.sync.initializeSheets();
            
            // Complete setup
            await this.storage.set('app_initialized', true);
            
            // Start app normally
            await this.normalStartup();
            
            // Show PWA installation prompt if appropriate
            this.checkForPWAInstall();
        } catch (error) {
            console.error('First-time setup failed:', error);
            // Show retry button
            this.showErrorScreen('Setup failed', error.message, () => this.firstTimeSetup());
        }
    }
    
    async normalStartup() {
        try {
            this.showLoadingMessage('Loading data...');
            // Load data (in parallel for speed)
            await Promise.all([
                this.tasks.loadTasks(),
                this.categories.loadCategories(),
                this.gamification.loadUserProfile()
            ]);
            
            // Start sync if online
            if (this.online) {
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
            this.notifications.checkForPendingNotifications();
        } catch (error) {
            console.error('Normal startup failed:', error);
            this.showErrorScreen('Startup failed', error.message);
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
            const messageEl = loadingScreen.querySelector('p');
            if (messageEl) {
                messageEl.textContent = message;
            }
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
        
        if (retryCallback) {
            document.getElementById('retry-button').addEventListener('click', retryCallback);
        }
    }
}

// Register Service Worker for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}