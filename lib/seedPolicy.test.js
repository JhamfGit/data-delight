import { describe, it, expect } from "vitest";
import { validateSeedCredentials, SeedPolicyError } from "./seedPolicy.js";

describe("seedPolicy — validateSeedCredentials", () => {
  it("throws SeedPolicyError when ADMIN_USERNAME is missing", () => {
    expect(() => validateSeedCredentials({ ADMIN_PASSWORD: "s3cret123" })).toThrow(SeedPolicyError);
  });

  it("throws SeedPolicyError when ADMIN_USERNAME is an empty string", () => {
    expect(() =>
      validateSeedCredentials({ ADMIN_USERNAME: "", ADMIN_PASSWORD: "s3cret123" })
    ).toThrow(SeedPolicyError);
  });

  it("throws SeedPolicyError when ADMIN_PASSWORD is missing", () => {
    expect(() => validateSeedCredentials({ ADMIN_USERNAME: "admin" })).toThrow(SeedPolicyError);
  });

  it("throws SeedPolicyError when ADMIN_PASSWORD is only whitespace", () => {
    expect(() =>
      validateSeedCredentials({ ADMIN_USERNAME: "admin", ADMIN_PASSWORD: "   " })
    ).toThrow(SeedPolicyError);
  });

  it("returns the credentials when both env vars are present and non-empty", () => {
    const result = validateSeedCredentials({ ADMIN_USERNAME: "admin", ADMIN_PASSWORD: "s3cret123" });
    expect(result).toEqual({ adminUsername: "admin", adminPassword: "s3cret123" });
  });
});
