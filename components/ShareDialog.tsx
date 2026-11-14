"use client";

import React, { useRef, useEffect, useState } from "react";
import { Share2, X, Copy, Check, Code2, Globe } from "lucide-react";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  slug: string;
}

export function ShareDialog({ isOpen, onClose, title, slug }: ShareDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [activeTab, setActiveTab] = useState<"link" | "embed">("link");

  const origin = typeof window !== "undefined" ? window.location.origin : "https://playtheory-gamma.vercel.app";
  const shareUrl = `${origin}/s/${slug}`;
  const embedCode = `<iframe src="${shareUrl}" width="100%" height="650" style="border:0;border-radius:12px;overflow:hidden;" allow="accelerometer; autoplay; encrypted-media; gyroscope;" loading="lazy"></iframe>`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="share-dialog-title"
      className="m-auto p-0 rounded-2xl border-2 border-paper-900 dark:border-paper-300 bg-white dark:bg-paper-900 shadow-[8px_8px_0px_0px_rgba(24,23,21,1)] dark:shadow-[8px_8px_0px_0px_rgba(250,247,238,1)] max-w-lg w-[calc(100%-2rem)] text-left text-paper-900 dark:text-paper-100"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-paper-200 dark:border-paper-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-arcade-crimson" />
            <h2 id="share-dialog-title" className="text-base font-bold font-mono tracking-tight">
              Share Simulation
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-paper-100 dark:hover:bg-paper-800 text-paper-500 hover:text-paper-900 dark:hover:text-paper-100 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-xs text-paper-500 dark:text-paper-400 mt-3 font-mono">
          {title}
        </p>

        {/* Tab switch */}
        <div className="flex gap-2 mt-4 p-1 rounded-xl bg-paper-100 dark:bg-paper-800/60 border border-paper-200 dark:border-paper-700 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab("link")}
            className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "link"
                ? "bg-white dark:bg-paper-900 text-paper-950 dark:text-paper-50 shadow-sm border border-paper-300 dark:border-paper-700"
                : "text-paper-500 hover:text-paper-900"
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-arcade-cyan" />
            <span>Direct Link</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("embed")}
            className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "embed"
                ? "bg-white dark:bg-paper-900 text-paper-950 dark:text-paper-50 shadow-sm border border-paper-300 dark:border-paper-700"
                : "text-paper-500 hover:text-paper-900"
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-arcade-amber" />
            <span>Embed Widget</span>
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "link" ? (
          <div className="mt-4 space-y-2">
            <label className="text-xs font-mono text-paper-500 block">Simulation URL</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-paper-50 dark:bg-paper-800 px-3 py-2 rounded-lg border border-paper-300 dark:border-paper-700 text-xs font-mono select-all text-paper-900 dark:text-paper-100 outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="bg-paper-900 text-white dark:bg-paper-50 dark:text-paper-950 font-bold px-4 py-2 rounded-lg text-xs font-mono flex items-center gap-1.5 shrink-0 hover:bg-arcade-crimson hover:text-white transition"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-arcade-emerald" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            <label className="text-xs font-mono text-paper-500 block">HTML Embed Code (Notion, Blogs, Docs)</label>
            <div className="relative">
              <textarea
                readOnly
                rows={3}
                value={embedCode}
                className="w-full bg-paper-50 dark:bg-paper-800 p-2.5 rounded-lg border border-paper-300 dark:border-paper-700 text-[11px] font-mono select-all text-paper-900 dark:text-paper-100 outline-none resize-none"
              />
              <button
                type="button"
                onClick={handleCopyEmbed}
                className="mt-2 w-full bg-paper-900 text-white dark:bg-paper-50 dark:text-paper-950 font-bold py-2 rounded-lg text-xs font-mono flex items-center justify-center gap-1.5 hover:bg-arcade-crimson hover:text-white transition"
              >
                {copiedEmbed ? <Check className="w-3.5 h-3.5 text-arcade-emerald" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEmbed ? "Copied Embed HTML" : "Copy Embed HTML"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer with Native Method=Dialog */}
        <form method="dialog" className="mt-6 pt-4 border-t border-paper-200 dark:border-paper-800 flex justify-end">
          <button
            value="cancel"
            autoFocus
            className="px-4 py-1.5 rounded-lg border border-paper-300 dark:border-paper-700 text-xs font-mono hover:bg-paper-100 dark:hover:bg-paper-800 transition cursor-pointer"
          >
            Done
          </button>
        </form>
      </div>
    </dialog>
  );
}
