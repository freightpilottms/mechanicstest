import Link from "next/link";
import { useRouter } from "next/router";
import { useLocale } from "@/lib/locale-context";
import { useEffect, useMemo, useState } from "react";
import {
  getLocalLeaderboard,
  getTopLocalLeaderboard,
  type LeaderboardEntry,
} from "@/lib/leaderboard";

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

function formatOrdinal(n: number, isBs: boolean) {
  if (!n || n < 1) return isBs ? "Ti: —" : "You: —";

  const suffix =
    n % 10 === 1 && n % 100 !== 11
      ? "st"
      : n % 10 === 2 && n % 100 !== 12
      ? "nd"
      : n % 10 === 3 && n % 100 !== 13
      ? "rd"
      : "th";

  return `${isBs ? "Ti" : "You"}: ${n}${suffix}`;
}

export default function SinglePlayerPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const isBs = locale === "bs";

  // ✅ DEFAULT MODE = ALL
  const [selected, setSelected] = useState(modes[0]);

  // leaderboard state
  const [topLocalRows, setTopLocalRows] = useState<LeaderboardEntry[]>([]);
  const [globalRows, setGlobalRows] = useState<LeaderboardEntry[]>([]);
  const [globalLoading, setGlobalLoading] = useState(true);

  useEffect(() => {
    setTopLocalRows(getTopLocalLeaderboard(8));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadGlobal() {
      try {
        setGlobalLoading(true);
        const res = await fetch("/api/leaderboard");
        const data = await res.json();

        if (!cancelled && data?.ok) {
          setGlobalRows(data.rows || []);
        }
      } catch {
        setGlobalRows([]);
      } finally {
        setGlobalLoading(false);
      }
    }

    loadGlobal();
    return () => {
      cancelled = true;
    };
  }, []);

  function startGame() {
    router.push(`/test?mode=${selected.key}`);
  }

  const rules = isBs
    ? ["10 pitanja", "3 minute po pitanju", "Rezultati na kraju"]
    : ["10 questions", "3 minutes per question", "Results at the end"];

  const scoring = isBs
    ? ["Glavni uzrok = max bodovi", "Djelimično = manje", "Extra = bonus"]
    : ["Main cause = max points", "Partial = reduced", "Extra = bonus"];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090b10] text-white">
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center opacity-45 blur-[9px]"
        style={{ backgroundImage: "url('/garage-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-3 sm:px-6 lg:px-8">
        
        {/* HEADER */}
        <header className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
          <Link href="/" className="text-sm">← Back</Link>
          <h1 className="font-bold">Single Player</h1>
        </header>

        {/* MAIN */}
        <div className="mx-auto w-full max-w-[1280px]">
          <section className="grid gap-6 py-6 xl:grid-cols-2">

            {/* LEFT */}
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <h2 className="text-3xl font-black">
                {isBs ? "Odaberi mod" : "Choose Mode"}
              </h2>

              <div className="mt-6 grid gap-4">
                {modes.map((m) => {
                  const active = selected.key === m.key;

                  return (
                    <button
                      key={m.key}
                      onClick={() => setSelected(m)}
                      className={`rounded-2xl border p-4 text-left ${
                        active
                          ? "border-orange-500 bg-white/10"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center`}>
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

            {/* RIGHT */}
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <h2 className="text-3xl font-black">
                {isBs ? selected.titleBs : selected.titleEn}
              </h2>

              <p className="mt-3 text-zinc-300">
                {isBs ? selected.descBs : selected.descEn}
              </p>

              <div className="mt-6">
                <p className="text-xs text-orange-400">Rules</p>
                <ul className="mt-2 text-sm text-zinc-300 space-y-1">
                  {rules.map((r) => (
                    <li key={r}>• {r}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                <p className="text-xs text-orange-400">Scoring</p>
                <ul className="mt-2 text-sm text-zinc-300 space-y-1">
                  {scoring.map((s) => (
                    <li key={s}>• {s}</li>
                  ))}
                </ul>
              </div>

              <button
                onClick={startGame}
                className="mt-8 w-full rounded-2xl bg-orange-500 py-4 font-bold text-black"
              >
                {isBs ? "Započni test" : "Start Test"}
              </button>
            </div>
          </section>

          {/* LEADERBOARD */}
          <section className="grid gap-6 pb-4 xl:grid-cols-2">
            <div className="rounded-2xl bg-white/5 p-5">
              <h3>Your vs Friends</h3>
              {topLocalRows.map((r, i) => (
                <div key={i}>{i + 1}. {r.player_name}</div>
              ))}
            </div>

            <div className="rounded-2xl bg-white/5 p-5">
              <h3>Worldwide Score</h3>
              {globalLoading ? "Loading..." : globalRows.map((r, i) => (
                <div key={i}>{i + 1}. {r.player_name}</div>
              ))}
            </div>
          </section>

          {/* FOOTER */}
          <footer className="text-center text-xs text-zinc-500">
            © ZEDA&apos;S Group LTD | AK Solutions
          </footer>
        </div>
      </div>
    </main>
  );
}