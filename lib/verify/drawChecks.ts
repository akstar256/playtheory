import { SimSpec } from "@/lib/schemas/simSpec";
import { VerificationCheck } from "@/lib/schemas/contracts";

export interface DrawCheckResult {
  passed: boolean;
  checks: VerificationCheck[];
  drawMsAvg: number;
}

/**
 * Creates a lightweight canvas mock for hermetic headless Node/server execution
 * that tracks draw operations and simulated pixel entropy.
 */
function createMockCanvas(width = 960, height = 600) {
  let operations = 0;
  let strokeCalls = 0;
  let fillCalls = 0;
  let textCalls = 0;
  let stateHash = 0;

  const ctx: any = {
    canvas: { width, height },
    save() {},
    restore() {},
    beginPath() { operations++; },
    closePath() {},
    moveTo(x: number, y: number) { operations++; stateHash = (stateHash + x + y) | 0; },
    lineTo(x: number, y: number) { operations++; stateHash = (stateHash + x + y) | 0; },
    arc(x: number, y: number, r: number) { operations++; stateHash = (stateHash + x + y + r) | 0; },
    rect(x: number, y: number, w: number, h: number) { operations++; stateHash = (stateHash + x + y + w + h) | 0; },
    stroke() { operations++; strokeCalls++; },
    fill() { operations++; fillCalls++; },
    strokeRect(x: number, y: number, w: number, h: number) { operations++; strokeCalls++; stateHash = (stateHash + x + y) | 0; },
    fillRect(x: number, y: number, w: number, h: number) { operations++; fillCalls++; stateHash = (stateHash + x + y) | 0; },
    clearRect() {},
    fillText(str: string, x: number, y: number) { operations++; textCalls++; stateHash = (stateHash + str.length + x + y) | 0; },
    strokeText(str: string, x: number, y: number) { operations++; textCalls++; },
    translate() {},
    rotate() {},
    scale() {},
    resetTransform() {},
    setLineDash() {},
  };

  return {
    ctx,
    getStats() {
      return { operations, strokeCalls, fillCalls, textCalls, stateHash };
    },
  };
}

export function runDrawChecks(simModule: any, spec: SimSpec): DrawCheckResult {
  const checks: VerificationCheck[] = [];
  const defaultParams: Record<string, number> = {};
  for (const p of spec.parameters) {
    defaultParams[p.id] = p.default;
  }

  // Setup simulation state
  let rng = () => 0.5;
  let state: any;
  try {
    state = simModule.init(defaultParams, rng);
  } catch (err: any) {
    checks.push({
      id: "draw.runs",
      status: "fail",
      message: `Failed to initialize state for draw checks: ${err.message}`,
    });
    return { passed: false, checks, drawMsAvg: 0 };
  }

  const timestamps = [0, 2, 5];
  const frameSnapshots: number[] = [];
  let drawDurationTotal = 0;

  // Check 9: draw.runs at t=0, t=2, t=5
  try {
    for (const t of timestamps) {
      const mock = createMockCanvas(960, 600);
      const view = { width: 960, height: 600, t };

      const tStart = performance.now();
      simModule.draw(mock.ctx, state, defaultParams, view);
      drawDurationTotal += performance.now() - tStart;

      const stats = mock.getStats();
      frameSnapshots.push(stats.operations + stats.stateHash);

      // Advance state a bit between frames
      const dt = 1 / 60;
      for (let s = 0; s < 30; s++) {
        state = simModule.step(state, defaultParams, dt, rng);
      }
    }

    checks.push({
      id: "draw.runs",
      status: "pass",
    });
  } catch (err: any) {
    checks.push({
      id: "draw.runs",
      status: "fail",
      message: `sim.draw() threw an exception during render: ${err.message}`,
      evidence: { error: err.stack || err.message },
    });
    return { passed: false, checks, drawMsAvg: 0 };
  }

  const drawMsAvg = drawDurationTotal / timestamps.length;

  // Check 10: draw.notBlank (operations executed > 5)
  const initialFrameOps = frameSnapshots[0];
  if (initialFrameOps < 5) {
    checks.push({
      id: "draw.notBlank",
      status: "fail",
      message: "Canvas render produced insufficient visual elements (blank or near-empty canvas detected).",
      evidence: { operations: initialFrameOps },
    });
  } else {
    checks.push({
      id: "draw.notBlank",
      status: "pass",
    });
  }

  // Check 11: draw.changes (frame at t=5 differs from t=0)
  const isStaticArchetype = spec.archetype === "geometry_optics";
  const frame0 = frameSnapshots[0];
  const frame5 = frameSnapshots[2];

  if (!isStaticArchetype && frame0 === frame5) {
    checks.push({
      id: "draw.changes",
      status: "fail",
      message: "Simulation appears visually static: canvas render at t=5 was identical to t=0.",
      evidence: { frame0, frame5 },
    });
  } else {
    checks.push({
      id: "draw.changes",
      status: "pass",
    });
  }

  // Check 12: Draw performance budget (< 8ms avg, fail > 24ms)
  if (drawMsAvg > 24.0) {
    checks.push({
      id: "perf.draw",
      status: "fail",
      message: `Canvas draw is too slow: avg ${drawMsAvg.toFixed(2)} ms/frame (budget: < 8.0 ms)`,
      evidence: { drawMsAvg },
    });
  } else if (drawMsAvg > 8.0) {
    checks.push({
      id: "perf.draw",
      status: "warn",
      message: `Canvas draw exceeds 8ms target: avg ${drawMsAvg.toFixed(2)} ms/frame`,
      evidence: { drawMsAvg },
    });
  } else {
    checks.push({
      id: "perf.draw",
      status: "pass",
      evidence: { drawMsAvg },
    });
  }

  const passed = !checks.some((c) => c.status === "fail");
  return { passed, checks, drawMsAvg };
}
