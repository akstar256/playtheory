/**
 * SimKit — Host-provided mathematical, geometry, and canvas rendering utilities.
 * Injected globally into the simulation sandbox. Read-only and deterministic.
 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewContext {
  width: number;
  height: number;
  t: number;
}

export interface TextOptions {
  color?: string;
  size?: number;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  font?: string;
}

export interface ArrowOptions {
  color?: string;
  width?: number;
  headLength?: number;
  headAngle?: number;
}

export interface GridOptions {
  step?: number;
  color?: string;
  lineWidth?: number;
}

export interface AxesOptions {
  color?: string;
  lineWidth?: number;
  xLabel?: string;
  yLabel?: string;
  tickCount?: number;
}

export const SimKit = {
  // Math utilities
  clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  },

  lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  },

  map(val: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    if (Math.abs(inMax - inMin) < 1e-9) return outMin;
    const norm = (val - inMin) / (inMax - inMin);
    return outMin + norm * (outMax - outMin);
  },

  // Colorblind-safe Tol / Okabe-Ito palette
  palette: [
    "#332288", // indigo
    "#88CCEE", // cyan
    "#44AA99", // teal
    "#117733", // green
    "#999933", // olive
    "#DDCC77", // sand
    "#CC6677", // rose
    "#882255", // wine
    "#AA4499", // purple
  ],

  // 2D Vector math
  vec2: {
    create(x: number = 0, y: number = 0): Vec2 {
      return { x, y };
    },
    add(a: Vec2, b: Vec2): Vec2 {
      return { x: a.x + b.x, y: a.y + b.y };
    },
    sub(a: Vec2, b: Vec2): Vec2 {
      return { x: a.x - b.x, y: a.y - b.y };
    },
    scale(v: Vec2, s: number): Vec2 {
      return { x: v.x * s, y: v.y * s };
    },
    dot(a: Vec2, b: Vec2): number {
      return a.x * b.x + a.y * b.y;
    },
    mag(v: Vec2): number {
      return Math.sqrt(v.x * v.x + v.y * v.y);
    },
    norm(v: Vec2): Vec2 {
      const m = Math.sqrt(v.x * v.x + v.y * v.y);
      return m > 1e-9 ? { x: v.x / m, y: v.y / m } : { x: 0, y: 0 };
    },
    dist(a: Vec2, b: Vec2): number {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.sqrt(dx * dx + dy * dy);
    },
  },

  // Gaussian random from uniform PRNG (Box-Muller transform)
  gaussian(rng: () => number, mean: number = 0, stdDev: number = 1): number {
    let u1 = rng();
    let u2 = rng();
    while (u1 <= 1e-9) u1 = rng();
    while (u2 <= 1e-9) u2 = rng();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdDev;
  },

  // Fast deterministic hash of state for reproducibility checks
  hash(state: unknown): number {
    const str = JSON.stringify(state);
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  },

  // Canvas drawing helpers
  text(
    ctx: CanvasRenderingContext2D,
    str: string,
    x: number,
    y: number,
    opts: TextOptions = {}
  ): void {
    ctx.save();
    ctx.fillStyle = opts.color || "#181715";
    ctx.font = `${opts.size || 14}px ${opts.font || "ui-sans-serif, system-ui, sans-serif"}`;
    ctx.textAlign = opts.align || "left";
    ctx.textBaseline = opts.baseline || "alphabetic";
    ctx.fillText(str, x, y);
    ctx.restore();
  },

  arrow(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    opts: ArrowOptions = {}
  ): void {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length < 1e-6) return;

    const angle = Math.atan2(dy, dx);
    const headLen = opts.headLength || 10;
    const headAngle = opts.headAngle || Math.PI / 6;

    ctx.save();
    ctx.strokeStyle = opts.color || "#181715";
    ctx.fillStyle = opts.color || "#181715";
    ctx.lineWidth = opts.width || 2;

    // Line shaft
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLen * Math.cos(angle - headAngle),
      y2 - headLen * Math.sin(angle - headAngle)
    );
    ctx.lineTo(
      x2 - headLen * Math.cos(angle + headAngle),
      y2 - headLen * Math.sin(angle + headAngle)
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  grid(
    ctx: CanvasRenderingContext2D,
    view: ViewContext,
    opts: GridOptions = {}
  ): void {
    const step = opts.step || 40;
    const color = opts.color || "rgba(214, 198, 165, 0.25)";
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = opts.lineWidth || 1;

    ctx.beginPath();
    for (let x = 0; x <= view.width; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, view.height);
    }
    for (let y = 0; y <= view.height; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(view.width, y);
    }
    ctx.stroke();
    ctx.restore();
  },

  axes(
    ctx: CanvasRenderingContext2D,
    rect: Rect,
    opts: AxesOptions = {}
  ): void {
    ctx.save();
    ctx.strokeStyle = opts.color || "#181715";
    ctx.lineWidth = opts.lineWidth || 2;

    // Y axis (left)
    ctx.beginPath();
    ctx.moveTo(rect.x, rect.y);
    ctx.lineTo(rect.x, rect.y + rect.height);
    // X axis (bottom)
    ctx.lineTo(rect.x + rect.width, rect.y + rect.height);
    ctx.stroke();

    // Labels
    if (opts.xLabel) {
      this.text(ctx, opts.xLabel, rect.x + rect.width / 2, rect.y + rect.height + 25, {
        align: "center",
        size: 12,
        color: opts.color,
      });
    }
    if (opts.yLabel) {
      ctx.save();
      ctx.translate(rect.x - 25, rect.y + rect.height / 2);
      ctx.rotate(-Math.PI / 2);
      this.text(ctx, opts.yLabel, 0, 0, {
        align: "center",
        size: 12,
        color: opts.color,
      });
      ctx.restore();
    }
    ctx.restore();
  },
};

/**
 * Serialized representation of SimKit string to inject into the sandboxed iframe srcdoc.
 */
