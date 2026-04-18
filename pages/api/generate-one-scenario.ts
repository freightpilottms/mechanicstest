import { getRandomScenarioSeed } from "@/lib/scenario-seeds";
import OpenAI from "openai";
import { insertScenario } from "@/lib/scenario-store";
import { makeScenarioSignature } from "@/lib/signature";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function buildPrompt(seed: ReturnType<typeof getRandomScenarioSeed>) {
  const context = seed.context;

  return `
You are an expert automotive diagnostic engineer.

Generate a realistic diagnostic scenario.

ROOT CAUSE (DO NOT CHANGE):
${seed.rootCauseLabel}

VEHICLE:
${seed.brand} ${seed.vehicle}

DIFFICULTY:
${seed.difficulty}

SCENARIO CONTEXT (MUST BE USED):
- Temperature condition: ${context.temperature}
- Load condition: ${context.load}
- Behavior: ${context.behavior}
- Timeline: ${context.timeline}

--------------------------------------------------

CRITICAL RULES:

1. The root cause MUST be exactly:
"${seed.rootCauseLabel}"

2. The scenario MUST strictly follow the context provided above.

3. DO NOT generate generic patterns like:
- simple power loss without context
- vague sensor failure without explanation
- repetitive cold start issues

4. Each scenario MUST feel different and realistic.

5. Keep it clear, logical, and educational (no misleading or trick scenarios).

--------------------------------------------------

OUTPUT FORMAT (JSON ONLY):

{
  "title": "...",
  "symptoms": [],
  "driving": [],
  "extra": [],
  "key_details": [],
  "questions": [
    "What is the most likely root cause?",
    "Why is there no fault code or misleading data?",
    "How would you confirm the issue?"
  ],
  "hint": [],
  "answer_main": "...",
  "answer_why_no_code": "...",
  "answer_proof": [],
  "accepted_answers": [],
  "partial_answers": [],
  "scoring_notes": {}
}

IMPORTANT:
- No explanations outside JSON
- No markdown
- No extra text
`;
}

export default async function handler(req: any, res: any) {
  try {
    const seed = getRandomScenarioSeed();

    const prompt = buildPrompt(seed);

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "You generate structured automotive diagnostic scenarios.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
    });

    const text = completion.choices[0].message.content || "";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      return res.status(500).json({
        error: "Invalid JSON from AI",
        raw: text,
      });
    }

    const signature = makeScenarioSignature({
      brand: seed.brand,
      vehicle: seed.vehicle,
      rootCauseId: seed.rootCauseId,
      difficulty: seed.difficulty,
      title: parsed.title,
    });

    const scenario = {
      ...parsed,
      brand: seed.brand,
      platform_type: "generic",
      category: seed.category,
      root_cause_id: seed.rootCauseId,
      root_cause_label: seed.rootCauseLabel,
      difficulty: seed.difficulty,
      vehicle: `${seed.brand} ${seed.vehicle}`,
      signature,
    };

    const inserted = await insertScenario(scenario);

    return res.status(200).json({
      ok: true,
      id: inserted.id,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || "Unknown error",
    });
  }
}