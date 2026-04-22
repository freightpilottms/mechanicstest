export type SupportedLocale = "en" | "bs";
export type SupportedMode = "all" | "eu" | "us" | "asia";
export type Difficulty = "easy" | "medium" | "hard";

export type FaultFamily =
  | "air_leak_after_maf"
  | "maf_sensor_drift"
  | "boost_vacuum_leak"
  | "turbo_actuator_sticking"
  | "injector_leakoff"
  | "low_fuel_pressure"
  | "crankshaft_sensor_heat_failure"
  | "cam_crank_sync_issue"
  | "alternator_voltage_drop"
  | "bad_engine_ground"
  | "egr_stuck_open"
  | "dpf_pressure_sensor_fault"
  | "intake_manifold_crack"
  | "coolant_temp_sensor_bias"
  | "wheel_speed_signal_drop"
  | "starter_voltage_drop"
  | "glow_system_weak_cold_start";

export type VehicleSeed = {
  brand: string;
  vehicle: string;
  mode: Exclude<SupportedMode, "all">;
  year: number;
  power_kw: number;
  engine_code?: string;
  platform_type: string;
  fuel_type: "diesel" | "petrol";
  induction: "turbo" | "na";
  timing_type: "belt" | "chain" | "gear";
  has_start_stop: boolean;
  has_dpf: boolean;
  emission_standard?: string;
  allowed_faults: FaultFamily[];
  forbidden_faults?: FaultFamily[];
};

export type FaultSeed = {
  id: FaultFamily;
  family_label_en: string;
  family_label_bs: string;
  category_en: string;
  category_bs: string;
  allowed_triggers_en: string[];
  allowed_triggers_bs: string[];
  forbidden_trigger_keywords: string[];
  core_symptoms_en: string[];
  core_symptoms_bs: string[];
  optional_symptoms_en: string[];
  optional_symptoms_bs: string[];
  proof_methods_en: string[];
  proof_methods_bs: string[];
  accepted_answers_en: string[];
  accepted_answers_bs: string[];
  partial_answers_en: string[];
  partial_answers_bs: string[];
};

export type ScenarioSeed = {
  brand: string;
  vehicle: string;
  year: number;
  power_kw: number;
  engine_code?: string;
  fuel_type: VehicleSeed["fuel_type"];
  induction: VehicleSeed["induction"];
  timing_type: VehicleSeed["timing_type"];
  has_start_stop: boolean;
  has_dpf: boolean;
  emission_standard?: string;
  platform_type: string;
  difficulty: Difficulty;
  category: string;
  root_cause_id: FaultFamily;
  root_cause_label: string;
  seed_symptoms: string[];
  seed_proof_methods: string[];
  accepted_answers_seed: string[];
  partial_answers_seed: string[];
  trigger_context: string;
  context: ScenarioSeedContext;
};

export type ScenarioSeedContext = {
  locale: SupportedLocale;
  mode: SupportedMode;
  difficulty: Difficulty;
  vehicleSeed: VehicleSeed;
  faultSeed: FaultSeed;
  trigger: string;
  trigger_family: string;
};

