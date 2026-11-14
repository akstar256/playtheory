"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Share2, Compass, Sparkles, HelpCircle, ShieldCheck, Check, Keyboard, Moon, Sun } from "lucide-react";
import { StoredSimulation } from "@/lib/store";
import { SimPlayer } from "@/components/SimPlayer";
import { ParamPanel } from "@/components/ParamPanel";
import { Plots } from "@/components/Plots";
import { TourPanel } from "@/components/TourPanel";
import { QuizPanel } from "@/components/QuizPanel";
import { MisconceptionsPanel } from "@/components/MisconceptionsPanel";
import { UnderTheHood } from "@/components/UnderTheHood";
import { ShareDialog } from "@/components/ShareDialog";
import { GuidedTour } from "@/lib/schemas/guide";
import { generateStaticTourFromSpec } from "@/lib/pipeline/guide";

interface SimulationViewProps {
  sim: StoredSimulation;
}

export function SimulationView({ sim }: SimulationViewProps) {
  const { spec, code } = sim;

  // Initialize parameters with defaults
  const initialParams = React.useMemo(() => {
    const p: Record<string, number> = {};
    for (const item of spec.parameters) {
      p[item.id] = item.default;
    }
    return p;
  }, [spec.parameters]);

  const [currentParams, setCurrentParams] = useState<Record<string, number>>(initialParams);
  const [metricsHistory, setMetricsHistory] = useState<{ t: number; metrics: Record<string, number> }[]>([]);
  const [activeMode, setActiveMode] = useState<"explore" | "guided" | "quiz" | "hood">("explore");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [latestMetricText, setLatestMetricText] = useState("");

  // Guided tour data (initial static fallback, then enhances via API)
  const [tour, setTour] = useState<GuidedTour>(() => generateStaticTourFromSpec(spec));

  useEffect(() => {
    fetch("/api/guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spec }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.tour) {
          setTour(data.tour);
        }
      })
      .catch(() => {});
  }, [spec]);

  // Dark mode toggle
  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Handle incoming metrics from sandboxed iframe
  const handleMetrics = (metrics: Record<string, number>, t: number) => {
    setMetricsHistory((prev) => {
      const next = [...prev, { t, metrics }];
      if (next.length > 120) next.shift();
      return next;
    });

    // Throttled readout for screen readers
    const metricStr = Object.entries(metrics)
      .slice(0, 3)
      .map(([k, v]) => `${k}: ${v.toFixed(1)}`)
      .join(", ");
    setLatestMetricText(metricStr);
  };

  const handleParamChange = (id: string, value: number) => {
    setCurrentParams((prev) => ({ ...prev, [id]: value }));
  };

  const handleApplyParams = (params: Record<string, number>) => {
    setCurrentParams((prev) => ({ ...prev, ...params }));
  };

  const handleOpenShare = () => {
    setIsShareOpen(true);
  };

  return (
    <div className="min-h-screen notebook-grid flex flex-col justify-between">
      {/* Hidden aria-live announcement region for screen readers */}
      <div aria-live="polite" className="sr-only">
        {latestMetricText}
      </div>

      {/* Header */}
      <header className="border-b border-paper-200 dark:border-paper-800 bg-paper-50/90 dark:bg-paper-900/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded hover:bg-paper-200 dark:hover:bg-paper-800 transition"
              title="Return to Home"
            >
              <ArrowLeft className="w-5 h-5 text-paper-700 dark:text-paper-300" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base tracking-tight truncate max-w-[200px] sm:max-w-md">
                  {spec.title}
                </h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-arcade-amber/20 text-paper-900 dark:text-paper-100 border border-arcade-amber/40">
                  {spec.archetype}
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-paper-200 dark:bg-paper-800 text-paper-700 dark:text-paper-300 hidden md:inline">
                  {spec.level}
                </span>
              </div>
              <p className="text-xs text-paper-500 truncate max-w-sm hidden sm:block">
                {spec.coreIdea}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded border border-paper-300 dark:border-paper-700 hover:border-arcade-crimson text-xs font-mono transition text-paper-700 dark:text-paper-300"
              title="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-arcade-amber" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Share Dialog Trigger */}
            <button
              onClick={() => setIsShareOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-paper-300 dark:border-paper-700 hover:border-arcade-crimson text-xs font-mono transition cursor-pointer"
              title="Share or embed simulation"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </header>

      {/* Modern Native Dialog Modal */}
      <ShareDialog
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={spec.title}
        slug={sim.slug}
      />

      {/* Main Simulation Viewport & Controls */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Canvas Screen & Telemetry Plots */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <SimPlayer
            code={code}
            initialParams={initialParams}
            currentParams={currentParams}
            onMetrics={handleMetrics}
          />

          <Plots
            spec={spec}
            metricsHistory={metricsHistory}
          />

          {/* Keyboard Shortcuts Hint Bar */}
          <div className="p-3 bg-paper-100/60 dark:bg-paper-800/40 border border-paper-200 dark:border-paper-700 rounded-xl flex flex-wrap items-center justify-between text-xs font-mono text-paper-500">
            <span className="flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5 text-arcade-amber" />
              Keyboard Shortcuts:
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span><kbd className="px-1.5 py-0.5 bg-paper-200 dark:bg-paper-700 rounded">Space</kbd> Play/Pause</span>
              <span><kbd className="px-1.5 py-0.5 bg-paper-200 dark:bg-paper-700 rounded">R</kbd> Reset</span>
              <span><kbd className="px-1.5 py-0.5 bg-paper-200 dark:bg-paper-700 rounded">→</kbd> Step Once</span>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Interactive Learning Mode Tabs */}
        <div className="lg:col-span-5 flex flex-col gap-4 cq-container">
          {/* Mode Tabs Header following Modern Web Guidance ui-components/tabs */}
          <div
            role="tablist"
            aria-label="Interactive learning modes"
            className="flex border-b border-paper-200 dark:border-paper-700 bg-paper-100/50 dark:bg-paper-800/40 p-1 rounded-xl text-xs font-mono"
          >
            <button
              type="button"
              role="tab"
              id="tab-explore"
              aria-selected={activeMode === "explore"}
              aria-controls="panel-explore"
              onClick={() => setActiveMode("explore")}
              className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMode === "explore"
                  ? "bg-white dark:bg-paper-900 text-paper-950 dark:text-paper-50 shadow-sm border border-paper-300 dark:border-paper-700"
                  : "text-paper-500 hover:text-paper-900"
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-arcade-crimson" />
              <span>Explore</span>
            </button>

            <button
              type="button"
              role="tab"
              id="tab-guided"
              aria-selected={activeMode === "guided"}
              aria-controls="panel-guided"
              onClick={() => setActiveMode("guided")}
              className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMode === "guided"
                  ? "bg-white dark:bg-paper-900 text-paper-950 dark:text-paper-50 shadow-sm border border-paper-300 dark:border-paper-700"
                  : "text-paper-500 hover:text-paper-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-arcade-amber" />
              <span>Guided</span>
            </button>

            <button
              type="button"
              role="tab"
              id="tab-quiz"
              aria-selected={activeMode === "quiz"}
              aria-controls="panel-quiz"
              onClick={() => setActiveMode("quiz")}
              className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMode === "quiz"
                  ? "bg-white dark:bg-paper-900 text-paper-950 dark:text-paper-50 shadow-sm border border-paper-300 dark:border-paper-700"
                  : "text-paper-500 hover:text-paper-900"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-arcade-cyan" />
              <span>Quiz</span>
            </button>

            <button
              type="button"
              role="tab"
              id="tab-hood"
              aria-selected={activeMode === "hood"}
              aria-controls="panel-hood"
              onClick={() => setActiveMode("hood")}
              className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMode === "hood"
                  ? "bg-white dark:bg-paper-900 text-paper-950 dark:text-paper-50 shadow-sm border border-paper-300 dark:border-paper-700"
                  : "text-paper-500 hover:text-paper-900"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-arcade-emerald" />
              <span>Proof</span>
            </button>
          </div>

          {/* Mode Contents Panels */}
          <div
            role="tabpanel"
            id="panel-explore"
            aria-labelledby="tab-explore"
            tabIndex={0}
            hidden={activeMode !== "explore"}
          >
            {activeMode === "explore" && (
              <ParamPanel
                spec={spec}
                currentParams={currentParams}
                onParamChange={handleParamChange}
                onApplyPreset={handleApplyParams}
              />
            )}
          </div>

          <div
            role="tabpanel"
            id="panel-guided"
            aria-labelledby="tab-guided"
            tabIndex={0}
            hidden={activeMode !== "guided"}
          >
            {activeMode === "guided" && (
              <TourPanel
                tour={tour}
                onApplyParams={handleApplyParams}
                onPlaySimulation={() => {}}
              />
            )}
          </div>

          <div
            role="tabpanel"
            id="panel-quiz"
            aria-labelledby="tab-quiz"
            tabIndex={0}
            hidden={activeMode !== "quiz"}
          >
            {activeMode === "quiz" && (
              <div className="space-y-4">
                <QuizPanel spec={spec} />
                <MisconceptionsPanel misconceptions={spec.misconceptions} />
              </div>
            )}
          </div>

          <div
            role="tabpanel"
            id="panel-hood"
            aria-labelledby="tab-hood"
            tabIndex={0}
            hidden={activeMode !== "hood"}
          >
            {activeMode === "hood" && (
              <UnderTheHood sim={sim} />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-paper-200 dark:border-paper-800 py-6 text-center text-xs font-mono text-paper-500">
        PlayTheory • Verified Simulation & Learning Journey
      </footer>
    </div>
  );
}
