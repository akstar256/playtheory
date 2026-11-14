import { SimSpec } from "@/lib/schemas/simSpec";

export const odePhaseSpec: SimSpec = {
  schemaVersion: 1,
  safety: { allowed: true },
  title: "Lotka-Volterra Predator-Prey Dynamics",
  concept: "Lotka-Volterra differential equations and phase portraits",
  level: "intermediate",
  archetype: "ode_phase",
  coreIdea: "Coupled non-linear differential equations generate closed limit cycles where prey abundance fuels predator surges followed by mutual crashes.",
  learningObjectives: [
    "Trace the 90-degree phase lag between prey abundance peaks and predator population peaks",
    "Identify the fixed equilibrium center point in phase space",
    "Analyze how carrying capacities and mortality rates damp or amplify oscillation amplitudes",
  ],
  stateVariables: [
    { id: "prey", name: "Prey Population", unit: "rabbits", description: "Abundance of primary herbivore population" },
    { id: "predators", name: "Predator Population", unit: "foxes", description: "Abundance of primary carnivore population" },
    { id: "time", name: "Elapsed Time", unit: "epochs", description: "Simulated ecological time" },
  ],
  parameters: [
    {
      id: "preyGrowth",
      label: "Prey Growth Rate (alpha)",
      min: 0.2,
      max: 1.8,
      step: 0.1,
      default: 0.8,
      unit: "1/yr",
      description: "Exponential reproduction rate of prey in absence of predators",
      effectHint: "Higher growth causes rapid prey rebounds and higher predator peaks.",
    },
    {
      id: "predationRate",
      label: "Predation Rate (beta)",
      min: 0.005,
      max: 0.05,
      step: 0.005,
      default: 0.02,
      unit: "1/fox/yr",
      description: "Efficiency with which predators encounter and consume prey",
      effectHint: "Higher rate intensifies predation, dropping prey numbers sharply.",
    },
    {
      id: "predatorMortality",
      label: "Predator Death Rate (gamma)",
      min: 0.1,
      max: 1.2,
      step: 0.05,
      default: 0.4,
      unit: "1/yr",
      description: "Starvation and natural mortality rate of predators",
      effectHint: "Higher mortality requires abundant prey to sustain the pack.",
    },
    {
      id: "predatorEfficiency",
      label: "Predator Conversion (delta)",
      min: 0.002,
      max: 0.03,
      step: 0.002,
      default: 0.01,
      unit: "fox/rabbit",
      description: "Rate at which consumed prey translates into new offspring",
      effectHint: "Increases predator reproduction rate following prey blooms.",
    },
  ],
  dynamics: "dPrey/dt = alpha * Prey - beta * Prey * Predator; dPredator/dt = delta * Prey * Predator - gamma * Predator. Integrated using 4th-order Runge-Kutta for exact numerical stability.",
  visual: {
    canvasDescription: "Split view: Left half shows time-series ecological waves; Right half shows phase space portrait (prey vs predators orbit).",
    encodings: [
      "cyan line = prey population over time",
      "amber line = predator population over time",
      "orbit loop = 2D phase portrait orbit path",
    ],
    plots: [
      {
        id: "population_plot",
        title: "Populations vs Time",
        series: [
          { metricKey: "prey", label: "Prey (Rabbits)" },
          { metricKey: "predator", label: "Predators (Foxes)" },
        ],
      },
    ],
  },
  presets: [
    {
      name: "Harmonic Equilibrium Cycle",
      description: "Standard balanced periodic oscillation between both species.",
      params: { preyGrowth: 0.8, predationRate: 0.02, predatorMortality: 0.4, predatorEfficiency: 0.01 },
      observe: "Notice the predator peak follows approximately a quarter cycle after the prey peak.",
    },
    {
      name: "High Mortality Boom & Bust",
      description: "Predators starve quickly without vast prey numbers, producing sharp spike rebounds.",
      params: { preyGrowth: 1.2, predationRate: 0.03, predatorMortality: 0.9, predatorEfficiency: 0.015 },
      observe: "Phase loop expands dramatically, grazing near extinction boundaries.",
    },
    {
      name: "Gentle Grazing Oscillation",
      description: "Mild growth and low predation forming a tight orbit near the center fixed point.",
      params: { preyGrowth: 0.4, predationRate: 0.015, predatorMortality: 0.3, predatorEfficiency: 0.008 },
      observe: "Tightly bounded orbit with low variance in both populations.",
    },
  ],
  misconceptions: [
    {
      wrong: "Predators and prey reach their peak populations simultaneously.",
      right: "Predators peak roughly a quarter-cycle after prey, because predator reproduction lags behind food abundance.",
    },
    {
      wrong: "In classic Lotka-Volterra systems, one species will eventually drive the other extinct.",
      right: "Without stochastic noise or carrying limits, the mathematical solution forms perfectly closed periodic orbits.",
    },
  ],
  quiz: [
    {
      question: "Why does the predator population curve peak AFTER the prey population curve?",
      options: [
        "Predators require time to consume food and produce offspring",
        "Prey migrate away during winter months",
        "Predators sleep for long cycles before hunting",
        "Prey growth rates slow down automatically at night",
      ],
      answerIndex: 0,
      explanation: "Biological gestation and maturation introduce a natural phase delay between prey abundance and predator reproductive output.",
    },
    {
      question: "What does a single closed loop in the phase portrait represent?",
      options: [
        "One complete cyclic period of population boom and bust",
        "A permanent extinction event",
        "A system undergoing chaotic turbulence",
        "Zero interaction between species",
      ],
      answerIndex: 0,
      explanation: "Tracing one full closed orbit in phase space corresponds to one full temporal oscillation cycle of both populations.",
    },
    {
      question: "What happens to the phase orbit if the initial predator population is set much higher?",
      options: [
        "The orbit becomes wider, driving prey closer to zero before recovering",
        "The orbit shrinks into a stationary point immediately",
        "The prey population multiplies without bound",
        "The equations collapse into linear growth",
      ],
      answerIndex: 0,
      explanation: "Larger deviations from the equilibrium point generate wider orbits with extreme minimum populations.",
    },
    {
      question: "What is the equilibrium prey population (where predator population remains constant)?",
      options: [
        "gamma / delta (death rate divided by conversion efficiency)",
        "alpha * beta",
        "Zero",
        "Infinite",
      ],
      answerIndex: 0,
      explanation: "Setting dPredator/dt = 0 yields (delta * Prey - gamma) * Predator = 0, so Prey_eq = gamma / delta.",
    },
  ],
};

