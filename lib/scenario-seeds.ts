type Difficulty = "easy" | "medium" | "hard";

type VehicleTechMeta = {
  year?: number;
  power_kw?: number;
  fuel_type?: "diesel" | "petrol";
  induction?: "turbo" | "na";
  timing_type?: "belt" | "chain";
  has_start_stop?: boolean;
  has_dpf?: boolean;
  emission_standard?: string;
  engine_code?: string;
};

type ScenarioContext = {
  temperature: string;
  load: string;
  behavior: string;
  timeline: string;
};

export type ScenarioSeed = {
  brand: string;
  vehicle: string;
  platform_type: string;
  category: string;
  root_cause_id: string;
  root_cause_label: string;
  difficulty: Difficulty;
  year?: number;
  power_kw?: number;
  fuel_type?: "diesel" | "petrol";
  induction?: "turbo" | "na";
  timing_type?: "belt" | "chain";
  has_start_stop?: boolean;
  has_dpf?: boolean;
  emission_standard?: string;
  engine_code?: string;
  context: ScenarioContext;
};

const CONTEXT_BANKS: Record<string, ScenarioContext[]> = {
  wheel_bearing: [
    {
      temperature: "after a normal drive with the suspension at operating temperature",
      load: "between 50 and 100 km/h on a steady road",
      behavior: "humming rises with road speed and changes when the car is lightly steered left or right",
      timeline: "became more noticeable over the last few weeks",
    },
    {
      temperature: "regardless of engine temperature",
      load: "during steady cruising and light lane changes",
      behavior: "noise follows wheel speed, not engine rpm",
      timeline: "started after a pothole hit and slowly got louder",
    },
  ],
  cv_joint: [
    {
      temperature: "regardless of engine temperature",
      load: "while turning with light throttle in a parking lot",
      behavior: "clicking is strongest with the steering close to full lock",
      timeline: "started after the outer boot had been torn and grease was found around the wheel",
    },
    {
      temperature: "after a short city drive",
      load: "when pulling away while the steering is turned",
      behavior: "clicking disappears when driving straight",
      timeline: "gradually became worse over several days of tight turns",
    },
  ],
  suspension_bushing: [
    {
      temperature: "regardless of engine temperature",
      load: "over small bumps, speed bumps and uneven city roads",
      behavior: "knock is felt through the floor and sometimes through the steering wheel",
      timeline: "started after hitting a pothole",
    },
    {
      temperature: "regardless of engine temperature",
      load: "during low-speed braking and pulling away",
      behavior: "there is a dull knock and a slight shift in the front end",
      timeline: "became more noticeable over the last few weeks",
    },
  ],
  brake_drag: [
    {
      temperature: "after repeated stop-and-go driving",
      load: "after braking several times in city traffic",
      behavior: "one wheel becomes hotter and the car feels held back",
      timeline: "started gradually after pads and discs had some mileage on them",
    },
    {
      temperature: "after a short city drive",
      load: "while coasting after braking",
      behavior: "car pulls slightly and a hot brake smell appears near one wheel",
      timeline: "appeared after the car sat for several days in wet weather",
    },
  ],
  mounts: [
    {
      temperature: "fully warmed engine",
      load: "when selecting drive or reverse and when taking off",
      behavior: "vibration is strongest at idle under drivetrain load and eases off while cruising",
      timeline: "gradually became worse over the last few weeks",
    },
    {
      temperature: "cold start and warm idle",
      load: "at idle with the brake held and a gear selected",
      behavior: "body shake is stronger than engine noise and changes when the drivetrain is loaded",
      timeline: "started after a period of rough roads and high mileage",
    },
  ],
  cooling: [
    {
      temperature: "fully warmed engine",
      load: "under medium load and uphill driving",
      behavior: "temperature or coolant pressure changes with load, not with wheel speed",
      timeline: "started after coolant loss was noticed",
    },
    {
      temperature: "after a long drive",
      load: "after acceleration followed by idle",
      behavior: "coolant level or pressure symptoms return after the system is bled",
      timeline: "became more noticeable over several heat cycles",
    },
  ],
  dpf_egr_exhaust: [
    {
      temperature: "fully warmed engine",
      load: "under medium to heavy acceleration",
      behavior: "loss of pull appears under load while idle remains mostly clean",
      timeline: "became worse after weeks of short city trips",
    },
    {
      temperature: "during repeated short trips",
      load: "while driving uphill or overtaking",
      behavior: "car feels choked but may not set a clear hard fault",
      timeline: "gradually became worse as regenerations were interrupted",
    },
  ],
  boost_intake: [
    {
      temperature: "fully warmed engine",
      load: "under boost during overtaking or uphill driving",
      behavior: "power drops when boost is requested and may return when throttle is eased",
      timeline: "started after a hard pull on the highway",
    },
    {
      temperature: "after a normal drive",
      load: "under medium to heavy acceleration",
      behavior: "hissing or weak pull appears only when the turbo is asked to work",
      timeline: "became more noticeable after several days of normal driving",
    },
  ],
  fuel_pressure: [
    {
      temperature: "warm restart after a short stop",
      load: "during cranking and the first seconds after start",
      behavior: "engine cranks normally but rail pressure or fuel supply does not build as expected",
      timeline: "started intermittently and became more frequent",
    },
    {
      temperature: "fully warmed engine",
      load: "under medium acceleration",
      behavior: "hesitation follows fuel demand rather than road speed or steering angle",
      timeline: "gradually became worse over several days",
    },
  ],
  sensors_sync: [
    {
      temperature: "hot engine after a short stop",
      load: "during restart or low-speed driving",
      behavior: "fault appears intermittently and may disappear after cooling down",
      timeline: "started suddenly and then repeated when the engine was warm",
    },
    {
      temperature: "fully warmed engine",
      load: "during idle and low-speed maneuvering",
      behavior: "engine cuts or hesitates without a consistent mechanical noise",
      timeline: "appeared after several days of otherwise normal driving",
    },
  ],
  charging_starting: [
    {
      temperature: "after overnight parking",
      load: "during the first start attempt",
      behavior: "starter, battery or charging symptom is present before the car is driven",
      timeline: "started after the battery had been weak for several days",
    },
    {
      temperature: "after a normal city drive",
      load: "with lights, blower and rear defroster switched on",
      behavior: "electrical warning or slow cranking follows electrical load, not engine load",
      timeline: "became more noticeable over the last week",
    },
  ],
  oil_internal: [
    {
      temperature: "fully warmed engine",
      load: "during normal mixed driving",
      behavior: "oil level drops over mileage without an obvious outside leak",
      timeline: "became more obvious between oil services",
    },
    {
      temperature: "after a longer drive",
      load: "after deceleration followed by acceleration",
      behavior: "oil use is the complaint, while power and idle may still feel normal",
      timeline: "gradually became worse over several thousand kilometers",
    },
  ],
  generic: [
    {
      temperature: "fully warmed engine",
      load: "under the same condition the customer can repeat reliably",
      behavior: "symptom follows the affected system and does not contradict the fault type",
      timeline: "became more noticeable over the last few weeks",
    },
  ],
};

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function contextGroupFor(template: RootCauseTemplate): keyof typeof CONTEXT_BANKS {
  const rootCause = template.root_cause_id.toLowerCase();
  const category = template.category.toLowerCase();

  if (rootCause.includes("wheel_bearing") || category.includes("wheel bearing")) {
    return "wheel_bearing";
  }
  if (rootCause.includes("cv_joint") || rootCause.includes("homokinet")) {
    return "cv_joint";
  }
  if (
    rootCause.includes("stabilizer") ||
    rootCause.includes("bushing") ||
    rootCause.includes("control_arm") ||
    category.includes("suspension")
  ) {
    return "suspension_bushing";
  }
  if (rootCause.includes("caliper") || category.includes("brakes")) {
    return "brake_drag";
  }
  if (rootCause.includes("mount") || category.includes("mounts")) {
    return "mounts";
  }
  if (
    rootCause.includes("head_gasket") ||
    rootCause.includes("thermostat") ||
    rootCause.includes("water_pump") ||
    category.includes("cooling")
  ) {
    return "cooling";
  }
  if (
    rootCause.includes("dpf") ||
    rootCause.includes("egr") ||
    category.includes("exhaust")
  ) {
    return "dpf_egr_exhaust";
  }
  if (
    rootCause.includes("boost") ||
    rootCause.includes("intercooler") ||
    rootCause.includes("vacuum") ||
    category.includes("intake")
  ) {
    return "boost_intake";
  }
  if (
    rootCause.includes("fuel") ||
    rootCause.includes("injector") ||
    rootCause.includes("leakoff") ||
    category.includes("fuel")
  ) {
    return "fuel_pressure";
  }
  if (
    rootCause.includes("sensor") ||
    rootCause.includes("crankshaft") ||
    rootCause.includes("camshaft") ||
    category.includes("sensors")
  ) {
    return "sensors_sync";
  }
  if (
    rootCause.includes("starter") ||
    rootCause.includes("alternator") ||
    rootCause.includes("ground") ||
    category.includes("electrical")
  ) {
    return "charging_starting";
  }
  if (rootCause.includes("rings") || rootCause.includes("karike") || category.includes("internal engine")) {
    return "oil_internal";
  }

  return "generic";
}

