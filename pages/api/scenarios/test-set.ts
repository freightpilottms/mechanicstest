import type { NextApiRequest, NextApiResponse } from "next";
import { getScenariosForMode } from "../../../lib/scenario-storage";

type SupportedLocale = "en" | "bs";
type SupportedMode = "all" | "eu" | "us" | "asia";
type Difficulty = "easy" | "medium" | "hard";

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
  year?: number;
  power_kw?: number;
  [key: string]: any;
};

function getLocaleFromReq(req: NextApiRequest): SupportedLocale {
  const raw =
    req.method === "POST"
      ? String(req.body?.locale || req.body?.lang || "en").toLowerCase()
      : String(req.query.locale || req.query.lang || "en").toLowerCase();

  return raw === "bs" ? "bs" : "en";
}

function getModeFromReq(req: NextApiRequest): SupportedMode {
  const raw =
    req.method === "POST"
      ? String(req.body?.mode || "all").toLowerCase()
      : String(req.query.mode || "all").toLowerCase();

  if (raw === "eu" || raw === "us" || raw === "asia") return raw;
  return "all";
}

function getCountFromReq(req: NextApiRequest): number {
  const raw =
    req.method === "POST"
      ? Number(req.body?.count || 10)
      : Number(req.query.count || 10);

  return Math.max(1, Math.min(20, Number.isFinite(raw) ? raw : 10));
}

