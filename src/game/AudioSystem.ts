export class AudioSystem {
  private static ctx: AudioContext | null = null;
  private static isMuted: boolean = false;

  private static getContext(): AudioContext | null {
    if (AudioSystem.isMuted) return null;
    if (typeof window === 'undefined') return null;

    if (!AudioSystem.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        AudioSystem.ctx = new AudioCtx();
      }
    }

    if (AudioSystem.ctx && AudioSystem.ctx.state === 'suspended') {
      AudioSystem.ctx.resume().catch(() => {});
    }

    return AudioSystem.ctx;
  }

  public static toggleMute(): boolean {
    AudioSystem.isMuted = !AudioSystem.isMuted;
    return AudioSystem.isMuted;
  }

  public static getMuted(): boolean {
    return AudioSystem.isMuted;
  }

  /**
   * Ascending chime when a valid rep is completed. Pitch increases with combo!
   */
  public static playRepSuccess(combo: number = 0): void {
    const ctx = AudioSystem.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = 440;
      const pitchOffset = Math.min(400, combo * 45);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq + pitchOffset, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq + pitchOffset + 220, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  }

  /**
   * Low buzzy tone when an invalid/shallow rep is detected
   */
  public static playRepInvalid(): void {
    const ctx = AudioSystem.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } catch (e) {}
  }

  /**
   * Charge-up sound when target reps are finished and attack is ready
   */
  public static playAttackReady(): void {
    const ctx = AudioSystem.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.46);
    } catch (e) {}
  }

  /**
   * Explosive sci-fi blast when player attacks monster
   */
  public static playPlayerAttack(): void {
    const ctx = AudioSystem.getContext();
    if (!ctx) return;

    try {
      // Noise burst + FM tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.42);
    } catch (e) {}
  }

  /**
   * Ominous bass impact when monster attacks player
   */
  public static playMonsterAttack(): void {
    const ctx = AudioSystem.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.45);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.52);
    } catch (e) {}
  }

  /**
   * Triumphant victory fanfare
   */
  public static playVictory(): void {
    const ctx = AudioSystem.getContext();
    if (!ctx) return;

    try {
      const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99]; // C major arpeggio
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq;

        const startTime = ctx.currentTime + idx * 0.12;
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.65);
      });
    } catch (e) {}
  }

  /**
   * Defeat game-over sound
   */
  public static playDefeat(): void {
    const ctx = AudioSystem.getContext();
    if (!ctx) return;

    try {
      const notes = [392.0, 369.99, 349.23, 329.63, 293.66, 261.63];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.value = freq;

        const startTime = ctx.currentTime + idx * 0.15;
        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.55);
      });
    } catch (e) {}
  }

  /**
   * Eerie descending arpeggio played when NEXUS PRIME telegraph begins
   */
  public static playMirrorTelegraph(): void {
    const ctx = AudioSystem.getContext();
    if (!ctx) return;

    try {
      const notes = [660, 550, 440, 330, 220];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        const startTime = ctx.currentTime + idx * 0.18;
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.55);
      });
    } catch (e) {}
  }

  /**
   * Bright triumphant chord burst for a Perfect Mirror outcome
   */
  public static playMirrorPerfect(): void {
    const ctx = AudioSystem.getContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 major chord + octave
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq;

        const startTime = ctx.currentTime + idx * 0.04;
        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.6);
      });
    } catch (e) {}
  }

  /**
   * Harsh descending dissonant tone for a Failed Mirror outcome
   */
  public static playMirrorFailed(): void {
    const ctx = AudioSystem.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.55);

      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.58);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {}
  }
}

