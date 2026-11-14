import { SimSpec } from "@/lib/schemas/simSpec";
import { VerificationCheck } from "@/lib/schemas/contracts";
import { SimKit } from "@/lib/runtime/simkit";

export interface ModelCheckResult {
  passed: boolean;
  checks: VerificationCheck[];
  timings: { stepMsAvg: number; drawMsAvg: number };
}

function createRng(seed: number = 42) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function areAllNumbersFinite(obj: any, path = ""): { ok: boolean; badPath?: string; badVal?: any } {
  if (obj === null || obj === undefined) return { ok: true };
  if (typeof obj === "number") {
    if (isNaN(obj) || !isFinite(obj)) {
      return { ok: false, badPath: path, badVal: obj };
    }
    return { ok: true };
  }
  if (Array.isArray(obj)) {
    for (let i = 0; i < Math.min(obj.length, 100); i++) {
      const res = areAllNumbersFinite(obj[i], `${path}[${i}]`);
      if (!res.ok) return res;
    }
    return { ok: true };
  }
  if (typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      const res = areAllNumbersFinite(obj[key], path ? `${path}.${key}` : key);
      if (!res.ok) return res;
    }
  }
  return { ok: true };
}

function isValueBounded(obj: any, maxMag = 1e9): boolean {
  if (typeof obj === "number") {
    return Math.abs(obj) <= maxMag;
  }
  if (typeof obj === "object" && obj !== null) {
    for (const k of Object.keys(obj)) {
      if (!isValueBounded(obj[k], maxMag)) return false;
    }
  }
  return true;
}

