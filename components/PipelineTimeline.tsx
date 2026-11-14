"use client";

import React from "react";
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Sparkles, Wrench, ShieldCheck, Terminal } from "lucide-react";
import { PipelineState } from "@/lib/pipeline/orchestrator";

interface PipelineTimelineProps {
  state: PipelineState;
}

export function PipelineTimeline({ state }: PipelineTimelineProps) {
  const { stage, spec, codeStream, report, repairAttempt, error, fallbackSlug } = state;

  const STAGES = [
    { key: "planning", label: "1. Understanding & Architectural Planning", icon: Sparkles },
    { key: "building", label: "2. Synthesizing Constrained Code Module", icon: Terminal },
    { key: "verifying", label: "3. Executing 12-Point Automated Verifier", icon: ShieldCheck },
    { key: "repairing", label: `4. Autonomous Self-Repair (Attempt ${repairAttempt || 1}/3)`, icon: Wrench },
  ];

  const getStageStatus = (key: string) => {
    if (stage === "fallback") return "error";
    if (stage === "passed") return "completed";

    const order = ["planning", "building", "verifying", "repairing", "passed"];
    const currentIndex = order.indexOf(stage);
    const stageIndex = order.indexOf(key);

    if (stage === key) return "active";
    if (stageIndex < currentIndex) return "completed";
    return "pending";
  };

  return (
    <div className="w-full max-w-3xl bg-white dark:bg-paper-900 border-2 border-paper-900 dark:border-paper-300 rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(24,23,21,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,247,238,1)] text-left mb-8">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-paper-200 dark:border-paper-700">
        <div>
          <h2 className="font-bold text-base font-mono uppercase tracking-wider flex flex-wrap items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-arcade-amber animate-ping" />
            Compound AI Pipeline Timeline
            {state.provider === "local" ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-arcade-crimson/20 text-arcade-crimson border border-arcade-crimson/40">
                🖥️ Local Gemma 4 12B
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-arcade-cyan/20 text-arcade-cyan border border-arcade-cyan/40">
                ☁️ Cloud Gemini
              </span>
            )}
          </h2>
          <p className="text-xs text-paper-500 font-mono mt-0.5">
            Watch the planner, builder, client verifier, and repair loop run in real time.
          </p>
        </div>
      </div>

      {/* Vertical Stages */}
      <div className="space-y-6">
        {STAGES.map((stg) => {
          const status = getStageStatus(stg.key);
          const Icon = stg.icon;

          // Don't show repair step if we haven't needed it
          if (stg.key === "repairing" && stage !== "repairing" && repairAttempt === 0) {
            return null;
          }

          return (
            <div key={stg.key} className="flex items-start gap-4">
              <div className="mt-0.5">
                {status === "completed" ? (
                  <CheckCircle2 className="w-5 h-5 text-arcade-emerald" />
                ) : status === "active" ? (
                  <Loader2 className="w-5 h-5 text-arcade-amber animate-spin" />
                ) : status === "error" ? (
                  <XCircle className="w-5 h-5 text-arcade-crimson" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-paper-300 dark:border-paper-700 bg-paper-100 dark:bg-paper-800" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-sm font-bold ${
                      status === "active"
                        ? "text-paper-950 dark:text-paper-50"
                        : status === "completed"
                        ? "text-paper-800 dark:text-paper-200"
                        : "text-paper-400"
                    }`}
                  >
                    {stg.label}
                  </span>
                  {status === "active" && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-arcade-amber/20 text-arcade-amber border border-arcade-amber/40 uppercase">
                      In Progress
                    </span>
                  )}
                </div>

                {/* Stage Details */}
                {stg.key === "planning" && spec && (
                  <div className="mt-2 text-xs font-mono text-paper-600 dark:text-paper-400 bg-paper-50 dark:bg-paper-800 p-2.5 rounded border border-paper-200 dark:border-paper-700">
                    <span className="text-arcade-crimson font-bold">Model Chosen:</span> {spec.archetype} |{" "}
                    <span className="text-arcade-cyan font-bold">Sliders:</span> {spec.parameters.length} parameters |{" "}
                    <span className="text-arcade-emerald font-bold">Plots:</span> {spec.visual.plots.length}
                  </div>
                )}

                {stg.key === "building" && codeStream && (
                  <div className="mt-2 text-[11px] font-mono bg-paper-950 text-paper-100 p-3 rounded border border-paper-800 max-h-36 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{codeStream.slice(-500)}</pre>
                  </div>
                )}

                {/* Live Verifier Check Rows */}
                {stg.key === "verifying" && report && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {report.checks.map((chk) => (
                      <div
                        key={chk.id}
                        className={`p-2 rounded border text-xs font-mono flex items-center justify-between ${
                          chk.status === "pass"
                            ? "bg-arcade-emerald/5 border-arcade-emerald/30 text-arcade-emerald"
                            : chk.status === "warn"
                            ? "bg-arcade-amber/5 border-arcade-amber/30 text-arcade-amber"
                            : "bg-arcade-crimson/5 border-arcade-crimson/30 text-arcade-crimson"
                        }`}
                      >
                        <span className="truncate">{chk.id}</span>
                        {chk.status === "pass" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : chk.status === "warn" ? (
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fallback Notification if verification fails 3 times */}
      {stage === "fallback" && (
        <div className="mt-6 p-4 rounded-xl border-2 border-arcade-amber bg-arcade-amber/10 text-xs font-mono">
          <p className="font-bold text-paper-900 dark:text-paper-100 mb-1">
            Graceful Degradation Activated
          </p>
          <p className="text-paper-600 dark:text-paper-400 mb-3">
            {error || "Verification criteria could not be met after 3 attempts."} Launching the nearest hand-verified exemplar simulation from our gallery.
          </p>
          {fallbackSlug && (
            <a
              href={`/s/${fallbackSlug}`}
              className="inline-block bg-paper-900 text-white dark:bg-white dark:text-paper-900 px-3 py-1.5 rounded font-bold hover:opacity-90"
            >
              Open Verified Exemplar →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
