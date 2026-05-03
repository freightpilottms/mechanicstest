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

const SCHEMA_FALLBACK_COLUMNS = [
  "signature",
  "locale",
  "language",
  "times_used",
  "created_at",
  "year",
  "power_kw",
  "engine_code",
  "fuel_type",
  "induction",
  "timing_type",
  "has_start_stop",
  "has_dpf",
  "emission_standard",
] as const;

function normalizeText(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function getScenarioLocale(item: StoredScenario) {
  const notes = item.scoring_notes || {};
  const raw = String(
    item.locale ||
      item.language ||
      item.lang ||
      notes.languageLocked ||
      notes.locale ||
      notes.language ||
      "en"
  ).toLowerCase();

  return raw === "bs" ? "bs" : "en";
}

function errorText(error: any) {
  return [error?.message, error?.details, error?.hint, error?.code]
    .filter(Boolean)
    .join(" ");
}

function getMissingColumn(error: any) {
  const text = errorText(error);

  const direct =
    text.match(/Could not find the '([^']+)' column/i)?.[1] ||
    text.match(/column "?(?:\w+\.)?([a-zA-Z0-9_]+)"? does not exist/i)?.[1] ||
    text.match(/column "([^"]+)" of relation/i)?.[1];

  if (direct) return direct;

  const normalized = text.toLowerCase();
  if (!/schema cache|does not exist|column|pgrst204/.test(normalized)) {
    return null;
  }

  return (
    SCHEMA_FALLBACK_COLUMNS.find((column) =>
      normalized.includes(column.toLowerCase())
    ) || null
  );
}

function isMissingColumn(error: any, column?: string) {
  const missingColumn = getMissingColumn(error);
  if (!missingColumn) return false;
  return column ? missingColumn === column : true;
}

function formatSupabaseError(action: string, error: any) {
  const parts = [error?.message || "Unknown Supabase error"];
  if (error?.code) parts.push(`code: ${error.code}`);
  if (error?.details) parts.push(`details: ${error.details}`);
  if (error?.hint) parts.push(`hint: ${error.hint}`);
  return `${action}: ${parts.join(" | ")}`;
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

function buildScenarioPayload(scenario: StoredScenario) {
  return {
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
    locale: scenario.locale || scenario.language || "en",
    language: scenario.language || scenario.locale || "en",
    year: scenario.year ?? null,
    power_kw: scenario.power_kw ?? null,
    engine_code: scenario.engine_code ?? null,
    fuel_type: scenario.fuel_type ?? null,
    induction: scenario.induction ?? null,
    timing_type: scenario.timing_type ?? null,
    has_start_stop: scenario.has_start_stop ?? null,
    has_dpf: scenario.has_dpf ?? null,
    emission_standard: scenario.emission_standard ?? null,
  };
}

export async function insertScenario(scenario: StoredScenario) {
  const supabase = getSupabaseAdmin();
  const payload = buildScenarioPayload(scenario);
  const omittedColumns: string[] = [];
  let currentPayload: Record<string, any> = { ...payload };

  for (let attempt = 0; attempt <= SCHEMA_FALLBACK_COLUMNS.length; attempt += 1) {
    const { data, error } = await supabase
      .from("scenarios")
      .insert(currentPayload)
      .select("id")
      .single();

    if (!error) {
      return omittedColumns.length
        ? { ...data, omitted_columns: omittedColumns }
        : data;
    }

    const missingColumn = getMissingColumn(error);
    const canRetry =
      missingColumn &&
      SCHEMA_FALLBACK_COLUMNS.includes(missingColumn as any) &&
      Object.prototype.hasOwnProperty.call(currentPayload, missingColumn);

    if (canRetry) {
      const { [missingColumn]: _removed, ...rest } = currentPayload;
      currentPayload = rest;
      omittedColumns.push(missingColumn);
      continue;
    }

    throw new Error(formatSupabaseError("Could not insert scenario", error));
  }

  throw new Error(
    `Could not insert scenario: database schema rejected columns ${omittedColumns.join(", ")}`
  );
}

export async function findScenarioBySignature(signature: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("scenarios")
    .select("id, signature")
    .eq("signature", signature)
    .maybeSingle();

  if (error) {
    if (isMissingColumn(error, "signature")) {
      return null;
    }

    throw new Error(formatSupabaseError("Could not check scenario signature", error));
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
    throw new Error(formatSupabaseError("Could not get scenario by id", error));
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
    throw new Error(formatSupabaseError("Could not get latest scenario", error));
  }

  return data;
}

async function fetchScenarioRows(limit: number, locale?: string) {
  const supabase = getSupabaseAdmin();
  let withTimesUsedOrder = true;
  let withCreatedAtOrder = true;
  let withLocaleFilter = Boolean(locale);

  for (let attempt = 0; attempt < 6; attempt += 1) {
    let query = supabase.from("scenarios").select("*");

    if (withTimesUsedOrder) {
      query = query.order("times_used", { ascending: true });
    }

    if (withCreatedAtOrder) {
      query = query.order("created_at", { ascending: false });
    }

    query = query.limit(limit);

    if (withLocaleFilter && locale) {
      query = query.eq("locale", locale);
    }

    const { data, error } = await query;

    if (!error) {
      return {
        rows: (data ?? []) as StoredScenario[],
        serverFilteredLocale: withLocaleFilter,
      };
    }

    if (withTimesUsedOrder && isMissingColumn(error, "times_used")) {
      withTimesUsedOrder = false;
      continue;
    }

    if (withCreatedAtOrder && isMissingColumn(error, "created_at")) {
      withCreatedAtOrder = false;
      continue;
    }

    if (withLocaleFilter && isMissingColumn(error, "locale")) {
      withLocaleFilter = false;
      continue;
    }

    throw new Error(formatSupabaseError("Could not fetch scenarios", error));
  }

  throw new Error("Could not fetch scenarios: database schema fallback exhausted");
}

export async function getScenariosForMode(
  mode: SupportedMode = "all",
  limit = 10,
  locale?: string
) {
  const { rows, serverFilteredLocale } = await fetchScenarioRows(limit, locale);
  const modeRows = rows.filter((item) => matchesMode(item, mode));

  if (locale && !serverFilteredLocale) {
    const normalizedLocale = locale === "bs" ? "bs" : "en";
    return modeRows.filter((item) => getScenarioLocale(item) === normalizedLocale);
  }

  return modeRows;
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
    if (isMissingColumn(error, "times_used")) {
      return { id, times_used: Number(current.times_used || 0) };
    }

    throw new Error(formatSupabaseError("Could not update scenario usage", error));
  }

  return { id, times_used: nextTimesUsed };
}
