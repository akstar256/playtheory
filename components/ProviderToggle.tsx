"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Cpu, Cloud, Settings2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { checkLocalLMStudio, DEFAULT_LOCAL_LM_CONFIG } from "@/lib/llm/localGemma";

export interface ProviderConfig {
  provider: "cloud" | "local";
  endpoint: string;
  model: string;
}

interface ProviderToggleProps {
  config: ProviderConfig;
  onChange: (config: ProviderConfig) => void;
  disabled?: boolean;
}

export function ProviderToggle({ config, onChange, disabled }: ProviderToggleProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [isLocalOnline, setIsLocalOnline] = useState(false);
  const [activeModel, setActiveModel] = useState(config.model || "google/gemma-4-12b-qat");
  const [showSettings, setShowSettings] = useState(false);
  const [customEndpoint, setCustomEndpoint] = useState(config.endpoint || "http://localhost:1234");
  const [statusMessage, setStatusMessage] = useState("");

  const testConnection = useCallback(async (endpointToTest: string) => {
    setIsChecking(true);
    setStatusMessage("");
    try {
      // First try the configured endpoint, fallback to 192.168.0.8:1234 or localhost:1234
      let res = await checkLocalLMStudio(endpointToTest);
      if (!res.online && endpointToTest.includes("localhost")) {
        const fallbackRes = await checkLocalLMStudio("http://192.168.0.8:1234");
        if (fallbackRes.online) {
          res = fallbackRes;
          setCustomEndpoint("http://192.168.0.8:1234");
          onChange({ ...config, endpoint: "http://192.168.0.8:1234" });
        }
      }

      setIsLocalOnline(res.online);
      if (res.online) {
        if (res.activeModel) setActiveModel(res.activeModel);
        setStatusMessage(`Connected: ${res.activeModel || "LM Studio"}`);
      } else {
        setStatusMessage(res.error || "LM Studio server not reachable on :1234");
      }
    } catch (err: any) {
      setIsLocalOnline(false);
      setStatusMessage(err.message || "Connection failed");
    } finally {
      setIsChecking(false);
    }
  }, [config, onChange]);

  useEffect(() => {
    testConnection(config.endpoint || "http://localhost:1234");
  }, [config.endpoint, testConnection]);

  const handleProviderSelect = (p: "cloud" | "local") => {
    onChange({ ...config, provider: p });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onChange({ ...config, endpoint: customEndpoint, model: activeModel });
    setShowSettings(false);
    testConnection(customEndpoint);
  };

  return (
    <div className="flex flex-col items-center gap-2 mb-4">
      <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-paper-200/80 dark:bg-paper-800/80 border border-paper-300 dark:border-paper-700 text-xs font-mono transition-all duration-200 hover:scale-[1.02] shadow-sm">
        {/* Cloud Option */}
        <button
          type="button"
          onClick={() => handleProviderSelect("cloud")}
          disabled={disabled}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
            config.provider === "cloud"
              ? "bg-white dark:bg-paper-900 shadow-sm text-paper-950 dark:text-paper-50 border border-paper-300 dark:border-paper-700"
              : "text-paper-500 hover:text-paper-900 dark:hover:text-paper-200"
          }`}
        >
          <Cloud className="w-3.5 h-3.5 text-arcade-cyan" />
          <span>Cloud (Gemini)</span>
        </button>

        {/* Local Option */}
        <button
          type="button"
          onClick={() => handleProviderSelect("local")}
          disabled={disabled}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
            config.provider === "local"
              ? "bg-white dark:bg-paper-900 shadow-sm text-paper-950 dark:text-paper-50 border border-paper-300 dark:border-paper-700"
              : "text-paper-500 hover:text-paper-900 dark:hover:text-paper-200"
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-arcade-crimson" />
          <span>Local (Gemma 4 12B)</span>
          <span
            className={`w-2 h-2 rounded-full ml-1 ${
              isLocalOnline ? "bg-arcade-emerald animate-pulse" : "bg-paper-400"
            }`}
            title={isLocalOnline ? "LM Studio Online" : "LM Studio Offline"}
          />
        </button>

        {/* Settings Button */}
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="p-1.5 rounded-lg text-paper-500 hover:text-paper-900 dark:hover:text-paper-200 transition"
          title="Configure Local LM Studio Endpoint"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Local Provider Status Badge / Alert */}
      {config.provider === "local" && (
        <div className="flex items-center gap-2 text-[11px] font-mono px-3 py-1 rounded-full bg-paper-100 dark:bg-paper-800/60 border border-paper-200 dark:border-paper-700 text-paper-600 dark:text-paper-300">
          {isChecking ? (
            <span className="flex items-center gap-1 text-arcade-amber">
              <RefreshCw className="w-3 h-3 animate-spin" /> Pinging LM Studio...
            </span>
          ) : isLocalOnline ? (
            <span className="flex items-center gap-1 text-arcade-emerald font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Direct In-Browser Link to {activeModel} (:1234)
            </span>
          ) : (
            <span className="flex items-center gap-1 text-arcade-amber font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              {statusMessage || "LM Studio not detected. Ensure 'Enable CORS' is ON in Server Settings."}
            </span>
          )}
          <button
            type="button"
            onClick={() => testConnection(customEndpoint)}
            className="text-[10px] underline hover:text-arcade-crimson ml-1"
          >
            Retry
          </button>
        </div>
      )}

      {/* Settings Modal / Dropdown */}
      {showSettings && (
        <div className="w-full max-w-md p-4 rounded-xl border border-paper-300 dark:border-paper-700 bg-white dark:bg-paper-900 shadow-md text-left text-xs font-mono space-y-3 z-10 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 border-b border-paper-200 dark:border-paper-800">
            <span className="font-bold text-paper-900 dark:text-paper-100 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-arcade-crimson" /> LM Studio Configuration
            </span>
            <button
              onClick={() => setShowSettings(false)}
              className="text-paper-400 hover:text-paper-700 dark:hover:text-paper-200"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-3">
            <div>
              <label className="block text-paper-500 mb-1">Server Endpoint URL</label>
              <input
                type="text"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
                placeholder="http://localhost:1234 or http://192.168.0.8:1234"
                className="w-full px-2.5 py-1.5 rounded border border-paper-300 dark:border-paper-700 bg-paper-50 dark:bg-paper-800 text-paper-900 dark:text-paper-100 text-xs outline-none focus:border-arcade-crimson"
              />
              <span className="text-[10px] text-paper-400 mt-1 block">
                Standard LM Studio default: <code>http://localhost:1234</code> or LAN IP
              </span>
            </div>

            <div>
              <label className="block text-paper-500 mb-1">Loaded Model Identifier</label>
              <input
                type="text"
                value={activeModel}
                onChange={(e) => setActiveModel(e.target.value)}
                placeholder="google/gemma-4-12b-qat"
                className="w-full px-2.5 py-1.5 rounded border border-paper-300 dark:border-paper-700 bg-paper-50 dark:bg-paper-800 text-paper-900 dark:text-paper-100 text-xs outline-none focus:border-arcade-crimson"
              />
            </div>

            <div className="p-2.5 rounded bg-arcade-amber/10 border border-arcade-amber/30 text-[11px] text-paper-700 dark:text-paper-300 space-y-1">
              <p className="font-bold text-paper-900 dark:text-paper-100">💡 Required LM Studio Setting:</p>
              <p>In LM Studio &gt; <strong>Server Settings</strong>, turn <strong>Enable CORS</strong> to <strong>ON</strong> (green switch). This allows your browser to connect directly without a tunnel.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-3 py-1 rounded border border-paper-300 dark:border-paper-700 text-paper-600 dark:text-paper-300 hover:bg-paper-100 dark:hover:bg-paper-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded bg-arcade-crimson text-white font-bold hover:opacity-90"
              >
                Save &amp; Test
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
