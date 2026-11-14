import Link from "next/link";
import { Sparkles, Terminal, Activity, CheckCircle2 } from "lucide-react";

const EXAMPLE_CONCEPTS = [
  "TCP congestion control",
  "Predator-prey dynamics",
  "Supply & demand shocks",
  "Projectile motion with air drag",
  "Gradient descent on a loss landscape",
  "Epidemic SIR model",
];

export default function Home() {
  return (
    <div className="min-h-screen notebook-grid flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-paper-200 dark:border-paper-800 bg-paper-50/80 dark:bg-paper-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono font-black text-xl tracking-tighter text-paper-950 dark:text-paper-50 bg-arcade-amber px-2 py-0.5 rounded shadow-sm">
              PT
            </span>
            <span className="font-bold text-lg tracking-tight">PlayTheory</span>
            <span className="text-xs bg-paper-200 dark:bg-paper-800 px-2 py-0.5 rounded-full font-mono text-paper-800 dark:text-paper-200">
              Phase 0 Skeleton
            </span>
          </div>

          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link
              href="/api/health"
              className="flex items-center gap-1.5 text-xs font-mono bg-paper-100 hover:bg-paper-200 dark:bg-paper-800 dark:hover:bg-paper-700 px-2.5 py-1 rounded border border-paper-300 dark:border-paper-700 transition"
              target="_blank"
            >
              <Activity className="w-3.5 h-3.5 text-arcade-emerald" />
              API Health
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-16 flex-1 flex flex-col justify-center items-center text-center">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-paper-300 dark:border-paper-700 bg-paper-100 dark:bg-paper-800 text-xs font-mono mb-8">
          <span className="w-2 h-2 rounded-full bg-arcade-emerald animate-pulse" />
          <span>IceHacks 2026 • Foundation Active</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4 text-paper-950 dark:text-paper-50">
          Turn any concept into an{" "}
          <span className="text-arcade-crimson underline decoration-wavy decoration-2">
            interactive simulation
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-paper-800 dark:text-paper-200 max-w-2xl mb-10">
          PlayTheory isn’t a chatbot. It is a compound AI pipeline: it plans, codes against a sandboxed runtime, executes a 12-point verifier, and self-repairs in real time.
        </p>

        {/* Prompt Input Form Skeleton */}
        <div className="w-full max-w-2xl bg-white dark:bg-paper-900 border-2 border-paper-900 dark:border-paper-300 rounded-xl p-3 shadow-[4px_4px_0px_0px_rgba(24,23,21,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,247,238,1)] transition mb-6 text-left">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center px-3 py-2">
              <Terminal className="w-5 h-5 text-paper-400 mr-2 shrink-0" />
              <input
                type="text"
                disabled
                placeholder="What do you want to play with? (e.g. TCP congestion control)"
                className="w-full bg-transparent outline-none text-paper-900 dark:text-paper-50 placeholder:text-paper-400 text-base"
                defaultValue="TCP congestion control"
              />
            </div>
            <button
              disabled
              className="bg-paper-900 text-paper-50 dark:bg-paper-50 dark:text-paper-950 font-bold px-6 py-3 rounded-lg flex items-center justify-center gap-2 opacity-90 cursor-not-allowed text-sm uppercase tracking-wide"
            >
              <Sparkles className="w-4 h-4 text-arcade-amber" />
              Build (Phase 1)
            </button>
          </div>
        </div>

        {/* Example Chips */}
        <div className="w-full max-w-2xl flex flex-wrap gap-2 items-center justify-center">
          <span className="text-xs font-mono text-paper-500 uppercase tracking-wider mr-1">
            Presets:
          </span>
          {EXAMPLE_CONCEPTS.map((concept) => (
            <span
              key={concept}
              className="text-xs font-mono bg-paper-100 dark:bg-paper-800 border border-paper-300 dark:border-paper-700 px-2.5 py-1 rounded text-paper-800 dark:text-paper-200 cursor-pointer hover:border-arcade-crimson transition"
            >
              {concept}
            </span>
          ))}
        </div>

        {/* Architecture Checklist Preview */}
        <div className="mt-16 w-full max-w-2xl bg-paper-100/70 dark:bg-paper-800/50 border border-paper-200 dark:border-paper-700 rounded-lg p-6 text-left">
          <h2 className="font-bold text-sm uppercase tracking-wider font-mono text-paper-700 dark:text-paper-300 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-arcade-emerald" />
            Phase 0 Foundation Checklist
          </h2>
          <ul className="text-sm font-mono space-y-2 text-paper-600 dark:text-paper-400">
            <li>✔ Strict Next.js App Router + TypeScript + Tailwind</li>
            <li>✔ Dual-mode Store interface (In-Memory + Upstash Redis)</li>
            <li>✔ Live health check endpoint at <code className="bg-paper-200 dark:bg-paper-700 px-1 py-0.5 rounded">/api/health</code></li>
            <li>✔ Unit and integration test harnesses configured (Vitest + Playwright)</li>
            <li>⏳ Next: Phase 1 Vertical Slice (Planner, Builder, SimKit, Sandboxed Iframe)</li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-paper-200 dark:border-paper-800 py-6 text-center text-xs font-mono text-paper-500">
        PlayTheory • IceHacks 2026 Hackathon • Built with Next.js, Google Gemini & Upstash
      </footer>
    </div>
  );
}
