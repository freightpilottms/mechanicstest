import { useMemo, useState } from "react";
import { getMessages, type Locale } from "@/lib/i18n";

const modes = [
  { key: "all", color: "from-orange-500 to-amber-400" },
  { key: "eu", color: "from-sky-500 to-cyan-400" },
  { key: "us", color: "from-red-500 to-rose-400" },
  { key: "asia", color: "from-emerald-500 to-lime-400" },
] as const;

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>("en");
  const t = useMemo(() => getMessages(locale), [locale]);

  const modeLabels = {
    all: t.modeAllCars,
    eu: t.modeEuropean,
    us: t.modeUs,
    asia: t.modeAsia,
  };

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

        <section className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1.15fr_0.85fr]">
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
                <button className="rounded-2xl bg-orange-500 px-5 py-4 text-base font-bold text-black transition hover:bg-orange-400">
                  {t.startSingle}
                </button>

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
            {modes.map((mode) => (
              <div
                key={mode.key}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`h-12 w-12 rounded-xl bg-gradient-to-br ${mode.color} shadow-lg`}
                  />
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                      Mode
                    </p>
                    <h3 className="text-lg font-bold text-white">
                      {modeLabels[mode.key]}
                    </h3>
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-400">
              Single player and multiplayer will use the same ranking profile.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}