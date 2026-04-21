import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/lib/locale-context";

const modes = [
  {
    key: "all",
    titleEn: "All Cars Diagnosis",
    titleBs: "Dijagnostika svih vozila",
    descEn: "Mixed scenarios from European, US, and Asian vehicles.",
    descBs: "Miješani scenariji iz evropskih, američkih i azijskih vozila.",
    color: "from-orange-500 to-amber-400",
  },
  {
    key: "eu",
    titleEn: "European Cars",
    titleBs: "Evropska vozila",
    descEn: "Audi, BMW, Mercedes, VW and other European brands.",
    descBs: "Audi, BMW, Mercedes, VW i drugi evropski brendovi.",
    color: "from-sky-500 to-cyan-400",
  },
  {
    key: "us",
    titleEn: "US Cars",
    titleBs: "Američka vozila",
    descEn: "Ford, GM, Dodge and common US drivetrain scenarios.",
    descBs: "Ford, GM, Dodge i česti američki drivetrain scenariji.",
    color: "from-red-500 to-rose-400",
  },
  {
    key: "asia",
    titleEn: "Asia Cars",
    titleBs: "Azijska vozila",
    descEn: "Toyota, Honda, Hyundai, Kia and other Asian brands.",
    descBs: "Toyota, Honda, Hyundai, Kia i drugi azijski brendovi.",
    color: "from-emerald-500 to-lime-400",
  },
] as const;

export default function SinglePlayerPage() {
  const { locale, setLocale } = useLocale();
  const [selectedMode, setSelectedMode] = useState<string>("all");

  return (
    <main className="min-h-screen bg-[#0a0d12] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
            >
              ← Back
            </Link>

            <div>
              <p className="text-[11px] font-semibold tracking-[0.28em] text-orange-400">
                AI GARAGE
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                {locale === "en" ? "Single Player" : "Single Player"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-1">
            <button
              onClick={() => setLocale("en")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                locale === "en"
                  ? "bg-orange-500 text-black"
                  : "text-zinc-300 hover:bg-white/10"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLocale("bs")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                locale === "bs"
                  ? "bg-orange-500 text-black"
                  : "text-zinc-300 hover:bg-white/10"
              }`}
            >
              BS
            </button>
          </div>
        </header>

        <section className="grid flex-1 gap-8 py-8 lg:grid-cols-[1fr_0.82fr]">
          <div className="grid gap-4">
            {modes.map((mode) => {
              const isActive = selectedMode === mode.key;

              return (
                <button
                  key={mode.key}
                  onClick={() => setSelectedMode(mode.key)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    isActive
                      ? "border-orange-500/60 bg-white/8 shadow-[0_0_0_1px_rgba(249,115,22,0.25)]"
                      : "border-white/10 bg-white/5 hover:bg-white/8"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`h-14 w-14 rounded-xl bg-gradient-to-br ${mode.color} shadow-lg`}
                    />
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-white">
                        {locale === "en" ? mode.titleEn : mode.titleBs}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {locale === "en" ? mode.descEn : mode.descBs}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
              {locale === "en" ? "Selected mode" : "Odabrani mod"}
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight">
              {selectedMode === "all" && (locale === "en" ? "All Cars Diagnosis" : "Dijagnostika svih vozila")}
              {selectedMode === "eu" && (locale === "en" ? "European Cars" : "Evropska vozila")}
              {selectedMode === "us" && (locale === "en" ? "US Cars" : "Američka vozila")}
              {selectedMode === "asia" && (locale === "en" ? "Asia Cars" : "Azijska vozila")}
            </h2>

            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                {locale === "en"
                  ? "You will get 10 diagnostic scenarios."
                  : "Dobit ćeš 10 dijagnostičkih scenarija."}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                {locale === "en"
                  ? "Your answers will later be scored by AI."
                  : "Tvoji odgovori će kasnije biti ocijenjeni pomoću AI-a."}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                {locale === "en"
                  ? "This score will affect your mechanic rank."
                  : "Ovaj rezultat će uticati na tvoj mehaničarski rank."}
              </div>
            </div>

            <Link
              href={`/test-setup?mode=${selectedMode}`}
              className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-orange-500 px-5 py-4 text-base font-bold text-black transition hover:bg-orange-400"
            >
              {locale === "en" ? "Start 10 Questions" : "Pokreni 10 pitanja"}
            </Link>

            <p className="mt-4 text-xs leading-5 text-zinc-500">
              {locale === "en"
                ? "For now we are building the test flow first. AI questions come next."
                : "Za sada prvo gradimo test flow. AI pitanja dolaze sljedeće."}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
