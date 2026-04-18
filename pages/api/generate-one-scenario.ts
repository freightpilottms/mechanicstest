import type { NextApiRequest, NextApiResponse } from "next";
import { getOpenAI } from "../../lib/openai";
import { insertScenario, findScenarioBySignature } from "../../lib/scenario-storage";
import { makeScenarioSignature } from "../../lib/scenario-signature";
import { getRandomScenarioSeed, type ScenarioSeed } from "../../lib/scenario-seeds";

type SupportedLocale = "en" | "bs";

type AIResponse = {
  brand: string;
  platform_type: string;
  category: string;
  root_cause_id: string;
  root_cause_label: string;
  difficulty: "easy" | "medium" | "hard";
  title: string;
  vehicle: string;
  symptoms: string[];
  driving: string[];
  extra: string[];
  key_details: string[];
  questions: string[];
  hint: string[];
  answer_main: string;
  answer_why_no_code: string;
  answer_proof: string[];
  accepted_answers: string[];
  partial_answers: string[];
  scoring_notes: Record<string, any>;
};

function getLocaleFromReq(req: NextApiRequest): SupportedLocale {
  const raw = String(req.query.locale || req.query.lang || "en").toLowerCase();
  return raw === "bs" ? "bs" : "en";
}

function validateScenario(data: any): data is AIResponse {
  return (
    data &&
    typeof data.brand === "string" &&
    typeof data.platform_type === "string" &&
    typeof data.category === "string" &&
    typeof data.root_cause_id === "string" &&
    typeof data.root_cause_label === "string" &&
    ["easy", "medium", "hard"].includes(data.difficulty) &&
    typeof data.title === "string" &&
    typeof data.vehicle === "string" &&
    Array.isArray(data.symptoms) &&
    Array.isArray(data.driving) &&
    Array.isArray(data.extra) &&
    Array.isArray(data.key_details) &&
    Array.isArray(data.questions) &&
    Array.isArray(data.hint) &&
    typeof data.answer_main === "string" &&
    typeof data.answer_why_no_code === "string" &&
    Array.isArray(data.answer_proof) &&
    Array.isArray(data.accepted_answers) &&
    Array.isArray(data.partial_answers) &&
    typeof data.scoring_notes === "object"
  );
}

function buildPrompt(seed: ScenarioSeed, locale: SupportedLocale) {
  const languageInstruction =
    locale === "bs"
      ? "Generate ONE realistic automotive diagnostic scenario in BOSNIAN/SERBIAN/CROATIAN language."
      : "Generate ONE realistic automotive diagnostic scenario in ENGLISH language.";

  const question1 =
    locale === "bs"
      ? "Najvjerovatniji uzrok (1 konkretna stvar)"
      : "Most likely cause (1 specific thing)";

  const question2 =
    locale === "bs"
      ? "Zašto ECU ne baca grešku"
      : "Why the ECU does not set a fault code";

  const question3 =
    locale === "bs"
      ? "Kako bi to dokazao u praksi"
      : "How would you prove it in practice";

  return `
${languageInstruction}

YOU MUST USE THESE FIXED INPUTS:
- brand: ${seed.brand}
- vehicle: ${seed.vehicle}
- platform_type: ${seed.platform_type}
- category: ${seed.category}
- difficulty: ${seed.difficulty}
- root_cause_id: ${seed.root_cause_id}
- root_cause_label: ${seed.root_cause_label}

SCENARIO CONTEXT (MUST BE USED):
- Temperature condition: ${seed.context.temperature}
- Load condition: ${seed.context.load}
- Behavior pattern: ${seed.context.behavior}
- Failure timeline: ${seed.context.timeline}

STRICT RULES:
- Only automotive diagnostics
- Only one concrete root cause, exactly the one provided above
- Brand / vehicle / platform / category / root cause must stay compatible
- Mechanical compatibility is mandatory: do not mention chain issues on belt engines, do not mention belt issues on chain engines, and do not use diesel-only systems on petrol vehicles or petrol-only systems on diesel vehicles
- Return ONLY valid JSON
- Do not include markdown
- Do not invent a different brand, vehicle, category, difficulty or root cause
- Keep the scenario educational, clear, and realistic
- Do NOT use misleading clues, deceptive symptoms, or trick-question style writing
- Do NOT generate scenarios similar to repetitive common patterns such as:
  - cold start misfire without any unique context
  - highway power loss without variation
  - generic sensor failure without context
- Ensure each scenario has a UNIQUE context by clearly using:
  - the provided temperature condition
  - the provided load situation
  - the provided behavior pattern
  - the provided timeline of failure
- Vary symptoms, driving context, hints and proof steps, but keep the same root cause family
- Questions must be exactly:
  1. ${question1}
  2. ${question2}
  3. ${question3}

JSON structure:
{
  "brand": "${seed.brand}",
  "platform_type": "${seed.platform_type}",
  "category": "${seed.category}",
  "root_cause_id": "${seed.root_cause_id}",
  "root_cause_label": "${seed.root_cause_label}",
  "difficulty": "${seed.difficulty}",
  "title": "...",
  "vehicle": "${seed.vehicle}",
  "symptoms": ["..."],
  "driving": ["..."],
  "extra": ["..."],
  "key_details": ["..."],
  "questions": [
    "${question1}",
    "${question2}",
    "${question3}"
  ],
  "hint": ["..."],
  "answer_main": "...",
  "answer_why_no_code": "...",
  "answer_proof": ["..."],
  "accepted_answers": ["..."],
  "partial_answers": ["..."],
  "scoring_notes": {
    "directionWeight": 0.7,
    "precisionWeight": 0.2,
    "reasoningWeight": 0.1
  }
}

QUALITY CHECK BEFORE RETURNING JSON:
- The scenario must not feel generic
- The context must be clearly visible in the symptoms/driving story
- The root cause must remain exactly the same as provided
- The scenario text must stay mechanically compatible with the provided platform_type
- The scenario must be realistic and educational, not misleading
`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const openai = getOpenAI();
    const model = process.env.OPENAI_SCENARIO_MODEL || "gpt-5-mini";
    const seed = getRandomScenarioSeed();
    const locale = getLocaleFromReq(req);

    const response = await openai.responses.create({
      model,
      input: buildPrompt(seed, locale),
    });

    const text = response.output_text;
    const parsed = JSON.parse(text);

    if (!validateScenario(parsed)) {
      return res.status(500).json({
        ok: false,
        error: "AI returned invalid scenario shape",
        raw: text,
      });
    }

    const signature = makeScenarioSignature({
      brand: parsed.brand,
      vehicle: parsed.vehicle,
      rootCauseId: parsed.root_cause_id,
      difficulty: parsed.difficulty,
      title: parsed.title,
      locale,
    });

    const existing = await findScenarioBySignature(signature);

    if (existing) {
      return res.status(200).json({
        ok: true,
        message: "Scenario already exists",
        existing,
        signature,
        seed,
      });
    }

    const inserted = await insertScenario({
      ...parsed,
      locale,
      language: locale,
      signature,
    });

    return res.status(200).json({
      ok: true,
      inserted,
      signature,
      seed,
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Unknown error",
    });
  }
}