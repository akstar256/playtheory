import { Store } from "./types";
import { MemoryStore } from "./memory";
import { UpstashStore } from "./upstash";

export * from "./types";
export * from "./memory";
export * from "./upstash";

let storeInstance: Store | null = null;

export function getStore(): Store {
  if (storeInstance) {
    return storeInstance;
  }

  const hasUpstash =
    Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
    Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

  if (hasUpstash) {
    storeInstance = new UpstashStore();
  } else {
    storeInstance = new MemoryStore();
  }

  return storeInstance;
}

// Allows switching store in test environments
export function setStore(customStore: Store | null): void {
  storeInstance = customStore;
}
