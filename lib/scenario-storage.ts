import { getSupabaseAdmin } from "./supabase-admin";

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
};

export type TestSessionPayload = {
  user_id: string;
  mode: string;
  locale: string;
  session_type?: "single" | "multiplayer";
  question_count: number;
  average_score?: number;
  final_rank?: string;
  status?: "active" | "finished" | "abandoned";
  started_at?: string;
  finished_at?: string | null;
};

export type NewTestSessionItemPayload = {
  scenario_id: string;
  position: number;
  user_answer: string;
  time_spent_seconds?: number;
  timed_out?: boolean;
  ai_score?: number;
  ai_bonus?: number;
  ai_diagnosis_percent?: number;
  ai_verdict?: string;
  ai_feedback?: string;
  matched_cause?: string;
};

export type TestSessionItemPayload = NewTestSessionItemPayload & {
  test_session_id: string;
};

function normalizeMode(mode: string) {
  const value = String(mode || "all").trim().toLowerCase();
  if (value === "us" || value === "eu" || value === "asia" || value === "all") {
    return value;
  }
  return "all";
}

function normalizeLocale(locale: string) {
  const value = String(locale || "en").trim().toLowerCase();
  if (value === "bs" || value === "en") return value;
  return "en";
}

export async function insertScenario(scenario: StoredScenario) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("scenarios")
    .insert({
      ...scenario,
      locale: scenario.locale || scenario.language || scenario.lang || null,
      symptoms: scenario.symptoms,
      driving: scenario.driving,
      extra: scenario.extra,
      key_details: scenario.key_details,
      questions: scenario.questions,
      hint: scenario.hint,
      answer_proof: scenario.answer_proof,
      accepted_answers: scenario.accepted_answers,
      partial_answers: scenario.partial_answers,
      scoring_notes: scenario.scoring_notes,
    })
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

export async function getScenariosForMode(
  mode: "all" | "us" | "eu" | "asia" = "all",
  limit = 10
) {
  const supabase = getSupabaseAdmin();
  const normalizedMode = normalizeMode(mode);

  let query = supabase
    .from("scenarios")
    .select("*")
    .order("times_used", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (normalizedMode !== "all") {
    query = query.eq("category", normalizedMode);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getScenariosForModeAndLocale(
  mode: "all" | "us" | "eu" | "asia" = "all",
  locale: "bs" | "en" = "en",
  limit = 100
) {
  const supabase = getSupabaseAdmin();
  const normalizedMode = normalizeMode(mode);
  const normalizedLocale = normalizeLocale(locale);

  let query = supabase
    .from("scenarios")
    .select("*")
    .order("times_used", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (normalizedMode !== "all") {
    query = query.eq("category", normalizedMode);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];

  const exactLocale = rows.filter((item) => {
    const itemLocale = String(item.locale || item.language || item.lang || "")
      .trim()
      .toLowerCase();
    return itemLocale === normalizedLocale;
  });

  if (exactLocale.length > 0) return exactLocale;

  const noLocaleInfo = rows.filter((item) => {
    const itemLocale = String(item.locale || item.language || item.lang || "")
      .trim()
      .toLowerCase();
    return !itemLocale;
  });

  if (noLocaleInfo.length > 0) return noLocaleInfo;

  return rows;
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

export async function createTestSession(payload: TestSessionPayload) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("test_sessions")
    .insert({
      user_id: payload.user_id,
      mode: normalizeMode(payload.mode),
      locale: normalizeLocale(payload.locale),
      session_type: payload.session_type || "single",
      question_count: Number(payload.question_count || 0),
      average_score:
        payload.average_score === undefined ? null : Number(payload.average_score),
      final_rank: payload.final_rank || null,
      status: payload.status || "finished",
      started_at: payload.started_at || new Date().toISOString(),
      finished_at:
        payload.finished_at === undefined ? new Date().toISOString() : payload.finished_at,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function insertTestSessionItems(items: TestSessionItemPayload[]) {
  if (!items.length) return [];

  const supabase = getSupabaseAdmin();

  const payload = items.map((item) => ({
    test_session_id: item.test_session_id,
    scenario_id: item.scenario_id,
    position: Number(item.position),
    user_answer: item.user_answer || "",
    time_spent_seconds: Number(item.time_spent_seconds || 0),
    timed_out: !!item.timed_out,
    ai_score: item.ai_score === undefined ? null : Number(item.ai_score),
    ai_bonus: item.ai_bonus === undefined ? null : Number(item.ai_bonus),
    ai_diagnosis_percent:
      item.ai_diagnosis_percent === undefined
        ? null
        : Number(item.ai_diagnosis_percent),
    ai_verdict: item.ai_verdict || null,
    ai_feedback: item.ai_feedback || null,
    matched_cause: item.matched_cause || null,
  }));

  const { data, error } = await supabase
    .from("test_session_items")
    .insert(payload)
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getRecentPlayedScenarioIdsForUser(
  userId: string,
  limit = 100
): Promise<string[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("test_session_items")
    .select("scenario_id, created_at, test_sessions!inner(user_id)")
    .eq("test_sessions.user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const ids = (data ?? [])
    .map((row: any) => String(row.scenario_id || "").trim())
    .filter(Boolean);

  return Array.from(new Set(ids));
}

export async function saveCompletedTestSession(params: {
  user_id: string;
  mode: string;
  locale: string;
  average_score: number;
  final_rank: string;
  items: NewTestSessionItemPayload[];
  session_type?: "single" | "multiplayer";
}) {
  const session = await createTestSession({
    user_id: params.user_id,
    mode: params.mode,
    locale: params.locale,
    session_type: params.session_type || "single",
    question_count: params.items.length,
    average_score: params.average_score,
    final_rank: params.final_rank,
    status: "finished",
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
  });

  const items: TestSessionItemPayload[] = params.items.map((item) => ({
    ...item,
    test_session_id: session.id,
  }));

  const insertedItems = await insertTestSessionItems(items);

  const scenarioIds = Array.from(
    new Set(
      insertedItems
        .map((item: any) => String(item.scenario_id || "").trim())
        .filter(Boolean)
    )
  );

  for (const scenarioId of scenarioIds) {
    try {
      await incrementScenarioTimesUsed(scenarioId);
    } catch {
      // ne ruši cijeli flow ako increment padne
    }
  }

  return {
    session,
    items: insertedItems,
  };
}