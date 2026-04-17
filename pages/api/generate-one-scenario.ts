import type { NextApiRequest, NextApiResponse } from "next";
import { getOpenAI } from "../../lib/openai";
import { insertScenario, findScenarioBySignature } from "../../lib/scenario-storage";
import { makeScenarioSignature } from "../../lib/scenario-signature";

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const openai = getOpenAI();
    const model = process.env.OPENAI_SCENARIO_MODEL || "gpt-5-mini";

    const prompt = `
Generate ONE realistic automotive diagnostic scenario in BOSNIAN/SERBIAN/CROATIAN language.

STRICT RULES:
- Only automotive diagnostics
- Focus on engine, air flow, fuel flow, exhaust/DPF/EGR, sensors, gearbox, drivetrain
- Scenario must be realistic
- Brand/platform/root cause must be compatible
- Return ONLY valid JSON
- Do not include markdown
- Questions must be:
  1. Najvjerovatniji uzrok (1 konkretna stvar)
  2. Zašto ECU ne baca grešku
  3. Kako bi to dokazao u praksi

Use this structure:
{
  "brand": "BMW",
  "platform_type": "modern_diesel_cr_turbo_dpf_chain",
  "category": "Exhaust / DPF / EGR",
  "root_cause_id": "dpf_partial_restriction",
  "root_cause_label": "Partially clogged DPF",
  "difficulty": "hard",
  "title": "POWER LOSS (TRICKY)",
  "vehicle": "BMW F10 520d",
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

    const response = await openai.responses.create({
      model,
      input: prompt,
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
    });

    const existing = await findScenarioBySignature(signature);

    if (existing) {
      return res.status(200).json({
        ok: true,
        message: "Scenario already exists",
        existing,
        signature,
      });
    }

    const inserted = await insertScenario({
      ...parsed,
      signature,
    });

    return res.status(200).json({
      ok: true,
      inserted,
      signature,
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Unknown error",
    });
  }
}