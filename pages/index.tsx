import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getMessages } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { getTopLocalLeaderboard, type LeaderboardEntry } from "@/lib/leaderboard";

const modes = [
  {
    key: "all",
    color: "from-orange-500 to-amber-400",
    badge: "🌍",
    accent: "border-orange-500/20 bg-orange-500/10 text-orange-300",
  },
  {
    key: "eu",
    color: "from-sky-500 to-cyan-400",
    badge: "🇪🇺",
    accent: "border-sky-500/20 bg-sky-500/10 text-sky-300",
  },
  {
    key: "us",
    color: "from-red-500 to-rose-400",
    badge: "🇺🇸",
    accent: "border-red-500/20 bg-red-500/10 text-red-300",
  },
  {
    key: "asia",
    color: "from-emerald-500 to-lime-400",
    badge: "🌏",
    accent: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  },
] as const;

function LeaderboardCard({
  title,
  subtitle,
  rows,
  loading,
  emptyText,
  highlightSelf = false,
}: {
  title: string;
  subtitle: string;
  rows: LeaderboardEntry[];
  loading: boolean;
  emptyText: string;
  highlightSelf?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-400">
            {title}
          </p>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-white">{subtitle}</h3>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-300">
          Top 8
        </div>
      </div>

      {loading ? (
        <div className="mt-5 rounded-2xl border border-white/8 bg-black/20 px-4 py-6 text-sm text-zinc-400">
          Loading...
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-white/8 bg-black/20 px-4 py-6 text-sm text-zinc-400">
          {emptyText}
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          {rows.map((row, index) => {
            const isYou = highlightSelf && row.player_name === "You";

            return (
              <div
                key={`${row.player_key}-${row.played_at}-${index}`}
                className={`grid grid-cols-[46px_1fr_auto] items-center gap-3 rounded-2xl border px-3 py-3 ${
                  isYou
                    ? "border-orange-500/30 bg-orange-500/10"
                    : "border-white/8 bg-black/20"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black ${
                    index === 0
                      ? "bg-yellow-500/20 text-yellow-300"
                      : index === 1
                      ? "bg-zinc-300/10 text-zinc-200"
                      : index === 2
                      ? "bg-amber-700/20 text-amber-300"
                      : "bg-white/5 text-zinc-300"
                  }`}
                >
                  #{index + 1}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{row.player_name}</p>
                  <p className="truncate text-xs text-zinc-400">{row.rank_label}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-black text-white">{row.avg_score.toFixed(1)}</p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">AVG</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const { locale, setLocale } = useLocale();
  const t = useMemo(() => getMessages(locale), [locale]);
  const isBs = locale === "bs";

  const [localRows, setLocalRows] = useState<LeaderboardEntry[]>([]);
  const [globalRows, setGlobalRows] = useState<LeaderboardEntry[]>([]);
  const [globalLoading, setGlobalLoading] = useState(true);

  useEffect(() => {
    setLocalRows(getTopLocalLeaderboard(8));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadGlobal() {
      try {
        setGlobalLoading(true);
        const res = await fetch("/api/leaderboard");
        const data = await res.json();

        if (!cancelled && res.ok && data?.ok && Array.isArray(data.rows)) {
          setGlobalRows(data.rows);
        }
      } catch {
        if (!cancelled) setGlobalRows([]);
      } finally {
        if (!cancelled) setGlobalLoading(false);
      }
    }

    loadGlobal();

    return () => {
      cancelled = true;
    };
  }, []);

  const modeLabels = {
    all: t.modeAllCars,
    eu: t.modeEuropean,
    us: t.modeUs,
    asia: t.modeAsia,
  };

  const shortRules = isBs
    ? [
        "10 dijagnostičkih scenarija po testu",
        "4 minute za svako pitanje",
        "Bodovi zavise od tačnosti i kvaliteta objašnjenja",
      ]
    : [
        "10 diagnostic scenarios per test",
        "4 minutes for each question",
        "Scoring depends on accuracy and explanation quality",
      ];

  const scoringNotes = isBs
    ? [
        "Glavni uzrok nosi najviše bodova",
        "Djelimično tačan odgovor dobija partial score",
        "Dodatno objašnjenje i način provjere mogu povećati ocjenu",
      ]
    : [
        "Main root cause gives the highest score",
        "Partially correct answers earn partial credit",
        "Extra explanation and proof steps can improve the score",
      ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0d12] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.16),_transparent_28%)]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.28em] text-orange-400">
              {t.brandTop}
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
              {t.appName}
            </h1>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-1">
            <button
              onClick={() => setLocale("en")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                locale === "en" ? "bg-orange-500 text-black" : "text-zinc-300 hover:bg-white/10"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLocale("bs")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                locale === "bs" ? "bg-orange-500 text-black" : "text-zinc-300 hover:bg-white/10"
              }`}
            >
              BS
            </button>
          </div>
        </header>

        <section className="grid gap-6 py-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
                {isBs ? "AI dijagnostički izazov" : "AI diagnostic challenge"}
              </div>

              <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                {t.appName}
              </h2>

              <p className="mt-4 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">
                {t.tagline}
              </p>

              <div className="mt-8 grid gap-3 sm:max-w-md">
                <Link
                  href="/single-player"
                  className="rounded-2xl bg-orange-500 px-5 py-4 text-center text-base font-bold text-black transition hover:bg-orange-400"
                >
                  {t.startSingle}
                </Link>

                <button className="rounded-2xl border border-white/12 bg-white/5 px-5 py-4 text-base font-bold text-white transition hover:bg-white/10">
                  {t.playFriends}
                </button>

                <button className="rounded-2xl border border-white/12 bg-black/20 px-5 py-4 text-base font-bold text-zinc-100 transition hover:bg-white/10">
                  {t.signInGoogle}
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {t.trialText}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-400">
                {isBs ? "Kako igra radi" : "How it works"}
              </p>

              <div className="mt-4 space-y-3">
                {shortRules.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-zinc-300"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/25 p-5 text-sm text-zinc-400">
              {isBs
                ? "Scenariji su napravljeni da testiraju stvarno razmišljanje mehaničara, ne samo puko pogađanje naziva dijela."
                : "Scenarios are designed to test real mechanic thinking, not just guessing a part name."}
            </div>
          </div>
        </section>

        <section className="pb-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-400">
                {isBs ? "Kategorije vozila" : "Vehicle Categories"}
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-white">
                {isBs ? "Odaberi fokus testa" : "Choose your test focus"}
              </h3>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {modes.map((mode) => (
              <div
                key={mode.key}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-white/20 hover:bg-white/[0.07]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${mode.color} text-2xl shadow-lg`}
                  >
                    <span>{mode.badge}</span>
                  </div>

                  <div className={`rounded-xl border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] ${mode.accent}`}>
                    Mode
                  </div>
                </div>

                <h4 className="mt-4 text-xl font-black tracking-tight text-white">
                  {modeLabels[mode.key]}
                </h4>

                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {mode.key === "all" &&
                    (isBs
                      ? "Mješavina svih tržišta i platformi za najrealniji challenge."
                      : "A mixed challenge across all markets and platforms.")}
                  {mode.key === "eu" &&
                    (isBs
                      ? "Europska vozila, tipične dijagnostike i poznate platforme."
                      : "European vehicles, common diagnostics and familiar platforms.")}
                  {mode.key === "us" &&
                    (isBs
                      ? "Američka vozila, pickup/SUV/benzin/diesel kombinacije."
                      : "US vehicles, pickup/SUV/gas/diesel combinations.")}
                  {mode.key === "asia" &&
                    (isBs
                      ? "Azijska vozila, pouzdanost, senzori i specifične varijacije kvarova."
                      : "Asian vehicles, reliability, sensors and specific failure variations.")}
                </p>

                <Link
                  href={`/test-setup?mode=${mode.key}`}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  {isBs ? "Otvori kategoriju" : "Open category"}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 pb-8 xl:grid-cols-2">
          <LeaderboardCard
            title={isBs ? "Lokalni ranking" : "Local Ranking"}
            subtitle={isBs ? "Ovaj browser / tvoji rezultati" : "This browser / your results"}
            rows={localRows}
            loading={false}
            emptyText={isBs ? "Još nema lokalnih rezultata." : "No local results yet."}
            highlightSelf
          />

          <LeaderboardCard
            title={isBs ? "Globalni ranking" : "Global Ranking"}
            subtitle={isBs ? "Najboljih 8 igrača" : "Top 8 players"}
            rows={globalRows}
            loading={globalLoading}
            emptyText={isBs ? "Globalni ranking još je prazan." : "Global leaderboard is still empty."}
          />
        </section>

        <section className="grid gap-6 pb-10 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-400">
              {isBs ? "Pravila" : "Rules"}
            </p>

            <div className="mt-4 space-y-3">
              {shortRules.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-zinc-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-400">
              {isBs ? "Bodovanje" : "Scoring"}
            </p>

            <div className="mt-4 space-y-3">
              {scoringNotes.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-zinc-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}