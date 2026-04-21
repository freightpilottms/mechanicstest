import en from "@/messages/en";
import bs from "@/messages/bs";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const messages = {
  en,
  bs,
};

export type Locale = keyof typeof messages;

export const LOCALE_STORAGE_KEY = "mechanic_iq_locale";

export function getMessages(locale: Locale) {
  return messages[locale];
}

function isLocale(value: string): value is Locale {
  return value === "en" || value === "bs";
}

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  hydrated: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored && isLocale(stored)) {
        setLocaleState(stored);
      }
    } catch {
      // Ignore storage access errors.
    } finally {
      setHydrated(true);
    }
  }, []);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);

    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    } catch {
      // Ignore storage access errors.
    }
  };

  const value = useMemo(
    () => ({ locale, setLocale, hydrated }),
    [hydrated, locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used inside LocaleProvider");
  }

  return context;
}
