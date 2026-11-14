import crypto from "crypto";

/**
 * Normalize concept string: lowercase, trim, and collapse multiple whitespace.
 */
export function normalizeConcept(concept: string): string {
  return concept
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

/**
 * Generate deterministic cache key per Section 7.4 of brief:
 * sha256(normalize(concept) + "|" + level + "|" + schemaVersion)
 */
export function computeCacheKey(concept: string, level: string, schemaVersion: number = 1): string {
  const normalized = normalizeConcept(concept);
  const raw = `${normalized}|${level.toLowerCase()}|${schemaVersion}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Generate human-friendly URL slug for simulations
 */
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36);
  const suffix = crypto.randomBytes(3).toString("hex");
  return `${base || "sim"}-${suffix}`;
}

/**
 * Compute SHA-256 hash of simulation module code
 */
export function computeCodeHash(code: string): string {
  return crypto.createHash("sha256").update(code.trim()).digest("hex").slice(0, 16);
}
