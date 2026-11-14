import { SimSpec } from "@/lib/schemas/simSpec";

export const agentsSpec: SimSpec = {
  schemaVersion: 1,
  safety: { allowed: true },
  title: "Epidemic Spread & Herd Immunity (SIR Agent Model)",
  concept: "epidemic SIR infection dynamics and transmission probability",
  level: "intermediate",
  archetype: "agents",
  coreIdea: "Discrete interacting agents transmit pathogens upon spatial contact, illustrating exponential outbreak phases and herd immunity thresholds.",
  learningObjectives: [
    "Observe exponential infection growth when susceptible population density is high",
    "Identify how social distancing and mobility reductions flatten the infection peak",
    "Analyze how accumulation of recovered immune agents starves the pathogen of transmission chains",
  ],
  stateVariables: [
    { id: "susceptible", name: "Susceptible Count", unit: "agents", description: "Healthy individuals vulnerable to infection" },
    { id: "infected", name: "Infected Count", unit: "agents", description: "Contagious active pathogen carriers" },
    { id: "recovered", name: "Recovered Count", unit: "agents", description: "Immune or cleared individuals" },
    { id: "peakInfected", name: "Peak Infection Burden", unit: "agents", description: "Maximum concurrent active infections" },
  ],
  parameters: [
    {
      id: "infectionRadius",
      label: "Transmission Radius",
      min: 10,
      max: 45,
      step: 1,
      default: 24,
      unit: "px",
      description: "Airborne or direct contact proximity required for potential transmission",
      effectHint: "Larger radius expands transmission opportunity per encounter.",
    },
    {
      id: "transmissionProb",
      label: "Infection Probability",
      min: 0.1,
      max: 0.9,
      step: 0.05,
      default: 0.45,
      unit: "chance",
      description: "Probability of transmitting infection per contact per second",
      effectHint: "Higher probability sharply accelerates the exponential growth phase.",
    },
    {
      id: "recoveryDuration",
      label: "Recovery Duration",
      min: 3,
      max: 15,
      step: 0.5,
      default: 7.0,
      unit: "s",
      description: "Mean duration an agent remains actively contagious before recovery",
      effectHint: "Longer illness keeps carriers in circulation longer, raising total infections.",
    },
    {
      id: "socialDistancing",
      label: "Social Distancing",
      min: 0,
      max: 0.8,
      step: 0.05,
      default: 0.2,
      unit: "fraction",
      description: "Fraction of the population that remains stationary",
      effectHint: "Freezes agents in place, breaking long-distance transmission chains.",
    },
  ],
  dynamics: "80 agents move inside a bounded box. When an infected agent enters the transmission radius of a susceptible agent, infection occurs with probability proportional to contact time. Infected agents transition to immune recovered state after recovery duration.",
  visual: {
    canvasDescription: "Arena of 80 bouncing agents with colored halo glows indicating status: teal for susceptible, red for infected, amber for recovered.",
    encodings: [
      "teal dot = susceptible agent",
      "red pulsing dot = actively infectious agent",
      "amber dot = recovered / immune agent",
    ],
    plots: [
      {
        id: "sir_plot",
        title: "SIR Population Curves",
        series: [
          { metricKey: "susceptible", label: "Susceptible" },
          { metricKey: "infected", label: "Infected" },
          { metricKey: "recovered", label: "Recovered" },
        ],
      },
    ],
  },
  presets: [
    {
      name: "Unmitigated Outbreak",
      description: "High mobility and zero distancing causing a rapid spike that exhausts susceptibles.",
      params: { infectionRadius: 30, transmissionProb: 0.6, recoveryDuration: 8.0, socialDistancing: 0 },
      observe: "Infection curve spikes sharply, infecting nearly 100% of the population.",
    },
    {
      name: "Flatten the Curve",
      description: "60% social distancing significantly reduces contact frequency.",
      params: { infectionRadius: 22, transmissionProb: 0.35, recoveryDuration: 6.0, socialDistancing: 0.6 },
      observe: "Peak active infections stay low, spreading recovery over a longer time horizon.",
    },
    {
      name: "Rapid Recovery Containment",
      description: "Short contagious window allowing localized clusters to burn out quickly.",
      params: { infectionRadius: 18, transmissionProb: 0.3, recoveryDuration: 3.5, socialDistancing: 0.3 },
      observe: "The disease dies out before reaching widespread community transmission.",
    },
  ],
  misconceptions: [
    {
      wrong: "Social distancing only delays the inevitable total infection count without changing the peak.",
      right: "Social distancing directly flattens the peak and can keep the effective reproduction number below 1, sparing many from infection entirely.",
    },
    {
      wrong: "An epidemic stops only when 100% of the population becomes infected.",
      right: "An outbreak halts when the proportion of immune individuals exceeds the herd immunity threshold (1 - 1/R0).",
    },
  ],
  quiz: [
    {
      question: "What causes the active infection curve to peak and start declining?",
      options: [
        "The pool of susceptible individuals drops below the replacement threshold",
        "The virus runs out of energy to move between agents",
        "All infected agents leave the arena",
        "Temperature in the simulation increases",
      ],
      answerIndex: 0,
      explanation: "When infected agents interact predominantly with already-recovered or immune agents, each carrier infects fewer than 1 new person.",
    },
    {
      question: "How does increasing social distancing help contain the disease?",
      options: [
        "It reduces the spatial contact rate between contagious carriers and healthy agents",
        "It strengthens the biological immune response of healthy agents",
        "It shortens the biological recovery duration",
        "It destroys the pathogen on contact",
      ],
      answerIndex: 0,
      explanation: "Freezing agents reduces collision and proximity frequency across space, dampening transmission velocity.",
    },
    {
      question: "If an agent is 'Recovered' in the SIR model, what is its status?",
      options: [
        "Permanently immune and cannot be reinfected or transmit the disease",
        "Vulnerable to immediate reinfection",
        "Still contagious for 24 hours",
        "Removed from the simulation arena entirely",
      ],
      answerIndex: 0,
      explanation: "In standard SIR dynamics, recovered individuals possess sterile immunity that shields them and blocks transmission chains.",
    },
    {
      question: "What is R0 (the basic reproduction number)?",
      options: [
        "The expected number of secondary infections generated by one carrier in a fully susceptible population",
        "The initial recovery rate in percent",
        "The total radius of the arena in meters",
        "The number of days an epidemic lasts",
      ],
      answerIndex: 0,
      explanation: "R0 quantifies transmissibility; an epidemic expands exponentially when R0 > 1 and declines when R0 < 1.",
    },
  ],
};

