"use client";

import React from "react";
import { MisconceptionSchema } from "@/lib/schemas/simSpec";
import { z } from "zod";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

type Misconception = z.infer<typeof MisconceptionSchema>;

interface MisconceptionsPanelProps {
  misconceptions: Misconception[];
}

export function MisconceptionsPanel({ misconceptions }: MisconceptionsPanelProps) {
  return (
    <div className="flex flex-col bg-white dark:bg-paper-900 border-2 border-paper-900 dark:border-paper-300 rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(24,23,21,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,247,238,1)] text-left">
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-paper-200 dark:border-paper-700">
        <AlertTriangle className="w-4 h-4 text-arcade-amber" />
        <h2 className="font-bold text-sm uppercase tracking-wider font-mono">
          Common Misconceptions & Realities
        </h2>
      </div>

      <div className="space-y-4">
        {misconceptions.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl border border-paper-200 dark:border-paper-700 bg-paper-50/50 dark:bg-paper-800/30 space-y-3"
          >
            {/* Common Myth */}
            <div className="flex items-start gap-2.5">
              <XCircle className="w-4 h-4 text-arcade-crimson shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-arcade-crimson block mb-0.5">
                  Common Misconception:
                </span>
                <p className="text-xs text-paper-700 dark:text-paper-300 italic">
                  &ldquo;{item.wrong}&rdquo;
                </p>
              </div>
            </div>

            {/* Scientific Reality */}
            <div className="flex items-start gap-2.5 pt-2 border-t border-paper-200 dark:border-paper-700">
              <CheckCircle2 className="w-4 h-4 text-arcade-emerald shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-arcade-emerald block mb-0.5">
                  Scientific Reality:
                </span>
                <p className="text-xs text-paper-900 dark:text-paper-100 font-medium">
                  {item.right}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
