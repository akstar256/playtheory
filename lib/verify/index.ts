import { SimSpec } from "@/lib/schemas/simSpec";
import { VerificationReport, VerificationCheck } from "@/lib/schemas/contracts";
import { runStaticChecks } from "./static";
import { instrumentLoopGuard } from "./loopGuard";
import { runModelChecks } from "./modelChecks";
import { runDrawChecks } from "./drawChecks";
import { SimKit } from "@/lib/runtime/simkit";
import { computeCodeHash } from "@/lib/pipeline/utils";

export * from "./static";
export * from "./loopGuard";
export * from "./modelChecks";
export * from "./drawChecks";

export interface VerifyOptions {
  attempt?: number;
}

export function verify(
  rawCode: string,
  spec: SimSpec,
  opts: VerifyOptions = {}
): VerificationReport {
  const attempt = opts.attempt ?? 0;
  const codeHash = computeCodeHash(rawCode);
  const allChecks: VerificationCheck[] = [];
  const defaultTimings = { stepMsAvg: 0, drawMsAvg: 0 };

  // 1. Static Checks (size, parse, banned identifiers, sim object structure)
  const staticResult = runStaticChecks(rawCode);
  allChecks.push(...staticResult.checks);

  if (!staticResult.passed) {
    return {
      status: "fail",
      attempt,
      codeHash,
      checks: allChecks,
      timings: defaultTimings,
    };
  }

  // 2. Loop-Guard Instrumentation
  let instrumentedCode = rawCode;
  try {
    instrumentedCode = instrumentLoopGuard(rawCode, 1_000_000);
    allChecks.push({ id: "guard.instrument", status: "pass" });
  } catch (err: any) {
    allChecks.push({
      id: "guard.instrument",
      status: "fail",
      message: `Loop-guard instrumentation failed: ${err.message}`,
    });
    return {
      status: "fail",
      attempt,
      codeHash,
      checks: allChecks,
      timings: defaultTimings,
    };
  }

  // 3. Sandboxed Evaluation with SimKit
  let simModule: any;
  try {
    const evaluator = new Function("SimKit", `
      ${instrumentedCode}
      return sim;
    `);
    simModule = evaluator(SimKit);
  } catch (err: any) {
    allChecks.push({
      id: "model.runs",
      status: "fail",
      message: `Runtime compilation error during module evaluation: ${err.message}`,
      evidence: { error: err.stack || err.message },
    });
    return {
      status: "fail",
      attempt,
      codeHash,
      checks: allChecks,
      timings: defaultTimings,
    };
  }

  // 4. Model Simulation Checks (600 steps, finite values, metrics presence, sensitivity, determinism, bounded)
  const modelResult = runModelChecks(simModule, spec);
  allChecks.push(...modelResult.checks);

  // 5. Draw Canvas Checks (render runs, not blank, visual changes, draw perf)
  const drawResult = runDrawChecks(simModule, spec);
  allChecks.push(...drawResult.checks);

  const hasFailures = allChecks.some((c) => c.status === "fail");

  return {
    status: hasFailures ? "fail" : "pass",
    attempt,
    codeHash,
    checks: allChecks,
    timings: {
      stepMsAvg: modelResult.timings.stepMsAvg,
      drawMsAvg: drawResult.drawMsAvg,
    },
  };
}

/**
 * Formats structured failures into a compact, model-readable prompt string
 * per Section 10 & 25 of the brief.
 */
export function formatFailuresForRepair(
  report: VerificationReport,
  code: string,
  spec: SimSpec
): string {
  const failingChecks = report.checks.filter((c) => c.status === "fail");
  if (failingChecks.length === 0) return "No failures detected.";

  const codeLines = code.split("\n");
  const excerpts: string[] = [];

  for (const check of failingChecks) {
    let excerptStr = "";
    const evidenceLine = (check.evidence as any)?.line;
    if (typeof evidenceLine === "number" && evidenceLine > 0) {
      const start = Math.max(0, evidenceLine - 5);
      const end = Math.min(codeLines.length, evidenceLine + 5);
      excerptStr = `\nCode around line ${evidenceLine}:\n` +
        codeLines.slice(start, end).map((l, idx) => `${start + idx + 1}: ${l}`).join("\n");
    }

    excerpts.push(`- [CHECK: ${check.id}] ${check.message || "Failed check"}${excerptStr}`);
  }

  const activeParams = spec.parameters.map((p) => `${p.id} (default: ${p.default}, min: ${p.min}, max: ${p.max})`).join(", ");

  return `### Failing Verification Checks:
${excerpts.join("\n\n")}

### Parameters in play:
${activeParams}
`;
}
