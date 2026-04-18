import type { NextApiRequest, NextApiResponse } from "next";
import { getOpenAI } from "../../lib/openai";

type ScenarioQuestion = {
  id: string;
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
};

type EvalApiResponse = {
  score: number;
  diagnosis_percent: number;
  bonus: number;
  verdict: "correct" | "very_close" | "partial" | "weak" | "wrong";
  matched_cause: string;
  reason_short: string;
};

function clampNumber(value: any, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function sanitizeResult(raw: any): EvalApiResponse {
  const diagnosisPercent = clampNumber(raw?.diagnosis_percent, 0, 100);
  const bonus = clampNumber(raw?.bonus, 0, 1);
  const score = clampNumber(raw?.score, 0, 10);

  const allowedVerdicts = ["correct", "very_close", "partial", "weak", "wrong"];
  const verdict = allowedVerdicts.includes(raw?.verdict) ? raw.verdict : "wrong";

  return {
    score,
    diagnosis_percent: diagnosisPercent,
    bonus,
    verdict,
    matched_cause: String(raw?.matched_cause || "").trim(),
    reason_short: String(raw?.reason_short || "").trim(),
  };
}

function buildPrompt(question: ScenarioQuestion, userAnswer: string) {
  return `
You are grading a mechanic diagnostic answer.

IMPORTANT GOAL:
This app is about DIAGNOSIS SKILL, not elegant writing.
Do NOT punish the user for short answers if the diagnosis is correct or very close.

You must grade the user's answer using this exact philosophy:

SCORING RULES:
1. Main diagnosis is the most important thing.
2. The user does NOT need to fully answer all 3 subquestions to get a high score.
3. If the user correctly identifies the fault/component/system in mechanic-style language, give a high score.
4. Accept synonyms, translations, shorthand mechanic wording, and rough but correct phrasing.
5. "Why ECU may not set a fault" and "How to prove it" are only BONUS, not required for a high diagnosis score.

STRICT SCORE MAPPING:
- 100% diagnosis match => 10 points
- 75% diagnosis match => 8 points
- 50% to 60% diagnosis match => 4 points
- 20% to 40% diagnosis match => 2 points
- 0% diagnosis match => 0 points

BONUS:
- Add up to +1 bonus point if the user gives useful supporting explanation, proof/testing steps, or ECU reasoning.
- Final score must still be capped at 10.

HOW TO INTERPRET:
- If user says the exact root cause in different wording, that can still be 9 or 10.
- If user names the exact problematic component but not the full failure mode, that can still be 5 to 9 depending on closeness.
- If user gives a near-equivalent mechanic phrasing, treat it generously.
- If user gives multiple possible causes, judge the overall answer in the user's favor if one of the main ideas is close/correct.

You must return ONLY valid JSON with this exact shape:
{
  "score": 0,
  "diagnosis_percent": 0,
  "bonus": 0,
  "verdict": "wrong",
  "matched_cause": "",
  "reason_short": ""
}

Allowed verdict values:
- "correct"
- "very_close"
- "partial"
- "weak"
- "wrong"

SCENARIO:
${JSON.stringify({
  vehicle: question.vehicle,
  title: question.title,
  category: question.category,
  difficulty: question.difficulty,
  symptoms: question.symptoms,
  driving: question.driving,
  extra: question.extra,
  key_details: question.key_details,
})}

EXPECTED MAIN ANSWER:
${question.answer_main}

EXPECTED ROOT CAUSE LABEL:
${question.root_cause_label}

ACCEPTED ANSWERS:
${JSON.stringify(question.accepted_answers || [])}

PARTIAL ANSWERS:
${JSON.stringify(question.partial_answers || [])}

WHY ECU MAY NOT SET A FAULT:
${question.answer_why_no_code}

HOW TO PROVE IT:
${JSON.stringify(question.answer_proof || [])}

USER ANSWER:
${userAnswer}

Return JSON only.
`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { question, userAnswer } = req.body || {};

    if (!question || typeof question !== "object") {
      return res.status(400).json({ ok: false, error: "Missing question" });
    }

    if (typeof userAnswer !== "string") {
      return res.status(400).json({ ok: false, error: "Missing userAnswer" });
    }

    const openai = getOpenAI();
    const model = process.env.OPENAI_SCORING_MODEL || "gpt-5-mini";

    const response = await openai.responses.create({
      model,
      input: buildPrompt(question as ScenarioQuestion, userAnswer),
    });

    const text = response.output_text?.trim();
    if (!text) {
      throw new Error("Empty AI evaluation response");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`AI returned non-JSON evaluation: ${text}`);
    }

    const result = sanitizeResult(parsed);

    return res.status(200).json({
      ok: true,
      result,
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: String(error?.message || error),
    });
  }
}