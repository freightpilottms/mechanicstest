import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function getRankLabel(averageScore: number) {
  if (averageScore >= 9) return "Master Tech";
  if (averageScore >= 7) return "Advanced Mechanic";
  if (averageScore >= 5) return "Intermediate Mechanic";
  return "Beginner";
}

function getDisplayName(userId: string) {
  const raw = String(userId || "").trim();
  if (!raw) return "Unknown Player";
  if (raw.startsWith("guest_")) {
    return `Guest ${raw.slice(-6).toUpperCase()}`;
  }
  return raw;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const userId = String(req.query.user_id || "").trim();

    if (!userId) {
      return res.status(400).json({
        ok: false,
        error: "Missing user_id",
      });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("test_sessions")
      .select("user_id, average_score, question_count, status")
      .eq("user_id", userId)
      .eq("status", "finished")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const rows = data ?? [];

    if (!rows.length) {
      return res.status(200).json({
        ok: true,
        entry: null,
      });
    }

    let totalPoints = 0;
    let totalScore = 0;
    let testsPlayed = 0;
    let totalQuestions = 0;

    for (const row of rows) {
      const avgScore = Number(row.average_score || 0);
      const questionCount = Number(row.question_count || 0);
      const points = Number((avgScore * Math.max(questionCount, 1)).toFixed(1));

      totalPoints += points;
      totalScore += avgScore;
      testsPlayed += 1;
      totalQuestions += questionCount;
    }

    const averageScore = testsPlayed
      ? Number((totalScore / testsPlayed).toFixed(1))
      : 0;

    return res.status(200).json({
      ok: true,
      entry: {
        user_id: userId,
        display_name: getDisplayName(userId),
        total_points: Number(totalPoints.toFixed(1)),
        average_score: averageScore,
        tests_played: testsPlayed,
        total_questions: totalQuestions,
        rank_label: getRankLabel(averageScore),
      },
    });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      error: String(e?.message || e),
    });
  }
}