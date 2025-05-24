class OnboardingView {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.currentStep = 0;
        this.onboardingContainerId = 'onboarding-container'; // Assuming UIManager provides a way to display this
    }

    showWelcomeStep() {
        const html = `
            <div class="onboarding-step welcome-step">
                <h1>Welcome to ProductivityApp!</h1>
                <p>Your new companion for managing tasks and boosting productivity.</p>
                <p class="onboarding-subtext"><strong>Works Offline:</strong> You can use this app entirely offline! Your data is stored locally on your device.</p>
                <button id="nextStepButton">Next</button>
            </div>
        `;
        // For now, returning HTML. Later, this might directly update a DOM element.
        return html;
    }

    showFirstTaskStep() {
        const html = `
            <div class="onboarding-step first-task-step">
                <h2>Create Your First Task</h2>
                <p>Let's get you started by creating your first task. What's one thing you want to accomplish today?</p>
                <!-- This part might be more complex and could reuse existing task form elements -->
                <input type="text" id="firstTaskInput" placeholder="e.g., Buy groceries">
                <button id="createFirstTaskButton" class="primary-button">Create Task</button>
                <button id="skipStepButton">Skip</button>
            </div>
        `;
        return html;
    }

    showInitialSetupStep() {
        const html = `
            <div class="onboarding-step initial-setup-step">
                <h2>Initial Setup</h2>
                <p class="onboarding-subtext">This app works fully offline. Signing in with Google is <strong>optional</strong> but allows you to sync your data across devices and keep a backup in your Google Drive.</p>
                <button id="googleSignInButton" class="primary-button">Sign In with Google (Optional)</button>
                <p class="onboarding-subtext-small">You can always connect your Google account later from settings if you choose to use the app offline for now.</p>
                <hr class="onboarding-hr">
                <p>Choose your preferred theme:</p>
                <select id="themePreference">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                </select>
                <button id="nextStepButton">Next</button>
            </div>
        `;
        return html;
    }

    showFeatureExplanationStep() {
        const html = `
            <div class="onboarding-step feature-explanation-step">
                <h2>Core Features</h2>
                <p><strong>Tasks:</strong> Easily create, manage, and track your to-dos.</p>
                <p><strong>Gamification:</strong> Earn points and level up as you complete tasks, making productivity fun!</p>
                <p class="onboarding-subtext"><strong>Your Data, Your Control:</strong> We believe you should always have control over your data. In the future, you'll be able to export all your app data.</p>
                <button id="nextStepButton">Next</button>
            </div>
        `;
        return html;
    }

    startOnboarding() {
        this.currentStep = 1; // Start with the first step
        this.displayStepContent();
        this.setupEventListeners(); // Basic event listener setup
    }

    displayStepContent() {
        let htmlContent = '';
        switch (this.currentStep) {
            case 1:
                htmlContent = this.showWelcomeStep();
                break;
            case 2:
                htmlContent = this.showFeatureExplanationStep();
                break;
            case 3:
                htmlContent = this.showInitialSetupStep();
                break;
            case 4:
                htmlContent = this.showFirstTaskStep();
                break;
            default:
                // Onboarding finished or invalid step
                console.log("Onboarding complete or invalid step.");
                this.uiManager.hideOnboarding(); // Assuming UIManager has this method
                return;
        }
        // This will be replaced by UIManager's method to display content
        this.uiManager.render(this.onboardingContainerId, htmlContent);
        console.log(`Displaying step ${this.currentStep}`);
    }

    setupEventListeners() {
        // Remove previous listeners if any to avoid duplicates
        const oldNextButton = document.getElementById('nextStepButton');
        if (oldNextButton) {
            oldNextButton.replaceWith(oldNextButton.cloneNode(true));
        }
        const oldSkipButton = document.getElementById('skipStepButton');
        if (oldSkipButton) {
            oldSkipButton.replaceWith(oldSkipButton.cloneNode(true));
        }
        const oldGoogleSignInButton = document.getElementById('googleSignInButton');
        if (oldGoogleSignInButton) {
            oldGoogleSignInButton.replaceWith(oldGoogleSignInButton.cloneNode(true));
        }
         const oldCreateFirstTaskButton = document.getElementById('createFirstTaskButton');
        if (oldCreateFirstTaskButton) {
            oldCreateFirstTaskButton.replaceWith(oldCreateFirstTaskButton.cloneNode(true));
        }


        const nextButton = document.getElementById('nextStepButton');
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                if (this.currentStep === 3) { // Assuming step 3 is showInitialSetupStep
                    const themePreference = document.getElementById('themePreference');
                    if (themePreference && this.uiManager && this.uiManager.app) {
                        this.uiManager.app.savePreferences({ theme: themePreference.value });
                        if (this.uiManager.app.notificationUI) {
                             this.uiManager.app.notificationUI.showNotification(`Theme set to ${themePreference.value}`, "info");
                        }
                    }
                }
                this.nextStep();
            });
        }

        const skipButton = document.getElementById('skipStepButton');
        if (skipButton) {
            skipButton.addEventListener('click', () => this.finishOnboarding());
        }
        
        const googleSignInButton = document.getElementById('googleSignInButton');
        if (googleSignInButton) {
            googleSignInButton.addEventListener('click', () => this.handleGoogleSignIn());
        }

        const createFirstTaskButton = document.getElementById('createFirstTaskButton');
        if (createFirstTaskButton) {
            createFirstTaskButton.addEventListener('click', () => this.handleCreateFirstTask());
        }
    }

    nextStep() {
        this.currentStep++;
        this.displayStepContent();
        this.setupEventListeners(); // Re-setup listeners for the new step's buttons
    }

    handleGoogleSignIn() {
        // Call app's authorize method
        if (this.uiManager && this.uiManager.app && this.uiManager.app.sync) {
            this.uiManager.app.sync.authorize();
        } else {
            console.error("SyncManager not available to handle Google Sign-In.");
            // Optionally, show an error to the user via notificationUI if this.uiManager.app is available
            if (this.uiManager && this.uiManager.app && this.uiManager.app.notificationUI) {
                this.uiManager.app.notificationUI.showNotification("Could not initiate Google Sign-In. Please try again later.", "error");
            }
        }
        // Do not call nextStep() here; the authorize() method handles redirection,
        // and the app's main logic will resume after authentication.
    }

    async handleCreateFirstTask() { // Added async
        const taskInput = document.getElementById('firstTaskInput');
        if (taskInput && taskInput.value.trim() !== '') {
            try {
                await this.uiManager.app.tasks.createTask({ title: taskInput.value.trim() });
                if (this.uiManager && this.uiManager.app && this.uiManager.app.notificationUI) {
                    this.uiManager.app.notificationUI.showNotification("First task created!", "success");
                }
                this.finishOnboarding(); // Call finishOnboarding after successful creation
            } catch (error) {
                console.error("Error creating first task:", error);
                if (this.uiManager && this.uiManager.app && this.uiManager.app.notificationUI) {
                    this.uiManager.app.notificationUI.showNotification("Could not create task: " + error.message, "error");
                }
                // Optionally, do not finish onboarding if task creation fails, or let the user skip.
            }
        } else {
            // Maybe show an error message
            console.log("Task input is empty.");
            if (this.uiManager && this.uiManager.app && this.uiManager.app.notificationUI) {
                this.uiManager.app.notificationUI.showNotification('Please enter a task description.', 'warning', 3000);
            } else {
                // Fallback if notificationUI is not available, though it should be via UIManager -> App
                alert('Please enter a task description.');
            }
        }
    }

    async finishOnboarding() { // Added async
        console.log("Finishing onboarding.");
        try {
            if (this.uiManager && this.uiManager.app && this.uiManager.app.completeSetup) {
                await this.uiManager.app.completeSetup();
            } else {
                console.error("completeSetup method not available on app instance.");
            }
        } catch (error) {
            console.error("Error during app.completeSetup():", error);
            // Optionally, notify the user that final setup steps failed
            if (this.uiManager && this.uiManager.app && this.uiManager.app.notificationUI) {
                this.uiManager.app.notificationUI.showNotification("Could not finalize app setup: " + error.message, "error");
            }
            // Decide if we should still hide onboarding or not
        }
        this.uiManager.hideOnboarding(); // Assuming UIManager has this method
        // Potentially set a flag in localStorage or user settings (app_initialized is now set in completeSetup)
        // localStorage.setItem('onboardingCompleted', 'true'); // This might be redundant now
    }
}
