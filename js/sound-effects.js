// sound-effects.js - Audio generation using Web Audio API

class SoundEffects {
    constructor() {
      // Initialize audio context only when needed
      this.audioContext = null;
      this.sounds = {};
      this.enabled = true;
    }
    
    // Initialize audio context (must be called after user interaction)
    init() {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
    }
    
    setEnabled(enabled) {
      this.enabled = enabled;
    }
    
    // Play a named sound effect
    play(soundName) {
      if (!this.enabled) return;
      
      try {
        this.init();
        
        // Create sound if it doesn't exist
        if (!this.sounds[soundName]) {
          this.createSound(soundName);
        }
        
        // Play the sound
        const sound = this.sounds[soundName];
        sound();
      } catch (e) {
        console.error('Error playing sound:', e);
      }
    }
    
    // Create sound functions
    createSound(soundName) {
      switch (soundName) {
        case 'taskComplete':
          this.sounds[soundName] = () => {
            const time = this.audioContext.currentTime;
            
            // Create oscillator
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(700, time);
            osc.frequency.exponentialRampToValueAtTime(1200, time + 0.1);
            
            // Create gain node for volume control
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.3, time + 0.05);
            gain.gain.linearRampToValueAtTime(0, time + 0.3);
            
            // Connect and start
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.start(time);
            osc.stop(time + 0.3);
          };
          break;
          
        case 'levelUp':
          this.sounds[soundName] = () => {
            const time = this.audioContext.currentTime;
            
            // First note
            const osc1 = this.audioContext.createOscillator();
            osc1.type = 'triangle';
            osc1.frequency.setValueAtTime(600, time);
            
            // Second note
            const osc2 = this.audioContext.createOscillator();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(800, time + 0.1);
            
            // Third note
            const osc3 = this.audioContext.createOscillator();
            osc3.type = 'triangle';
            osc3.frequency.setValueAtTime(1000, time + 0.2);
            
            // Final note
            const osc4 = this.audioContext.createOscillator();
            osc4.type = 'triangle';
            osc4.frequency.setValueAtTime(1200, time + 0.3);
            
            // Gain nodes
            const masterGain = this.audioContext.createGain();
            masterGain.gain.setValueAtTime(0.3, time);
            
            const gain1 = this.audioContext.createGain();
            gain1.gain.setValueAtTime(0, time);
            gain1.gain.linearRampToValueAtTime(1, time + 0.05);
            gain1.gain.linearRampToValueAtTime(0, time + 0.15);
            
            const gain2 = this.audioContext.createGain();
            gain2.gain.setValueAtTime(0, time + 0.1);
            gain2.gain.linearRampToValueAtTime(1, time + 0.15);
            gain2.gain.linearRampToValueAtTime(0, time + 0.25);
            
            const gain3 = this.audioContext.createGain();
            gain3.gain.setValueAtTime(0, time + 0.2);
            gain3.gain.linearRampToValueAtTime(1, time + 0.25);
            gain3.gain.linearRampToValueAtTime(0, time + 0.35);
            
            const gain4 = this.audioContext.createGain();
            gain4.gain.setValueAtTime(0, time + 0.3);
            gain4.gain.linearRampToValueAtTime(1, time + 0.35);
            gain4.gain.linearRampToValueAtTime(0, time + 0.6);
            
            // Connect everything
            osc1.connect(gain1);
            osc2.connect(gain2);
            osc3.connect(gain3);
            osc4.connect(gain4);
            
            gain1.connect(masterGain);
            gain2.connect(masterGain);
            gain3.connect(masterGain);
            gain4.connect(masterGain);
            
            masterGain.connect(this.audioContext.destination);
            
            // Start and stop oscillators
            osc1.start(time);
            osc1.stop(time + 0.15);
            
            osc2.start(time + 0.1);
            osc2.stop(time + 0.25);
            
            osc3.start(time + 0.2);
            osc3.stop(time + 0.35);
            
            osc4.start(time + 0.3);
            osc4.stop(time + 0.6);
          };
          break;
          
        case 'notification':
          this.sounds[soundName] = () => {
            const time = this.audioContext.currentTime;
            
            // Create oscillator
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, time);
            osc.frequency.linearRampToValueAtTime(600, time + 0.2);
            
            // Create gain node for volume control
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.2, time + 0.05);
            gain.gain.linearRampToValueAtTime(0, time + 0.4);
            
            // Connect and start
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.start(time);
            osc.stop(time + 0.4);
          };
          break;
          
        case 'click':
        default:
          // Generic click sound
          this.sounds[soundName] = () => {
            const time = this.audioContext.currentTime;
            
            // Create oscillator
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(500, time);
            
            // Create gain node for volume control
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.1, time + 0.01);
            gain.gain.linearRampToValueAtTime(0, time + 0.1);
            
            // Connect and start
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.start(time);
            osc.stop(time + 0.1);
          };
      }
    }
  }
  
  // Export the class if in Node.js environment
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SoundEffects };
  } else {
    // Browser context
    window.SoundEffects = SoundEffects;
  }