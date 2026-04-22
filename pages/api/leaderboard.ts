import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { LeaderboardEntry } from "@/lib/leaderboard";

type ApiResponse =
  | { ok: true; rows?: LeaderboardEntry[]; inserted?: boolean }
  | { ok: false; error: string };

const TABLE_NAME = "leaderboard_scores";
const MAX_GET_ROWS = 50;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method === "GET") {
    try {
      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(
          "id, player_key, player_name, avg_score, total_points, rank_label, mode, locale, played_at, question_count, answered_count, timed_out_count"
        )
        .order("avg_score", { ascending: false })
        .order("total_points", { ascending: false })
        .order("played_at", { ascending: false })
        .limit(MAX_GET_ROWS);

      if (error) {
        return res.status(200).json({ ok: true, rows: [] });
      }

      return res.status(200).json({
        ok: true,
        rows: (data || []) as LeaderboardEntry[],
      });
    } catch {
      return res.status(200).json({ ok: true, rows: [] });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body as Partial<LeaderboardEntry>;

      const row: LeaderboardEntry = {
        player_key: String(body.player_key || "").slice(0, 80),
        player_name: String(body.player_name || "You").slice(0, 32),
        avg_score: Number(body.avg_score || 0),
        total_points: Number(body.total_points || 0),
        rank_label: String(body.rank_label || "").slice(0, 80),
        mode: String(body.mode || "all").slice(0, 20),
        locale: String(body.locale || "en").slice(0, 10),
        played_at: body.played_at || new Date().toISOString(),
        question_count: Number(body.question_count || 0),
        answered_count: Number(body.answered_count || 0),
        timed_out_count: Number(body.timed_out_count || 0),
      };

      if (!row.player_key) {
        return res.status(400).json({ ok: false, error: "Missing player_key" });
      }

      const supabase = getSupabaseAdmin();

      const { error } = await supabase.from(TABLE_NAME).insert(row);

      if (error) {
        return res.status(500).json({ ok: false, error: error.message });
      }

      return res.status(200).json({ ok: true, inserted: true });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}