const VEHICLE_SEEDS: VehicleSeed[] = [
  {
    brand: "Volkswagen",
    vehicle: "VW Golf 5 1.9 TDI",
    mode: "eu",
    year: 2006,
    power_kw: 77,
    engine_code: "BKC",
    platform_type: "older_diesel_pd_turbo_belt",
    fuel_type: "diesel",
    induction: "turbo",
    timing_type: "belt",
    has_start_stop: false,
    has_dpf: false,
    emission_standard: "Euro 4",
    allowed_faults: [
      "air_leak_after_maf",
      "maf_sensor_drift",
      "boost_vacuum_leak",
      "turbo_actuator_sticking",
      "injector_leakoff",
      "low_fuel_pressure",
      "crankshaft_sensor_heat_failure",
      "alternator_voltage_drop",
      "bad_engine_ground",
      "coolant_temp_sensor_bias",
      "starter_voltage_drop",
      "glow_system_weak_cold_start",
    ],
    forbidden_faults: ["dpf_pressure_sensor_fault", "wheel_speed_signal_drop"],
  },
  {
    brand: "BMW",
    vehicle: "BMW F10 520d",
    mode: "eu",
    year: 2012,
    power_kw: 135,
    engine_code: "N47D20",
    platform_type: "modern_diesel_cr_turbo_dpf_chain",
    fuel_type: "diesel",
    induction: "turbo",
    timing_type: "chain",
    has_start_stop: true,
    has_dpf: true,
    emission_standard: "Euro 5",
    allowed_faults: [
      "air_leak_after_maf",
      "maf_sensor_drift",
      "boost_vacuum_leak",
      "turbo_actuator_sticking",
      "injector_leakoff",
      "low_fuel_pressure",
      "crankshaft_sensor_heat_failure",
      "cam_crank_sync_issue",
      "alternator_voltage_drop",
      "bad_engine_ground",
      "egr_stuck_open",
      "dpf_pressure_sensor_fault",
      "intake_manifold_crack",
      "coolant_temp_sensor_bias",
      "starter_voltage_drop",
    ],
  },
  {
    brand: "Mercedes-Benz",
    vehicle: "Mercedes W204 C220 CDI",
    mode: "eu",
    year: 2011,
    power_kw: 125,
    engine_code: "OM651",
    platform_type: "modern_diesel_cr_turbo_dpf_chain",
    fuel_type: "diesel",
    induction: "turbo",
    timing_type: "chain",
    has_start_stop: false,
    has_dpf: true,
    emission_standard: "Euro 5",
    allowed_faults: [
      "air_leak_after_maf",
      "maf_sensor_drift",
      "boost_vacuum_leak",
      "turbo_actuator_sticking",
      "low_fuel_pressure",
      "injector_leakoff",
      "alternator_voltage_drop",
      "bad_engine_ground",
      "egr_stuck_open",
      "dpf_pressure_sensor_fault",
      "intake_manifold_crack",
      "coolant_temp_sensor_bias",
    ],
  },
  {
    brand: "Ford",
    vehicle: "Ford F-150 3.5 EcoBoost",
    mode: "us",
    year: 2015,
    power_kw: 272,
    engine_code: "3.5 EcoBoost",
    platform_type: "modern_petrol_di_turbo_chain",
    fuel_type: "petrol",
    induction: "turbo",
    timing_type: "chain",
    has_start_stop: false,
    has_dpf: false,
    emission_standard: "US",
    allowed_faults: [
      "air_leak_after_maf",
      "maf_sensor_drift",
      "boost_vacuum_leak",
      "turbo_actuator_sticking",
      "low_fuel_pressure",
      "cam_crank_sync_issue",
      "alternator_voltage_drop",
      "bad_engine_ground",
      "intake_manifold_crack",
      "coolant_temp_sensor_bias",
      "starter_voltage_drop",
      "wheel_speed_signal_drop",
    ],
    forbidden_faults: ["injector_leakoff", "dpf_pressure_sensor_fault", "glow_system_weak_cold_start"],
  },
  {
    brand: "Chevrolet",
    vehicle: "Chevrolet Silverado 2500HD 6.6 Duramax",
    mode: "us",
    year: 2016,
    power_kw: 294,
    engine_code: "LML",
    platform_type: "modern_diesel_cr_turbo_dpf_chain",
    fuel_type: "diesel",
    induction: "turbo",
    timing_type: "chain",
    has_start_stop: false,
    has_dpf: true,
    emission_standard: "US",
    allowed_faults: [
      "air_leak_after_maf",
      "boost_vacuum_leak",
      "turbo_actuator_sticking",
      "injector_leakoff",
      "low_fuel_pressure",
      "alternator_voltage_drop",
      "bad_engine_ground",
      "egr_stuck_open",
      "dpf_pressure_sensor_fault",
      "coolant_temp_sensor_bias",
      "wheel_speed_signal_drop",
      "starter_voltage_drop",
    ],
  },
  {
    brand: "Toyota",
    vehicle: "Toyota Avensis 2.0 D-4D",
    mode: "asia",
    year: 2013,
    power_kw: 91,
    engine_code: "1AD-FTV",
    platform_type: "modern_diesel_cr_turbo_dpf_chain",
    fuel_type: "diesel",
    induction: "turbo",
    timing_type: "chain",
    has_start_stop: false,
    has_dpf: true,
    emission_standard: "Euro 5",
    allowed_faults: [
      "air_leak_after_maf",
      "maf_sensor_drift",
      "boost_vacuum_leak",
      "turbo_actuator_sticking",
      "injector_leakoff",
      "low_fuel_pressure",
      "alternator_voltage_drop",
      "bad_engine_ground",
      "egr_stuck_open",
      "dpf_pressure_sensor_fault",
      "coolant_temp_sensor_bias",
      "starter_voltage_drop",
      "glow_system_weak_cold_start",
    ],
  },
  {
    brand: "Honda",
    vehicle: "Honda Accord 2.2 i-DTEC",
    mode: "asia",
    year: 2011,
    power_kw: 110,
    engine_code: "N22B",
    platform_type: "modern_diesel_cr_turbo_chain",
    fuel_type: "diesel",
    induction: "turbo",
    timing_type: "chain",
    has_start_stop: false,
    has_dpf: true,
    emission_standard: "Euro 5",
    allowed_faults: [
      "air_leak_after_maf",
      "boost_vacuum_leak",
      "maf_sensor_drift",
      "injector_leakoff",
      "low_fuel_pressure",
      "alternator_voltage_drop",
      "bad_engine_ground",
      "egr_stuck_open",
      "dpf_pressure_sensor_fault",
      "coolant_temp_sensor_bias",
      "starter_voltage_drop",
    ],
  },
  {
    brand: "Hyundai",
    vehicle: "Hyundai i30 1.6 CRDi",
    mode: "asia",
    year: 2014,
    power_kw: 81,
    engine_code: "D4FB",
    platform_type: "modern_diesel_cr_turbo_chain",
    fuel_type: "diesel",
    induction: "turbo",
    timing_type: "chain",
    has_start_stop: true,
    has_dpf: true,
    emission_standard: "Euro 5",
    allowed_faults: [
      "air_leak_after_maf",
      "maf_sensor_drift",
      "boost_vacuum_leak",
      "injector_leakoff",
      "low_fuel_pressure",
      "crankshaft_sensor_heat_failure",
      "alternator_voltage_drop",
      "bad_engine_ground",
      "egr_stuck_open",
      "dpf_pressure_sensor_fault",
      "coolant_temp_sensor_bias",
      "glow_system_weak_cold_start",
    ],
  },
];

