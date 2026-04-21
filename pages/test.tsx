import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { DIFFICULTY_LABELS, TIME_LIMITS, type Difficulty } from "@/lib/mock-questions";
import type { Locale } from "@/lib/i18n";
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

function buildLocalFallbackEvaluation(
  answer: string,
  isBs: boolean
): EvaluatedResult {
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

export default function TestPage() {
  const router = useRouter();
  const { locale, setLocale } = useLocale();
  const routeLang = router.query.lang;
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
          `/api/scenarios/test-set?count=10&locale=${encodeURIComponent(locale)}`
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
        if (cancelled) return;
        setLoadError(String(err?.message || err || "Unknown error"));
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
            ? (
                isBs
                  ? `Ocjena: ${ai.score} / 10 — ${ai.reason_short || "AI evaluator je obradio odgovor."}`
                  : `Score: ${ai.score} / 10 — ${ai.reason_short || "AI evaluator processed the answer."}`
              )
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
      <main className="min-h-screen bg-[#0a0d12] px-1 py-4 text-white sm:px-2 sm:py-6 lg:px-6">
        <div className="mx-auto w-full max-w-[100vw] px-1 sm:px-2 lg:max-w-6xl lg:px-0">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-400">
              Mechanic IQ Test
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">
              {isBs ? "Učitavanje testa..." : "Loading test..."}
            </h1>
          </section>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-[#0a0d12] px-1 py-4 text-white sm:px-2 sm:py-6 lg:px-6">
        <div className="mx-auto w-full max-w-[100vw] px-1 sm:px-2 lg:max-w-6xl lg:px-0">
          <section className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-300">
              {isBs ? "Greška" : "Error"}
            </p>
            <h1 className="mt-3 text-2xl font-black tracking-tight">
              {isBs ? "Test nije učitan" : "Test failed to load"}
            </h1>
            <p className="mt-4 text-sm text-red-100">{loadError}</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  clearActiveTestSession();
                  router.replace(`/test?mode=${encodeURIComponent(testMode)}`);
                }}
                className="rounded-2xl bg-orange-500 px-5 py-3 flex-1 font-bold text-black transition hover:bg-orange-400"
              >
                {isBs ? "Pokušaj ponovo" : "Try Again"}
              </button>
              <Link
                href="/single-player"
                className="rounded-2xl border border-white/10 bg-black/20 px-5 py-3 flex-1 font-bold text-zinc-100 transition hover:bg-white/10"
              >
                {isBs ? "Nazad" : "Back"}
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!currentQuestion && !finished) {
    return null;
  }

  if (finished) {
    return (
      <main className="min-h-screen bg-[#0a0d12] px-1 py-4 text-white sm:px-2 sm:py-6 lg:px-6">
        <div className="mx-auto w-full max-w-[100vw] px-1 sm:px-2 lg:max-w-6xl lg:px-0">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-400">
              {isBs ? "Rezultati testa" : "Test Results"}
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight">
              {isBs ? "Završni pregled" : "Final Review"}
            </h1>

            <div className="mt-6 grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-4 text-orange-300">
                <div className="text-xs uppercase tracking-[0.2em] opacity-80">
                  {isBs ? "Ukupna ocjena" : "Overall Score"}
                </div>
                <div className="mt-2 text-3xl font-black">{averageScore} / 10</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-zinc-200">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {isBs ? "Rang" : "Rank"}
                </div>
                <div className="mt-2 text-xl font-black">{finalRank}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-zinc-200">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {isBs ? "Odgovoreno" : "Answered"}
                </div>
                <div className="mt-2 text-xl font-black">{answeredCount} / {questions.length}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-zinc-200">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {isBs ? "Isteklo vrijeme" : "Timed Out"}
                </div>
                <div className="mt-2 text-xl font-black">{timedOutCount}</div>
              </div>
            </div>

            {evaluating && (
              <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-4 text-sm text-orange-200">
                {isBs ? "AI ocjenjuje odgovore..." : "AI is evaluating answers..."}
              </div>
            )}

            <div className="mt-8 space-y-6">
              {results.map(({ question, answerState, evaluation }, index) => (
                <article key={question.id} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                        {isBs ? "Pitanje" : "Question"} {index + 1} • {question.vehicle}
                      </p>

                      <h2 className="mt-2 text-2xl font-black tracking-tight">{question.title}</h2>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${difficultyBadgeClasses(question.difficulty)}`}>
                        {getDifficultyText(question.difficulty, isBs)}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-300">
                        {evaluation.score} / 10
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        {isBs ? "Tvoj odgovor" : "Your Answer"}
                      </p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-200">
                        {answerState.answer?.trim() || (isBs ? "Nema odgovora." : "No answer provided.")}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                          {isBs ? "Utrošeno" : "Spent"}: {formatTime(answerState.timeSpent)}
                        </span>
                        {answerState.timedOut && (
                          <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-red-300">
                            {isBs ? "Vrijeme isteklo" : "Timed out"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        {isBs ? "Ocjena i rang" : "Score & Rank"}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-zinc-200">{evaluation.feedback}</p>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                          {isBs ? "Rang" : "Rank"}: {evaluation.rank}
                        </span>
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                          {isBs ? "Blizina dijagnoze" : "Diagnosis closeness"}: {evaluation.diagnosisPercent}%
                        </span>
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                          {isBs ? "Bonus" : "Bonus"}: +{evaluation.bonus}
                        </span>
                        {evaluation.matchedCause ? (
                          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                            {isBs ? "Prepoznato" : "Matched"}: {evaluation.matchedCause}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        {isBs ? "Najvjerovatniji uzrok" : "Most Likely Cause"}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-zinc-200">{question.answer_main}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        {isBs ? "Zašto ECU ne baca grešku" : "Why ECU May Not Set a Fault"}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-zinc-200">{question.answer_why_no_code}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        {isBs ? "Kako dokazati" : "How to Prove It"}
                      </p>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-200">
                        {question.answer_proof.map((item, proofIndex) => (
                          <li key={proofIndex} className="rounded-xl border border-white/8 bg-black/20 px-3 py-2">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/single-player"
                className="rounded-2xl bg-orange-500 px-5 py-3 flex-1 font-bold text-black transition hover:bg-orange-400"
              >
                {isBs ? "Nazad na meni" : "Back to menu"}
              </Link>

              <button
                type="button"
                onClick={() => {
                  clearActiveTestSession();
                  router.replace(`/test?mode=${encodeURIComponent(testMode)}`);
                }}
                className="rounded-2xl border border-white/10 bg-black/20 px-5 py-3 flex-1 font-bold text-zinc-100 transition hover:bg-white/10"
              >
                {isBs ? "Pokreni novi test" : "Start new test"}
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0d12] px-1 py-4 text-white sm:px-2 sm:py-6 lg:px-6">
      {showFloatingTimer ? (
        <div className="fixed right-3 top-3 z-40 rounded-2xl border border-white/10 bg-[#0f141b]/95 px-3 py-3 shadow-2xl backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              {isBs ? "Vrijeme" : "Time"}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${
                timerCritical
                  ? "border-red-500/30 bg-red-500/10 text-red-300"
                  : timerWarning
                    ? "border-orange-500/30 bg-orange-500/10 text-orange-300"
                    : "border-white/10 bg-white/5 text-zinc-300"
              }`}
            >
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="mt-3 h-1.5 w-28 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all ${
                timerCritical ? "bg-red-500" : timerWarning ? "bg-orange-500" : "bg-emerald-500"
              }`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[100vw] px-1 sm:px-2 lg:max-w-6xl lg:px-0">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-400">
                Mechanic IQ Test
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight">
                {currentQuestion?.title}
              </h1>
              <div className="mt-4 inline-flex rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-200">
                <span className="text-zinc-400">{isBs ? "Vozilo:" : "Vehicle:"}</span>
                <span className="ml-2">{currentQuestion?.vehicle}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {currentQuestion && (
                <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${difficultyBadgeClasses(currentQuestion.difficulty)}`}>
                  {getDifficultyText(currentQuestion.difficulty, isBs)}
                </span>
              )}
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-300">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-orange-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.45fr_0.85fr] xl:gap-5">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                {isBs ? "Simptomi" : "Symptoms"}
              </p>

              <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-200">
                {currentQuestion?.symptoms.map((item, index) => (
                  <li key={index} className="rounded-xl border border-white/8 bg-white/5 px-3 py-3 sm:px-4">
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    {isBs ? "Vožnja / uslovi" : "Driving / Conditions"}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
                    {currentQuestion?.driving.map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    {isBs ? "Dodatno" : "Extra"}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
                    {currentQuestion?.extra.map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {currentQuestion?.hint?.length ? (
                <div className="mt-5 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-3 py-4 sm:px-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
                    {isBs ? "Hint" : "Hint"}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-orange-100">
                    {currentQuestion.hint.map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-5 lg:sticky lg:top-6 lg:self-start">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  {isBs ? "Vrijeme" : "Time"}
                </p>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${
                    timerCritical
                      ? "border-red-500/30 bg-red-500/10 text-red-300"
                      : timerWarning
                        ? "border-orange-500/30 bg-orange-500/10 text-orange-300"
                        : "border-white/10 bg-white/5 text-zinc-300"
                  }`}
                >
                  {formatTime(timeLeft)}
                </span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all ${
                    timerCritical ? "bg-red-500" : timerWarning ? "bg-orange-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${timerPercent}%` }}
                />
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4 sm:px-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    {isBs ? "Zadatak" : "Task"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-200">
                    {isBs ? "Upiši najvjerovatniji uzrok kvara." : "Write the most likely cause of the fault."}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4 sm:px-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    {isBs ? "Bodovanje" : "Scoring"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-200">
                    {isBs
                      ? "Ako upišeš više odgovora, prvi se računa kao glavni, a ostali kao alternativa. Na osnovu toga dobiješ bodove."
                      : "If you write more than one answer, the first one counts as your main answer and the rest count as alternatives. Your score is based on that."}
                  </p>
                </div>

                <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-3 py-4 sm:px-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
                    BONUS
                  </p>
                  <p className="mt-2 text-sm leading-6 text-orange-100">
                    {isBs
                      ? "Dobiješ dodatni bod ako detaljnije objasniš problem ili kako bi ga dokazao u praksi."
                      : "You get an extra point if you explain the problem in more detail or how you would prove it in practice."}
                  </p>
                </div>
              </div>

              <label className="mt-6 block">
                <span className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  {isBs ? "Tvoj odgovor" : "Your Answer"}
                </span>
                <textarea
                  value={currentAnswer}
                  onChange={(e) => updateAnswer(e.target.value)}
                  rows={10}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-4 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-orange-500/40 focus:bg-white/10 sm:px-4"
                  placeholder={
                    isBs
                      ? "Upiši dijagnozu, zašto nema greške i kako bi dokazao kvar..."
                      : "Write your diagnosis, why there is no fault code, and how you would prove the fault..."
                  }
                />
              </label>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => saveAndAdvance(false)}
                  className="rounded-2xl bg-orange-500 px-5 py-3 flex-1 font-bold text-black transition hover:bg-orange-400"
                >
                  {isBs ? "Odgovori" : "Answer"}
                </button>

                <button
                  type="button"
                  onClick={handleQuit}
                  className="rounded-2xl border border-white/10 bg-black/20 px-5 py-3 flex-1 font-bold text-zinc-100 transition hover:bg-white/10"
                >
                  {isBs ? "Odustani" : "Give Up"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
