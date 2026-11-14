"use client";

import React, { useState } from "react";
import { SimSpec } from "@/lib/schemas/simSpec";
import { HelpCircle, CheckCircle2, XCircle, RotateCcw, Trophy } from "lucide-react";

interface QuizPanelProps {
  spec: SimSpec;
}

export function QuizPanel({ spec }: QuizPanelProps) {
  const quizQuestions = spec.quiz;
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (questionIdx: number, optionIdx: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
  };

  // Calculate score
  const score = quizQuestions.reduce((acc, q, idx) => {
    return selectedAnswers[idx] === q.answerIndex ? acc + 1 : acc;
  }, 0);

  const allAnswered = Object.keys(selectedAnswers).length === quizQuestions.length;

  return (
    <div className="flex flex-col bg-white dark:bg-paper-900 border-2 border-paper-900 dark:border-paper-300 rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(24,23,21,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,247,238,1)] text-left">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-paper-200 dark:border-paper-700">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-arcade-cyan" />
          <h2 className="font-bold text-sm uppercase tracking-wider font-mono">
            Conceptual Mastery Quiz
          </h2>
        </div>
        {submitted && (
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-arcade-emerald/20 text-arcade-emerald border border-arcade-emerald/30 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" />
            {score} / {quizQuestions.length} Correct
          </span>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {quizQuestions.map((q, qIdx) => {
          const selected = selectedAnswers[qIdx];
          const isCorrect = selected === q.answerIndex;

          return (
            <div
              key={qIdx}
              className="p-4 rounded-xl border border-paper-200 dark:border-paper-700 bg-paper-50/50 dark:bg-paper-800/40 space-y-3"
            >
              <h3 className="text-xs sm:text-sm font-bold text-paper-950 dark:text-paper-50">
                {qIdx + 1}. {q.question}
              </h3>

              {/* Options */}
              <div className="space-y-2">
                {q.options.map((opt, optIdx) => {
                  const isThisSelected = selected === optIdx;
                  const isThisTheCorrectAnswer = optIdx === q.answerIndex;

                  let optionStyle =
                    "border-paper-200 dark:border-paper-700 bg-white dark:bg-paper-900 text-paper-800 dark:text-paper-200";

                  if (submitted) {
                    if (isThisTheCorrectAnswer) {
                      optionStyle = "border-arcade-emerald bg-arcade-emerald/15 text-paper-950 dark:text-paper-50 font-bold";
                    } else if (isThisSelected && !isThisTheCorrectAnswer) {
                      optionStyle = "border-arcade-crimson bg-arcade-crimson/15 text-paper-950 dark:text-paper-50";
                    }
                  } else if (isThisSelected) {
                    optionStyle = "border-arcade-crimson bg-arcade-crimson/5 text-paper-950 dark:text-paper-50 font-bold";
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelect(qIdx, optIdx)}
                      disabled={submitted}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex items-center justify-between ${optionStyle}`}
                    >
                      <span>{opt}</span>
                      {submitted && (
                        <span>
                          {isThisTheCorrectAnswer ? (
                            <CheckCircle2 className="w-4 h-4 text-arcade-emerald shrink-0" />
                          ) : isThisSelected ? (
                            <XCircle className="w-4 h-4 text-arcade-crimson shrink-0" />
                          ) : null}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation on submission */}
              {submitted && (
                <div
                  className={`p-3 rounded-lg text-xs leading-relaxed border ${
                    isCorrect
                      ? "bg-arcade-emerald/5 border-arcade-emerald/30 text-paper-900 dark:text-paper-100"
                      : "bg-arcade-amber/10 border-arcade-amber/30 text-paper-900 dark:text-paper-100"
                  }`}
                >
                  <span className="font-bold font-mono uppercase text-[10px] block mb-1">
                    {isCorrect ? "Correct!" : "Explanation:"}
                  </span>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Submit / Reset Actions */}
      <div className="pt-5 mt-6 border-t border-paper-200 dark:border-paper-700 flex items-center justify-between">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="w-full py-2.5 rounded-lg bg-paper-900 text-white dark:bg-paper-50 dark:text-paper-950 font-bold text-xs uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-arcade-crimson hover:text-white transition"
          >
            {allAnswered ? "Submit Answers" : `Answer all questions (${Object.keys(selectedAnswers).length}/${quizQuestions.length})`}
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="w-full py-2.5 rounded-lg border border-paper-300 dark:border-paper-700 hover:border-arcade-crimson font-mono text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Quiz</span>
          </button>
        )}
      </div>
    </div>
  );
}
