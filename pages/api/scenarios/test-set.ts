import type { NextApiRequest, NextApiResponse } from "next";
import {
  getRecentPlayedScenarioIdsForUser,
  getScenariosForMode,
} from "../../../lib/scenario-storage";

type Difficulty = "easy" | "medium" | "hard";
type ScenarioMode = "all" | "us" | "eu" | "asia";
type ScenarioLocale = "bs" | "en";

type StoredScenario = {
  id?: string;
  brand?: string;
  vehicle?: string;
  difficulty: Difficulty;
  root_cause_id?: string;
  times_used?: number;
  created_at?: string;
  locale?: string;
  language?: string;
  lang?: string;
  [key: string]: any;
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function uniqueById(items: StoredScenario[]): StoredScenario[] {
  const map = new Map<string, StoredScenario>();
  for (const item of items) {
    if (item?.id) {
      map.set(String(item.id), item);
    }
  }
  return Array.from(map.values());
}

function sortPool(items: StoredScenario[]): StoredScenario[] {
  return [...items].sort((a, b) => {
    const aUsed = Number(a.times_used || 0);
    const bUsed = Number(b.times_used || 0);
    if (aUsed !== bUsed) return aUsed - bUsed;

    const aCreated = String(a.created_at || "");
    const bCreated = String(b.created_at || "");
    return bCreated.localeCompare(aCreated);
  });
}

function normalizeMode(value: unknown): ScenarioMode {
  const v = String(value || "").trim().toLowerCase();
  if (v === "us" || v === "eu" || v === "asia" || v === "all") return v;
  return "all";
}

function normalizeLocale(value: unknown): ScenarioLocale {
  const v = String(value || "").trim().toLowerCase();
  if (v === "bs" || v === "en") return v;
  return "en";
}

function getScenarioLocale(item: StoredScenario): string {
  return String(item.locale || item.language || item.lang || "")
    .trim()
    .toLowerCase();
}

function filterByLocale(
  items: StoredScenario[],
  locale: ScenarioLocale
): StoredScenario[] {
  const exact = items.filter((item) => getScenarioLocale(item) === locale);

  if (exact.length > 0) return exact;

  const noLocaleInfo = items.filter((item) => !getScenarioLocale(item));
  if (noLocaleInfo.length > 0) return noLocaleInfo;

  return items;
}

function parseExcludeIds(value: unknown): Set<string> {
  const raw = String(value || "").trim();
  if (!raw) return new Set<string>();

  return new Set(
    raw
      .split(",")
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(-300)
  );
}

function normalizeUserId(value: unknown): string {
  return String(value || "").trim();
}

function pickBestCandidate(
  pool: StoredScenario[],
  usedIds: Set<string>,
  usedVehicles: Set<string>,
  usedRootCauses: Set<string>
): StoredScenario | null {
  const available = pool.filter((item) => item?.id && !usedIds.has(String(item.id)));
  if (!available.length) return null;

  const perfect = available.filter((item) => {
    const vehicle = String(item.vehicle || "").trim().toLowerCase();
    const rootCause = String(item.root_cause_id || "").trim().toLowerCase();
    return !usedVehicles.has(vehicle) && !usedRootCauses.has(rootCause);
  });
  if (perfect.length) return perfect[0];

  const noRootRepeat = available.filter((item) => {
    const rootCause = String(item.root_cause_id || "").trim().toLowerCase();
    return !usedRootCauses.has(rootCause);
  });
  if (noRootRepeat.length) return noRootRepeat[0];

  const noVehicleRepeat = available.filter((item) => {
    const vehicle = String(item.vehicle || "").trim().toLowerCase();
    return !usedVehicles.has(vehicle);
  });
  if (noVehicleRepeat.length) return noVehicleRepeat[0];

  return available[0];
}

function addScenario(
  selected: StoredScenario[],
  scenario: StoredScenario | null,
  usedIds: Set<string>,
  usedVehicles: Set<string>,
  usedRootCauses: Set<string>
) {
  if (!scenario?.id) return false;

  const id = String(scenario.id);
  if (usedIds.has(id)) return false;

  selected.push(scenario);
  usedIds.add(id);

  const vehicle = String(scenario.vehicle || "").trim().toLowerCase();
  const rootCause = String(scenario.root_cause_id || "").trim().toLowerCase();

  if (vehicle) usedVehicles.add(vehicle);
  if (rootCause) usedRootCauses.add(rootCause);

  return true;
}

function buildTargetDistribution(count: number) {
  if (count <= 1) return { easy: 0, medium: 0, hard: 1 };
  if (count === 2) return { easy: 1, medium: 0, hard: 1 };
  if (count === 3) return { easy: 1, medium: 1, hard: 1 };
  if (count === 4) return { easy: 1, medium: 2, hard: 1 };
  if (count === 5) return { easy: 1, medium: 2, hard: 2 };
  if (count === 6) return { easy: 2, medium: 2, hard: 2 };
  if (count === 7) return { easy: 2, medium: 3, hard: 2 };
  if (count === 8) return { easy: 2, medium: 3, hard: 3 };
  if (count === 9) return { easy: 3, medium: 3, hard: 3 };
  return { easy: 3, medium: 4, hard: 3 };
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

    const mode = normalizeMode(req.query.mode);
    const locale = normalizeLocale(req.query.lang || req.query.locale);
    const guestUserId = normalizeUserId(req.query.user_id || req.query.guest_user_id);
    const localExcludeIds = parseExcludeIds(req.query.excludeIds);

    let dbExcludeIds = new Set<string>();

    if (guestUserId) {
      try {
        const recentIds = await getRecentPlayedScenarioIdsForUser(guestUserId, 150);
        dbExcludeIds = new Set(
          recentIds.map((id) => String(id || "").trim()).filter(Boolean)
        );
      } catch {
        dbExcludeIds = new Set<string>();
      }
    }

    const combinedExcludeIds = new Set<string>([
      ...Array.from(localExcludeIds),
      ...Array.from(dbExcludeIds),
    ]);

    const allScenariosRaw = await getScenariosForMode(mode, 500);
    const localePool = sortPool(filterByLocale(uniqueById(allScenariosRaw), locale));

    if (!localePool.length) {
      return res.status(404).json({
        ok: false,
        error: "No scenarios found",
      });
    }

    const freshPool = localePool.filter(
      (item) => item?.id && !combinedExcludeIds.has(String(item.id))
    );

    const basePool = freshPool.length >= count ? freshPool : localePool;

    const easyPool = basePool.filter((x) => x.difficulty === "easy");
    const mediumPool = basePool.filter((x) => x.difficulty === "medium");
    const hardPool = basePool.filter((x) => x.difficulty === "hard");

    const target = buildTargetDistribution(count);

    const selected: StoredScenario[] = [];
    const usedIds = new Set<string>();
    const usedVehicles = new Set<string>();
    const usedRootCauses = new Set<string>();

    for (let i = 0; i < target.easy; i += 1) {
      const picked = pickBestCandidate(easyPool, usedIds, usedVehicles, usedRootCauses);
      addScenario(selected, picked, usedIds, usedVehicles, usedRootCauses);
    }

    for (let i = 0; i < target.medium; i += 1) {
      const picked = pickBestCandidate(mediumPool, usedIds, usedVehicles, usedRootCauses);
      addScenario(selected, picked, usedIds, usedVehicles, usedRootCauses);
    }

    for (let i = 0; i < target.hard; i += 1) {
      const picked = pickBestCandidate(hardPool, usedIds, usedVehicles, usedRootCauses);
      addScenario(selected, picked, usedIds, usedVehicles, usedRootCauses);
    }

    if (selected.length < count) {
      const remainingPool = basePool.filter(
        (item) => item?.id && !usedIds.has(String(item.id))
      );

      while (selected.length < count && remainingPool.length) {
        const picked = pickBestCandidate(
          remainingPool,
          usedIds,
          usedVehicles,
          usedRootCauses
        );

        if (!picked) break;
        addScenario(selected, picked, usedIds, usedVehicles, usedRootCauses);
      }
    }

    if (!selected.length) {
      return res.status(400).json({
        ok: false,
        error: "Could not build test set from current database",
      });
    }

    const difficultyBreakdown = {
      easy: selected.filter((x) => x.difficulty === "easy").length,
      medium: selected.filter((x) => x.difficulty === "medium").length,
      hard: selected.filter((x) => x.difficulty === "hard").length,
    };

    const uniqueVehicles = new Set(
      selected.map((x) => String(x.vehicle || "").trim().toLowerCase()).filter(Boolean)
    ).size;

    const uniqueRootCauses = new Set(
      selected.map((x) => String(x.root_cause_id || "").trim().toLowerCase()).filter(Boolean)
    ).size;

    return res.status(200).json({
      ok: true,
      scenarios: shuffle(selected),
      meta: {
        count: selected.length,
        requested: count,
        mode,
        locale,
        guestUserId: guestUserId || null,
        localExcludedCount: localExcludeIds.size,
        dbExcludedCount: dbExcludeIds.size,
        excludedCount: combinedExcludeIds.size,
        usedHistoryFilter: freshPool.length >= count,
        difficultyBreakdown,
        uniqueVehicles,
        uniqueRootCauses,
      },
    });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      error: String(e?.message || e),
    });
  }
}