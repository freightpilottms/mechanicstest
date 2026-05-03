import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { LeaderboardEntry, LeaderboardPlayerStats } from "@/lib/leaderboard";

type ApiResponse =
  | {
      ok: true;
      rows?: LeaderboardEntry[];
      inserted?: boolean;
      currentPlayer?: LeaderboardPlayerStats | null;
      totalPlayers?: number;
    }
  | { ok: false; error: string };

const TABLE_NAME = "leaderboard_scores";
const MAX_GET_ROWS = 100;
const MAX_RANKING_ROWS = 5000;
const SELECT_COLUMNS =
  "id, player_key, player_name, avg_score, total_points, rank_label, mode, locale, played_at, question_count, answered_count, timed_out_count";

function cleanPlayerKey(value: unknown) {
  return String(value || "").trim().slice(0, 80);
}

function scoreSort(a: LeaderboardEntry, b: LeaderboardEntry) {
  if (b.avg_score !== a.avg_score) return b.avg_score - a.avg_score;
  if (b.total_points !== a.total_points) return b.total_points - a.total_points;
  return new Date(b.played_at).getTime() - new Date(a.played_at).getTime();
}

function buildBestRows(rows: LeaderboardEntry[]) {
  const byPlayer = new Map<
    string,
    { best: LeaderboardEntry; testsPlayed: number; lastPlayedAt: string }
  >();

  for (const row of rows) {
    const key = cleanPlayerKey(row.player_key);
    if (!key) continue;

    const existing = byPlayer.get(key);

    if (!existing) {
      byPlayer.set(key, {
        best: row,
        testsPlayed: 1,
        lastPlayedAt: row.played_at,
      });
      continue;
    }

    existing.testsPlayed += 1;

    if (new Date(row.played_at).getTime() > new Date(existing.lastPlayedAt).getTime()) {
      existing.lastPlayedAt = row.played_at;
    }

    if (scoreSort(row, existing.best) < 0) {
      existing.best = row;
    }
  }

  return Array.from(byPlayer.values())
    .map((entry) => ({
      ...entry.best,
      tests_played: entry.testsPlayed,
    }))
    .sort(scoreSort)
    .map((row, index) => ({
      ...row,
      global_position: index + 1,
    }));
}

function buildPlayerStats(
  rankedRows: LeaderboardEntry[],
  playerKey: string
): LeaderboardPlayerStats | null {
  if (!playerKey) return null;

  const row = rankedRows.find((item) => cleanPlayerKey(item.player_key) === playerKey);

  if (!row) {
    return {
      player_key: playerKey,
      player_name: "",
      global_position: null,
      total_players: rankedRows.length,
      best_score: 0,
      best_total_points: 0,
      tests_played: 0,
      rank_label: "",
      last_played_at: null,
      best_entry: null,
    };
  }

  return {
    player_key: row.player_key,
    player_name: row.player_name,
    global_position: row.global_position || null,
    total_players: rankedRows.length,
    best_score: row.avg_score,
    best_total_points: row.total_points,
    tests_played: row.tests_played || 1,
    rank_label: row.rank_label,
    last_played_at: row.played_at,
    best_entry: row,
  };
}

async function fetchRankedRows() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(SELECT_COLUMNS)
    .order("avg_score", { ascending: false })
    .order("total_points", { ascending: false })
    .order("played_at", { ascending: false })
    .limit(MAX_RANKING_ROWS);

  if (error) {
    throw error;
  }

  return buildBestRows((data || []) as LeaderboardEntry[]);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method === "GET") {
    try {
      const playerKey = cleanPlayerKey(req.query.playerKey || req.query.player_key);
      const rankedRows = await fetchRankedRows();

      return res.status(200).json({
        ok: true,
        rows: rankedRows.slice(0, MAX_GET_ROWS),
        currentPlayer: buildPlayerStats(rankedRows, playerKey),
        totalPlayers: rankedRows.length,
      });
    } catch {
      return res.status(200).json({
        ok: true,
        rows: [],
        currentPlayer: null,
        totalPlayers: 0,
      });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body as Partial<LeaderboardEntry>;

      const row: LeaderboardEntry = {
        player_key: cleanPlayerKey(body.player_key),
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

      const rankedRows = await fetchRankedRows();

      return res.status(200).json({
        ok: true,
        inserted: true,
        currentPlayer: buildPlayerStats(rankedRows, row.player_key),
        totalPlayers: rankedRows.length,
      });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
