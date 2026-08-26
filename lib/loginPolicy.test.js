import { describe, it, expect } from "vitest";
import { evaluateLoginAttempt, GENERIC_CREDENTIAL_ERROR } from "./loginPolicy.js";

describe("loginPolicy — evaluateLoginAttempt", () => {
  it("succeeds when the account is active and the password matches", () => {
    const result = evaluateLoginAttempt({ activo: true, passwordMatches: true });
    expect(result).toEqual({ ok: true });
  });

  it("rejects with the generic credential error when the account is deactivated, even with the right password", () => {
    const result = evaluateLoginAttempt({ activo: false, passwordMatches: true });
    expect(result).toEqual({ ok: false, error: GENERIC_CREDENTIAL_ERROR });
  });

  it("rejects with the generic credential error when the password is wrong on an active account", () => {
    const result = evaluateLoginAttempt({ activo: true, passwordMatches: false });
    expect(result).toEqual({ ok: false, error: GENERIC_CREDENTIAL_ERROR });
  });

  it("returns the exact same error message for a deactivated account and a bad password — no info leak", () => {
    const deactivated = evaluateLoginAttempt({ activo: false, passwordMatches: true });
    const badPassword = evaluateLoginAttempt({ activo: true, passwordMatches: false });
    expect(deactivated.error).toBe(badPassword.error);
  });

  it("rejects when both the account is deactivated and the password is wrong", () => {
    const result = evaluateLoginAttempt({ activo: false, passwordMatches: false });
    expect(result).toEqual({ ok: false, error: GENERIC_CREDENTIAL_ERROR });
  });
});
