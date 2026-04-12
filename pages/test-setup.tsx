import Link from "next/link";
import { useRouter } from "next/router";

export default function TestSetupPage() {
  const router = useRouter();
  const { mode = "all", lang = "en" } = router.query;

  return (
    <main className="min-h-screen bg-[#0a0d12] px-4 py-6 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8">
        <Link
          href="/single-player"
          className="inline-flex rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
        >
          ← Back
        </Link>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-orange-400">
          Test Setup
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight">
          Mechanic IQ Test
        </h1>

        <div className="mt-6 grid gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
            <strong>Mode:</strong> {String(mode)}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
            <strong>Language:</strong> {String(lang).toUpperCase()}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
            <strong>Questions:</strong> 10
          </div>
        </div>

        <Link
  href={`/test?mode=${String(mode)}&lang=${String(lang)}`}
  className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-orange-500 px-5 py-4 text-base font-bold text-black transition hover:bg-orange-400"
>
  Continue
</Link>

        <p className="mt-4 text-sm text-zinc-500">
          Next step: we will connect this screen to real generated questions.
        </p>
      </div>
    </main>
  );
}