function buildContext(template: RootCauseTemplate) {
  const group = contextGroupFor(template);
  return pickOne(CONTEXT_BANKS[group]);
}

type RootCauseTemplate = {
  brand: string;
  vehicle: string;
  platform_type: string;
  category: string;
  root_cause_id: string;
  root_cause_label: string;
  difficulty: Difficulty;
} & VehicleTechMeta;

const ROOT_CAUSE_POOL: RootCauseTemplate[] = [
  // BMW
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

  // Audi
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

  // Volkswagen
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

  // Skoda
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

  // SEAT
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

  // Mercedes
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

  // Opel
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

  // Ford
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
  {
    brand: "Ford",
    vehicle: "Ford F-150 3.5 EcoBoost",
    platform_type: "modern_petrol_turbo_direct_chain",
    category: "Air flow / Turbo / Intake",
    root_cause_id: "intercooler_hose_split_under_boost",
    root_cause_label: "Crijevo interkulera puca pod boostom",
    difficulty: "medium",
  },
  {
    brand: "Chevrolet",
    vehicle: "Chevrolet Cruze 1.4 Turbo",
    platform_type: "modern_petrol_turbo_direct_chain",
    category: "Cooling",
    root_cause_id: "thermostat_housing_internal_fault",
    root_cause_label: "Kućište termostata ima unutrašnji kvar",
    difficulty: "medium",
  },
  {
    brand: "Dodge",
    vehicle: "Dodge Journey 3.6 V6",
    platform_type: "modern_petrol_port_injection_chain",
    category: "Drivetrain / Chassis",
    root_cause_id: "front_wheel_bearing_humming",
    root_cause_label: "Ležaj prednjeg točka proizvodi hučanje",
    difficulty: "easy",
  },
  {
    brand: "Jeep",
    vehicle: "Jeep Grand Cherokee 3.0 CRD",
    platform_type: "modern_diesel_v6_cr_turbo_dpf_chain",
    category: "Fuel / Injection",
    root_cause_id: "injector_leakoff_excessive",
    root_cause_label: "Prevelik leak-off na jednoj dizni",
    difficulty: "medium",
  },
  {
    brand: "Chevrolet",
    vehicle: "Chevrolet Silverado 5.3 V8",
    platform_type: "modern_petrol_port_injection_chain",
    category: "Mounts / Vibration",
    root_cause_id: "engine_mount_collapsed",
    root_cause_label: "Nosač motora oslabljen / sjeo",
    difficulty: "medium",
  },

  // Peugeot / Citroen
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

  // Renault
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

  // Toyota
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
    vehicle: "Toyota Corolla 1.6 benzin",
    platform_type: "modern_petrol_port_injection_chain",
    category: "Drivetrain / Chassis",
    root_cause_id: "front_wheel_bearing_humming",
    root_cause_label: "Ležaj prednjeg točka proizvodi hučanje",
    difficulty: "easy",
  },

  // Honda
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

  // Hyundai / Kia
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

