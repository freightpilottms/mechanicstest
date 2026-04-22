import type { NextApiRequest, NextApiResponse } from "next";
import { getScenariosForMode, type StoredScenario, type SupportedMode } from "@/lib/scenario-storage";

type SupportedLocale = "en" | "bs";

function getLocaleFromReq(req: NextApiRequest): SupportedLocale {
  const raw = String(req.query.locale || req.query.lang || req.body?.locale || req.body?.lang || "en").toLowerCase();
  return raw === "bs" ? "bs" : "en";
}

function getModeFromReq(req: NextApiRequest): SupportedMode {
  const raw = String(req.query.mode || req.body?.mode || "all").toLowerCase();
  if (raw === "eu" || raw === "us" || raw === "asia") return raw;
  return "all";
}

function getCountFromReq(req: NextApiRequest): number {
  const raw = Number(req.query.count || req.body?.count || 10);
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
    /\b(diesel|tdi|hdi|dci|jtd|cdi|crdi|multijet|duratorq|tddi|tdci|d-4d|duramax|idtec|dtec)\b/.test(
      combined
    );
  const looksPetrol =
    /\b(petrol|gasoline|tsi|tfsi|fsi|gdi|mpi|ecoboost|skyactiv-g|t-jet|vti)\b/.test(
      combined
    );
  const beltEngine = /\b(belt|remen)\b/.test(combined);
  const chainEngine = /\b(chain|lanac)\b/.test(combined);
  const hasStartStop = /\b(has_start_stop:\s*yes|has_start_stop:\s*da|start[\s-]?stop)\b/.test(combined);
  const noStartStop = /\bhas_start_stop:\s*no\b/.test(combined);
  const hasDpf = /\b(dpf|has_dpf:\s*yes|has_dpf:\s*da)\b/.test(combined);
  const noDpf = /\bhas_dpf:\s*no\b/.test(combined);

  if (beltEngine && /\b(chain|timing chain|lanac)\b/.test(text)) return false;
  if (chainEngine && /\b(timing belt|zupcasti remen|remen razvoda|remen)\b/.test(text)) return false;

  if (
    looksDiesel &&
    /\b(spark plug|ignition coil|coil pack|svjecica|svjećica|bobina|throttle body)\b/.test(text)
  ) {
    return false;
  }

  if (
    looksPetrol &&
    /\b(dpf|diesel particulate|common rail|high-pressure diesel pump|injector pump|adblue|glow plug|grijac|grijač)\b/.test(text)
  ) {
    return false;
  }

  if (noDpf && /\b(dpf regeneration|dpf restriction|dpf clog|regeneracija dpf|zacepljen dpf|začepljen dpf)\b/.test(text)) {
    return false;
  }

  if (!hasStartStop && noStartStop && /\bstart[\s-]?stop\b/.test(text)) {
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

function normalizeKey(value: unknown): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function vehicleKey(item: StoredScenario): string {
  return normalizeKey(item.vehicle);
}

function rootCauseKey(item: StoredScenario): string {
  return normalizeKey(item.root_cause_id || item.root_cause_label);
}

function categoryKey(item: StoredScenario): string {
  return normalizeKey(item.category);
}

function platformKey(item: StoredScenario): string {
  return normalizeKey(item.platform_type);
}

function complaintPatternKey(item: StoredScenario): string {
  const symptoms = Array.isArray(item.symptoms) ? item.symptoms.slice(0, 2).map(normalizeKey) : [];
  const driving = Array.isArray(item.driving) ? item.driving.slice(0, 1).map(normalizeKey) : [];
  const extra = Array.isArray(item.extra) ? item.extra.slice(0, 1).map(normalizeKey) : [];
  return normalizeKey([...symptoms, ...driving, ...extra].join(" "));
}

function familyKey(item: StoredScenario): string {
  const root = rootCauseKey(item);
  if (root) {
    const compact = root.replace(/\s+/g, "_");
    const parts = compact.split("_").filter(Boolean);
    return parts.slice(0, 2).join("_");
  }
  return categoryKey(item) || platformKey(item);
}

function titleShapeKey(item: StoredScenario): string {
  let title = normalizeKey(item.title);
  title = title.replace(/\b(vw|golf|bmw|audi|mercedes|ford|toyota|honda|hyundai|chevrolet|f10|f30|w204|520d|320d|tdi|cdi|crdi|ecoboost)\b/g, "");
  return title.replace(/\s+/g, " ").trim();
}

function usagePenalty(used: Set<string>, key: string, strong = 18, weak = 8) {
  if (!key) return 0;
  return used.has(key) ? strong : weak;
}

function scoreCandidate(
  item: StoredScenario,
  usedIds: Set<string>,
  usedVehicles: Set<string>,
  usedRootCauses: Set<string>,
  usedCategories: Set<string>,
  usedFamilies: Set<string>,
  usedComplaintShapes: Set<string>
) {
  if (!item?.id || usedIds.has(String(item.id))) return Number.NEGATIVE_INFINITY;

  const vKey = vehicleKey(item);
  const rKey = rootCauseKey(item);
  const cKey = categoryKey(item);
  const fKey = familyKey(item);
  const pKey = complaintPatternKey(item);
  const tKey = titleShapeKey(item);

  const timesUsed = Number(item.times_used || 0);
  const createdBonus = createdAtMs(item) / 1e12;

  let score = 100;
  score -= timesUsed * 5;
  score += createdBonus;

  score -= usagePenalty(usedVehicles, vKey, 22, 0);
  score -= usagePenalty(usedRootCauses, rKey, 28, 0);
  score -= usagePenalty(usedCategories, cKey, 16, 0);
  score -= usagePenalty(usedFamilies, fKey, 24, 0);
  score -= usagePenalty(usedComplaintShapes, pKey || tKey, 18, 0);

  if (!usedVehicles.has(vKey)) score += 7;
  if (!usedRootCauses.has(rKey)) score += 10;
  if (!usedFamilies.has(fKey)) score += 9;
  if (!usedCategories.has(cKey)) score += 5;
  if (!usedComplaintShapes.has(pKey || tKey)) score += 6;

  score += Math.random() * 1.25;

  return score;
}

function topScoredCandidates(
  pool: StoredScenario[],
  usedIds: Set<string>,
  usedVehicles: Set<string>,
  usedRootCauses: Set<string>,
  usedCategories: Set<string>,
  usedFamilies: Set<string>,
  usedComplaintShapes: Set<string>
): StoredScenario[] {
  const available = pool.filter((item) => item?.id && !usedIds.has(String(item.id)));
  if (!available.length) return [];

  const scored = available
    .map((item) => ({
      item,
      score: scoreCandidate(
        item,
        usedIds,
        usedVehicles,
        usedRootCauses,
        usedCategories,
        usedFamilies,
        usedComplaintShapes
      ),
    }))
    .filter((x) => Number.isFinite(x.score))
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return [];
  const topCount = Math.min(8, scored.length);
  return scored.slice(0, topCount).map((x) => x.item);
}

function addScenario(
  selected: StoredScenario[],
  picked: StoredScenario,
  usedIds: Set<string>,
  usedVehicles: Set<string>,
  usedRootCauses: Set<string>,
  usedCategories: Set<string>,
  usedFamilies: Set<string>,
  usedComplaintShapes: Set<string>
) {
  if (!picked?.id || usedIds.has(String(picked.id))) return false;

  selected.push(picked);
  usedIds.add(String(picked.id));
  usedVehicles.add(vehicleKey(picked));
  usedRootCauses.add(rootCauseKey(picked));
  usedCategories.add(categoryKey(picked));
  usedFamilies.add(familyKey(picked));
  usedComplaintShapes.add(complaintPatternKey(picked) || titleShapeKey(picked));
  return true;
}

function buildTestSet(allScenarios: StoredScenario[], count: number) {
  const selected: StoredScenario[] = [];
  const usedIds = new Set<string>();
  const usedVehicles = new Set<string>();
  const usedRootCauses = new Set<string>();
  const usedCategories = new Set<string>();
  const usedFamilies = new Set<string>();
  const usedComplaintShapes = new Set<string>();

  const distribution = buildTargetDistribution(count);
  const byDifficulty = {
    easy: allScenarios.filter((x) => x.difficulty === "easy"),
    medium: allScenarios.filter((x) => x.difficulty === "medium"),
    hard: allScenarios.filter((x) => x.difficulty === "hard"),
  };

  (["easy", "medium", "hard"] as const).forEach((difficulty) => {
    const target = distribution[difficulty];
    let tries = 0;

    while (selected.length < count && tries < target * 5) {
      const candidates = topScoredCandidates(
        byDifficulty[difficulty],
        usedIds,
        usedVehicles,
        usedRootCauses,
        usedCategories,
        usedFamilies,
        usedComplaintShapes
      );
      if (!candidates.length) break;

      const picked = pickRandom(candidates);
      addScenario(
        selected,
        picked,
        usedIds,
        usedVehicles,
        usedRootCauses,
        usedCategories,
        usedFamilies,
        usedComplaintShapes
      );
      tries += 1;

      const currentDifficultyCount = selected.filter((x) => x.difficulty === difficulty).length;
      if (currentDifficultyCount >= target) break;
    }
  });

  if (selected.length < count) {
    const remainingPool = allScenarios.filter((item) => item?.id && !usedIds.has(String(item.id)));

    while (selected.length < count) {
      const candidates = topScoredCandidates(
        remainingPool,
        usedIds,
        usedVehicles,
        usedRootCauses,
        usedCategories,
        usedFamilies,
        usedComplaintShapes
      );
      if (!candidates.length) break;

      const picked = pickRandom(candidates);
      if (
        !addScenario(
          selected,
          picked,
          usedIds,
          usedVehicles,
          usedRootCauses,
          usedCategories,
          usedFamilies,
          usedComplaintShapes
        )
      ) {
        break;
      }
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

    const allScenariosRaw = await getScenariosForMode(mode, 5000, locale);
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
      selected.map((x) => vehicleKey(x)).filter(Boolean)
    ).size;

    const uniqueRootCauses = new Set(
      selected.map((x) => rootCauseKey(x)).filter(Boolean)
    ).size;

    const uniqueFamilies = new Set(
      selected.map((x) => familyKey(x)).filter(Boolean)
    ).size;

    const uniqueCategories = new Set(
      selected.map((x) => categoryKey(x)).filter(Boolean)
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
        uniqueFamilies,
        uniqueCategories,
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
