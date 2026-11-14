import { Store, StoredSimulation, RateLimitResult, SpendResult } from "./types";

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

export class MemoryStore implements Store {
  private simsBySlug: Map<string, StoredSimulation> = new Map();
  private simsByCacheKey: Map<string, string> = new Map(); // cacheKey -> slug
  private rateLimits: Map<string, RateLimitBucket> = new Map();
  private dailySpend: { date: string; amount: number } = {
    date: new Date().toISOString().slice(0, 10),
    amount: 0,
  };

  async isHealthy(): Promise<boolean> {
    return true;
  }

  async getSim(slug: string): Promise<StoredSimulation | null> {
    return this.simsBySlug.get(slug) || null;
  }

  async getSimByCacheKey(cacheKey: string): Promise<StoredSimulation | null> {
    const slug = this.simsByCacheKey.get(cacheKey);
    if (!slug) return null;
    return this.getSim(slug);
  }

  async saveSim(sim: StoredSimulation): Promise<void> {
    this.simsBySlug.set(sim.slug, { ...sim });
    if (sim.cacheKey) {
      this.simsByCacheKey.set(sim.cacheKey, sim.slug);
    }
  }

  async listGallery(limit: number = 20): Promise<StoredSimulation[]> {
    const all = Array.from(this.simsBySlug.values());
    // Prioritize seed items first, then by hits / recency
    all.sort((a, b) => {
      if (a.source === "seed" && b.source !== "seed") return -1;
      if (b.source === "seed" && a.source !== "seed") return 1;
      return (b.hits || 0) - (a.hits || 0) || b.createdAt - a.createdAt;
    });
    return all.slice(0, limit);
  }

  async incrementHits(slug: string): Promise<number> {
    const sim = this.simsBySlug.get(slug);
    if (!sim) return 0;
    sim.hits = (sim.hits || 0) + 1;
    this.simsBySlug.set(slug, sim);
    return sim.hits;
  }

  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const bucket = this.rateLimits.get(key);

    if (!bucket || now >= bucket.resetAt) {
      this.rateLimits.set(key, { count: 1, resetAt: now + windowMs });
      return {
        success: true,
        limit,
        remaining: Math.max(0, limit - 1),
        resetMs: windowMs,
      };
    }

    if (bucket.count >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        resetMs: Math.max(0, bucket.resetAt - now),
      };
    }

    bucket.count += 1;
    this.rateLimits.set(key, bucket);
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - bucket.count),
      resetMs: Math.max(0, bucket.resetAt - now),
    };
  }

  async recordSpend(amountUsd: number, dailyCapUsd: number): Promise<SpendResult> {
    const today = new Date().toISOString().slice(0, 10);
    if (this.dailySpend.date !== today) {
      this.dailySpend = { date: today, amount: 0 };
    }

    // dailyCapUsd <= 0 indicates unlimited / free tier mode
    if (dailyCapUsd > 0 && this.dailySpend.amount + amountUsd > dailyCapUsd) {
      return {
        currentTotal: this.dailySpend.amount,
        exceeded: true,
        limit: dailyCapUsd,
      };
    }

    this.dailySpend.amount += amountUsd;
    return {
      currentTotal: this.dailySpend.amount,
      exceeded: false,
      limit: dailyCapUsd,
    };
  }

  // Helper for test resets
  clear(): void {
    this.simsBySlug.clear();
    this.simsByCacheKey.clear();
    this.rateLimits.clear();
    this.dailySpend = { date: new Date().toISOString().slice(0, 10), amount: 0 };
  }
}
