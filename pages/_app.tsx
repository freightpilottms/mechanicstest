import type { AppProps } from "next/app";
import "@/styles/globals.css";
import { LocaleProvider } from "@/lib/i18n";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <LocaleProvider>
      <Component {...pageProps} />
    </LocaleProvider>
  );
}
