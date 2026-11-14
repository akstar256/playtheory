import { SimSpec } from "@/lib/schemas/simSpec";

export const cellularAutomatonSpec: SimSpec = {
  schemaVersion: 1,
  safety: { allowed: true },
  title: "Conway's Game of Life (Cellular Automaton)",
  concept: "Conway's Game of Life cellular automaton rules and emergent complexity",
  level: "beginner",
  archetype: "cellular_automaton",
  coreIdea: "Extremely simple local neighbor rules generate vast emergent behaviors: stable still-lifes, oscillators, and moving gliders.",
  learningObjectives: [
    "Observe how local birth and survival rules generate macroscopic patterns",
    "Identify classic still-life, periodic oscillator, and moving glider structures",
    "Analyze how initial seed density governs pattern survival or extinction",
  ],
  stateVariables: [
    { id: "aliveCount", name: "Living Cells", unit: "cells", description: "Count of actively living grid cells" },
    { id: "generation", name: "Generation", unit: "ticks", description: "Discrete time steps elapsed" },
    { id: "density", name: "Grid Density", unit: "%", description: "Percentage of grid occupied by living cells" },
  ],
  parameters: [
    {
      id: "initialDensity",
      label: "Initial Density",
      min: 0.05,
      max: 0.6,
      step: 0.05,
      default: 0.25,
      unit: "ratio",
      description: "Fraction of cells alive at initial randomization",
      effectHint: "Sparse setups die out; dense setups rapidly stabilize into still-lifes.",
    },
    {
      id: "speedHz",
      label: "Step Frequency",
      min: 2,
      max: 30,
      step: 1,
      default: 12,
      unit: "steps/s",
      description: "Generations computed per second",
      effectHint: "Higher frequency accelerates evolution speed.",
    },
    {
      id: "underpopulation",
      label: "Underpopulation Threshold",
      min: 1,
      max: 3,
      step: 1,
      default: 2,
      unit: "neighbors",
      description: "Live cells with fewer than this many neighbors die",
      effectHint: "Raising this increases cell mortality.",
    },
  ],
  dynamics: "Grid of 64x40 cells. Standard Conway B3/S23 rules: A live cell survives if it has 2 or 3 living neighbors; a dead cell becomes alive if it has exactly 3 neighbors.",
  visual: {
    canvasDescription: "Pixel grid where living cells glow with neon arcade-cyan halos against a warm paper grid.",
    encodings: [
      "cyan square = living cell",
      "amber outline = newly birthed cell",
      "grid line = discrete cell boundary",
    ],
    plots: [
      {
        id: "population_plot",
        title: "Living Cells Over Time",
        series: [{ metricKey: "alive", label: "Live Cells" }],
      },
    ],
  },
  presets: [
    {
      name: "Random Prime Seed",
      description: "Standard 25% random initial fill leading to chaotic oscillator emergence.",
      params: { initialDensity: 0.25, speedHz: 12, underpopulation: 2 },
      observe: "Chaotic early collisions quickly resolve into stable clusters and pulsars.",
    },
    {
      name: "High Density Overcrowding",
      description: "50% dense matrix leading to massive initial die-offs.",
      params: { initialDensity: 0.5, speedHz: 15, underpopulation: 2 },
      observe: "A dramatic early extinction crash followed by static block islands.",
    },
    {
      name: "Sparse Loneliness",
      description: "Very low initial density where cells starve of neighbors.",
      params: { initialDensity: 0.08, speedHz: 8, underpopulation: 2 },
      observe: "Most clusters vanish within 10 generations.",
    },
  ],
  misconceptions: [
    {
      wrong: "Patterns require complex intelligent rules to exhibit self-organization.",
      right: "Turing-complete complex structures arise purely from four microscopic counting rules.",
    },
  ],
  quiz: [
    {
      question: "Under standard Conway rules, how many neighbors are required to birth a dead cell?",
      options: ["Exactly 3", "2 or 3", "At least 4", "Only 1"],
      answerIndex: 0,
      explanation: "A dead cell becomes alive if and only if it has exactly 3 living neighbors.",
    },
    {
      question: "What happens to a live cell with only 1 neighbor?",
      options: ["Dies of underpopulation", "Survives safely", "Duplicates into 2 cells", "Becomes an oscillator"],
      answerIndex: 0,
      explanation: "Live cells with fewer than 2 neighbors die of loneliness/underpopulation.",
    },
  ],
};

