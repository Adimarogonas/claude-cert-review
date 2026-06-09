import "@/styles/globals.css";
import { ProgressProvider } from "@/controllers/ProgressContext";

export default function App({ Component, pageProps }) {
  return (
    <ProgressProvider>
      <main className="app-shell">
        <div className="app-surface">
          <Component {...pageProps} />
        </div>
      </main>
    </ProgressProvider>
  );
}
