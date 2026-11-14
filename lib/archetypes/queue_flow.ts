import { SimSpec } from "@/lib/schemas/simSpec";

export const queueFlowSpec: SimSpec = {
  schemaVersion: 1,
  safety: { allowed: true },
  title: "M/M/1 Queue Dynamics & Server Utilization",
  concept: "queueing theory, arrival rate, service rate, and buffer congestion",
  level: "intermediate",
  archetype: "queue_flow",
  coreIdea: "As server utilization approaches 100%, queue lengths and waiting delays grow asymptotically non-linear rather than linear.",
  learningObjectives: [
    "Observe non-linear delay explosions when arrival rate nears service rate",
    "Identify how buffer capacity truncates backpressure and causes packet drops",
    "Calculate utilization rho = lambda / mu and compare against steady-state theory",
  ],
  stateVariables: [
    { id: "queueLength", name: "Queue Depth", unit: "items", description: "Count of items currently waiting in buffer" },
    { id: "utilization", name: "Server Utilization", unit: "%", description: "Percentage of time server is busy" },
    { id: "droppedCount", name: "Dropped Items", unit: "items", description: "Total items rejected due to full buffer" },
  ],
  parameters: [
    {
      id: "arrivalRate",
      label: "Arrival Rate (lambda)",
      min: 1,
      max: 12,
      step: 0.5,
      default: 5,
      unit: "req/s",
      description: "Mean rate of incoming requests",
      effectHint: "Higher arrivals load the server.",
    },
    {
      id: "serviceRate",
      label: "Service Rate (mu)",
      min: 2,
      max: 14,
      step: 0.5,
      default: 7,
      unit: "req/s",
      description: "Mean processing capacity of the server",
      effectHint: "Higher service speed clears the queue faster.",
    },
    {
      id: "bufferCapacity",
      label: "Buffer Limit",
      min: 5,
      max: 40,
      step: 1,
      default: 20,
      unit: "slots",
      description: "Maximum queue length before drops occur",
      effectHint: "Small buffer causes drops; large buffer causes high latency.",
    },
  ],
  dynamics: "Poisson arrivals with rate lambda; exponential service times with rate mu. Items wait in FIFO queue; items arriving to a full buffer are dropped.",
  visual: {
    canvasDescription: "Conveyor belt flow with incoming packet dots queueing before a central processor.",
    encodings: [
      "blue dots = waiting queue items",
      "green box = active server",
      "red flash = dropped packet",
    ],
    plots: [
      {
        id: "queue_plot",
        title: "Queue Length vs Time",
        series: [{ metricKey: "queueDepth", label: "Queue Length" }],
      },
    ],
  },
  presets: [
    {
      name: "Light Load (50% Util)",
      description: "Arrivals well below service capacity; near zero waiting time.",
      params: { arrivalRate: 4, serviceRate: 8, bufferCapacity: 20 },
      observe: "Queue remains almost empty with instant processing.",
    },
    {
      name: "Near Saturation (90% Util)",
      description: "Arrivals just below service capacity; high buffer variance.",
      params: { arrivalRate: 7.2, serviceRate: 8, bufferCapacity: 30 },
      observe: "Buffer length oscillates heavily and builds substantial backlogs.",
    },
  ],
  misconceptions: [
    {
      wrong: "If arrival rate is 95% of service capacity, average wait time is only 5% longer.",
      right: "Because of arrival variance, queue depth is proportional to rho/(1-rho), so at 95% utilization average delay is 19x higher than baseline.",
    },
  ],
  quiz: [
    {
      question: "What happens in an M/M/1 queue when arrival rate exceeds service rate (rho > 1)?",
      options: [
        "Queue length grows indefinitely or until buffer capacity is reached",
        "Server speed automatically doubles",
        "Arrivals stop automatically",
        "Wait time stays constant",
      ],
      answerIndex: 0,
      explanation: "When arrival rate exceeds service rate, the system is unstable and the queue overflows.",
    },
  ],
};

