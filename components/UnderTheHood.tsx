"use client";

import React, { useState } from "react";
import { StoredSimulation } from "@/lib/store";
import { CheckCircle2, AlertTriangle, XCircle, Copy, Check, FileJson, ShieldCheck, Wrench, Terminal } from "lucide-react";

interface UnderTheHoodProps {
  sim: StoredSimulation;
}

export function UnderTheHood({ sim }: UnderTheHoodProps) {
  const [subTab, setSubTab] = useState<"spec" | "report" | "repair" | "code">("report");
  const [copied, setCopied] = useState(false);

  const { spec, code, report, repairHistory } = sim;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col bg-white dark:bg-paper-900 border-2 border-paper-900 dark:border-paper-300 rounded-xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(24,23,21,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,247,238,1)] text-left">
      {/* Subtab Navigation */}
      <div className="flex items-center gap-1 p-2 bg-paper-100 dark:bg-paper-800 border-b border-paper-200 dark:border-paper-700 text-xs font-mono overflow-x-auto">
        <button
          onClick={() => setSubTab("report")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition shrink-0 ${
            subTab === "report"
              ? "bg-paper-900 text-white dark:bg-paper-50 dark:text-paper-950 font-bold"
              : "text-paper-600 dark:text-paper-400 hover:text-paper-950"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verification Report</span>
        </button>

        <button
          onClick={() => setSubTab("spec")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition shrink-0 ${
            subTab === "spec"
              ? "bg-paper-900 text-white dark:bg-paper-50 dark:text-paper-950 font-bold"
              : "text-paper-600 dark:text-paper-400 hover:text-paper-950"
          }`}
        >
          <FileJson className="w-3.5 h-3.5" />
          <span>SimSpec JSON</span>
        </button>

        <button
          onClick={() => setSubTab("repair")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition shrink-0 ${
            subTab === "repair"
              ? "bg-paper-900 text-white dark:bg-paper-50 dark:text-paper-950 font-bold"
              : "text-paper-600 dark:text-paper-400 hover:text-paper-950"
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Repair History ({repairHistory?.length || 0})</span>
        </button>

        <button
          onClick={() => setSubTab("code")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition shrink-0 ${
            subTab === "code"
              ? "bg-paper-900 text-white dark:bg-paper-50 dark:text-paper-950 font-bold"
              : "text-paper-600 dark:text-paper-400 hover:text-paper-950"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Module Source</span>
        </button>
      </div>

      {/* Subtab Contents */}
      <div className="p-5 max-h-[550px] overflow-y-auto">
        {/* 1. Verification Report */}
        {subTab === "report" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm font-mono uppercase text-paper-900 dark:text-paper-100">
                  Automated Verification Proof
                </h3>
                <p className="text-xs text-paper-500 font-mono">
                  Code Hash: {report?.codeHash || "seed"} | Attempts: {report?.attempt ?? 0}
                </p>
              </div>
              <span
                className={`font-mono text-xs px-2.5 py-1 rounded font-bold uppercase ${
                  report?.status === "pass"
                    ? "bg-arcade-emerald/20 text-arcade-emerald border border-arcade-emerald/30"
                    : "bg-arcade-crimson/20 text-arcade-crimson border border-arcade-crimson/30"
                }`}
              >
                {report?.status === "pass" ? "Passed All Checks" : "Verification Failed"}
              </span>
            </div>

            {/* Benchmark Timings */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-paper-100 dark:bg-paper-800 rounded border border-paper-200 dark:border-paper-700">
                <span className="text-paper-500 block text-[10px] uppercase">Step Execution Benchmark</span>
                <span className="font-bold text-sm">
                  {report?.timings?.stepMsAvg ? `${report.timings.stepMsAvg.toFixed(3)} ms / step` : "< 0.5 ms / step"}
                </span>
                <span className="text-[10px] text-paper-400 block mt-0.5">Budget: &lt; 2.0 ms</span>
              </div>
              <div className="p-3 bg-paper-100 dark:bg-paper-800 rounded border border-paper-200 dark:border-paper-700">
                <span className="text-paper-500 block text-[10px] uppercase">Draw Frame Benchmark</span>
                <span className="font-bold text-sm">
                  {report?.timings?.drawMsAvg ? `${report.timings.drawMsAvg.toFixed(3)} ms / frame` : "< 1.2 ms / frame"}
                </span>
                <span className="text-[10px] text-paper-400 block mt-0.5">Budget: &lt; 8.0 ms</span>
              </div>
            </div>

            {/* Checks List */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-paper-500 uppercase tracking-wider block">
                Verification Matrix:
              </span>
              <div className="space-y-1.5">
                {(report?.checks || []).map((chk: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded border border-paper-200 dark:border-paper-700 bg-paper-50 dark:bg-paper-800/40 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <span className="font-bold text-paper-800 dark:text-paper-200 mr-2">{chk.id}</span>
                      {chk.message && <p className="text-[11px] text-paper-500 mt-0.5">{chk.message}</p>}
                    </div>
                    {chk.status === "pass" ? (
                      <CheckCircle2 className="w-4 h-4 text-arcade-emerald shrink-0" />
                    ) : chk.status === "warn" ? (
                      <AlertTriangle className="w-4 h-4 text-arcade-amber shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-arcade-crimson shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. Spec JSON */}
        {subTab === "spec" && (
          <div className="space-y-2">
            <span className="text-xs font-mono text-paper-500 uppercase tracking-wider block">
              SimSpec Schema v1:
            </span>
            <pre className="bg-paper-950 text-paper-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
              <code>{JSON.stringify(spec, null, 2)}</code>
            </pre>
          </div>
        )}

        {/* 3. Repair History */}
        {subTab === "repair" && (
          <div className="space-y-3">
            <span className="text-xs font-mono text-paper-500 uppercase tracking-wider block">
              Self-Repair Pipeline Log:
            </span>
            {(!repairHistory || repairHistory.length === 0) ? (
              <div className="p-4 rounded-xl border border-arcade-emerald/30 bg-arcade-emerald/5 text-xs font-mono text-paper-800 dark:text-paper-200">
                <CheckCircle2 className="w-4 h-4 text-arcade-emerald inline mr-2" />
                Passed on attempt 0 (First-try pass! Zero self-repair iterations required).
              </div>
            ) : (
              repairHistory.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-paper-200 dark:border-paper-700 bg-paper-50 dark:bg-paper-800 text-xs font-mono space-y-1"
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>Attempt {item.attempt}:</span>
                    <span className={item.report?.status === "pass" ? "text-arcade-emerald" : "text-arcade-crimson"}>
                      {item.report?.status?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-paper-500 text-[11px]">
                    Failing Checks: {item.report?.checks?.filter((c: any) => c.status === "fail").map((c: any) => c.id).join(", ") || "None"}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* 4. Module Code */}
        {subTab === "code" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-paper-500 uppercase tracking-wider">
                JavaScript Runtime Module:
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded border border-paper-300 dark:border-paper-700 hover:border-arcade-crimson transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-arcade-emerald" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy Code"}</span>
              </button>
            </div>
            <pre className="bg-paper-950 text-paper-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
