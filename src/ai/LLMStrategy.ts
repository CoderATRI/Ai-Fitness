import { AIDecision, ExerciseType } from '../types';
import { AdaptiveRuleStrategy, DecisionInput } from './AdaptiveRuleStrategy';

export class LLMStrategy {
  private fallbackStrategy = new AdaptiveRuleStrategy();
  private endpoint = '/api/ai/next-challenge';

  public async decideNextChallenge(input: DecisionInput): Promise<AIDecision> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500); // 4.5s fast timeout

      // Build JSON body — include mirrorPhaseContext only when present
      const bodyPayload: Record<string, unknown> = { ...input };

      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      return this.validateAndSanitize(data, input);
    } catch (error) {
      console.warn('AI Backend call failed or timed out. Engaging Adaptive Rule Strategy fallback.', error);
      return this.fallbackStrategy.decideNextChallenge(input);
    }
  }


  private validateAndSanitize(data: any, input: DecisionInput): AIDecision {
    const validExercises: ExerciseType[] = ['squats', 'jumping_jacks', 'lunges', 'high_knees', 'pushups'];
    const nextExercise = validExercises.includes(data?.nextExercise)
      ? data.nextExercise
      : 'squats';

    const targetReps = Math.min(25, Math.max(5, Number(data?.targetReps) || 8));
    const timeLimit = Math.min(85, Math.max(20, Number(data?.timeLimit) || 45));
    const difficulty = Math.min(5, Math.max(1, Number(data?.difficulty) || input.currentDifficulty));

    const reason = typeof data?.reason === 'string' && data.reason.trim()
      ? data.reason.trim()
      : 'AI synthesized personalized workout challenge based on cadence and power metrics.';

    const coachMessage = typeof data?.coachMessage === 'string' && data.coachMessage.trim()
      ? data.coachMessage.trim()
      : 'Focus your mind, breathe deep, and crush this round!';

    const monsterThreat = typeof data?.monsterThreat === 'string' && data.monsterThreat.trim()
      ? data.monsterThreat.trim()
      : `${input.currentMonster.name}: "Let us see if your spirit can match your speed!"`;

    return {
      nextExercise,
      targetReps,
      timeLimit,
      difficulty,
      reason,
      coachMessage,
      monsterThreat,
    };
  }
}
