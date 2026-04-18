import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getMessages, type Locale } from "@/lib/i18n";

const modes = [
  { key: "all", color: "from-orange-500 to-amber-400" },
  { key: "eu", color: "from-sky-500 to-cyan-400" },
  { key: "us", color: "from-red-500 to-rose-400" },
  { key: "asia", color: "from-emerald-500 to-lime-400" },
] as const;

type LeaderboardEntry = {
  user_id: string;
  display_name: string;
  total_points: number;
  average_score?: number;
  tests_played?: number;
  rank_label?: string;
};

type MeSummary = {
  user_id: string;
  display_name: string;
  total_points: number;
  average_score: number;
  tests_played: number;
  rank_label: string;
};

const GUEST_USER_ID_KEY = "mechanic_test_guest_user_id_v1";

function createGuestUserId() {
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreateGuestUserId() {
  if (typeof window === "undefined") return "";

  try {
    const existing = window.localStorage.getItem(GUEST_USER_ID_KEY);
    if (existing && existing.trim()) return existing.trim();

    const created = createGuestUserId();
    window.localStorage.setItem(GUEST_USER_ID_KEY, created);
    return created;
  } catch {
    return createGuestUserId();
  }
}

function getLocalizedRankLabel(raw: string | undefined, locale: Locale) {
  const value = String(raw || "").trim();
  if (!value) return locale === "bs" ? "Početnik" : "Beginner";

  if (locale === "en") return value;

  const normalized = value.toLowerCase();

  if (normalized === "master tech") return "Master Tech";
  if (normalized === "advanced mechanic") return "Napredni mehaničar";
  if (normalized === "advanced") return "Napredni";
  if (normalized === "intermediate mechanic") return "Srednji mehaničar";
  if (normalized === "intermediate") return "Srednji";
  if (normalized === "beginner") return "Početnik";

  return value;
}

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>("en");
  const t = useMemo(() => getMessages(locale), [locale]);

  const [globalTop, setGlobalTop] = useState<LeaderboardEntry[]>([]);
  const [me, setMe] = useState<MeSummary | null>(null);
  const [loadingBoards, setLoadingBoards] = useState(true);

  const modeLabels = {
    all: t.modeAllCars,
    eu: t.modeEuropean,
    us: t.modeUs,
    asia: t.modeAsia,
  };

  useEffect(() => {
    let cancelled = false;

    async function loadBoards() {
      try {
        setLoadingBoards(true);

        const guestUserId = getOrCreateGuestUserId();

        const [globalRes, meRes] = await Promise.allSettled([
          fetch("/api/leaderboards/global?limit=8"),
          fetch(`/api/leaderboards/me?user_id=${encodeURIComponent(guestUserId)}`),
        ]);

        if (!cancelled) {
          if (globalRes.status === "fulfilled") {
            const data = await globalRes.value.json().catch(() => null);
            if (globalRes.value.ok && data?.ok && Array.isArray(data?.entries)) {
              setGlobalTop(data.entries);
            } else {
              setGlobalTop([]);
            }
          } else {
            setGlobalTop([]);
          }

          if (meRes.status === "fulfilled") {
            const data = await meRes.value.json().catch(() => null);
            if (meRes.value.ok && data?.ok && data?.entry) {
              setMe(data.entry);
            } else {
              setMe(null);
            }
          } else {
            setMe(null);
          }
        }
      } finally {
        if (!cancelled) setLoadingBoards(false);
      }
    }

    loadBoards();

    return () => {
      cancelled = true;
    };
  }, []);

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

        <section className="grid flex-1 items-start gap-8 py-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
              <div className="max-w-2xl">
                <div className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
                  {t.chooseLanguage}: {locale.toUpperCase()}
                </div>

                <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                  {t.appName}
                </h2>

                <p className="mt-4 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">
                  {t.tagline}
                </p>

                <div className="mt-8 grid gap-3 sm:max-w-md">
                  <Link
                    href={`/single-player?lang=${locale}`}
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

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                  {locale === "bs" ? "Kako igra radi" : "How it works"}
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
                  <li>• {locale === "bs" ? "Dobijaš 10 scenarija po testu." : "You get 10 scenarios per test."}</li>
                  <li>• {locale === "bs" ? "Odgovaraš svojim riječima." : "You answer in your own words."}</li>
                  <li>• {locale === "bs" ? "AI ocjenjuje koliko si blizu pravom uzroku." : "AI scores how close you are to the correct root cause."}</li>
                  <li>• {locale === "bs" ? "Bolji odgovor i bolja potvrda kvara = više bodova." : "Better diagnosis and proof method = more points."}</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                  {locale === "bs" ? "Sistem bodovanja" : "Scoring system"}
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
                  <li>• {locale === "bs" ? "0–3 = slab odgovor" : "0–3 = weak answer"}</li>
                  <li>• {locale === "bs" ? "4–6 = djelimično tačno" : "4–6 = partial answer"}</li>
                  <li>• {locale === "bs" ? "7–8 = vrlo blizu" : "7–8 = very close"}</li>
                  <li>• {locale === "bs" ? "9–10 = tačno ili skoro potpuno tačno" : "9–10 = correct or nearly perfect"}</li>
                  <li>• {locale === "bs" ? "Bonus za objašnjenje i način testiranja." : "Bonus for explanation and proof method."}</li>
                </ul>
              </div>
            </div>

            <div className="grid gap-4">
              {modes.map((mode) => (
                <Link
                  key={mode.key}
                  href={`/single-player?lang=${locale}&mode=${mode.key}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition hover:bg-white/10"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-12 w-12 rounded-xl bg-gradient-to-br ${mode.color} shadow-lg`}
                    />
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                        {locale === "bs" ? "Mod" : "Mode"}
                      </p>
                      <h3 className="text-lg font-bold text-white">
                        {modeLabels[mode.key]}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                    {locale === "bs" ? "Moj profil" : "My Profile"}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-white">
                    {locale === "bs" ? "Trenutni rank i score" : "Current rank & score"}
                  </h3>
                </div>
              </div>

              {loadingBoards ? (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-zinc-400">
                  {locale === "bs" ? "Učitavanje..." : "Loading..."}
                </div>
              ) : me ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-orange-300">
                      {locale === "bs" ? "Rank" : "Rank"}
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">
                      {getLocalizedRankLabel(me.rank_label, locale)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {locale === "bs" ? "Ukupno bodova" : "Total points"}
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">{me.total_points}</p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {locale === "bs" ? "Prosjek" : "Average score"}
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">{me.average_score}</p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {locale === "bs" ? "Testova" : "Tests played"}
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">{me.tests_played}</p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-zinc-400">
                  {locale === "bs"
                    ? "Još nema spremljenih rezultata za ovaj uređaj."
                    : "No saved results yet for this device."}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-orange-400">
                    {locale === "bs" ? "Svjetski poredak" : "Global leaderboard"}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-white">
                    {locale === "bs" ? "Top 8 igrača" : "Top 8 players"}
                  </h3>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                <div className="grid grid-cols-[56px_1fr_110px_110px] bg-black/25 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  <div>#</div>
                  <div>{locale === "bs" ? "Igrač" : "Player"}</div>
                  <div>{locale === "bs" ? "Bodovi" : "Points"}</div>
                  <div>{locale === "bs" ? "Rank" : "Rank"}</div>
                </div>

                {loadingBoards ? (
                  <div className="px-4 py-6 text-sm text-zinc-400">
                    {locale === "bs" ? "Učitavanje..." : "Loading..."}
                  </div>
                ) : globalTop.length ? (
                  <div className="divide-y divide-white/10">
                    {globalTop.slice(0, 8).map((entry, index) => (
                      <div
                        key={`${entry.user_id}-${index}`}
                        className="grid grid-cols-[56px_1fr_110px_110px] items-center px-4 py-3 text-sm text-zinc-200"
                      >
                        <div className="font-black text-orange-300">{index + 1}</div>
                        <div className="truncate pr-3">
                          {entry.display_name || `Player ${index + 1}`}
                        </div>
                        <div>{entry.total_points ?? 0}</div>
                        <div className="truncate text-zinc-400">
                          {getLocalizedRankLabel(entry.rank_label, locale)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-sm text-zinc-400">
                    {locale === "bs"
                      ? "Leaderboard će se pojaviti kada se spreme prvi rezultati."
                      : "Leaderboard will appear once the first results are saved."}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-400">
              {locale === "bs"
                ? "Single player i multiplayer će koristiti isti ranking profil."
                : "Single player and multiplayer will use the same ranking profile."}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}