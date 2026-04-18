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
    const rawLimit = Number(req.query.limit || 8);
    const limit = Math.max(1, Math.min(50, Number.isFinite(rawLimit) ? rawLimit : 8));

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("test_sessions")
      .select("user_id, average_score, question_count, status")
      .eq("status", "finished")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) {
      throw new Error(error.message);
    }

    const rows = data ?? [];

    const grouped = new Map<
      string,
      {
        user_id: string;
        total_points: number;
        total_score: number;
        tests_played: number;
        total_questions: number;
      }
    >();

    for (const row of rows) {
      const userId = String(row.user_id || "").trim();
      if (!userId) continue;

      const avgScore = Number(row.average_score || 0);
      const questionCount = Number(row.question_count || 0);
      const points = Number((avgScore * Math.max(questionCount, 1)).toFixed(1));

      const current = grouped.get(userId) || {
        user_id: userId,
        total_points: 0,
        total_score: 0,
        tests_played: 0,
        total_questions: 0,
      };

      current.total_points += points;
      current.total_score += avgScore;
      current.tests_played += 1;
      current.total_questions += questionCount;

      grouped.set(userId, current);
    }

    const entries = Array.from(grouped.values())
      .map((entry) => {
        const averageScore = entry.tests_played
          ? Number((entry.total_score / entry.tests_played).toFixed(1))
          : 0;

        return {
          user_id: entry.user_id,
          display_name: getDisplayName(entry.user_id),
          total_points: Number(entry.total_points.toFixed(1)),
          average_score: averageScore,
          tests_played: entry.tests_played,
          rank_label: getRankLabel(averageScore),
        };
      })
      .sort((a, b) => {
        if (b.total_points !== a.total_points) return b.total_points - a.total_points;
        if (b.average_score !== a.average_score) return b.average_score - a.average_score;
        return b.tests_played - a.tests_played;
      })
      .slice(0, limit);

    return res.status(200).json({
      ok: true,
      entries,
    });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      error: String(e?.message || e),
    });
  }
}