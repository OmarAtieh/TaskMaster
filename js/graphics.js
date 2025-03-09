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
          <!-- Background Circle -->
          <circle cx="50" cy="50" r="48" fill="${primaryColor}" />
        
          <!-- Task List -->
          <rect x="25" y="20" width="40" height="50" rx="6" ry="6" fill="${textColor}" stroke="${secondaryColor}" stroke-width="2"/>
        
          <!-- Checkboxes -->
          <rect x="30" y="28" width="6" height="6" rx="1" ry="1" fill="none" stroke="${secondaryColor}" stroke-width="2"/>
          <rect x="30" y="40" width="6" height="6" rx="1" ry="1" fill="none" stroke="${secondaryColor}" stroke-width="2"/>
          <rect x="30" y="52" width="6" height="6" rx="1" ry="1" fill="none" stroke="${secondaryColor}" stroke-width="2"/>
        
          <!-- Checkmarks -->
          <path d="M31 30 L33 33 L35 27" stroke="${secondaryColor}" stroke-width="2" fill="none"/>
          <path d="M31 42 L33 45 L35 39" stroke="${secondaryColor}" stroke-width="2" fill="none"/>
        
          <!-- Task List Lines -->
          <line x1="40" y1="30" x2="60" y2="30" stroke="${secondaryColor}" stroke-width="2"/>
          <line x1="40" y1="42" x2="60" y2="42" stroke="${secondaryColor}" stroke-width="2"/>
          <line x1="40" y1="54" x2="52" y2="54" stroke="${secondaryColor}" stroke-width="2"/>
        
          <!-- Lightning Bolt (Offset for Balance) -->
          <polygon points="58,60 72,65 62,78 74,78 50,95 58,80 45,80" 
            fill="${secondaryColor}" stroke="${textColor}" stroke-width="2"/>
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