import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const AI_API_KEY = process.env.AI_API_KEY || '';

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiConfigured: Boolean(AI_API_KEY),
    mode: AI_API_KEY ? 'LLM_ENABLED' : 'ADAPTIVE_RULE_ENGINE',
  });
});

/**
 * Deterministic fallback generator when AI_API_KEY is not set or API fails
 */
function generateFallbackDecision(input: any) {
  const {
    playerPerformance = {},
    currentDifficulty = 1,
    currentHealth = 100,
    monsterHealth = 100,
    currentMonster = { name: 'Monster', maxHp: 100 },
    previousExercises = [],
    isBossBattle = false,
    bossPhase = 1,
  } = input;

  const score = Number(playerPerformance.overallScore) || 75;
  let newDiff = currentDifficulty;
  let reason = '';

  if (score >= 85) {
    newDiff = Math.min(5, currentDifficulty + 1);
    reason = `Neural metrics indicate high kinetic mastery (${score}% score). Escalated to challenge tier ${newDiff}.`;
  } else if (score >= 65) {
    newDiff = currentDifficulty;
    reason = `Consistent biomechanics achieved (${score}% score). Maintained tier ${newDiff}.`;
  } else {
    newDiff = Math.max(1, currentDifficulty - 1);
    reason = `Fatigue threshold detected (${score}% score). Calibrating intensity down to tier ${newDiff}.`;
  }

  const pool = ['squats', 'jumping_jacks', 'lunges', 'high_knees'];
  const last = previousExercises[previousExercises.length - 1];
  const candidates = pool.filter((e) => e !== last);
  const nextExercise = isBossBattle
    ? (['squats', 'jumping_jacks', 'lunges', 'high_knees', 'squats'][bossPhase - 1] || 'squats')
    : candidates[Math.floor(Math.random() * candidates.length)] || 'squats';

  const baseReps: Record<string, number> = {
    squats: 6,
    jumping_jacks: 10,
    lunges: 6,
    high_knees: 12,
    pushups: 5,
  };

  const mult = 1 + (newDiff - 1) * 0.28;
  const targetReps = Math.min(25, Math.max(5, Math.round((baseReps[nextExercise] || 8) * mult)));
  const timeLimit = Math.min(75, Math.max(25, targetReps * 3 + 15));

  let coachMessage = 'Lock in and maintain clean form!';
  if (score >= 85) coachMessage = 'Explosive rhythm! Channel that momentum into the next set!';
  else if (score < 65) coachMessage = 'Pace yourself, focus on depth over speed!';

  const monsterThreat = `${currentMonster.name}: "${
    monsterHealth / currentMonster.maxHp > 0.5
      ? 'Your flesh cannot withstand my processors!'
      : 'Structural breach detected! But I will not collapse!'
  }"`;

  return {
    nextExercise,
    targetReps,
    timeLimit,
    difficulty: newDiff,
    reason,
    coachMessage,
    monsterThreat,
  };
}

// Next challenge AI endpoint
app.post('/api/ai/next-challenge', async (req: Request, res: Response) => {
  const input = req.body;

  // If no AI_API_KEY, use the robust rule engine immediately
  if (!AI_API_KEY) {
    const fallback = generateFallbackDecision(input);
    return res.json(fallback);
  }

  // Attempt real LLM integration with Google Gemini
  try {
    const prompt = `You are the Battle AI Game Master and Personal Fitness Coach for an intense cyberpunk game "AI Fitness Battle".
The player just finished a round against monster "${input.currentMonster?.name || 'Cyber Beast'}".

Player Performance Data:
- Overall Score: ${input.playerPerformance?.overallScore ?? 75}/100
- Rep Accuracy: ${input.playerPerformance?.repAccuracy ?? 85}%
- Movement Quality: ${input.playerPerformance?.movementQuality ?? 80}%
- Speed Cadence Score: ${input.playerPerformance?.speedScore ?? 75}%
- Current Player HP: ${input.currentHealth ?? 100}/100
- Monster HP: ${input.monsterHealth ?? 80}/${input.currentMonster?.maxHp ?? 100}
- Current Difficulty Tier: ${input.currentDifficulty ?? 1} (1-5)
- Previous Exercises: ${JSON.stringify(input.previousExercises || [])}
- Is Boss Battle: ${Boolean(input.isBossBattle)}, Phase: ${input.bossPhase ?? 1}

Based on this performance, generate the next challenge in STRICT JSON format:
{
  "nextExercise": "squats" | "jumping_jacks" | "lunges" | "high_knees",
  "targetReps": number (between 5 and 22),
  "timeLimit": number (between 25 and 75 seconds),
  "difficulty": number (1 to 5),
  "reason": "1 concise sentence explaining your adaptive AI choice based on their exact metrics",
  "coachMessage": "1 energetic sentence of personalized fitness motivation",
  "monsterThreat": "1 menacing in-character voice line from the monster"
}
Return ONLY valid raw JSON with no markdown wrapping.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${AI_API_KEY}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const jsonRes = await response.json();
    const rawText = jsonRes.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Empty response from LLM');

    const parsed = JSON.parse(rawText);

    // Validation & Clamping
    const validExercises = ['squats', 'jumping_jacks', 'lunges', 'high_knees'];
    const sanitized = {
      nextExercise: validExercises.includes(parsed.nextExercise) ? parsed.nextExercise : 'squats',
      targetReps: Math.min(25, Math.max(5, Number(parsed.targetReps) || 8)),
      timeLimit: Math.min(80, Math.max(20, Number(parsed.timeLimit) || 45)),
      difficulty: Math.min(5, Math.max(1, Number(parsed.difficulty) || input.currentDifficulty || 1)),
      reason: String(parsed.reason || 'AI tailored workout load to your current cadence and stamina.'),
      coachMessage: String(parsed.coachMessage || 'Stay in the zone and dominate this round!'),
      monsterThreat: String(parsed.monsterThreat || `${input.currentMonster?.name}: "Brace yourself!"`),
    };

    return res.json(sanitized);
  } catch (err) {
    console.warn('Backend LLM call failed. Falling back to adaptive rule engine.', err);
    const fallback = generateFallbackDecision(input);
    return res.json(fallback);
  }
});

// AI Coach advice endpoint
app.post('/api/ai/coach-advice', (req: Request, res: Response) => {
  const { exercise, repAccuracy, combo } = req.body;
  let advice = 'Keep your core braced and breathe rhythmically!';
  if (combo >= 5) advice = `Incredible ${combo}x combo streak! You are breaking the monster's defense!`;
  else if (repAccuracy < 70) advice = `Slow down slightly on ${exercise} to prioritize full range of motion.`;

  res.json({ advice });
});

app.listen(PORT, () => {
  console.log(`AI Fitness Battle backend listening on http://localhost:${PORT}`);
});
