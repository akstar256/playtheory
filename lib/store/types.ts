import { SimSpec } from "@/lib/schemas/simSpec";

export interface StoredSimulation {
  slug: string;
  spec: SimSpec;
  code: string;
  report: any;
  repairHistory: any[];
  createdAt: number;
  source: "seed" | "user";
  cacheKey: string;
  hits: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

export interface SpendResult {
  currentTotal: number;
  exceeded: boolean;
  limit: number;
}

export interface Store {
  /**
   * Health check to confirm storage backend is active and reachable
   */
  isHealthy(): Promise<boolean>;

  /**
   * Retrieve a simulation by its unique URL slug
   */
  getSim(slug: string): Promise<StoredSimulation | null>;

  /**
   * Retrieve a cached simulation by normalized prompt cache key
   */
  getSimByCacheKey(cacheKey: string): Promise<StoredSimulation | null>;

  /**
   * Persist a simulation
   */
  saveSim(sim: StoredSimulation): Promise<void>;

  /**
   * Retrieve list of gallery simulations (seed + top user sims)
   */
  listGallery(limit?: number): Promise<StoredSimulation[]>;

  /**
   * Increment hit counter on a simulation
   */
  incrementHits(slug: string): Promise<number>;

  /**
   * Enforce rate limiting per key (e.g., client IP)
   */
  checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult>;

  /**
   * Record estimated dollar spend against daily budget
   */
  recordSpend(amountUsd: number, dailyCapUsd: number): Promise<SpendResult>;
}