export function getSimKitInjectionCode(): string {
  return `
const SimKit = {
  clamp(val, min, max) { return Math.max(min, Math.min(max, val)); },
  lerp(a, b, t) { return a + (b - a) * t; },
  map(val, inMin, inMax, outMin, outMax) {
    if (Math.abs(inMax - inMin) < 1e-9) return outMin;
    return outMin + ((val - inMin) / (inMax - inMin)) * (outMax - outMin);
  },
  palette: ["#332288", "#88CCEE", "#44AA99", "#117733", "#999933", "#DDCC77", "#CC6677", "#882255", "#AA4499"],
  vec2: {
    create(x = 0, y = 0) { return { x, y }; },
    add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; },
    sub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; },
    scale(v, s) { return { x: v.x * s, y: v.y * s }; },
    dot(a, b) { return a.x * b.x + a.y * b.y; },
    mag(v) { return Math.sqrt(v.x * v.x + v.y * v.y); },
    norm(v) { const m = Math.sqrt(v.x * v.x + v.y * v.y); return m > 1e-9 ? { x: v.x / m, y: v.y / m } : { x: 0, y: 0 }; },
    dist(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
  },
  gaussian(rng, mean = 0, stdDev = 1) {
    let u1 = rng(), u2 = rng();
    while (u1 <= 1e-9) u1 = rng();
    while (u2 <= 1e-9) u2 = rng();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdDev;
  },
  hash(state) {
    const str = JSON.stringify(state);
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  },
  text(ctx, str, x, y, opts = {}) {
    ctx.save();
    ctx.fillStyle = opts.color || "#181715";
    ctx.font = (opts.size || 14) + "px " + (opts.font || "ui-sans-serif, system-ui, sans-serif");
    ctx.textAlign = opts.align || "left";
    ctx.textBaseline = opts.baseline || "alphabetic";
    ctx.fillText(str, x, y);
    ctx.restore();
  },
  arrow(ctx, x1, y1, x2, y2, opts = {}) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1e-6) return;
    const angle = Math.atan2(dy, dx);
    const headLen = opts.headLength || 10;
    const headAngle = opts.headAngle || Math.PI / 6;
    ctx.save();
    ctx.strokeStyle = opts.color || "#181715";
    ctx.fillStyle = opts.color || "#181715";
    ctx.lineWidth = opts.width || 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - headAngle), y2 - headLen * Math.sin(angle - headAngle));
    ctx.lineTo(x2 - headLen * Math.cos(angle + headAngle), y2 - headLen * Math.sin(angle + headAngle));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },
  grid(ctx, view, opts = {}) {
    const step = opts.step || 40;
    ctx.save();
    ctx.strokeStyle = opts.color || "rgba(214, 198, 165, 0.25)";
    ctx.lineWidth = opts.lineWidth || 1;
    ctx.beginPath();
    for (let x = 0; x <= view.width; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, view.height); }
    for (let y = 0; y <= view.height; y += step) { ctx.moveTo(0, y); ctx.lineTo(view.width, y); }
    ctx.stroke();
    ctx.restore();
  },
  axes(ctx, rect, opts = {}) {
    ctx.save();
    ctx.strokeStyle = opts.color || "#181715";
    ctx.lineWidth = opts.lineWidth || 2;
    ctx.beginPath();
    ctx.moveTo(rect.x, rect.y);
    ctx.lineTo(rect.x, rect.y + rect.height);
    ctx.lineTo(rect.x + rect.width, rect.y + rect.height);
    ctx.stroke();
    if (opts.xLabel) {
      SimKit.text(ctx, opts.xLabel, rect.x + rect.width / 2, rect.y + rect.height + 25, { align: "center", size: 12, color: opts.color });
    }
    if (opts.yLabel) {
      ctx.save();
      ctx.translate(rect.x - 25, rect.y + rect.height / 2);
      ctx.rotate(-Math.PI / 2);
      SimKit.text(ctx, opts.yLabel, 0, 0, { align: "center", size: 12, color: opts.color });
      ctx.restore();
    }
    ctx.restore();
  }
};
Object.freeze(SimKit);
Object.freeze(SimKit.vec2);
`;
}
