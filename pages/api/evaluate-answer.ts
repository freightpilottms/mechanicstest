import type { NextApiRequest, NextApiResponse } from "next";
import { callOpenAI } from "@/lib/openai";

type Verdict = "correct" | "very_close" | "partial" | "weak" | "wrong";

type AiResult = {
  score: number;
  diagnosis_percent: number;
  bonus: number;
  verdict: Verdict;
  matched_cause: string;
  reason_short: string;
};

function normalizeLocale(value: unknown): "bs" | "en" {
  const v = String(value || "").toLowerCase();
  return v === "bs" ? "bs" : "en";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function buildSystemPrompt(locale: "bs" | "en") {
  if (locale === "bs") {
    return `
Ti si vrhunski dijagnostičar (master tech). Ocjenjuješ odgovor korisnika na osnovu tačnosti dijagnoze.

PRAVILA:
- Odgovaraj ISKLJUČIVO na BOSANSKOM jeziku.
- Ne koristi engleske riječi u feedbacku.
- Ocjena ide od 0 do 10.

KRITERIJI:
- 9-10: Tačan uzrok + dodatno objašnjenje ili način testiranja
- 7-8: Vrlo blizu (pravi sistem ili komponenta)
- 4-6: Djelimično tačno
- 1-3: Slabo
- 0: Pogrešno

BONUS:
+1 ako objašnjava ZAŠTO se problem dešava
+1 ako navodi KAKO dokazati kvar

VRATI JSON ISKLJUČIVO u ovom formatu:
{
  "score": number,
  "diagnosis_percent": number,
  "bonus": number,
  "verdict": "correct" | "very_close" | "partial" | "weak" | "wrong",
  "matched_cause": string,
  "reason_short": string
}
`;
  }

  return `
You are an expert diagnostic master technician.

RULES:
- Respond ONLY in ENGLISH.
- Score from 0 to 10.

SCORING:
- 9-10: Correct root cause + explanation or testing method
- 7-8: Very close (correct system/component)
- 4-6: Partial
- 1-3: Weak
- 0: Wrong

BONUS:
+1 if explains WHY
+1 if explains HOW TO PROVE

RETURN JSON ONLY:
{
  "score": number,
  "diagnosis_percent": number,
  "bonus": number,
  "verdict": "correct" | "very_close" | "partial" | "weak" | "wrong",
  "matched_cause": string,
  "reason_short": string
}
`;
}

function buildUserPrompt(locale: "bs" | "en", question: any, userAnswer: string) {
  if (locale === "bs") {
    return `
VOZILO: ${question.vehicle}
SIMPTOMI: ${question.symptoms?.join(", ")}
PITANJE: ${question.title}

TAČAN UZROK:
${question.answer_main}

ODGOVOR KORISNIKA:
${userAnswer}

Ocijeni odgovor prema pravilima.
`;
  }

  return `
VEHICLE: ${question.vehicle}
SYMPTOMS: ${question.symptoms?.join(", ")}
QUESTION: ${question.title}

CORRECT ROOT CAUSE:
${question.answer_main}

USER ANSWER:
${userAnswer}

Evaluate the answer.
`;
}

function fallbackResult(locale: "bs" | "en", answer: string): AiResult {
  const hasText = !!answer.trim();

  return {
    score: hasText ? 3 : 0,
    diagnosis_percent: hasText ? 40 : 0,
    bonus: 0,
    verdict: hasText ? "partial" : "wrong",
    matched_cause: "",
    reason_short:
      locale === "bs"
        ? "Privremena ocjena (AI nije dostupan)."
        : "Temporary score (AI unavailable).",
  };
}

function isValidVerdict(value: unknown): value is Verdict {
  return (
    value === "correct" ||
    value === "very_close" ||
    value === "partial" ||
    value === "weak" ||
    value === "wrong"
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { lang, question, userAnswer } = req.body;

    const locale = normalizeLocale(lang);

    if (!question || typeof userAnswer !== "string") {
      return res.status(400).json({
        ok: false,
        error: "Missing question or answer",
      });
    }

    const system = buildSystemPrompt(locale);
    const user = buildUserPrompt(locale, question, userAnswer);

    let aiText = "";

    try {
      aiText = await callOpenAI({
        system,
        user,
        temperature: 0.2,
      });
    } catch {
      const fb = fallbackResult(locale, userAnswer);
      return res.status(200).json({ ok: true, result: fb });
    }

    let parsed: Partial<AiResult> | null = null;

    try {
      parsed = JSON.parse(aiText) as Partial<AiResult>;
    } catch {
      const fb = fallbackResult(locale, userAnswer);
      return res.status(200).json({ ok: true, result: fb });
    }

    if (!parsed) {
      const fb = fallbackResult(locale, userAnswer);
      return res.status(200).json({ ok: true, result: fb });
    }

    const result: AiResult = {
      score: clamp(Number(parsed.score || 0), 0, 10),
      diagnosis_percent: clamp(Number(parsed.diagnosis_percent || 0), 0, 100),
      bonus: clamp(Number(parsed.bonus || 0), 0, 2),
      verdict: isValidVerdict(parsed.verdict) ? parsed.verdict : "wrong",
      matched_cause: String(parsed.matched_cause || ""),
      reason_short: String(parsed.reason_short || ""),
    };

    return res.status(200).json({
      ok: true,
      result,
    });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      error: String(e?.message || e),
    });
  }
}