const FAULT_SEEDS: FaultSeed[] = [
  {
    id: "air_leak_after_maf",
    family_label_en: "Air leak after MAF",
    family_label_bs: "Curenje zraka poslije MAF-a",
    category_en: "Air flow / Intake",
    category_bs: "Protok zraka / Usis",
    allowed_triggers_en: [
      "after intake hose work",
      "after air filter housing removal",
      "after service around the intake path",
      "after engine movement disturbed a weak hose connection",
    ],
    allowed_triggers_bs: [
      "nakon rada oko usisnih crijeva",
      "nakon skidanja kućišta filtera zraka",
      "nakon servisa oko usisnog sistema",
      "nakon što je pomjeranje motora rasklimali slab spoj crijeva",
    ],
    forbidden_trigger_keywords: ["pothole", "brake service", "battery replacement"],
    core_symptoms_en: [
      "loss of power under load",
      "hissing air sound during acceleration",
      "measured air flow not matching engine load",
    ],
    core_symptoms_bs: [
      "gubitak snage pod opterećenjem",
      "šištanje zraka pri ubrzanju",
      "izmjeren protok zraka ne prati opterećenje motora",
    ],
    optional_symptoms_en: [
      "mild smoke on diesel under acceleration",
      "no major issue at idle",
    ],
    optional_symptoms_bs: [
      "blag dim kod dizela pri jačem gasu",
      "na leru ne djeluje posebno loše",
    ],
    proof_methods_en: [
      "smoke test intake path",
      "inspect charge hose joints",
      "compare requested vs actual air values",
    ],
    proof_methods_bs: [
      "uraditi smoke test usisa",
      "pregledati spojeve charge crijeva",
      "uporediti tražene i stvarne vrijednosti zraka",
    ],
    accepted_answers_en: ["air leak after maf", "boost leak", "loose intercooler hose"],
    accepted_answers_bs: ["curenje zraka poslije maf-a", "boost leak", "labavo crijevo intercoolera"],
    partial_answers_en: ["air leak", "intake leak", "charge pipe issue"],
    partial_answers_bs: ["curenje zraka", "problem na usisu", "problem charge cijevi"],
  },
  {
    id: "maf_sensor_drift",
    family_label_en: "MAF sensor drift",
    family_label_bs: "MAF senzor odstupa",
    category_en: "Air flow / Sensor plausibility",
    category_bs: "Protok zraka / Plausibility senzora",
    allowed_triggers_en: [
      "after contaminated air filter service",
      "after oil mist contamination",
      "after long-term gradual deterioration",
    ],
    allowed_triggers_bs: [
      "nakon zaprljanog servisa filtera zraka",
      "nakon kontaminacije uljnom parom",
      "nakon postepenog dugotrajnog odstupanja senzora",
    ],
    forbidden_trigger_keywords: ["pothole", "clutch change", "wheel alignment"],
    core_symptoms_en: [
      "lazy acceleration",
      "airflow readings not believable for load",
      "fueling correction feels wrong under demand",
    ],
    core_symptoms_bs: [
      "trom odziv na gas",
      "vrijednosti protoka zraka nisu uvjerljive za opterećenje",
      "korekcija doziranja djeluje pogrešno pod opterećenjem",
    ],
    optional_symptoms_en: [
      "may improve temporarily after restart",
      "no obvious mechanical noise",
    ],
    optional_symptoms_bs: [
      "nakratko može biti bolje nakon gašenja i paljenja",
      "nema jasne mehaničke buke",
    ],
    proof_methods_en: [
      "read live MAF values",
      "substitute known-good sensor if available",
      "inspect contamination on sensor element",
    ],
    proof_methods_bs: [
      "čitati live MAF vrijednosti",
      "probati ispravan senzor ako je dostupan",
      "pregledati kontaminaciju na senzoru",
    ],
    accepted_answers_en: ["maf drift", "faulty maf sensor", "maf reading wrong"],
    accepted_answers_bs: ["maf senzor odstupa", "neispravan maf", "maf daje pogrešne vrijednosti"],
    partial_answers_en: ["maf issue", "airflow sensor problem"],
    partial_answers_bs: ["problem maf-a", "problem senzora protoka zraka"],
  },
  {
    id: "boost_vacuum_leak",
    family_label_en: "Vacuum leak affecting boost control",
    family_label_bs: "Vakum curenje koje remeti boost kontrolu",
    category_en: "Turbo / Vacuum control",
    category_bs: "Turbo / Vakum kontrola",
    allowed_triggers_en: [
      "after vacuum line work",
      "heat-aged vacuum hose split",
      "after service near turbo control hardware",
    ],
    allowed_triggers_bs: [
      "nakon rada oko vakum vodova",
      "napuklo staro vakum crijevo od toplote",
      "nakon servisa oko turbo kontrole",
    ],
    forbidden_trigger_keywords: ["pothole", "air conditioning service"],
    core_symptoms_en: [
      "weak boost under load",
      "inconsistent turbo response",
      "better at low demand than under strong acceleration",
    ],
    core_symptoms_bs: [
      "slab boost pod opterećenjem",
      "neujednačen odziv turbine",
      "bolje ide na laganom gasu nego pri jačem ubrzanju",
    ],
    optional_symptoms_en: ["possible limp mode", "no major idle issue"],
    optional_symptoms_bs: ["moguć povremen limp mode", "na leru bez velikog problema"],
    proof_methods_en: [
      "check vacuum supply integrity",
      "hand vacuum test actuator circuit",
      "inspect hose routing and splits",
    ],
    proof_methods_bs: [
      "provjeriti integritet vakum napajanja",
      "ručno testirati vakum prema aktuatoru",
      "pregledati raspored i naprsline crijeva",
    ],
    accepted_answers_en: ["vacuum leak", "boost control vacuum leak", "split vacuum hose"],
    accepted_answers_bs: ["vakum curenje", "vakum problem boost kontrole", "puklo vakum crijevo"],
    partial_answers_en: ["vacuum issue", "turbo control issue"],
    partial_answers_bs: ["vakum problem", "problem kontrole turbine"],
  },
  {
    id: "turbo_actuator_sticking",
    family_label_en: "Turbo actuator sticking",
    family_label_bs: "Aktuator turbine zapinje",
    category_en: "Turbo / Actuator",
    category_bs: "Turbo / Aktuator",
    allowed_triggers_en: [
      "heat-related sticking after long drive",
      "soot buildup affecting movement",
      "intermittent issue under heavier load",
    ],
    allowed_triggers_bs: [
      "zapinje nakon zagrijavanja i duže vožnje",
      "naslage čađi remete kretanje",
      "problem izraženiji pod većim opterećenjem",
    ],
    forbidden_trigger_keywords: ["pothole", "after wheel bearing change"],
    core_symptoms_en: [
      "delayed or weak boost rise",
      "intermittent power loss under demand",
      "actuator response not smooth",
    ],
    core_symptoms_bs: [
      "spor ili slab rast boosta",
      "povremen gubitak snage pod opterećenjem",
      "odziv aktuatora nije gladak",
    ],
    optional_symptoms_en: ["may set over/underboost only sometimes"],
    optional_symptoms_bs: ["greška over/underboosta se može javiti samo povremeno"],
    proof_methods_en: [
      "observe actuator movement",
      "command actuator through diagnostics if supported",
      "check free movement mechanically",
    ],
    proof_methods_bs: [
      "posmatrati hod aktuatora",
      "komandovati aktuator preko dijagnostike ako podržava",
      "provjeriti mehanički da li slobodno radi",
    ],
    accepted_answers_en: ["sticking turbo actuator", "vnt actuator sticking"],
    accepted_answers_bs: ["aktuator turbine zapinje", "vnt aktuator zapinje"],
    partial_answers_en: ["turbo actuator issue", "boost control actuator problem"],
    partial_answers_bs: ["problem aktuatora turbine", "problem boost aktuatora"],
  },
  {
    id: "injector_leakoff",
    family_label_en: "Excess injector leak-off",
    family_label_bs: "Prevelik povrat na dizni",
    category_en: "Fuel / Injector balance",
    category_bs: "Gorivo / Balans dizni",
    allowed_triggers_en: [
      "hot restart complaint",
      "long cranking after standing",
      "problem worse warm than cold",
    ],
    allowed_triggers_bs: [
      "težak topao start",
      "dugo vergla nakon stajanja",
      "gore kad je motor topao nego hladan",
    ],
    forbidden_trigger_keywords: ["pothole", "after suspension work"],
    core_symptoms_en: [
      "extended cranking",
      "rail pressure slow to build",
      "worse on hot start or after soak",
    ],
    core_symptoms_bs: [
      "dugo vergla",
      "rail pritisak sporo raste",
      "gore pali topao ili nakon stajanja",
    ],
    optional_symptoms_en: ["may still run normally once started"],
    optional_symptoms_bs: ["kad upali može raditi sasvim pristojno"],
    proof_methods_en: [
      "perform leak-off test",
      "monitor rail pressure during crank",
      "compare injector return volumes",
    ],
    proof_methods_bs: [
      "uraditi leak-off test",
      "pratiti rail pritisak tokom verglanja",
      "uporediti količinu povrata po diznama",
    ],
    accepted_answers_en: ["injector leak off", "excess injector return", "one injector returning too much"],
    accepted_answers_bs: ["prevelik povrat na dizni", "dizna vraća previše", "leak off na dizni"],
    partial_answers_en: ["injector issue", "fuel return problem"],
    partial_answers_bs: ["problem dizne", "problem povrata goriva"],
  },
  {
    id: "low_fuel_pressure",
    family_label_en: "Low fuel supply pressure",
    family_label_bs: "Nizak dovodni pritisak goriva",
    category_en: "Fuel / Supply pressure",
    category_bs: "Gorivo / Dovodni pritisak",
    allowed_triggers_en: [
      "after fuel filter service",
      "under heavy load at higher demand",
      "after weak in-tank supply or restriction",
    ],
    allowed_triggers_bs: [
      "nakon servisa filtera goriva",
      "pod jačim opterećenjem pri većoj potrošnji",
      "kod slabog dobavnog sistema ili zapušenja",
    ],
    forbidden_trigger_keywords: ["pothole", "airbag service"],
    core_symptoms_en: [
      "falls flat under load",
      "pressure cannot keep up with demand",
      "may improve again at lighter throttle",
    ],
    core_symptoms_bs: [
      "ostaje bez snage pod opterećenjem",
      "pritisak ne prati traženu potrošnju",
      "na lakšem gasu može opet djelovati bolje",
    ],
    optional_symptoms_en: ["possible hesitation", "possible limp mode"],
    optional_symptoms_bs: ["moguće zadrške u ubrzanju", "moguć limp mode"],
    proof_methods_en: [
      "monitor low and high pressure live data",
      "check filter and supply restrictions",
      "verify in-tank or lift pump output",
    ],
    proof_methods_bs: [
      "pratiti niski i visoki pritisak u live data",
      "provjeriti filter i eventualno zapušenje",
      "provjeriti dobavnu pumpu",
    ],
    accepted_answers_en: ["low fuel pressure", "fuel supply restriction", "weak lift pump"],
    accepted_answers_bs: ["nizak pritisak goriva", "zapušen dovod goriva", "slaba dobavna pumpa"],
    partial_answers_en: ["fuel pressure issue", "fuel supply problem"],
    partial_answers_bs: ["problem pritiska goriva", "problem dovoda goriva"],
  },
  {
    id: "crankshaft_sensor_heat_failure",
    family_label_en: "Crankshaft sensor fails when hot",
    family_label_bs: "Senzor radilice otkaže kad se ugrije",
    category_en: "Engine sync / Sensor",
    category_bs: "Sinhronizacija motora / Senzor",
    allowed_triggers_en: [
      "after full warm-up",
      "after hot soak",
      "intermittent stall then restart when cooled",
    ],
    allowed_triggers_bs: [
      "nakon potpunog zagrijavanja",
      "nakon kratkog stajanja vrućeg motora",
      "povremeno se ugasi pa kasnije opet upali kad se ohladi",
    ],
    forbidden_trigger_keywords: ["pothole", "intake service"],
    core_symptoms_en: [
      "cuts out hot",
      "no restart until cooled or signal returns",
      "rpm signal missing or implausible while cranking",
    ],
    core_symptoms_bs: [
      "gasi se kad je vruć",
      "neće da upali dok se ne ohladi ili signal ne dođe nazad",
      "rpm signal fali ili je nelogičan tokom verglanja",
    ],
    optional_symptoms_en: ["may not store consistent fault every time"],
    optional_symptoms_bs: ["ne mora svaki put ostaviti jasnu grešku"],
    proof_methods_en: [
      "monitor engine speed while cranking hot",
      "check sensor signal quality warm vs cold",
      "heat-related test and wiring inspection",
    ],
    proof_methods_bs: [
      "pratiti obrtaje tokom verglanja na toplom",
      "provjeriti signal senzora topao naspram hladnog",
      "testirati toplotno ponašanje i instalaciju",
    ],
    accepted_answers_en: ["crank sensor heat failure", "faulty crankshaft sensor"],
    accepted_answers_bs: ["senzor radilice kad se ugrije", "neispravan senzor radilice"],
    partial_answers_en: ["crank sensor issue", "rpm sensor problem"],
    partial_answers_bs: ["problem senzora radilice", "problem rpm senzora"],
  },
  {
    id: "cam_crank_sync_issue",
    family_label_en: "Cam/crank synchronization issue",
    family_label_bs: "Problem sinhronizacije bregasta/radilica",
    category_en: "Engine sync / Timing plausibility",
    category_bs: "Sinhronizacija motora / Timing",
    allowed_triggers_en: [
      "after timing-side work",
      "after disturbed sensor mounting",
      "intermittent sync deviation when hot",
    ],
    allowed_triggers_bs: [
      "nakon rada na strani razvoda",
      "nakon diranja nosača senzora",
      "povremeno odstupanje sinhronizacije kad se ugrije",
    ],
    forbidden_trigger_keywords: ["pothole", "brake fluid change"],
    core_symptoms_en: [
      "long crank or difficult start",
      "sync not achieved quickly",
      "may run poorly or hesitate once started",
    ],
    core_symptoms_bs: [
      "dugo vergla ili teško pali",
      "sinhronizacija se ne postiže brzo",
      "kad upali može loše raditi ili zastajkivati",
    ],
    optional_symptoms_en: ["timing values borderline but not always hard fault"],
    optional_symptoms_bs: ["timing vrijednosti na granici bez stalne tvrde greške"],
    proof_methods_en: [
      "read sync status during crank",
      "check timing correlation values",
      "inspect timing-side work quality",
    ],
    proof_methods_bs: [
      "čitati sync status tokom verglanja",
      "provjeriti korelaciju razvoda",
      "pregledati kvalitet rada na strani razvoda",
    ],
    accepted_answers_en: ["cam crank sync issue", "timing correlation issue"],
    accepted_answers_bs: ["problem sinhronizacije bregaste i radilice", "problem korelacije razvoda"],
    partial_answers_en: ["timing issue", "sync issue"],
    partial_answers_bs: ["problem razvoda", "problem sinhronizacije"],
  },
  {
    id: "alternator_voltage_drop",
    family_label_en: "Alternator voltage drop under load",
    family_label_bs: "Pad napona alternatora pod opterećenjem",
    category_en: "Electrical / Charging",
    category_bs: "Elektrika / Punjenje",
    allowed_triggers_en: [
      "lights and blower on",
      "worse with electrical load",
      "battery warning may be intermittent",
    ],
    allowed_triggers_bs: [
      "sa upaljenim potrošačima i ventilatorom",
      "gore kad poraste električno opterećenje",
      "lampica akumulatora može biti povremena",
    ],
    forbidden_trigger_keywords: ["pothole", "after fuel filter service"],
    core_symptoms_en: [
      "voltage too low under load",
      "random control module complaints",
      "starting gradually becomes weaker",
    ],
    core_symptoms_bs: [
      "napon padne prenisko pod opterećenjem",
      "nasumične prijave više modula",
      "paljenje postepeno postaje slabije",
    ],
    optional_symptoms_en: ["lights may dim", "faults may seem unrelated"],
    optional_symptoms_bs: ["svjetla mogu slabiti", "greške mogu djelovati nepovezano"],
    proof_methods_en: [
      "measure charging voltage loaded and unloaded",
      "check ripple and output stability",
      "inspect belt drive and alternator connections",
    ],
    proof_methods_bs: [
      "izmjeriti napon punjenja rasterećen i opterećen",
      "provjeriti stabilnost izlaza i ripple",
      "pregledati remenski pogon i spojeve alternatora",
    ],
    accepted_answers_en: ["alternator voltage drop", "weak alternator", "charging issue"],
    accepted_answers_bs: ["pad napona alternatora", "slab alternator", "problem punjenja"],
    partial_answers_en: ["charging problem", "voltage issue"],
    partial_answers_bs: ["problem punjenja", "problem napona"],
  },
  {
    id: "bad_engine_ground",
    family_label_en: "Bad engine/body ground",
    family_label_bs: "Loša masa motora/karoserije",
    category_en: "Electrical / Ground fault",
    category_bs: "Elektrika / Masa",
    allowed_triggers_en: [
      "after engine movement",
      "corrosion worsening over time",
      "intermittent issues with load or start current",
    ],
    allowed_triggers_bs: [
      "nakon pomjeranja motora",
      "korozija koja se vremenom pogoršava",
      "povremeni problemi pod opterećenjem ili pri paljenju",
    ],
    forbidden_trigger_keywords: ["pothole", "after injector coding"],
    core_symptoms_en: [
      "voltage drop across ground path",
      "intermittent electrical behavior",
      "weak cranking or unstable sensor references",
    ],
    core_symptoms_bs: [
      "pad napona preko mase",
      "povremeno čudno električno ponašanje",
      "slabo verglanje ili nestabilne referentne vrijednosti senzora",
    ],
    optional_symptoms_en: ["multiple minor faults can appear together"],
    optional_symptoms_bs: ["može se pojaviti više sitnih grešaka odjednom"],
    proof_methods_en: [
      "voltage drop test on grounds",
      "inspect and clean ground straps",
      "load test during crank",
    ],
    proof_methods_bs: [
      "uraditi voltage drop test masa",
      "pregledati i očistiti masene trake",
      "testirati pod opterećenjem pri verglanju",
    ],
    accepted_answers_en: ["bad ground", "poor engine ground", "ground strap issue"],
    accepted_answers_bs: ["loša masa", "loša masa motora", "problem masene trake"],
    partial_answers_en: ["ground issue", "electrical ground problem"],
    partial_answers_bs: ["problem mase", "električni problem mase"],
  },
  {
    id: "egr_stuck_open",
    family_label_en: "EGR stuck open",
    family_label_bs: "EGR ostao otvoren",
    category_en: "EGR / Airflow contamination",
    category_bs: "EGR / Kontaminacija protoka zraka",
    allowed_triggers_en: [
      "worse warm than cold",
      "after carbon buildup",
      "light throttle roughness and low-end response issues",
    ],
    allowed_triggers_bs: [
      "gore kad se motor ugrije",
      "nakon nakupljanja čađi",
      "na laganom gasu lošiji rad i slab odziv dole",
    ],
    forbidden_trigger_keywords: ["pothole", "wheel service"],
    core_symptoms_en: [
      "rougher low-load running",
      "lazy response off idle",
      "airflow behavior inconsistent with expected fresh air",
    ],
    core_symptoms_bs: [
      "grublji rad pri malom opterećenju",
      "trom odziv iz niskih obrtaja",
      "protok zraka ne odgovara očekivanom svježem zraku",
    ],
    optional_symptoms_en: ["can smoke lightly on diesel", "may set no strong code at first"],
    optional_symptoms_bs: ["kod dizela može blago zadimiti", "ne mora odmah ostaviti jaku grešku"],
    proof_methods_en: [
      "command and observe EGR operation",
      "compare fresh air expectations vs actual",
      "inspect for sticking due to soot",
    ],
    proof_methods_bs: [
      "komandovati i pratiti rad egr-a",
      "uporediti očekivani i stvarni svježi zrak",
      "pregledati da li zapinje od čađi",
    ],
    accepted_answers_en: ["egr stuck open", "sticking egr valve"],
    accepted_answers_bs: ["egr ostao otvoren", "egr ventil zapinje otvoren"],
    partial_answers_en: ["egr issue", "egr problem"],
    partial_answers_bs: ["problem egr-a", "egr problem"],
  },
  {
    id: "dpf_pressure_sensor_fault",
    family_label_en: "DPF differential pressure sensor fault",
    family_label_bs: "Senzor diferencijalnog pritiska DPF-a",
    category_en: "DPF / Pressure plausibility",
    category_bs: "DPF / Plausibility pritiska",
    allowed_triggers_en: [
      "sensor drift over time",
      "pressure line contamination",
      "regeneration behavior no longer makes sense",
    ],
    allowed_triggers_bs: [
      "odstupanje senzora kroz vrijeme",
      "kontaminirane cjevčice pritiska",
      "ponašanje regeneracije više nema smisla",
    ],
    forbidden_trigger_keywords: ["pothole", "after clutch replacement"],
    core_symptoms_en: [
      "false load calculation related to exhaust restriction",
      "regeneration timing seems wrong",
      "reported pressure values do not match engine reality",
    ],
    core_symptoms_bs: [
      "pogrešan proračun opterećenja zbog navodnog otpora izduva",
      "regeneracije djeluju nelogično",
      "prijavljene vrijednosti pritiska ne prate stvarno stanje",
    ],
    optional_symptoms_en: ["possible limp mode", "possible fan behavior after shutdown"],
    optional_symptoms_bs: ["moguć limp mode", "moguće čudno ponašanje ventilatora nakon gašenja"],
    proof_methods_en: [
      "compare sensor values at key states",
      "inspect pressure lines",
      "verify against expected exhaust behavior",
    ],
    proof_methods_bs: [
      "uporediti vrijednosti senzora u ključnim stanjima",
      "pregledati cjevčice pritiska",
      "provjeriti da li to prati realno stanje izduva",
    ],
    accepted_answers_en: ["dpf pressure sensor fault", "faulty differential pressure sensor"],
    accepted_answers_bs: ["senzor diferencijalnog pritiska dpf-a", "neispravan dpf pressure senzor"],
    partial_answers_en: ["dpf sensor issue", "dpf pressure problem"],
    partial_answers_bs: ["problem dpf senzora", "problem pritiska dpf-a"],
  },
  {
    id: "intake_manifold_crack",
    family_label_en: "Intake manifold crack",
    family_label_bs: "Pukotina na usisnoj grani",
    category_en: "Intake / Structural leak",
    category_bs: "Usis / Strukturno curenje",
    allowed_triggers_en: [
      "after age and heat cycling",
      "after prior removal/refit stress",
      "noise and leak more obvious under load",
    ],
    allowed_triggers_bs: [
      "nakon starosti i toplinskih ciklusa",
      "nakon ranijeg skidanja i naprezanja",
      "zvuk i curenje izraženiji pod opterećenjem",
    ],
    forbidden_trigger_keywords: ["pothole", "after battery coding"],
    core_symptoms_en: [
      "air leak noise under load",
      "loss of torque",
      "measured air behavior not fully believable",
    ],
    core_symptoms_bs: [
      "čuje se curenje zraka pod opterećenjem",
      "pad momenta",
      "ponašanje protoka zraka nije sasvim uvjerljivo",
    ],
    optional_symptoms_en: ["smoke test reveals leak clearly"],
    optional_symptoms_bs: ["smoke test jasno pokaže curenje"],
    proof_methods_en: [
      "smoke test intake manifold",
      "inspect manifold seams and plastic body",
      "listen and load-test for leak localization",
    ],
    proof_methods_bs: [
      "uraditi smoke test usisne grane",
      "pregledati spojeve i plastiku grane",
      "slušati i testirati pod opterećenjem gdje pušta",
    ],
    accepted_answers_en: ["intake manifold crack", "cracked intake manifold"],
    accepted_answers_bs: ["pukla usisna grana", "pukotina na usisnoj grani"],
    partial_answers_en: ["intake leak", "manifold leak"],
    partial_answers_bs: ["curenje na usisu", "curenje na grani"],
  },
  {
    id: "coolant_temp_sensor_bias",
    family_label_en: "Coolant temperature sensor bias",
    family_label_bs: "Senzor temperature rashladne tečnosti odstupa",
    category_en: "Sensor / Temperature plausibility",
    category_bs: "Senzor / Plausibility temperature",
    allowed_triggers_en: [
      "worse cold start strategy",
      "fueling or glow behavior feels wrong for ambient conditions",
      "fan or warm-up logic seems odd",
    ],
    allowed_triggers_bs: [
      "najviše se vidi kroz hladan start",
      "doziranje ili grijanje ne prate stvarne uslove",
      "ventilator ili zagrijavanje djeluju nelogično",
    ],
    forbidden_trigger_keywords: ["pothole", "after tire change"],
    core_symptoms_en: [
      "cold start behavior not matching real temperature",
      "warm-up strategy feels wrong",
      "live coolant value implausible for ambient",
    ],
    core_symptoms_bs: [
      "hladan start ne prati stvarnu temperaturu",
      "strategija zagrijavanja djeluje pogrešno",
      "live temperatura rashladne nije logična za ambijent",
    ],
    optional_symptoms_en: ["may not trigger hard fault immediately"],
    optional_symptoms_bs: ["ne mora odmah izazvati tvrdu grešku"],
    proof_methods_en: [
      "compare live coolant temp with ambient and actual engine state",
      "check sensor wiring and resistance",
      "observe cold-start strategy",
    ],
    proof_methods_bs: [
      "uporediti live temperaturu sa ambijentom i stvarnim stanjem motora",
      "provjeriti instalaciju i otpor senzora",
      "posmatrati ponašanje na hladan start",
    ],
    accepted_answers_en: ["coolant temp sensor bias", "faulty coolant temperature sensor"],
    accepted_answers_bs: ["senzor temperature rashladne odstupa", "neispravan senzor temperature rashladne"],
    partial_answers_en: ["coolant temp sensor issue", "temperature sensor problem"],
    partial_answers_bs: ["problem senzora temperature", "problem rashladnog senzora"],
  },
  {
    id: "wheel_speed_signal_drop",
    family_label_en: "Intermittent wheel speed signal drop",
    family_label_bs: "Povremeni prekid signala brzine točka",
    category_en: "ABS / Speed signal",
    category_bs: "ABS / Signal brzine točka",
    allowed_triggers_en: [
      "after bearing or hub contamination",
      "intermittent with movement and vibration",
      "speed-related intervention not matching reality",
    ],
    allowed_triggers_bs: [
      "nakon problema oko ležaja ili prljavštine na glavčini",
      "povremeno s kretanjem i vibracijom",
      "intervencija sistema ne prati stvarno stanje",
    ],
    forbidden_trigger_keywords: ["airflow", "fuel filter", "intake leak"],
    core_symptoms_en: [
      "abs/traction reacts unexpectedly",
      "one wheel speed drops out intermittently",
      "problem follows motion rather than engine load",
    ],
    core_symptoms_bs: [
      "abs/traction reaguje bez realnog razloga",
      "signal jednog točka povremeno nestane",
      "problem prati kretanje a ne opterećenje motora",
    ],
    optional_symptoms_en: ["dashboard warning may be intermittent"],
    optional_symptoms_bs: ["lampica može biti povremena"],
    proof_methods_en: [
      "compare all wheel speeds live",
      "inspect sensor gap and signal ring",
      "check wiring movement effect",
    ],
    proof_methods_bs: [
      "uporediti sve brzine točkova u live data",
      "pregledati zazor senzora i signalni prsten",
      "provjeriti kako instalacija reaguje na pomjeranje",
    ],
    accepted_answers_en: ["wheel speed signal drop", "faulty wheel speed sensor"],
    accepted_answers_bs: ["prekid signala brzine točka", "neispravan abs senzor točka"],
    partial_answers_en: ["wheel speed issue", "abs sensor issue"],
    partial_answers_bs: ["problem senzora točka", "problem abs senzora"],
  },
  {
    id: "starter_voltage_drop",
    family_label_en: "Starter circuit voltage drop",
    family_label_bs: "Pad napona u starter krugu",
    category_en: "Starting / Current delivery",
    category_bs: "Paljenje / Dovod struje",
    allowed_triggers_en: [
      "worse after standing",
      "cranks slowly despite charged battery",
      "heat can worsen starter resistance",
    ],
    allowed_triggers_bs: [
      "gore nakon stajanja",
      "sporo vergla iako je akumulator dobar",
      "toplota može dodatno pogoršati otpor startera",
    ],
    forbidden_trigger_keywords: ["intake hose", "airflow", "pothole"],
    core_symptoms_en: [
      "slow cranking speed",
      "voltage drops heavily while cranking",
      "engine may start fine when spun fast enough externally",
    ],
    core_symptoms_bs: [
      "sporo verglanje",
      "napon jako padne tokom verglanja",
      "motor inače pali kad se dovoljno brzo zavrti",
    ],
    optional_symptoms_en: ["may be confused with battery issue"],
    optional_symptoms_bs: ["može ličiti na problem akumulatora"],
    proof_methods_en: [
      "voltage drop test starter circuit",
      "measure current draw",
      "compare battery condition vs crank behavior",
    ],
    proof_methods_bs: [
      "uraditi voltage drop test starter kruga",
      "izmjeriti struju startera",
      "uporediti stanje akumulatora sa ponašanjem verglanja",
    ],
    accepted_answers_en: ["starter voltage drop", "starter circuit drop", "starter drawing too much"],
    accepted_answers_bs: ["pad napona startera", "pad u starter krugu", "starter vuče previše"],
    partial_answers_en: ["starter problem", "starting circuit issue"],
    partial_answers_bs: ["problem startera", "problem startnog kruga"],
  },
  {
    id: "glow_system_weak_cold_start",
    family_label_en: "Weak glow system on cold start",
    family_label_bs: "Slab sistem grijanja pri hladnom startu",
    category_en: "Cold start / Glow system",
    category_bs: "Hladan start / Grijači",
    allowed_triggers_en: [
      "cold morning only",
      "better once ambient temperature rises",
      "harder start primarily when engine fully cold",
    ],
    allowed_triggers_bs: [
      "samo po hladnom jutru",
      "bolje pali kad poraste vanjska temperatura",
      "najgore kad je motor potpuno hladan",
    ],
    forbidden_trigger_keywords: ["pothole", "after intake work"],
    core_symptoms_en: [
      "rough cold start",
      "longer crank only when cold",
      "once started it clears up gradually",
    ],
    core_symptoms_bs: [
      "grub hladan start",
      "duže vergla samo kad je hladan",
      "kad upali postepeno se smiri",
    ],
    optional_symptoms_en: ["warm restarts are mostly normal"],
    optional_symptoms_bs: ["topla paljenja su uglavnom uredna"],
    proof_methods_en: [
      "test glow plug current and control",
      "verify glow command at low temperature",
      "check individual plug condition",
    ],
    proof_methods_bs: [
      "testirati struju grijača i komandu",
      "provjeriti da li postoji komanda grijanja na hladnom",
      "provjeriti stanje pojedinačnih grijača",
    ],
    accepted_answers_en: ["weak glow system", "glow plug issue", "glow control issue"],
    accepted_answers_bs: ["slab sistem grijača", "problem grijača", "problem komande grijača"],
    partial_answers_en: ["cold start system issue", "preheat problem"],
    partial_answers_bs: ["problem hladnog starta", "problem predgrijavanja"],
  },
];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function difficultyToWeights(difficulty: Difficulty) {
  if (difficulty === "easy") return { core: 3, optional: 1 };
  if (difficulty === "medium") return { core: 3, optional: 2 };
  return { core: 2, optional: 3 };
}