export const agentsCode = `
// Archetype Exemplar: Epidemic SIR Model (Interacting Agents)
const sim = {
  init(params, rng) {
    const TOTAL_AGENTS = 75;
    const agents = [];

    // Initialize agents randomly across arena
    for (let i = 0; i < TOTAL_AGENTS; i++) {
      const isStationary = rng() < params.socialDistancing;
      const speed = isStationary ? 0 : 35 + rng() * 30;
      const angle = rng() * Math.PI * 2;

      agents.push({
        x: 40 + rng() * 480,
        y: 40 + rng() * 480,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        status: i === 0 ? "I" : "S", // Agent 0 starts infected
        infectedTimer: i === 0 ? 0 : 0
      });
    }

    return {
      agents: agents,
      time: 0,
      susceptible: TOTAL_AGENTS - 1,
      infected: 1,
      recovered: 0,
      peakInfected: 1
    };
  },

  step(state, params, dt, rng) {
    state.time += dt;
    const arenaLeft = 40;
    const arenaTop = 60;
    const arenaSize = 480;
    const arenaRight = arenaLeft + arenaSize;
    const arenaBottom = arenaTop + arenaSize;

    let sCount = 0;
    let iCount = 0;
    let rCount = 0;

    // 1. Move agents & bounce off arena walls
    for (let i = 0; i < state.agents.length; i++) {
      const a = state.agents[i];

      a.x += a.vx * dt;
      a.y += a.vy * dt;

      if (a.x < arenaLeft) { a.x = arenaLeft; a.vx = -a.vx; }
      else if (a.x > arenaRight) { a.x = arenaRight; a.vx = -a.vx; }

      if (a.y < arenaTop) { a.y = arenaTop; a.vy = -a.vy; }
      else if (a.y > arenaBottom) { a.y = arenaBottom; a.vy = -a.vy; }

      // Infection recovery countdown
      if (a.status === "I") {
        a.infectedTimer += dt;
        if (a.infectedTimer >= params.recoveryDuration) {
          a.status = "R";
        }
      }

      if (a.status === "S") sCount++;
      else if (a.status === "I") iCount++;
      else if (a.status === "R") rCount++;
    }

    // 2. Spatial transmission check
    const radSq = params.infectionRadius * params.infectionRadius;
    const probPerSec = params.transmissionProb;

    for (let i = 0; i < state.agents.length; i++) {
      const a = state.agents[i];
      if (a.status !== "I") continue;

      for (let j = 0; j < state.agents.length; j++) {
        if (i === j) continue;
        const b = state.agents[j];
        if (b.status !== "S") continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < radSq) {
          // Transmission probability scaled by dt
          if (rng() < probPerSec * dt * 2.5) {
            b.status = "I";
            b.infectedTimer = 0;
            sCount--;
            iCount++;
          }
        }
      }
    }

    state.susceptible = sCount;
    state.infected = iCount;
    state.recovered = rCount;
    if (iCount > state.peakInfected) {
      state.peakInfected = iCount;
    }

    return state;
  },

  metrics(state, params) {
    return {
      susceptible: state.susceptible,
      infected: state.infected,
      recovered: state.recovered,
      peak: state.peakInfected
    };
  },

  draw(ctx, state, params, view) {
    SimKit.grid(ctx, view, { step: 40, color: "rgba(214, 198, 165, 0.2)" });

    const arenaLeft = 40;
    const arenaTop = 60;
    const arenaSize = 480;

    // Arena boundary container
    ctx.strokeStyle = "#2B2824";
    ctx.lineWidth = 2;
    ctx.strokeRect(arenaLeft, arenaTop, arenaSize, arenaSize);

    // Header label
    SimKit.text(ctx, "Simulation Arena (80 Interacting Agents)", arenaLeft, arenaTop - 15, { size: 14, font: "bold sans-serif" });

    // Draw agents
    for (let i = 0; i < state.agents.length; i++) {
      const a = state.agents[i];

      let fillColor = SimKit.palette[2]; // Teal for Susceptible
      if (a.status === "I") fillColor = SimKit.palette[6]; // Rose / Red for Infected
      else if (a.status === "R") fillColor = SimKit.palette[5]; // Sand / Amber for Recovered

      // Draw transmission aura for infected carriers
      if (a.status === "I") {
        ctx.fillStyle = "rgba(204, 102, 119, 0.15)";
        ctx.beginPath();
        ctx.arc(a.x, a.y, params.infectionRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw agent particle
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.arc(a.x, a.y, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#181715";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // === RIGHT SIDE HUD & POPULATION METRICS ===
    const hudX = arenaLeft + arenaSize + 40;
    const hudY = arenaTop;
    const total = state.agents.length;

    SimKit.text(ctx, "Live Epidemiological Metrics", hudX, hudY + 15, { size: 16, font: "bold sans-serif" });

    // Metric Badges
    const sPct = ((state.susceptible / total) * 100).toFixed(0);
    const iPct = ((state.infected / total) * 100).toFixed(0);
    const rPct = ((state.recovered / total) * 100).toFixed(0);

    SimKit.text(ctx, "Susceptible: " + state.susceptible + " (" + sPct + "%)", hudX, hudY + 55, { size: 14, color: SimKit.palette[2], font: "bold monospace" });
    SimKit.text(ctx, "Infected: " + state.infected + " (" + iPct + "%)", hudX, hudY + 85, { size: 14, color: SimKit.palette[6], font: "bold monospace" });
    SimKit.text(ctx, "Recovered: " + state.recovered + " (" + rPct + "%)", hudX, hudY + 115, { size: 14, color: SimKit.palette[5], font: "bold monospace" });
    SimKit.text(ctx, "Peak Load: " + state.peakInfected + " concurrent", hudX, hudY + 155, { size: 13, color: "#181715", font: "monospace" });

    // Progress Bar showing proportion S / I / R
    const barWidth = 320;
    const barHeight = 24;
    const barY = hudY + 185;

    ctx.strokeRect(hudX, barY, barWidth, barHeight);

    let curX = hudX;
    const sWidth = (state.susceptible / total) * barWidth;
    const iWidth = (state.infected / total) * barWidth;
    const rWidth = (state.recovered / total) * barWidth;

    ctx.fillStyle = SimKit.palette[2];
    ctx.fillRect(curX, barY, sWidth, barHeight);
    curX += sWidth;

    ctx.fillStyle = SimKit.palette[6];
    ctx.fillRect(curX, barY, iWidth, barHeight);
    curX += iWidth;

    ctx.fillStyle = SimKit.palette[5];
    ctx.fillRect(curX, barY, rWidth, barHeight);

    // Tip Box
    ctx.fillStyle = "rgba(234, 222, 202, 0.4)";
    ctx.fillRect(hudX, barY + 50, barWidth, 120);
    ctx.strokeStyle = "#D6C6A5";
    ctx.strokeRect(hudX, barY + 50, barWidth, 120);

    SimKit.text(ctx, "Key Insight:", hudX + 15, barY + 75, { size: 12, font: "bold sans-serif" });
    SimKit.text(ctx, "When active cases hit zero, herd", hudX + 15, barY + 98, { size: 12 });
    SimKit.text(ctx, "immunity has successfully severed", hudX + 15, barY + 118, { size: 12 });
    SimKit.text(ctx, "all active transmission chains.", hudX + 15, barY + 138, { size: 12 });
  }
};
`.trim();
