// graphics.js - Programmatically generated UI elements

class UIGraphics {
    constructor(theme = 'light') {
      this.theme = theme;
      this.colors = this.getThemeColors(theme);
    }
    
    // Update theme colors when theme changes
    setTheme(theme) {
      this.theme = theme;
      this.colors = this.getThemeColors(theme);
    }
    
    // Get color palette based on theme
    getThemeColors(theme) {
      const isDark = theme === 'dark';
      
      return {
        // Primary colors
        primary: isDark ? '#BB86FC' : '#6200EE',
        primaryVariant: isDark ? '#3700B3' : '#3700B3',
        secondary: isDark ? '#03DAC6' : '#03DAC6',
        secondaryVariant: isDark ? '#018786' : '#018786',
        
        // Background colors
        background: isDark ? '#121212' : '#FFFFFF',
        surface: isDark ? '#1F1F1F' : '#FFFFFF',
        
        // Supporting colors
        error: isDark ? '#CF6679' : '#B00020',
        onPrimary: isDark ? '#000000' : '#FFFFFF',
        onSecondary: isDark ? '#000000' : '#000000',
        onBackground: isDark ? '#FFFFFF' : '#000000',
        onSurface: isDark ? '#FFFFFF' : '#000000',
        onError: isDark ? '#000000' : '#FFFFFF',
        
        // Additional UI colors
        divider: isDark ? '#333333' : '#DDDDDD',
        overlay: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        
        // Priority colors (consistent across themes)
        priority: {
          p1: '#CF6679',
          p2: '#FFAA00',
          p3: '#3CADA1',
          p4: '#5E97F6',
          p5: '#9E9E9E'
        },
        
        // Difficulty colors (consistent across themes)
        difficulty: {
          d1: '#90d26d', // Easy
          d2: '#6bd0a8',
          d3: '#5badde',
          d4: '#6b7eff',
          d5: '#d975d4'  // Hard
        }
      };
    }
    
    // Generate app logo as SVG
    getAppLogo(size = 48) {
      const primaryColor = this.colors.primary;
      const secondaryColor = this.colors.secondary;
      const textColor = this.colors.onPrimary;
      
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
        <!-- Background circle -->
        <circle cx="50" cy="50" r="48" fill="${primaryColor}" />
        
        <!-- Checkmark/task list styling -->
        <path d="M30 40 L70 40 L70 46 L30 46 Z" fill="${textColor}" />
        <path d="M30 55 L70 55 L70 61 L30 61 Z" fill="${textColor}" />
        <path d="M30 70 L50 70 L50 76 L30 76 Z" fill="${textColor}" />
        
        <!-- Star corner for gamification element -->
        <path d="M70 65 L73 76 L65 69 L75 69 L67 76 Z" fill="${secondaryColor}" />
        
        <!-- Level indicator -->
        <circle cx="75" cy="30" r="15" fill="${secondaryColor}" stroke="${textColor}" stroke-width="2" />
        <text x="75" y="35" font-family="Arial" font-size="14" font-weight="bold" text-anchor="middle" fill="${textColor}">TM</text>
      </svg>`;
    }
    
    // Generate favicon for browser tabs
    getFavicon() {
      return `data:image/svg+xml,${encodeURIComponent(this.getAppLogo(32))}`;
    }
    
    // Additional methods would go here (icons, UI elements, etc.)
  }
  
  // Export the class
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIGraphics };
  } else {
    // Browser context
    window.UIGraphics = UIGraphics;
  }