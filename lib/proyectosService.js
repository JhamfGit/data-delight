/**
 * lib/proyectosService.js — admin-panel service layer for the "proyectos"
 * catalog. Same pattern as lib/usuariosService.js / lib/registrosService.js:
 * every function takes an injected `pool` (mysql2/promise Pool or a mock
 * with matching `.execute`/`.getConnection` methods) and returns a plain
 * `{ httpStatus, body }` result the Express route handler maps directly
 * onto `res.status(...).json(...)`.
 *
 * `proyectos.nombre` is the exact string every `registros.proyecto` value
 * must come from — the select in `src/components/EmployeeForm.tsx` reads
 * this table instead of a hardcoded option list, so this is the single
 * source of truth for which project names are official. There is no
 * `activo` column here (unlike `usuarios`): deletion is a real hard
 * DELETE, guarded by history the same way `deleteUsuarioGuarded` guards
 * usuarios, not a soft deactivate.
 *
 * Creation is intentionally NOT audited, matching `POST /api/admin/usuarios`'s
 * own established behavior in this codebase — only rename and delete write
 * an `admin_audit_log` row, since those are the actions that change or
 * remove something that already existed.
 */

import { extractActor } from "./accessScope.js";
import { buildAuditRecord } from "./auditRecord.js";
import { runConditionalAuditedUpdate } from "./conditionalAuditedUpdate.js";

/**
 * `GET /api/proyectos` — every authenticated user (admin or operador) can
 * list the catalog; the registro form needs it for anyone filling it out,
 * not just admins.
 *
 * @param {import("mysql2/promise").Pool} pool
 */
export async function listProyectos(pool) {
  const [rows] = await pool.execute("SELECT id, nombre, created_at FROM proyectos ORDER BY nombre ASC");
  return { httpStatus: 200, body: { ok: true, data: rows } };
}

/**
 * `POST /api/proyectos` — admin-only. Plain insert, no audit trail (see
 * module header).
 *
 * @param {import("mysql2/promise").Pool} pool
 * @param {{ nombre: string }} params
 */
export async function createProyecto(pool, { nombre }) {
  const trimmed = typeof nombre === "string" ? nombre.trim() : "";
  if (trimmed === "") {
    return { httpStatus: 400, body: { ok: false, error: "nombre_required" } };
  }

  const [existing] = await pool.execute("SELECT id FROM proyectos WHERE nombre = ?", [trimmed]);
  if (existing.length > 0) {
    return { httpStatus: 409, body: { ok: false, error: "nombre_duplicado" } };
  }

  const [result] = await pool.execute("INSERT INTO proyectos (nombre) VALUES (?)", [trimmed]);
  return { httpStatus: 201, body: { ok: true, id: result.insertId, nombre: trimmed } };
}

/**
 * Fetches a single proyecto by id.
 *
 * @param {import("mysql2/promise").Pool} pool
 * @param {string|number} id
 * @returns {Promise<object|null>}
 */
async function getProyectoById(pool, id) {
  const [rows] = await pool.execute("SELECT id, nombre, created_at FROM proyectos WHERE id = ?", [id]);
  return rows[0] ?? null;
}

/**
 * `PATCH /api/proyectos/:id` — admin-only rename, audited (`admin_audit_log`,
 * entity "proyecto", action "proyecto_rename"). Renaming the catalog entry
 * never rewrites existing `registros.proyecto` rows that already used the
 * old name — this is a catalog edit, not a data migration.
 *
 * @param {import("mysql2/promise").Pool} pool
 * @param {object} params
 * @param {{ id: number, rol: string }} params.actor
 * @param {string|number} params.id
 * @param {string} params.nombre
 * @param {string} params.reason
 */
