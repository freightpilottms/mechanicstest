import type { NextApiRequest, NextApiResponse } from "next";
import { saveCompletedTestSession } from "@/lib/scenario-storage";

type IncomingItem = {
  scenario_id: string;
  position: number;
  user_answer: string;
  time_spent_seconds?: number;
  timed_out?: boolean;
  ai_score?: number;
  ai_bonus?: number;
  ai_diagnosis_percent?: number;
  ai_verdict?: string;
  ai_feedback?: string;
  matched_cause?: string;
};

function normalizeLocale(value: unknown): "bs" | "en" {
  const v = String(value || "").trim().toLowerCase();
  return v === "bs" ? "bs" : "en";
}

function normalizeMode(value: unknown): "all" | "us" | "eu" | "asia" {
  const v = String(value || "").trim().toLowerCase();
  if (v === "us" || v === "eu" || v === "asia" || v === "all") return v;
  return "all";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const {
      user_id,
      mode,
      locale,
      average_score,
      final_rank,
      items,
    } = req.body || {};

    const normalizedUserId = String(user_id || "").trim();
    const normalizedMode = normalizeMode(mode);
    const normalizedLocale = normalizeLocale(locale);

    if (!normalizedUserId) {
      return res.status(400).json({
        ok: false,
        error: "Missing user_id",
      });
    }

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({
        ok: false,
        error: "Missing test session items",
      });
    }

    const cleanItems: IncomingItem[] = items
      .map((item: any, index: number) => ({
        scenario_id: String(item?.scenario_id || "").trim(),
        position: Number(item?.position ?? index + 1),
        user_answer: String(item?.user_answer || ""),
        time_spent_seconds: Number(item?.time_spent_seconds || 0),
        timed_out: !!item?.timed_out,
        ai_score:
          item?.ai_score === undefined || item?.ai_score === null
            ? undefined
            : Number(item.ai_score),
        ai_bonus:
          item?.ai_bonus === undefined || item?.ai_bonus === null
            ? undefined
            : Number(item.ai_bonus),
        ai_diagnosis_percent:
          item?.ai_diagnosis_percent === undefined ||
          item?.ai_diagnosis_percent === null
            ? undefined
            : Number(item.ai_diagnosis_percent),
        ai_verdict: item?.ai_verdict ? String(item.ai_verdict) : undefined,
        ai_feedback: item?.ai_feedback ? String(item.ai_feedback) : undefined,
        matched_cause: item?.matched_cause
          ? String(item.matched_cause)
          : undefined,
      }))
      .filter((item) => item.scenario_id);

    if (!cleanItems.length) {
      return res.status(400).json({
        ok: false,
        error: "No valid scenario items to save",
      });
    }

    const saved = await saveCompletedTestSession({
      user_id: normalizedUserId,
      mode: normalizedMode,
      locale: normalizedLocale,
      average_score: Number(average_score || 0),
      final_rank: String(final_rank || ""),
      items: cleanItems.map((item) => ({
        scenario_id: item.scenario_id,
        position: item.position,
        user_answer: item.user_answer,
        time_spent_seconds: item.time_spent_seconds,
        timed_out: item.timed_out,
        ai_score: item.ai_score,
        ai_bonus: item.ai_bonus,
        ai_diagnosis_percent: item.ai_diagnosis_percent,
        ai_verdict: item.ai_verdict,
        ai_feedback: item.ai_feedback,
        matched_cause: item.matched_cause,
      })),
      session_type: "single",
    });

    return res.status(200).json({
      ok: true,
      session: saved.session,
      itemsSaved: saved.items.length,
    });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      error: String(e?.message || e),
    });
  }
}