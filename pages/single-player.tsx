import Link from "next/link";
import { useRouter } from "next/router";
import { useLocale } from "@/lib/locale-context";

const modes = [
  {
    key: "all",
    titleEn: "All Cars Diagnosis",
    titleBs: "Dijagnostika svih vozila",
    descEn: "Mixed scenarios from European, US, and Asian vehicles.",
    descBs: "Miješani scenariji iz evropskih, američkih i azijskih vozila.",
    badge: "🌍",
    color: "from-orange-500 to-amber-400",
  },
  {
    key: "eu",
    titleEn: "European Cars",
    titleBs: "Evropska vozila",
    descEn: "Audi, BMW, Mercedes, VW and other European brands.",
    descBs: "Audi, BMW, Mercedes, VW i drugi evropski brendovi.",
    badge: "🇪🇺",
    color: "from-sky-500 to-cyan-400",
  },
  {
    key: "us",
    titleEn: "US Cars",
    titleBs: "Američka vozila",
    descEn: "Ford, GM, Dodge and common US drivetrain scenarios.",
    descBs: "Ford, GM, Dodge i česti američki drivetrain scenariji.",
    badge: "🇺🇸",
    color: "from-red-500 to-rose-400",
  },
  {
    key: "asia",
    titleEn: "Asia Cars",
    titleBs: "Azijska vozila",
    descEn: "Toyota, Honda, Hyundai, Kia and other Asian brands.",
    descBs: "Toyota, Honda, Hyundai, Kia i drugi azijski brendovi.",
    badge: "🌏",
    color: "from-emerald-500 to-lime-400",
  },
] as const;

export default function SinglePlayerPage() {
  const router = useRouter();
  const { locale, setLocale } = useLocale();
  const isBs = locale === "bs";

  function startMode(mode: string) {
    router.push(`/test?mode=${encodeURIComponent(mode)}`);
  }

  const rules = isBs
    ? [
        "10 dijagnostičkih scenarija po testu.",
        "4 minute za svako pitanje.",
        "Najviše bodova nosi glavni i najvjerovatniji uzrok.",
        "Rezultati se prikazuju tek na kraju testa.",
      ]
    : [
        "10 diagnostic scenarios per test.",
        "4 minutes for each question.",
        "The main and most likely root cause gives the most points.",
        "Results are shown only at the end of the test.",
      ];

  const scoring = isBs
    ? [
        "Glavni uzrok nosi najviše bodova.",
        "Djelimično tačan odgovor dobija umanjene bodove.",
        "Dodatno objašnjenje i način potvrde mogu povećati ocjenu.",
      ]
    : [
        "Main root cause gives the highest score.",
        "Partially correct answers receive reduced points.",
        "Extra explanation and proof steps can improve the score.",
      ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090b10] text-white">
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center opacity-45 blur-[9px]"
        style={{ backgroundImage: "url('/garage-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_26%)]" />
      <div className="absolute inset-0 bg-black/38" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-3 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
            >
              ← {isBs ? "Nazad" : "Back"}
            </Link>

            <div>
              <p className="text-[11px] font-semibold tracking-[0.28em] text-orange-400">
                AI GARAGE
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                {isBs ? "Single Player" : "Single Player"}
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

        <div className="mx-auto w-full max-w-[1280px]">
          <section className="grid gap-6 py-6 xl:grid-cols-2">
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md sm:p-8">
              <div className="max-w-2xl">
                <div className="inline-flex items-center justify-center gap-2 rounded-full border border-orange-500/35 bg-orange-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">
                  <span>🎮</span>
                  <span>{isBs ? "Single Player Mode" : "Single Player Mode"}</span>
                </div>

                <h2 className="mt-6 text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl">
                  {isBs ? "Odaberi mod" : "Choose Mode"}
                </h2>

                <p className="mt-4 max-w-2xl text-xl leading-8 text-zinc-200">
                  {isBs
                    ? "Izaberi kategoriju i test počinje odmah. Nema dodatnog setup page-a."
                    : "Choose a category and the test starts immediately. No extra setup page needed."}
                </p>

                <div className="mt-8 grid gap-4">
                  {modes.map((mode) => (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() => startMode(mode.key)}
                      className="group w-full rounded-[24px] border border-white/10 bg-white/5 p-4 text-left transition hover:border-orange-500/40 hover:bg-white/[0.08]"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${mode.color} text-2xl shadow-lg`}
                        >
                          {mode.badge}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-black tracking-tight text-white">
                                {isBs ? mode.titleBs : mode.titleEn}
                              </h3>
                              <p className="mt-2 text-sm leading-6 text-zinc-400">
                                {isBs ? mode.descBs : mode.descEn}
                              </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-300 transition group-hover:border-orange-500/30 group-hover:text-orange-300">
                              {isBs ? "Start" : "Start"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-7 flex justify-center">
                  <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-3 text-center text-base font-semibold text-emerald-300">
                    {isBs
                      ? "Trial uključuje 2 besplatna testa od po 10 pitanja"
                      : "Trial includes 2 free tests of 10 questions"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300">
                  ⊕
                </div>
                <h3 className="text-[34px] font-black tracking-tight text-white">
                  {isBs ? "How it works" : "How it works"}
                </h3>
              </div>

              <div className="mt-7">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-400">
                  {isBs ? "Pravila" : "Rules"}
                </p>

                <div className="mt-4 space-y-4">
                  {rules.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 text-[18px] leading-8 text-zinc-200"
                    >
                      <span className="mt-1 text-xl text-zinc-300">◻</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-7 border-t border-white/10 pt-7">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-400">
                  {isBs ? "Bodovanje" : "Scoring"}
                </p>

                <div className="mt-4 space-y-4">
                  {scoring.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 text-[18px] leading-8 text-zinc-200"
                    >
                      <span className="mt-1 text-xl text-zinc-300">◎</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-300">
                {isBs
                  ? "Klik na željeni mod odmah pokreće test. Jezik ostaje globalno sačuvan kroz app."
                  : "Clicking a mode starts the test immediately. Language stays globally saved across the app."}
              </div>
            </div>
          </section>

          <footer className="pb-2 pt-1 text-center text-xs tracking-[0.14em] text-zinc-500">
            © ZEDA&apos;S Group LTD | AK Solutions
          </footer>
        </div>
      </div>
    </main>
  );
}