export async function renameProyecto(pool, { actor, id, nombre, reason }) {
  const existing = await getProyectoById(pool, id);
  if (!existing) {
    return { httpStatus: 404, body: { ok: false, error: "not_found" } };
  }

  const trimmedNombre = typeof nombre === "string" ? nombre.trim() : "";
  if (trimmedNombre === "") {
    return { httpStatus: 400, body: { ok: false, error: "nombre_required" } };
  }

  const trimmedReason = typeof reason === "string" ? reason.trim() : "";
  if (trimmedReason === "") {
    return { httpStatus: 400, body: { ok: false, error: "reason_required" } };
  }

  const [duplicates] = await pool.execute("SELECT id FROM proyectos WHERE nombre = ? AND id <> ?", [
    trimmedNombre,
    id,
  ]);
  if (duplicates.length > 0) {
    return { httpStatus: 409, body: { ok: false, error: "nombre_duplicado" } };
  }

  const auditRecord = buildAuditRecord({
    actor: extractActor(actor),
    entity: "proyecto",
    entityId: String(id),
    action: "proyecto_rename",
    field: "nombre",
    oldValue: existing.nombre,
    newValue: trimmedNombre,
    reason: trimmedReason,
  });

  const result = await runConditionalAuditedUpdate(pool, {
    updateSql: "UPDATE proyectos SET nombre = ? WHERE id = ?",
    updateParams: [trimmedNombre, id],
    auditRecord,
  });

  if (!result.ok) {
    // The row existed at fetch time but the UPDATE affected 0 rows --
    // treated as "no longer there" (e.g. concurrent delete), same
    // convention as updateUsuario.
    return { httpStatus: 404, body: { ok: false, error: "not_found" } };
  }

  return { httpStatus: 200, body: { ok: true, id: Number(id), nombre: trimmedNombre, auditId: result.auditId } };
}

/**
 * `DELETE /api/proyectos/:id` — admin-only, audited, guarded by history
 * (mirrors `deleteUsuarioGuarded`'s `409 user_has_history` shape). Unlike
 * `runConditionalAuditedUpdate` (UPDATE-only), this opens its own
 * transaction since the mutation is a DELETE.
 *
 * @param {import("mysql2/promise").Pool} pool
 * @param {object} params
 * @param {{ id: number, rol: string }} params.actor
 * @param {string|number} params.id
 * @param {string} params.reason
 */
export async function deleteProyectoGuarded(pool, { actor, id, reason }) {
  const existing = await getProyectoById(pool, id);
  if (!existing) {
    return { httpStatus: 404, body: { ok: false, error: "not_found" } };
  }

  const trimmedReason = typeof reason === "string" ? reason.trim() : "";
  if (trimmedReason === "") {
    return { httpStatus: 400, body: { ok: false, error: "reason_required" } };
  }

  const [registroRefs] = await pool.execute("SELECT 1 FROM registros WHERE proyecto = ? LIMIT 1", [
    existing.nombre,
  ]);
  if (registroRefs.length > 0) {
    return { httpStatus: 409, body: { ok: false, error: "proyecto_has_history" } };
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [deleteResult] = await connection.execute("DELETE FROM proyectos WHERE id = ?", [id]);
    if (deleteResult.affectedRows === 0) {
      // Race: someone else deleted it between the fetch above and here.
      await connection.rollback();
      return { httpStatus: 404, body: { ok: false, error: "not_found" } };
    }

    const auditRecord = buildAuditRecord({
      actor: extractActor(actor),
      entity: "proyecto",
      entityId: String(id),
      action: "proyecto_delete",
      field: null,
      oldValue: existing.nombre,
      newValue: null,
      reason: trimmedReason,
    });

    const [auditResult] = await connection.execute(
      `INSERT INTO admin_audit_log
       (actor_id, actor_rol, entity, entity_id, action, field, old_value, new_value, reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        auditRecord.actor_id,
        auditRecord.actor_rol,
        auditRecord.entity,
        auditRecord.entity_id,
        auditRecord.action,
        auditRecord.field,
        auditRecord.old_value,
        auditRecord.new_value,
        auditRecord.reason,
        auditRecord.created_at,
      ]
    );

    await connection.commit();
    return { httpStatus: 200, body: { ok: true, message: "Proyecto eliminado", auditId: auditResult.insertId } };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}