function pickAllowedVehicles(mode: SupportedMode) {
  if (mode === "all") return VEHICLE_SEEDS;
  return VEHICLE_SEEDS.filter((v) => v.mode === mode);
}

function findFault(id: FaultFamily) {
  const fault = FAULT_SEEDS.find((f) => f.id === id);
  if (!fault) throw new Error(`Fault seed not found: ${id}`);
  return fault;
}

function pickTrigger(fault: FaultSeed, locale: SupportedLocale) {
  return locale === "bs"
    ? pickOne(fault.allowed_triggers_bs)
    : pickOne(fault.allowed_triggers_en);
}

function pickSymptoms(fault: FaultSeed, locale: SupportedLocale, difficulty: Difficulty) {
  const weights = difficultyToWeights(difficulty);
  const core = locale === "bs" ? fault.core_symptoms_bs : fault.core_symptoms_en;
  const optional = locale === "bs" ? fault.optional_symptoms_bs : fault.optional_symptoms_en;

  const pickedCore = shuffle(core).slice(0, weights.core);
  const pickedOptional = shuffle(optional).slice(0, Math.min(weights.optional, optional.length));

  return shuffle([...pickedCore, ...pickedOptional]);
}

function buildPlatformType(vehicle: VehicleSeed) {
  return vehicle.platform_type;
}

