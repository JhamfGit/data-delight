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
 *
 * SECOND TABLE, SAME DATABASE: the sibling `regency_rrhh_automamtion`
 * service (a separate, independently-deployed Node/TypeScript repo) reads
 * `registros.proyecto` and looks it up in `automation_project_team` to
 * decide which Chatwoot label to assign a WhatsApp conversation to. That
 * table lives in this exact same MySQL database (`registros_regency`)
 * even though its owning code does not — confirmed empirically, not by
 * reading that repo's source. A proyecto created here with no matching
 * `automation_project_team` row silently fails to route in Chatwoot no
 * matter what the Chatwoot label itself is named (a real incident this
 * fixes: an admin created a "PRUEBAS" proyecto and a matching Chatwoot
 * label by hand, but conversations never got tagged, because nothing
 * wrote the row this table's lookup depends on).
 *
 * So `createProyecto`/`renameProyecto`/`deleteProyectoGuarded` now keep
 * both tables in sync in the same transaction: `proyectos` (the catalog
 * powering the registro form's dropdown) and `automation_project_team`
 * (the sibling service's routing table). `team_slug` is never derived
 * from the project name — there is no mechanical rule ("RUTA AL SUR"
 * maps to team_slug `ruta-sur`, dropping "AL" — not a formula) — it is
 * always a value the admin types in, matching a real Chatwoot label
 * name. Creating/renaming/deleting the Chatwoot label ITSELF remains a
 * manual step in Chatwoot's own UI; this module only keeps the two
 * DATABASE tables consistent with each other.
 */

import { extractActor } from "./accessScope.js";
import { buildAuditRecord } from "./auditRecord.js";

/**
 * Mirrors `normalizeProjectKey` in the sibling regency_rrhh_automamtion
 * repo's `src/data/repositories/project-team.ts` EXACTLY -- that service
 * computes this same transformation at lookup time against
 * `registros.proyecto`, so the key stored here in
 * `automation_project_team.project_name_normalized` must match
 * byte-for-byte or the lookup silently fails. If that other repo's
 * normalization ever changes, this must change with it -- there is no
 * shared code between the two independently-deployed services, this is
 * intentionally duplicated, not imported.
 */
const COMBINING_DIACRITICAL_MARKS = /[̀-ͯ]/g;
function normalizeProjectKey(value) {
  return value.trim().normalize("NFD").replace(COMBINING_DIACRITICAL_MARKS, "").toUpperCase();
}

/**
 * `GET /api/proyectos` — every authenticated user (admin or operador) can
 * list the catalog; the registro form needs it for anyone filling it out,
 * not just admins. Each row is enriched with its current
 * `automation_project_team` mapping (`teamSlug`/`teamActive`), computed
 * with a small in-memory join rather than a SQL join -- accent-stripping
 * normalization has no clean SQL equivalent here, and both tables are
 * small (well under a hundred rows).
 *
 * @param {import("mysql2/promise").Pool} pool
 */
export async function listProyectos(pool) {
  const [proyectoRows] = await pool.execute("SELECT id, nombre, created_at FROM proyectos ORDER BY nombre ASC");
  const [teamRows] = await pool.execute("SELECT project_name_normalized, team_slug, active FROM automation_project_team");

  const teamByKey = new Map(teamRows.map((row) => [row.project_name_normalized, row]));

  const data = proyectoRows.map((row) => {
    const team = teamByKey.get(normalizeProjectKey(row.nombre));
    return {
      ...row,
      teamSlug: team ? team.team_slug : null,
      teamActive: team ? Boolean(team.active) : false,
    };
  });

  return { httpStatus: 200, body: { ok: true, data } };
}

/**
 * `POST /api/proyectos` — admin-only. Writes `proyectos` and
 * `automation_project_team` together in one transaction; no audit trail
 * for either (see module header — matches usuario creation's own
 * established precedent). `ON DUPLICATE KEY UPDATE` on the mapping insert
 * cleanly takes over a stale/manually-inserted row for the same
 * normalized key instead of erroring.
 *
 * @param {import("mysql2/promise").Pool} pool
 * @param {{ nombre: string, teamSlug: string }} params
 */
export async function createProyecto(pool, { nombre, teamSlug }) {
  const trimmedNombre = typeof nombre === "string" ? nombre.trim() : "";
  if (trimmedNombre === "") {
    return { httpStatus: 400, body: { ok: false, error: "nombre_required" } };
  }

  const trimmedTeamSlug = typeof teamSlug === "string" ? teamSlug.trim() : "";
  if (trimmedTeamSlug === "") {
    return { httpStatus: 400, body: { ok: false, error: "team_slug_required" } };
  }

  const [existing] = await pool.execute("SELECT id FROM proyectos WHERE nombre = ?", [trimmedNombre]);
  if (existing.length > 0) {
    return { httpStatus: 409, body: { ok: false, error: "nombre_duplicado" } };
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.execute("INSERT INTO proyectos (nombre) VALUES (?)", [trimmedNombre]);

    await connection.execute(
      `INSERT INTO automation_project_team (project_name_normalized, team_slug, active, notes)
       VALUES (?, ?, 1, ?)
       ON DUPLICATE KEY UPDATE team_slug = VALUES(team_slug), active = 1, notes = VALUES(notes)`,
      [
        normalizeProjectKey(trimmedNombre),
        trimmedTeamSlug,
        `Creado desde /admin/proyectos el ${new Date().toISOString()}`,
      ]
    );

    await connection.commit();
    return { httpStatus: 201, body: { ok: true, id: result.insertId, nombre: trimmedNombre, teamSlug: trimmedTeamSlug } };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
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
 * entity "proyecto", action "proyecto_rename") — one audit row, same as
 * before `teamSlug` existed; the mapping-table move is not separately
 * audited. Renaming the catalog entry never rewrites existing
 * `registros.proyecto` rows that already used the old name — this is a
 * catalog edit, not a data migration.
 *
 * Spans two tables now (`proyectos` and `automation_project_team`), so
 * this writes its own transaction instead of going through the shared
 * `runConditionalAuditedUpdate` helper (UPDATE-only, single table).
 *
 * @param {import("mysql2/promise").Pool} pool
 * @param {object} params
 * @param {{ id: number, rol: string }} params.actor
 * @param {string|number} params.id
 * @param {string} params.nombre
 * @param {string} params.reason
 * @param {string} params.teamSlug
 */
export async function renameProyecto(pool, { actor, id, nombre, reason, teamSlug }) {
  const existing = await getProyectoById(pool, id);
  if (!existing) {
    return { httpStatus: 404, body: { ok: false, error: "not_found" } };
  }

  const trimmedNombre = typeof nombre === "string" ? nombre.trim() : "";
  if (trimmedNombre === "") {
    return { httpStatus: 400, body: { ok: false, error: "nombre_required" } };
  }

  const trimmedTeamSlug = typeof teamSlug === "string" ? teamSlug.trim() : "";
  if (trimmedTeamSlug === "") {
    return { httpStatus: 400, body: { ok: false, error: "team_slug_required" } };
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

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [updateResult] = await connection.execute("UPDATE proyectos SET nombre = ? WHERE id = ?", [
      trimmedNombre,
      id,
    ]);
    if (updateResult.affectedRows === 0) {
      // The row existed at fetch time but the UPDATE affected 0 rows --
      // treated as "no longer there" (e.g. concurrent delete), same
      // convention as updateUsuario.
      await connection.rollback();
      return { httpStatus: 404, body: { ok: false, error: "not_found" } };
    }

    const oldKey = normalizeProjectKey(existing.nombre);
    const newKey = normalizeProjectKey(trimmedNombre);

    const [moveResult] = await connection.execute(
      "UPDATE automation_project_team SET project_name_normalized = ?, team_slug = ? WHERE project_name_normalized = ?",
      [newKey, trimmedTeamSlug, oldKey]
    );
    if (moveResult.affectedRows === 0) {
      // No prior mapping row for this proyecto (predates this feature,
      // or was deleted out-of-band) -- add it now rather than error.
      await connection.execute(
        `INSERT INTO automation_project_team (project_name_normalized, team_slug, active)
         VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE team_slug = VALUES(team_slug), active = 1`,
        [newKey, trimmedTeamSlug]
      );
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
    return {
      httpStatus: 200,
      body: { ok: true, id: Number(id), nombre: trimmedNombre, teamSlug: trimmedTeamSlug, auditId: auditResult.insertId },
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * `DELETE /api/proyectos/:id` — admin-only, audited, guarded by history
 * (mirrors `deleteUsuarioGuarded`'s `409 user_has_history` shape). Also
 * removes the matching `automation_project_team` row, if any, in the
 * same transaction -- a proyecto that was never mapped simply deletes 0
 * rows there, which is not an error.
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

    await connection.execute("DELETE FROM automation_project_team WHERE project_name_normalized = ?", [
      normalizeProjectKey(existing.nombre),
    ]);

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
