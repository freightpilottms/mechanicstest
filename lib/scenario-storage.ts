import { getSupabaseAdmin } from "./supabase-admin";

export type SupportedMode = "all" | "eu" | "us" | "asia";

export type StoredScenario = {
  id?: string;
  created_at?: string;
  times_used?: number;
  locale?: string;
  language?: string;
  lang?: string;

  brand: string;
  platform_type: string;
  category: string;
  root_cause_id: string;
  root_cause_label: string;
  difficulty: "easy" | "medium" | "hard";
  title: string;
  vehicle: string;
  symptoms: string[];
  driving: string[];
  extra: string[];
  key_details: string[];
  questions: string[];
  hint: string[];
  answer_main: string;
  answer_why_no_code: string;
  answer_proof: string[];
  accepted_answers: string[];
  partial_answers: string[];
  scoring_notes: Record<string, any>;
  signature: string;

  year?: number;
  power_kw?: number;
  engine_code?: string;
  fuel_type?: string;
  induction?: string;
  timing_type?: string;
  has_start_stop?: boolean;
  has_dpf?: boolean;
  emission_standard?: string;
};

function normalizeText(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function matchesMode(item: StoredScenario, mode: SupportedMode) {
  if (mode === "all") return true;

  const brand = normalizeText(item.brand);
  const vehicle = normalizeText(item.vehicle);
  const platform = normalizeText(item.platform_type);
  const text = `${brand} ${vehicle} ${platform}`;

  const euBrands = [
    "audi",
    "bmw",
    "mercedes",
    "mercedes-benz",
    "vw",
    "volkswagen",
    "skoda",
    "seat",
    "opel",
    "peugeot",
    "renault",
    "citroen",
    "citroën",
    "fiat",
    "alfa romeo",
    "volvo",
    "saab",
    "land rover",
    "mini",
    "jaguar",
    "porsche",
  ];

  const usBrands = [
    "ford",
    "chevrolet",
    "chevy",
    "gmc",
    "dodge",
    "jeep",
    "cadillac",
    "chrysler",
    "lincoln",
    "buick",
    "ram",
    "pontiac",
    "saturn",
  ];

  const asiaBrands = [
    "toyota",
    "lexus",
    "honda",
    "acura",
    "nissan",
    "infiniti",
    "mazda",
    "mitsubishi",
    "subaru",
    "suzuki",
    "hyundai",
    "kia",
    "daewoo",
    "isuzu",
  ];

  if (mode === "eu") return euBrands.some((x) => text.includes(x));
  if (mode === "us") return usBrands.some((x) => text.includes(x));
  if (mode === "asia") return asiaBrands.some((x) => text.includes(x));

  return true;
}

export async function insertScenario(scenario: StoredScenario) {
  const supabase = getSupabaseAdmin();

  const payload = {
    brand: scenario.brand,
    platform_type: scenario.platform_type,
    category: scenario.category,
    root_cause_id: scenario.root_cause_id,
    root_cause_label: scenario.root_cause_label,
    difficulty: scenario.difficulty,
    title: scenario.title,
    vehicle: scenario.vehicle,
    symptoms: scenario.symptoms,
    driving: scenario.driving,
    extra: scenario.extra,
    key_details: scenario.key_details,
    questions: scenario.questions,
    hint: scenario.hint,
    answer_main: scenario.answer_main,
    answer_why_no_code: scenario.answer_why_no_code,
    answer_proof: scenario.answer_proof,
    accepted_answers: scenario.accepted_answers,
    partial_answers: scenario.partial_answers,
    scoring_notes: scenario.scoring_notes,
    signature: scenario.signature,
    locale: scenario.locale || scenario.language || scenario.lang || "en",
    language: scenario.language || scenario.locale || scenario.lang || "en",
  };

  const { data, error } = await supabase
    .from("scenarios")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function findScenarioBySignature(signature: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("scenarios")
    .select("id, signature")
    .eq("signature", signature)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getScenarioById(id: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("scenarios")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getLatestScenario() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("scenarios")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
export async function findScenarioByFingerprint(fingerprint: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("scenarios")
    .select("id, signature, fingerprint")
    .eq("fingerprint", fingerprint)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
export async function getScenariosForMode(
  mode: SupportedMode = "all",
  limit = 100,
  locale?: string
) {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("scenarios")
    .select("*")
    .order("times_used", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (locale) {
    query = query.eq("locale", locale);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as StoredScenario[];
  return rows.filter((item) => matchesMode(item, mode));
}

export async function incrementScenarioTimesUsed(id: string) {
  const supabase = getSupabaseAdmin();

  const current = await getScenarioById(id);
  if (!current) {
    throw new Error("Scenario not found");
  }

  const nextTimesUsed = Number(current.times_used || 0) + 1;

  const { error } = await supabase
    .from("scenarios")
    .update({ times_used: nextTimesUsed })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return { id, times_used: nextTimesUsed };
}