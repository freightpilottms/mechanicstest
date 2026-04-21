import type { NextApiRequest, NextApiResponse } from "next";
import { getOpenAI } from "../../lib/openai";

type ScenarioQuestion = {
  id?: string;
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
  locale?: "en" | "bs";
  language?: "en" | "bs";
  scoring_notes?: Record<string, any>;
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

function inferLocale(question: ScenarioQuestion, userAnswer: string): "en" | "bs" {
  if (question.locale === "bs" || question.language === "bs") return "bs";
  if (question.locale === "en" || question.language === "en") return "en";

  const sample = [
    question.title,
    question.answer_main,
    question.answer_why_no_code,
    ...(question.questions || []),
    ...(question.symptoms || []),
    ...(question.driving || []),
    ...(question.extra || []),
    userAnswer,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const bsSignals = [
    "najvjerovatniji",
    "uzrok",
    "kvar",
    "ler",
    "motora",
    "grešku",
    "dokazao",
    "vožnje",
    "rashladne",
    "zveckanje",
    "hučanje",
    "pritisak",
    "gubitak",
    "zagrij",
    "curenje",
    "djelomično",
    "začepljen",
  ];

  const score = bsSignals.reduce(
    (sum, token) => sum + (sample.includes(token) ? 1 : 0),
    0
  );

  return score >= 2 ? "bs" : "en";
}

function getDifficultyAdjustmentGuide(
  difficulty: "easy" | "medium" | "hard",
  locale: "en" | "bs"
) {
  if (locale === "bs") {
    if (difficulty === "easy") {
      return `
DIFFICULTY EASY:
- Budi malo tolerantniji.
- Ako korisnik pogodi tačan dio ili vrlo blizak uzrok, ocjena treba biti visoka.
- Širi odgovor koji jasno pokazuje pravi pravac može dobiti 6 do 8.
`;
    }

    if (difficulty === "medium") {
      return `
DIFFICULTY MEDIUM:
- Traži dobar dijagnostički pravac i solidnu preciznost.
- Tačan dio ili vrlo blizak uzrok treba dobiti 7 do 10.
- Preširoki odgovori neka ostanu u partial zoni.
`;
    }

    return `
DIFFICULTY HARD:
- I dalje ocjenjuj velikodušno ako je korisnik suštinski pogodio kvar.
- Ali za 9 do 10 traži vrlo blizak ili tačan uzrok.
- Širi odgovori koji samo pogađaju sistem neka budu niže nego kod easy scenarija.
`;
  }

  if (difficulty === "easy") {
    return `
DIFFICULTY EASY:
- Be slightly more forgiving.
- If the user identifies the correct component or a very close cause, the score should be high.
- A broader but clearly correct direction can still score 6 to 8.
`;
  }

  if (difficulty === "medium") {
    return `
DIFFICULTY MEDIUM:
- Require a good diagnostic direction and decent precision.
- Correct component or very close root cause should score 7 to 10.
- Broad answers should remain in partial territory.
`;
  }

  return `
DIFFICULTY HARD:
- Still grade generously if the user essentially found the correct fault.
- But for 9 to 10, require a very close or exact diagnosis.
- Broad answers that only identify the general system should score lower than on easy scenarios.
`;
}

function buildPrompt(
  question: ScenarioQuestion,
  userAnswer: string,
  locale: "en" | "bs"
) {
  const isBs = locale === "bs";
  const difficultyGuide = getDifficultyAdjustmentGuide(question.difficulty, locale);

  return `
You are grading a mechanic diagnostic answer.

OUTPUT LANGUAGE:
- You must write matched_cause and reason_short in ${isBs ? "Bosnian" : "English"} only.
- Do not mix languages.
- Keep reason_short short, natural, and workshop-style.
- If locale is Bosnian, use natural mechanic-style Bosnian wording, not literal translation.

IMPORTANT GOAL:
This app is about DIAGNOSIS SKILL, not elegant writing.
Do NOT punish the user for short answers if the diagnosis is correct or very close.

You must grade the user's answer using this exact philosophy:

CORE PRINCIPLES:
1. Main diagnosis is by far the most important thing.
2. The user does NOT need to fully answer all 3 subquestions to get a high score.
3. If the user correctly identifies the fault/component/system in mechanic-style language, give a high score.
4. Accept synonyms, shorthand mechanic wording, rough phrasing, partial translations, and imperfect grammar.
5. "Why ECU may not set a fault" and "How to prove it" are BONUS only.
6. Do NOT require exact wording from accepted answers.
7. Judge meaning, not sentence beauty.
8. If the user names the exact failed component OR an expert-equivalent mechanic explanation, score strongly.
9. If the user gives the correct subsystem but not the exact failure mode, this can still be partial or very_close depending on proximity.
10. accepted_answers and partial_answers are semantic guides, not exact-match rules.

STRICT SCORING PHILOSOPHY:
- 10/10 = exact root cause or expert-level equivalent phrasing
- 8-9/10 = clearly the correct root cause, but less precise wording or missing full failure mode
- 6-7/10 = very close; correct component/system and strongly pointing to the real root cause
- 4-5/10 = correct direction only; user is in the right area but diagnosis is still broad/incomplete
- 2-3/10 = weak answer; some small relevance but mostly not the right diagnosis
- 0-1/10 = wrong diagnosis

STRICT DIAGNOSIS PERCENT GUIDANCE:
- 90 to 100 = exact or near-exact diagnosis
- 75 to 89 = very close diagnosis
- 50 to 74 = partial but meaningful diagnosis
- 20 to 49 = weak but somewhat related
- 0 to 19 = wrong diagnosis

BONUS:
- Add up to +1 bonus point if the user gives useful supporting explanation, proof/testing steps, or ECU reasoning.
- Bonus must never hide a bad diagnosis.
- Final score must still be capped at 10.

HOW TO INTERPRET ANSWERS:
- If the user says the same fault in different wording, it can still be 9 or 10.
- If the user names the exact bad component but not the exact failure mode, that can still be strong.
- If the user gives multiple possible causes, judge generously ONLY if one of the main causes is clearly the correct one and the rest do not destroy the answer.
- If the user shotgun-lists many random causes, reduce score.
- If the user only gives a broad area like "fuel issue", "sensor issue", "boost leak area", "EGR problem", score it as partial/weak unless it clearly matches the real root cause closely.
- Mechanic-style shorthand is acceptable.
- Bosnian/Serbian/Croatian and English wording can both be treated as valid if the meaning matches, but your OUTPUT must stay in the requested locale.

SYNONYM / PARTIAL MATCHING RULES:
- accepted_answers contains realistic acceptable phrasings of the correct diagnosis
- partial_answers contains close but incomplete answers
- If the user's answer clearly matches accepted_answers semantically, score in the strong range
- If the user's answer clearly matches partial_answers semantically, score in the partial range unless their own wording shows stronger understanding
- Do not require the exact same words
- Prioritize meaning over wording

${difficultyGuide}

VERY IMPORTANT:
You are NOT grading whether the user fully answered:
1. main diagnosis
2. why no fault code
3. how to prove it

You are grading mainly the DIAGNOSIS QUALITY.
The other two parts only affect BONUS.

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

HOW TO MAP VERDICT:
- "correct" = score 9 to 10
- "very_close" = score 7 to 8.9
- "partial" = score 4 to 6.9
- "weak" = score 1 to 3.9
- "wrong" = score 0 to 0.9

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

OPTIONAL SCORING NOTES:
${JSON.stringify(question.scoring_notes || {})}

USER ANSWER:
${userAnswer}

Before returning JSON, think like an experienced mechanic instructor:
- Is the user basically right?
- Is the user very close?
- Did the user only identify the broad area?
- Did the user provide proof/testing logic that deserves bonus?
- Did the user use a natural synonym for the same fault?
- Is the output language correct?

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

    const locale = inferLocale(question as ScenarioQuestion, userAnswer);

    const openai = getOpenAI();
    const model = process.env.OPENAI_SCORING_MODEL || "gpt-5-mini";

    const response = await openai.responses.create({
      model,
      input: buildPrompt(question as ScenarioQuestion, userAnswer, locale),
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
      locale,
      result,
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: String(error?.message || error),
    });
  }
}