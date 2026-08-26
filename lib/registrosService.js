/**
 * lib/registrosService.js — registros admin-panel service layer (Phase 4).
 *
 * Extracted from server.js so the scope/filter/transaction logic can be
 * exercised without an HTTP layer or a live MySQL connection: every
 * function here takes an injected `pool` (mysql2/promise Pool or a mock
 * with matching `.query`/`.execute`/`.getConnection` methods) and returns
 * a plain `{ httpStatus, body }` result the Express route handler maps
 * directly onto `res.status(...).json(...)`.
 */

import { canAccessOwnedResource, extractActor } from "./accessScope.js";
import { allowedFrom } from "./statusTransitions.js";
import { buildAuditRecord } from "./auditRecord.js";
import { runConditionalAuditedUpdate } from "./conditionalAuditedUpdate.js";

/**
 * Pure query builder for the scoped/filtered registros list (design API
 * Surface: `GET /api/registros?q=&status=&proyecto=&centro_operacion=&page=&pageSize=`).
 * `admin` sees every registro; any other role is scoped to `user_id = actor.id`.
 *
 * @param {{ id: number, rol: string }} actor
 * @param {{ q?: string, status?: string, proyecto?: string, centro_operacion?: string, page?: number|string, pageSize?: number|string }} filters
 */
