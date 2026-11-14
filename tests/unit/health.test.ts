import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/health/route";
import { setStore } from "@/lib/store";
import { MemoryStore } from "@/lib/store/memory";

describe("GET /api/health", () => {
  beforeEach(() => {
    setStore(new MemoryStore());
  });

  afterEach(() => {
    setStore(null);
  });

  it("should return HTTP 200 with ok status and dependency checks", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.checks).toBeDefined();
    expect(data.checks.store).toBe("healthy");
    expect(data.checks.llm).toBeDefined();
    expect(typeof data.durationMs).toBe("number");
  });
});
