import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { DIFFICULTY_LABELS, TIME_LIMITS, type Difficulty } from "@/lib/mock-questions";

type ScenarioQuestion = {
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

type AnswerState = {
  answer: string;
  timedOut: boolean;
  timeSpent: number;
};

type AiEvaluation = {
  score: number;
  diagnosis_percent: number;
  bonus: number;
  verdict: "correct" | "very_close" | "partial" | "weak" | "wrong";
  matched_cause: string;
  reason_short: string;
};

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
  if (score >= 9) return "Master Tech";
  if (score >= 7) return "Advanced Mechanic";
  if (score >= 5) return "Intermediate Mechanic";
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

export default function TestPage() {
  const router = useRouter();
  const { lang = "en" } = router.query;
  const isBs = String(lang) === "bs";

  const [questions, setQuestions] = useState<ScenarioQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerReady, setTimerReady] = useState(false);
  const [aiResults, setAiResults] = useState<(AiEvaluation | null)[]>([]);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTestSet() {
      try {
        setLoading(true);
        setLoadError("");

        const res = await fetch("/api/scenarios/test-set?count=10");
        const data = await res.json();

        if (!res.ok || !data?.ok || !Array.isArray(data?.scenarios)) {
          throw new Error(data?.error || "Failed to load test scenarios");
        }

        if (cancelled) return;

        setQuestions(data.scenarios);
        setAnswers(
          data.scenarios.map(() => ({
            answer: "",
            timedOut: false,
            timeSpent: 0,
          }))
        );
        setAiResults(data.scenarios.map(() => null));
        setCurrentIndex(0);
        setFinished(false);
      } catch (err: any) {
        if (cancelled) return;
        setLoadError(String(err?.message || err || "Unknown error"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTestSet();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (!currentQuestion || finished) return;

    setTimerReady(false);
    setTimeLeft(TIME_LIMITS[currentQuestion.difficulty]);

    const id = window.setTimeout(() => {
      setTimerReady(true);
    }, 0);

    return () => window.clearTimeout(id);
  }, [currentIndex, currentQuestion, finished]);

  useEffect(() => {
    if (!currentQuestion || finished || !timerReady) return;

    if (timeLeft <= 0) {
      saveAndAdvance(true);
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [timeLeft, currentQuestion, finished, timerReady]);

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
    const spent = Math.max(0, Math.min(allowed, allowed - timeLeft));

    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = {
        ...next[currentIndex],
        timedOut,
        timeSpent: spent,
      };
      return next;
    });

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    setFinished(true);
    setTimeout(() => {
      evaluateAllAnswers();
    }, 0);
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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0d12] px-4 py-6 text-white">
        <div className="mx-auto max-w-5xl">
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
      <main className="min-h-screen bg-[#0a0d12] px-4 py-6 text-white">
        <div className="mx-auto max-w-5xl">
          <section className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-300">
              {isBs ? "Greška" : "Error"}
            </p>
            <h1 className="mt-3 text-2xl font-black tracking-tight">
              {isBs ? "Test nije učitan" : "Test failed to load"}
            </h1>
            <p className="mt-4 text-sm text-red-100">{loadError}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-2xl bg-orange-500 px-5 py-3 font-bold text-black transition hover:bg-orange-400"
              >
                {isBs ? "Pokušaj ponovo" : "Try Again"}
              </button>
              <Link
                href="/single-player"
                className="rounded-2xl border border-white/10 bg-black/20 px-5 py-3 font-bold text-zinc-100 transition hover:bg-white/10"
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
      <main className="min-h-screen bg-[#0a0d12] px-4 py-6 text-white">
        <div className="mx-auto max-w-5xl">
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
                  {isBs ? "Rank" : "Rank"}
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
                        {isBs ? "Ocjena i rank" : "Score & Rank"}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-zinc-200">{evaluation.feedback}</p>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                          {isBs ? "Rank" : "Rank"}: {evaluation.rank}
                        </span>
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                          {isBs ? "Blizina dijagnoze" : "Diagnosis closeness"}: {evaluation.diagnosisPercent}%
                        </span>
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                          Bonus: +{evaluation.bonus}
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
                className="rounded-2xl border border-white/10 bg-black/20 px-5 py-3 font-bold text-zinc-100 transition hover:bg-white/10"
              >
                {isBs ? "Nazad" : "Back"}
              </Link>

              <Link
                href="/"
                className="rounded-2xl bg-orange-500 px-5 py-3 font-bold text-black transition hover:bg-orange-400"
              >
                {isBs ? "Početna" : "Home"}
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0d12] px-4 py-6 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-400">
                Mechanic IQ Test
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight">
                {isBs ? "Pitanje" : "Question"} {currentIndex + 1} / {questions.length}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] ${difficultyBadgeClasses(currentQuestion.difficulty)}`}>
                {getDifficultyText(currentQuestion.difficulty, isBs)} • {formatTime(currentTimeLimit)}
              </span>
              <span
                className={`rounded-full border px-3 py-2 text-sm font-black tracking-[0.18em] ${
                  timerCritical
                    ? "border-red-500/30 bg-red-500/10 text-red-300"
                    : timerWarning
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                    : "border-white/10 bg-black/20 text-zinc-200"
                }`}
              >
                ⏱ {formatTime(timeLeft)}
              </span>
              <Link
                href="/single-player"
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
              >
                ← {isBs ? "Nazad" : "Back"}
              </Link>
            </div>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-orange-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                timerCritical ? "bg-red-400" : timerWarning ? "bg-amber-400" : "bg-sky-400"
              }`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        </header>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                {currentQuestion.vehicle}
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">{currentQuestion.title}</h2>
            </div>

            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-300">
              {currentQuestion.category}
            </span>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <SectionCard title={isBs ? "Simptomi" : "Symptoms"} items={currentQuestion.symptoms} />
            <SectionCard title={isBs ? "U vožnji" : "Driving"} items={currentQuestion.driving} />
            <SectionCard title={isBs ? "Dodatno" : "Additional"} items={currentQuestion.extra} />
            <SectionCard title={isBs ? "Ključni detalji" : "Key Details"} items={currentQuestion.key_details} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <SectionCard title={isBs ? "Pitanja" : "Questions"} items={currentQuestion.questions} />
            <SectionCard title="Hint" items={currentQuestion.hint} accent />
          </div>

          <div className="mt-6">
            <label className="mb-3 block text-sm font-semibold text-zinc-300">
              {isBs ? "Upiši svoj odgovor / dijagnozu" : "Write your answer / diagnosis"}
            </label>

            <textarea
              value={currentAnswer}
              onChange={(e) => updateAnswer(e.target.value)}
              rows={10}
              placeholder={
                isBs
                  ? "Napiši najvjerovatniji uzrok. Ako želiš, dodaj i zašto ECU možda ne prijavljuje grešku i kako bi kvar dokazao u praksi..."
                  : "Write the most likely cause. If you want, add why the ECU may not report a fault and how you would prove it in practice..."
              }
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-500 focus:border-orange-500/60"
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => saveAndAdvance(false)}
              className="rounded-2xl bg-orange-500 px-5 py-4 text-base font-bold text-black transition hover:bg-orange-400"
            >
              {currentIndex === questions.length - 1
                ? isBs
                  ? "Završi test"
                  : "Finish Test"
                : isBs
                ? "Sljedeće pitanje"
                : "Next Question"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

type SectionCardProps = {
  title: string;
  items: string[];
  accent?: boolean;
};

function SectionCard({ title, items, accent = false }: SectionCardProps) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-orange-500/20 bg-orange-500/10" : "border-white/10 bg-black/20"}`}>
      <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${accent ? "text-orange-300" : "text-zinc-500"}`}>
        {title}
      </p>

      <ul className="mt-3 space-y-3 text-sm leading-6 text-zinc-300">
        {items.map((item, index) => (
          <li key={index} className="rounded-xl border border-white/8 bg-white/5 px-4 py-3">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}