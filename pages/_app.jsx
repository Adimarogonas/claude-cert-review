import Head from "next/head";
import "@/styles/globals.css";
import { ProgressProvider } from "@/controllers/ProgressContext";

export default function App({ Component, pageProps }) {
  return (
    <ProgressProvider>
      <Head>
        <link rel="icon" type="image/svg+xml" href="/brand/symbol-carbon.svg" />
        <meta name="theme-color" content="#f5f3ee" />
      </Head>
      <main className="app-shell">
        {/* Brand header — quiet CSL slab mark + practice-suite tag */}
        <header className="brand-bar">
          <img className="brand-bar__slab" src="/brand/symbol-carbon.svg" alt="" aria-hidden="true" />
          <span className="brand-bar__mark">CarbonSilicon Labs</span>
          <span className="brand-bar__rule" />
          <span className="brand-bar__tag">Certification Practice</span>
        </header>
        <div className="app-surface">
          <Component {...pageProps} />
        </div>
      </main>
    </ProgressProvider>
  );
}
