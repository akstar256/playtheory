"use client";

import React from "react";
import { SimParameter, SimSpec } from "@/lib/schemas/simSpec";
import { Sliders, Sparkles, HelpCircle } from "lucide-react";

interface ParamPanelProps {
  spec: SimSpec;
  currentParams: Record<string, number>;
  onParamChange: (id: string, value: number) => void;
  onApplyPreset: (params: Record<string, number>) => void;
}

export function ParamPanel({
  spec,
  currentParams,
  onParamChange,
  onApplyPreset,
}: ParamPanelProps) {
  return (
    <div className="flex flex-col bg-white dark:bg-paper-900 border-2 border-paper-900 dark:border-paper-300 rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(24,23,21,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,247,238,1)]">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-paper-200 dark:border-paper-700">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-arcade-crimson" />
          <h2 className="font-bold text-sm uppercase tracking-wider font-mono">
            Parameters & Controls
          </h2>
        </div>
      </div>

      {/* Presets Row */}
      {spec.presets && spec.presets.length > 0 && (
        <div className="mb-6">
          <span className="text-xs font-mono text-paper-500 uppercase tracking-wider block mb-2">
            Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {spec.presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => onApplyPreset(preset.params)}
                className="text-xs font-mono bg-paper-100 hover:bg-paper-200 dark:bg-paper-800 dark:hover:bg-paper-700 border border-paper-300 dark:border-paper-600 hover:border-arcade-crimson px-2.5 py-1 rounded text-paper-800 dark:text-paper-100 transition flex items-center gap-1 text-left"
                title={`${preset.description} Observe: ${preset.observe}`}
              >
                <Sparkles className="w-3 h-3 text-arcade-amber shrink-0" />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sliders List */}
      <div className="space-y-5">
        {spec.parameters.map((param: SimParameter) => {
          const val = currentParams[param.id] ?? param.default;

          return (
            <div key={param.id} className="space-y-1.5">
              {/* Slider Label & Current Value */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-paper-900 dark:text-paper-100">
                    {param.label}
                  </span>
                  {param.effectHint && (
                    <span title={param.effectHint} className="cursor-help text-paper-400">
                      <HelpCircle className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <span className="font-mono bg-paper-100 dark:bg-paper-800 px-2 py-0.5 rounded text-paper-800 dark:text-paper-100 border border-paper-200 dark:border-paper-700">
                  {val.toFixed(param.step < 0.1 ? 2 : param.step < 1 ? 1 : 0)}
                  {param.unit ? ` ${param.unit}` : ""}
                </span>
              </div>

              {/* Range Input */}
              <input
                type="range"
                min={param.min}
                max={param.max}
                step={param.step}
                value={val}
                onChange={(e) => onParamChange(param.id, parseFloat(e.target.value))}
                className="w-full accent-arcade-crimson cursor-pointer"
              />

              {/* Min and Max Markers */}
              <div className="flex justify-between text-[10px] font-mono text-paper-400">
                <span>{param.min}</span>
                <span className="italic truncate max-w-[200px] text-paper-500">
                  {param.description}
                </span>
                <span>{param.max}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
