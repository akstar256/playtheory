import { getSimKitInjectionCode } from "./simkit";

export interface ShellOptions {
  code: string;
  initialParams: Record<string, number>;
  seed?: number;
}

/**
 * Builds the complete srcdoc HTML for the sandboxed simulation iframe.
 * Implements:
 * 1. Strict CSP meta tag
 * 2. SimKit injection
 * 3. Seeded PRNG (mulberry32)
 * 4. Fixed timestep accumulator (1/60s dt)
 * 5. Logical canvas 960x600 with HiDPI dpr scaling
 * 6. PostMessage communication with parent (params, speed, play/pause, reset, step)
 * 7. Throttled metrics reporting (~15Hz) to parent
 */
export function buildSandboxSrcDoc({
  code,
  initialParams,
  seed = 42,
}: ShellOptions): string {
  const simKitCode = getSimKitInjectionCode();
  const serializedInitialParams = JSON.stringify(initialParams);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:;">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #FAF7EE;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    canvas {
      width: 100%;
      height: 100%;
      object-fit: contain;
      image-rendering: auto;
      display: block;
    }
    #error-overlay {
      display: none;
      position: absolute;
      inset: 0;
      background: rgba(24, 23, 21, 0.9);
      color: #FAF7EE;
      font-family: monospace;
      padding: 24px;
      overflow: auto;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <canvas id="sim-canvas" width="960" height="600"></canvas>
  <div id="error-overlay"></div>

  <script>
    // --- Seeded PRNG (Mulberry32) ---
    function createMulberry32(seed) {
      let s = seed >>> 0;
      return function() {
        s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    // --- Injected SimKit ---
    ${simKitCode}

    // --- Generated Simulation Code ---
    try {
      ${code}
    } catch (err) {
      const overlay = document.getElementById("error-overlay");
      overlay.style.display = "block";
      overlay.innerText = "Runtime Syntax / Evaluation Error:\\n" + err.stack;
      window.parent.postMessage({ type: "sim_error", error: err.message }, "*");
    }

    // --- Host Simulation Runner ---
    (function() {
      if (typeof sim === "undefined") {
        console.error("Simulation script did not define 'sim'");
        return;
      }

      const canvas = document.getElementById("sim-canvas");
      const ctx = canvas.getContext("2d");
      const LOGICAL_WIDTH = 960;
      const LOGICAL_HEIGHT = 600;

      let currentParams = ${serializedInitialParams};
      let currentSeed = ${seed};
      let rng = createMulberry32(currentSeed);
      let state = null;

      let isPlaying = true;
      let speedMultiplier = 1.0;
      let simTime = 0;
      let lastFrameTime = performance.now();
      let accumulator = 0;
      const FIXED_DT = 1 / 60;
      let lastMetricReport = 0;

      function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = LOGICAL_WIDTH * dpr;
        canvas.height = LOGICAL_HEIGHT * dpr;
        ctx.resetTransform?.();
        ctx.scale(dpr, dpr);
      }
      window.addEventListener("resize", resizeCanvas);
      resizeCanvas();

      function initSimulation() {
        try {
          rng = createMulberry32(currentSeed);
          state = sim.init(currentParams, rng);
          simTime = 0;
          accumulator = 0;
          sendMetrics();
        } catch (err) {
          reportError("Error in sim.init()", err);
        }
      }

      function reportError(prefix, err) {
        const overlay = document.getElementById("error-overlay");
        overlay.style.display = "block";
        overlay.innerText = prefix + ":\\n" + (err.stack || err.message);
        window.parent.postMessage({ type: "sim_error", error: prefix + ": " + err.message }, "*");
      }

      function sendMetrics() {
        if (!state) return;
        try {
          const metrics = sim.metrics(state, currentParams);
          window.parent.postMessage({
            type: "sim_metrics",
            metrics,
            t: simTime
          }, "*");
        } catch (err) {
          // Silent or throttled metric error
        }
      }

      function renderFrame() {
        if (!state) return;
        try {
          ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
          const view = { width: LOGICAL_WIDTH, height: LOGICAL_HEIGHT, t: simTime };
          sim.draw(ctx, state, currentParams, view);
        } catch (err) {
          reportError("Error in sim.draw()", err);
        }
      }

      function loop(now) {
        const deltaSeconds = Math.min((now - lastFrameTime) / 1000, 0.25);
        lastFrameTime = now;

        if (isPlaying && state) {
          accumulator += deltaSeconds * speedMultiplier;
          let stepsTaken = 0;
          while (accumulator >= FIXED_DT && stepsTaken < 10) {
            try {
              state = sim.step(state, currentParams, FIXED_DT, rng);
            } catch (err) {
              reportError("Error in sim.step()", err);
              isPlaying = false;
              break;
            }
            simTime += FIXED_DT;
            accumulator -= FIXED_DT;
            stepsTaken++;
          }

          if (now - lastMetricReport > 66) { // ~15 Hz
            sendMetrics();
            lastMetricReport = now;
          }
        }

        renderFrame();
        requestAnimationFrame(loop);
      }

      // Handle Parent Commands
      window.addEventListener("message", function(e) {
        const data = e.data;
        if (!data || typeof data !== "object") return;

        switch (data.type) {
          case "update_params":
            currentParams = Object.assign({}, currentParams, data.params);
            break;
          case "reset":
            if (data.seed !== undefined) currentSeed = data.seed;
            initSimulation();
            break;
          case "play":
            isPlaying = true;
            break;
          case "pause":
            isPlaying = false;
            break;
          case "toggle_play":
            isPlaying = !isPlaying;
            window.parent.postMessage({ type: "play_state_changed", isPlaying }, "*");
            break;
          case "step_once":
            if (state) {
              try {
                state = sim.step(state, currentParams, FIXED_DT, rng);
                simTime += FIXED_DT;
                sendMetrics();
                renderFrame();
              } catch (err) {
                reportError("Error in sim.step()", err);
              }
            }
            break;
          case "set_speed":
            if (typeof data.speed === "number") speedMultiplier = data.speed;
            break;
        }
      });

      // Start initial state
      initSimulation();
      requestAnimationFrame(loop);
    })();
  </script>
</body>
</html>`;
}
