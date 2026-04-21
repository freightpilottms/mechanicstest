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
  "after overnight parking",
  "after a short stop with warm engine",
  "during repeated short trips",
];

const LOAD_CONDITIONS = [
  "at idle",
  "under light acceleration",
  "under medium load",
  "under heavy load",
  "while driving uphill",
  "during stop-and-go driving",
  "during steady highway cruising",
  "during overtaking",
  "while decelerating",
  "while coasting",
  "while cornering under light throttle",
  "while braking",
];

const BEHAVIOR_PATTERNS = [
  "constant issue",
  "intermittent issue",
  "appears randomly",
  "only happens after some time",
  "only happens after the engine warms up",
  "only appears under load",
  "only appears at low speed",
  "only appears at higher speed",
  "gets worse in turns",
  "gets worse when steering is fully turned",
  "gets worse after repeated stops",
];

const FAILURE_TIMELINES = [
  "started suddenly",
  "started after recent repair",
  "started after refueling",
  "gradually became worse",
  "appeared after several days of normal driving",
  "started after hitting a pothole",
  "started after longer highway driving",
  "started after coolant loss was noticed",
  "started after battery was weak for several days",
  "became more noticeable over the last few weeks",
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
  // =========================
  // BMW
  // =========================
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
    brand: "BMW",
    vehicle: "BMW E90 320d",
    platform_type: "modern_diesel_cr_turbo_dpf_chain",
    category: "Cooling / Internal engine",
    root_cause_id: "head_gasket_combustion_leak",
    root_cause_label: "Dihtung glave probija kompresiju u rashladni sistem",
    difficulty: "hard",
  },
  {
    brand: "BMW",
    vehicle: "BMW E90 320d",
    platform_type: "modern_diesel_cr_turbo_dpf_chain",
    category: "Cooling",
    root_cause_id: "water_pump_flow_reduced",
    root_cause_label: "Vodena pumpa ima oslabljen protok",
    difficulty: "medium",
  },
  {
    brand: "BMW",
    vehicle: "BMW F30 320d",
    platform_type: "modern_diesel_cr_turbo_dpf_chain",
    category: "Drivetrain / Chassis",
    root_cause_id: "wheel_bearing_front_hub_worn",
    root_cause_label: "Prednji ležaj točka istrošen",
    difficulty: "easy",
  },
  {
    brand: "BMW",
    vehicle: "BMW E87 120d",
    platform_type: "modern_diesel_cr_turbo_dpf_chain",
    category: "Drivetrain / Chassis",
    root_cause_id: "outer_cv_joint_clicking",
    root_cause_label: "Vanjski kinetički zglob istrošen",
    difficulty: "easy",
  },
  {
    brand: "BMW",
    vehicle: "BMW E60 520d",
    platform_type: "modern_diesel_cr_turbo_dpf_chain",
    category: "Mounts / Vibration",
    root_cause_id: "engine_mount_collapsed",
    root_cause_label: "Nosač motora oslabljen / sjeo",
    difficulty: "medium",
  },
  {
    brand: "BMW",
    vehicle: "BMW E90 320i",
    platform_type: "modern_petrol_direct_chain",
    category: "Mounts / Vibration",
    root_cause_id: "gearbox_mount_softened",
    root_cause_label: "Nosač mjenjača oslabljen",
    difficulty: "medium",
  },

  // =========================
  // Audi
  // =========================
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
    brand: "Audi",
    vehicle: "Audi A4 B8 2.0 TDI",
    platform_type: "modern_diesel_cr_turbo_dpf_belt",
    category: "Cooling / Internal engine",
    root_cause_id: "head_gasket_coolant_into_cylinder",
    root_cause_label: "Dihtung glave pušta rashladnu tečnost u cilindar",
    difficulty: "hard",
  },
  {
    brand: "Audi",
    vehicle: "Audi A6 4G 3.0 TDI",
    platform_type: "modern_diesel_v6_cr_turbo_dpf_chain",
    category: "Cooling",
    root_cause_id: "thermostat_stuck_partially_open",
    root_cause_label: "Termostat zaglavljen djelimično otvoren",
    difficulty: "medium",
  },
  {
    brand: "Audi",
    vehicle: "Audi A3 8P 2.0 TDI",
    platform_type: "modern_diesel_cr_turbo_dpf_belt",
    category: "Brakes / Chassis",
    root_cause_id: "front_brake_caliper_sticking",
    root_cause_label: "Prednja kočiona kliješta povremeno zapinju",
    difficulty: "medium",
  },
  {
    brand: "Audi",
    vehicle: "Audi A3 8V 1.6 TDI",
    platform_type: "modern_diesel_cr_turbo_dpf_belt",
    category: "Suspension / Chassis",
    root_cause_id: "stabilizer_link_worn",
    root_cause_label: "Štangice stabilizatora istrošene",
    difficulty: "easy",
  },

  // =========================
  // Volkswagen
  // =========================
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
    brand: "Volkswagen",
    vehicle: "VW Passat B7 2.0 TDI",
    platform_type: "modern_diesel_cr_turbo_dpf_belt",
    category: "Cooling / Internal engine",
    root_cause_id: "head_gasket_pressurizing_cooling_system",
    root_cause_label: "Dihtung glave pravi pritisak u rashladnom sistemu",
    difficulty: "hard",
  },
  {
    brand: "Volkswagen",
    vehicle: "VW Golf 5 1.9 TDI",
    platform_type: "modern_diesel_pumpe_dyse_turbo_belt",
    category: "Electrical / Starting",
    root_cause_id: "starter_solenoid_intermittent",
    root_cause_label: "Anlaser povremeno ne reaguje zbog solenoida",
    difficulty: "easy",
  },
  {
    brand: "Volkswagen",
    vehicle: "VW Golf 6 2.0 TDI",
    platform_type: "modern_diesel_cr_turbo_dpf_belt",
    category: "Drivetrain / Chassis",
    root_cause_id: "front_wheel_bearing_humming",
    root_cause_label: "Prednji ležaj točka huči zbog istrošenosti",
    difficulty: "easy",
  },
  {
    brand: "Volkswagen",
    vehicle: "VW Touran 1.9 TDI",
    platform_type: "modern_diesel_pumpe_dyse_turbo_belt",
    category: "Drivetrain / Chassis",
    root_cause_id: "outer_cv_joint_clicking",
    root_cause_label: "Vanjski kinetički zglob istrošen",
    difficulty: "easy",
  },
  {
    brand: "Volkswagen",
    vehicle: "VW Passat B6 2.0 TDI",
    platform_type: "modern_diesel_cr_turbo_dpf_belt",
    category: "Mounts / Vibration",
    root_cause_id: "engine_mount_hydraulic_failure",
    root_cause_label: "Hidraulični nosač motora oslabio",
    difficulty: "medium",
  },
  {
    brand: "Volkswagen",
    vehicle: "VW Golf 7 1.4 TSI",
    platform_type: "modern_petrol_turbo_direct_belt",
    category: "Cooling",
    root_cause_id: "thermostat_housing_internal_fault",
    root_cause_label: "Kućište termostata ima unutrašnji kvar",
    difficulty: "medium",
  },

  // =========================
  // Skoda
  // =========================
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
    brand: "Skoda",
    vehicle: "Skoda Octavia 1.9 TDI",
    platform_type: "modern_diesel_pumpe_dyse_turbo_belt",
    category: "Suspension / Chassis",
    root_cause_id: "control_arm_bushing_worn",
    root_cause_label: "Selene vilice istrošene",
    difficulty: "medium",
  },
  {
    brand: "Skoda",
    vehicle: "Skoda Superb 2.0 TDI",
    platform_type: "modern_diesel_cr_turbo_dpf_belt",
    category: "Brakes / Chassis",
    root_cause_id: "rear_brake_caliper_dragging",
    root_cause_label: "Zadnja kočiona kliješta blago koče",
    difficulty: "medium",
  },

  // =========================
  // SEAT
  // =========================
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
    brand: "SEAT",
    vehicle: "SEAT Leon 1.6 TDI",
    platform_type: "modern_diesel_cr_turbo_dpf_belt",
    category: "Electrical / Charging",
    root_cause_id: "alternator_output_intermittent",
    root_cause_label: "Alternator povremeno ne puni pravilno",
    difficulty: "medium",
  },

  // =========================
  // Mercedes
  // =========================
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
    brand: "Mercedes",
    vehicle: "Mercedes W204 C220 CDI",
    platform_type: "modern_diesel_cr_turbo_dpf_chain",
    category: "Drivetrain / Chassis",
    root_cause_id: "front_wheel_bearing_humming",
    root_cause_label: "Ležaj prednjeg točka proizvodi hučanje",
    difficulty: "easy",
  },
  {
    brand: "Mercedes",
    vehicle: "Mercedes W204 C200 CDI",
    platform_type: "modern_diesel_cr_turbo_dpf_chain",
    category: "Mounts / Vibration",
    root_cause_id: "transmission_mount_softened",
    root_cause_label: "Nosač mjenjača oslabljen",
    difficulty: "medium",
  },

  // =========================
  // Opel
  // =========================
  {
    brand: "Opel",
    vehicle: "Opel Insignia 2.0 CDTI",
    platform_type: "modern_diesel_cr_turbo_dpf_belt",
    category: "Sensors",
    root_cause_id: "crankshaft_sensor_intermittent_hot",
    root_cause_label: "Senzor radilice prekida na vruće",
    difficulty: "easy",
  },
  {
    brand: "Opel",
    vehicle: "Opel Astra J 1.7 CDTI",
    platform_type: "modern_diesel_cr_turbo_dpf_belt",
    category: "Electrical / Ground",
    root_cause_id: "engine_ground_high_resistance",
    root_cause_label: "Kontakt mase motora ima povećan otpor",
    difficulty: "medium",
  },
  {
    brand: "Opel",
    vehicle: "Opel Astra H 1.9 CDTI",
    platform_type: "modern_diesel_cr_turbo_dpf_belt",
    category: "Suspension / Chassis",
    root_cause_id: "stabilizer_link_worn",
    root_cause_label: "Štangice stabilizatora istrošene",
    difficulty: "easy",
  },

  // =========================
  // Ford
  // =========================
  {
    brand: "Ford",
    vehicle: "Ford Mondeo 2.0 TDCi",
    platform_type: "modern_diesel_cr_turbo_dpf_belt",
    category: "Fuel / Supply",
    root_cause_id: "fuel_pressure_regulator_lazy",
    root_cause_label: "Regulator pritiska goriva reaguje usporeno",
    difficulty: "medium",
  },
  {
    brand: "Ford",
    vehicle: "Ford Focus 1.6 TDCi",
    platform_type: "modern_diesel_cr_turbo_dpf_belt",
    category: "Cooling / Internal engine",
    root_cause_id: "head_gasket_minor_coolant_entry",
    root_cause_label: "Dihtung glave povremeno pušta rashladnu tečnost u cilindar",
    difficulty: "hard",
  },
  {
    brand: "Ford",
    vehicle: "Ford Focus 1.8 TDCi",
    platform_type: "modern_diesel_cr_turbo_belt",
    category: "Drivetrain / Chassis",
    root_cause_id: "outer_cv_joint_clicking",
    root_cause_label: "Vanjski kinetički zglob proizvodi kliktanje pri motanju",
    difficulty: "easy",
  },

  // =========================
  // Peugeot / Citroen
  // =========================
  {
    brand: "Peugeot",
    vehicle: "Peugeot 308 1.6 HDi",
    platform_type: "modern_diesel_cr_turbo_dpf_belt",
    category: "Air flow / Turbo / Intake",
    root_cause_id: "vacuum_control_leak_turbo",
    root_cause_label: "Vakum curi na kontroli turbine",
    difficulty: "medium",
  },
  {
    brand: "Citroen",
    vehicle: "Citroen C5 2.0 HDi",
    platform_type: "modern_diesel_cr_turbo_dpf_belt",
    category: "Brakes / Chassis",
    root_cause_id: "rear_brake_caliper_dragging",
    root_cause_label: "Zadnja kočiona kliješta blago koče",
    difficulty: "medium",
  },

  // =========================
  // Renault
  // =========================
  {
    brand: "Renault",
    vehicle: "Renault Megane 1.5 dCi",
    platform_type: "modern_diesel_cr_turbo_dpf_belt",
    category: "Electrical / Starting",
    root_cause_id: "starter_solenoid_intermittent",
    root_cause_label: "Solenoid anlasera povremeno ne reaguje",
    difficulty: "easy",
  },
  {
    brand: "Renault",
    vehicle: "Renault Laguna 2.0 dCi",
    platform_type: "modern_diesel_cr_turbo_dpf_chain",
    category: "Mounts / Vibration",
    root_cause_id: "engine_mount_collapsed",
    root_cause_label: "Nosač motora oslabljen / sjeo",
    difficulty: "medium",
  },

  // =========================
  // Toyota
  // =========================
  {
    brand: "Toyota",
    vehicle: "Toyota Avensis 2.0 D-4D",
    platform_type: "modern_diesel_cr_turbo_dpf_chain",
    category: "Cooling / Internal engine",
    root_cause_id: "head_gasket_pressurizing_cooling_system",
    root_cause_label: "Dihtung glave stvara pritisak u rashladnom sistemu",
    difficulty: "hard",
  },
  {
    brand: "Toyota",
    vehicle: "Toyota Corolla 1.6 бензin",
    platform_type: "modern_petrol_port_injection_chain",
    category: "Drivetrain / Chassis",
    root_cause_id: "front_wheel_bearing_humming",
    root_cause_label: "Ležaj prednjeg točka proizvodi hučanje",
    difficulty: "easy",
  },

  // =========================
  // Honda
  // =========================
  {
    brand: "Honda",
    vehicle: "Honda Civic 2.2 i-CTDi",
    platform_type: "modern_diesel_cr_turbo_chain",
    category: "Fuel / Supply",
    root_cause_id: "fuel_filter_restriction",
    root_cause_label: "Filter goriva djelimično ograničava protok",
    difficulty: "easy",
  },
  {
    brand: "Honda",
    vehicle: "Honda Accord 2.0 benzin",
    platform_type: "modern_petrol_port_injection_chain",
    category: "Mounts / Vibration",
    root_cause_id: "engine_mount_hydraulic_failure",
    root_cause_label: "Hidraulični nosač motora oslabljen",
    difficulty: "medium",
  },

  // =========================
  // Hyundai / Kia
  // =========================
  {
    brand: "Hyundai",
    vehicle: "Hyundai i30 1.6 CRDi",
    platform_type: "modern_diesel_cr_turbo_dpf_chain",
    category: "Electrical / Charging",
    root_cause_id: "alternator_output_intermittent",
    root_cause_label: "Alternator povremeno ne puni pravilno",
    difficulty: "medium",
  },
  {
    brand: "Kia",
    vehicle: "Kia Ceed 1.6 CRDi",
    platform_type: "modern_diesel_cr_turbo_dpf_chain",
    category: "Suspension / Chassis",
    root_cause_id: "control_arm_bushing_worn",
    root_cause_label: "Selene vilice istrošene",
    difficulty: "medium",
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