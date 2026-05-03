import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { DIFFICULTY_LABELS, TIME_LIMITS, type Difficulty } from "@/lib/mock-questions";
import { useLocale } from "@/lib/locale-context";
import { getMessages } from "@/lib/i18n";
import {
  buildTestSessionId,
  clearActiveTestSession,
  readActiveTestSession,
  writeActiveTestSession,
  type ActiveTestSession,
  type AiEvaluation,
  type AnswerState,
  type ScenarioQuestion,
} from "@/lib/test-session";
import type { LeaderboardEntry, LeaderboardPlayerStats } from "@/lib/leaderboard";
import {
  getLocalPlayerName,
  getOrCreateLocalPlayerKey,
  saveLocalLeaderboardEntry,
} from "@/lib/leaderboard";

type EvaluatedResult = {
  score: number;
  rank: string;
  feedback: string;
  diagnosisPercent: number;
  bonus: number;
  verdict: "correct" | "very_close" | "partial" | "weak" | "wrong";
  matchedCause: string;
};

type Messages = ReturnType<typeof getMessages>;

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function truncateText(text: string, maxLength = 120) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

function PreviewCard({
  title,
  content,
  buttonText,
  onOpen,
}: {
  title: string;
  content: string | string[];
  buttonText: string;
  onOpen: () => void;
}) {
  const preview = Array.isArray(content) ? content[0] || "" : truncateText(content, 140);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-orange-400">{title}</p>

      {Array.isArray(content) ? (
        <div className="mt-3 space-y-2">
          <div className="rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm leading-6 text-zinc-200">
            {preview}
          </div>
          {content.length > 1 ? (
            <button
              type="button"
              onClick={onOpen}
              className="text-sm font-semibold text-orange-300 transition hover:text-orange-200"
            >
              {buttonText}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <p className="text-sm leading-6 text-zinc-200">{preview}</p>
          {content.length > 140 ? (
            <button
              type="button"
              onClick={onOpen}
              className="text-sm font-semibold text-orange-300 transition hover:text-orange-200"
            >
              {buttonText}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function getRank(score: number, isBs: boolean) {
  if (isBs) {
    if (score >= 9) return "Majstor dijagnostike";
    if (score >= 7) return "Dobar majstor";
    if (score >= 5) return "Uhodan";
    return "Šegrt";
  }

  if (score >= 9) return "Master Tech";
  if (score >= 7) return "Advanced";
  if (score >= 5) return "Intermediate";
  return "Beginner";
}

function difficultyBadgeClasses(difficulty: Difficulty) {
  if (difficulty === "easy") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (difficulty === "medium") return "border-sky-500/30 bg-sky-500/10 text-sky-300";
  return "border-orange-500/30 bg-orange-500/10 text-orange-300";
}

function getDifficultyText(difficulty: Difficulty, isBs: boolean) {
  return DIFFICULTY_LABELS[difficulty][isBs ? "bs" : "en"];
}

function buildLocalFallbackEvaluation(answer: string, isBs: boolean, t: Messages): EvaluatedResult {
  const score = answer.trim() ? 4 : 0;

  return {
    score,
    rank: getRank(score, isBs),
    feedback: t.temporaryScore,
    diagnosisPercent: score > 0 ? 50 : 0,
    bonus: 0,
    verdict: score > 0 ? "partial" : "wrong",
    matchedCause: "",
  };
}

function getRemainingSeconds(deadlineAt: number, fallbackTimeLeft: number) {
  if (!deadlineAt) return fallbackTimeLeft;
  return Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000));
}

function modeLabel(mode: string, t: Messages) {
  if (mode === "eu") return t.modeEuropean;
  if (mode === "us") return t.modeUs;
  if (mode === "asia") return t.modeAsia;
  return t.modeAllCars;
}

function verdictChip(verdict: EvaluatedResult["verdict"]) {
  if (verdict === "correct") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (verdict === "very_close") return "border-sky-500/30 bg-sky-500/10 text-sky-300";
  if (verdict === "partial") return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
  if (verdict === "weak") return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  return "border-red-500/30 bg-red-500/10 text-red-300";
}

function verdictText(verdict: EvaluatedResult["verdict"], t: Messages) {
  if (verdict === "correct") return t.verdictCorrect;
  if (verdict === "very_close") return t.verdictVeryClose;
  if (verdict === "partial") return t.verdictPartial;
  if (verdict === "weak") return t.verdictWeak;
  return t.verdictWrong;
}

function renderList(items?: string[]) {
  if (!Array.isArray(items) || !items.length) return null;
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex items-start gap-3 text-[15px] leading-7 text-zinc-200">
          <span className="mt-1 text-zinc-400">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function formatVehicleValue(label: string, value: unknown, t: Messages) {
  if (typeof value === "boolean") return value ? t.yes : t.no;
  if (typeof value === "number") {
    if (label === t.power) return `${value} kW`;
    return String(value);
  }
  if (!value) return "";

  const raw = String(value);
  if (raw === "petrol") return t.petrol;
  if (raw === "diesel") return t.diesel;
  if (raw === "turbo") return t.turbo;
  if (raw === "na") return t.naturallyAspirated;
  if (raw === "belt") return t.belt;
  if (raw === "chain") return t.chain;
  return raw;
}

function getVehicleDetails(question: ScenarioQuestion, t: Messages) {
  const notes = question.scoring_notes || {};
  const rows = [
    { label: t.year, value: question.year ?? notes.year },
    { label: t.power, value: question.power_kw ?? notes.power_kw },
    { label: t.engineCode, value: question.engine_code ?? notes.engine_code },
    { label: t.fuel, value: question.fuel_type ?? notes.fuel_type },
    { label: t.induction, value: question.induction ?? notes.induction },
    { label: t.timing, value: question.timing_type ?? notes.timing_type },
    { label: t.emissions, value: question.emission_standard ?? notes.emission_standard },
    { label: t.dpf, value: question.has_dpf ?? notes.has_dpf },
    { label: t.startStop, value: question.has_start_stop ?? notes.has_start_stop },
  ];

  return rows
    .map((row) => ({ ...row, value: formatVehicleValue(row.label, row.value, t) }))
    .filter((row) => row.value);
}

function VehicleDetails({
  question,
  t,
}: {
  question: ScenarioQuestion;
  t: Messages;
}) {
  const details = getVehicleDetails(question, t);

  if (!details.length) return null;

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
        {t.vehicleDetails}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {details.map((row) => (
          <div
            key={row.label}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {row.label}
            </p>
            <p className="mt-1 text-sm font-bold text-zinc-100">{row.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const PLAYED_SCENARIOS_KEY = "mechanic_test_played_scenarios_v1";
const LAST_ENTRY_KEY = "mechanic_test_last_entry";

function readPlayedScenarioIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PLAYED_SCENARIOS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writePlayedScenarioIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    const unique = Array.from(new Set(ids)).slice(-200);
    localStorage.setItem(PLAYED_SCENARIOS_KEY, JSON.stringify(unique));
  } catch {}
}

function readLastEntryPath() {
  if (typeof window === "undefined") return "/single-player";
  try {
    const raw = localStorage.getItem(LAST_ENTRY_KEY);
    if (raw === "multiplayer" || raw === "/multiplayer") return "/multiplayer";
    return "/single-player";
  } catch {
    return "/single-player";
  }
}

function rememberLastEntry(value: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_ENTRY_KEY, value === "multiplayer" ? "multiplayer" : "single-player");
  } catch {}
}

export default function TestPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const t = useMemo(() => getMessages(locale), [locale]);
  const testMode = String(router.query.mode || "all");
  const isBs = locale === "bs";

  const [questions, setQuestions] = useState<ScenarioQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [questionDeadlineAt, setQuestionDeadlineAt] = useState(0);
  const [timerReady, setTimerReady] = useState(false);
  const [aiResults, setAiResults] = useState<(AiEvaluation | null)[]>([]);
  const [evaluating, setEvaluating] = useState(false);
  const [showFloatingTimer, setShowFloatingTimer] = useState(false);
  const [detailModal, setDetailModal] = useState<{
    title: string;
    content: string | string[];
  } | null>(null);
  const [globalPlayerStats, setGlobalPlayerStats] =
    useState<LeaderboardPlayerStats | null>(null);

  const sessionIdRef = useRef(buildTestSessionId(testMode, locale));
  const leaderboardSubmittedRef = useRef(false);
  const entryPathRef = useRef("/single-player");

  useEffect(() => {
    sessionIdRef.current = buildTestSessionId(testMode, locale);
  }, [testMode, locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = readLastEntryPath();
    entryPathRef.current = saved;

    if (saved === "/single-player" && document.referrer) {
      try {
        const refUrl = new URL(document.referrer);
        if (refUrl.origin === window.location.origin) {
          if (refUrl.pathname.includes("/multiplayer")) {
            rememberLastEntry("multiplayer");
            entryPathRef.current = "/multiplayer";
          } else if (refUrl.pathname.includes("/single-player")) {
            rememberLastEntry("single-player");
            entryPathRef.current = "/single-player";
          }
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTestSet() {
      try {
        setLoading(true);
        setLoadError("");

        const expectedSessionId = buildTestSessionId(testMode, locale);
        const existingSession = readActiveTestSession();

        if (
          existingSession &&
          !existingSession.finished &&
          existingSession.sessionId === expectedSessionId &&
          Array.isArray(existingSession.questions) &&
          existingSession.questions.length
        ) {
          if (cancelled) return;

          setQuestions(existingSession.questions);
          setAnswers(existingSession.answers);
          setAiResults(existingSession.aiResults);
          setCurrentIndex(existingSession.currentIndex);
          setFinished(existingSession.finished);
          setEvaluating(existingSession.evaluating);
          setQuestionDeadlineAt(existingSession.questionDeadlineAt);
          setTimeLeft(
            getRemainingSeconds(existingSession.questionDeadlineAt, existingSession.timeLeft)
          );
          setTimerReady(true);
          return;
        }

        const playedIds = readPlayedScenarioIds();

        const params = new URLSearchParams({
          count: "10",
          locale,
          mode: testMode,
        });

        if (playedIds.length) {
          params.set("excludeIds", playedIds.join(","));
        }

        const res = await fetch(`/api/scenarios/test-set?${params.toString()}`);
        const data = await res.json();

        if (!res.ok || !data?.ok || !Array.isArray(data?.scenarios)) {
          throw new Error(data?.error || "Failed to load test scenarios");
        }

        if (cancelled) return;

        const nextQuestions = data.scenarios as ScenarioQuestion[];

        const fetchedIds = nextQuestions.map((q: any) => q?.id).filter(Boolean);
        writePlayedScenarioIds([...playedIds, ...fetchedIds]);

        const nextAnswers = nextQuestions.map(() => ({
          answer: "",
          timedOut: false,
          timeSpent: 0,
        }));
        const nextAiResults = nextQuestions.map(() => null);
        const firstTimeLimit = nextQuestions[0] ? TIME_LIMITS[nextQuestions[0].difficulty] : 0;
        const deadlineAt = Date.now() + firstTimeLimit * 1000;

        setQuestions(nextQuestions);
        setAnswers(nextAnswers);
        setAiResults(nextAiResults);
        setCurrentIndex(0);
        setFinished(false);
        setEvaluating(false);
        setQuestionDeadlineAt(deadlineAt);
        setTimeLeft(firstTimeLimit);
        setTimerReady(true);
      } catch (err: any) {
        if (!cancelled) setLoadError(String(err?.message || err || "Unknown error"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (!router.isReady) return;
    loadTestSet();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, testMode, locale]);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    function onScroll() {
      setShowFloatingTimer(window.innerWidth < 1024 && window.scrollY > 140 && !finished);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [finished, currentIndex]);

  useEffect(() => {
    if (!currentQuestion || finished || loading) return;
    if (!questionDeadlineAt) {
      const nextDeadlineAt = Date.now() + TIME_LIMITS[currentQuestion.difficulty] * 1000;
      setQuestionDeadlineAt(nextDeadlineAt);
      setTimeLeft(TIME_LIMITS[currentQuestion.difficulty]);
      setTimerReady(true);
      return;
    }

    setTimeLeft(getRemainingSeconds(questionDeadlineAt, TIME_LIMITS[currentQuestion.difficulty]));
    setTimerReady(true);
  }, [currentQuestion, finished, loading, questionDeadlineAt]);

  useEffect(() => {
    if (!currentQuestion || finished || !timerReady) return;

    const syncTimer = () => {
      const remaining = getRemainingSeconds(
        questionDeadlineAt,
        TIME_LIMITS[currentQuestion.difficulty]
      );
      setTimeLeft(remaining);
      if (remaining <= 0) {
        saveAndAdvance(true);
        return true;
      }
      return false;
    };

    if (syncTimer()) return;

    const timer = window.setInterval(() => {
      syncTimer();
    }, 1000);

    return () => window.clearInterval(timer);
  }, [currentQuestion, finished, timerReady, questionDeadlineAt]);

  useEffect(() => {
    if (loading || !questions.length || finished) return;

    const session: ActiveTestSession = {
      sessionId: sessionIdRef.current,
      mode: testMode,
      locale,
      questions,
      answers,
      aiResults,
      currentIndex,
      timeLeft,
      questionDeadlineAt,
      finished,
      evaluating,
      updatedAt: Date.now(),
    };

    writeActiveTestSession(session);
  }, [
    loading,
    questions,
    finished,
    testMode,
    locale,
    answers,
    aiResults,
    currentIndex,
    timeLeft,
    questionDeadlineAt,
    evaluating,
  ]);

  useEffect(() => {
    if (!finished) return;
    clearActiveTestSession();
  }, [finished]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (finished || loading) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [finished, loading]);

  function updateAnswer(value: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = {
        ...next[currentIndex],
        answer: value,
      };
      return next;
    });
  }

  function saveAndAdvance(timedOut = false) {
    if (!currentQuestion) return;

    const allowed = TIME_LIMITS[currentQuestion.difficulty];
    const remaining = getRemainingSeconds(questionDeadlineAt, timeLeft);
    const spent = Math.max(0, Math.min(allowed, allowed - remaining));

    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = {
        ...next[currentIndex],
        timedOut,
        timeSpent: spent,
      };
      return next;
    });

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextQuestion = questions[nextIndex];
      const nextTimeLimit = nextQuestion ? TIME_LIMITS[nextQuestion.difficulty] : 0;
      setCurrentIndex(nextIndex);
      setQuestionDeadlineAt(Date.now() + nextTimeLimit * 1000);
      setTimeLeft(nextTimeLimit);
      setTimerReady(true);
      return;
    }

    setFinished(true);
    setQuestionDeadlineAt(0);
    setTimeLeft(0);
    setTimeout(() => {
      evaluateAllAnswers();
    }, 0);
  }

  function resolveEntryPath() {
    return entryPathRef.current || readLastEntryPath() || "/single-player";
  }

  function handleQuit() {
    const confirmed = window.confirm(t.quitConfirm);
    if (!confirmed) return;
    clearActiveTestSession();
    router.push(resolveEntryPath());
  }

  async function evaluateAllAnswers() {
    if (!questions.length) return;

    setEvaluating(true);

    try {
      const settled = await Promise.all(
        questions.map(async (question, index) => {
          const userAnswer = answers[index]?.answer || "";

          try {
            const res = await fetch("/api/evaluate-answer", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                question,
                userAnswer,
                locale,
              }),
            });

            const data = await res.json();

            if (!res.ok || !data?.ok || !data?.result) {
              return null;
            }

            return data.result as AiEvaluation;
          } catch {
            return null;
          }
        })
      );

      setAiResults(settled);
    } finally {
      setEvaluating(false);
    }
  }

  const progress = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const currentAnswer = answers[currentIndex]?.answer || "";
  const currentTimeLimit = currentQuestion ? TIME_LIMITS[currentQuestion.difficulty] : 0;
  const timerPercent = currentTimeLimit ? (timeLeft / currentTimeLimit) * 100 : 0;
  const timerWarning = timeLeft <= 30;
  const timerCritical = timeLeft <= 10;

  const results = useMemo(() => {
    return questions.map((question, index) => {
      const answerState = answers[index] || { answer: "", timedOut: false, timeSpent: 0 };
      const ai = aiResults[index];
      const fallback = buildLocalFallbackEvaluation(answerState.answer, isBs, t);

      const score = ai?.score ?? fallback.score;
      const rank = getRank(score, isBs);

      return {
        question,
        answerState,
        evaluation: {
          score,
          rank,
          feedback: ai
            ? isBs
              ? `${t.scoreLabel}: ${ai.score} / 10 — ${ai.reason_short || t.evaluationProcessed}`
              : `${t.scoreLabel}: ${ai.score} / 10 — ${ai.reason_short || t.evaluationProcessed}`
            : fallback.feedback,
          diagnosisPercent: ai?.diagnosis_percent ?? fallback.diagnosisPercent,
          bonus: ai?.bonus ?? fallback.bonus,
          verdict: ai?.verdict ?? fallback.verdict,
          matchedCause: ai?.matched_cause ?? fallback.matchedCause,
        } as EvaluatedResult,
      };
    });
  }, [answers, aiResults, isBs, questions, t]);

  const averageScore = useMemo(() => {
    if (!results.length) return 0;
    const total = results.reduce((sum, item) => sum + item.evaluation.score, 0);
    return Number((total / results.length).toFixed(1));
  }, [results]);

  const finalRank = getRank(averageScore, isBs);
  const answeredCount = answers.filter((entry) => entry?.answer?.trim().length > 0).length;
  const timedOutCount = answers.filter((entry) => entry?.timedOut).length;
  const aiEvaluationComplete =
    questions.length > 0 &&
    aiResults.length === questions.length &&
    aiResults.every((item) => item !== null);

  useEffect(() => {
    if (
      !finished ||
      evaluating ||
      !results.length ||
      leaderboardSubmittedRef.current ||
      !aiEvaluationComplete
    ) {
      return;
    }

    const entry: LeaderboardEntry = {
      player_key: getOrCreateLocalPlayerKey(),
      player_name: getLocalPlayerName(),
      avg_score: Number(averageScore.toFixed(1)),
      total_points: results.reduce((sum, item) => sum + item.evaluation.score, 0),
      rank_label: finalRank,
      mode: String(router.query.mode || "all"),
      locale: isBs ? "bs" : "en",
      played_at: new Date().toISOString(),
      question_count: results.length,
      answered_count: answeredCount,
      timed_out_count: timedOutCount,
    };

    saveLocalLeaderboardEntry(entry);
    leaderboardSubmittedRef.current = true;

    fetch("/api/leaderboard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(entry),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && data.currentPlayer) {
          setGlobalPlayerStats(data.currentPlayer);
        }
      })
      .catch(() => {});
  }, [
    answeredCount,
    averageScore,
    evaluating,
    finalRank,
    finished,
    isBs,
    results,
    router.query.mode,
    timedOutCount,
    aiEvaluationComplete,
  ]);

  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#090b10] text-white">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center opacity-45 blur-[9px]"
          style={{ backgroundImage: "url('/garage-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-3 sm:px-6 lg:px-8">
          <div className="mx-auto mt-10 w-full max-w-[1280px] rounded-[30px] border border-white/10 bg-white/5 p-8 backdrop-blur-md">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-400">
              {t.appName}
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">
              {t.loadingTest}
            </h1>
          </div>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#090b10] text-white">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center opacity-45 blur-[9px]"
          style={{ backgroundImage: "url('/garage-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-3 sm:px-6 lg:px-8">
          <div className="mx-auto mt-10 w-full max-w-[1280px] rounded-[30px] border border-red-500/20 bg-red-500/10 p-8 backdrop-blur-md">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-red-300">
              {t.error}
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">
              {t.testFailed}
            </h1>
            <p className="mt-4 text-sm text-red-100">{loadError}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  clearActiveTestSession();
                  router.replace(`/test?mode=${encodeURIComponent(testMode)}`);
                }}
                className="rounded-2xl bg-orange-500 px-5 py-4 font-bold text-black transition hover:bg-orange-400"
              >
                {t.tryAgain}
              </button>
              <button
                type="button"
                onClick={() => router.push(resolveEntryPath())}
                className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-center font-bold text-zinc-100 transition hover:bg-white/10"
              >
                {t.back}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!currentQuestion && !finished) return null;

  if (finished) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#090b10] text-white">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center opacity-45 blur-[9px]"
          style={{ backgroundImage: "url('/garage-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-3 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
            <button
              type="button"
              onClick={handleQuit}
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
            >
              ← {t.back}
            </button>
            <h1 className="text-xl font-bold">{t.testResults}</h1>
          </header>

          <div className="mx-auto w-full max-w-[1280px] py-6 overflow-visible">
            <section className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md sm:p-8">
                <div className="inline-flex items-center rounded-full border border-orange-500/35 bg-orange-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">
                  {t.completedTest}
                </div>

                <h2 className="mt-6 text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl">
                  {t.yourScore}
                </h2>

                <p className="mt-4 text-xl leading-8 text-zinc-200">
                  {t.tagline}
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                      {t.average}
                    </p>
                    <p className="mt-2 text-3xl font-black text-white">{averageScore.toFixed(1)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                      {t.rank}
                    </p>
                    <p className="mt-2 text-2xl font-black text-orange-300">{finalRank}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                      {t.answered}
                    </p>
                    <p className="mt-2 text-3xl font-black text-white">
                      {answeredCount}/{results.length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">
                      {t.globalPosition}
                    </p>
                    <p className="mt-2 text-3xl font-black text-white">
                      {globalPlayerStats?.global_position
                        ? `${globalPlayerStats.global_position}.`
                        : "—"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-emerald-200/80">
                      {globalPlayerStats?.total_players
                        ? `${t.totalPlayers}: ${globalPlayerStats.total_players}`
                        : t.notRankedYet}
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      clearActiveTestSession();
                      router.push(resolveEntryPath());
                    }}
                    className="rounded-2xl bg-orange-500 px-5 py-4 font-bold text-black transition hover:bg-orange-400"
                  >
                    {t.playAgain}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(resolveEntryPath())}
                    className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-center font-bold text-zinc-100 transition hover:bg-white/10"
                  >
                    {t.changeMode}
                  </button>
                </div>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300">
                    ⊕
                  </div>
                  <h3 className="text-[34px] font-black tracking-tight text-white">
                    {t.summary}
                  </h3>
                </div>

                <div className="mt-7 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-zinc-200">
                    {t.mode}:{" "}
                    <span className="font-bold text-white">{modeLabel(testMode, t)}</span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-zinc-200">
                    {t.questions}:{" "}
                    <span className="font-bold text-white">{results.length}</span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-zinc-200">
                    {t.timedOut}:{" "}
                    <span className="font-bold text-white">{timedOutCount}</span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-zinc-200">
                    {t.aiEvaluation}:{" "}
                    <span className="font-bold text-white">
                      {evaluating ? t.inProgress : t.completed}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-4">
              {results.map((item, index) => (
                <div
                  key={index}
                  className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-md sm:p-6"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-200">
                      {t.question} {index + 1}
                    </div>
                    <div
                      className={`rounded-full border px-4 py-2 text-sm font-semibold ${difficultyBadgeClasses(item.question.difficulty)}`}
                    >
                      {getDifficultyText(item.question.difficulty, isBs)}
                    </div>
                    <div
                      className={`rounded-full border px-4 py-2 text-sm font-semibold ${verdictChip(item.evaluation.verdict)}`}
                    >
                      {verdictText(item.evaluation.verdict, t)}
                    </div>
                    <div className="ml-auto rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-300">
                      {item.evaluation.score}/10
                    </div>
                  </div>

                  <div className="mt-5 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                          {t.vehicle}
                        </p>
                        <p className="mt-2 text-lg font-bold text-white">{item.question.vehicle || "—"}</p>
                      </div>

                      <VehicleDetails question={item.question} t={t} />

                      {item.question.title ? (
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                            {t.scenario}
                          </p>
                          <p className="mt-2 text-zinc-200">{item.question.title}</p>
                        </div>
                      ) : null}

                      {renderList(item.question.symptoms) ? (
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                            {t.symptoms}
                          </p>
                          <div className="mt-2">{renderList(item.question.symptoms)}</div>
                        </div>
                      ) : null}

                      {renderList(item.question.driving) ? (
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                            {t.driving}
                          </p>
                          <div className="mt-2">{renderList(item.question.driving)}</div>
                        </div>
                      ) : null}

                      {renderList(item.question.extra) ? (
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                            {t.extra}
                          </p>
                          <div className="mt-2">{renderList(item.question.extra)}</div>
                        </div>
                      ) : null}

                      {renderList(item.question.hint) ? (
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                            {t.scannerHint}
                          </p>
                          <div className="mt-2">{renderList(item.question.hint)}</div>
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                          {t.yourAnswer}
                        </p>
                        <p className="mt-3 whitespace-pre-wrap text-zinc-100">
                          {item.answerState.answer?.trim()
                            ? item.answerState.answer
                            : t.noAnswer}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                          {t.feedback}
                        </p>
                        <p className="mt-3 text-zinc-200">{item.evaluation.feedback}</p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">
                            {t.diagnosis}
                          </p>
                          <p className="mt-2 text-2xl font-black text-white">
                            {item.evaluation.diagnosisPercent}%
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">
                            {t.bonus}
                          </p>
                          <p className="mt-2 text-2xl font-black text-white">+{item.evaluation.bonus}</p>
                        </div>
                      </div>

                      {item.evaluation.matchedCause ? (
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                            {t.matchedCause}
                          </p>
                          <p className="mt-3 text-zinc-100">{item.evaluation.matchedCause}</p>
                        </div>
                      ) : null}

                      <div className="grid gap-4 lg:grid-cols-3">
                        {item.question.answer_main ? (
                          <PreviewCard
                            title={t.mostLikelyCause}
                            content={item.question.answer_main}
                            buttonText={t.showMore}
                            onOpen={() =>
                              setDetailModal({
                                title: t.mostLikelyCause,
                                content: item.question.answer_main || "",
                              })
                            }
                          />
                        ) : null}

                        {item.question.answer_why_no_code ? (
                          <PreviewCard
                            title={t.whyNoFault}
                            content={item.question.answer_why_no_code}
                            buttonText={t.showMore}
                            onOpen={() =>
                              setDetailModal({
                                title: t.whyNoFault,
                                content: item.question.answer_why_no_code || "",
                              })
                            }
                          />
                        ) : null}

                        {Array.isArray(item.question.answer_proof) && item.question.answer_proof.length ? (
                          <PreviewCard
                            title={t.howToProve}
                            content={item.question.answer_proof}
                            buttonText={t.showMore}
                            onOpen={() =>
                              setDetailModal({
                                title: t.howToProve,
                                content: item.question.answer_proof || [],
                              })
                            }
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {detailModal ? (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
                <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#11151c] p-5 shadow-2xl backdrop-blur-md sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-2xl font-black tracking-tight text-white">{detailModal.title}</h3>

                    <button
                      type="button"
                      onClick={() => setDetailModal(null)}
                      className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-bold text-zinc-200 transition hover:bg-white/10"
                    >
                      {t.close}
                    </button>
                  </div>

                  <div className="mt-5 max-h-[70vh] overflow-y-auto pr-1">
                    {Array.isArray(detailModal.content) ? (
                      <ul className="space-y-3">
                        {detailModal.content.map((item, index) => (
                          <li
                            key={index}
                            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-zinc-200"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-200">
                        {detailModal.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            <footer className="pb-2 pt-4 text-center text-xs tracking-[0.14em] text-zinc-500">
              © ZEDA&apos;S Group LTD | AK Solutions
            </footer>

            {evaluating ? (
              <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-4 backdrop-blur-md">
                <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#11151c]/95 p-6 text-center shadow-2xl">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10 text-2xl text-orange-300">
                    ⊕
                  </div>
                  <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-400">
                    {t.aiEvaluation}
                  </p>
                  <h3 className="mt-3 text-3xl font-black tracking-tight text-white">
                    {t.evaluatingTitle}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    {t.evaluatingBody}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090b10] text-white">
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center opacity-45 blur-[9px]"
        style={{ backgroundImage: "url('/garage-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/40" />

      {showFloatingTimer ? (
        <div className="fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-black/70 px-5 py-2 text-sm font-bold text-white backdrop-blur-md lg:hidden">
          {formatTime(timeLeft)}
        </div>
      ) : null}

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-3 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
          <button
            type="button"
            onClick={handleQuit}
            className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
          >
            ← {t.back}
          </button>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-semibold text-zinc-200">
            <span>{modeLabel(testMode, t)}</span>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1280px] py-6 overflow-visible">
          <section className="grid items-start gap-6 xl:grid-cols-[1fr_0.92fr]">
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/35 bg-orange-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">
                <span>🛠️</span>
                <span>{t.testInProgress}</span>
              </div>

              <h2 className="mt-6 text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl">
                {t.diagnoseFault}
              </h2>

              <p className="mt-4 text-lg leading-8 text-zinc-200">
                {t.testInstruction}
              </p>

              <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 sm:rounded-2xl sm:p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400 sm:text-xs sm:tracking-[0.2em]">
                    {t.task}
                  </p>
                  <p className="mt-1 text-xl font-black text-white sm:mt-2 sm:text-3xl">
                    {currentIndex + 1}/{questions.length}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-3 sm:rounded-2xl sm:p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400 sm:text-xs sm:tracking-[0.2em]">
                    {t.timer}
                  </p>
                  <p
                    className={`mt-1 text-xl font-black sm:mt-2 sm:text-3xl ${
                      timerCritical ? "text-red-300" : timerWarning ? "text-yellow-300" : "text-white"
                    }`}
                  >
                    {formatTime(timeLeft)}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-3 sm:rounded-2xl sm:p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400 sm:text-xs sm:tracking-[0.2em]">
                    {t.difficulty}
                  </p>
                  <div
                    className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-bold sm:mt-2 sm:px-4 sm:py-2 sm:text-sm ${difficultyBadgeClasses(
                      currentQuestion!.difficulty
                    )}`}
                  >
                    {getDifficultyText(currentQuestion!.difficulty, isBs)}
                  </div>
                </div>
              </div>

              <div className="mt-7">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  <span>{t.progress}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all ${
                      timerCritical ? "bg-red-400" : timerWarning ? "bg-yellow-400" : "bg-orange-500"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-8 space-y-6">
                {currentQuestion?.vehicle ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                      {t.vehicle}
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">{currentQuestion.vehicle}</p>
                  </div>
                ) : null}

                <VehicleDetails question={currentQuestion!} t={t} />

                {currentQuestion?.title ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                      {t.scenario}
                    </p>
                    <p className="mt-2 text-zinc-200">{currentQuestion.title}</p>
                  </div>
                ) : null}

                {Array.isArray(currentQuestion?.symptoms) && currentQuestion.symptoms.length ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                      {t.symptoms}
                    </p>
                    <div className="mt-3">{renderList(currentQuestion.symptoms)}</div>
                  </div>
                ) : null}

                {Array.isArray(currentQuestion?.driving) && currentQuestion.driving.length ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                      {t.driving}
                    </p>
                    <div className="mt-3">{renderList(currentQuestion.driving)}</div>
                  </div>
                ) : null}

                {Array.isArray(currentQuestion?.extra) && currentQuestion.extra.length ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                      {t.extra}
                    </p>
                    <div className="mt-3">{renderList(currentQuestion.extra)}</div>
                  </div>
                ) : null}

                {Array.isArray(currentQuestion?.key_details) && currentQuestion.key_details.length ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                      {t.workshopClues}
                    </p>
                    <div className="mt-3">{renderList(currentQuestion.key_details)}</div>
                  </div>
                ) : null}

                {Array.isArray(currentQuestion?.hint) && currentQuestion.hint.length ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                      {t.scannerHint}
                    </p>
                    <div className="mt-3">{renderList(currentQuestion.hint)}</div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="xl:self-start">
              <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-7 xl:sticky xl:top-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300">
                    ⊕
                  </div>
                  <h3 className="text-[34px] font-black tracking-tight text-white">
                    {t.answer}
                  </h3>
                </div>

                {Array.isArray(currentQuestion?.questions) && currentQuestion.questions.length ? (
                  <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                      {t.answerTaskTitle}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-zinc-300">
                      {t.answerTaskHelp}
                    </p>
                  </div>
                ) : null}

                <div className="mt-6">
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => updateAnswer(e.target.value)}
                    placeholder=""
                    className="min-h-[280px] w-full rounded-[24px] border border-white/10 bg-black/30 p-5 text-base leading-7 text-white outline-none transition placeholder:text-zinc-500 focus:border-orange-500/40 focus:bg-black/40"
                  />
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleQuit}
                    className="rounded-2xl border border-white/12 bg-white/5 px-5 py-4 font-bold text-white transition hover:bg-white/10"
                  >
                    {t.quit}
                  </button>

                  <button
                    type="button"
                    onClick={() => saveAndAdvance(false)}
                    className="rounded-2xl bg-orange-500 px-5 py-4 font-bold text-black transition hover:bg-orange-400"
                  >
                    {currentIndex === questions.length - 1
                      ? t.finishTest
                      : t.submit}
                  </button>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                      {t.questionTime}
                    </p>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full transition-all ${
                          timerCritical ? "bg-red-400" : timerWarning ? "bg-yellow-400" : "bg-orange-500"
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, timerPercent))}%` }}
                      />
                    </div>
                    <p className="mt-3 text-lg font-bold text-white">{formatTime(timeLeft)}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-300">
                    {t.timeoutHelp}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer className="pb-2 pt-4 text-center text-xs tracking-[0.14em] text-zinc-500">
            © ZEDA&apos;S Group LTD | AK Solutions
          </footer>
        </div>
      </div>
    </main>
  );
}