export function getRandomScenarioSeed(options?: {
  locale?: SupportedLocale;
  mode?: SupportedMode;
  difficulty?: Difficulty;
}): ScenarioSeed {
  const locale = options?.locale || "bs";
  const mode = options?.mode || "all";
  const difficulty = options?.difficulty || pickOne<Difficulty>(["easy", "medium", "hard"]);

  const vehiclePool = pickAllowedVehicles(mode);
  if (!vehiclePool.length) {
    throw new Error(`No vehicle seeds available for mode: ${mode}`);
  }

  const vehicleSeed = pickOne(vehiclePool);

  const allowedFaultIds = vehicleSeed.allowed_faults.filter(
    (faultId) => !(vehicleSeed.forbidden_faults || []).includes(faultId)
  );

  if (!allowedFaultIds.length) {
    throw new Error(`No allowed faults for vehicle: ${vehicleSeed.vehicle}`);
  }

  const faultSeed = findFault(pickOne(allowedFaultIds));
  const trigger = pickTrigger(faultSeed, locale);

  const context: ScenarioSeedContext = {
    locale,
    mode,
    difficulty,
    vehicleSeed,
    faultSeed,
    trigger,
    trigger_family: faultSeed.id,
  };

  return {
    brand: vehicleSeed.brand,
    vehicle: vehicleSeed.vehicle,
    year: vehicleSeed.year,
    power_kw: vehicleSeed.power_kw,
    engine_code: vehicleSeed.engine_code,
    fuel_type: vehicleSeed.fuel_type,
    induction: vehicleSeed.induction,
    timing_type: vehicleSeed.timing_type,
    has_start_stop: vehicleSeed.has_start_stop,
    has_dpf: vehicleSeed.has_dpf,
    emission_standard: vehicleSeed.emission_standard,
    platform_type: buildPlatformType(vehicleSeed),
    difficulty,
    category: locale === "bs" ? faultSeed.category_bs : faultSeed.category_en,
    root_cause_id: faultSeed.id,
    root_cause_label: locale === "bs" ? faultSeed.family_label_bs : faultSeed.family_label_en,
    seed_symptoms: pickSymptoms(faultSeed, locale, difficulty),
    seed_proof_methods: locale === "bs" ? faultSeed.proof_methods_bs : faultSeed.proof_methods_en,
    accepted_answers_seed:
      locale === "bs" ? faultSeed.accepted_answers_bs : faultSeed.accepted_answers_en,
    partial_answers_seed:
      locale === "bs" ? faultSeed.partial_answers_bs : faultSeed.partial_answers_en,
    trigger_context: trigger,
    context,
  };
}

export function getFaultFamilies() {
  return FAULT_SEEDS.map((f) => f.id);
}

export function getVehicleSeeds() {
  return [...VEHICLE_SEEDS];
}

export function getFaultSeeds() {
  return [...FAULT_SEEDS];
}
