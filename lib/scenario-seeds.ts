type Difficulty = "easy" | "medium" | "hard";

export type ScenarioSeed = {
  brand: string;
  vehicle: string;
  category: string;
  rootCauseId: string;
  rootCauseLabel: string;
  difficulty: Difficulty;

  // 🔥 NEW
  context: {
    temperature: string;
    load: string;
    behavior: string;
    timeline: string;
  };
};

// --------------------------------------------------
// 🔥 CONTEXT RANDOMIZER
// --------------------------------------------------

const TEMPERATURE = [
  "cold start",
  "fully warmed engine",
  "after long drive",
  "low ambient temperature",
  "high ambient temperature",
];

const LOAD = [
  "at idle",
  "under acceleration",
  "under heavy load",
  "while cruising",
  "when going uphill",
];

const BEHAVIOR = [
  "constant issue",
  "intermittent issue",
  "only happens after some time",
  "appears randomly",
];

const TIMELINE = [
  "started suddenly",
  "started after recent repair",
  "started after refueling",
  "gradually became worse",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildContext() {
  return {
    temperature: pick(TEMPERATURE),
    load: pick(LOAD),
    behavior: pick(BEHAVIOR),
    timeline: pick(TIMELINE),
  };
}

// --------------------------------------------------
// 🔥 ROOT CAUSE POOLS (balanced groups)
// --------------------------------------------------

const ROOT_CAUSES = [
  // Fuel
  { id: "fuel_pressure_low", label: "Low fuel pressure", category: "fuel" },
  { id: "injector_leak", label: "Injector leak", category: "fuel" },

  // Air / intake
  { id: "vacuum_leak", label: "Vacuum leak", category: "air" },
  { id: "maf_sensor_fault", label: "MAF sensor fault", category: "air" },

  // Turbo
  { id: "turbo_actuator", label: "Turbo actuator issue", category: "turbo" },
  { id: "boost_leak", label: "Boost leak", category: "turbo" },

  // Sensors
  { id: "crank_sensor", label: "Crankshaft sensor fault", category: "sensor" },
  { id: "cam_sensor", label: "Camshaft sensor fault", category: "sensor" },

  // Exhaust
  { id: "egr_stuck", label: "EGR stuck", category: "exhaust" },
];

// --------------------------------------------------
// 🔥 SIMPLE BALANCING (prevents repetition)
// --------------------------------------------------

const usageCounter: Record<string, number> = {};

function pickBalancedRootCause() {
  const sorted = [...ROOT_CAUSES].sort((a, b) => {
    return (usageCounter[a.id] || 0) - (usageCounter[b.id] || 0);
  });

  const chosen = sorted[0];

  usageCounter[chosen.id] = (usageCounter[chosen.id] || 0) + 1;

  return chosen;
}

// --------------------------------------------------
// 🔥 MAIN GENERATOR
// --------------------------------------------------

const BRANDS = ["BMW", "Audi", "VW", "Mercedes"];
const VEHICLES = ["2.0 TDI", "3.0 TDI", "2.0d", "2.0 TFSI"];
const DIFFICULTY: Difficulty[] = ["easy", "medium", "hard"];

export function getRandomScenarioSeed(): ScenarioSeed {
  const root = pickBalancedRootCause();

  return {
    brand: pick(BRANDS),
    vehicle: pick(VEHICLES),
    category: root.category,
    rootCauseId: root.id,
    rootCauseLabel: root.label,
    difficulty: pick(DIFFICULTY),

    // 🔥 NEW CONTEXT
    context: buildContext(),
  };
}