export const odePhaseCode = `
// Archetype Exemplar: Lotka-Volterra Predator-Prey (ODE Phase)
const sim = {
  init(params, rng) {
    // Start slightly perturbed from equilibrium point for clean cycle
    const eqPrey = params.predatorMortality / params.predatorEfficiency;
    const eqPred = params.preyGrowth / params.predationRate;

    return {
      prey: eqPrey * 1.3,
      predator: eqPred * 0.8,
      history: [],
      phaseHistory: [],
      time: 0
    };
  },

  step(state, params, dt, rng) {
    // Derivatives function for Lotka-Volterra
    function derivatives(p, f) {
      const dp = params.preyGrowth * p - params.predationRate * p * f;
      const df = params.predatorEfficiency * p * f - params.predatorMortality * f;
      return [dp, df];
    }

    // Runge-Kutta 4th Order (RK4) for high precision ODE integration
    const [k1p, k1f] = derivatives(state.prey, state.predator);
    const [k2p, k2f] = derivatives(
      state.prey + 0.5 * dt * k1p,
      state.predator + 0.5 * dt * k1f
    );
    const [k3p, k3f] = derivatives(
      state.prey + 0.5 * dt * k2p,
      state.predator + 0.5 * dt * k2f
    );
    const [k4p, k4f] = derivatives(
      state.prey + dt * k3p,
      state.predator + dt * k3f
    );

    state.prey += (dt / 6) * (k1p + 2 * k2p + 2 * k3p + k4p);
    state.predator += (dt / 6) * (k1f + 2 * k2f + 2 * k3f + k4f);

    // Keep populations positive
    state.prey = Math.max(0.1, state.prey);
    state.predator = Math.max(0.1, state.predator);
    state.time += dt;

    // Record time history
    state.history.push({ t: state.time, prey: state.prey, predator: state.predator });
    if (state.history.length > 300) state.history.shift();

    // Record 2D phase portrait history
    state.phaseHistory.push({ x: state.prey, y: state.predator });
    if (state.phaseHistory.length > 400) state.phaseHistory.shift();

    return state;
  },

  metrics(state, params) {
    return {
      prey: state.prey,
      predator: state.predator
    };
  },

  draw(ctx, state, params, view) {
    SimKit.grid(ctx, view, { step: 40, color: "rgba(214, 198, 165, 0.2)" });

    const midX = view.width * 0.52;
    const padding = 50;

    // === LEFT PANEL: Time-Series Waves ===
    const timeWidth = midX - padding * 1.5;
    const timeHeight = view.height - padding * 2;
    const maxVal = Math.max(120, state.prey * 1.4, state.predator * 1.4);

    // Border container
    ctx.strokeStyle = "#2B2824";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(padding, padding, timeWidth, timeHeight);

    SimKit.text(ctx, "Populations Over Time", padding + 10, padding - 15, { size: 14, font: "bold sans-serif" });

    // Draw prey time series (cyan)
    if (state.history.length > 1) {
      ctx.strokeStyle = SimKit.palette[1]; // cyan
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < state.history.length; i++) {
        const pt = state.history[i];
        const px = padding + (i / 300) * timeWidth;
        const py = padding + timeHeight - (pt.prey / maxVal) * timeHeight;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Draw predator time series (rose)
      ctx.strokeStyle = SimKit.palette[6]; // rose
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < state.history.length; i++) {
        const pt = state.history[i];
        const px = padding + (i / 300) * timeWidth;
        const py = padding + timeHeight - (pt.predator / maxVal) * timeHeight;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Legend
    SimKit.text(ctx, "- Prey (Rabbits): " + state.prey.toFixed(1), padding + 15, padding + 25, { color: SimKit.palette[1], size: 13, font: "bold monospace" });
    SimKit.text(ctx, "- Predators (Foxes): " + state.predator.toFixed(1), padding + 15, padding + 45, { color: SimKit.palette[6], size: 13, font: "bold monospace" });

    // === RIGHT PANEL: Phase Portrait (Prey vs Predator) ===
    const phaseX = midX + 20;
    const phaseY = padding;
    const phaseSize = Math.min(view.width - phaseX - padding, timeHeight);

    ctx.strokeStyle = "#2B2824";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(phaseX, phaseY, phaseSize, phaseSize);

    SimKit.text(ctx, "Phase Portrait (Prey vs Predator Orbit)", phaseX + 10, phaseY - 15, { size: 14, font: "bold sans-serif" });

    // Phase orbit path
    if (state.phaseHistory.length > 1) {
      ctx.strokeStyle = SimKit.palette[8]; // purple
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < state.phaseHistory.length; i++) {
        const pt = state.phaseHistory[i];
        const px = phaseX + (pt.x / maxVal) * phaseSize;
        const py = phaseY + phaseSize - (pt.y / maxVal) * phaseSize;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Current operating point in phase space
    const curPx = phaseX + (state.prey / maxVal) * phaseSize;
    const curPy = phaseY + phaseSize - (state.predator / maxVal) * phaseSize;

    ctx.fillStyle = SimKit.palette[7]; // wine accent
    ctx.beginPath();
    ctx.arc(curPx, curPy, 6, 0, Math.PI * 2);
    ctx.fill();

    // Axis labels for Phase Portrait
    SimKit.text(ctx, "Prey Population ->", phaseX + phaseSize / 2, phaseY + phaseSize + 25, { align: "center", size: 12, color: "#2B2824" });
  }
};
`.trim();
