import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getMessages } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import {
  getLocalLeaderboard,
  getTopLocalLeaderboard,
  type LeaderboardEntry,
} from "@/lib/leaderboard";

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

function getBestPlayerPosition(rows: LeaderboardEntry[], playerName = "You") {
  const normalized = playerName.trim().toLowerCase();
  const index = rows.findIndex(
    (row) => row.player_name.trim().toLowerCase() === normalized
  );
  return index >= 0 ? index + 1 : null;
}

function getYouRow(rows: LeaderboardEntry[], playerName = "You") {
  const normalized = playerName.trim().toLowerCase();
  return (
    rows.find((row) => row.player_name.trim().toLowerCase() === normalized) ||
    null
  );
}

function LeaderboardCard({
  title,
  rows,
  loading,
  emptyText,
  positionLabel,
  showYouRow = false,
  youRow,
}: {
  title: string;
  rows: LeaderboardEntry[];
  loading: boolean;
  emptyText: string;
  positionLabel: string;
  showYouRow?: boolean;
  youRow?: LeaderboardEntry | null;
}) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-md sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[24px] font-black tracking-tight text-white sm:text-[28px]">
          {title}
        </h3>

        <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
          {positionLabel}
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
        <>
          <div className="mt-5 space-y-1.5">
            {rows.map((row, index) => (
              <div
                key={`${row.player_key}-${row.played_at}-${index}`}
                className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/8 px-1 py-3 last:border-b-0"
              >
                <div className="text-[18px] font-semibold text-white">
                  {index + 1}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold text-white">
                    {row.player_name}
                  </p>
                  <p className="truncate text-sm text-zinc-400">
                    {row.rank_label}
                  </p>
                </div>

                <div className="text-right text-[15px] font-black text-orange-400">
                  {row.avg_score.toFixed(1)}
                </div>
              </div>
            ))}
          </div>

          {showYouRow && youRow ? (
            <div className="mt-4 grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-4">
              <div className="text-[20px] font-semibold text-emerald-300">
                {positionLabel.replace(/^.*:\s*/, "").replace(/[a-z]+$/i, "")}
              </div>

              <div className="min-w-0">
                <p className="truncate text-[16px] font-black text-white">
                  {youRow.player_name}
                </p>
                <p className="truncate text-sm text-zinc-300">
                  {youRow.rank_label}
                </p>
              </div>

              <div className="text-right text-[18px] font-black text-emerald-300">
                {youRow.avg_score.toFixed(1)}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  const { locale, setLocale } = useLocale();
  const t = useMemo(() => getMessages(locale), [locale]);
  const isBs = locale === "bs";

  const [topLocalRows, setTopLocalRows] = useState<LeaderboardEntry[]>([]);
  const [allLocalRows, setAllLocalRows] = useState<LeaderboardEntry[]>([]);
  const [globalRows, setGlobalRows] = useState<LeaderboardEntry[]>([]);
  const [globalLoading, setGlobalLoading] = useState(true);

  useEffect(() => {
    const localAll = getLocalLeaderboard();
    setAllLocalRows(localAll);
    setTopLocalRows(getTopLocalLeaderboard(8));
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

  const localPosition = useMemo(
    () => getBestPlayerPosition(allLocalRows),
    [allLocalRows]
  );
  const globalPosition = useMemo(
    () => getBestPlayerPosition(globalRows),
    [globalRows]
  );

  const localYouRow = useMemo(() => getYouRow(allLocalRows), [allLocalRows]);
  const globalYouRow = useMemo(() => getYouRow(globalRows), [globalRows]);

  const rules = isBs
    ? [
        "10 dijagnostičkih scenarija po testu.",
        "4 minute za svako pitanje.",
        "Najviše bodova nosi glavni i najvjerovatniji uzrok.",
        "Konačni rezultat i rank dobijaš tek na kraju testa.",
      ]
    : [
        "10 diagnostic scenarios per test.",
        "4 minutes for each question.",
        "The main and most likely root cause gives the most points.",
        "Your final score and rank are shown only at the end of the test.",
      ];

  const scoring = isBs
    ? [
        "Glavni uzrok nosi najviše bodova.",
        "Djelimično tačan odgovor dobija umanjene bodove.",
        "Dodatno objašnjenje i način potvrde kvara mogu povećati ocjenu.",
      ]
    : [
        "Main root cause gives the highest score.",
        "Partially correct answers receive reduced points.",
        "Extra explanation and proof steps can improve the score.",
      ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0c10] text-white">
      <div
        className="absolute inset-0 scale-[1.03] bg-cover bg-center opacity-55 blur-[8px]"
        style={{ backgroundImage: "url('/garage-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/42" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.08),_transparent_28%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1380px] flex-col px-3 py-2 sm:px-4 sm:py-2.5 lg:px-5">
        <header className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3 backdrop-blur-md sm:px-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-orange-400">
                AI GARAGE
              </p>
              <h1 className="mt-1 text-[28px] font-black tracking-tight text-white">
                Mechanic IQ
              </h1>
            </div>

            <div className="flex items-center gap-2 rounded-[18px] border border-white/10 bg-black/25 p-1">
              <button
                onClick={() => setLocale("en")}
                className={`rounded-[14px] px-4 py-3 text-[15px] font-bold transition ${
                  locale === "en"
                    ? "bg-orange-500 text-black"
                    : "text-zinc-200 hover:bg-white/10"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLocale("bs")}
                className={`rounded-[14px] px-4 py-3 text-[15px] font-bold transition ${
                  locale === "bs"
                    ? "bg-orange-500 text-black"
                    : "text-zinc-200 hover:bg-white/10"
                }`}
              >
                BS
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-6 py-7 lg:grid-cols-[1.03fr_0.95fr]">
          <div className="rounded-[34px] border border-white/10 bg-white/[0.05] p-8 shadow-2xl backdrop-blur-md">
            <div className="max-w-2xl">
              <div className="inline-flex items-center justify-center gap-2 rounded-full border border-orange-500/35 bg-orange-500/[0.08] px-5 py-3 text-[13px] font-semibold uppercase tracking-[0.26em] text-orange-300">
                <span className="text-[14px]">🛠️</span>
                <span>AI DIAGNOSTIC CHALLENGE</span>
              </div>

              <h2 className="mt-7 text-[64px] font-black leading-[0.94] tracking-tight text-white sm:text-[72px]">
                Mechanic IQ
              </h2>

              <p className="mt-5 max-w-2xl text-[24px] leading-[1.35] text-zinc-200">
                {isBs
                  ? "Dijagnosticiraj kvar, povećaj svoj rank i dokaži znanje."
                  : "Diagnose the fault, increase your rank and prove your knowledge."}
              </p>

              <div className="mt-10 grid max-w-[600px] gap-4">
                <Link
                  href="/single-player"
                  className="rounded-[20px] bg-orange-500 px-6 py-5 text-center text-[20px] font-bold text-black transition hover:bg-orange-400"
                >
                  {t.startSingle}
                </Link>

                <button className="rounded-[20px] border border-white/12 bg-white/[0.05] px-6 py-5 text-[20px] font-bold text-white transition hover:bg-white/10">
                  {t.playFriends}
                </button>

                <button className="rounded-[20px] border border-white/12 bg-black/30 px-6 py-5 text-[20px] font-bold text-white transition hover:bg-white/10">
                  {t.signInGoogle}
                </button>
              </div>

              <div className="mt-8 flex justify-center">
                <div className="rounded-[18px] border border-emerald-500/25 bg-emerald-500/[0.10] px-6 py-4 text-center text-[15px] font-semibold text-emerald-300">
                  {isBs
                    ? "Trial uključuje 2 besplatna testa od po 10 pitanja"
                    : "Trial includes 2 free tests of 10 questions"}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[34px] border border-white/10 bg-white/[0.05] p-8 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-orange-500/35 bg-orange-500/[0.08] text-orange-300">
                ⊕
              </div>
              <h3 className="text-[48px] font-black tracking-tight text-white">
                How it works
              </h3>
            </div>

            <div className="mt-10">
              <p className="text-[13px] font-bold uppercase tracking-[0.3em] text-orange-400">
                {isBs ? "PRAVILA" : "RULES"}
              </p>

              <div className="mt-6 space-y-7">
                {rules.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-4 text-[18px] leading-[1.8] text-zinc-200"
                  >
                    <span className="mt-2 text-[14px] text-zinc-300">□</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-9 border-t border-white/10 pt-8">
              <p className="text-[13px] font-bold uppercase tracking-[0.3em] text-orange-400">
                {isBs ? "BODOVANJE" : "SCORING"}
              </p>

              <div className="mt-6 space-y-7">
                {scoring.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-4 text-[18px] leading-[1.8] text-zinc-200"
                  >
                    <span className="mt-2 text-[15px] text-zinc-300">◎</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 pb-4 xl:grid-cols-2">
          <LeaderboardCard
            title="Your vs Friends"
            rows={topLocalRows}
            loading={false}
            emptyText={isBs ? "Još nema lokalnih rezultata." : "No local results yet."}
            positionLabel={formatOrdinal(localPosition || 0, isBs)}
            showYouRow={!!localYouRow && (localPosition || 0) > 8}
            youRow={localYouRow}
          />

          <LeaderboardCard
            title="Worldwide Score"
            rows={globalRows}
            loading={globalLoading}
            emptyText={isBs ? "Globalni ranking još je prazan." : "Global leaderboard is still empty."}
            positionLabel={formatOrdinal(globalPosition || 0, isBs)}
            showYouRow={!!globalYouRow && (globalPosition || 0) > 8}
            youRow={globalYouRow}
          />
        </section>

        <footer className="mt-auto pb-1 pt-0.5 text-center text-[11px] tracking-[0.14em] text-zinc-500">
          © ZEDA&apos;S Group LTD | AK Solutions
        </footer>
      </div>
    </main>
  );
}