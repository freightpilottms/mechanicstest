import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/router";
import { getQuestionsForMode, TIME_LIMITS } from "@/lib/mock-questions";

export default function TestSetupPage() {
  const router = useRouter();
  const { mode = "all", lang = "en" } = router.query;

  const questions = useMemo(() => getQuestionsForMode(String(mode)), [mode]);
  const totalSeconds = useMemo(
    () => questions.reduce((sum, q) => sum + TIME_LIMITS[q.difficulty], 0),
    [questions]
  );

  const difficultyBreakdown = useMemo(() => {
    return {
      easy: questions.filter((q) => q.difficulty === "easy").length,
      medium: questions.filter((q) => q.difficulty === "medium").length,
      hard: questions.filter((q) => q.difficulty === "hard").length,
    };
  }, [questions]);

  const totalMinutes = Math.ceil(totalSeconds / 60);
  const isBs = String(lang) === "bs";

  return (
    <main className="min-h-screen bg-[#0a0d12] px-4 py-6 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8">
        <Link
          href="/single-player"
          className="inline-flex rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
        >
          ← {isBs ? "Nazad" : "Back"}
        </Link>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-orange-400">
          {isBs ? "Postavke testa" : "Test Setup"}
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight">Mechanic IQ Test</h1>

        <div className="mt-6 grid gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
            <strong>{isBs ? "Mode" : "Mode"}:</strong> {String(mode)}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
            <strong>{isBs ? "Jezik" : "Language"}:</strong> {String(lang).toUpperCase()}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
            <strong>{isBs ? "Pitanja" : "Questions"}:</strong> {questions.length}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
            <strong>{isBs ? "Ukupno vrijeme" : "Total time"}:</strong> ~{totalMinutes} {isBs ? "min" : "min"}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <strong>{isBs ? "Lako" : "Easy"}:</strong> {difficultyBreakdown.easy} × 2 {isBs ? "min" : "min"}
          </div>
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-300">
            <strong>{isBs ? "Srednje" : "Medium"}:</strong> {difficultyBreakdown.medium} × 3 {isBs ? "min" : "min"}
          </div>
          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm text-orange-300">
            <strong>{isBs ? "Teško" : "Hard"}:</strong> {difficultyBreakdown.hard} × 4 {isBs ? "min" : "min"}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-300">
          {isBs
            ? "Svako pitanje ima vidljiv timer u UI. Rezultati se ne prikazuju nakon svake runde, nego tek na kraju testa sa kompletnim pregledom odgovora i ocjena."
            : "Each question has a visible timer in the UI. Results are not shown after each round; they appear only at the end with the complete answer and scoring breakdown."}
        </div>

        <Link
          href={`/test?mode=${String(mode)}&lang=${String(lang)}`}
          className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-orange-500 px-5 py-4 text-base font-bold text-black transition hover:bg-orange-400"
        >
          {isBs ? "Započni test" : "Start Test"}
        </Link>
      </div>
    </main>
  );
}
