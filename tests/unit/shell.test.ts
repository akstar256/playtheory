import { describe, it, expect } from "vitest";
import { buildSandboxSrcDoc } from "@/lib/runtime/shell";

describe("buildSandboxSrcDoc", () => {
  it("should generate HTML containing closure-scoped sim extraction and strict CSP", () => {
    const code = `
      const sim = {
        init(params, rng) { return { x: 10 }; },
        step(state, params, dt, rng) { return { x: state.x + dt }; },
        draw(ctx, state, params, view) {},
        metrics(state, params) { return { x: state.x }; }
      };
    `;

    const html = buildSandboxSrcDoc({
      code,
      initialParams: { speed: 1 },
      seed: 1234,
    });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Content-Security-Policy");
    expect(html).toContain("default-src 'none'");
    expect(html).toContain("function(SimKit)");
    expect(html).toContain("if (typeof sim !== \"undefined\") return sim;");
    expect(html).toContain("createMulberry32");
    expect(html).toContain("sim-canvas");
    expect(html).toContain("error-overlay");
  });

  it("should evaluate closure and extract sim object without scoping leaks", () => {
    const code = `
      const sim = {
        init(params, rng) { return { pos: 42 }; },
        step(state, params, dt, rng) { return { pos: state.pos + 1 }; },
        draw(ctx, state, params, view) {},
        metrics(state, params) { return { pos: state.pos }; }
      };
    `;

    // In a Node/JS environment, evaluate the closure code that shell.ts builds
    const SimKit = {
      clamp: (x: number, a: number, b: number) => Math.max(a, Math.min(b, x)),
      lerp: (a: number, b: number, t: number) => a + (b - a) * t,
    };

    // This is the exact pattern used in shell.ts:
    // sim = (function(SimKit) { ${code} if (typeof sim !== "undefined") return sim; ... })(SimKit);
    const extractFn = new Function(
      "SimKit",
      `
      ${code}
      if (typeof sim !== "undefined") return sim;
      return null;
      `
    );

    const simInstance = extractFn(SimKit);
    expect(simInstance).toBeDefined();
    expect(typeof simInstance.init).toBe("function");
    expect(typeof simInstance.step).toBe("function");
    expect(typeof simInstance.draw).toBe("function");
    expect(typeof simInstance.metrics).toBe("function");

    const state = simInstance.init({ speed: 1 }, Math.random);
    expect(state).toEqual({ pos: 42 });

    const nextState = simInstance.step(state, { speed: 1 }, 1 / 60, Math.random);
    expect(nextState).toEqual({ pos: 43 });

    const metrics = simInstance.metrics(nextState, { speed: 1 });
    expect(metrics).toEqual({ pos: 43 });
  });
});
