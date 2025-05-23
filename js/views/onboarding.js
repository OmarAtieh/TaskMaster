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
                <p>Sign in with Google to sync your tasks and preferences across devices.</p>
                <button id="googleSignInButton" class="primary-button">Sign In with Google</button>
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
            nextButton.addEventListener('click', () => this.nextStep());
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
        // Placeholder for Google Sign-In logic
        console.log("Google Sign-In button clicked. Implement Google Sign-In logic here.");
        // Potentially: this.uiManager.authManager.signInWithGoogle();
        // After successful sign-in, proceed to the next step or finish onboarding
        this.nextStep(); 
    }

    handleCreateFirstTask() {
        const taskInput = document.getElementById('firstTaskInput');
        if (taskInput && taskInput.value.trim() !== '') {
            console.log(`Creating first task: ${taskInput.value.trim()}`);
            // Potentially: this.uiManager.taskManager.createTask(taskInput.value.trim(), ...);
            this.finishOnboarding();
        } else {
            // Maybe show an error message
            console.log("Task input is empty.");
        }
    }

    finishOnboarding() {
        console.log("Finishing onboarding.");
        this.uiManager.hideOnboarding(); // Assuming UIManager has this method
        // Potentially set a flag in localStorage or user settings
        // localStorage.setItem('onboardingCompleted', 'true');
    }
}
