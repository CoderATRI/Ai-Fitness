import { AIDecision } from '../types';
import { LLMStrategy } from './LLMStrategy';
import { DecisionInput } from './AdaptiveRuleStrategy';

export class AIEngine {
  private static instance: AIEngine;
  private strategy: LLMStrategy;

  private constructor() {
    this.strategy = new LLMStrategy();
  }

  public static getInstance(): AIEngine {
    if (!AIEngine.instance) {
      AIEngine.instance = new AIEngine();
    }
    return AIEngine.instance;
  }

  public async getNextChallenge(input: DecisionInput): Promise<AIDecision> {
    return this.strategy.decideNextChallenge(input);
  }
}
