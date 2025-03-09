// storage-manager.js - IndexedDB wrapper for local storage

class StorageManager {
    constructor() {
        this.dbName = 'taskmaster-db';
        this.version = 1;
        this.db = null;
    }
    
    async initialize() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = (event) => {
                reject('IndexedDB access denied: ' + event.target.error);
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores if they don't exist
                if (!db.objectStoreNames.contains('tasks')) {
                    db.createObjectStore('tasks', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('categories')) {
                    db.createObjectStore('categories', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('user_data')) {
                    db.createObjectStore('user_data', { keyPath: 'key' });
                }
                
                if (!db.objectStoreNames.contains('sync_queue')) {
                    db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }
    
    // Basic CRUD operations
    async get(key, storeName = 'user_data') {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                return reject('Database not initialized');
            }
            
            try {
                const transaction = this.db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                
                let request;
                if (storeName === 'user_data') {
                    // For user_data, we store by key name
                    request = store.get(key);
                } else {
                    // For other stores, we might want all data
                    request = key ? store.get(key) : store.getAll();
                }
                
                request.onsuccess = () => {
                    if (storeName === 'user_data') {
                        // For user_data store, we return the value, not the {key, value} object
                        resolve(request.result ? request.result.value : null);
                    } else {
                        resolve(request.result);
                    }
                };
                
                request.onerror = (event) => {
                    reject('Error reading from database: ' + event.target.error);
                };
            } catch (error) {
                reject('Error accessing database: ' + error);
            }
        });
    }
    
    async set(key, value, storeName = 'user_data') {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                return reject('Database not initialized');
            }
            
            try {
                const transaction = this.db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                
                let request;
                if (storeName === 'user_data') {
                    // For user_data, we wrap the value with its key
                    request = store.put({ key, value });
                } else {
                    // For other stores, the value should already have an id
                    request = store.put(value);
                }
                
                request.onsuccess = () => {
                    resolve(value);
                };
                
                request.onerror = (event) => {
                    reject('Error writing to database: ' + event.target.error);
                };
            } catch (error) {
                reject('Error accessing database: ' + error);
            }
        });
    }
    
    async delete(key, storeName = 'user_data') {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                return reject('Database not initialized');
            }
            
            try {
                const transaction = this.db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                
                const request = store.delete(key);
                
                request.onsuccess = () => {
                    resolve(true);
                };
                
                request.onerror = (event) => {
                    reject('Error deleting from database: ' + event.target.error);
                };
            } catch (error) {
                reject('Error accessing database: ' + error);
            }
        });
    }
    
    async clear(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                return reject('Database not initialized');
            }
            
            try {
                const transaction = this.db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                
                const request = store.clear();
                
                request.onsuccess = () => {
                    resolve(true);
                };
                
                request.onerror = (event) => {
                    reject('Error clearing database: ' + event.target.error);
                };
            } catch (error) {
                reject('Error accessing database: ' + error);
            }
        });
    }
}