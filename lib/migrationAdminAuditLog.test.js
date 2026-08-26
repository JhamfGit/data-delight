import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * No live MySQL connection is available to this apply session (Phase 0
 * finding), so this is a structural/text-based test of the migration SQL
 * itself rather than a live-DB integration test — a deliberate layer
 * degradation (strict-tdd "Choosing Test Layer": unit test with the
 * best available proxy when the higher integration layer is unavailable).
 * It still gives a real RED->GREEN cycle: it fails until the migration
 * file exists with the required shape, and would fail again if a column
 * or index were renamed or dropped.
 */
const migrationPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "migration_admin_audit_log.sql"
);

const readMigration = () => readFileSync(migrationPath, "utf8");

describe("migration_admin_audit_log.sql", () => {
  it("creates the admin_audit_log table", () => {
    const sql = readMigration();
    expect(sql).toMatch(/CREATE TABLE\s+(IF NOT EXISTS\s+)?admin_audit_log/i);
  });

  it("declares every column required by design D3", () => {
    const sql = readMigration();
    const requiredColumns = [
      "actor_id",
      "actor_rol",
      "entity",
      "entity_id",
      "action",
      "field",
      "old_value",
      "new_value",
      "reason",
      "created_at",
    ];
    for (const column of requiredColumns) {
      expect(sql).toContain(column);
    }
  });

  it("types entity_id as VARCHAR(64) to tolerate the unconfirmed registros key type", () => {
    const sql = readMigration();
    expect(sql).toMatch(/entity_id\s+VARCHAR\(64\)/i);
  });

  it("declares reason as NOT NULL (mandatory audit reason)", () => {
    const sql = readMigration();
    expect(sql).toMatch(/reason\s+VARCHAR\(500\)\s+NOT NULL/i);
  });

  it("declares idx_entity on (entity, entity_id, created_at)", () => {
    const sql = readMigration();
    expect(sql).toMatch(/idx_entity\s*\(\s*entity\s*,\s*entity_id\s*,\s*created_at\s*\)/i);
  });

  it("declares idx_actor on (actor_id, created_at)", () => {
    const sql = readMigration();
    expect(sql).toMatch(/idx_actor\s*\(\s*actor_id\s*,\s*created_at\s*\)/i);
  });
});
