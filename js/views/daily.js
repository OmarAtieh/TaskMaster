// views/daily.js - Daily missions view

class DailyView {
    constructor(app) {
      this.app = app;
    }
    
    async render() {
      return `
        <div class="daily-view">
          <div class="view-header">
            <h2>Daily Missions</h2>
            <div class="day-streak">
              <span class="streak-count">5</span> day streak
            </div>
          </div>
          
          <div class="daily-missions">
            <div class="empty-state">
              <p>Your daily missions will appear here.</p>
              <button id="generate-missions" class="secondary-button">Generate Today's Missions</button>
            </div>
          </div>
        </div>
      `;
    }
    
    initializeEventListeners() {
      const generateButton = document.getElementById('generate-missions');
      if (generateButton) {
        generateButton.addEventListener('click', () => {
          this.generateDailyMissions();
        });
      }
    }
    
    generateDailyMissions() {
      console.log('Generating daily missions');
      // We'll implement this when we build the daily mission system
    }
  }
  
  // Export the class if in Node.js environment
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DailyView };
  } else {
    // Browser context
    window.DailyView = DailyView;
  }