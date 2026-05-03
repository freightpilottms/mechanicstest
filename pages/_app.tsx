import type { AppProps } from "next/app";
import "@/styles/globals.css";
import { LocaleProvider } from "@/lib/locale-context";
import PwaRegistrar from "@/components/PwaRegistrar";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <LocaleProvider>
      <PwaRegistrar />
      <Component {...pageProps} />
    </LocaleProvider>
  );
}
