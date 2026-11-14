"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Share2, Code2, Compass, Check } from "lucide-react";
import { StoredSimulation } from "@/lib/store";
import { SimPlayer } from "@/components/SimPlayer";
import { ParamPanel } from "@/components/ParamPanel";
import { Plots } from "@/components/Plots";

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
  const [activeTab, setActiveTab] = useState<"explore" | "code">("explore");
  const [copied, setCopied] = useState(false);

  // Handle incoming metrics from sandboxed iframe
  const handleMetrics = (metrics: Record<string, number>, t: number) => {
    setMetricsHistory((prev) => {
      const next = [...prev, { t, metrics }];
      if (next.length > 120) next.shift(); // keep last 120 points
      return next;
    });
  };

  // Handle slider changes
  const handleParamChange = (id: string, value: number) => {
    setCurrentParams((prev) => ({ ...prev, [id]: value }));
  };

  // Handle preset application
  const handleApplyPreset = (presetParams: Record<string, number>) => {
    setCurrentParams((prev) => ({ ...prev, ...presetParams }));
  };

  // Share link copy
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen notebook-grid flex flex-col justify-between">
      {/* Simulation Header */}
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
                <h1 className="font-bold text-base sm:text-lg tracking-tight truncate max-w-[280px] sm:max-w-md">
                  {spec.title}
                </h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-arcade-amber/20 text-paper-900 dark:text-paper-100 border border-arcade-amber/40">
                  {spec.archetype}
                </span>
              </div>
              <p className="text-xs text-paper-500 truncate max-w-sm hidden sm:block">
                {spec.coreIdea}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-paper-300 dark:border-paper-700 hover:border-arcade-crimson text-xs font-mono transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-arcade-emerald" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Share"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Simulation Layout */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Canvas Simulation Viewport & Live Plots */}
        <div className="lg:col-span-8 flex flex-col gap-6">
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
        </div>

        {/* Right Column (4 cols): Control Tabs */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Tab Switcher */}
          <div className="flex border-b border-paper-200 dark:border-paper-700">
            <button
              onClick={() => setActiveTab("explore")}
              className={`flex items-center gap-1.5 px-4 py-2 font-mono text-xs font-bold border-b-2 transition ${
                activeTab === "explore"
                  ? "border-arcade-crimson text-paper-950 dark:text-paper-50"
                  : "border-transparent text-paper-500 hover:text-paper-800"
              }`}
            >
              <Compass className="w-4 h-4" />
              Explore
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-1.5 px-4 py-2 font-mono text-xs font-bold border-b-2 transition ${
                activeTab === "code"
                  ? "border-arcade-crimson text-paper-950 dark:text-paper-50"
                  : "border-transparent text-paper-500 hover:text-paper-800"
              }`}
            >
              <Code2 className="w-4 h-4" />
              Code
            </button>
          </div>

          {/* Active Tab Content */}
          {activeTab === "explore" ? (
            <ParamPanel
              spec={spec}
              currentParams={currentParams}
              onParamChange={handleParamChange}
              onApplyPreset={handleApplyPreset}
            />
          ) : (
            <div className="bg-paper-950 text-paper-50 p-4 rounded-xl border-2 border-paper-900 font-mono text-xs overflow-x-auto max-h-[500px]">
              <pre>
                <code>{code}</code>
              </pre>
            </div>
          )}

          {/* Educational Objectives Card */}
          <div className="bg-paper-100/70 dark:bg-paper-800/40 border border-paper-200 dark:border-paper-700 rounded-xl p-4 text-xs">
            <h3 className="font-bold font-mono uppercase text-paper-700 dark:text-paper-300 mb-2">
              Key Concepts & Dynamics
            </h3>
            <p className="text-paper-600 dark:text-paper-400 mb-3">
              {spec.dynamics}
            </p>
            <ul className="list-disc pl-4 space-y-1 text-paper-600 dark:text-paper-400">
              {spec.learningObjectives.map((obj: string, i: number) => (
                <li key={i}>{obj}</li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-paper-200 dark:border-paper-800 py-6 text-center text-xs font-mono text-paper-500">
        PlayTheory • Interactive Model & Sandbox Runtime
      </footer>
    </div>
  );
}
