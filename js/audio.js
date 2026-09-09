/**
 * Zenith Audio Engine - Procedural Web Audio Synthesizer & Coffee Shop Music
 * Features:
 * 1. Lo-Fi Coffee Shop Jazz / Rhodes chords (Dm9 -> G13 -> Cmaj9 -> A7alt)
 * 2. Cozy Vinyl Crackle & Cafe Room Ambience
 * 3. Occasional gentle barista ceramic cup clinks & steam whispers
 * 4. Realistic liquid drops, continuous pouring streams, steam hiss, and celebration chimes
 * 100% procedural Web Audio API - ZERO external MP3/WAV assets needed!
 */

class ZenithAudioEngine {
  constructor() {
    this.ctx = null;
    this.isEnabled = false;
    this.isMuted = false;
    this.masterGain = null;
    this.analyser = null;
    this.dataArray = null;

    // Coffee Shop Music & Ambience Channels
    this.lofiGain = null;
    this.vinylGain = null;
    this.baristaGain = null;
    this.isCafeMusicActive = true;
    this.currentChordIndex = 0;
    this.chordTimer = null;
    this.baristaTimer = null;

    // Steam & Pour continuous nodes
    this.steamNode = null;
    this.steamGain = null;
    this.pourNode = null;
    this.pourGain = null;

    // Jazz chord progressions for Coffee Shop Lo-Fi (Frequencies in Hz)
    this.jazzChords = [
      // Dm9: D3, F3, A3, C4, E4
      [146.83, 174.61, 220.00, 261.63, 329.63],
      // G13: G2, F3, B3, E4
      [98.00, 174.61, 246.94, 329.63],
      // Cmaj9: C3, E3, G3, B3, D4
      [130.81, 164.81, 196.00, 246.94, 293.66],
      // Am7(9): A2, G3, C4, E4, B4
      [110.00, 196.00, 261.63, 329.63, 493.88]
    ];
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      console.warn("Web Audio API not supported in this browser.");
      return;
    }

    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);

    // Audio Visualizer Analyser
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.isEnabled = true;

    // Initialize Coffee Shop Music and Vinyl Ambience
    this.setupVinylCrackle();
    this.setupCafeBaristaAmbience();
    this.startCoffeeShopJazzProgression();
  }

  resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    if (!this.ctx) {
      this.init();
      return true;
    }
    this.resumeContext();
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime, 0.05);
    }
    return !this.isMuted;
  }

  getByteFrequencyData() {
    if (!this.analyser || this.isMuted || !this.isEnabled) {
      return null;
    }
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  // ========================================================================
  // COFFEE SHOP MUSIC: LO-FI RHODES / JAZZ CHORD ARPEGGIOS
  // ========================================================================
  startCoffeeShopJazzProgression() {
    if (!this.ctx) return;

    this.lofiGain = this.ctx.createGain();
    this.lofiGain.gain.setValueAtTime(0.18, this.ctx.currentTime); // Soft background level
    this.lofiGain.connect(this.masterGain);

    const playNextChord = () => {
      if (this.isMuted || !this.isCafeMusicActive) {
        this.chordTimer = setTimeout(playNextChord, 4000);
        return;
      }

      this.resumeContext();
      const chord = this.jazzChords[this.currentChordIndex];
      this.currentChordIndex = (this.currentChordIndex + 1) % this.jazzChords.length;

      const now = this.ctx.currentTime;
      const duration = 3.8;

      // Master low-pass filter for vintage Rhodes lo-fi warmth
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, now);
      filter.frequency.exponentialRampToValueAtTime(750, now + duration);
      filter.Q.setValueAtTime(1.5, now);
      filter.connect(this.lofiGain);

      // Play each note in the chord with subtle micro-strum arpeggio
      chord.forEach((freq, noteIdx) => {
        const noteTime = now + (noteIdx * 0.045);
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        // Sine with slight triangle harmonic for electric piano timbre
        osc.type = noteIdx === 0 ? 'sine' : (Math.random() > 0.4 ? 'sine' : 'triangle');
        osc.frequency.setValueAtTime(freq, noteTime);

        // Gentle chorus vibrato
        const vibrato = this.ctx.createOscillator();
        vibrato.frequency.setValueAtTime(4.2, noteTime);
        const vibratoGain = this.ctx.createGain();
        vibratoGain.gain.setValueAtTime(0.8, noteTime);
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);
        vibrato.start(noteTime);
        vibrato.stop(noteTime + duration);

        // Soft Rhodes envelope
        noteGain.gain.setValueAtTime(0, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.12 / (chord.length * 0.6), noteTime + 0.08);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + duration);

        osc.connect(noteGain);
        noteGain.connect(filter);

        osc.start(noteTime);
        osc.stop(noteTime + duration + 0.1);
      });

      this.chordTimer = setTimeout(playNextChord, 3800);
    };

    playNextChord();
  }

  // ========================================================================
  // COFFEE SHOP AMBIENCE: VINYL CRACKLE & TAPE WARMTH
  // ========================================================================
  setupVinylCrackle() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Occasional needle pop / dust tick
      if (Math.random() < 0.0006) {
        output[i] = (Math.random() * 2 - 1) * 0.6;
      } else {
        output[i] = (Math.random() * 2 - 1) * 0.015; // Low hiss
      }
    }

    const vinylNode = this.ctx.createBufferSource();
    vinylNode.buffer = noiseBuffer;
    vinylNode.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    this.vinylGain = this.ctx.createGain();
    this.vinylGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    vinylNode.connect(filter);
    filter.connect(this.vinylGain);
    this.vinylGain.connect(this.masterGain);

    vinylNode.start();
  }

  // ========================================================================
  // BARISTA AMBIENCE: OCCASIONAL CERAMIC CLINK & STEAM PUFF
  // ========================================================================
  setupCafeBaristaAmbience() {
    this.baristaGain = this.ctx.createGain();
    this.baristaGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    this.baristaGain.connect(this.masterGain);

    const triggerRandomBaristaSound = () => {
      if (!this.isMuted && this.isEnabled && this.ctx) {
        this.resumeContext();
        if (Math.random() > 0.4) {
          this.playCeramicCupClink();
        } else {
          this.playDistantSteamPuff();
        }
      }
      // Trigger organically every 8 to 16 seconds
      const nextTime = 8000 + Math.random() * 8000;
      this.baristaTimer = setTimeout(triggerRandomBaristaSound, nextTime);
    };

    this.baristaTimer = setTimeout(triggerRandomBaristaSound, 6000);
  }

  playCeramicCupClink() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const freqs = [2093.0, 3135.9]; // C7, G7 gentle high bell clink
    freqs.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 60, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.baristaGain);
      osc.start(now);
      osc.stop(now + 0.38);
    });
  }

  playDistantSteamPuff() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3200, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.baristaGain);
    noise.start(now);
  }

  // ========================================================================
  // INTERACTIVE SFX: DROPS, POURS, CELEBRATION
  // ========================================================================
  playWaterDrop(pitchFactor = 1.0) {
    if (!this.isEnabled || this.isMuted) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = 750 * pitchFactor;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * 1.5, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.1, t + 0.14);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.45, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(baseFreq, t);
    filter.Q.setValueAtTime(8, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  startPourSound() {
    if (!this.isEnabled || this.isMuted || this.pourNode) return;
    this.resumeContext();

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.95 * b1 + white * 0.1;
      b2 = 0.85 * b2 + white * 0.2;
      output[i] = (b0 + b1 + b2) * 0.5;
    }

    this.pourNode = this.ctx.createBufferSource();
    this.pourNode.buffer = noiseBuffer;
    this.pourNode.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    this.pourGain = this.ctx.createGain();
    this.pourGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.pourGain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 0.2);

    this.pourNode.connect(filter);
    filter.connect(this.pourGain);
    this.pourGain.connect(this.masterGain);

    this.pourNode.start();
  }

  stopPourSound() {
    if (this.pourGain && this.ctx) {
      this.pourGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      setTimeout(() => {
        if (this.pourNode) {
          try { this.pourNode.stop(); } catch(e){}
          this.pourNode.disconnect();
          this.pourNode = null;
        }
      }, 250);
    }
  }

  startSteamHiss(intensity = 0.2) {
    if (!this.isEnabled || this.isMuted || this.steamNode) return;
    this.resumeContext();

    const bufferSize = this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.steamNode = this.ctx.createBufferSource();
    this.steamNode.buffer = noiseBuffer;
    this.steamNode.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2800, this.ctx.currentTime);

    this.steamGain = this.ctx.createGain();
    this.steamGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.steamGain.gain.linearRampToValueAtTime(intensity, this.ctx.currentTime + 0.3);

    this.steamNode.connect(filter);
    filter.connect(this.steamGain);
    this.steamGain.connect(this.masterGain);

    this.steamNode.start();
  }

  stopSteamHiss() {
    if (this.steamGain && this.ctx) {
      this.steamGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      setTimeout(() => {
        if (this.steamNode) {
          try { this.steamNode.stop(); } catch(e){}
          this.steamNode.disconnect();
          this.steamNode = null;
        }
      }, 350);
    }
  }

  playCelebrationChime() {
    if (!this.isEnabled || this.isMuted) return;
    this.resumeContext();

    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, index) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.35, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 1.3);
      }, index * 120);
    });
  }

  playClick() {
    if (!this.isEnabled || this.isMuted) return;
    this.resumeContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1800, t);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  // Volume sliders
  setMusicVolume(vol) {
    if (this.lofiGain && this.ctx) {
      this.lofiGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)) * 0.35, this.ctx.currentTime);
    }
  }

  setVinylVolume(vol) {
    if (this.vinylGain && this.ctx) {
      this.vinylGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)) * 0.08, this.ctx.currentTime);
    }
  }

  setBaristaVolume(vol) {
    if (this.baristaGain && this.ctx) {
      this.baristaGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)) * 0.25, this.ctx.currentTime);
    }
  }
}

// Global audio singleton
window.zenithAudio = new ZenithAudioEngine();
