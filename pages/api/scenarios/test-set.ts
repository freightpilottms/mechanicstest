import type { NextApiRequest, NextApiResponse } from "next";
import { getScenariosForMode } from "../../../lib/scenario-storage";

type SupportedLocale = "en" | "bs";

function getLocaleFromReq(req: NextApiRequest): SupportedLocale {
  const raw = String(req.query.locale || req.query.lang || "en").toLowerCase();
  return raw === "bs" ? "bs" : "en";
}

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
  [key: string]: any;
};


function scenarioLooksCompatible(item: StoredScenario): boolean {
  const platform = String(item.platform_type || "").toLowerCase();
  const haystack = [
    item.title,
    item.vehicle,
    ...(Array.isArray(item.symptoms) ? item.symptoms : []),
    ...(Array.isArray(item.driving) ? item.driving : []),
    ...(Array.isArray(item.extra) ? item.extra : []),
    ...(Array.isArray(item.key_details) ? item.key_details : []),
    ...(Array.isArray(item.hint) ? item.hint : []),
    item.answer_main,
    item.answer_why_no_code,
    ...(Array.isArray(item.answer_proof) ? item.answer_proof : []),
    ...(Array.isArray(item.accepted_answers) ? item.accepted_answers : []),
    ...(Array.isArray(item.partial_answers) ? item.partial_answers : []),
    item.root_cause_label,
    item.root_cause_id,
    item.category,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (platform.includes("_belt") && /\blanac\b|\bchain\b/.test(haystack)) {
    return false;
  }

  if (platform.includes("_chain") && /\bremen\b|\bbelt\b/.test(haystack)) {
    return false;
  }

  if (platform.includes("petrol") && /\bdpf\b|\bdizna\b|\binjektor dizela\b|\bglow plug\b|\bgrijac\b|\bgrejac\b/.test(haystack)) {
    return false;
  }

  if (platform.includes("diesel") && /\bsvjecic\b|\bsvjećic\b|\bspark plug\b|\bizgaranje benzina\b/.test(haystack)) {
    return false;
  }

  return true;
}

function filterCompatibleScenarios(items: StoredScenario[]): StoredScenario[] {
  return items.filter((item) => scenarioLooksCompatible(item));
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

function normalizeScenarioLocale(item: StoredScenario): SupportedLocale {
  const raw = String(item.locale || item.language || "en").toLowerCase();
  return raw === "bs" ? "bs" : "en";
}

function filterByLocale(
  items: StoredScenario[],
  locale: SupportedLocale
): StoredScenario[] {
  return items.filter((item) => normalizeScenarioLocale(item) === locale);
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

function buildTestSet(
  allScenarios: StoredScenario[],
  count: number
): StoredScenario[] {
  const easyPool = allScenarios.filter((x) => x.difficulty === "easy");
  const mediumPool = allScenarios.filter((x) => x.difficulty === "medium");
  const hardPool = allScenarios.filter((x) => x.difficulty === "hard");

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
    const remainingPool = allScenarios.filter(
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

  return selected;
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
    const locale = getLocaleFromReq(req);

    const allScenariosRaw = await getScenariosForMode("all", 500);
    const allScenarios = filterCompatibleScenarios(sortPool(uniqueById(allScenariosRaw)));

    if (!allScenarios.length) {
      return res.status(404).json({
        ok: false,
        error: "No scenarios found",
      });
    }

    const localePool = filterByLocale(allScenarios, locale);

    let selected = buildTestSet(localePool, count);
    let usedLocale = locale;

    if (selected.length < count && locale !== "en") {
      const englishPool = filterByLocale(allScenarios, "en");
      selected = buildTestSet(englishPool, count);
      usedLocale = "en";
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
        difficultyBreakdown,
        uniqueVehicles,
        uniqueRootCauses,
        requestedLocale: locale,
        usedLocale,
      },
    });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      error: String(e?.message || e),
    });
  }
}