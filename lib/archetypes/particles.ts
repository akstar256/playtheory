import { SimSpec } from "@/lib/schemas/simSpec";

export const particlesSpec: SimSpec = {
  schemaVersion: 1,
  safety: { allowed: true },
  title: "Projectile Motion with Aerodynamic Drag",
  concept: "projectile motion with air drag and crosswind",
  level: "intermediate",
  archetype: "particles",
  coreIdea: "Trajectories in atmosphere deviate from classical parabolas as quadratic drag and wind alter acceleration dynamically.",
  learningObjectives: [
    "Observe how air drag skews parabolic trajectories into asymmetric curves",
    "Identify how launch angle shifts below 45 degrees for maximum range in atmosphere",
    "Analyze the terminal velocity effect on horizontal and vertical momentum",
  ],
  stateVariables: [
    { id: "x", name: "Horizontal Position", unit: "m", description: "Distance traveled downrange" },
    { id: "y", name: "Vertical Position", unit: "m", description: "Altitude above ground level" },
    { id: "vx", name: "Horizontal Velocity", unit: "m/s", description: "Velocity component parallel to ground" },
    { id: "vy", name: "Vertical Velocity", unit: "m/s", description: "Velocity component perpendicular to ground" },
    { id: "speed", name: "Instantaneous Speed", unit: "m/s", description: "Magnitude of total velocity vector" },
  ],
  parameters: [
    {
      id: "launchAngle",
      label: "Launch Angle",
      min: 15,
      max: 80,
      step: 1,
      default: 45,
      unit: "°",
      description: "Initial angle of elevation from ground",
      effectHint: "Lower angles yield flatter, faster arcs; higher angles loft the projectile.",
    },
    {
      id: "launchSpeed",
      label: "Launch Speed",
      min: 15,
      max: 70,
      step: 1,
      default: 40,
      unit: "m/s",
      description: "Muzzle velocity of the particle",
      effectHint: "Directly increases initial kinetic energy and peak altitude.",
    },
    {
      id: "gravity",
      label: "Gravity",
      min: 2,
      max: 20,
      step: 0.5,
      default: 9.8,
      unit: "m/s²",
      description: "Downward gravitational acceleration",
      effectHint: "Higher gravity forces projectile down faster, shortening flight time.",
    },
    {
      id: "dragCoeff",
      label: "Air Drag",
      min: 0,
      max: 0.08,
      step: 0.005,
      default: 0.02,
      unit: "1/m",
      description: "Quadratic drag coefficient per unit mass",
      effectHint: "Higher drag causes steep terminal descent and asymmetric trajectories.",
    },
    {
      id: "windSpeed",
      label: "Horizontal Wind",
      min: -20,
      max: 20,
      step: 1,
      default: 0,
      unit: "m/s",
      description: "Tailwind (positive) or headwind (negative)",
      effectHint: "Headwind compresses range; tailwind carries the particle further.",
    },
  ],
  dynamics: "Motion governed by gravity and quadratic air resistance relative to wind: ax = -dragCoeff * |v_rel| * (vx - wind); ay = -gravity - dragCoeff * |v_rel| * vy. Particle resets upon hitting ground level.",
  visual: {
    canvasDescription: "Cannon on the left firing particles with persistent trail ribbons, ground grid, and velocity vectors.",
    encodings: [
      "trajectory trail = past positions faded by age",
      "arrow = instantaneous velocity vector",
      "red marker = peak altitude apex",
    ],
    plots: [
      {
        id: "altitude_plot",
        title: "Altitude vs Time",
        series: [
          { metricKey: "altitude", label: "Altitude (m)" },
          { metricKey: "range", label: "Range (m)" },
        ],
      },
      {
        id: "speed_plot",
        title: "Instantaneous Speed",
        series: [{ metricKey: "speed", label: "Speed (m/s)" }],
      },
    ],
  },
  presets: [
    {
      name: "Ideal Vacuum Parabola",
      description: "Zero air resistance, showing perfect symmetric parabolic motion.",
      params: { launchAngle: 45, launchSpeed: 40, gravity: 9.8, dragCoeff: 0, windSpeed: 0 },
      observe: "Peak occurs exactly halfway through horizontal flight distance.",
    },
    {
      name: "High Drag Loft",
      description: "Dense air resistance causing steep drops at the end of trajectory.",
      params: { launchAngle: 60, launchSpeed: 55, gravity: 9.8, dragCoeff: 0.06, windSpeed: 0 },
      observe: "Notice the teardrop asymmetry where the descent is noticeably steeper than ascent.",
    },
    {
      name: "Gale Headwind",
      description: "Heavy opposing headwind reversing horizontal momentum.",
      params: { launchAngle: 70, launchSpeed: 45, gravity: 9.8, dragCoeff: 0.03, windSpeed: -15 },
      observe: "The projectile is blown backwards before touching down.",
    },
  ],
  misconceptions: [
    {
      wrong: "The optimal launch angle in air is always 45 degrees.",
      right: "Because air drag increases with distance traveled, the optimal angle in atmosphere drops to between 35° and 42°.",
    },
    {
      wrong: "Air resistance only affects the vertical descent.",
      right: "Air resistance opposes relative velocity in both axes, dampening forward kinetic energy continuously.",
    },
  ],
  quiz: [
    {
      question: "Why is the optimal launch angle for maximum distance less than 45° with air drag?",
      options: [
        "A lower trajectory spends less total time traveling through resisting air",
        "Gravity pulls harder at steeper angles",
        "Wind only acts on objects above 100 meters",
        "Horizontal velocity is unaffected by atmospheric drag",
      ],
      answerIndex: 0,
      explanation: "A flatter angle reduces total path length and flight duration, minimizing cumulative drag losses.",
    },
    {
      question: "What happens to the projectile's descent angle when air drag is significant?",
      options: [
        "It becomes steeper than the launch angle",
        "It becomes shallower than the launch angle",
        "It remains strictly equal to the launch angle",
        "The projectile hovers horizontally",
      ],
      answerIndex: 0,
      explanation: "Horizontal velocity bleeds away faster than gravity accelerates the descent, causing near-vertical touchdown.",
    },
    {
      question: "If wind speed matches the horizontal projectile speed exactly, what is the horizontal drag force?",
      options: [
        "Zero horizontal drag",
        "Twice the normal drag",
        "Infinite drag",
        "Negative drag accelerating the projectile",
      ],
      answerIndex: 0,
      explanation: "Drag depends strictly on relative airspeed. If relative horizontal velocity is zero, horizontal drag vanishes.",
    },
    {
      question: "Which parameter change will increase flight duration the most?",
      options: [
        "Increasing launch angle and launch speed with lower gravity",
        "Increasing drag coefficient",
        "Increasing negative headwind",
        "Increasing gravity",
      ],
      answerIndex: 0,
      explanation: "High initial vertical speed combined with weaker gravity directly maximizes airborne time.",
    },
  ],
};

