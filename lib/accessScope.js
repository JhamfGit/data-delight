/**
 * lib/accessScope.js — role/ownership scoping policy, extracted from the
 * inline `req.user.rol === "admin" ? ... : ...` branching that lives in
 * server.js today (registros list handler). Pure and infra-free so it is
 * unit-testable without a live DB or HTTP server (design D1).
 */

/**
 * Whether `actor` may access a resource owned by `ownerId`.
 * `admin` may access any resource, including one with a null/unassigned
 * owner. `operador` may access only a resource it owns; a null/unassigned
 * owner is never "owned by" an operador.
 *
 * @param {{ id: number, rol: string }} actor
 * @param {number|null} ownerId - the resource's owning user id
 * @returns {boolean}
 */
export const canAccessOwnedResource = (actor, ownerId) => {
  if (actor.rol === "admin") return true;
  return ownerId !== null && ownerId !== undefined && actor.id === ownerId;
};

/**
 * Extracts only the claims policy modules need (`id`, `rol`) from a decoded
 * JWT payload, dropping display-only claims (`username`, `nombre`) and
 * standard JWT claims (`iat`, `exp`). Shared by accessScope and
 * auditRecord so both stay in sync on what "actor" means.
 *
 * @param {{ id: number, rol: string }} decoded - `req.user` after `jwt.verify`
 * @returns {{ id: number, rol: string }}
 */
export const extractActor = (decoded) => ({ id: decoded.id, rol: decoded.rol });
