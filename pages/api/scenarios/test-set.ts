import type { NextApiRequest, NextApiResponse } from "next";
import { getScenariosForMode } from "@/lib/scenario-storage";

type StoredScenario = {
  id?: string;
  difficulty: "easy" | "medium" | "hard";
  times_used?: number;
  created_at?: string;
  [key: string]: any;
};

function shuffle<T>(arr: T[]) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickOneByDifficulty(pool: StoredScenario[], difficulty: "easy" | "medium" | "hard") {
  const filtered = pool.filter((item) => item.difficulty === difficulty);
  if (!filtered.length) return null;
  return shuffle(filtered)[0];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const rawCount = Number(req.query.count || 10);
    const count = Math.max(1, Math.min(20, Number.isFinite(rawCount) ? rawCount : 10));

    const allScenarios = await getScenariosForMode("all", 200);

    if (!allScenarios.length) {
      return res.status(404).json({
        ok: false,
        error: "No scenarios found",
      });
    }

    const uniqueById = new Map<string, StoredScenario>();
    for (const item of allScenarios) {
      if (item?.id) uniqueById.set(String(item.id), item);
    }

    const pool = Array.from(uniqueById.values());

    const selected: StoredScenario[] = [];
    const usedIds = new Set<string>();

    const easyOne = pickOneByDifficulty(pool, "easy");
    const mediumOne = pickOneByDifficulty(pool, "medium");
    const hardOne = pickOneByDifficulty(pool, "hard");

    for (const item of [easyOne, mediumOne, hardOne]) {
      if (item?.id && !usedIds.has(String(item.id)) && selected.length < count) {
        selected.push(item);
        usedIds.add(String(item.id));
      }
    }

    const remainingPool = shuffle(
      pool.filter((item) => item?.id && !usedIds.has(String(item.id)))
    );

    for (const item of remainingPool) {
      if (selected.length >= count) break;
      selected.push(item);
      usedIds.add(String(item.id));
    }

    if (selected.length < count) {
      return res.status(400).json({
        ok: false,
        error: `Not enough scenarios in database. Required: ${count}, available unique: ${selected.length}`,
        available: selected.length,
      });
    }

    const difficultyBreakdown = {
      easy: selected.filter((x) => x.difficulty === "easy").length,
      medium: selected.filter((x) => x.difficulty === "medium").length,
      hard: selected.filter((x) => x.difficulty === "hard").length,
    };

    return res.status(200).json({
      ok: true,
      scenarios: shuffle(selected),
      meta: {
        count: selected.length,
        difficultyBreakdown,
      },
    });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      error: String(e?.message || e),
    });
  }
}