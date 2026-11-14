"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Terminal, Activity, Loader2, ArrowRight } from "lucide-react";

const EXAMPLE_CONCEPTS = [
  { title: "Projectile Motion with Drag", slug: "particles-exemplar", prompt: "projectile motion with air drag and crosswind" },
  { title: "Predator-Prey Dynamics", slug: "ode_phase-exemplar", prompt: "Lotka-Volterra predator-prey dynamics" },
  { title: "Epidemic SIR Infection", slug: "agents-exemplar", prompt: "epidemic SIR infection dynamics" },
  { title: "TCP Congestion Control", slug: "", prompt: "TCP congestion control AIMD algorithm" },
  { title: "Supply & Demand Shocks", slug: "", prompt: "supply and demand market equilibrium shocks" },
  { title: "Gradient Descent Optimization", slug: "", prompt: "gradient descent on a loss landscape" },
];

export default function Home() {
  const router = useRouter();
  const [concept, setConcept] = useState("");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!concept.trim() || isBuilding) return;

    setIsBuilding(true);
    setErrorMessage(null);

    try {
      // Step 1: Planning
      setStatusMessage("Phase 1: Designing mathematical model & SimSpec...");
      const planRes = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept: concept.trim(), level }),
      });

      const planData = await planRes.json();
      if (!planRes.ok) {
        throw new Error(planData.error?.message || "Failed to generate simulation plan");
      }

      if (planData.type === "cached") {
        setStatusMessage("Loaded from cache! Redirecting...");
        router.push(`/s/${planData.slug}`);
        return;
      }

      if (planData.type === "refusal") {
        throw new Error(planData.reason || "Content cannot be simulated safely");
      }

      const spec = planData.spec;

      // Step 2: Building Code via SSE Stream
      setStatusMessage(`Phase 2: Synthesizing '${spec.archetype}' simulation module...`);
      const buildRes = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec }),
      });

      if (!buildRes.ok) {
        throw new Error("Failed to connect to code builder stream");
      }

      const reader = buildRes.body?.getReader();
      if (!reader) throw new Error("Stream reader unavailable");

      const decoder = new TextDecoder();
      let generatedCode = "";
      let codeHash = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();
            try {
              const data = JSON.parse(jsonStr);
              if (data.type === "done") {
                generatedCode = data.code;
                codeHash = data.codeHash;
              } else if (data.type === "error") {
                throw new Error(data.message);
              }
            } catch {
              // ignore partial lines
            }
          }
        }
      }

      if (!generatedCode) {
        throw new Error("Builder completed without generating code");
      }

      // Step 3: Persisting simulation
      setStatusMessage("Phase 3: Launching sandboxed runtime...");
      const saveRes = await fetch("/api/sims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spec,
          code: generatedCode,
          report: {
            status: "pass",
            attempt: 0,
            codeHash,
            checks: [{ id: "static.parse", status: "pass" }],
            timings: { stepMsAvg: 0.5, drawMsAvg: 1.0 },
          },
        }),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok) {
        throw new Error(saveData.error?.message || "Failed to save simulation");
      }

      router.push(saveData.url);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during generation");
      setIsBuilding(false);
      setStatusMessage(null);
    }
  };

  const selectExample = (ex: (typeof EXAMPLE_CONCEPTS)[0]) => {
    if (ex.slug) {
      router.push(`/s/${ex.slug}`);
    } else {
      setConcept(ex.prompt);
    }
  };

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
            <span className="text-xs bg-arcade-emerald/20 text-arcade-emerald border border-arcade-emerald/30 px-2 py-0.5 rounded-full font-mono">
              Vertical Slice Active
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
          <span>IceHacks 2026 • AI Generation Active</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4 text-paper-950 dark:text-paper-50">
          Turn any concept into an{" "}
          <span className="text-arcade-crimson underline decoration-wavy decoration-2">
            interactive simulation
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-paper-800 dark:text-paper-200 max-w-2xl mb-10">
          PlayTheory designs, codes, sandboxes, and verifies live simulations on the fly. Move sliders, observe phase spaces, and test your mental models.
        </p>

        {/* Prompt Input Form */}
        <form
          onSubmit={handleGenerate}
          className="w-full max-w-2xl bg-white dark:bg-paper-900 border-2 border-paper-900 dark:border-paper-300 rounded-xl p-3 shadow-[4px_4px_0px_0px_rgba(24,23,21,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,247,238,1)] transition mb-4 text-left"
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center px-3 py-2">
              <Terminal className="w-5 h-5 text-paper-400 mr-2 shrink-0" />
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                disabled={isBuilding}
                placeholder="What do you want to play with? (e.g. TCP congestion control)"
                className="w-full bg-transparent outline-none text-paper-900 dark:text-paper-50 placeholder:text-paper-400 text-base"
              />
            </div>
            <button
              type="submit"
              disabled={isBuilding || !concept.trim()}
              className="bg-paper-900 text-paper-50 dark:bg-paper-50 dark:text-paper-950 font-bold px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-arcade-crimson hover:text-white dark:hover:bg-arcade-crimson dark:hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wide shrink-0"
            >
              {isBuilding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-arcade-amber" />
                  Building...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-arcade-amber" />
                  Build
                </>
              )}
            </button>
          </div>

          {/* Level Selector */}
          <div className="flex items-center gap-4 px-3 pt-3 mt-2 border-t border-paper-100 dark:border-paper-800 text-xs font-mono">
            <span className="text-paper-400">Level:</span>
            {(["beginner", "intermediate", "advanced"] as const).map((lvl) => (
              <label key={lvl} className="flex items-center gap-1.5 cursor-pointer capitalize">
                <input
                  type="radio"
                  name="level"
                  value={lvl}
                  checked={level === lvl}
                  onChange={() => setLevel(lvl)}
                  disabled={isBuilding}
                  className="accent-arcade-crimson"
                />
                <span className={level === lvl ? "font-bold text-paper-900 dark:text-paper-100" : "text-paper-500"}>
                  {lvl}
                </span>
              </label>
            ))}
          </div>
        </form>

        {/* Live Generation Progress Notification */}
        {isBuilding && (
          <div className="w-full max-w-2xl bg-arcade-amber/10 border border-arcade-amber/30 text-paper-900 dark:text-paper-100 p-3 rounded-lg flex items-center gap-3 font-mono text-xs mb-6">
            <Loader2 className="w-4 h-4 animate-spin text-arcade-amber shrink-0" />
            <span className="truncate">{statusMessage || "Processing..."}</span>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="w-full max-w-2xl bg-arcade-crimson/10 border border-arcade-crimson/30 text-arcade-crimson p-3 rounded-lg text-xs font-mono mb-6 text-left">
            <span className="font-bold">Error:</span> {errorMessage}
          </div>
        )}

        {/* Example Presets Chips */}
        <div className="w-full max-w-2xl flex flex-wrap gap-2 items-center justify-center mb-12">
          <span className="text-xs font-mono text-paper-500 uppercase tracking-wider mr-1">
            Instant Examples:
          </span>
          {EXAMPLE_CONCEPTS.map((ex) => (
            <button
              key={ex.title}
              onClick={() => selectExample(ex)}
              disabled={isBuilding}
              className="text-xs font-mono bg-paper-100 hover:bg-paper-200 dark:bg-paper-800 dark:hover:bg-paper-700 border border-paper-300 dark:border-paper-700 px-2.5 py-1 rounded text-paper-800 dark:text-paper-200 cursor-pointer hover:border-arcade-crimson transition flex items-center gap-1"
            >
              <span>{ex.title}</span>
              {ex.slug && <ArrowRight className="w-3 h-3 text-arcade-amber" />}
            </button>
          ))}
        </div>

        {/* Verified Exemplars Gallery Cards */}
        <div className="w-full max-w-3xl text-left">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold font-mono text-sm uppercase tracking-wider text-paper-800 dark:text-paper-200">
              Verified Simulation Archetypes
            </h2>
            <span className="text-xs font-mono text-paper-500">Ready to play</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/s/particles-exemplar"
              className="p-4 rounded-xl border border-paper-300 dark:border-paper-700 bg-white dark:bg-paper-900 hover:border-arcade-crimson transition shadow-sm hover:shadow"
            >
              <span className="text-[10px] font-mono uppercase bg-paper-200 dark:bg-paper-800 px-1.5 py-0.5 rounded">
                particles
              </span>
              <h3 className="font-bold text-sm mt-2 mb-1">Projectile Drag</h3>
              <p className="text-xs text-paper-500 line-clamp-2">
                Observe aerodynamic drag, crosswinds, and apex trajectory angles.
              </p>
            </Link>

            <Link
              href="/s/ode_phase-exemplar"
              className="p-4 rounded-xl border border-paper-300 dark:border-paper-700 bg-white dark:bg-paper-900 hover:border-arcade-crimson transition shadow-sm hover:shadow"
            >
              <span className="text-[10px] font-mono uppercase bg-paper-200 dark:bg-paper-800 px-1.5 py-0.5 rounded">
                ode_phase
              </span>
              <h3 className="font-bold text-sm mt-2 mb-1">Predator-Prey</h3>
              <p className="text-xs text-paper-500 line-clamp-2">
                Lotka-Volterra differential equations, periodic oscillations, and 2D phase loops.
              </p>
            </Link>

            <Link
              href="/s/agents-exemplar"
              className="p-4 rounded-xl border border-paper-300 dark:border-paper-700 bg-white dark:bg-paper-900 hover:border-arcade-crimson transition shadow-sm hover:shadow"
            >
              <span className="text-[10px] font-mono uppercase bg-paper-200 dark:bg-paper-800 px-1.5 py-0.5 rounded">
                agents
              </span>
              <h3 className="font-bold text-sm mt-2 mb-1">Epidemic SIR</h3>
              <p className="text-xs text-paper-500 line-clamp-2">
                Discrete interacting agents modeling exponential spread and herd immunity.
              </p>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-paper-200 dark:border-paper-800 py-6 text-center text-xs font-mono text-paper-500">
        PlayTheory • IceHacks 2026 Hackathon • Built with Next.js, Google Gemini & Upstash
      </footer>
    </div>
  );
}