function getExcludeIdsFromReq(req: NextApiRequest): string[] {
  const raw = req.method === "POST" ? req.body?.excludeIds : req.query.excludeIds;

  if (Array.isArray(raw)) {
    return raw.map((x) => String(x)).filter(Boolean);
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((x) => String(x)).filter(Boolean);
      }
    } catch {
      return raw
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function scenarioText(item: StoredScenario): string {
  return [
    item.platform_type,
    item.vehicle,
    item.category,
    item.root_cause_id,
    item.root_cause_label,
    item.title,
    ...(Array.isArray(item.symptoms) ? item.symptoms : []),
    ...(Array.isArray(item.driving) ? item.driving : []),
    ...(Array.isArray(item.extra) ? item.extra : []),
    ...(Array.isArray(item.key_details) ? item.key_details : []),
    ...(Array.isArray(item.accepted_answers) ? item.accepted_answers : []),
    ...(Array.isArray(item.partial_answers) ? item.partial_answers : []),
    item.answer_main,
    item.answer_why_no_code,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isMechanicallyCompatible(item: StoredScenario): boolean {
  const text = scenarioText(item);
  const platform = String(item.platform_type || "").toLowerCase();
  const vehicle = String(item.vehicle || "").toLowerCase();
  const combined = `${platform} ${vehicle}`;

  const looksDiesel =
    /\b(diesel|tdi|hdi|dci|jtd|cdi|crdi|multijet|duratorq|tddi|tdci|d-4d)\b/.test(
      combined
    );
  const looksPetrol =
    /\b(petrol|gasoline|tsi|tfsi|fsi|gdi|mpi|ecoboost|skyactiv-g|t-jet|vti)\b/.test(
      combined
    );
  const beltEngine = /\b(belt|remen)\b/.test(combined);
  const chainEngine = /\b(chain|lanac)\b/.test(combined);

  if (beltEngine && /\b(chain|timing chain|lanac)\b/.test(text)) return false;
  if (chainEngine && /\b(timing belt|zupcasti remen|remen razvoda|remen)\b/.test(text))
    return false;

  if (
    looksDiesel &&
    /\b(spark plug|ignition coil|coil pack|svjecica|svjećica|bobina|throttle body)\b/.test(
      text
    )
  ) {
    return false;
  }

  if (
    looksPetrol &&
    /\b(dpf|diesel particulate|common rail|high-pressure diesel pump|injector pump|adblue|glow plug|grijac|grijač)\b/.test(
      text
    )
  ) {
    return false;
  }

  return true;
}

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
    if (item?.id) map.set(String(item.id), item);
  }
  return Array.from(map.values());
}

function normalizeScenarioLocale(item: StoredScenario): SupportedLocale {
  const raw = String(item.locale || item.language || "en").toLowerCase();
  return raw === "bs" ? "bs" : "en";
}

function filterByLocale(items: StoredScenario[], locale: SupportedLocale): StoredScenario[] {
  return items.filter((item) => normalizeScenarioLocale(item) === locale);
}

function filterExcluded(items: StoredScenario[], excludeIds: Set<string>): StoredScenario[] {
  return items.filter((item) => item?.id && !excludeIds.has(String(item.id)));
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

function createdAtMs(item: StoredScenario): number {
  const ms = Date.parse(String(item.created_at || ""));
  return Number.isFinite(ms) ? ms : 0;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function topScoredCandidates(
  pool: StoredScenario[],
  usedIds: Set<string>,
  usedVehicles: Set<string>,
  usedRootCauses: Set<string>
): StoredScenario[] {
  const available = pool.filter((item) => item?.id && !usedIds.has(String(item.id)));
  if (!available.length) return [];

  const scored = available.map((item) => {
    const vehicle = String(item.vehicle || "").trim().toLowerCase();
    const rootCause = String(item.root_cause_id || "").trim().toLowerCase();
    const timesUsed = Number(item.times_used || 0);

    let score = 0;
    if (vehicle && !usedVehicles.has(vehicle)) score += 50;
    if (rootCause && !usedRootCauses.has(rootCause)) score += 50;

    // Prefer less-used scenarios, but not in a fully deterministic way.
    score += Math.max(0, 30 - Math.min(timesUsed, 30));

    // Small freshness boost, not enough to dominate everything.
    score += Math.min(20, Math.floor(createdAtMs(item) / 86400000) % 20);

    // Tiny noise so ties do not always resolve the same way.
    score += Math.random() * 10;

    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const cutoff = scored[0]?.score ?? 0;
  const window = scored.filter((x) => x.score >= cutoff - 8).slice(0, 12);
  return window.map((x) => x.item);
}

function pickBestCandidate(
  pool: StoredScenario[],
  usedIds: Set<string>,
  usedVehicles: Set<string>,
  usedRootCauses: Set<string>
): StoredScenario | null {
  const candidates = topScoredCandidates(pool, usedIds, usedVehicles, usedRootCauses);
  if (!candidates.length) return null;
  return pickRandom(candidates);
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

function buildTestSet(allScenarios: StoredScenario[], count: number): StoredScenario[] {
  const easyPool = shuffle(allScenarios.filter((x) => x.difficulty === "easy"));
  const mediumPool = shuffle(allScenarios.filter((x) => x.difficulty === "medium"));
  const hardPool = shuffle(allScenarios.filter((x) => x.difficulty === "hard"));

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
    const remainingPool = shuffle(
      allScenarios.filter((item) => item?.id && !usedIds.has(String(item.id)))
    );

    while (selected.length < count) {
      const picked = pickBestCandidate(
        remainingPool,
        usedIds,
        usedVehicles,
        usedRootCauses
      );

      if (!picked) break;
      if (!addScenario(selected, picked, usedIds, usedVehicles, usedRootCauses)) break;
    }
  }

  return selected;
}

function buildFreshFirstTestSet(
  allScenarios: StoredScenario[],
  count: number,
  excludeIds: Set<string>
) {
  const freshPool = filterExcluded(allScenarios, excludeIds);
  const freshSelected = buildTestSet(freshPool, count);

  if (freshSelected.length >= count) {
    return {
      selected: freshSelected,
      usedFallback: false,
      freshCount: freshSelected.length,
    };
  }

  const selectedIds = new Set(
    freshSelected.map((item) => String(item.id)).filter(Boolean)
  );

  const fallbackPool = allScenarios.filter(
    (item) => item?.id && !selectedIds.has(String(item.id))
  );

  const needed = count - freshSelected.length;
  const fallbackSelected = buildTestSet(fallbackPool, needed);

  return {
    selected: [...freshSelected, ...fallbackSelected].slice(0, count),
    usedFallback: fallbackSelected.length > 0,
    freshCount: freshSelected.length,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const count = getCountFromReq(req);
    const locale = getLocaleFromReq(req);
    const mode = getModeFromReq(req);
    const excludeIds = new Set(getExcludeIdsFromReq(req));

    // Pull a much larger pool; limiting to 500 can hide most of the database.
    const allScenariosRaw = await getScenariosForMode(mode, 5000);
    const allScenarios = uniqueById(allScenariosRaw).filter(isMechanicallyCompatible);

    if (!allScenarios.length) {
      return res.status(404).json({
        ok: false,
        error: "No scenarios found",
      });
    }

    const localePool = filterByLocale(allScenarios, locale);
    let selectedResult = buildFreshFirstTestSet(localePool, count, excludeIds);
    let usedLocale = locale;

    if (selectedResult.selected.length < count && locale !== "en") {
      const englishPool = filterByLocale(allScenarios, "en");
      selectedResult = buildFreshFirstTestSet(englishPool, count, excludeIds);
      usedLocale = "en";
    }

    const selected = shuffle(selectedResult.selected);

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
      scenarios: selected,
      meta: {
        count: selected.length,
        requested: count,
        difficultyBreakdown,
        uniqueVehicles,
        uniqueRootCauses,
        requestedLocale: locale,
        usedLocale,
        mode,
        excludeIdsCount: excludeIds.size,
        freshCount: selectedResult.freshCount,
        usedFallback: selectedResult.usedFallback,
        sourcePoolCount: allScenarios.length,
        localePoolCount: localePool.length,
      },
    });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      error: String(e?.message || e),
    });
  }
}