export function buildRegistrosListQuery(actor, filters = {}) {
  const { q, status, proyecto, centro_operacion, page, pageSize } = filters;

  const conditions = [];
  const params = [];

  if (actor.rol !== "admin") {
    conditions.push("r.user_id = ?");
    params.push(actor.id);
  }

  if (q) {
    conditions.push("(r.cedula LIKE ? OR r.nombre LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }

  if (status) {
    conditions.push("r.status = ?");
    params.push(status);
  }

  if (proyecto) {
    conditions.push("r.proyecto = ?");
    params.push(proyecto);
  }

  if (centro_operacion) {
    conditions.push("r.centro_operacion = ?");
    params.push(centro_operacion);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safePageSize = Math.max(1, parseInt(pageSize, 10) || 10);
  const offset = (safePage - 1) * safePageSize;

  // Admin listings keep the pre-existing LEFT JOIN so `usuario_nombre`
  // stays populated (behavior preserved from the route being replaced).
  // Operador listings never needed it — the caller already knows who it is.
  const isAdmin = actor.rol === "admin";
  const fromClause = isAdmin
    ? "FROM registros r LEFT JOIN usuarios u ON r.user_id = u.id"
    : "FROM registros r";
  const selectColumns = isAdmin ? "r.*, u.username AS usuario_nombre" : "r.*";

  const countBase = `FROM registros r ${whereClause}`.trim();
  const dataBase = `${selectColumns} ${fromClause} ${whereClause}`.trim();

  return {
    countQuery: `SELECT COUNT(*) AS total ${countBase}`.replace(/\s+/g, " ").trim(),
    countParams: [...params],
    dataQuery: `SELECT ${dataBase} ORDER BY r.id_registro DESC LIMIT ? OFFSET ?`
      .replace(/\s+/g, " ")
      .trim(),
    dataParams: [...params, safePageSize, offset],
    page: safePage,
    pageSize: safePageSize,
  };
}

/**
 * `GET /api/registros` — scoped, filtered, paginated list.
 * Response shape kept backward-compatible with the pre-existing endpoint
 * (`data` + `pagination.{total,page,limit,totalPages}`) so the shipped
 * frontend (Index.tsx, unmodified until the Phase 6 frontend PR) keeps
 * working unchanged.
 *
 * @param {import("mysql2/promise").Pool} pool
 * @param {{ id: number, rol: string }} actor
 * @param {object} filters
 */
export async function listRegistros(pool, actor, filters) {
  const { countQuery, countParams, dataQuery, dataParams, page, pageSize } = buildRegistrosListQuery(
    actor,
    filters
  );

  const [countRows] = await pool.query(countQuery, countParams);
  const total = countRows[0]?.total ? Number(countRows[0].total) : 0;

  const [rows] = await pool.query(dataQuery, dataParams);
  const totalPages = Math.ceil(total / pageSize) || 1;

  return {
    httpStatus: 200,
    body: {
      ok: true,
      data: rows,
      pagination: { total, page, limit: pageSize, totalPages },
    },
  };
}

/**
 * Fetches a single registro by id, unscoped. Callers MUST apply
 * `canAccessOwnedResource` themselves to translate "not owned" into the
 * correct `403`/`404` split.
 *
 * @param {import("mysql2/promise").Pool} pool
 * @param {string|number} id
 * @returns {Promise<object|null>}
 */
export async function getRegistroById(pool, id) {
  const [rows] = await pool.execute("SELECT * FROM registros WHERE id_registro = ?", [id]);
  return rows[0] ?? null;
}

/**
 * `GET /api/registros/:id` — `200` in scope, `403` a known id out of
 * scope, `404` an unknown id.
 */
export async function getRegistroDetail(pool, actor, id) {
  const registro = await getRegistroById(pool, id);
  if (!registro) {
    return { httpStatus: 404, body: { ok: false, error: "not_found" } };
  }
  if (!canAccessOwnedResource(actor, registro.user_id)) {
    return { httpStatus: 403, body: { ok: false, error: "forbidden" } };
  }
  return { httpStatus: 200, body: { ok: true, data: registro } };
}

/**
 * `PATCH /api/registros/:id/status` — design D4 sequence: fetch (404) ->
 * scope (403) -> reason required (400) -> transition validity (422
 * unknown_source_status | invalid_transition) -> conditional UPDATE +
 * audit INSERT in one transaction (409 stale_status on 0 affected rows,
 * else 200). `fromStatus` is client-supplied (the value the caller last
 * observed) and drives the optimistic-concurrency `WHERE status = ?`
 * clause — NOT the value re-read from `getRegistroById`, which is only
 * used to resolve `user_id` for the scope check.
 */
export async function changeRegistroStatus(pool, { actor, id, fromStatus, toStatus, reason }) {
  const registro = await getRegistroById(pool, id);
  if (!registro) {
    return { httpStatus: 404, body: { ok: false, error: "not_found" } };
  }
  if (!canAccessOwnedResource(actor, registro.user_id)) {
    return { httpStatus: 403, body: { ok: false, error: "forbidden" } };
  }

  const trimmedReason = typeof reason === "string" ? reason.trim() : "";
  if (trimmedReason === "") {
    return { httpStatus: 400, body: { ok: false, error: "reason_required" } };
  }

  const allowed = allowedFrom(fromStatus);
  if (allowed.length === 0) {
    return { httpStatus: 422, body: { ok: false, error: "unknown_source_status" } };
  }
  if (!allowed.includes(toStatus)) {
    return { httpStatus: 422, body: { ok: false, error: "invalid_transition" } };
  }

  const auditRecord = buildAuditRecord({
    actor: extractActor(actor),
    entity: "registro",
    entityId: String(id),
    action: "status_change",
    field: "status",
    oldValue: fromStatus,
    newValue: toStatus,
    reason: trimmedReason,
  });

  const result = await runConditionalAuditedUpdate(pool, {
    updateSql: "UPDATE registros SET status = ? WHERE id_registro = ? AND status = ?",
    updateParams: [toStatus, id, fromStatus],
    auditRecord,
  });

  if (!result.ok) {
    return { httpStatus: 409, body: { ok: false, error: "stale_status" } };
  }

  return { httpStatus: 200, body: { ok: true, status: toStatus, auditId: result.auditId } };
}

/**
 * `GET /api/registros/:id/audit` — same scope rule as detail; reads
 * `admin_audit_log` filtered by `entity = 'registro'` and `entity_id`.
 */
export async function getRegistroAuditLog(pool, actor, id) {
  const registro = await getRegistroById(pool, id);
  if (!registro) {
    return { httpStatus: 404, body: { ok: false, error: "not_found" } };
  }
  if (!canAccessOwnedResource(actor, registro.user_id)) {
    return { httpStatus: 403, body: { ok: false, error: "forbidden" } };
  }

  const [rows] = await pool.execute(
    "SELECT * FROM admin_audit_log WHERE entity = ? AND entity_id = ? ORDER BY created_at DESC",
    ["registro", String(id)]
  );

  return { httpStatus: 200, body: { ok: true, data: rows } };
}
