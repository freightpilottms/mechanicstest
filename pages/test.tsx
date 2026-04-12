import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { mockQuestions } from "@/lib/mock-questions";

export default function TestPage() {
  const router = useRouter();
  const { mode = "all", lang = "en" } = router.query;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(mockQuestions.length).fill(""));
  const [finished, setFinished] = useState(false);

  const currentQuestion = mockQuestions[currentIndex];
  const progress = ((currentIndex + 1) / mockQuestions.length) * 100;

  const currentAnswer = useMemo(() => answers[currentIndex] || "", [answers, currentIndex]);

  function updateAnswer(value: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = value;
      return next;
    });
  }

  function goNext() {
    if (currentIndex < mockQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    setFinished(true);
  }

  if (finished) {
    const answeredCount = answers.filter((a) => a.trim().length > 0).length;

    return (
      <main className="min-h-screen bg-[#0a0d12] px-4 py-6 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-400">
            Test Complete
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight">
            {lang === "bs" ? "Test je završen" : "Test finished"}
          </h1>

          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
              <strong>{lang === "bs" ? "Mode" : "Mode"}:</strong> {String(mode)}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
              <strong>{lang === "bs" ? "Odgovoreno" : "Answered"}:</strong> {answeredCount} / {mockQuestions.length}
            </div>
          </div>

          <p className="mt-6 text-zinc-400">
            {lang === "bs"
              ? "Sljedeći korak je da spojimo AI ocjenjivanje za svako pitanje i finalni rank."
              : "Next step is connecting AI scoring for each question and final rank."}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/single-player"
              className="rounded-2xl border border-white/10 bg-black/20 px-5 py-3 font-bold text-zinc-100 transition hover:bg-white/10"
            >
              {lang === "bs" ? "Nazad" : "Back"}
            </Link>

            <Link
              href="/"
              className="rounded-2xl bg-orange-500 px-5 py-3 font-bold text-black transition hover:bg-orange-400"
            >
              {lang === "bs" ? "Početna" : "Home"}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0d12] px-4 py-6 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-400">
                Mechanic IQ Test
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight">
                {lang === "bs" ? "Pitanje" : "Question"} {currentIndex + 1} / {mockQuestions.length}
              </h1>
            </div>

            <Link
              href={`/single-player`}
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
            >
              ← {lang === "bs" ? "Nazad" : "Back"}
            </Link>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-orange-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
            {currentQuestion.vehicle}
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-tight">
            {currentQuestion.title}
          </h2>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
              {lang === "bs" ? "Simptomi" : "Symptoms"}
            </p>

            <ul className="mt-3 space-y-3 text-sm leading-6 text-zinc-300">
              {currentQuestion.symptoms.map((symptom, index) => (
                <li key={index} className="rounded-xl border border-white/8 bg-white/5 px-4 py-3">
                  {symptom}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <label className="mb-3 block text-sm font-semibold text-zinc-300">
              {lang === "bs"
                ? "Upiši svoj odgovor / dijagnozu"
                : "Write your answer / diagnosis"}
            </label>

            <textarea
              value={currentAnswer}
              onChange={(e) => updateAnswer(e.target.value)}
              rows={8}
              placeholder={
                lang === "bs"
                  ? "Napiši šta misliš da je najvjerovatniji uzrok, moguće alternative i kako bi provjerio kvar..."
                  : "Write what you think is the most likely cause, possible alternatives, and how you would verify the issue..."
              }
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-orange-500/60"
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={goNext}
              className="rounded-2xl bg-orange-500 px-5 py-4 text-base font-bold text-black transition hover:bg-orange-400"
            >
              {currentIndex === mockQuestions.length - 1
                ? lang === "bs"
                  ? "Završi test"
                  : "Finish Test"
                : lang === "bs"
                ? "Sljedeće pitanje"
                : "Next Question"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}