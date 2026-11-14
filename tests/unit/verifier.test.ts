import { describe, it, expect } from "vitest";
import { verify } from "@/lib/verify";
import { particlesSpec, particlesCode } from "@/lib/archetypes/particles";

describe("12-Point Automated Verifier Harness", () => {
  it("should pass all checks on the verified particles exemplar", () => {
    const report = verify(particlesCode, particlesSpec);
    expect(report.status).toBe("pass");
    expect(report.checks.some((c) => c.status === "fail")).toBe(false);
  });

  it("should catch infinite loops via loop-guard instrumentation", () => {
    const infiniteLoopCode = `
      const sim = {
        init(params, rng) { return { x: 0 }; },
        step(state, params, dt, rng) {
          while (true) {
            // Infinite loop
          }
          return state;
        },
        metrics(state, params) { return { altitude: 0, range: 0, speed: 0 }; },
        draw(ctx, state, params, view) { ctx.fillRect(0,0,10,10); }
      };
    `;

    const report = verify(infiniteLoopCode, particlesSpec);
    expect(report.status).toBe("fail");
    const runCheck = report.checks.find((c) => c.id === "model.runs");
    expect(runCheck?.status).toBe("fail");
    expect(runCheck?.message).toContain("LoopBudgetError");
  });

  it("should catch non-finite / NaN values in state or metrics", () => {
    const nanCode = `
      const sim = {
        init(params, rng) { return { x: 0 }; },
        step(state, params, dt, rng) {
          state.x = 0 / 0; // NaN
          return state;
        },
        metrics(state, params) { return { altitude: state.x, range: 0, speed: 0 }; },
        draw(ctx, state, params, view) { ctx.fillRect(0,0,10,10); }
      };
    `;

    const report = verify(nanCode, particlesSpec);
    expect(report.status).toBe("fail");
    const finiteCheck = report.checks.find((c) => c.id === "model.finite");
    expect(finiteCheck?.status).toBe("fail");
  });

  it("should reject banned APIs like fetch and Math.random", () => {
    const bannedCode = `
      const sim = {
        init(params, rng) { return { r: Math.random() }; },
        step(state, params, dt, rng) { return state; },
        metrics(state, params) { return { altitude: 0, range: 0, speed: 0 }; },
        draw(ctx, state, params, view) { ctx.fillRect(0,0,10,10); }
      };
    `;

    const report = verify(bannedCode, particlesSpec);
    expect(report.status).toBe("fail");
    const bannedCheck = report.checks.find((c) => c.id === "static.banned");
    expect(bannedCheck?.status).toBe("fail");
  });

  it("should catch missing metric keys required by visual plots", () => {
    const missingMetricCode = `
      const sim = {
        init(params, rng) { return { x: 0 }; },
        step(state, params, dt, rng) { return state; },
        metrics(state, params) { return { range: 0 }; }, // missing 'altitude' and 'speed'
        draw(ctx, state, params, view) { ctx.fillRect(0,0,10,10); }
      };
    `;

    const report = verify(missingMetricCode, particlesSpec);
    expect(report.status).toBe("fail");
    const metricCheck = report.checks.find((c) => c.id === "model.metrics");
    expect(metricCheck?.status).toBe("fail");
    expect(metricCheck?.message).toContain("altitude");
  });

  it("should detect dead sliders when parameters have no effect", () => {
    const deadSliderCode = `
      const sim = {
        init(params, rng) { return { x: 0 }; },
        step(state, params, dt, rng) {
          // Zero reference to params!
          state.x += dt;
          return state;
        },
        metrics(state, params) { return { altitude: 10, range: state.x, speed: 5 }; },
        draw(ctx, state, params, view) { ctx.fillRect(0,0,10,10); }
      };
    `;

    const report = verify(deadSliderCode, particlesSpec);
    expect(report.status).toBe("fail");
    const sensitivityCheck = report.checks.find((c) => c.id === "model.sensitivity");
    expect(sensitivityCheck?.status).toBe("fail");
    expect(sensitivityCheck?.message).toContain("Dead slider");
  });

  it("should detect blank canvas rendering", () => {
    const blankCanvasCode = `
      const sim = {
        init(params, rng) { return { x: 0 }; },
        step(state, params, dt, rng) {
          state.x += params.launchSpeed * dt;
          return state;
        },
        metrics(state, params) { return { altitude: params.launchAngle, range: state.x, speed: params.launchSpeed }; },
        draw(ctx, state, params, view) {
          // Empty draw function!
        }
      };
    `;

    const report = verify(blankCanvasCode, particlesSpec);
    expect(report.status).toBe("fail");
    const blankCheck = report.checks.find((c) => c.id === "draw.notBlank");
    expect(blankCheck?.status).toBe("fail");
  });
});
