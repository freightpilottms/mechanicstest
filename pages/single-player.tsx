import Link from "next/link";
import { useRouter } from "next/router";
import { useLocale } from "@/lib/locale-context";
import { useState } from "react";

const modes = [
  {
    key: "all",
    titleEn: "All Cars Diagnosis",
    titleBs: "Dijagnostika svih vozila",
    descEn: "Mixed scenarios from EU, US and Asia.",
    descBs: "Miješani scenariji EU, US i Azija.",
    color: "from-orange-500 to-amber-400",
    icon: "🌍",
  },
  {
    key: "eu",
    titleEn: "European Cars",
    titleBs: "Evropska vozila",
    descEn: "Audi, BMW, Mercedes, VW.",
    descBs: "Audi, BMW, Mercedes, VW.",
    color: "from-sky-500 to-cyan-400",
    icon: "🇪🇺",
  },
  {
    key: "us",
    titleEn: "US Cars",
    titleBs: "Američka vozila",
    descEn: "Ford, GM, Dodge.",
    descBs: "Ford, GM, Dodge.",
    color: "from-red-500 to-rose-400",
    icon: "🇺🇸",
  },
  {
    key: "asia",
    titleEn: "Asia Cars",
    titleBs: "Azijska vozila",
    descEn: "Toyota, Honda, Hyundai.",
    descBs: "Toyota, Honda, Hyundai.",
    color: "from-emerald-500 to-lime-400",
    icon: "🌏",
  },
] as const;

export default function SinglePlayerPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const isBs = locale === "bs";

  const [selected, setSelected] = useState<typeof modes[number] | null>(null);

  function startGame() {
    if (!selected) return;
    router.push(`/test?mode=${selected.key}`);
  }

  const rules = isBs
    ? [
        "10 pitanja po testu",
        "3 minute po pitanju",
        "Nema rezultata dok test ne završi",
      ]
    : [
        "10 questions per test",
        "3 minutes per question",
        "No results until test ends",
      ];

  const scoring = isBs
    ? [
        "Glavni uzrok = najviše bodova",
        "Djelimičan odgovor = manje bodova",
        "Dodatno objašnjenje = bonus",
      ]
    : [
        "Main cause = highest score",
        "Partial answer = reduced score",
        "Extra explanation = bonus",
      ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090b10] text-white">
      {/* background */}
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center opacity-45 blur-[9px]"
        style={{ backgroundImage: "url('/garage-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-3 sm:px-6 lg:px-8">
        
        {/* header */}
        <header className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/10"
          >
            ← {isBs ? "Nazad" : "Back"}
          </Link>

          <h1 className="text-xl font-bold">Single Player</h1>
        </header>

        {/* main wrapper */}
        <div className="mx-auto w-full max-w-[1280px]">
          <section className="grid gap-6 py-6 xl:grid-cols-2">
            
            {/* LEFT - MODES */}
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <h2 className="text-3xl font-black">
                {isBs ? "Odaberi mod" : "Choose Mode"}
              </h2>

              <div className="mt-6 grid gap-4">
                {modes.map((m) => {
                  const active = selected?.key === m.key;

                  return (
                    <button
                      key={m.key}
                      onClick={() => setSelected(m)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-orange-500 bg-white/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-12 w-12 flex items-center justify-center rounded-xl bg-gradient-to-br ${m.color}`}
                        >
                          {m.icon}
                        </div>

                        <div>
                          <h3 className="font-bold">
                            {isBs ? m.titleBs : m.titleEn}
                          </h3>
                          <p className="text-sm text-zinc-400">
                            {isBs ? m.descBs : m.descEn}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT - MODE DETAILS */}
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              
              {!selected ? (
                <div className="text-center text-zinc-400 mt-20">
                  {isBs
                    ? "Odaberi mod sa lijeve strane"
                    : "Select a mode on the left"}
                </div>
              ) : (
                <>
                  <h2 className="text-3xl font-black">
                    {isBs ? selected.titleBs : selected.titleEn}
                  </h2>

                  <p className="mt-3 text-zinc-300">
                    {isBs ? selected.descBs : selected.descEn}
                  </p>

                  {/* RULES */}
                  <div className="mt-6">
                    <p className="text-xs uppercase text-orange-400">
                      {isBs ? "Pravila" : "Rules"}
                    </p>

                    <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                      {rules.map((r) => (
                        <li key={r}>• {r}</li>
                      ))}
                    </ul>
                  </div>

                  {/* SCORING */}
                  <div className="mt-6">
                    <p className="text-xs uppercase text-orange-400">
                      {isBs ? "Bodovanje" : "Scoring"}
                    </p>

                    <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                      {scoring.map((s) => (
                        <li key={s}>• {s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* START BUTTON */}
                  <button
                    onClick={startGame}
                    className="mt-8 w-full rounded-2xl bg-orange-500 py-4 text-lg font-bold text-black hover:bg-orange-400 transition"
                  >
                    {isBs ? "Započni test" : "Start Test"}
                  </button>
                </>
              )}
            </div>
          </section>

          <footer className="text-center text-xs text-zinc-500">
            © ZEDA&apos;S Group LTD
          </footer>
        </div>
      </div>
    </main>
  );
}