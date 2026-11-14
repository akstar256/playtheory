import { SimSpec } from "@/lib/schemas/simSpec";
import { VerificationReport } from "@/lib/schemas/contracts";
import { verify } from "@/lib/verify";

export type PipelineStage =
  | "idle"
  | "planning"
  | "building"
  | "verifying"
  | "repairing"
  | "passed"
  | "fallback";

export interface PipelineState {
  stage: PipelineStage;
  concept: string;
  level: "beginner" | "intermediate" | "advanced";
  spec: SimSpec | null;
  code: string;
  codeStream: string;
  report: VerificationReport | null;
  repairAttempt: number; // 0 = first attempt
  repairHistory: { attempt: number; report: VerificationReport }[];
  jobToken: string | null;
  error: string | null;
  fallbackSlug?: string;
  slug?: string;
}

export type PipelineListener = (state: PipelineState) => void;

export class PipelineOrchestrator {
  private state: PipelineState;
  private listeners: Set<PipelineListener> = new Set();

  constructor() {
    this.state = {
      stage: "idle",
      concept: "",
      level: "intermediate",
      spec: null,
      code: "",
      codeStream: "",
      report: null,
      repairAttempt: 0,
      repairHistory: [],
      jobToken: null,
      error: null,
    };
  }

  getState(): PipelineState {
    return { ...this.state };
  }

  subscribe(listener: PipelineListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private update(patch: Partial<PipelineState>): void {
    this.state = { ...this.state, ...patch };
    const current = this.getState();
    this.listeners.forEach((fn) => fn(current));
  }

  async run(concept: string, level: "beginner" | "intermediate" | "advanced" = "intermediate"): Promise<string> {
    this.update({
      stage: "planning",
      concept,
      level,
      spec: null,
      code: "",
      codeStream: "",
      report: null,
      repairAttempt: 0,
      repairHistory: [],
      jobToken: null,
      error: null,
    });

    try {
      // 1. Stage: Planning
      const planRes = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept, level }),
      });

      const planData = await planRes.json();
      if (!planRes.ok) {
        throw new Error(planData.error?.message || "Failed to generate simulation plan");
      }

      if (planData.type === "cached") {
        this.update({ stage: "passed", slug: planData.slug });
        return `/s/${planData.slug}`;
      }

      if (planData.type === "refusal") {
        throw new Error(planData.reason || "Concept cannot be simulated safely.");
      }

      const spec: SimSpec = planData.spec;
      this.update({ spec, stage: "building" });

      // 2. Stage: Building via SSE Stream
      const buildRes = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec }),
      });

      if (!buildRes.ok) {
        throw new Error("Failed to connect to code builder stream");
      }

      const reader = buildRes.body?.getReader();
      if (!reader) throw new Error("Stream reader unavailable");

      const decoder = new TextDecoder();
      let accumulatedCode = "";
      let jobToken = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();
            try {
              const event = JSON.parse(jsonStr);
              if (event.type === "code_chunk") {
                accumulatedCode += event.chunk;
                this.update({ codeStream: accumulatedCode });
              } else if (event.type === "done") {
                accumulatedCode = event.code;
                jobToken = event.jobToken;
              } else if (event.type === "error") {
                throw new Error(event.message);
              }
            } catch {
              // ignore partial lines
            }
          }
        }
      }

      if (!accumulatedCode) {
        throw new Error("Builder terminated without generating code.");
      }

      let currentCode = accumulatedCode;
      this.update({ code: currentCode, jobToken, stage: "verifying" });

      // 3. Stage: Verification & Self-Repair Loop
      let attempts = 0;
      let finalReport: VerificationReport | null = null;
      const history = [];

      while (attempts <= 3) {
        this.update({ stage: attempts === 0 ? "verifying" : "repairing", repairAttempt: attempts });

        // Run client-side verifier
        const report = verify(currentCode, spec, { attempt: attempts });
        finalReport = report;
        history.push({ attempt: attempts, report });
        this.update({ report, repairHistory: [...history] });

        if (report.status === "pass") {
          break; // Verification passed!
        }

        // Check if repair attempts exhausted
        if (attempts >= 3) {
          break;
        }

        attempts++;
        this.update({ stage: "repairing", repairAttempt: attempts });

        // Call Repair API
        const repairRes = await fetch("/api/repair", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobToken,
            spec,
            code: currentCode,
            errors: report.checks.filter((c) => c.status === "fail"),
            attempt: attempts,
            simplify: attempts === 3,
          }),
        });

        const repairData = await repairRes.json();
        if (!repairRes.ok || !repairData.success) {
          throw new Error(repairData.error?.message || "Repair loop execution failed");
        }

        currentCode = repairData.code;
        jobToken = repairData.jobToken;
        this.update({ code: currentCode, jobToken });
      }

      // If still failing after 3 attempts, activate graceful fallback
      if (!finalReport || finalReport.status === "fail") {
        const fallbackSlug = `${spec.archetype}-exemplar`;
        this.update({
          stage: "fallback",
          fallbackSlug,
          error: "Automated verification could not be satisfied after 3 repair attempts.",
        });
        return `/s/${fallbackSlug}`;
      }

      // 4. Stage: Persist Verified Simulation
      this.update({ stage: "passed" });
      const saveRes = await fetch("/api/sims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spec,
          code: currentCode,
          report: finalReport,
          repairHistory: history,
        }),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok) {
        throw new Error(saveData.error?.message || "Failed to persist verified simulation");
      }

      this.update({ slug: saveData.slug });
      return saveData.url;
    } catch (err: any) {
      this.update({
        stage: "fallback",
        error: err.message || "An unexpected error occurred in the generation pipeline.",
        fallbackSlug: "particles-exemplar",
      });
      throw err;
    }
  }
}
