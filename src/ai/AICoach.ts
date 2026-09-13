export class AICoachService {
  private static speechEnabled: boolean = true;
  private static lastSpeechTime: number = 0;
  private static readonly SPEECH_COOLDOWN_MS = 3500;

  public static setVoiceEnabled(enabled: boolean): void {
    AICoachService.speechEnabled = enabled;
  }

  public static isVoiceEnabled(): boolean {
    return AICoachService.speechEnabled;
  }

  /**
   * Speaks advice using browser Web Speech Synthesis API
   */
  public static speak(text: string, priority = false): void {
    if (!AICoachService.speechEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const now = Date.now();
    if (!priority && now - AICoachService.lastSpeechTime < AICoachService.SPEECH_COOLDOWN_MS) {
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Cancel any lingering utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.85;

      // Select an English voice if available
      const voices = window.speechSynthesis.getVoices();
      const engVoice = voices.find(
        (v) => v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Online'))
      ) || voices.find((v) => v.lang.includes('en'));

      if (engVoice) {
        utterance.voice = engVoice;
      }

      window.speechSynthesis.speak(utterance);
      AICoachService.lastSpeechTime = now;
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  public static getFormFeedback(params: {
    exercise: string;
    repCount: number;
    targetReps: number;
    combo: number;
    isInvalidRep: boolean;
    playerHp: number;
  }): string {
    const { exercise, repCount, targetReps, combo, isInvalidRep, playerHp } = params;

    if (playerHp < 25) {
      return 'Stay focused! You are in the danger zone, make every repetition count!';
    }

    if (isInvalidRep) {
      return 'Hit full range of motion! Do not cheat the movement.';
    }

    if (combo >= 5) {
      return `COMBO x${combo}! You are on fire! Keep that tempo!`;
    }

    const remaining = targetReps - repCount;
    if (remaining === 1) {
      return 'LAST ONE! Give it everything you have!';
    }
    if (remaining === 2) {
      return 'Two reps left! Attack sequence is primed!';
    }
    if (repCount === Math.floor(targetReps / 2)) {
      return 'Halfway there! Keep your core locked and stay solid!';
    }

    return `Keep driving through those ${exercise.replace('_', ' ')}!`;
  }
}
