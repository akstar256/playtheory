"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RotateCcw, FastForward, StepForward, AlertCircle } from "lucide-react";
import { buildSandboxSrcDoc } from "@/lib/runtime/shell";

interface SimPlayerProps {
  code: string;
  initialParams: Record<string, number>;
  currentParams: Record<string, number>;
  onMetrics?: (metrics: Record<string, number>, t: number) => void;
  onError?: (err: string) => void;
}

export function SimPlayer({
  code,
  initialParams,
  currentParams,
  onMetrics,
  onError,
}: SimPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  // Send message helper to iframe
  const postToIframe = useCallback((msg: any) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(msg, "*");
    }
  }, []);

  // Listen to messages from sandboxed iframe
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      const data = e.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "sim_metrics" && onMetrics) {
        onMetrics(data.metrics, data.t);
      } else if (data.type === "sim_error") {
        setRuntimeError(data.error);
        if (onError) onError(data.error);
      } else if (data.type === "play_state_changed") {
        setIsPlaying(data.isPlaying);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onMetrics, onError]);

  // Sync parameter updates to iframe
  useEffect(() => {
    postToIframe({ type: "update_params", params: currentParams });
  }, [currentParams, postToIframe]);

  // Play / Pause toggle
  const togglePlay = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    postToIframe({ type: next ? "play" : "pause" });
  };

  // Reset simulation
  const handleReset = () => {
    setRuntimeError(null);
    postToIframe({ type: "reset", seed: Date.now() });
  };

  // Step once
  const handleStepOnce = () => {
    setIsPlaying(false);
    postToIframe({ type: "step_once" });
  };

  // Change speed
  const handleCycleSpeed = () => {
    const speeds = [0.5, 1.0, 2.0, 4.0];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setSpeed(nextSpeed);
    postToIframe({ type: "set_speed", speed: nextSpeed });
  };

  // Keyboard Shortcuts: Space (play/pause), R (reset), ArrowRight (step once)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if user is typing in an input
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "KeyR") {
        e.preventDefault();
        handleReset();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleStepOnce();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const srcDoc = React.useMemo(() => {
    return buildSandboxSrcDoc({
      code,
      initialParams,
    });
  }, [code, initialParams]);

  return (
    <div className="flex flex-col bg-white dark:bg-paper-900 border-2 border-paper-900 dark:border-paper-300 rounded-xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(24,23,21,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,247,238,1)]">
      {/* Simulation Screen Viewport */}
      <div className="relative aspect-[16/10] w-full bg-[#FAF7EE] overflow-hidden">
        <iframe
          ref={iframeRef}
          title="PlayTheory Simulation Sandbox"
          sandbox="allow-scripts"
          srcDoc={srcDoc}
          className="w-full h-full border-none block"
        />

        {runtimeError && (
          <div className="absolute inset-0 bg-paper-950/90 text-paper-50 p-6 flex flex-col justify-center items-center text-center font-mono text-sm">
            <AlertCircle className="w-8 h-8 text-arcade-crimson mb-3" />
            <p className="font-bold mb-2">Simulation Runtime Exception</p>
            <p className="text-xs text-paper-400 max-w-md bg-paper-900 p-3 rounded border border-paper-800 break-words mb-4">
              {runtimeError}
            </p>
            <button
              onClick={handleReset}
              className="bg-arcade-crimson text-white px-4 py-1.5 rounded font-bold text-xs"
            >
              Reset Simulation
            </button>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-paper-100 dark:bg-paper-800 border-t border-paper-200 dark:border-paper-700">
        <div className="flex items-center gap-2">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-900 text-paper-50 dark:bg-paper-50 dark:text-paper-900 rounded font-bold text-xs hover:opacity-90 transition"
            title="Space to Play/Pause"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? "Pause" : "Play"}</span>
          </button>

          {/* Step Once */}
          <button
            onClick={handleStepOnce}
            className="p-1.5 bg-paper-200 dark:bg-paper-700 hover:bg-paper-300 dark:hover:bg-paper-600 rounded text-paper-800 dark:text-paper-100 transition"
            title="Step Once (ArrowRight)"
          >
            <StepForward className="w-4 h-4" />
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-paper-200 dark:bg-paper-700 hover:bg-paper-300 dark:hover:bg-paper-600 rounded font-mono text-xs text-paper-800 dark:text-paper-100 transition"
            title="Reset (Key R)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Speed Multiplier Button */}
        <button
          onClick={handleCycleSpeed}
          className="flex items-center gap-1 px-2.5 py-1.5 border border-paper-300 dark:border-paper-600 hover:border-arcade-crimson rounded font-mono text-xs text-paper-800 dark:text-paper-100 transition"
          title="Cycle Speed"
        >
          <FastForward className="w-3.5 h-3.5 text-arcade-amber" />
          <span>{speed}x</span>
        </button>
      </div>
    </div>
  );
}
