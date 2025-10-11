/**
 * EcoVators Geolocation Verification System
 * Enhances proof uploads with location data for verification
 */

const GeoVerification = {
    // Initialize the geolocation system
    init: function() {
        this.setupEventListeners();
        console.log('Geolocation verification system initialized');
    },

    // Set up event listeners
    setupEventListeners: function() {
        // Find upload buttons and add geolocation functionality
        const uploadButtons = document.querySelectorAll('.upload-btn, button[data-action="upload"]');
        uploadButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleUploadWithLocation();
            });
        });
    },

    // Handle upload with location verification
    handleUploadWithLocation: function() {
        // Check if geolocation is supported
        if (!navigator.geolocation) {
            this.showMessage('Geolocation is not supported by your browser. Please upload manually.', 'warning');
            this.openFileUpload();
            return;
        }

        // Show loading indicator
        this.showMessage('Getting your location for verification...', 'info');

        // Get current position
        navigator.geolocation.getCurrentPosition(
            // Success callback
            (position) => {
                const locationData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date().toISOString()
                };
                
                // Store location data
                this.storeLocationData(locationData);
                
                // Show success message
                this.showMessage('Location verified! Please select your proof file.', 'success');
                
                // Open file upload dialog
                this.openFileUpload(locationData);
            },
            // Error callback
            (error) => {
                console.error('Geolocation error:', error);
                let errorMessage = 'Unable to get your location. ';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += 'Please enable location permissions and try again.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage += 'The request to get location timed out.';
                        break;
                    default:
                        errorMessage += 'An unknown error occurred.';
                }
                
                this.showMessage(errorMessage, 'error');
                
                // Allow manual upload without location
                setTimeout(() => {
                    if (confirm('Would you like to continue without location verification?')) {
                        this.openFileUpload();
                    }
                }, 1500);
            },
            // Options
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    },

    // Store location data for verification
    storeLocationData: function(locationData) {
        // Store in session storage for current upload session
        sessionStorage.setItem('ecovatorsLocationData', JSON.stringify(locationData));
        
        // Also store in a history of locations for admin verification
        let locationHistory = JSON.parse(localStorage.getItem('ecovatorsLocationHistory') || '[]');
        locationHistory.push(locationData);
        
        // Keep only the last 20 locations
        if (locationHistory.length > 20) {
            locationHistory = locationHistory.slice(-20);
        }
        
        localStorage.setItem('ecovatorsLocationHistory', JSON.stringify(locationHistory));
    },

    // Open file upload dialog
    openFileUpload: function(locationData = null) {
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        // Add to body and trigger click
        document.body.appendChild(fileInput);
        fileInput.click();
        
        // Handle file selection
        fileInput.addEventListener('change', (e) => {
            if (fileInput.files && fileInput.files[0]) {
                this.handleFileSelection(fileInput.files[0], locationData);
            }
            
            // Remove the input element
            document.body.removeChild(fileInput);
        });
    },

    // Handle the selected file
    handleFileSelection: function(file, locationData) {
        // Create a preview of the selected file
        this.createFilePreview(file, locationData);
        
        // In a real implementation, this would upload to a server
        // For demo purposes, we'll simulate a successful upload
        setTimeout(() => {
            this.showMessage('Proof uploaded successfully with location verification!', 'success');
            
            // Update the UI to show the upload
            this.updateUploadHistory(file, locationData);
        }, 1500);
    },

    // Create a preview of the selected file
    createFilePreview: function(file, locationData) {
        // Create a container for the preview
        const previewContainer = document.createElement('div');
        previewContainer.className = 'upload-preview';
        
        // Create loading indicator
        previewContainer.innerHTML = `
            <div class="preview-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Uploading and verifying...</p>
            </div>
        `;
        
        // Add to page
        const uploadsContainer = document.querySelector('.uploads .upload-list') || document.body;
        uploadsContainer.prepend(previewContainer);
        
        // Create file reader to display image preview
        const reader = new FileReader();
        reader.onload = function(e) {
            // Update preview with image and location data
            previewContainer.innerHTML = `
                <div class="preview-content">
                    <img src="${e.target.result}" alt="Upload preview" class="preview-image">
                    <div class="preview-info">
                        <p class="preview-filename">${file.name}</p>
                        <p class="preview-size">${(file.size / 1024).toFixed(2)} KB</p>
                        ${locationData ? `
                            <div class="location-badge verified">
                                <i class="fas fa-map-marker-alt"></i> Location Verified
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        };
        
        // Read the file as a data URL
        reader.readAsDataURL(file);
    },

    // Update upload history in the UI
    updateUploadHistory: function(file, locationData) {
        const uploadsContainer = document.querySelector('.uploads .upload-list');
        if (!uploadsContainer) return;
        
        // Remove loading preview if it exists
        const loadingPreview = document.querySelector('.upload-preview');
        if (loadingPreview) {
            uploadsContainer.removeChild(loadingPreview);
        }
        
        // Create a new upload entry
        const uploadEntry = document.createElement('div');
        uploadEntry.className = 'upload-item';
        
        // Get current date for the upload
        const now = new Date();
        const dateString = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
        
        // Create upload entry content
        uploadEntry.innerHTML = `
            <div class="upload-info">
                <div class="upload-title">
                    <i class="fas fa-file-image"></i>
                    <span>${file.name}</span>
                </div>
                <div class="upload-meta">
                    <span class="upload-date">${dateString}</span>
                    ${locationData ? `
                        <span class="location-badge verified">
                            <i class="fas fa-map-marker-alt"></i> Verified
                        </span>
                    ` : ''}
                </div>
            </div>
            <div class="upload-status">
                <span class="status-badge pending">Pending Review</span>
            </div>
        `;
        
        // Add to uploads container
        uploadsContainer.prepend(uploadEntry);
    },

    // Show message to the user
    showMessage: function(message, type = 'info') {
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `geo-message ${type}`;
        
        // Set icon based on message type
        let icon = 'info-circle';
        switch(type) {
            case 'success': icon = 'check-circle'; break;
            case 'warning': icon = 'exclamation-triangle'; break;
            case 'error': icon = 'times-circle'; break;
        }
        
        // Set message content
        messageElement.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        // Add to body
        document.body.appendChild(messageElement);
        
        // Add CSS for the message
        if (!document.getElementById('geo-message-styles')) {
            const styles = document.createElement('style');
            styles.id = 'geo-message-styles';
            styles.textContent = `
                .geo-message {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 12px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    display: flex;
                    align-items: center;
                    z-index: 1000;
                    animation: slideIn 0.3s ease, fadeOut 0.5s ease 2.5s forwards;
                    max-width: 80%;
                }
                
                .geo-message i {
                    margin-right: 10px;
                    font-size: 18px;
                }
                
                .geo-message.info {
                    background-color: #E3F2FD;
                    color: #0D47A1;
                }
                
                .geo-message.success {
                    background-color: #E8F5E9;
                    color: #2E7D32;
                }
                
                .geo-message.warning {
                    background-color: #FFF8E1;
                    color: #FF8F00;
                }
                
                .geo-message.error {
                    background-color: #FFEBEE;
                    color: #C62828;
                }
                
                .location-badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 3px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                }
                
                .location-badge.verified {
                    background-color: #E8F5E9;
                    color: #2E7D32;
                }
                
                .location-badge i {
                    margin-right: 4px;
                }
                
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; visibility: hidden; }
                }
            `;
            document.head.appendChild(styles);
        }
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (document.body.contains(messageElement)) {
                document.body.removeChild(messageElement);
            }
        }, 3000);
    }
};

// Initialize the geolocation verification system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    GeoVerification.init();
});