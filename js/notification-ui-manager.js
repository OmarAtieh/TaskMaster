// js/notification-ui-manager.js - Manages UI for non-blocking notifications

class NotificationUIManager {
    constructor(app) {
        this.app = app; // Reference to the main app instance
        this.notificationContainer = null;
        this.activeNotifications = new Map(); // To store notification elements and their timeouts

        this._createContainer();
    }

    _createContainer() {
        if (document.getElementById('notification-ui-container')) {
            this.notificationContainer = document.getElementById('notification-ui-container');
            return;
        }
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'notification-ui-container';
        // Conceptual styling - actual styles would be in CSS
        // this.notificationContainer.style.position = 'fixed';
        // this.notificationContainer.style.top = '20px';
        // this.notificationContainer.style.right = '20px';
        // this.notificationContainer.style.zIndex = '1000';
        // this.notificationContainer.style.display = 'flex';
        // this.notificationContainer.style.flexDirection = 'column';
        // this.notificationContainer.style.gap = '10px';
        document.body.appendChild(this.notificationContainer);
    }

    showNotification(message, type = 'info', duration = 3000) {
        if (!this.notificationContainer) {
            console.error('Notification container not found.');
            return;
        }

        const notificationElement = document.createElement('div');
        notificationElement.className = `notification-ui notification-ui-${type}`; // e.g., notification-ui notification-ui-success
        notificationElement.textContent = message;

        const closeButton = document.createElement('button');
        closeButton.className = 'close-btn';
        closeButton.innerHTML = '&times;'; // HTML entity for 'x'
        closeButton.onclick = () => {
            this._removeNotification(notificationElement);
        };
        notificationElement.appendChild(closeButton);

        this.notificationContainer.appendChild(notificationElement);

        let notificationTimeout = null;
        if (duration > 0) {
            notificationTimeout = setTimeout(() => {
                this._removeNotification(notificationElement);
            }, duration);
        }

        // Store the element and its timeout for potential manual removal
        this.activeNotifications.set(notificationElement, notificationTimeout);
    }

    _removeNotification(notificationElement) {
        if (this.activeNotifications.has(notificationElement)) {
            const timeoutId = this.activeNotifications.get(notificationElement);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            this.activeNotifications.delete(notificationElement);
        }

        if (notificationElement && notificationElement.parentElement) {
            notificationElement.parentElement.removeChild(notificationElement);
        }
    }
}

// Export the class if in Node.js environment (for potential testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NotificationUIManager };
} else {
    // Browser context
    window.NotificationUIManager = NotificationUIManager;
}
