import type { NextApiRequest, NextApiResponse } from "next";
import { getOpenAI } from "../../lib/openai";
import { makeScenarioSignature } from "../../lib/scenario-signature";
import {
  findScenarioBySignature,
  insertScenario,
} from "../../lib/scenario-storage";
import {
  getRandomScenarioSeeds,
  type ScenarioSeed,
} from "../../lib/scenario-seeds";

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

function buildPrompt(seed: ScenarioSeed) {
  return `
Generate ONE realistic automotive diagnostic scenario in BOSNIAN/SERBIAN/CROATIAN language.

YOU MUST USE THESE FIXED INPUTS:
- brand: ${seed.brand}
- vehicle: ${seed.vehicle}
- platform_type: ${seed.platform_type}
- category: ${seed.category}
- difficulty: ${seed.difficulty}
- root_cause_id: ${seed.root_cause_id}
- root_cause_label: ${seed.root_cause_label}

STRICT RULES:
- Only automotive diagnostics
- Only one concrete root cause, exactly the one provided above
- Brand / vehicle / platform / category / difficulty / root cause must remain exactly as given
- Return ONLY valid JSON
- Do not include markdown
- Create realistic but different symptoms/context/proof steps
- Questions must be exactly:
  1. Najvjerovatniji uzrok (1 konkretna stvar)
  2. Zašto ECU ne baca grešku
  3. Kako bi to dokazao u praksi

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
    "Najvjerovatniji uzrok (1 konkretna stvar)",
    "Zašto ECU ne baca grešku",
    "Kako bi to dokazao u praksi"
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
`;
}

async function generateFromSeed(seed: ScenarioSeed) {
  const openai = getOpenAI();
  const model = process.env.OPENAI_SCENARIO_MODEL || "gpt-5-mini";

  const response = await openai.responses.create({
    model,
    input: buildPrompt(seed),
  });

  const text = response.output_text;
  const parsed = JSON.parse(text);

  if (!validateScenario(parsed)) {
    throw new Error("AI returned invalid scenario shape");
  }

  return parsed;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const rawCount = Number(req.body?.count ?? req.query.count ?? 10);
    const count = Math.max(
      1,
      Math.min(20, Number.isFinite(rawCount) ? rawCount : 10)
    );

    const seeds = getRandomScenarioSeeds(count);

    const created: Array<{ id: string; signature: string; seed: ScenarioSeed }> = [];
    const existing: Array<{ id: string; signature: string; seed: ScenarioSeed }> = [];
    const failed: Array<{ error: string; seed: ScenarioSeed }> = [];

    for (const seed of seeds) {
      try {
        const parsed = await generateFromSeed(seed);

        const signature = makeScenarioSignature({
          brand: parsed.brand,
          vehicle: parsed.vehicle,
          rootCauseId: parsed.root_cause_id,
          difficulty: parsed.difficulty,
          title: parsed.title,
        });

        const alreadyExists = await findScenarioBySignature(signature);

        if (alreadyExists) {
          existing.push({
            id: alreadyExists.id,
            signature,
            seed,
          });
          continue;
        }

        const inserted = await insertScenario({
          ...parsed,
          signature,
        });

        created.push({
          id: inserted.id,
          signature,
          seed,
        });
      } catch (err: any) {
        failed.push({
          error: String(err?.message || err),
          seed,
        });
      }
    }

    return res.status(200).json({
      ok: true,
      requested: count,
      createdCount: created.length,
      existingCount: existing.length,
      failedCount: failed.length,
      created,
      existing,
      failed,
    });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      error: String(e?.message || e),
    });
  }
}