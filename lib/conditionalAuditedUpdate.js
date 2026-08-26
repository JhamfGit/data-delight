/**
 * lib/conditionalAuditedUpdate.js — shared BEGIN -> conditional UPDATE ->
 * INSERT audit -> COMMIT transaction helper (design D4). Both the
 * registros status-correction route (Phase 4) and the usuarios
 * estado/edit routes (Phase 5, next PR) share this exact transaction
 * shape, so it is extracted once here instead of duplicated per route.
 *
 * The caller is responsible for:
 *   - building `auditRecord` via `lib/auditRecord.js`'s `buildAuditRecord`
 *     BEFORE calling this helper, so a `ReasonRequiredError` surfaces
 *     before any DB connection is opened
 *   - supplying a single conditional UPDATE statement whose WHERE clause
 *     encodes the optimistic-concurrency check (e.g.
 *     `... WHERE id = ? AND status = ?`)
 *
 * Never accesses `pool.query`/`pool.execute` directly — always goes
 * through one checked-out `connection` so the UPDATE and the audit
 * INSERT commit or roll back together (design D4: "an un-audited
 * mutation becomes silently possible" is the failure mode this exists to
 * prevent).
 */

/**
 * @param {import("mysql2/promise").Pool} pool
 * @param {object} params
 * @param {string} params.updateSql
 * @param {Array} params.updateParams
 * @param {object} params.auditRecord - a row already built by `buildAuditRecord`
 * @returns {Promise<{ ok: true, auditId: number } | { ok: false, reason: "stale" }>}
 */
export async function runConditionalAuditedUpdate(pool, { updateSql, updateParams, auditRecord }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [updateResult] = await connection.execute(updateSql, updateParams);

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return { ok: false, reason: "stale" };
    }

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
    return { ok: true, auditId: auditResult.insertId };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}
