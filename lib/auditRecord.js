/**
 * lib/auditRecord.js — builds a validated `admin_audit_log` row (design D3).
 * Pure: no DB access here (design D1) — the caller (server.js route,
 * inside the D4 mutation transaction) is responsible for the actual
 * `INSERT`. `actor` is expected to already be the narrow shape produced by
 * `lib/accessScope.js`'s `extractActor` (`{ id, rol }`), not a raw decoded
 * JWT payload.
 */

/**
 * Thrown when `reason` is missing, empty, or whitespace-only. Callers
 * (route handlers) MAY use `error instanceof ReasonRequiredError` to map
 * this to `400 reason_required` per the API surface.
 */
export class ReasonRequiredError extends Error {
  constructor() {
    super("reason is required and must not be empty or whitespace-only");
    this.name = "ReasonRequiredError";
    this.code = "reason_required";
  }
}

/**
 * @param {object} params
 * @param {{ id: number, rol: string }} params.actor
 * @param {string} params.entity - 'registro' | 'usuario'
 * @param {string} params.entityId
 * @param {string} params.action - 'status_change' | 'user_deactivate' | 'user_reactivate' | 'user_update'
 * @param {string|null} [params.field]
 * @param {string|null} [params.oldValue]
 * @param {string|null} [params.newValue]
 * @param {string} params.reason - mandatory, non-empty after trim
 * @param {() => Date} [params.now] - injectable clock, defaults to `() => new Date()`
 * @returns {object} a row shaped for `admin_audit_log` insertion
 * @throws {ReasonRequiredError} when `reason` is empty or whitespace-only
 */
export const buildAuditRecord = ({
  actor,
  entity,
  entityId,
  action,
  field = null,
  oldValue = null,
  newValue = null,
  reason,
  now = () => new Date(),
}) => {
  const trimmedReason = typeof reason === "string" ? reason.trim() : "";
  if (trimmedReason === "") {
    throw new ReasonRequiredError();
  }

  return {
    actor_id: actor.id,
    actor_rol: actor.rol,
    entity,
    entity_id: entityId,
    action,
    field,
    old_value: oldValue,
    new_value: newValue,
    reason: trimmedReason,
    created_at: now(),
  };
};
