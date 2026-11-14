import { describe, it, expect } from "vitest";
import { signJobToken, verifyJobToken } from "@/lib/security/jobToken";

describe("Signed HMAC Job Tokens", () => {
  it("should generate and verify valid tokens", () => {
    const token = signJobToken("job-1234", 1);
    expect(typeof token).toBe("string");

    const payload = verifyJobToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.jobId).toBe("job-1234");
    expect(payload?.attemptsUsed).toBe(1);
  });

  it("should reject tampered tokens", () => {
    const token = signJobToken("job-1234", 1);
    const [payloadB64] = token.split(".");
    const tampered = `${payloadB64}.tampered_signature_xyz`;

    expect(verifyJobToken(tampered)).toBeNull();
  });

  it("should reject expired tokens", () => {
    const expiredToken = signJobToken("job-expired", 0, -1000); // negative TTL
    expect(verifyJobToken(expiredToken)).toBeNull();
  });
});
