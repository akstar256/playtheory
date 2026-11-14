"use client";

import React, { useEffect, useRef } from "react";
import { SimSpec } from "@/lib/schemas/simSpec";
import { LineChart as LineChartIcon } from "lucide-react";
import { SimKit } from "@/lib/runtime/simkit";

interface PlotsProps {
  spec: SimSpec;
  metricsHistory: { t: number; metrics: Record<string, number> }[];
}

export function Plots({ spec, metricsHistory }: PlotsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#FAF7EE";
    ctx.fillRect(0, 0, width, height);

    const primaryPlot = spec.visual.plots[0];
    if (!primaryPlot || metricsHistory.length < 2) {
      // Empty placeholder
      ctx.fillStyle = "#A8A29E";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Waiting for simulation data...", width / 2, height / 2);
      return;
    }

    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Grid lines
    ctx.strokeStyle = "rgba(214, 198, 165, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = 0; y <= chartHeight; y += chartHeight / 4) {
      ctx.moveTo(padding.left, padding.top + y);
      ctx.lineTo(padding.left + chartWidth, padding.top + y);
    }
    ctx.stroke();

    // Determine min/max values
    let minVal = 0;
    let maxVal = 1;

    for (const pt of metricsHistory) {
      for (const s of primaryPlot.series) {
        const v = pt.metrics[s.metricKey];
        if (typeof v === "number" && !isNaN(v)) {
          if (v < minVal) minVal = v;
          if (v > maxVal) maxVal = v;
        }
      }
    }

    if (maxVal === minVal) maxVal += 1;
    const valRange = maxVal - minVal;

    // Y Axis ticks
    ctx.fillStyle = "#78716C";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 4; i++) {
      const v = minVal + (valRange * (4 - i)) / 4;
      const y = padding.top + (chartHeight * i) / 4;
      ctx.fillText(v >= 100 ? v.toFixed(0) : v.toFixed(1), padding.left - 6, y);
    }

    // Draw each series line
    primaryPlot.series.forEach((s, idx) => {
      const color = SimKit.palette[idx % SimKit.palette.length];
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      metricsHistory.forEach((pt, i) => {
        const x = padding.left + (i / Math.max(1, metricsHistory.length - 1)) * chartWidth;
        const v = pt.metrics[s.metricKey] ?? minVal;
        const y = padding.top + chartHeight - ((v - minVal) / valRange) * chartHeight;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.stroke();
    });

    // Outer chart border
    ctx.strokeStyle = "#2B2824";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(padding.left, padding.top, chartWidth, chartHeight);
  }, [spec, metricsHistory]);

  const primaryPlot = spec.visual.plots[0];

  return (
    <div className="flex flex-col bg-white dark:bg-paper-900 border-2 border-paper-900 dark:border-paper-300 rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(24,23,21,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,247,238,1)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-paper-200 dark:border-paper-700">
        <div className="flex items-center gap-2">
          <LineChartIcon className="w-4 h-4 text-arcade-cyan" />
          <h2 className="font-bold text-sm uppercase tracking-wider font-mono">
            {primaryPlot?.title || "Real-Time Telemetry"}
          </h2>
        </div>

        {/* Legend */}
        {primaryPlot && (
          <div className="flex items-center gap-3">
            {primaryPlot.series.map((s, idx) => (
              <div key={s.metricKey} className="flex items-center gap-1.5 text-xs font-mono">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: SimKit.palette[idx % SimKit.palette.length] }}
                />
                <span className="text-paper-700 dark:text-paper-300">{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Canvas Chart */}
      <div className="relative w-full aspect-[2.4/1] overflow-hidden rounded bg-[#FAF7EE] border border-paper-200 dark:border-paper-700">
        <canvas
          ref={canvasRef}
          width={640}
          height={260}
          className="w-full h-full block"
        />
      </div>
    </div>
  );
}
