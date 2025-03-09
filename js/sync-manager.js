// sync-manager.js - Google Sheets synchronization

class SyncManager {
    constructor(app) {
      this.app = app;
      this.storage = app.storage;
      this.isAuthorized = false;
      this.syncInterval = null;
      this.gapi = null;
      this.spreadsheetId = null;
      
      // Google API Client ID - This needs to be replaced with your actual client ID
      this.CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE';
      this.API_KEY = 'YOUR_GOOGLE_API_KEY_HERE';
      
      // Define API scopes needed
      this.SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';
      this.DISCOVERY_DOCS = [
        'https://sheets.googleapis.com/$discovery/rest?version=v4',
        'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
      ];
    }
    
    // Load the Google API client
    async loadGoogleApi() {
      return new Promise((resolve, reject) => {
        // If gapi is already loaded
        if (window.gapi) {
          this.gapi = window.gapi;
          resolve(this.gapi);
          return;
        }
        
        // Load the Google API client script
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          this.gapi = window.gapi;
          this.gapi.load('client:auth2', {
            callback: () => {
              this.gapi.client.init({
                apiKey: this.API_KEY,
                clientId: this.CLIENT_ID,
                discoveryDocs: this.DISCOVERY_DOCS,
                scope: this.SCOPES
              }).then(() => {
                resolve(this.gapi);
              }).catch(error => {
                reject(error);
              });
            },
            onerror: () => {
              reject(new Error('Error loading Google API client'));
            }
          });
        };
        script.onerror = () => {
          reject(new Error('Error loading Google API script'));
        };
        
        document.body.appendChild(script);
      });
    }
    
    // Authorize with Google
    async authorize() {
      try {
        // Load Google API if not already loaded
        await this.loadGoogleApi();
        
        // Check if already signed in
        if (this.gapi.auth2.getAuthInstance().isSignedIn.get()) {
          this.isAuthorized = true;
          console.log('User is already signed in to Google');
          
          // Get the spreadsheet ID from storage or create new sheet
          this.spreadsheetId = await this.storage.get('spreadsheet_id');
          
          return true;
        }
        
        // Try to sign in
        await this.gapi.auth2.getAuthInstance().signIn();
        this.isAuthorized = true;
        
        // Check if we have a spreadsheet ID stored
        this.spreadsheetId = await this.storage.get('spreadsheet_id');
        
        return true;
      } catch (error) {
        console.error('Google authorization failed:', error);
        this.isAuthorized = false;
        throw new Error('Failed to authorize with Google: ' + error.message);
      }
    }
    
    // Initialize Google Sheets for the app
    async initializeSheets() {
      try {
        if (!this.isAuthorized) {
          await this.authorize();
        }
        
        // If we already have a spreadsheet ID, check if it's valid
        if (this.spreadsheetId) {
          try {
            await this.gapi.client.sheets.spreadsheets.get({
              spreadsheetId: this.spreadsheetId
            });
            
            // Spreadsheet exists and we have access
            console.log('Using existing spreadsheet:', this.spreadsheetId);
            await this.ensureSheetStructure();
            return this.spreadsheetId;
          } catch (error) {
            // Spreadsheet doesn't exist or we don't have access
            console.error('Could not access existing spreadsheet:', error);
            this.spreadsheetId = null;
          }
        }
        
        // If we don't have a valid spreadsheet ID, create a new one
        console.log('Creating new TaskMaster spreadsheet...');
        return await this.createNewSpreadsheet();
      } catch (error) {
        console.error('Error initializing sheets:', error);
        throw new Error('Failed to initialize Google Sheets: ' + error.message);
      }
    }
    
    // Create a new spreadsheet
    async createNewSpreadsheet() {
      try {
        const response = await this.gapi.client.sheets.spreadsheets.create({
          properties: {
            title: this.app.config.gSheetName
          },
          sheets: [
            {
              properties: {
                title: 'Tasks',
                gridProperties: {
                  frozenRowCount: 1
                }
              }
            },
            {
              properties: {
                title: 'Categories',
                gridProperties: {
                  frozenRowCount: 1
                }
              }
            },
            {
              properties: {
                title: 'UserProfile',
                gridProperties: {
                  frozenRowCount: 1
                }
              }
            },
            {
              properties: {
                title: 'Settings',
                gridProperties: {
                  frozenRowCount: 1
                }
              }
            }
          ]
        });
        
        this.spreadsheetId = response.result.spreadsheetId;
        
        // Save the spreadsheet ID
        await this.storage.set('spreadsheet_id', this.spreadsheetId);
        
        // Initialize the sheet structure
        await this.initializeSheetHeaders();
        
        console.log('Created new spreadsheet with ID:', this.spreadsheetId);
        return this.spreadsheetId;
      } catch (error) {
        console.error('Error creating spreadsheet:', error);
        throw new Error('Failed to create spreadsheet: ' + error.message);
      }
    }
    
    // Initialize headers for all sheets
    async initializeSheetHeaders() {
      const headerValues = {
        'Tasks': [
          ['id', 'title', 'description', 'category_id', 'subcategory_id', 'priority', 
           'difficulty', 'estimated_minutes', 'due_date', 'due_time', 'status', 'progress_type', 
           'progress_percentage', 'is_recurring', 'recurrence_pattern', 'last_completed_date',
           'created_at', 'modified_at', 'completed_at', 'points_value', 'tags', 'notes', 'sync_version']
        ],
        'Categories': [
          ['id', 'name', 'color', 'icon', 'display_order', 'parent_id', 'created_at', 'modified_at']
        ],
        'UserProfile': [
          ['key', 'value']
        ],
        'Settings': [
          ['key', 'value']
        ]
      };
      
      // Write headers to each sheet
      for (const [sheetName, headers] of Object.entries(headerValues)) {
        await this.gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!A1:Z1`,
          valueInputOption: 'RAW',
          resource: {
            values: headers
          }
        });
      }
      
      // Format headers (make bold and freeze)
      const requests = Object.keys(headerValues).map(sheetName => {
        return {
          repeatCell: {
            range: {
              sheetId: this.getSheetIdByName(sheetName),
              startRowIndex: 0,
              endRowIndex: 1
            },
            cell: {
              userEnteredFormat: {
                textFormat: {
                  bold: true
                },
                backgroundColor: {
                  red: 0.9,
                  green: 0.9,
                  blue: 0.9
                }
              }
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)'
          }
        };
      });
      
      await this.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: requests
        }
      });
    }
    
    // Get sheet ID by name
    getSheetIdByName(sheetName) {
      // This is a placeholder - in a real implementation, we would get the sheet ID
      // by querying the spreadsheet metadata. For now, we'll return 0 for 'Tasks',
      // 1 for 'Categories', etc.
      const sheetIndex = {
        'Tasks': 0,
        'Categories': 1,
        'UserProfile': 2,
        'Settings': 3
      };
      return sheetIndex[sheetName] || 0;
    }
    
    // Ensure the sheet has the correct structure
    async ensureSheetStructure() {
      // For now, we'll just check if the required sheets exist
      // In a more complete implementation, we'd also validate columns
      
      try {
        const response = await this.gapi.client.sheets.spreadsheets.get({
          spreadsheetId: this.spreadsheetId
        });
        
        const sheets = response.result.sheets;
        const sheetNames = sheets.map(sheet => sheet.properties.title);
        
        const requiredSheets = ['Tasks', 'Categories', 'UserProfile', 'Settings'];
        const missingSheets = requiredSheets.filter(name => !sheetNames.includes(name));
        
        if (missingSheets.length > 0) {
          console.log('Missing sheets:', missingSheets);
          
          // Add missing sheets
          const requests = missingSheets.map(sheetName => {
            return {
              addSheet: {
                properties: {
                  title: sheetName,
                  gridProperties: {
                    frozenRowCount: 1
                  }
                }
              }
            };
          });
          
          await this.gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            resource: {
              requests: requests
            }
          });
          
          // Initialize headers for new sheets
          await this.initializeSheetHeaders();
        }
        
        return true;
      } catch (error) {
        console.error('Error ensuring sheet structure:', error);
        throw new Error('Failed to validate sheet structure: ' + error.message);
      }
    }
    
    // Start periodic synchronization
    startPeriodicSync() {
      // Clear any existing interval
      this.stopPeriodicSync();
      
      // Convert minutes to milliseconds
      const intervalMs = (this.app.preferences.syncIntervalMinutes || 5) * 60 * 1000;
      
      // Set up new interval
      this.syncInterval = setInterval(() => {
        this.syncNow().catch(error => {
          console.error('Periodic sync failed:', error);
        });
      }, intervalMs);
      
      console.log(`Periodic sync started, interval: ${intervalMs}ms`);
    }
    
    // Stop periodic synchronization
    stopPeriodicSync() {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
        console.log('Periodic sync stopped');
      }
    }
    
    // Update sync interval
    updateSyncInterval(minutes) {
      if (this.syncInterval) {
        this.stopPeriodicSync();
        this.startPeriodicSync();
      }
    }
    
    // Perform immediate synchronization
    async syncNow() {
      if (!this.isAuthorized || !this.spreadsheetId) {
        throw new Error('Not authorized or no spreadsheet ID');
      }
      
      try {
        // Sync tasks
        await this.syncTasks();
        
        // Sync categories
        await this.syncCategories();
        
        // Sync user profile
        await this.syncUserProfile();
        
        // Sync settings
        await this.syncSettings();
        
        console.log('Sync completed successfully');
        return true;
      } catch (error) {
        console.error('Sync failed:', error);
        throw new Error('Synchronization failed: ' + error.message);
      }
    }
    
    // Sync tasks
    async syncTasks() {
      // This would be a more complex implementation with bidirectional sync
      // For now, we'll just implement a simple upload of all tasks
      
      const tasks = await this.app.tasks.getTasks();
      
      if (!tasks || tasks.length === 0) {
        console.log('No tasks to sync');
        return;
      }
      
      // Convert tasks to row data
      const rows = tasks.map(task => {
        return [
          task.id,
          task.title,
          task.description || '',
          task.category_id || '',
          task.subcategory_id || '',
          task.priority.toString(),
          task.difficulty.toString(),
          task.estimated_minutes?.toString() || '',
          task.due_date || '',
          task.due_time || '',
          task.status || 'not_started',
          task.progress_type || 'boolean',
          task.progress_percentage?.toString() || '0',
          task.is_recurring ? 'true' : 'false',
          JSON.stringify(task.recurrence_pattern || {}),
          task.last_completed_date || '',
          task.created_at || '',
          task.modified_at || '',
          task.completed_at || '',
          task.points_value?.toString() || '',
          JSON.stringify(task.tags || []),
          task.notes || '',
          task.sync_version?.toString() || '1'
        ];
      });
      
      // Get existing rows
      const response = await this.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Tasks!A2:Z'
      });
      
      const existingData = response.result.values || [];
      
      // Clear all data except headers
      await this.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: 'Tasks!A2:Z'
      });
      
      // Write all task data
      await this.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Tasks!A2',
        valueInputOption: 'RAW',
        resource: {
          values: rows
        }
      });
      
      console.log(`Synced ${rows.length} tasks`);
    }
    
    // Sync categories
    async syncCategories() {
      const categories = await this.app.categories.getCategories();
      
      if (!categories || categories.length === 0) {
        console.log('No categories to sync');
        return;
      }
      
      // Convert categories to row data
      const rows = categories.map(category => {
        return [
          category.id,
          category.name,
          category.color || '',
          category.icon || '',
          category.display_order?.toString() || '0',
          category.parent_id || '',
          category.created_at || '',
          category.modified_at || ''
        ];
      });
      
      // Clear existing data
      await this.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: 'Categories!A2:Z'
      });
      
      // Write category data
      await this.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Categories!A2',
        valueInputOption: 'RAW',
        resource: {
          values: rows
        }
      });
      
      console.log(`Synced ${rows.length} categories`);
    }
    
    // Sync user profile
    async syncUserProfile() {
      if (!this.app.gamification || !this.app.gamification.userProfile) {
        console.log('No user profile to sync');
        return;
      }
      
      const profile = this.app.gamification.userProfile;
      
      // Convert profile to key-value pairs
      const rows = Object.entries(profile).map(([key, value]) => {
        return [key, JSON.stringify(value)];
      });
      
      // Clear existing data
      await this.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: 'UserProfile!A2:Z'
      });
      
      // Write profile data
      await this.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'UserProfile!A2',
        valueInputOption: 'RAW',
        resource: {
          values: rows
        }
      });
      
      console.log('Synced user profile');
    }
    
    // Sync settings
    async syncSettings() {
      const settings = this.app.preferences;
      
      // Convert settings to key-value pairs
      const rows = Object.entries(settings).map(([key, value]) => {
        return [key, JSON.stringify(value)];
      });
      
      // Clear existing data
      await this.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: 'Settings!A2:Z'
      });
      
      // Write settings data
      await this.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Settings!A2',
        valueInputOption: 'RAW',
        resource: {
          values: rows
        }
      });
      
      console.log('Synced settings');
    }
  }
  
  // Export the class if in Node.js environment
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SyncManager };
  } else {
    // Browser context
    window.SyncManager = SyncManager;
  }