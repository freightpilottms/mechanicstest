import type { AppProps } from "next/app";
import "@/styles/globals.css";
import { LocaleProvider } from "@/lib/locale-context";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <LocaleProvider>
      <Component {...pageProps} />
    </LocaleProvider>
  );
}