export const cellularAutomatonCode = `
// Archetype Exemplar: Conway's Game of Life (Cellular Automaton)
const sim = {
  init(params, rng) {
    const cols = 64;
    const rows = 40;
    const grid = new Uint8Array(cols * rows);

    for (let i = 0; i < grid.length; i++) {
      grid[i] = rng() < params.initialDensity ? 1 : 0;
    }

    return {
      cols: cols,
      rows: rows,
      grid: grid,
      aliveCount: 0,
      generation: 0,
      stepTimer: 0
    };
  },

  step(state, params, dt, rng) {
    state.stepTimer += dt;
    const interval = 1 / Math.max(1, params.speedHz);

    if (state.stepTimer < interval) {
      return state;
    }
    state.stepTimer = 0;
    state.generation++;

    const cols = state.cols;
    const rows = state.rows;
    const current = state.grid;
    const next = new Uint8Array(cols * rows);
    let alive = 0;

    for (let y = 0; y < rows; y++) {
      const yUp = ((y - 1 + rows) % rows) * cols;
      const yCur = y * cols;
      const yDown = ((y + 1) % rows) * cols;

      for (let x = 0; x < cols; x++) {
        const xLeft = (x - 1 + cols) % cols;
        const xRight = (x + 1) % cols;

        // Count 8 neighbors with toroidal wrap
        const neighbors =
          current[yUp + xLeft] + current[yUp + x] + current[yUp + xRight] +
          current[yCur + xLeft] +                  current[yCur + xRight] +
          current[yDown + xLeft] + current[yDown + x] + current[yDown + xRight];

        const idx = yCur + x;
        const isAlive = current[idx] === 1;

        if (isAlive) {
          if (neighbors >= params.underpopulation && neighbors <= 3) {
            next[idx] = 1;
            alive++;
          } else {
            next[idx] = 0;
          }
        } else {
          if (neighbors === 3) {
            next[idx] = 1;
            alive++;
          } else {
            next[idx] = 0;
          }
        }
      }
    }

    state.grid = next;
    state.aliveCount = alive;
    return state;
  },

  metrics(state, params) {
    return {
      alive: state.aliveCount,
      density: (state.aliveCount / (state.cols * state.rows)) * 100
    };
  },

  draw(ctx, state, params, view) {
    SimKit.grid(ctx, view, { step: 40, color: "rgba(214, 198, 165, 0.2)" });

    const padding = 40;
    const arenaW = view.width - padding * 2;
    const arenaH = view.height - padding * 2;
    const cellW = arenaW / state.cols;
    const cellH = arenaH / state.rows;

    // Draw container border
    ctx.strokeStyle = "#2B2824";
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding, arenaW, arenaH);

    // Draw cells
    ctx.fillStyle = SimKit.palette[1]; // cyan
    const grid = state.grid;

    for (let y = 0; y < state.rows; y++) {
      const rowOffset = y * state.cols;
      for (let x = 0; x < state.cols; x++) {
        if (grid[rowOffset + x] === 1) {
          ctx.fillRect(
            padding + x * cellW + 0.5,
            padding + y * cellH + 0.5,
            cellW - 1,
            cellH - 1
          );
        }
      }
    }

    // Overlay Header & Stats
    SimKit.text(ctx, "Conway's Game of Life • Gen: " + state.generation, padding, padding - 15, { size: 14, font: "bold sans-serif" });
    SimKit.text(ctx, "Live Cells: " + state.aliveCount + " (" + ((state.aliveCount / (state.cols * state.rows)) * 100).toFixed(1) + "%)", view.width - padding, padding - 15, { align: "right", size: 13, font: "bold monospace" });
  }
};
`.trim();
