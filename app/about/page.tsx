import Link from "next/link";
import { ArrowLeft, Cpu, ShieldCheck, Sparkles, Layers, BookOpen, Terminal, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "About PlayTheory — Architecture & Mission",
  description: "Learn how PlayTheory turns concepts into verified interactive simulations using a compound AI pipeline.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen notebook-grid flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-paper-200 dark:border-paper-800 bg-paper-50/80 dark:bg-paper-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded hover:bg-paper-200 dark:hover:bg-paper-800 transition"
              title="Return to Home"
            >
              <ArrowLeft className="w-5 h-5 text-paper-700 dark:text-paper-300" />
            </Link>
            <span className="font-bold text-base font-mono uppercase tracking-wider">
              About PlayTheory
            </span>
          </div>

          <nav className="flex items-center gap-3 text-xs font-mono">
            <Link href="/status" className="hover:text-arcade-crimson underline">
              Status & Telemetry
            </Link>
            <Link href="/" className="hover:text-arcade-crimson underline">
              Home
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full text-left space-y-12">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-paper-300 dark:border-paper-700 bg-paper-100 dark:bg-paper-800 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-arcade-amber" />
            <span>IceHacks 2026 Submission</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-paper-950 dark:text-paper-50">
            Why PlayTheory?
          </h1>
          <p className="text-base sm:text-lg text-paper-700 dark:text-paper-300 leading-relaxed max-w-3xl">
            Textbooks and chatbot responses give learners flat paragraphs and static equations. But true physical intuition isn&apos;t formed by reading words—it is built by <strong>poking a system, cranking its parameters, and observing emergent phase shifts</strong>.
          </p>
          <p className="text-sm sm:text-base text-paper-600 dark:text-paper-400 leading-relaxed max-w-3xl">
            PlayTheory is not an LLM chatbot wrapper. It is a <strong>compound AI system</strong> with a planning phase, a constrained code generation phase, an automated 12-point client-side verification engine, and an autonomous self-repair loop that guarantees scientific rigor and user safety.
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-xl border border-paper-300 dark:border-paper-700 bg-white dark:bg-paper-900 shadow-sm space-y-3">
            <Cpu className="w-6 h-6 text-arcade-crimson" />
            <h2 className="font-bold text-base text-paper-900 dark:text-paper-100">
              Two-Phase Compound Pipeline
            </h2>
            <p className="text-xs text-paper-600 dark:text-paper-400 leading-relaxed">
              Separates abstract domain modeling (<code>SimSpec</code> with state variables, parameters, and equations) from low-level JavaScript code generation.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-paper-300 dark:border-paper-700 bg-white dark:bg-paper-900 shadow-sm space-y-3">
            <ShieldCheck className="w-6 h-6 text-arcade-emerald" />
            <h2 className="font-bold text-base text-paper-900 dark:text-paper-100">
              12-Point Automated Verifier
            </h2>
            <p className="text-xs text-paper-600 dark:text-paper-400 leading-relaxed">
              Before user display, generated code runs 600 steps in a sandboxed harness with AST loop guards, finite number checks, parameter sensitivity tests, and canvas variance checks.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-paper-300 dark:border-paper-700 bg-white dark:bg-paper-900 shadow-sm space-y-3">
            <BookOpen className="w-6 h-6 text-arcade-cyan" />
            <h2 className="font-bold text-base text-paper-900 dark:text-paper-100">
              Active Learning Framework
            </h2>
            <p className="text-xs text-paper-600 dark:text-paper-400 leading-relaxed">
              Incorporates physics education research: predict-then-reveal guided tours, targeted misconception callouts, and conceptual mastery quizzes.
            </p>
          </div>
        </div>

        {/* Pipeline Architecture Walkthrough */}
        <div className="p-6 rounded-xl border-2 border-paper-900 dark:border-paper-300 bg-white dark:bg-paper-900 shadow-[4px_4px_0px_0px_rgba(24,23,21,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,247,238,1)] space-y-6">
          <div className="flex items-center gap-2 border-b border-paper-200 dark:border-paper-800 pb-3">
            <Terminal className="w-5 h-5 text-arcade-amber" />
            <h2 className="font-bold font-mono text-sm uppercase tracking-wider text-paper-900 dark:text-paper-100">
              Under the Hood: The Verification Loop
            </h2>
          </div>

          <div className="space-y-4 text-xs font-mono text-paper-700 dark:text-paper-300">
            <div className="flex items-start gap-3">
              <span className="font-bold text-arcade-crimson shrink-0">01.</span>
              <div>
                <strong>Planner (Gemini 2.5 Pro):</strong> Ingests natural-language topic, selects an archetype (<code>particles</code>, <code>ode_phase</code>, <code>agents</code>, <code>cellular_automaton</code>, <code>queue_flow</code>), and outputs validated <code>SimSpec</code> JSON with strict bounds.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="font-bold text-arcade-crimson shrink-0">02.</span>
              <div>
                <strong>Builder (Gemini 2.5 Flash):</strong> Streams ES2020 simulation code conforming to the <code>init/step/metrics/draw</code> interface, utilizing the built-in <code>SimKit</code> mathematics library.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="font-bold text-arcade-crimson shrink-0">03.</span>
              <div>
                <strong>AST Loop Guard:</strong> Acorn parses the AST and injects counter limits (<code>__pt_loop_ctr_X</code>) into all <code>for</code>/<code>while</code> loops to prevent infinite freezes.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="font-bold text-arcade-crimson shrink-0">04.</span>
              <div>
                <strong>Model & Draw Checks:</strong> Simulates 600 steps, sweeps parameters to detect dead sliders, validates numerical bounds (no NaNs or infinities), and ensures non-blank animated canvas output.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="font-bold text-arcade-crimson shrink-0">05.</span>
              <div>
                <strong>Autonomous Self-Repair:</strong> If any check fails, the repair agent is invoked with the exact failing check details, diffing and patching the code until all 12 checks pass (capped at 3 signed attempts).
              </div>
            </div>
          </div>
        </div>

        {/* Hackathon Submission Credentials */}
        <div className="space-y-3">
          <h2 className="font-bold font-mono text-xs uppercase tracking-wider text-paper-500">
            IceHacks 2026 Target Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-paper-300 dark:border-paper-700 bg-paper-100/60 dark:bg-paper-800/60">
              <span className="text-xs font-bold text-arcade-crimson block mb-1">
                🏆 Best Deployed / Shipped App
              </span>
              <p className="text-xs text-paper-600 dark:text-paper-400">
                Fully functional, live production deployment on Vercel backed by serverless Upstash Redis cache, automated CI/CD, and live health monitoring.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-paper-300 dark:border-paper-700 bg-paper-100/60 dark:bg-paper-800/60">
              <span className="text-xs font-bold text-arcade-cyan block mb-1">
                🧠 Best AI Hack
              </span>
              <p className="text-xs text-paper-600 dark:text-paper-400">
                Autonomous multi-stage compound AI pipeline with automated code generation, AST instrumentation, 12-point client-side verification, and self-repair.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-paper-200 dark:border-paper-800 py-6 text-center text-xs font-mono text-paper-500">
        PlayTheory • IceHacks 2026 Hackathon • Built with Next.js, Google Gemini & Upstash Redis
      </footer>
    </div>
  );
}
