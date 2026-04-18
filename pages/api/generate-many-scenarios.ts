import type { NextApiRequest, NextApiResponse } from "next";
import { getOpenAI } from "../../lib/openai";
import {
  insertScenario,
  findScenarioBySignature,
} from "../../lib/scenario-storage";
import { makeScenarioSignature } from "../../lib/scenario-signature";
import {
  getRandomScenarioSeed,
  type ScenarioSeed,
} from "../../lib/scenario-seeds";

type SupportedLocale = "en" | "bs";

function getLocaleFromReq(req: NextApiRequest): SupportedLocale {
  const raw = String(req.query.locale || req.query.lang || "en").toLowerCase();
  return raw === "bs" ? "bs" : "en";
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

SCENARIO CONTEXT:
- Temperature: ${seed.context.temperature}
- Load: ${seed.context.load}
- Behavior: ${seed.context.behavior}
- Timeline: ${seed.context.timeline}

STRICT RULES:
- ONE root cause only
- MUST be realistic
- MUST NOT be repetitive
- MUST use context variables
- NO misleading info
- RETURN ONLY JSON

Questions MUST be:
1. ${question1}
2. ${question2}
3. ${question3}

JSON:
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
`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const openai = getOpenAI();
    const model = process.env.OPENAI_SCENARIO_MODEL || "gpt-5-mini";

    const count = Math.min(
      50,
      Math.max(1, Number(req.query.count || 1))
    );

    const locale = getLocaleFromReq(req);

    const created: any[] = [];
    const existing: any[] = [];
    const failed: any[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const seed = getRandomScenarioSeed();

        const response = await openai.responses.create({
          model,
          input: buildPrompt(seed, locale),
        });

        const text = response.output_text;
        const parsed = JSON.parse(text);

        const signature = makeScenarioSignature({
          brand: parsed.brand,
          vehicle: parsed.vehicle,
          rootCauseId: parsed.root_cause_id,
          difficulty: parsed.difficulty,
          title: parsed.title,
          locale,
        });

        const exists = await findScenarioBySignature(signature);

        if (exists) {
          existing.push(signature);
          continue;
        }

        const inserted = await insertScenario({
          ...parsed,
          locale,
          language: locale,
          signature,
        });

        created.push(inserted);

      } catch (err: any) {
        failed.push(err?.message || "error");
      }
    }

    return res.status(200).json({
      ok: true,
      requested: count,
      locale,
      createdCount: created.length,
      existingCount: existing.length,
      failedCount: failed.length,
      created,
      existing,
      failed,
    });

  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Unknown error",
    });
  }
}