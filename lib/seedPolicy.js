/**
 * lib/seedPolicy.js — pure, importable extraction of seed.js's
 * credential-required check (design D7 / spec "No Plaintext or Hardcoded
 * Credentials in Seed Data").
 *
 * This is a refactor of the inline checks that already lived in seed.js
 * (merged pre-existing on `main`) — the observable behavior (refuse to seed
 * when ADMIN_USERNAME or ADMIN_PASSWORD is missing/empty/whitespace-only, no
 * plaintext fallback literal) is unchanged. Extracting it into a pure
 * function makes it testable under any runner without connecting to MySQL,
 * closing the CRITICAL-3 zero-coverage gap flagged in sdd-verify.
 */

export class SeedPolicyError extends Error {}

/**
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} env
 * @returns {{ adminUsername: string, adminPassword: string }}
 * @throws {SeedPolicyError} when ADMIN_USERNAME or ADMIN_PASSWORD is missing/empty/whitespace-only
 */
export function validateSeedCredentials(env) {
  if (!env.ADMIN_USERNAME || env.ADMIN_USERNAME.trim() === "") {
    throw new SeedPolicyError(
      "ADMIN_USERNAME environment variable is required and has no fallback default. Refusing to seed."
    );
  }
  if (!env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.trim() === "") {
    throw new SeedPolicyError(
      "ADMIN_PASSWORD environment variable is required and has no fallback default. Refusing to seed."
    );
  }
  return { adminUsername: env.ADMIN_USERNAME, adminPassword: env.ADMIN_PASSWORD };
}
