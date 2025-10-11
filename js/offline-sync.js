/**
 * EcoVators Offline Functionality
 * Enables offline data storage and synchronization when connection is restored
 */

const OfflineSync = {
    // Initialize offline functionality
    init: function() {
        this.setupEventListeners();
        this.checkConnectionStatus();
        this.loadOfflineData();
        console.log('Offline sync functionality initialized');
    },

    // Set up event listeners for online/offline events
    setupEventListeners: function() {
        window.addEventListener('online', () => {
            this.handleOnlineStatus();
        });
        
        window.addEventListener('offline', () => {
            this.handleOfflineStatus();
        });

        // Check connection status periodically
        setInterval(() => this.checkConnectionStatus(), 30000);
    },

    // Check current connection status
    checkConnectionStatus: function() {
        const isOnline = navigator.onLine;
        if (isOnline) {
            this.handleOnlineStatus();
        } else {
            this.handleOfflineStatus();
        }
        return isOnline;
    },

    // Handle when device goes online
    handleOnlineStatus: function() {
        const statusIndicator = document.getElementById('connection-status');
        if (statusIndicator) {
            statusIndicator.textContent = 'Online';
            statusIndicator.className = 'status-online';
        }
        
        // Sync any pending data
        this.syncOfflineData();
    },

    // Handle when device goes offline
    handleOfflineStatus: function() {
        const statusIndicator = document.getElementById('connection-status');
        if (statusIndicator) {
            statusIndicator.textContent = 'Offline';
            statusIndicator.className = 'status-offline';
        }
        
        // Show offline notification
        this.showOfflineNotification();
    },

    // Show notification when app goes offline
    showOfflineNotification: function() {
        const notification = document.createElement('div');
        notification.className = 'offline-notification';
        notification.innerHTML = `
            <i class="fas fa-wifi-slash"></i>
            <p>You're currently offline. Your data will be saved locally and synced when you reconnect.</p>
            <button class="close-notification">×</button>
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 5 seconds or when closed
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 5000);
        
        notification.querySelector('.close-notification').addEventListener('click', () => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        });
    },

    // Save data to local storage
    saveOfflineData: function(key, data) {
        try {
            const offlineData = this.getOfflineData();
            offlineData[key] = {
                data: data,
                timestamp: new Date().getTime(),
                synced: false
            };
            localStorage.setItem('ecovatorsOfflineData', JSON.stringify(offlineData));
            return true;
        } catch (error) {
            console.error('Error saving offline data:', error);
            return false;
        }
    },

    // Get all offline data
    getOfflineData: function() {
        try {
            const data = localStorage.getItem('ecovatorsOfflineData');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error retrieving offline data:', error);
            return {};
        }
    },

    // Load offline data when app starts
    loadOfflineData: function() {
        const offlineData = this.getOfflineData();
        
        // Apply offline data to UI elements
        if (offlineData.userProfile) {
            this.updateUserProfileUI(offlineData.userProfile.data);
        }
        
        if (offlineData.completedChallenges) {
            this.updateChallengesUI(offlineData.completedChallenges.data);
        }
        
        if (offlineData.gameProgress) {
            this.updateGameProgressUI(offlineData.gameProgress.data);
        }
    },

    // Sync offline data when connection is restored
    syncOfflineData: function() {
        const offlineData = this.getOfflineData();
        let syncedData = {...offlineData};
        let syncPromises = [];
        
        // Process each unsynchronized data item
        for (const [key, item] of Object.entries(offlineData)) {
            if (!item.synced) {
                // Create a promise for each sync operation
                const syncPromise = this.syncItem(key, item.data)
                    .then(() => {
                        syncedData[key].synced = true;
                        return key;
                    })
                    .catch(error => {
                        console.error(`Failed to sync ${key}:`, error);
                        return null;
                    });
                
                syncPromises.push(syncPromise);
            }
        }
        
        // Wait for all sync operations to complete
        Promise.all(syncPromises)
            .then(results => {
                // Update local storage with synced status
                localStorage.setItem('ecovatorsOfflineData', JSON.stringify(syncedData));
                
                // Show sync success notification if any items were synced
                const syncedItems = results.filter(item => item !== null);
                if (syncedItems.length > 0) {
                    this.showSyncSuccessNotification(syncedItems.length);
                }
            });
    },

    // Sync a single item with the server (mock implementation)
    syncItem: function(key, data) {
        return new Promise((resolve, reject) => {
            // This would normally be an API call to sync with server
            // For demo purposes, we'll just simulate a successful sync after a delay
            setTimeout(() => {
                console.log(`Synced ${key} with server:`, data);
                resolve();
            }, 1000);
        });
    },

    // Show notification when sync is successful
    showSyncSuccessNotification: function(count) {
        const notification = document.createElement('div');
        notification.className = 'sync-notification';
        notification.innerHTML = `
            <i class="fas fa-sync-alt"></i>
            <p>Successfully synchronized ${count} item${count !== 1 ? 's' : ''}.</p>
            <button class="close-notification">×</button>
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds or when closed
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 3000);
        
        notification.querySelector('.close-notification').addEventListener('click', () => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        });
    },

    // Update user profile UI with offline data
    updateUserProfileUI: function(profileData) {
        // Update profile elements if they exist
        const nameElement = document.querySelector('.user-info h3');
        if (nameElement && profileData.name) {
            nameElement.textContent = profileData.name;
        }
        
        const locationElement = document.querySelector('.user-info .location');
        if (locationElement && profileData.location) {
            locationElement.textContent = profileData.location;
        }
        
        const levelElement = document.querySelector('.user-info .level');
        if (levelElement && profileData.level) {
            levelElement.textContent = `Level ${profileData.level}`;
        }
    },

    // Update challenges UI with offline data
    updateChallengesUI: function(challengesData) {
        // Implementation would update challenges section with offline data
        console.log('Updating challenges UI with offline data:', challengesData);
    },

    // Update game progress UI with offline data
    updateGameProgressUI: function(gameData) {
        // Implementation would update game progress with offline data
        if (gameData.score) {
            const scoreElement = document.getElementById('game-score');
            if (scoreElement) {
                scoreElement.textContent = gameData.score;
            }
        }
        
        if (gameData.level) {
            const levelElement = document.getElementById('game-level');
            if (levelElement) {
                levelElement.textContent = gameData.level;
            }
        }
    }
};

// Initialize offline functionality when the page loads
document.addEventListener('DOMContentLoaded', () => {
    OfflineSync.init();
});