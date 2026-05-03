import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Locale = "bs" | "en";

type GenerationLog = {
  index: number;
  status: "created" | "existing" | "failed";
  title: string;
  detail: string;
};

function getCount(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value;
  const count = Number(raw || 10);
  return Math.max(1, Math.min(50, Number.isFinite(count) ? count : 10));
}

function getLocale(value: unknown): Locale {
  const raw = String(Array.isArray(value) ? value[0] : value || "bs").toLowerCase();
  return raw === "en" ? "en" : "bs";
}

export default function GenerateScenariosPage() {
  const router = useRouter();
  const autostartedRef = useRef(false);

  const initialCount = useMemo(() => getCount(router.query.count), [router.query.count]);
  const initialLocale = useMemo(
    () => getLocale(router.query.locale || router.query.lang),
    [router.query.lang, router.query.locale]
  );

  const [count, setCount] = useState(10);
  const [locale, setLocale] = useState<Locale>("bs");
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState(0);
  const [created, setCreated] = useState(0);
  const [existing, setExisting] = useState(0);
  const [failed, setFailed] = useState(0);
  const [logs, setLogs] = useState<GenerationLog[]>([]);

  useEffect(() => {
    if (!router.isReady) return;
    setCount(initialCount);
    setLocale(initialLocale);
  }, [initialCount, initialLocale, router.isReady]);

  const runBatch = useCallback(async () => {
    if (running) return;

    setRunning(true);
    setCurrent(0);
    setCreated(0);
    setExisting(0);
    setFailed(0);
    setLogs([]);

    let nextCreated = 0;
    let nextExisting = 0;
    let nextFailed = 0;

    for (let index = 1; index <= count; index += 1) {
      setCurrent(index);

      try {
        const params = new URLSearchParams({
          locale,
          nonce: `${Date.now()}-${index}`,
        });

        const response = await fetch(`/api/generate-one-scenario?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.ok) {
          throw new Error(data?.error || `HTTP ${response.status}`);
        }

        const scenario = data.scenario || {};
        const title = scenario.title || data.signature || `Scenario ${index}`;
        const vehicle = scenario.vehicle || data.seed?.vehicle || "unknown vehicle";
        const difficulty = scenario.difficulty || data.seed?.difficulty || "";

        if (data.existing) {
          nextExisting += 1;
          setExisting(nextExisting);
          setLogs((prev) => [
            {
              index,
              status: "existing",
              title,
              detail: `${vehicle}${difficulty ? ` | ${difficulty}` : ""}`,
            },
            ...prev,
          ]);
        } else {
          nextCreated += 1;
          setCreated(nextCreated);
          setLogs((prev) => [
            {
              index,
              status: "created",
              title,
              detail: `${vehicle}${difficulty ? ` | ${difficulty}` : ""}`,
            },
            ...prev,
          ]);
        }
      } catch (error: any) {
        nextFailed += 1;
        setFailed(nextFailed);
        setLogs((prev) => [
          {
            index,
            status: "failed",
            title: "Nije upisano u bazu",
            detail: String(error?.message || error || "Unknown error"),
          },
          ...prev,
        ]);
      }
    }

    setRunning(false);
  }, [count, locale, running]);

  useEffect(() => {
    if (!router.isReady || autostartedRef.current) return;
    const autostart = String(router.query.autostart || "") === "1";
    if (!autostart) return;
    autostartedRef.current = true;
    runBatch();
  }, [router.isReady, router.query.autostart, runBatch]);

  const progress = count ? Math.round(((running ? current - 1 : current) / count) * 100) : 0;
  const done = !running && current >= count && count > 0;

  return (
    <main className="min-h-screen bg-[#090b10] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">
              Mechanic IQ Admin
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
              Batch generator scenarija
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
              Pokrece vise pojedinacnih generisanja zaredom, pa jedan spor scenario ne
              obara cijeli batch zbog server timeouta.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-zinc-100 hover:bg-white/10"
          >
            Nazad
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <label className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
              Broj scenarija
            </span>
            <input
              value={count}
              min={1}
              max={50}
              type="number"
              disabled={running}
              onChange={(event) => setCount(getCount(event.target.value))}
              className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-xl font-black text-white outline-none focus:border-cyan-400"
            />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
              Jezik
            </span>
            <select
              value={locale}
              disabled={running}
              onChange={(event) => setLocale(getLocale(event.target.value))}
              className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-xl font-black text-white outline-none focus:border-cyan-400"
            >
              <option value="bs">Bosanski</option>
              <option value="en">English</option>
            </select>
          </label>

          <button
            type="button"
            onClick={runBatch}
            disabled={running}
            className="rounded-2xl bg-cyan-400 px-6 py-4 text-lg font-black text-slate-950 shadow-[0_0_40px_rgba(34,211,238,0.25)] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-zinc-600 disabled:text-zinc-300 md:self-stretch"
          >
            {running ? `Radi ${current}/${count}` : "Generisi"}
          </button>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                Progress
              </p>
              <p className="mt-1 text-3xl font-black">{running ? current : Math.min(current, count)}/{count}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                Upisano
              </p>
              <p className="mt-1 text-3xl font-black text-emerald-300">{created}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                Vec postoji
              </p>
              <p className="mt-1 text-3xl font-black text-amber-300">{existing}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                Puklo
              </p>
              <p className="mt-1 text-3xl font-black text-rose-300">{failed}</p>
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all"
              style={{ width: `${done ? 100 : progress}%` }}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">Rezultat</h2>
            <Link
              href="/api/test-supabase"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-zinc-100 hover:bg-white/10"
            >
              Provjeri bazu
            </Link>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {!logs.length ? (
              <p className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
                Nema jos rezultata.
              </p>
            ) : (
              logs.map((log) => (
                <div
                  key={`${log.index}-${log.status}-${log.title}`}
                  className="rounded-xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-bold text-white">
                      #{log.index} {log.title}
                    </p>
                    <span
                      className={
                        log.status === "created"
                          ? "text-sm font-black text-emerald-300"
                          : log.status === "existing"
                          ? "text-sm font-black text-amber-300"
                          : "text-sm font-black text-rose-300"
                      }
                    >
                      {log.status === "created"
                        ? "upisano"
                        : log.status === "existing"
                        ? "vec postoji"
                        : "greska"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">{log.detail}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
