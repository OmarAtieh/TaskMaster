// sync-manager.js - Google Sheets synchronization

class SyncManager {
  constructor(app) {
      this.app = app;
      this.storage = app.storage;
      this.isAuthorized = false;
      this.syncInterval = null;
      this.gapi = null;
      this.tokenClient = null;
      this.spreadsheetId = null;
      
      // We'll retrieve these from storage instead of hardcoding them
      this.CLIENT_ID = null;
      this.API_KEY = null;
      
      // Define API scopes needed
      this.SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';
      this.DISCOVERY_DOCS = [
        'https://sheets.googleapis.com/$discovery/rest?version=v4',
        'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
      ];
  }
    
  // Load credentials from storage
  async loadCredentials() {
      try {
          // Load credentials from storage
          this.CLIENT_ID = await this.storage.get('google_client_id');
          this.API_KEY = await this.storage.get('google_api_key');
          
          return !!this.CLIENT_ID && !!this.API_KEY;
      } catch (error) {
          console.error('Error loading Google API credentials:', error);
          return false;
      }
  }
  
  // Load the Google API client and Identity Services library
  // Replace or update the loadGoogleApi method to ensure initializeTokenClient is called early
async loadGoogleApi() {
  // First ensure we have credentials
  const hasCredentials = await this.loadCredentials();
  if (!hasCredentials) {
    throw new Error('Google API credentials not configured. Please add them in Settings.');
  }
  
  return new Promise((resolve, reject) => {
    // Load both Google API JS and Identity Services
    const gapiLoaded = new Promise((gapiResolve) => {
      // Check for gapi
      if (window.gapi) {
        this.gapi = window.gapi;
        gapiResolve();
        return;
      }
      
      // Load gapi
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.gapi = window.gapi;
        this.gapi.load('client', gapiResolve);
      };
      script.onerror = () => {
        reject(new Error('Error loading Google API script'));
      };
      document.body.appendChild(script);
    });
    
    const gisLoaded = new Promise((gisResolve) => {
      // Check for google identity services
      if (window.google && window.google.accounts) {
        gisResolve();
        return;
      }
      
      // Load identity services
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = gisResolve;
      script.onerror = () => {
        reject(new Error('Error loading Google Identity Services script'));
      };
      document.body.appendChild(script);
    });
    
    // Wait for both to load
    Promise.all([gapiLoaded, gisLoaded])
      .then(() => {
        // Initialize the token client immediately after loading
        this.initializeTokenClient();
        
        // Now check for tokens in the URL from a redirect
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          console.log('Found access token in URL hash, processing...');
          
          // Parse hash parameters
          const params = {};
          hash.substring(1).split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            params[key] = decodeURIComponent(value);
          });
          
          // Create token object
          if (params.access_token) {
            const tokenObj = {
              access_token: params.access_token,
              expires_in: params.expires_in || 3600,
              token_type: params.token_type || 'Bearer'
            };
            
            console.log('Setting token from URL hash');
            this.gapi.client.setToken(tokenObj);
            this.isAuthorized = true;
            
            // Clean up URL
            if (window.history && window.history.replaceState) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        }
        
        resolve();
      })
      .catch(error => reject(error));
  });
}
  
  // Initialize the Google API client
  async initializeGapiClient() {
      await this.gapi.client.init({
          apiKey: this.API_KEY,
          discoveryDocs: this.DISCOVERY_DOCS
      });
  }
  
  // Initialize the Token Client for OAuth
  initializeTokenClient() {
    // Get the current URL (for redirect)
    const redirectUri = window.location.href.split('#')[0]; // Remove any hash fragment
    
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: this.CLIENT_ID,
      scope: this.SCOPES,
      // Use redirect flow instead of popup
      ux_mode: 'redirect',
      redirect_uri: redirectUri,
      // This callback won't be called with redirect flow
      // but we include it for popup fallback
      callback: (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          // Token received successfully
          this.isAuthorized = true;
          // Set the token for GAPI to use
          this.gapi.client.setToken(tokenResponse);
          console.log('Successfully obtained access token');
        }
      },
      error_callback: (error) => {
        console.error('Error obtaining access token:', error);
        this.isAuthorized = false;
      }
    });
    
    // Check if we have returned from a redirect with hash parameters
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      // Parse hash parameters into an object
      const params = {};
      hash.substring(1).split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        params[key] = decodeURIComponent(value);
      });
      
      // If we have an access token in the URL
      if (params.access_token) {
        // Create a token object
        const tokenObj = {
          access_token: params.access_token,
          expires_in: params.expires_in || 3600,
          token_type: params.token_type || 'Bearer'
        };
        
        // Set the token for GAPI
        this.gapi.client.setToken(tokenObj);
        this.isAuthorized = true;
        console.log('Found token in URL, authorization successful');
        
        // Clean up the URL by removing the hash
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }
  
  // Authorize with Google
  async authorize() {
    try {
      // Check if we have credentials
      const hasCredentials = await this.loadCredentials();
      if (!hasCredentials) {
        this.isAuthorized = false;
        return { 
          success: false, 
          reason: 'missing_credentials',
          message: 'Google API credentials not configured.' 
        };
      }
      
      // Load the required libraries
      await this.loadGoogleApi();
      
      // Initialize the GAPI client
      await this.gapi.client.init({
        apiKey: this.API_KEY,
        discoveryDocs: this.DISCOVERY_DOCS
      });
      
      // Initialize the token client if needed
      if (!this.tokenClient && window.google && window.google.accounts) {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: this.CLIENT_ID,
          scope: this.SCOPES,
          callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              // Token received successfully
              this.isAuthorized = true;
              // Set the token for GAPI to use
              this.gapi.client.setToken(tokenResponse);
              console.log('Successfully obtained access token');
            }
          },
          error_callback: (error) => {
            console.error('Error obtaining access token:', error);
            this.isAuthorized = false;
          }
        });
      }
      
      // Check if we're already authorized
      try {
        const tokenCheck = await this.gapi.client.sheets.spreadsheets.get({
          spreadsheetId: 'dummy-id-for-test'
        });
        
        // If we get here without an error, we already have a valid token
        this.isAuthorized = true;
        console.log('User already has a valid token');
        
        // Get the spreadsheet ID from storage
        this.spreadsheetId = await this.storage.get('spreadsheet_id');
        
        return { success: true };
      } catch (error) {
        // Expected 404 error for dummy ID test - which is actually good!
        if (error.status === 404) {
          this.isAuthorized = true;
          console.log('User has a valid token (404 is expected and good)');
          
          // Get the spreadsheet ID from storage
          this.spreadsheetId = await this.storage.get('spreadsheet_id');
          
          return { success: true };
        }
        
        // If error code is 401 or 403, we need a new token
        if (error.status === 401 || error.status === 403) {
          console.log('Need to request a new token');
          
          // If we don't have a token client, we can't proceed
          if (!this.tokenClient) {
            return {
              success: false,
              reason: 'no_token_client',
              message: 'Token client not initialized properly'
            };
          }
          
          // Return a promise that resolves when we get the token
          return new Promise((resolve) => {
            // Request a token
            this.tokenClient.requestAccessToken({
              prompt: 'consent'
            });
            
            // Set up a timeout in case authorization takes too long
            const timeout = setTimeout(() => {
              resolve({ 
                success: false, 
                reason: 'auth_timeout',
                message: 'Authorization timed out' 
              });
            }, 60000); // 1 minute timeout
            
            // Set up an interval to check if we've been authorized
            const interval = setInterval(() => {
              if (this.isAuthorized) {
                clearTimeout(timeout);
                clearInterval(interval);
                resolve({ success: true });
              }
            }, 500); // Check every 500ms
          });
        } else {
          // Some other error
          console.error('Error checking authorization:', error);
          return { 
            success: false, 
            reason: 'auth_error',
            message: 'Failed to check authorization: ' + (error.message || 'Unknown error') 
          };
        }
      }
    } catch (error) {
      console.error('Google authorization failed:', error);
      this.isAuthorized = false;
      return { 
        success: false, 
        reason: 'auth_error',
        message: 'Failed to authorize with Google: ' + (error.message || 'Unknown error') 
      };
    }
  }
  
  // Get spreadsheet ID from storage or create a new one
  async getSpreadsheetId() {
      this.spreadsheetId = await this.storage.get('spreadsheet_id');
      if (!this.spreadsheetId) {
          // If we don't have a spreadsheet ID, create a new one
          console.log('No spreadsheet ID found, creating a new one');
          await this.createNewSpreadsheet();
      }
      return this.spreadsheetId;
  }
  
  // Initialize Google Sheets for the app
  async initializeSheets() {
    try {
      // Check if we're authorized
      if (!this.isAuthorized) {
        const authResult = await this.authorize();
        // If authorization failed, return a specific status
        if (!authResult.success) {
          return {
            success: false,
            reason: authResult.reason,
            message: authResult.message
          };
        }
      }
      
      // Make sure we have a valid gapi client
      if (!this.gapi || !this.gapi.client) {
        return {
          success: false,
          reason: 'api_not_initialized',
          message: 'Google API client not initialized. Please refresh and try again.'
        };
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
          return { success: true, spreadsheetId: this.spreadsheetId };
        } catch (error) {
          // Spreadsheet doesn't exist or we don't have access
          console.error('Could not access existing spreadsheet:', error);
          this.spreadsheetId = null;
        }
      }
      
      // If we don't have a valid spreadsheet ID, create a new one
      console.log('Creating new TaskMaster spreadsheet...');
      const result = await this.createNewSpreadsheet();
      return { success: true, spreadsheetId: result };
    } catch (error) {
      console.error('Error initializing sheets:', error);
      return {
        success: false,
        reason: 'sheets_init_failed',
        message: 'Failed to initialize Google Sheets: ' + (error.message || 'Unknown error')
      };
    }
  }
  
  // Create a new spreadsheet
  async createNewSpreadsheet() {
    try {
      // Check if Google API client is properly initialized
      if (!this.gapi || !this.gapi.client || !this.gapi.client.sheets) {
        throw new Error('Google Sheets API not properly initialized. Please check your API credentials.');
      }
      
      // IMPORTANT: Verify we have a valid token
      const token = this.gapi.client.getToken();
      if (!token || !token.access_token) {
        // Check if we have a stored token from redirect
        const storedToken = localStorage.getItem('oauth_token');
        const tokenExpiry = localStorage.getItem('oauth_token_expiry');
        
        if (storedToken && tokenExpiry && parseInt(tokenExpiry) > Date.now()) {
          console.log('Using stored token from redirect');
          this.gapi.client.setToken({
            access_token: storedToken,
            expires_in: Math.floor((parseInt(tokenExpiry) - Date.now()) / 1000)
          });
        } else {
          console.log('No valid token found, requesting a new one');
          // Rest of your existing code for redirect...
        }
      }
      
      console.log('Creating spreadsheet with token:', !!this.gapi.client.getToken());
      
      // Create the spreadsheet
      const response = await this.gapi.client.sheets.spreadsheets.create({
        properties: {
          title: this.app.config.gSheetName || 'TaskMaster-Data'
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
      
      if (!response || !response.result) {
        throw new Error('No response received when creating spreadsheet');
      }
      
      this.spreadsheetId = response.result.spreadsheetId;
      
      // Save the spreadsheet ID
      await this.storage.set('spreadsheet_id', this.spreadsheetId);
      
      // Initialize the sheet structure
      await this.initializeSheetHeaders();
      
      console.log('Created new spreadsheet with ID:', this.spreadsheetId);
      return this.spreadsheetId;
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      const errorMessage = error.result ? 
                           JSON.stringify(error.result) : 
                           (error.message || 'Unknown error');
      throw new Error('Failed to create spreadsheet: ' + errorMessage);
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