export const queueFlowCode = `
// Archetype Exemplar: M/M/1 Queue Flow
const sim = {
  init(params, rng) {
    const initialItems = Math.min(3, Math.floor(params.bufferCapacity / 2));
    const items = [];
    for (let i = 0; i < initialItems; i++) {
      items.push({ id: i + 1, wait: 0 });
    }
    return {
      queueLength: initialItems,
      items: items,
      serverBusy: true,
      serverTimeRemaining: 1.0 / params.serviceRate,
      totalServed: 0,
      totalDropped: 0,
      busyTime: 0,
      totalTime: 0,
      arrivalAccumulator: 0
    };
  },

  step(state, params, dt, rng) {
    state.totalTime += dt;

    // Accumulate arrivals based on arrivalRate
    state.arrivalAccumulator += params.arrivalRate * dt;
    while (state.arrivalAccumulator >= 1.0) {
      state.arrivalAccumulator -= 1.0;
      if (state.queueLength < params.bufferCapacity) {
        state.queueLength++;
        state.items.push({ id: state.totalServed + state.queueLength, wait: 0 });
      } else {
        state.totalDropped++;
      }
    }

    // Server processing
    if (state.serverBusy) {
      state.busyTime += dt;
      state.serverTimeRemaining -= dt;
      if (state.serverTimeRemaining <= 0) {
        state.serverBusy = false;
        state.totalServed++;
      }
    }

    // Pull next item if server is free
    if (!state.serverBusy && state.queueLength > 0) {
      state.queueLength--;
      state.items.shift();
      state.serverBusy = true;
      const jitter = 0.5 + 0.5 * (rng ? rng() : 0.5);
      state.serverTimeRemaining = jitter / params.serviceRate;
    }

    return state;
  },

  metrics(state, params) {
    return {
      queueDepth: state.queueLength,
      utilization: state.totalTime > 0 ? Math.min(100, (state.busyTime / state.totalTime) * 100) : 0,
      bufferUtilization: (state.queueLength / Math.max(1, params.bufferCapacity)) * 100,
      drops: state.totalDropped
    };
  },

  draw(ctx, state, params, view) {
    SimKit.grid(ctx, view, { step: 40, color: "rgba(214, 198, 165, 0.2)" });

    const centerY = view.height * 0.45;
    const serverX = view.width - 200;
    const bufferStartX = 100;
    const bufferWidth = serverX - bufferStartX - 40;

    // Buffer container
    ctx.strokeStyle = "#2B2824";
    ctx.lineWidth = 2;
    ctx.strokeRect(bufferStartX, centerY - 30, bufferWidth, 60);

    // Queue slots
    const slotW = bufferWidth / Math.max(1, params.bufferCapacity);
    ctx.strokeStyle = "rgba(214, 198, 165, 0.5)";
    ctx.lineWidth = 1;
    for (let i = 1; i < params.bufferCapacity; i++) {
      ctx.beginPath();
      ctx.moveTo(bufferStartX + i * slotW, centerY - 30);
      ctx.lineTo(bufferStartX + i * slotW, centerY + 30);
      ctx.stroke();
    }

    // Draw waiting items
    ctx.fillStyle = SimKit.palette[1]; // cyan
    for (let i = 0; i < state.queueLength; i++) {
      const px = serverX - 40 - (i + 0.5) * slotW;
      ctx.beginPath();
      ctx.arc(px, centerY, Math.min(12, slotW * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw server box
    ctx.fillStyle = state.serverBusy ? SimKit.palette[3] : "rgba(17, 119, 51, 0.2)"; // green
    ctx.strokeStyle = "#181715";
    ctx.lineWidth = 2;
    ctx.fillRect(serverX, centerY - 35, 70, 70);
    ctx.strokeRect(serverX, centerY - 35, 70, 70);

    SimKit.text(ctx, state.serverBusy ? "BUSY" : "IDLE", serverX + 35, centerY + 5, {
      align: "center",
      size: 13,
      font: "bold monospace",
      color: state.serverBusy ? "#FFFFFF" : "#181715"
    });

    // Header & HUD
    SimKit.text(ctx, "M/M/1 Server Pipeline • Capacity: " + params.bufferCapacity, bufferStartX, centerY - 50, { size: 14, font: "bold sans-serif" });
    SimKit.text(ctx, "Waiting in Buffer: " + state.queueLength, bufferStartX, centerY + 60, { size: 13, font: "bold monospace" });
    SimKit.text(ctx, "Total Served: " + state.totalServed + " | Dropped: " + state.totalDropped, bufferStartX, centerY + 80, { size: 12, font: "monospace", color: state.totalDropped > 0 ? SimKit.palette[6] : "#78716C" });
  }
};
`.trim();
