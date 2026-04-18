import { getSupabaseAdmin } from "./supabase-admin";

export type StoredScenario = {
  id?: string;
  created_at?: string;
  times_used?: number;

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

export async function insertScenario(scenario: StoredScenario) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("scenarios")
    .insert({
      ...scenario,
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
  mode: "all" = "all",
  limit = 10
) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("scenarios")
    .select("*")
    .order("times_used", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
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