import crypto from "crypto";

export interface JobTokenPayload {
  jobId: string;
  attemptsUsed: number;
  exp: number; // UNIX timestamp in ms
}

const DEFAULT_SECRET = "playtheory_default_dev_hmac_secret_32_characters";

function getSecret(): string {
  return process.env.JOB_TOKEN_SECRET || DEFAULT_SECRET;
}

export function signJobToken(jobId: string, attemptsUsed: number = 0, ttlMs: number = 3600000): string {
  const payload: JobTokenPayload = {
    jobId,
    attemptsUsed,
    exp: Date.now() + ttlMs,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

export function verifyJobToken(token: string): JobTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", getSecret())
      .update(payloadB64)
      .digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload: JobTokenPayload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (Date.now() > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
