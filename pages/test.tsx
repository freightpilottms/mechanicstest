import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { DIFFICULTY_LABELS, TIME_LIMITS, type Difficulty } from "@/lib/mock-questions";
import { useLocale } from "@/lib/locale-context";
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
import type { LeaderboardEntry } from "@/lib/leaderboard";
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

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getRank(score: number) {
  if (score >= 9) return "Master Tech";
  if (score >= 7) return "Advanced";
  if (score >= 5) return "Intermediate";
  return "Beginner";
}

function getRankBs(score: number) {
  if (score >= 9) return "Master mehaničar";
  if (score >= 7) return "Napredni mehaničar";
  if (score >= 5) return "Srednji mehaničar";
  return "Početnik";
}

function difficultyBadgeClasses(difficulty: Difficulty) {
  if (difficulty === "easy") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (difficulty === "medium") return "border-sky-500/30 bg-sky-500/10 text-sky-300";
  return "border-orange-500/30 bg-orange-500/10 text-orange-300";
}

function getDifficultyText(difficulty: Difficulty, isBs: boolean) {
  return DIFFICULTY_LABELS[difficulty][isBs ? "bs" : "en"];
}

function buildLocalFallbackEvaluation(answer: string, isBs: boolean): EvaluatedResult {
  const score = answer.trim() ? 4 : 0;

  return {
    score,
    rank: isBs ? getRankBs(score) : getRank(score),
    feedback: isBs
      ? "Privremena ocjena jer AI evaluator nije vratio rezultat."
      : "Temporary score because AI evaluator did not return a result.",
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

function modeLabel(mode: string, isBs: boolean) {
  if (mode === "eu") return isBs ? "Evropska vozila" : "European Cars";
  if (mode === "us") return isBs ? "Američka vozila" : "US Cars";
  if (mode === "asia") return isBs ? "Azijska vozila" : "Asia Cars";
  return isBs ? "Dijagnostika svih vozila" : "All Cars Diagnosis";
}

function verdictChip(verdict: EvaluatedResult["verdict"]) {
  if (verdict === "correct") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (verdict === "very_close") return "border-sky-500/30 bg-sky-500/10 text-sky-300";
  if (verdict === "partial") return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
  if (verdict === "weak") return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  return "border-red-500/30 bg-red-500/10 text-red-300";
}

function verdictText(verdict: EvaluatedResult["verdict"], isBs: boolean) {
  if (verdict === "correct") return isBs ? "Tačno" : "Correct";
  if (verdict === "very_close") return isBs ? "Vrlo blizu" : "Very Close";
  if (verdict === "partial") return isBs ? "Djelimično" : "Partial";
  if (verdict === "weak") return isBs ? "Slabo" : "Weak";
  return isBs ? "Netačno" : "Wrong";
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

export default function TestPage() {
  const router = useRouter();
  const { locale } = useLocale();
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

  const sessionIdRef = useRef(buildTestSessionId(testMode, locale));
  const leaderboardSubmittedRef = useRef(false);

  useEffect(() => {
    sessionIdRef.current = buildTestSessionId(testMode, locale);
  }, [testMode, locale]);

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

        const res = await fetch(
          `/api/scenarios/test-set?count=10&locale=${encodeURIComponent(locale)}&mode=${encodeURIComponent(testMode)}`
        );
        const data = await res.json();

        if (!res.ok || !data?.ok || !Array.isArray(data?.scenarios)) {
          throw new Error(data?.error || "Failed to load test scenarios");
        }

        if (cancelled) return;

        const nextQuestions = data.scenarios as ScenarioQuestion[];
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

  function handleQuit() {
    const confirmed = window.confirm(isBs ? "Tako lako odustaješ?" : "Giving up that easily?");
    if (!confirmed) return;
    clearActiveTestSession();
    router.push("/single-player");
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
      const fallback = buildLocalFallbackEvaluation(answerState.answer, isBs);

      const score = ai?.score ?? fallback.score;
      const rank = isBs ? getRankBs(score) : getRank(score);

      return {
        question,
        answerState,
        evaluation: {
          score,
          rank,
          feedback: ai
            ? isBs
              ? `Ocjena: ${ai.score} / 10 — ${ai.reason_short || "AI evaluator je obradio odgovor."}`
              : `Score: ${ai.score} / 10 — ${ai.reason_short || "AI evaluator processed the answer."}`
            : fallback.feedback,
          diagnosisPercent: ai?.diagnosis_percent ?? fallback.diagnosisPercent,
          bonus: ai?.bonus ?? fallback.bonus,
          verdict: ai?.verdict ?? fallback.verdict,
          matchedCause: ai?.matched_cause ?? fallback.matchedCause,
        } as EvaluatedResult,
      };
    });
  }, [answers, aiResults, isBs, questions]);

  const averageScore = useMemo(() => {
    if (!results.length) return 0;
    const total = results.reduce((sum, item) => sum + item.evaluation.score, 0);
    return Number((total / results.length).toFixed(1));
  }, [results]);

  const finalRank = isBs ? getRankBs(averageScore) : getRank(averageScore);
  const answeredCount = answers.filter((entry) => entry?.answer?.trim().length > 0).length;
  const timedOutCount = answers.filter((entry) => entry?.timedOut).length;

  useEffect(() => {
    if (!finished || evaluating || !results.length || leaderboardSubmittedRef.current) return;

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
    }).catch(() => {});
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
  ]);

  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#090b10] text-white">
        <div className="absolute inset-0 scale-105 bg-cover bg-center opacity-45 blur-[9px]" style={{ backgroundImage: "url('/garage-bg.jpg')" }} />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-3 sm:px-6 lg:px-8">
          <div className="mx-auto mt-10 w-full max-w-[1280px] rounded-[30px] border border-white/10 bg-white/5 p-8 backdrop-blur-md">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-400">
              Mechanic IQ Test
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">
              {isBs ? "Učitavanje testa..." : "Loading test..."}
            </h1>
          </div>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#090b10] text-white">
        <div className="absolute inset-0 scale-105 bg-cover bg-center opacity-45 blur-[9px]" style={{ backgroundImage: "url('/garage-bg.jpg')" }} />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-3 sm:px-6 lg:px-8">
          <div className="mx-auto mt-10 w-full max-w-[1280px] rounded-[30px] border border-red-500/20 bg-red-500/10 p-8 backdrop-blur-md">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-red-300">
              {isBs ? "Greška" : "Error"}
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">
              {isBs ? "Test nije učitan" : "Test failed to load"}
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
                {isBs ? "Pokušaj ponovo" : "Try Again"}
              </button>
              <Link
                href="/single-player"
                className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-center font-bold text-zinc-100 transition hover:bg-white/10"
              >
                {isBs ? "Nazad" : "Back"}
              </Link>
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
        <div className="absolute inset-0 scale-105 bg-cover bg-center opacity-45 blur-[9px]" style={{ backgroundImage: "url('/garage-bg.jpg')" }} />
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-3 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
            <Link
              href="/single-player"
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
            >
              ← {isBs ? "Nazad" : "Back"}
            </Link>
            <h1 className="text-xl font-bold">{isBs ? "Rezultati testa" : "Test Results"}</h1>
          </header>

          <div className="mx-auto w-full max-w-[1280px] py-6 overflow-visible">
            <section className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md sm:p-8">
                <div className="inline-flex items-center rounded-full border border-orange-500/35 bg-orange-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">
                  {isBs ? "Završen test" : "Completed Test"}
                </div>

                <h2 className="mt-6 text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl">
                  {isBs ? "Tvoj rezultat" : "Your Score"}
                </h2>

                <p className="mt-4 text-xl leading-8 text-zinc-200">
                  {isBs
                    ? "Dijagnosticiraj kvar, povećaj svoj rank i dokaži znanje."
                    : "Diagnose the fault, increase your rank and prove knowledge."}
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{isBs ? "Prosjek" : "Average"}</p>
                    <p className="mt-2 text-3xl font-black text-white">{averageScore.toFixed(1)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{isBs ? "Rank" : "Rank"}</p>
                    <p className="mt-2 text-2xl font-black text-orange-300">{finalRank}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{isBs ? "Odgovoreno" : "Answered"}</p>
                    <p className="mt-2 text-3xl font-black text-white">{answeredCount}/{results.length}</p>
                  </div>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      clearActiveTestSession();
                      router.replace(`/test?mode=${encodeURIComponent(testMode)}`);
                    }}
                    className="rounded-2xl bg-orange-500 px-5 py-4 font-bold text-black transition hover:bg-orange-400"
                  >
                    {isBs ? "Igraj ponovo" : "Play Again"}
                  </button>
                  <Link
                    href="/single-player"
                    className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-center font-bold text-zinc-100 transition hover:bg-white/10"
                  >
                    {isBs ? "Promijeni mod" : "Change Mode"}
                  </Link>
                </div>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300">
                    ⊕
                  </div>
                  <h3 className="text-[34px] font-black tracking-tight text-white">
                    {isBs ? "Sažetak" : "Summary"}
                  </h3>
                </div>

                <div className="mt-7 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-zinc-200">
                    {isBs ? "Mod" : "Mode"}: <span className="font-bold text-white">{modeLabel(testMode, isBs)}</span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-zinc-200">
                    {isBs ? "Pitanja" : "Questions"}: <span className="font-bold text-white">{results.length}</span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-zinc-200">
                    {isBs ? "Isteklo vremena" : "Timed Out"}: <span className="font-bold text-white">{timedOutCount}</span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-zinc-200">
                    {isBs ? "AI evaluacija" : "AI Evaluation"}: <span className="font-bold text-white">{evaluating ? (isBs ? "U toku..." : "In progress...") : (isBs ? "Završeno" : "Completed")}</span>
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
                      {isBs ? "Pitanje" : "Question"} {index + 1}
                    </div>
                    <div className={`rounded-full border px-4 py-2 text-sm font-semibold ${difficultyBadgeClasses(item.question.difficulty)}`}>
                      {getDifficultyText(item.question.difficulty, isBs)}
                    </div>
                    <div className={`rounded-full border px-4 py-2 text-sm font-semibold ${verdictChip(item.evaluation.verdict)}`}>
                      {verdictText(item.evaluation.verdict, isBs)}
                    </div>
                    <div className="ml-auto rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-300">
                      {item.evaluation.score}/10
                    </div>
                  </div>

                  <div className="mt-5 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-orange-400">{isBs ? "Vozilo" : "Vehicle"}</p>
                        <p className="mt-2 text-lg font-bold text-white">{item.question.vehicle || "—"}</p>
                      </div>

                      {item.question.title ? (
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-orange-400">{isBs ? "Scenario" : "Scenario"}</p>
                          <p className="mt-2 text-zinc-200">{item.question.title}</p>
                        </div>
                      ) : null}

                      {renderList(item.question.symptoms) ? (
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-orange-400">{isBs ? "Simptomi" : "Symptoms"}</p>
                          <div className="mt-2">{renderList(item.question.symptoms)}</div>
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-orange-400">{isBs ? "Tvoj odgovor" : "Your Answer"}</p>
                        <p className="mt-3 whitespace-pre-wrap text-zinc-100">
                          {item.answerState.answer?.trim()
                            ? item.answerState.answer
                            : isBs
                            ? "Nema odgovora."
                            : "No answer."}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-orange-400">{isBs ? "Povratna informacija" : "Feedback"}</p>
                        <p className="mt-3 text-zinc-200">{item.evaluation.feedback}</p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">{isBs ? "Dijagnoza" : "Diagnosis"}</p>
                          <p className="mt-2 text-2xl font-black text-white">{item.evaluation.diagnosisPercent}%</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">{isBs ? "Bonus" : "Bonus"}</p>
                          <p className="mt-2 text-2xl font-black text-white">+{item.evaluation.bonus}</p>
                        </div>
                      </div>

                      {item.evaluation.matchedCause ? (
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-orange-400">{isBs ? "Prepoznat uzrok" : "Matched Cause"}</p>
                          <p className="mt-3 text-zinc-100">{item.evaluation.matchedCause}</p>
                        </div>
                      ) : null}

                      <div className="grid gap-4 lg:grid-cols-3">
                        {item.question.answer_main ? (
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs uppercase tracking-[0.22em] text-orange-400">{isBs ? "Najvjerovatniji uzrok" : "Most Likely Cause"}</p>
                            <p className="mt-3 text-sm leading-6 text-zinc-200">{item.question.answer_main}</p>
                          </div>
                        ) : null}

                        {item.question.answer_why_no_code ? (
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs uppercase tracking-[0.22em] text-orange-400">{isBs ? "Zašto ECU ne baca grešku" : "Why ECU May Not Set a Fault"}</p>
                            <p className="mt-3 text-sm leading-6 text-zinc-200">{item.question.answer_why_no_code}</p>
                          </div>
                        ) : null}

                        {Array.isArray(item.question.answer_proof) && item.question.answer_proof.length ? (
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs uppercase tracking-[0.22em] text-orange-400">{isBs ? "Kako dokazati" : "How to Prove It"}</p>
                            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-200">
                              {item.question.answer_proof.map((proofItem, proofIndex) => (
                                <li
                                  key={proofIndex}
                                  className="rounded-xl border border-white/8 bg-white/5 px-3 py-2"
                                >
                                  {proofItem}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <footer className="pb-2 pt-4 text-center text-xs tracking-[0.14em] text-zinc-500">
              © ZEDA&apos;S Group LTD | AK Solutions
            </footer>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090b10] text-white">
      <div className="absolute inset-0 scale-105 bg-cover bg-center opacity-45 blur-[9px]" style={{ backgroundImage: "url('/garage-bg.jpg')" }} />
      <div className="absolute inset-0 bg-black/40" />

      {showFloatingTimer ? (
        <div className="fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-black/70 px-5 py-2 text-sm font-bold text-white backdrop-blur-md lg:hidden">
          {formatTime(timeLeft)}
        </div>
      ) : null}

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-3 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
          <Link
            href="/single-player"
            className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
          >
            ← {isBs ? "Nazad" : "Back"}
          </Link>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-semibold text-zinc-200">
            <span>{modeLabel(testMode, isBs)}</span>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1280px] py-6 overflow-visible">
          <section className="grid items-start gap-6 xl:grid-cols-[1fr_0.92fr]">
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/35 bg-orange-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">
                <span>🛠️</span>
                <span>{isBs ? "Test u toku" : "Test in progress"}</span>
              </div>

              <h2 className="mt-6 text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl">
                {isBs ? "Dijagnosticiraj kvar" : "Diagnose the fault"}
              </h2>

              <p className="mt-4 text-lg leading-8 text-zinc-200">
                {isBs
                  ? "Napiši najvjerovatniji uzrok i po želji dodaj kako bi potvrdio kvar."
                  : "Write the most likely root cause and optionally add how you would confirm it."}
              </p>

              <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 sm:rounded-2xl sm:p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400 sm:text-xs sm:tracking-[0.2em]">
                    {isBs ? "Pitanje" : "Question"}
                  </p>
                  <p className="mt-1 text-xl font-black text-white sm:mt-2 sm:text-3xl">
                    {currentIndex + 1}/{questions.length}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-3 sm:rounded-2xl sm:p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400 sm:text-xs sm:tracking-[0.2em]">
                    {isBs ? "Vrijeme" : "Timer"}
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
                    {isBs ? "Težina" : "Difficulty"}
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
                  <span>{isBs ? "Napredak" : "Progress"}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all ${
                      timerCritical
                        ? "bg-red-400"
                        : timerWarning
                        ? "bg-yellow-400"
                        : "bg-orange-500"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-8 space-y-6">
                {currentQuestion?.vehicle ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                      {isBs ? "Vozilo" : "Vehicle"}
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">{currentQuestion.vehicle}</p>
                  </div>
                ) : null}

                {currentQuestion?.title ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                      {isBs ? "Scenario" : "Scenario"}
                    </p>
                    <p className="mt-2 text-zinc-200">{currentQuestion.title}</p>
                  </div>
                ) : null}

                {Array.isArray(currentQuestion?.symptoms) && currentQuestion.symptoms.length ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                      {isBs ? "Simptomi" : "Symptoms"}
                    </p>
                    <div className="mt-3">{renderList(currentQuestion.symptoms)}</div>
                  </div>
                ) : null}

                {Array.isArray(currentQuestion?.driving) && currentQuestion.driving.length ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                      {isBs ? "Tok vožnje" : "Driving"}
                    </p>
                    <div className="mt-3">{renderList(currentQuestion.driving)}</div>
                  </div>
                ) : null}

                {Array.isArray(currentQuestion?.extra) && currentQuestion.extra.length ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                      {isBs ? "Dodatno" : "Extra"}
                    </p>
                    <div className="mt-3">{renderList(currentQuestion.extra)}</div>
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
                    {isBs ? "Odgovor" : "Answer"}
                  </h3>
                </div>

                <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-300">
                  {isBs
                    ? "Upiši najvjerovatniji uzrok. Dodatno možeš navesti kako bi najlakše dokazao kvar."
                    : "Write the most likely root cause. You can also add how you would best confirm the fault."}
                </div>

                {Array.isArray(currentQuestion?.questions) && currentQuestion.questions.length ? (
                  <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                      {isBs ? "Pitanje" : "Question"}
                    </p>
                    <p className="mt-3 text-lg font-semibold leading-8 text-white">
                      {currentQuestion.questions[0]}
                    </p>
                  </div>
                ) : null}

                <div className="mt-6">
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => updateAnswer(e.target.value)}
                    placeholder={
                      isBs
                        ? "Upiši svoj odgovor ovdje..."
                        : "Write your answer here..."
                    }
                    className="min-h-[280px] w-full rounded-[24px] border border-white/10 bg-black/30 p-5 text-base leading-7 text-white outline-none transition placeholder:text-zinc-500 focus:border-orange-500/40 focus:bg-black/40"
                  />
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleQuit}
                    className="rounded-2xl border border-white/12 bg-white/5 px-5 py-4 font-bold text-white transition hover:bg-white/10"
                  >
                    {isBs ? "Odustani" : "Quit"}
                  </button>

                  <button
                    type="button"
                    onClick={() => saveAndAdvance(false)}
                    className="rounded-2xl bg-orange-500 px-5 py-4 font-bold text-black transition hover:bg-orange-400"
                  >
                    {currentIndex === questions.length - 1
                      ? isBs
                        ? "Završi test"
                        : "Finish Test"
                      : isBs
                      ? "Odgovori"
                      : "Submit"}
                  </button>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                      {isBs ? "Vrijeme za pitanje" : "Question Time"}
                    </p>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full transition-all ${
                          timerCritical
                            ? "bg-red-400"
                            : timerWarning
                            ? "bg-yellow-400"
                            : "bg-orange-500"
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, timerPercent))}%` }}
                      />
                    </div>
                    <p className="mt-3 text-lg font-bold text-white">{formatTime(timeLeft)}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-300">
                    {isBs
                      ? "Ako vrijeme istekne, pitanje se automatski zaključava i prelaziš na sljedeće."
                      : "If time runs out, the question locks automatically and moves to the next one."}
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