const VEHICLE_TECH_SPECS: Record<string, VehicleTechMeta> = {
  "BMW F10 330d": { year: 2012, power_kw: 190, has_start_stop: true, emission_standard: "Euro 5" },
  "BMW F10 320d": { year: 2012, power_kw: 135, has_start_stop: true, emission_standard: "Euro 5" },
  "BMW E90 320d": { year: 2009, power_kw: 120, has_start_stop: false, emission_standard: "Euro 4/5" },
  "BMW F30 320d": { year: 2014, power_kw: 135, has_start_stop: true, emission_standard: "Euro 5/6" },
  "BMW E87 120d": { year: 2008, power_kw: 130, has_start_stop: false, emission_standard: "Euro 4" },
  "BMW E60 520d": { year: 2009, power_kw: 130, has_start_stop: false, emission_standard: "Euro 4/5" },
  "BMW E90 320i": { year: 2007, power_kw: 125, has_start_stop: false, emission_standard: "Euro 4" },

  "Audi A5 1.8 TFSI": { year: 2010, power_kw: 125, has_start_stop: false, emission_standard: "Euro 5" },
  "Audi A4 B8 1.8 TFSI": { year: 2009, power_kw: 118, has_start_stop: false, emission_standard: "Euro 5" },
  "Audi A4 B8 2.0 TDI": { year: 2010, power_kw: 105, has_start_stop: false, emission_standard: "Euro 5" },
  "Audi A6 4G 3.0 TDI": { year: 2012, power_kw: 180, has_start_stop: true, emission_standard: "Euro 5" },
  "Audi A3 8P 2.0 TDI": { year: 2008, power_kw: 103, has_start_stop: false, emission_standard: "Euro 4/5" },
  "Audi A3 8V 1.6 TDI": { year: 2014, power_kw: 81, has_start_stop: true, emission_standard: "Euro 5/6" },

  "VW Sharan 1.6 TDI": { year: 2012, power_kw: 77, has_start_stop: true, emission_standard: "Euro 5" },
  "VW Golf 6 1.6 TDI": { year: 2011, power_kw: 77, has_start_stop: false, emission_standard: "Euro 5", engine_code: "CAYC" },
  "VW Golf 7 1.6 TDI": { year: 2014, power_kw: 77, has_start_stop: true, emission_standard: "Euro 5/6" },
  "VW Passat B7 2.0 TDI": { year: 2012, power_kw: 103, has_start_stop: true, emission_standard: "Euro 5" },
  "VW Golf 5 1.9 TDI": { year: 2006, power_kw: 77, has_start_stop: false, has_dpf: false, emission_standard: "Euro 4", engine_code: "BKC" },
  "VW Golf 6 2.0 TDI": { year: 2011, power_kw: 103, has_start_stop: false, emission_standard: "Euro 5" },
  "VW Touran 1.9 TDI": { year: 2007, power_kw: 77, has_start_stop: false, has_dpf: false, emission_standard: "Euro 4" },
  "VW Passat B6 2.0 TDI": { year: 2008, power_kw: 103, has_start_stop: false, emission_standard: "Euro 4/5" },
  "VW Golf 7 1.4 TSI": { year: 2014, power_kw: 103, has_start_stop: true, emission_standard: "Euro 6" },

  "Skoda Octavia 2.0 TDI": { year: 2012, power_kw: 103, has_start_stop: false, emission_standard: "Euro 5" },
  "Skoda Octavia 1.9 TDI": { year: 2008, power_kw: 77, has_start_stop: false, has_dpf: false, emission_standard: "Euro 4" },
  "Skoda Superb 2.0 TDI": { year: 2013, power_kw: 125, has_start_stop: true, emission_standard: "Euro 5" },

  "SEAT Alhambra 2.0 TDI": { year: 2012, power_kw: 103, has_start_stop: true, emission_standard: "Euro 5" },
  "SEAT Leon 1.6 TDI": { year: 2013, power_kw: 77, has_start_stop: true, emission_standard: "Euro 5" },

  "Mercedes W212 E220 CDI": { year: 2011, power_kw: 125, has_start_stop: true, emission_standard: "Euro 5" },
  "Mercedes Sprinter 316 CDI": { year: 2014, power_kw: 120, has_start_stop: false, emission_standard: "Euro 5" },
  "Mercedes W204 C220 CDI": { year: 2012, power_kw: 125, has_start_stop: true, emission_standard: "Euro 5" },
  "Mercedes W204 C200 CDI": { year: 2011, power_kw: 100, has_start_stop: false, emission_standard: "Euro 5" },

  "Opel Insignia 2.0 CDTI": { year: 2011, power_kw: 118, has_start_stop: false, emission_standard: "Euro 5" },
  "Opel Astra J 1.7 CDTI": { year: 2012, power_kw: 81, has_start_stop: true, emission_standard: "Euro 5" },
  "Opel Astra H 1.9 CDTI": { year: 2008, power_kw: 88, has_start_stop: false, emission_standard: "Euro 4" },

  "Ford Mondeo 2.0 TDCi": { year: 2011, power_kw: 103, has_start_stop: false, emission_standard: "Euro 5" },
  "Ford Focus 1.6 TDCi": { year: 2010, power_kw: 80, has_start_stop: false, emission_standard: "Euro 4/5" },
  "Ford Focus 1.8 TDCi": { year: 2008, power_kw: 85, has_start_stop: false, emission_standard: "Euro 4" },
  "Ford F-150 3.5 EcoBoost": { year: 2015, power_kw: 272, has_start_stop: false, emission_standard: "US Tier 2 Bin 5", engine_code: "EcoBoost 3.5" },
  "Chevrolet Cruze 1.4 Turbo": { year: 2014, power_kw: 103, has_start_stop: false, emission_standard: "US Tier 2 Bin 5" },
  "Dodge Journey 3.6 V6": { year: 2013, power_kw: 209, has_start_stop: false, emission_standard: "US Tier 2 Bin 5" },
  "Jeep Grand Cherokee 3.0 CRD": { year: 2014, power_kw: 177, has_start_stop: false, emission_standard: "Euro 5 / US diesel", engine_code: "EXF" },
  "Chevrolet Silverado 5.3 V8": { year: 2015, power_kw: 265, has_start_stop: false, emission_standard: "US Tier 2 Bin 5" },

  "Peugeot 308 1.6 HDi": { year: 2011, power_kw: 82, has_start_stop: false, emission_standard: "Euro 5" },
  "Citroen C5 2.0 HDi": { year: 2011, power_kw: 103, has_start_stop: false, emission_standard: "Euro 5" },

  "Renault Megane 1.5 dCi": { year: 2012, power_kw: 81, has_start_stop: false, emission_standard: "Euro 5" },
  "Renault Laguna 2.0 dCi": { year: 2010, power_kw: 110, has_start_stop: false, emission_standard: "Euro 4/5" },

  "Toyota Avensis 2.0 D-4D": { year: 2010, power_kw: 93, has_start_stop: false, emission_standard: "Euro 4/5" },
  "Toyota Corolla 1.6 benzin": { year: 2008, power_kw: 97, has_start_stop: false, emission_standard: "Euro 4" },

  "Honda Civic 2.2 i-CTDi": { year: 2008, power_kw: 103, has_start_stop: false, has_dpf: false, emission_standard: "Euro 4" },
  "Honda Accord 2.0 benzin": { year: 2008, power_kw: 114, has_start_stop: false, emission_standard: "Euro 4" },

  "Hyundai i30 1.6 CRDi": { year: 2013, power_kw: 81, has_start_stop: true, emission_standard: "Euro 5" },
  "Kia Ceed 1.6 CRDi": { year: 2013, power_kw: 81, has_start_stop: true, emission_standard: "Euro 5" },
};

