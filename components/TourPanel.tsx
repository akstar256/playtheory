"use client";

import React, { useState } from "react";
import { GuidedTour, TourStep } from "@/lib/schemas/guide";
import { Sparkles, CheckCircle2, XCircle, ChevronRight, ChevronLeft, ArrowRight, Lightbulb } from "lucide-react";

interface TourPanelProps {
  tour: GuidedTour;
  onApplyParams: (params: Record<string, number>) => void;
  onPlaySimulation: () => void;
}

export function TourPanel({
  tour,
  onApplyParams,
  onPlaySimulation,
}: TourPanelProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [selectedPrediction, setSelectedPrediction] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const steps = tour.steps;
  const currentStep: TourStep = steps[currentStepIdx] || steps[0];

  const handleSelectPrediction = (idx: number) => {
    if (revealed) return;
    setSelectedPrediction(idx);
  };

  const handleReveal = () => {
    if (selectedPrediction === null || revealed) return;
    setRevealed(true);

    // Apply the preset parameters for this step
    if (currentStep.setParams) {
      onApplyParams(currentStep.setParams);
    }
    // Start or restart playback to show the predicted effect
    onPlaySimulation();
  };

  const handleNextStep = () => {
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
      setSelectedPrediction(null);
      setRevealed(false);
      // Pre-apply params for the new step
      const nextStep = steps[currentStepIdx + 1];
      if (nextStep?.setParams) {
        onApplyParams(nextStep.setParams);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
      setSelectedPrediction(null);
      setRevealed(false);
      const prevStep = steps[currentStepIdx - 1];
      if (prevStep?.setParams) {
        onApplyParams(prevStep.setParams);
      }
    }
  };

  const prediction = currentStep.prediction;

  return (
    <div className="flex flex-col bg-white dark:bg-paper-900 border-2 border-paper-900 dark:border-paper-300 rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(24,23,21,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,247,238,1)] text-left">
      {/* Tour Header with Step Progress */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-paper-200 dark:border-paper-700">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-arcade-amber" />
          <h2 className="font-bold text-sm uppercase tracking-wider font-mono">
            Guided Tour: Predict & Reveal
          </h2>
        </div>
        <span className="text-xs font-mono bg-paper-100 dark:bg-paper-800 px-2 py-0.5 rounded text-paper-700 dark:text-paper-300 border border-paper-300 dark:border-paper-700">
          Step {currentStepIdx + 1} of {steps.length}
        </span>
      </div>

      {/* Step Progress Dots */}
      <div className="flex gap-1.5 mb-5">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i === currentStepIdx
                ? "bg-arcade-crimson"
                : i < currentStepIdx
                ? "bg-arcade-emerald"
                : "bg-paper-200 dark:bg-paper-800"
            }`}
          />
        ))}
      </div>

      {/* Step Content */}
      <div className="space-y-3 mb-6">
        <h3 className="text-base font-bold text-paper-950 dark:text-paper-50 tracking-tight">
          {currentStep.title}
        </h3>
        <p className="text-xs sm:text-sm text-paper-700 dark:text-paper-300 leading-relaxed">
          {currentStep.text}
        </p>
      </div>

      {/* Predict-Then-Reveal Interaction Box */}
      {prediction && (
        <div className="p-4 rounded-xl border-2 border-arcade-amber/50 bg-arcade-amber/5 space-y-4 mb-6">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-arcade-amber shrink-0 mt-0.5" />
            <h4 className="font-bold text-xs uppercase tracking-wider font-mono text-paper-900 dark:text-paper-100">
              Prediction Challenge
            </h4>
          </div>

          <p className="text-xs sm:text-sm font-medium text-paper-900 dark:text-paper-100">
            {prediction.question}
          </p>

          {/* Options List */}
          <div className="space-y-2">
            {prediction.options.map((opt, idx) => {
              const isSelected = selectedPrediction === idx;
              const isCorrect = idx === prediction.answerIndex;

              let style = "border-paper-200 dark:border-paper-700 bg-white dark:bg-paper-900 text-paper-800 dark:text-paper-200";

              if (revealed) {
                if (isCorrect) {
                  style = "border-arcade-emerald bg-arcade-emerald/10 text-paper-950 dark:text-paper-50 font-bold";
                } else if (isSelected && !isCorrect) {
                  style = "border-arcade-crimson bg-arcade-crimson/10 text-paper-950 dark:text-paper-50";
                }
              } else if (isSelected) {
                style = "border-arcade-crimson bg-arcade-crimson/5 text-paper-950 dark:text-paper-50 font-bold";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectPrediction(idx)}
                  disabled={revealed}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition flex items-center justify-between ${style}`}
                >
                  <span>{opt}</span>
                  {revealed && (
                    <span>
                      {isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-arcade-emerald shrink-0" />
                      ) : isSelected ? (
                        <XCircle className="w-4 h-4 text-arcade-crimson shrink-0" />
                      ) : null}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Reveal Button */}
          {!revealed ? (
            <button
              onClick={handleReveal}
              disabled={selectedPrediction === null}
              className="w-full py-2.5 px-4 rounded-lg bg-paper-900 text-white dark:bg-paper-50 dark:text-paper-950 font-bold text-xs uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-arcade-crimson hover:text-white transition flex items-center justify-center gap-2"
            >
              <span>Set Sliders & Reveal Result</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="p-3 bg-white dark:bg-paper-900 rounded-lg border border-arcade-emerald text-xs space-y-1.5 animate-in fade-in duration-300">
              <span className="font-bold text-arcade-emerald flex items-center gap-1 font-mono uppercase text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {selectedPrediction === prediction.answerIndex ? "Spot On!" : "Outcome Explained"}
              </span>
              <p className="text-paper-700 dark:text-paper-300 leading-relaxed">
                {prediction.revealText}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-paper-200 dark:border-paper-700">
        <button
          onClick={handlePrevStep}
          disabled={currentStepIdx === 0}
          className="px-3 py-1.5 rounded font-mono text-xs border border-paper-300 dark:border-paper-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-paper-100 dark:hover:bg-paper-800 transition flex items-center gap-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <button
          onClick={handleNextStep}
          disabled={currentStepIdx === steps.length - 1}
          className="px-3 py-1.5 rounded font-mono text-xs bg-paper-900 text-white dark:bg-paper-100 dark:text-paper-900 font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-arcade-crimson hover:text-white transition flex items-center gap-1"
        >
          <span>Next Step</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