export const particlesCode = `
// Archetype Exemplar: Particles with Aerodynamic Drag
const sim = {
  init(params, rng) {
    const angleRad = (params.launchAngle * Math.PI) / 180;
    const v0 = params.launchSpeed;
    return {
      x: 0,
      y: 0,
      vx: v0 * Math.cos(angleRad),
      vy: v0 * Math.sin(angleRad),
      trail: [],
      maxAltitude: 0,
      landed: false,
      timer: 0,
      timeOfFlight: 0
    };
  },

  step(state, params, dt, rng) {
    state.timer += dt;
    if (state.landed) {
      if (state.timer > 1.2) {
        // Reset projectile after brief pause at impact
        const angleRad = (params.launchAngle * Math.PI) / 180;
        const v0 = params.launchSpeed;
        state.x = 0;
        state.y = 0;
        state.vx = v0 * Math.cos(angleRad);
        state.vy = v0 * Math.sin(angleRad);
        state.trail = [];
        state.maxAltitude = 0;
        state.landed = false;
        state.timer = 0;
      }
      return state;
    }

    // Relative airspeed accounting for horizontal wind
    const relVx = state.vx - params.windSpeed;
    const relVy = state.vy;
    const relSpeed = Math.sqrt(relVx * relVx + relVy * relVy);

    // Drag force per unit mass: F_drag = -c * |v_rel| * v_rel
    const ax = -params.dragCoeff * relSpeed * relVx;
    const ay = -params.gravity - params.dragCoeff * relSpeed * relVy;

    // Euler-Cromer integration for numerical stability
    state.vx += ax * dt;
    state.vy += ay * dt;
    state.x += state.vx * dt;
    state.y += state.vy * dt;

    if (state.y > state.maxAltitude) {
      state.maxAltitude = state.y;
    }

    // Record trail positions every few steps
    if (state.trail.length === 0 || SimKit.vec2.dist(state.trail[state.trail.length - 1], { x: state.x, y: state.y }) > 1.5) {
      state.trail.push({ x: state.x, y: state.y });
      if (state.trail.length > 250) state.trail.shift();
    }

    // Ground impact check
    if (state.y <= 0 && state.timer > 0.05) {
      state.y = 0;
      state.landed = true;
      state.timeOfFlight = state.timer;
      state.timer = 0;
    }

    return state;
  },

  metrics(state, params) {
    const curSpeed = Math.sqrt(state.vx * state.vx + state.vy * state.vy);
    return {
      altitude: Math.max(0, state.y),
      range: Math.max(0, state.x),
      speed: curSpeed,
      maxAlt: state.maxAltitude
    };
  },

  draw(ctx, state, params, view) {
    // Coordinate mapping: real meters -> canvas pixels
    const originX = 80;
    const originY = view.height - 80;
    const scale = 3.6; // pixels per meter

    // Draw background grid
    SimKit.grid(ctx, view, { step: 40, color: "rgba(214, 198, 165, 0.2)" });

    // Ground line
    ctx.strokeStyle = "#2B2824";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(view.width, originY);
    ctx.stroke();

    // Grass / Ground hatch
    ctx.fillStyle = "rgba(17, 119, 51, 0.1)";
    ctx.fillRect(0, originY, view.width, view.height - originY);

    // Draw trajectory trail
    if (state.trail.length > 1) {
      ctx.strokeStyle = SimKit.palette[6]; // rose accent
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (let i = 0; i < state.trail.length; i++) {
        const pt = state.trail[i];
        const px = originX + pt.x * scale;
        const py = originY - pt.y * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Cannon mount
    ctx.save();
    ctx.translate(originX, originY);
    ctx.fillStyle = "#2B2824";
    ctx.beginPath();
    ctx.arc(0, 0, 16, Math.PI, 0);
    ctx.fill();

    // Cannon barrel oriented to launch angle
    const angleRad = (params.launchAngle * Math.PI) / 180;
    const barrelLen = 32;
    ctx.strokeStyle = "#181715";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(barrelLen * Math.cos(angleRad), -barrelLen * Math.sin(angleRad));
    ctx.stroke();
    ctx.restore();

    // Draw projectile
    const projPx = originX + state.x * scale;
    const projPy = originY - state.y * scale;

    ctx.fillStyle = SimKit.palette[0]; // indigo
    ctx.beginPath();
    ctx.arc(projPx, projPy, 7, 0, Math.PI * 2);
    ctx.fill();

    // Velocity vector arrow
    const vMag = Math.sqrt(state.vx * state.vx + state.vy * state.vy);
    if (vMag > 0.5 && !state.landed) {
      const vScale = 1.2;
      SimKit.arrow(
        ctx,
        projPx,
        projPy,
        projPx + state.vx * vScale,
        projPy - state.vy * vScale,
        { color: SimKit.palette[1], width: 2, headLength: 8 }
      );
    }

    // Telemetry HUD overlay
    SimKit.text(ctx, "Range: " + state.x.toFixed(1) + " m", 30, 40, { size: 14, color: "#181715", font: "monospace" });
    SimKit.text(ctx, "Altitude: " + state.y.toFixed(1) + " m", 30, 60, { size: 14, color: "#181715", font: "monospace" });
    SimKit.text(ctx, "Apex: " + state.maxAltitude.toFixed(1) + " m", 30, 80, { size: 14, color: "#181715", font: "monospace" });

    if (params.windSpeed !== 0) {
      const windDir = params.windSpeed > 0 ? "Tailwind ->" : "<- Headwind";
      SimKit.text(ctx, "Wind: " + Math.abs(params.windSpeed) + " m/s " + windDir, 30, 105, { size: 13, color: SimKit.palette[7] });
    }
  }
};
`.trim();
