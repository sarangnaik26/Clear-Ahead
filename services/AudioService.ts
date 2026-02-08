
class AudioService {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private musicLoopId: any = null;
  private currentStep = 0;

  public soundEnabled = localStorage.getItem('clearAhead_sound') !== 'false';
  public musicEnabled = localStorage.getItem('clearAhead_music') !== 'false';

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.musicGain = this.ctx.createGain();
      this.musicGain.connect(this.ctx.destination);
      this.updateMusicVolume();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private updateMusicVolume() {
    if (this.musicGain) {
      this.musicGain.gain.setTargetAtTime(this.musicEnabled ? 0.15 : 0, this.ctx!.currentTime, 0.1);
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('clearAhead_sound', this.soundEnabled.toString());
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    localStorage.setItem('clearAhead_music', this.musicEnabled.toString());
    this.updateMusicVolume();
    if (this.musicEnabled && !this.musicLoopId) {
      this.startMusic();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number, targetGain: GainNode | null = null) {
    if (!this.soundEnabled && !targetGain) return; // Only block SFX if sound disabled. Music uses musicGain.
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(targetGain || this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  startMusic() {
    this.init();
    if (this.musicLoopId) return;

    const tempo = 130;
    const stepDuration = 60 / tempo / 2; // 1/8th notes

    const playSequence = () => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Simple 8-bit bassline (C2, Eb2, F2, G2)
      const bassScale = [65.41, 77.78, 87.31, 98.00];
      const bassNote = bassScale[Math.floor(this.currentStep / 4) % 4];
      if (this.currentStep % 2 === 0) {
        this.playTone(bassNote, 'square', 0.2, 0.1, this.musicGain);
      }

      // Simple 8-bit melody (Pentatonic C minor)
      const melodyScale = [261.63, 311.13, 349.23, 392.00, 466.16, 523.25];
      const patterns = [
        [0, 2, 3, 5, 4, 3, 2, 0],
        [0, -1, 2, 3, 5, 3, 2, 0]
      ];

      const patternIdx = Math.floor(this.currentStep / 16) % 2;
      const noteIdx = this.currentStep % 8;
      const noteOffset = patterns[patternIdx][noteIdx];

      if (noteOffset !== -1 && (this.currentStep % 4 === 0 || Math.random() > 0.7)) {
        const freq = melodyScale[noteOffset % melodyScale.length];
        this.playTone(freq, 'triangle', 0.15, 0.08, this.musicGain);
      }

      this.currentStep++;
      this.musicLoopId = setTimeout(playSequence, stepDuration * 1000);
    };

    playSequence();
  }

  playTap() { this.playTone(440, 'square', 0.1, 0.1); }
  playButtonClick() { this.playTone(600, 'sine', 0.1, 0.15); }
  playSmash() {
    this.playTone(150, 'sawtooth', 0.3, 0.2);
    this.playTone(80, 'square', 0.2, 0.2);
  }
  playCoin() {
    this.playTone(880, 'sine', 0.1, 0.1);
    setTimeout(() => this.playTone(1100, 'sine', 0.15, 0.1), 50);
  }
  playCrash() {
    this.playTone(60, 'sawtooth', 0.5, 0.3);
    this.playTone(40, 'square', 0.4, 0.3);
  }
  suspend() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}

export const audioService = new AudioService();
