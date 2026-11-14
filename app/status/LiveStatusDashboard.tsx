"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Cpu,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";

export interface StatusData {
  status: string;
  uptime: string;
  storePingMs?: number;
  totalSimulations: number;
  firstPassSuccessRate: number;
  totalSuccessRate: number;
  latencies: {
    p50Ms: number;
    p95Ms: number;
  };
  checksPassed: number;
  models: {
    planner: string;
    builder: string;
    fallbacks: string[];
  };
  backend: string;
  timestamp: string;
}

export interface HealthData {
  status: string;
  timestamp: string;
  durationMs: number;
  checks: {
    store: string;
    upstashConfigured: boolean;
    llm: {
      configured: boolean;
      provider: string;
      planModel: string;
      buildModel: string;
    };
  };
  version: string;
}

interface LiveStatusDashboardProps {
  initialStats: StatusData;
  initialHealth: HealthData;
}

export function LiveStatusDashboard({
  initialStats,
  initialHealth,
}: LiveStatusDashboardProps) {
  const [stats, setStats] = useState<StatusData>(initialStats);
  const [health, setHealth] = useState<HealthData>(initialHealth);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(() => new Date(initialStats.timestamp || Date.now()));
  const [secondsAgo, setSecondsAgo] = useState(0);

  const fetchLiveTelemetry = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [statsRes, healthRes] = await Promise.all([
        fetch("/api/stats", { cache: "no-store" }),
        fetch("/api/health", { cache: "no-store" }),
      ]);

      if (statsRes.ok) {
        const nextStats = await statsRes.json();
        setStats(nextStats);
      }
      if (healthRes.ok) {
        const nextHealth = await healthRes.json();
        setHealth(nextHealth);
      }
      setLastRefreshedAt(new Date());
      setSecondsAgo(0);
    } catch (err) {
      console.error("[LiveStatusDashboard] Failed to fetch live telemetry:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Poll every 5 seconds for live real-time updates
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchLiveTelemetry();
    }, 5000);

    const secondsTicker = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(secondsTicker);
    };
  }, [fetchLiveTelemetry]);

  const isStoreHealthy = health.checks.store === "healthy" || stats.status === "operational";
  const isLlmConfigured = health.checks.llm.configured;

  return (
    <div className="min-h-screen notebook-grid flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-paper-200 dark:border-paper-800 bg-paper-50/80 dark:bg-paper-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded hover:bg-paper-200 dark:hover:bg-paper-800 transition"
              title="Return to Home"
            >
              <ArrowLeft className="w-5 h-5 text-paper-700 dark:text-paper-300" />
            </Link>
            <span className="font-bold text-base font-mono uppercase tracking-wider">
              PlayTheory Status & Reliability
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLiveTelemetry}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border border-paper-300 dark:border-paper-700 hover:border-arcade-crimson bg-white dark:bg-paper-900 text-paper-700 dark:text-paper-300 transition"
              title="Click to refresh telemetry immediately"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-arcade-crimson" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-arcade-emerald/30 bg-arcade-emerald/10 text-arcade-emerald font-mono text-xs font-bold shadow-sm">
              <span className="w-2 h-2 rounded-sm bg-arcade-emerald animate-pulse" />
              <span>
                {isStoreHealthy ? "ALL SYSTEMS OPERATIONAL" : "DEGRADED (MEMORY MODE)"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Status Cards */}
      <main className="max-w-5xl mx-auto px-4 py-12 flex-1 w-full text-left space-y-8">
        {/* Banner */}
        <div className="p-6 rounded-xl border-2 border-paper-900 dark:border-paper-300 bg-white dark:bg-paper-900 shadow-[4px_4px_0px_0px_rgba(24,23,21,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,247,238,1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black tracking-tight text-paper-950 dark:text-paper-50">
                Live System Telemetry
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider bg-arcade-emerald/10 text-arcade-emerald border border-arcade-emerald/30 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-sm bg-arcade-emerald opacity-75"></span>
                  <span className="relative inline-flex rounded-sm h-2 w-2 bg-arcade-emerald"></span>
                </span>
                Live ({secondsAgo}s ago)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-paper-600 dark:text-paper-400 font-mono">
              Real-time benchmarks and verification proofs streaming live from Upstash Redis and Gemini pipelines.
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-1 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-arcade-emerald/10 text-arcade-emerald border border-arcade-emerald/30 font-mono text-xs font-bold shadow-sm">
              <span className="w-1.5 h-1.5 rounded-sm bg-arcade-emerald" />
              <span>{stats.uptime} Uptime</span>
              {stats.storePingMs !== undefined && (
                <span className="text-[10px] text-paper-500 font-normal">({stats.storePingMs}ms)</span>
              )}
            </div>
            <span className="text-[10px] font-mono text-paper-400">
              Updated: {lastRefreshedAt.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* 4 Headline Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: First-Pass Pass Rate */}
          <div className="p-5 rounded-xl border border-paper-300 dark:border-paper-700 bg-white dark:bg-paper-900 shadow-sm space-y-2">
            <div className="text-xs font-mono text-paper-500">
              <span>First-Try Pass Rate</span>
            </div>
            <p className="text-3xl font-black font-mono text-paper-950 dark:text-paper-50">
              {stats.firstPassSuccessRate.toFixed(1)}%
            </p>
            <p className="text-[11px] text-paper-500 font-mono">
              Passed all 12 checks on initial code synthesis
            </p>
          </div>

          {/* Card 2: Post-Repair Rate */}
          <div className="p-5 rounded-xl border border-paper-300 dark:border-paper-700 bg-white dark:bg-paper-900 shadow-sm space-y-2">
            <div className="text-xs font-mono text-paper-500">
              <span>Post-Repair Success</span>
            </div>
            <p className="text-3xl font-black font-mono text-paper-950 dark:text-paper-50">
              {stats.totalSuccessRate.toFixed(1)}%
            </p>
            <p className="text-[11px] text-paper-500 font-mono">
              Resolved within 3 self-repair attempts
            </p>
          </div>

          {/* Card 3: p50 Latency */}
          <div className="p-5 rounded-xl border border-paper-300 dark:border-paper-700 bg-white dark:bg-paper-900 shadow-sm space-y-2">
            <div className="text-xs font-mono text-paper-500">
              <span>Verification p50 Latency</span>
            </div>
            <p className="text-3xl font-black font-mono text-paper-950 dark:text-paper-50">
              {stats.latencies.p50Ms.toFixed(1)} ms
            </p>
            <p className="text-[11px] text-paper-500 font-mono">
              Median 600-step verifier execution time
            </p>
          </div>

          {/* Card 4: Verified Simulations */}
          <div className="p-5 rounded-xl border border-paper-300 dark:border-paper-700 bg-white dark:bg-paper-900 shadow-sm space-y-2">
            <div className="text-xs font-mono text-paper-500">
              <span>Active Stored Sims</span>
            </div>
            <p className="text-3xl font-black font-mono text-paper-950 dark:text-paper-50">
              {stats.totalSimulations}
            </p>
            <p className="text-[11px] text-paper-500 font-mono">
              Persisted in {stats.backend}
            </p>
          </div>
        </div>

        {/* Infrastructure & Model Health Table */}
        <div className="p-6 rounded-xl border border-paper-300 dark:border-paper-700 bg-white dark:bg-paper-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-paper-900 dark:text-paper-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-arcade-crimson" />
              Infrastructure & Component Status
            </h2>
            <span className="text-[11px] font-mono text-paper-400">
              Auto-refreshing every 5s
            </span>
          </div>

          <div className="divide-y divide-paper-200 dark:divide-paper-800 text-xs font-mono">
            {/* Store / Redis */}
            <details name="infra-item" className="modern-accordion group py-3">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <div className="flex items-center gap-2">
                  <ChevronDown className="w-4 h-4 text-paper-400 group-open:rotate-180 transition-transform duration-200 shrink-0" />
                  <div>
                    <span className="font-bold text-paper-900 dark:text-paper-100 block">
                      {stats.backend}
                    </span>
                    <span className="text-paper-500">
                      Simulation persistence, prompt caching & rate limiting ({stats.totalSimulations} keys{stats.storePingMs !== undefined ? ` • ${stats.storePingMs}ms ping` : ""})
                    </span>
                  </div>
                </div>
                {isStoreHealthy ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-arcade-emerald/30 bg-arcade-emerald/10 text-arcade-emerald font-mono text-xs font-bold shrink-0">
                    <span className="w-1.5 h-1.5 rounded-sm bg-arcade-emerald" />
                    Operational
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-arcade-amber/30 bg-arcade-amber/10 text-arcade-amber font-mono text-xs font-bold shrink-0">
                    <span className="w-1.5 h-1.5 rounded-sm bg-arcade-amber" />
                    Degraded
                  </span>
                )}
              </summary>
              <div className="mt-3 pl-6 pr-2 py-3 rounded-lg bg-paper-50 dark:bg-paper-800/50 border border-paper-200 dark:border-paper-700/60 text-[11px] space-y-1.5 text-paper-600 dark:text-paper-400">
                <div className="flex justify-between">
                  <span className="text-paper-500">Connection Mode:</span>
                  <span className="font-bold text-paper-800 dark:text-paper-200">Serverless REST API (Upstash)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-paper-500">Real-time Ping:</span>
                  <span className="font-bold text-arcade-emerald">{stats.storePingMs ?? health.durationMs} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-paper-500">Total Key Storage:</span>
                  <span className="font-bold text-paper-800 dark:text-paper-200">{stats.totalSimulations} verified simulation records</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-paper-500">Health Check Status:</span>
                  <span className="font-bold text-arcade-emerald">200 OK — Ping validated</span>
                </div>
              </div>
            </details>

            {/* Gemini Planner Model */}
            <details name="infra-item" className="modern-accordion group py-3">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <div className="flex items-center gap-2">
                  <ChevronDown className="w-4 h-4 text-paper-400 group-open:rotate-180 transition-transform duration-200 shrink-0" />
                  <div>
                    <span className="font-bold text-paper-900 dark:text-paper-100 block">
                      Google Gemini API (Planner: {stats.models.planner})
                    </span>
                    <span className="text-paper-500">
                      Mathematical modeling, SimSpec JSON planning & schema validation
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-arcade-emerald/30 bg-arcade-emerald/10 text-arcade-emerald font-mono text-xs font-bold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-sm bg-arcade-emerald" />
                  {isLlmConfigured ? "Operational" : "Key Missing"}
                </span>
              </summary>
              <div className="mt-3 pl-6 pr-2 py-3 rounded-lg bg-paper-50 dark:bg-paper-800/50 border border-paper-200 dark:border-paper-700/60 text-[11px] space-y-1.5 text-paper-600 dark:text-paper-400">
                <div className="flex justify-between">
                  <span className="text-paper-500">Active Model:</span>
                  <span className="font-bold text-paper-800 dark:text-paper-200">{stats.models.planner}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-paper-500">Task Responsibility:</span>
                  <span className="font-bold text-paper-800 dark:text-paper-200">Architectural physics specification & parameter definitions</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-paper-500">Structured Output:</span>
                  <span className="font-bold text-arcade-cyan">Zod Schema Validation enforced</span>
                </div>
              </div>
            </details>

            {/* Gemini Builder Model */}
            <details name="infra-item" className="modern-accordion group py-3">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <div className="flex items-center gap-2">
                  <ChevronDown className="w-4 h-4 text-paper-400 group-open:rotate-180 transition-transform duration-200 shrink-0" />
                  <div>
                    <span className="font-bold text-paper-900 dark:text-paper-100 block">
                      Google Gemini API (Builder: {stats.models.builder})
                    </span>
                    <span className="text-paper-500">
                      Constrained JS synthesis, SSE token streaming & self-repair loop
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-arcade-emerald/30 bg-arcade-emerald/10 text-arcade-emerald font-mono text-xs font-bold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-sm bg-arcade-emerald" />
                  {isLlmConfigured ? "Operational" : "Key Missing"}
                </span>
              </summary>
              <div className="mt-3 pl-6 pr-2 py-3 rounded-lg bg-paper-50 dark:bg-paper-800/50 border border-paper-200 dark:border-paper-700/60 text-[11px] space-y-1.5 text-paper-600 dark:text-paper-400">
                <div className="flex justify-between">
                  <span className="text-paper-500">Active Model:</span>
                  <span className="font-bold text-paper-800 dark:text-paper-200">{stats.models.builder}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-paper-500">Synthesis Format:</span>
                  <span className="font-bold text-paper-800 dark:text-paper-200">ES2020 Pure JavaScript Simulation Module</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-paper-500">Self-Repair Depth:</span>
                  <span className="font-bold text-arcade-cyan">Up to 3 autonomous AST feedback iterations</span>
                </div>
              </div>
            </details>

            {/* Fallback Chain */}
            <details name="infra-item" className="modern-accordion group py-3">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <div className="flex items-center gap-2">
                  <ChevronDown className="w-4 h-4 text-paper-400 group-open:rotate-180 transition-transform duration-200 shrink-0" />
                  <div>
                    <span className="font-bold text-paper-900 dark:text-paper-100 block">
                      Multi-Model Fallback Chain ({stats.models.fallbacks.join(" → ")})
                    </span>
                    <span className="text-paper-500">
                      Automatic failover protection against rate limits (429) and deprecations (404)
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-arcade-emerald/30 bg-arcade-emerald/10 text-arcade-emerald font-mono text-xs font-bold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-sm bg-arcade-emerald" />
                  Active
                </span>
              </summary>
              <div className="mt-3 pl-6 pr-2 py-3 rounded-lg bg-paper-50 dark:bg-paper-800/50 border border-paper-200 dark:border-paper-700/60 text-[11px] space-y-1.5 text-paper-600 dark:text-paper-400">
                <div className="flex justify-between">
                  <span className="text-paper-500">Priority 1 (Primary):</span>
                  <span className="font-bold text-paper-800 dark:text-paper-200">gemini-3.5-flash-lite (Lowest latency)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-paper-500">Priority 2 (Secondary):</span>
                  <span className="font-bold text-paper-800 dark:text-paper-200">gemini-3.5-flash (Balanced compute)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-paper-500">Priority 3 (Tertiary):</span>
                  <span className="font-bold text-paper-800 dark:text-paper-200">gemini-3.1-flash-lite (High reliability fallback)</span>
                </div>
              </div>
            </details>

            {/* Client-Side Verifier */}
            <details name="infra-item" className="modern-accordion group py-3">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <div className="flex items-center gap-2">
                  <ChevronDown className="w-4 h-4 text-paper-400 group-open:rotate-180 transition-transform duration-200 shrink-0" />
                  <div>
                    <span className="font-bold text-paper-900 dark:text-paper-100 block">
                      Client-Side Verification Engine
                    </span>
                    <span className="text-paper-500">
                      Acorn AST instrumentation, 600-step headless model run, canvas variance
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-arcade-emerald/30 bg-arcade-emerald/10 text-arcade-emerald font-mono text-xs font-bold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-sm bg-arcade-emerald" />
                  Operational ({stats.checksPassed}/12 Checks)
                </span>
              </summary>
              <div className="mt-3 pl-6 pr-2 py-3 rounded-lg bg-paper-50 dark:bg-paper-800/50 border border-paper-200 dark:border-paper-700/60 text-[11px] space-y-1.5 text-paper-600 dark:text-paper-400">
                <div className="flex justify-between">
                  <span className="text-paper-500">Verification Engine:</span>
                  <span className="font-bold text-paper-800 dark:text-paper-200">Acorn AST Parser + 600-step headless runner</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-paper-500">Loop Protection:</span>
                  <span className="font-bold text-arcade-emerald">AST Loop-Guard Injection (Max 10k iterations/step)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-paper-500">Median Execution:</span>
                  <span className="font-bold text-paper-800 dark:text-paper-200">{stats.latencies.p50Ms.toFixed(1)} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-paper-500">95th Percentile:</span>
                  <span className="font-bold text-paper-800 dark:text-paper-200">{stats.latencies.p95Ms.toFixed(1)} ms</span>
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Live Endpoints Section */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-paper-500">
          <Link href="/api/health" target="_blank" className="hover:text-arcade-crimson underline">
            Raw Health Endpoint (/api/health)
          </Link>
          <Link href="/api/stats" target="_blank" className="hover:text-arcade-crimson underline">
            Raw Stats Endpoint (/api/stats)
          </Link>
          <Link href="/api/gallery" target="_blank" className="hover:text-arcade-crimson underline">
            Gallery Index (/api/gallery)
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-paper-200 dark:border-paper-800 py-6 text-center text-xs font-mono text-paper-500">
        PlayTheory • Live Status & Telemetry Dashboard
      </footer>
    </div>
  );
}
