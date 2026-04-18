type Difficulty = "easy" | "medium" | "hard";

export type ScenarioSeed = {
  brand: string;
  vehicle: string;
  platform_type: string;
  category: string;
  root_cause_id: string;
  root_cause_label: string;
  difficulty: Difficulty;
  context: {
    temperature: string;
    load: string;
    behavior: string;
    timeline: string;
  };
};

const TEMPERATURE_CONDITIONS = [
  "cold start",
  "fully warmed engine",
  "after a long drive",
  "in low ambient temperature",
  "in high ambient temperature",
];

const LOAD_CONDITIONS = [
  "at idle",
  "under light acceleration",
  "under medium load",
  "under heavy load",
  "while driving uphill",
  "during stop-and-go driving",
  "during steady highway cruising",
];

const BEHAVIOR_PATTERNS = [
  "constant issue",
  "intermittent issue",
  "appears randomly",
  "only happens after some time",
  "only happens after the engine warms up",
];

const FAILURE_TIMELINES = [
  "started suddenly",
  "started after recent repair",
  "started after refueling",
  "gradually became worse",
  "appeared after several days of normal driving",
];

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function buildContext() {
  return {
    temperature: pickOne(TEMPERATURE_CONDITIONS),
    load: pickOne(LOAD_CONDITIONS),
    behavior: pickOne(BEHAVIOR_PATTERNS),
    timeline: pickOne(FAILURE_TIMELINES),
  };
}

type RootCauseTemplate = {
  brand: string;
  vehicle: string;
  platform_type: string;
  category: string;
  root_cause_id: string;
  root_cause_label: string;
  difficulty: Difficulty;
};

const ROOT_CAUSE_POOL: RootCauseTemplate[] = [
  {
    brand: "BMW",
    vehicle: "BMW F10 330d",
    platform_type: "modern_diesel_i6_cr_turbo_dpf_chain",
    category: "Air flow / Turbo / Intake",
    root_cause_id: "boost_leak_charge_pipe_microcrack",
    root_cause_label: "Mikro-pukotina na charge pipe / boost leak",
    difficulty: "hard",
  },
  {
    brand: "BMW",
    vehicle: "BMW F10 320d",
    platform_type: "modern_diesel_cr_turbo_dpf_chain",
    category: "Exhaust / DPF / EGR",
    root_cause_id: "dpf_partial_restriction",
    root_cause_label: "Djelomično začepljen DPF",
    difficulty: "hard",
  },
  {
    brand: "Audi",
    vehicle: "Audi A5 1.8 TFSI",
    platform_type: "modern_petrol_turbo_direct_chain",
    category: "Sensors",
    root_cause_id: "camshaft_sensor_signal_drop",
    root_cause_label: "Senzor bregaste povremeno gubi signal",
    difficulty: "medium",
  },
  {
    brand: "Audi",
    vehicle: "Audi A4 B8 1.8 TFSI",
    platform_type: "modern_petrol_turbo_direct_chain",
    category: "Air flow / Turbo / Intake",
    root_cause_id: "boost_leak_charge_pipe_microcrack",
    root_cause_label: "Mikro-pukotina na charge pipe / boost leak",
    difficulty: "medium",
  },
  {
    brand: "Volkswagen",
    vehicle: "VW Sharan 1.6 TDI",
    platform_type: "modern_diesel_cr_turbo_dpf_belt",
    category: "Fuel / Supply",
    root_cause_id: "air_in_fuel_line",
    root_cause_label: "Ulaz zraka u dovod goriva",
    difficulty: "easy",
  },
  {
    brand: "Volkswagen",
    vehicle: "VW Golf 6 1.6 TDI",
    platform_type: "modern_diesel_cr_turbo_dpf_belt",
    category: "Fuel / Supply",
    root_cause_id: "fuel_filter_restriction",
    root_cause_label: "Djelomično začepljen filter goriva",
    difficulty: "easy",
  },
  {
    brand: "Volkswagen",
    vehicle: "VW Golf 7 1.6 TDI",
    platform_type: "modern_diesel_cr_turbo_dpf_belt",
    category: "Exhaust / EGR",
    root_cause_id: "egr_stuck_open",
    root_cause_label: "EGR ventil zaglavljen otvoren",
    difficulty: "medium",
  },
  {
    brand: "Skoda",
    vehicle: "Skoda Octavia 2.0 TDI",
    platform_type: "modern_diesel_cr_turbo_dpf_belt",
    category: "Exhaust / DPF / EGR",
    root_cause_id: "dpf_diff_pressure_sensor_offset",
    root_cause_label: "Senzor diferencijalnog pritiska DPF-a daje offset",
    difficulty: "hard",
  },
  {
    brand: "SEAT",
    vehicle: "SEAT Alhambra 2.0 TDI",
    platform_type: "modern_diesel_cr_turbo_dpf_belt",
    category: "Air flow / Turbo / Intake",
    root_cause_id: "intercooler_hose_split_under_boost",
    root_cause_label: "Crijevo interkulera puca pod boostom",
    difficulty: "medium",
  },
  {
    brand: "Mercedes",
    vehicle: "Mercedes W212 E220 CDI",
    platform_type: "modern_diesel_cr_turbo_dpf_chain",
    category: "Fuel / Injection",
    root_cause_id: "injector_leakoff_excessive",
    root_cause_label: "Prevelik leak-off na jednoj dizni",
    difficulty: "medium",
  },
  {
    brand: "Mercedes",
    vehicle: "Mercedes Sprinter 316 CDI",
    platform_type: "modern_diesel_cr_turbo_dpf_chain",
    category: "Cooling",
    root_cause_id: "thermostat_stuck_open",
    root_cause_label: "Termostat zaglavljen otvoren",
    difficulty: "medium",
  },
  {
    brand: "Opel",
    vehicle: "Opel Insignia 2.0 CDTI",
    platform_type: "modern_diesel_cr_turbo_dpf_belt",
    category: "Sensors",
    root_cause_id: "crankshaft_sensor_intermittent_hot",
    root_cause_label: "Senzor radilice prekida na vruće",
    difficulty: "easy",
  },
];

const rootCauseUsage: Record<string, number> = {};

function getBalancedPool(): RootCauseTemplate[] {
  return [...ROOT_CAUSE_POOL].sort((a, b) => {
    const aCount = rootCauseUsage[a.root_cause_id] || 0;
    const bCount = rootCauseUsage[b.root_cause_id] || 0;
    if (aCount !== bCount) return aCount - bCount;
    return 0;
  });
}

function pickBalancedScenarioTemplate(): RootCauseTemplate {
  const sorted = getBalancedPool();
  const leastUsedCount = rootCauseUsage[sorted[0].root_cause_id] || 0;
  const leastUsed = sorted.filter(
    (item) => (rootCauseUsage[item.root_cause_id] || 0) === leastUsedCount
  );

  const chosen = pickOne(leastUsed);
  rootCauseUsage[chosen.root_cause_id] =
    (rootCauseUsage[chosen.root_cause_id] || 0) + 1;

  return chosen;
}

export function getRandomScenarioSeed(): ScenarioSeed {
  const base = pickBalancedScenarioTemplate();

  return {
    ...base,
    context: buildContext(),
  };
}

export function getRandomScenarioSeeds(count: number): ScenarioSeed[] {
  const safeCount = Math.max(1, Math.min(100, Number(count) || 1));
  return Array.from({ length: safeCount }, () => getRandomScenarioSeed());
}