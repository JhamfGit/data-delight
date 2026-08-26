/**
 * lib/loginPolicy.js — pure login-acceptance policy (design D5 / spec
 * "Reversible Deactivation and Admin-Only Reactivation", scenario
 * "Deactivated usuario cannot authenticate").
 *
 * A deactivated account MUST be rejected with the exact same response as a
 * wrong password: distinguishing the two would let an attacker enumerate
 * which usernames exist and are merely deactivated vs. simply wrong. Both
 * failure modes collapse to one generic error here so the route handler
 * cannot accidentally leak the distinction.
 */

export const GENERIC_CREDENTIAL_ERROR = "Credenciales incorrectas";

/**
 * @param {object} params
 * @param {boolean} params.activo - the stored account's `activo` flag
 * @param {boolean} params.passwordMatches - result of the password comparison
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export const evaluateLoginAttempt = ({ activo, passwordMatches }) => {
  if (!activo || !passwordMatches) {
    return { ok: false, error: GENERIC_CREDENTIAL_ERROR };
  }
  return { ok: true };
};
