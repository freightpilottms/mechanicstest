import { getMessages } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function PwaInstallButton({
  className = "",
}: {
  className?: string;
}) {
  const { locale } = useLocale();
  const t = useMemo(() => getMessages(locale), [locale]);
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (standalone) {
      setInstalled(true);
    }

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    }

    function onInstalled() {
      setInstalled(true);
      setPromptEvent(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <span
        className={`rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300 ${className}`}
      >
        {t.appInstalled}
      </span>
    );
  }

  if (!promptEvent) return null;

  async function install() {
    if (!promptEvent) return;

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;

    if (choice.outcome === "accepted") {
      setInstalled(true);
    }

    setPromptEvent(null);
  }

  return (
    <button
      type="button"
      onClick={install}
      className={`rounded-xl border border-orange-500/30 bg-orange-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-orange-400 ${className}`}
    >
      {t.installApp}
    </button>
  );
}