export function runModelChecks(
  simModule: any,
  spec: SimSpec
): ModelCheckResult {
  const checks: VerificationCheck[] = [];
  let stepMsAvg = 0;
  let drawMsAvg = 0;

  // Build default parameters map
  const defaultParams: Record<string, number> = {};
  for (const p of spec.parameters) {
    defaultParams[p.id] = p.default;
  }

  // Required metric keys from spec
  const requiredMetricKeys = new Set<string>();
  for (const plot of spec.visual.plots) {
    for (const s of plot.series) {
      requiredMetricKeys.add(s.metricKey);
    }
  }

  // Check 3: model.runs (600 steps execution)
  let simState: any;
  let rng = createRng(42);
  const dt = 1 / 60;
  let stepDurationTotal = 0;

  try {
    simState = simModule.init(defaultParams, rng);
    const startStepTime = performance.now();

    for (let i = 0; i < 600; i++) {
      simState = simModule.step(simState, defaultParams, dt, rng);
    }

    stepDurationTotal = performance.now() - startStepTime;
    stepMsAvg = stepDurationTotal / 600;

    checks.push({
      id: "model.runs",
      status: "pass",
    });
  } catch (err: any) {
    checks.push({
      id: "model.runs",
      status: "fail",
      message: `Simulation crashed during 600-step model run: ${err.message}`,
      evidence: { error: err.stack || err.message },
    });
    return { passed: false, checks, timings: { stepMsAvg, drawMsAvg } };
  }

  // Check 4: model.finite (no NaN or Infinity)
  const stateFiniteCheck = areAllNumbersFinite(simState, "state");
  if (!stateFiniteCheck.ok) {
    checks.push({
      id: "model.finite",
      status: "fail",
      message: `Non-finite number found in state: '${stateFiniteCheck.badPath}' = ${stateFiniteCheck.badVal}`,
      evidence: stateFiniteCheck,
    });
    return { passed: false, checks, timings: { stepMsAvg, drawMsAvg } };
  }

  let finalMetrics: Record<string, number> = {};
  try {
    finalMetrics = simModule.metrics(simState, defaultParams);
  } catch (err: any) {
    checks.push({
      id: "model.metrics",
      status: "fail",
      message: `sim.metrics() threw an exception: ${err.message}`,
    });
    return { passed: false, checks, timings: { stepMsAvg, drawMsAvg } };
  }

  const metricsFiniteCheck = areAllNumbersFinite(finalMetrics, "metrics");
  if (!metricsFiniteCheck.ok) {
    checks.push({
      id: "model.finite",
      status: "fail",
      message: `Non-finite number returned by metrics(): '${metricsFiniteCheck.badPath}' = ${metricsFiniteCheck.badVal}`,
    });
    return { passed: false, checks, timings: { stepMsAvg, drawMsAvg } };
  } else {
    checks.push({
      id: "model.finite",
      status: "pass",
    });
  }

  // Check 5: model.metrics (presence of all plot keys)
  const missingKeys: string[] = [];
  for (const key of Array.from(requiredMetricKeys)) {
    if (finalMetrics[key] === undefined || typeof finalMetrics[key] !== "number") {
      missingKeys.push(key);
    }
  }

  if (missingKeys.length > 0) {
    checks.push({
      id: "model.metrics",
      status: "fail",
      message: `metrics() is missing required metricKey(s) specified in plots: ${missingKeys.join(", ")}`,
      evidence: { missing: missingKeys, returned: Object.keys(finalMetrics) },
    });
  } else {
    checks.push({
      id: "model.metrics",
      status: "pass",
    });
  }

  // Check 6: model.deterministic (same seed produces same state hash)
  try {
    const rng1 = createRng(999);
    let s1 = simModule.init(defaultParams, rng1);
    for (let i = 0; i < 100; i++) s1 = simModule.step(s1, defaultParams, dt, rng1);

    const rng2 = createRng(999);
    let s2 = simModule.init(defaultParams, rng2);
    for (let i = 0; i < 100; i++) s2 = simModule.step(s2, defaultParams, dt, rng2);

    const hash1 = SimKit.hash(s1);
    const hash2 = SimKit.hash(s2);

    if (hash1 !== hash2) {
      checks.push({
        id: "model.deterministic",
        status: "fail",
        message: "Simulation is non-deterministic: identical seeds produced divergent states.",
      });
    } else {
      checks.push({
        id: "model.deterministic",
        status: "pass",
      });
    }
  } catch (err: any) {
    checks.push({
      id: "model.deterministic",
      status: "fail",
      message: `Determinism check failed: ${err.message}`,
    });
  }

  // Check 7: model.sensitivity (Dead Slider Detection)
  const deadSliders: string[] = [];
  for (const param of spec.parameters) {
    const paramsMin = { ...defaultParams, [param.id]: param.min };
    const paramsMax = { ...defaultParams, [param.id]: param.max };

    const rngMin = createRng(101);
    let sMin = simModule.init(paramsMin, rngMin);
    for (let i = 0; i < 300; i++) sMin = simModule.step(sMin, paramsMin, dt, rngMin);
    const mMin = simModule.metrics(sMin, paramsMin);

    const rngMax = createRng(101);
    let sMax = simModule.init(paramsMax, rngMax);
    for (let i = 0; i < 300; i++) sMax = simModule.step(sMax, paramsMax, dt, rngMax);
    const mMax = simModule.metrics(sMax, paramsMax);

    // Check if any metric or state difference occurs above epsilon
    let delta = 0;
    for (const k of Object.keys(mMin)) {
      if (typeof mMin[k] === "number" && typeof mMax[k] === "number") {
        delta += Math.abs(mMax[k] - mMin[k]);
      }
    }

    if (delta < 1e-4) {
      deadSliders.push(param.id);
    }
  }

  const deadRatio = deadSliders.length / spec.parameters.length;
  if (deadRatio > 0.33) {
    checks.push({
      id: "model.sensitivity",
      status: "fail",
      message: `Dead slider(s) detected: ${deadSliders.join(", ")}. Modifying these sliders had zero perceptible effect on simulation metrics.`,
      evidence: { deadSliders, deadRatio },
    });
  } else if (deadSliders.length > 0) {
    checks.push({
      id: "model.sensitivity",
      status: "warn",
      message: `Minor dead slider warning for: ${deadSliders.join(", ")}`,
      evidence: { deadSliders },
    });
  } else {
    checks.push({
      id: "model.sensitivity",
      status: "pass",
    });
  }

  // Check 8: model.bounded (stay within 1e9 at extreme parameters)
  let boundedPass = true;
  for (const param of spec.parameters) {
    const extremeParams = { ...defaultParams, [param.id]: param.max };
    const rExt = createRng(555);
    let sExt = simModule.init(extremeParams, rExt);
    for (let i = 0; i < 150; i++) sExt = simModule.step(sExt, extremeParams, dt, rExt);
    if (!isValueBounded(sExt, 1e9)) {
      boundedPass = false;
      break;
    }
  }

  checks.push({
    id: "model.bounded",
    status: boundedPass ? "pass" : "fail",
    message: boundedPass ? undefined : "Simulation values exploded beyond 1e9 magnitude at parameter boundaries.",
  });

  // Check 12: perf.budget (average step time < 2ms, fail > 6ms)
  if (stepMsAvg > 6.0) {
    checks.push({
      id: "perf.budget",
      status: "fail",
      message: `Simulation step is too slow: avg ${stepMsAvg.toFixed(2)} ms/step (budget: < 2.0 ms)`,
      evidence: { stepMsAvg },
    });
  } else if (stepMsAvg > 2.0) {
    checks.push({
      id: "perf.budget",
      status: "warn",
      message: `Simulation step exceeds 2ms target: avg ${stepMsAvg.toFixed(2)} ms/step`,
      evidence: { stepMsAvg },
    });
  } else {
    checks.push({
      id: "perf.budget",
      status: "pass",
      evidence: { stepMsAvg },
    });
  }

  const passed = !checks.some((c) => c.status === "fail");
  return { passed, checks, timings: { stepMsAvg, drawMsAvg } };
}
