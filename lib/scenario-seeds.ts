export type Difficulty = "easy" | "medium" | "hard";

export type ScenarioSeed = {
  brand: string;
  vehicle: string;
  platform_type: string;
  category: string;
  difficulty: Difficulty;
  root_cause_id: string;
  root_cause_label: string;
};

const SCENARIO_SEEDS: ScenarioSeed[] = [
    {
        brand: "BMW",
        vehicle: "BMW E90 320d",
        platform_type: "older_diesel_cr_turbo_no_dpf_chain",
        category: "Vacuum / Turbo control",
        difficulty: "easy",
        root_cause_id: "vacuum_hose_split",
        root_cause_label: "Napuklo vakum crijevo do aktuatora turbine",
      },
      {
        brand: "BMW",
        vehicle: "BMW E90 320d",
        platform_type: "older_diesel_cr_turbo_no_dpf_chain",
        category: "Sensors",
        difficulty: "easy",
        root_cause_id: "maf_underreporting",
        root_cause_label: "MAF senzor podočitava protok zraka",
      },
      {
        brand: "BMW",
        vehicle: "BMW F10 320d",
        platform_type: "modern_diesel_cr_turbo_dpf_chain",
        category: "Exhaust / DPF / EGR",
        difficulty: "medium",
        root_cause_id: "egr_stuck_open",
        root_cause_label: "EGR ventil zaglavljen otvoren",
      },
      {
        brand: "BMW",
        vehicle: "BMW F10 320xd",
        platform_type: "modern_diesel_cr_turbo_dpf_chain_xdrive",
        category: "Drivetrain",
        difficulty: "medium",
        root_cause_id: "inner_cv_joint_load_vibration",
        root_cause_label: "Unutrašnji homokinetički zglob pravi vibraciju pod opterećenjem",
      },
      {
        brand: "BMW",
        vehicle: "BMW F10 330d",
        platform_type: "modern_diesel_i6_cr_turbo_dpf_chain",
        category: "Air flow / Turbo / Intake",
        difficulty: "hard",
        root_cause_id: "boost_leak_charge_pipe_microcrack",
        root_cause_label: "Mikro-pukotina na charge pipe / boost leak",
      },
      {
        brand: "BMW",
        vehicle: "BMW F10 330xd",
        platform_type: "modern_diesel_i6_cr_turbo_dpf_chain_xdrive",
        category: "Exhaust / DPF / EGR",
        difficulty: "hard",
        root_cause_id: "dpf_partial_restriction",
        root_cause_label: "Djelomično začepljen DPF",
      },
      {
        brand: "BMW",
        vehicle: "BMW F10 320d",
        platform_type: "modern_diesel_cr_turbo_dpf_chain",
        category: "Exhaust / DPF / EGR",
        difficulty: "hard",
        root_cause_id: "dpf_partial_restriction",
        root_cause_label: "Djelomično začepljen DPF",
      },
      {
        brand: "BMW",
        vehicle: "BMW F10 320xd",
        platform_type: "modern_diesel_cr_turbo_dpf_chain_xdrive",
        category: "Vacuum / Turbo control",
        difficulty: "medium",
        root_cause_id: "vacuum_leak_turbo_control",
        root_cause_label: "Gubitak vakuma prema aktuatoru turbine",
      },
      {
        brand: "BMW",
        vehicle: "BMW F10 328i",
        platform_type: "modern_petrol_turbo_direct_chain",
        category: "Sensors",
        difficulty: "medium",
        root_cause_id: "camshaft_sensor_signal_drop",
        root_cause_label: "Senzor bregaste povremeno gubi signal",
      },
      {
        brand: "BMW",
        vehicle: "BMW F10 520i",
        platform_type: "modern_petrol_turbo_direct_chain",
        category: "Air flow / Turbo / Intake",
        difficulty: "medium",
        root_cause_id: "boost_leak_charge_pipe_microcrack",
        root_cause_label: "Mikro-pukotina na charge pipe / boost leak",
      },
      {
        brand: "BMW",
        vehicle: "BMW E90 320i",
        platform_type: "petrol_na_or_direct_injection_chain",
        category: "Sensors",
        difficulty: "easy",
        root_cause_id: "crankshaft_sensor_intermittent_hot",
        root_cause_label: "Senzor radilice prekida na vruće",
      },
      {
        brand: "BMW",
        vehicle: "BMW E90 325i",
        platform_type: "petrol_na_or_direct_injection_chain",
        category: "Fuel / Injection",
        difficulty: "medium",
        root_cause_id: "injector_leakoff_or_misdelivery",
        root_cause_label: "Jedna dizna/palilica pravi nepravilan rad pod opterećenjem",
      },
    
      // AUDI
      {
        brand: "Audi",
        vehicle: "Audi A4 B5 1.9 TDI",
        platform_type: "older_diesel_vp_turbo_manual",
        category: "Fuel / Supply",
        difficulty: "easy",
        root_cause_id: "air_in_fuel_line",
        root_cause_label: "Ulaz zraka u dovod goriva",
      },
      {
        brand: "Audi",
        vehicle: "Audi A4 B6 1.9 TDI",
        platform_type: "older_diesel_pd_turbo_manual",
        category: "Vacuum / Turbo control",
        difficulty: "easy",
        root_cause_id: "vacuum_hose_split",
        root_cause_label: "Napuklo vakum crijevo do turbine",
      },
      {
        brand: "Audi",
        vehicle: "Audi A4 B8 1.8 TFSI",
        platform_type: "modern_petrol_turbo_direct_chain",
        category: "Air flow / Turbo / Intake",
        difficulty: "medium",
        root_cause_id: "boost_leak_charge_pipe_microcrack",
        root_cause_label: "Mikro-pukotina na charge pipe / boost leak",
      },
      {
        brand: "Audi",
        vehicle: "Audi A4 B8 2.0 TFSI",
        platform_type: "modern_petrol_turbo_direct_chain",
        category: "Sensors",
        difficulty: "medium",
        root_cause_id: "maf_underreporting",
        root_cause_label: "MAF senzor podočitava protok zraka",
      },
      {
        brand: "Audi",
        vehicle: "Audi A4 B8 2.0 TDI",
        platform_type: "modern_diesel_cr_turbo_dpf_belt",
        category: "Fuel / Supply",
        difficulty: "easy",
        root_cause_id: "fuel_filter_restriction",
        root_cause_label: "Djelomično začepljen filter goriva",
      },
      {
        brand: "Audi",
        vehicle: "Audi A4 3.0 TDI",
        platform_type: "modern_diesel_v6_cr_turbo_chain",
        category: "Vacuum / Turbo control",
        difficulty: "medium",
        root_cause_id: "vacuum_leak_turbo_control",
        root_cause_label: "Gubitak vakuma prema aktuatoru turbine",
      },
      {
        brand: "Audi",
        vehicle: "Audi A5 1.8 TFSI",
        platform_type: "modern_petrol_turbo_direct_chain",
        category: "Sensors",
        difficulty: "medium",
        root_cause_id: "camshaft_sensor_signal_drop",
        root_cause_label: "Senzor bregaste povremeno gubi signal",
      },
      {
        brand: "Audi",
        vehicle: "Audi A5 2.0 TFSI",
        platform_type: "modern_petrol_turbo_direct_chain",
        category: "Air flow / Turbo / Intake",
        difficulty: "medium",
        root_cause_id: "boost_leak_charge_pipe_microcrack",
        root_cause_label: "Mikro-pukotina na charge pipe / boost leak",
      },
      {
        brand: "Audi",
        vehicle: "Audi A6 C5 2.5 TDI",
        platform_type: "older_diesel_v6_vp_turbo_manual",
        category: "Fuel / Injection",
        difficulty: "easy",
        root_cause_id: "injector_pump_timing_deviation",
        root_cause_label: "Poremećen timing / problem VP pumpe",
      },
      {
        brand: "Audi",
        vehicle: "Audi A6 4G 3.0 TDI",
        platform_type: "modern_diesel_v6_cr_turbo_chain",
        category: "Exhaust / DPF / EGR",
        difficulty: "hard",
        root_cause_id: "dpf_partial_restriction",
        root_cause_label: "Djelomično začepljen DPF",
      },
      {
        brand: "Audi",
        vehicle: "Audi A6 C7 3.0 TDI",
        platform_type: "modern_diesel_v6_cr_turbo_chain",
        category: "Drivetrain",
        difficulty: "medium",
        root_cause_id: "inner_cv_joint_load_vibration",
        root_cause_label: "Unutrašnji homokinetički zglob pravi vibraciju pod opterećenjem",
      },
    
      // VW
      {
        brand: "Volkswagen",
        vehicle: "VW Golf 4 1.9 TDI",
        platform_type: "older_diesel_vp_turbo_manual",
        category: "Sensors",
        difficulty: "easy",
        root_cause_id: "maf_underreporting",
        root_cause_label: "MAF senzor podočitava protok zraka",
      },
      {
        brand: "Volkswagen",
        vehicle: "VW Golf 5 1.9 TDI",
        platform_type: "older_diesel_pd_turbo_manual",
        category: "Vacuum / Turbo control",
        difficulty: "easy",
        root_cause_id: "vacuum_hose_split",
        root_cause_label: "Napuklo vakum crijevo do turbine",
      },
      {
        brand: "Volkswagen",
        vehicle: "VW Golf 6 1.6 TDI",
        platform_type: "modern_diesel_cr_turbo_dpf_belt",
        category: "Fuel / Supply",
        difficulty: "easy",
        root_cause_id: "fuel_filter_restriction",
        root_cause_label: "Djelomično začepljen filter goriva",
      },
      {
        brand: "Volkswagen",
        vehicle: "VW Golf 6 2.0 TDI",
        platform_type: "modern_diesel_cr_turbo_dpf_belt",
        category: "Air flow / Sensors",
        difficulty: "medium",
        root_cause_id: "maf_underreporting",
        root_cause_label: "MAF senzor podočitava protok zraka",
      },
      {
        brand: "Volkswagen",
        vehicle: "VW Golf 7 1.6 TDI",
        platform_type: "modern_diesel_cr_turbo_dpf_belt",
        category: "Exhaust / EGR",
        difficulty: "medium",
        root_cause_id: "egr_stuck_open",
        root_cause_label: "EGR ventil zaglavljen otvoren",
      },
      {
        brand: "Volkswagen",
        vehicle: "VW Golf 7 2.0 TDI",
        platform_type: "modern_diesel_cr_turbo_dpf_belt",
        category: "Exhaust / DPF / EGR",
        difficulty: "hard",
        root_cause_id: "dpf_diff_pressure_sensor_offset",
        root_cause_label: "Senzor diferencijalnog pritiska DPF-a daje offset",
      },
      {
        brand: "Volkswagen",
        vehicle: "VW Passat B7 2.0 TDI",
        platform_type: "modern_diesel_cr_turbo_dpf_belt",
        category: "Air flow / Sensors",
        difficulty: "medium",
        root_cause_id: "maf_underreporting",
        root_cause_label: "MAF senzor podočitava protok zraka",
      },
      {
        brand: "Volkswagen",
        vehicle: "VW Sharan 1.6 TDI",
        platform_type: "modern_diesel_cr_turbo_dpf_belt",
        category: "Fuel / Supply",
        difficulty: "easy",
        root_cause_id: "air_in_fuel_line",
        root_cause_label: "Ulaz zraka u dovod goriva",
      },
      {
        brand: "Volkswagen",
        vehicle: "VW Sharan 2.0 TDI",
        platform_type: "modern_diesel_cr_turbo_dpf_belt",
        category: "Exhaust / DPF / EGR",
        difficulty: "medium",
        root_cause_id: "egr_stuck_open",
        root_cause_label: "EGR ventil zaglavljen otvoren",
      },
    
      // SEAT
      {
        brand: "SEAT",
        vehicle: "SEAT Alhambra 1.6 TDI",
        platform_type: "modern_diesel_cr_turbo_dpf_belt",
        category: "Fuel / Supply",
        difficulty: "easy",
        root_cause_id: "fuel_filter_restriction",
        root_cause_label: "Djelomično začepljen filter goriva",
      },
      {
        brand: "SEAT",
        vehicle: "SEAT Alhambra 2.0 TDI",
        platform_type: "modern_diesel_cr_turbo_dpf_belt",
        category: "Air flow / Turbo / Intake",
        difficulty: "medium",
        root_cause_id: "intercooler_hose_split_under_boost",
        root_cause_label: "Crijevo interkulera puca pod boostom",
      },
    
      // MERCEDES
      {
        brand: "Mercedes",
        vehicle: "Mercedes W212 E200 CDI",
        platform_type: "modern_diesel_cr_turbo_chain",
        category: "Fuel / Injection",
        difficulty: "medium",
        root_cause_id: "injector_leakoff_excessive",
        root_cause_label: "Prevelik leak-off na jednoj dizni",
      },
      {
        brand: "Mercedes",
        vehicle: "Mercedes W212 E220 CDI",
        platform_type: "modern_diesel_cr_turbo_dpf_chain",
        category: "Fuel / Injection",
        difficulty: "medium",
        root_cause_id: "injector_leakoff_excessive",
        root_cause_label: "Prevelik leak-off na jednoj dizni",
      },
      {
        brand: "Mercedes",
        vehicle: "Mercedes W212 E350 CDI",
        platform_type: "modern_diesel_v6_cr_turbo_chain",
        category: "Exhaust / DPF / EGR",
        difficulty: "hard",
        root_cause_id: "dpf_partial_restriction",
        root_cause_label: "Djelomično začepljen DPF",
      },
      {
        brand: "Mercedes",
        vehicle: "Mercedes Sprinter 316 CDI",
        platform_type: "modern_diesel_cr_turbo_dpf_chain",
        category: "Cooling",
        difficulty: "medium",
        root_cause_id: "thermostat_stuck_open",
        root_cause_label: "Termostat zaglavljen otvoren",
      },
    
      // OPEL / FORD / PEUGEOT / RENAULT / TOYOTA / SKODA
      {
        brand: "Opel",
        vehicle: "Opel Insignia 2.0 CDTI",
        platform_type: "modern_diesel_cr_turbo_dpf_belt",
        category: "Sensors",
        difficulty: "easy",
        root_cause_id: "crankshaft_sensor_intermittent_hot",
        root_cause_label: "Senzor radilice prekida na vruće",
      },
      {
        brand: "Ford",
        vehicle: "Ford Mondeo 2.0 TDCi",
        platform_type: "modern_diesel_cr_turbo_dpf_belt",
        category: "Fuel / Supply",
        difficulty: "easy",
        root_cause_id: "air_in_fuel_line",
        root_cause_label: "Ulaz zraka u dovod goriva",
      },
      {
        brand: "Peugeot",
        vehicle: "Peugeot 508 2.0 HDi",
        platform_type: "modern_diesel_cr_turbo_dpf_belt",
        category: "Exhaust / EGR",
        difficulty: "medium",
        root_cause_id: "egr_stuck_open",
        root_cause_label: "EGR ventil zaglavljen otvoren",
      },
      {
        brand: "Renault",
        vehicle: "Renault Megane 1.5 dCi",
        platform_type: "modern_diesel_cr_turbo_dpf_belt",
        category: "Fuel / Supply",
        difficulty: "easy",
        root_cause_id: "fuel_filter_restriction",
        root_cause_label: "Djelomično začepljen filter goriva",
      },
      {
        brand: "Toyota",
        vehicle: "Toyota Corolla 1.4 D-4D",
        platform_type: "modern_diesel_cr_turbo_dpf_chain",
        category: "Air flow / Turbo / Intake",
        difficulty: "medium",
        root_cause_id: "intercooler_hose_split_under_boost",
        root_cause_label: "Crijevo interkulera puca pod boostom",
      },
      {
        brand: "Skoda",
        vehicle: "Skoda Octavia 2.0 TDI",
        platform_type: "modern_diesel_cr_turbo_dpf_belt",
        category: "Exhaust / DPF / EGR",
        difficulty: "hard",
        root_cause_id: "dpf_diff_pressure_sensor_offset",
        root_cause_label: "Senzor diferencijalnog pritiska DPF-a daje offset",
      },

     
];

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export function getRandomScenarioSeed(): ScenarioSeed {
  return SCENARIO_SEEDS[randomInt(SCENARIO_SEEDS.length)];
}

export function getRandomScenarioSeeds(count: number): ScenarioSeed[] {
  const copy = [...SCENARIO_SEEDS];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  if (count <= copy.length) {
    return copy.slice(0, count);
  }

  const out = [...copy];
  while (out.length < count) {
    out.push(SCENARIO_SEEDS[randomInt(SCENARIO_SEEDS.length)]);
  }

  return out;
}