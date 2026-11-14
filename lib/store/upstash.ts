import { Redis } from "@upstash/redis";
import { Store, StoredSimulation, RateLimitResult, SpendResult } from "./types";
import { MemoryStore } from "./memory";

export class UpstashStore implements Store {
  private redis: Redis;
  private fallbackMemory: MemoryStore;

  constructor(url?: string, token?: string) {
    this.fallbackMemory = new MemoryStore();
    this.redis = new Redis({
      url: url || process.env.UPSTASH_REDIS_REST_URL || "",
      token: token || process.env.UPSTASH_REDIS_REST_TOKEN || "",
    });
  }

  async isHealthy(): Promise<boolean> {
    try {
      const pong = await this.redis.ping();
      return pong === "PONG";
    } catch {
      return false;
    }
  }

  async getSim(slug: string): Promise<StoredSimulation | null> {
    try {
      const data = await this.redis.get<StoredSimulation>(`sim:${slug}`);
      return data || null;
    } catch {
      return this.fallbackMemory.getSim(slug);
    }
  }

  async getSimByCacheKey(cacheKey: string): Promise<StoredSimulation | null> {
    try {
      const slug = await this.redis.get<string>(`cache:${cacheKey}`);
      if (!slug) return null;
      return this.getSim(slug);
    } catch {
      return this.fallbackMemory.getSimByCacheKey(cacheKey);
    }
  }

  async saveSim(sim: StoredSimulation): Promise<void> {
    try {
      await Promise.all([
        this.redis.set(`sim:${sim.slug}`, sim),
        sim.cacheKey ? this.redis.set(`cache:${sim.cacheKey}`, sim.slug) : Promise.resolve(),
        this.redis.zadd("gallery:sims", { score: sim.createdAt, member: sim.slug }),
      ]);
    } catch {
      await this.fallbackMemory.saveSim(sim);
    }
  }

  async listGallery(limit: number = 20): Promise<StoredSimulation[]> {
    try {
      const slugs = await this.redis.zrange<string[]>("gallery:sims", 0, limit - 1, {
        rev: true,
      });
      if (!slugs || slugs.length === 0) {
        return this.fallbackMemory.listGallery(limit);
      }
      const pipeline = this.redis.pipeline();
      for (const slug of slugs) {
        pipeline.get<StoredSimulation>(`sim:${slug}`);
      }
      const results = await pipeline.exec<StoredSimulation[]>();
      return results.filter(Boolean);
    } catch {
      return this.fallbackMemory.listGallery(limit);
    }
  }

  async incrementHits(slug: string): Promise<number> {
    try {
      return await this.redis.hincrby(`hits`, slug, 1);
    } catch {
      return this.fallbackMemory.incrementHits(slug);
    }
  }

  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    try {
      const rateLimitKey = `ratelimit:${key}`;
      const current = await this.redis.incr(rateLimitKey);
      if (current === 1) {
        await this.redis.expire(rateLimitKey, windowSeconds);
      }
      const ttl = await this.redis.ttl(rateLimitKey);
      const resetMs = Math.max(0, ttl * 1000);

      return {
        success: current <= limit,
        limit,
        remaining: Math.max(0, limit - current),
        resetMs,
      };
    } catch {
      return this.fallbackMemory.checkRateLimit(key, limit, windowSeconds);
    }
  }

  async recordSpend(amountUsd: number, dailyCapUsd: number): Promise<SpendResult> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const spendKey = `spend:${today}`;
      const microUsdToAdd = Math.round(amountUsd * 1_000_000);
      const newTotalMicro = await this.redis.incrby(spendKey, microUsdToAdd);
      if (newTotalMicro === microUsdToAdd) {
        await this.redis.expire(spendKey, 86400 * 2); // 2 days TTL
      }
      const currentTotal = newTotalMicro / 1_000_000;

      // dailyCapUsd <= 0 means unlimited
      const exceeded = dailyCapUsd > 0 && currentTotal > dailyCapUsd;
      return {
        currentTotal,
        exceeded,
        limit: dailyCapUsd,
      };
    } catch {
      return this.fallbackMemory.recordSpend(amountUsd, dailyCapUsd);
    }
  }
}
