import { describe, it, expect, beforeEach } from "vitest";
import { MemoryStore } from "@/lib/store/memory";
import { StoredSimulation } from "@/lib/store/types";

describe("MemoryStore", () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
  });

  it("should report healthy", async () => {
    expect(await store.isHealthy()).toBe(true);
  });

  it("should save and retrieve a simulation by slug and cacheKey", async () => {
    const sim: StoredSimulation = {
      slug: "tcp-congestion-control-123",
      spec: { title: "TCP Congestion Control" },
      code: "const sim = {};",
      report: { status: "pass", checks: [] },
      repairHistory: [],
      createdAt: Date.now(),
      source: "user",
      cacheKey: "tcp_congestion_control_beginner_v1",
      hits: 0,
    };

    await store.saveSim(sim);

    const bySlug = await store.getSim("tcp-congestion-control-123");
    expect(bySlug).toBeDefined();
    expect(bySlug?.spec.title).toBe("TCP Congestion Control");

    const byCache = await store.getSimByCacheKey("tcp_congestion_control_beginner_v1");
    expect(byCache).toBeDefined();
    expect(byCache?.slug).toBe("tcp-congestion-control-123");

    const missing = await store.getSim("non-existent");
    expect(missing).toBeNull();
  });

  it("should enforce rate limiting correctly", async () => {
    const key = "test-user-ip";
    const limit = 3;
    const windowSeconds = 60;

    // Call 1
    const res1 = await store.checkRateLimit(key, limit, windowSeconds);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    // Call 2
    const res2 = await store.checkRateLimit(key, limit, windowSeconds);
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    // Call 3
    const res3 = await store.checkRateLimit(key, limit, windowSeconds);
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);

    // Call 4 (should exceed)
    const res4 = await store.checkRateLimit(key, limit, windowSeconds);
    expect(res4.success).toBe(false);
    expect(res4.remaining).toBe(0);
  });

  it("should track daily spend and respect budget caps", async () => {
    const dailyCap = 10.0;

    // Small spend within cap
    const r1 = await store.recordSpend(2.5, dailyCap);
    expect(r1.exceeded).toBe(false);
    expect(r1.currentTotal).toBe(2.5);

    // Another spend within cap
    const r2 = await store.recordSpend(5.0, dailyCap);
    expect(r2.exceeded).toBe(false);
    expect(r2.currentTotal).toBe(7.5);

    // Exceeding spend
    const r3 = await store.recordSpend(3.0, dailyCap);
    expect(r3.exceeded).toBe(true);
    expect(r3.currentTotal).toBe(7.5); // should not apply exceeding spend
  });

  it("should allow unlimited spend when cap is 0", async () => {
    const r1 = await store.recordSpend(50.0, 0);
    expect(r1.exceeded).toBe(false);
    expect(r1.currentTotal).toBe(50.0);
  });
});
