// Web Audio API synthesizer for lobby background music and sound effects

class LobbyAudioController {
  private audioCtx: AudioContext | null = null;
  private musicGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private isPlayingMusic: boolean = false;
  private musicInterval: any = null;
  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.7;

  private initContext() {
    if (typeof window === 'undefined') return;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume / 100));
    if (this.musicGainNode && this.audioCtx) {
      this.musicGainNode.gain.setValueAtTime(this.musicVolume * 0.15, this.audioCtx.currentTime);
    }
    if (volume === 0 && this.isPlayingMusic) {
      this.stopLobbyMusic();
    } else if (volume > 0 && !this.isPlayingMusic) {
      this.startLobbyMusic();
    }
  }

  public setSfxVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume / 100));
  }

  // Play a gentle, cheerful marimba / upbeat arpeggio tune
  public startLobbyMusic() {
    if (this.isPlayingMusic || this.musicVolume <= 0) return;
    this.initContext();
    if (!this.audioCtx) return;

    this.isPlayingMusic = true;
    this.musicGainNode = this.audioCtx.createGain();
    this.musicGainNode.gain.setValueAtTime(this.musicVolume * 0.15, this.audioCtx.currentTime);
    this.musicGainNode.connect(this.audioCtx.destination);

    // Pentatonic scale notes (in Hz)
    // C4, D4, E4, G4, A4, C5, D5, E5
    const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
    const patterns = [
      [0, 2, 4, 2, 5, 4, 2, 0],
      [1, 3, 5, 3, 6, 5, 3, 1],
      [2, 4, 6, 4, 7, 6, 4, 2],
      [3, 5, 7, 5, 4, 3, 2, 1],
    ];

    let patternIdx = 0;
    let stepIdx = 0;

    const playStep = () => {
      if (!this.isPlayingMusic || !this.audioCtx || !this.musicGainNode) return;
      
      const currentPattern = patterns[patternIdx];
      const noteHz = notes[currentPattern[stepIdx]];

      const osc = this.audioCtx.createOscillator();
      const noteGain = this.audioCtx.createGain();

      // Soft triangle/sine sound for marimba style
      osc.type = stepIdx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(noteHz, this.audioCtx.currentTime);

      const now = this.audioCtx.currentTime;
      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.exponentialRampToValueAtTime(0.8, now + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(noteGain);
      noteGain.connect(this.musicGainNode);

      osc.start(now);
      osc.stop(now + 0.3);

      stepIdx++;
      if (stepIdx >= currentPattern.length) {
        stepIdx = 0;
        patternIdx = (patternIdx + 1) % patterns.length;
      }
    };

    this.musicInterval = setInterval(playStep, 260);
  }

  public stopLobbyMusic() {
    this.isPlayingMusic = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  // Play a pleasant 2-note chime when someone joins
  public playJoinSound() {
    if (this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const notes = [523.25, 783.99]; // C5 -> G5

    notes.forEach((freq, idx) => {
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      const startTime = now + idx * 0.12;
      gain.gain.setValueAtTime(0.01, startTime);
      gain.gain.exponentialRampToValueAtTime(this.sfxVolume * 0.4, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.42);
    });
  }

  // Play crisp UI pop/click
  public playClickSound() {
    if (this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);

    gain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Play buzzer / wrong answer / lost life sound
  public playWrongSound() {
    if (this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(180, now);
    osc2.frequency.setValueAtTime(185, now);
    osc1.frequency.exponentialRampToValueAtTime(110, now + 0.35);
    osc2.frequency.exponentialRampToValueAtTime(115, now + 0.35);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.42);
    osc2.stop(now + 0.42);
  }

  // Play celebratory / correct answer sound
  public playCorrectSound() {
    if (this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6

    notes.forEach((freq, idx) => {
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      const startTime = now + idx * 0.08;
      gain.gain.setValueAtTime(0.01, startTime);
      gain.gain.exponentialRampToValueAtTime(this.sfxVolume * 0.35, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.38);
    });
  }
}

export const lobbyAudio = new LobbyAudioController();
