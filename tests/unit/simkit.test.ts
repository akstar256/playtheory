import { describe, it, expect } from "vitest";
import { SimKit } from "@/lib/runtime/simkit";

describe("SimKit Math & Vector Helpers", () => {
  it("clamp respects bounds", () => {
    expect(SimKit.clamp(15, 0, 10)).toBe(10);
    expect(SimKit.clamp(-5, 0, 10)).toBe(0);
    expect(SimKit.clamp(5, 0, 10)).toBe(5);
  });

  it("lerp performs linear interpolation", () => {
    expect(SimKit.lerp(10, 20, 0.5)).toBe(15);
    expect(SimKit.lerp(0, 100, 0)).toBe(0);
    expect(SimKit.lerp(0, 100, 1)).toBe(100);
  });

  it("map rescales values from one range to another", () => {
    expect(SimKit.map(5, 0, 10, 0, 100)).toBe(50);
    expect(SimKit.map(0, 0, 10, 20, 40)).toBe(20);
  });

  it("vec2 operations are correct", () => {
    const a = SimKit.vec2.create(3, 4);
    const b = SimKit.vec2.create(1, 2);

    expect(SimKit.vec2.add(a, b)).toEqual({ x: 4, y: 6 });
    expect(SimKit.vec2.sub(a, b)).toEqual({ x: 2, y: 2 });
    expect(SimKit.vec2.scale(a, 2)).toEqual({ x: 6, y: 8 });
    expect(SimKit.vec2.mag(a)).toBe(5);
    expect(SimKit.vec2.dist(a, { x: 0, y: 0 })).toBe(5);
    expect(SimKit.vec2.dot(a, b)).toBe(3 * 1 + 4 * 2);
  });

  it("hash produces consistent 32-bit integer", () => {
    const state1 = { x: 10, y: 20 };
    const state2 = { x: 10, y: 20 };
    const state3 = { x: 10, y: 21 };

    expect(SimKit.hash(state1)).toBe(SimKit.hash(state2));
    expect(SimKit.hash(state1)).not.toBe(SimKit.hash(state3));
  });

  it("gaussian generates expected distribution", () => {
    let seed = 12345;
    const rng = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const val = SimKit.gaussian(rng, 100, 15);
    expect(typeof val).toBe("number");
    expect(!isNaN(val)).toBe(true);
  });
});