function inferMetaFromPlatform(platformType: string): VehicleTechMeta {
  const p = platformType.toLowerCase();
  const fuel_type = p.includes("diesel") ? "diesel" : "petrol";
  const induction = p.includes("turbo") ? "turbo" : "na";
  const timing_type = p.includes("chain") ? "chain" : p.includes("belt") ? "belt" : undefined;
  const has_dpf = p.includes("_dpf_") || p.endsWith("_dpf") || p.includes("dpf");
  return { fuel_type, induction, timing_type, has_dpf };
}

function enrichTemplate(template: RootCauseTemplate): RootCauseTemplate {
  const inferred = inferMetaFromPlatform(template.platform_type);
  const explicit = VEHICLE_TECH_SPECS[template.vehicle] || {};
  return {
    ...template,
    ...inferred,
    ...explicit,
    has_dpf: explicit.has_dpf ?? inferred.has_dpf,
  };
}

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

  return enrichTemplate(chosen);
}

export function getRandomScenarioSeed(): ScenarioSeed {
  const base = pickBalancedScenarioTemplate();

  return {
    ...base,
    context: buildContext(base),
  };
}

export function getRandomScenarioSeeds(count: number): ScenarioSeed[] {
  const safeCount = Math.max(1, Math.min(100, Number(count) || 1));
  return Array.from({ length: safeCount }, () => getRandomScenarioSeed());
}
