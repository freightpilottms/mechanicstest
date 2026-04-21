import type { Difficulty } from "@/lib/mock-questions";
import type { Locale } from "@/lib/i18n";

export type ScenarioQuestion = {
  id: string;
  brand: string;
  platform_type: string;
  category: string;
  root_cause_id: string;
  root_cause_label: string;
  difficulty: Difficulty;
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
  scoring_notes?: Record<string, any>;
  created_at?: string;
  times_used?: number;
};

export type AnswerState = {
  answer: string;
  timedOut: boolean;
  timeSpent: number;
};

export type AiEvaluation = {
  score: number;
  diagnosis_percent: number;
  bonus: number;
  verdict: "correct" | "very_close" | "partial" | "weak" | "wrong";
  matched_cause: string;
  reason_short: string;
};

export type ActiveTestSession = {
  sessionId: string;
  mode: string;
  locale: Locale;
  questions: ScenarioQuestion[];
  answers: AnswerState[];
  aiResults: (AiEvaluation | null)[];
  currentIndex: number;
  timeLeft: number;
  questionDeadlineAt: number;
  finished: boolean;
  evaluating: boolean;
  updatedAt: number;
};

export const ACTIVE_TEST_SESSION_KEY = "mechanic_iq_active_test_session_v1";

export function buildTestSessionId(mode: string, locale: Locale) {
  return `${mode}__${locale}`;
}

export function readActiveTestSession(): ActiveTestSession | null {
  try {
    const raw = window.localStorage.getItem(ACTIVE_TEST_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ActiveTestSession;

    if (!parsed || !Array.isArray(parsed.questions) || !Array.isArray(parsed.answers)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeActiveTestSession(session: ActiveTestSession) {
  try {
    window.localStorage.setItem(ACTIVE_TEST_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage write failures.
  }
}

export function clearActiveTestSession() {
  try {
    window.localStorage.removeItem(ACTIVE_TEST_SESSION_KEY);
  } catch {
    // Ignore storage write failures.
  }
}
