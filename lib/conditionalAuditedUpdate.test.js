import { describe, it, expect, vi } from "vitest";
import { runConditionalAuditedUpdate } from "./conditionalAuditedUpdate.js";

const auditRecord = {
  actor_id: 1,
  actor_rol: "admin",
  entity: "registro",
  entity_id: "42",
  action: "status_change",
  field: "status",
  old_value: "NO",
  new_value: "SI",
  reason: "Confirmado por el candidato",
  created_at: new Date("2026-08-25T12:00:00.000Z"),
};

function makeMockPool({ affectedRows, auditInsertId = 99, insertShouldThrow = false } = {}) {
  const connection = {
    beginTransaction: vi.fn().mockResolvedValue(undefined),
    execute: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
    release: vi.fn(),
  };

  connection.execute.mockImplementationOnce(async () => [{ affectedRows }]);

  if (affectedRows > 0) {
    if (insertShouldThrow) {
      connection.execute.mockImplementationOnce(async () => {
        throw new Error("insert failed");
      });
    } else {
      connection.execute.mockImplementationOnce(async () => [{ insertId: auditInsertId }]);
    }
  }

  const pool = { getConnection: vi.fn().mockResolvedValue(connection) };
  return { pool, connection };
}

describe("conditionalAuditedUpdate", () => {
  describe("runConditionalAuditedUpdate", () => {
    it("commits and returns the audit id when exactly one row is updated", async () => {
      const { pool, connection } = makeMockPool({ affectedRows: 1 });

      const result = await runConditionalAuditedUpdate(pool, {
        updateSql: "UPDATE registros SET status = ? WHERE id_registro = ? AND status = ?",
        updateParams: ["SI", 42, "NO"],
        auditRecord,
      });

      expect(result).toEqual({ ok: true, auditId: 99 });
      expect(connection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(connection.commit).toHaveBeenCalledTimes(1);
      expect(connection.rollback).not.toHaveBeenCalled();
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    it("binds the exact UPDATE params in order before the audit INSERT", async () => {
      const { pool, connection } = makeMockPool({ affectedRows: 1 });

      await runConditionalAuditedUpdate(pool, {
        updateSql: "UPDATE registros SET status = ? WHERE id_registro = ? AND status = ?",
        updateParams: ["SI", 42, "NO"],
        auditRecord,
      });

      expect(connection.execute).toHaveBeenNthCalledWith(
        1,
        "UPDATE registros SET status = ? WHERE id_registro = ? AND status = ?",
        ["SI", 42, "NO"]
      );
      expect(connection.execute).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("INSERT INTO admin_audit_log"),
        [1, "admin", "registro", "42", "status_change", "status", "NO", "SI", "Confirmado por el candidato", auditRecord.created_at]
      );
    });

    it("rolls back and returns a stale result without inserting an audit row when 0 rows are affected", async () => {
      const { pool, connection } = makeMockPool({ affectedRows: 0 });

      const result = await runConditionalAuditedUpdate(pool, {
        updateSql: "UPDATE registros SET status = ? WHERE id_registro = ? AND status = ?",
        updateParams: ["SI", 42, "SI"],
        auditRecord,
      });

      expect(result).toEqual({ ok: false, reason: "stale" });
      expect(connection.execute).toHaveBeenCalledTimes(1);
      expect(connection.commit).not.toHaveBeenCalled();
      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    it("rolls back, releases, and rethrows when the audit INSERT fails", async () => {
      const { pool, connection } = makeMockPool({ affectedRows: 1, insertShouldThrow: true });

      await expect(
        runConditionalAuditedUpdate(pool, {
          updateSql: "UPDATE registros SET status = ? WHERE id_registro = ? AND status = ?",
          updateParams: ["SI", 42, "NO"],
          auditRecord,
        })
      ).rejects.toThrow("insert failed");

      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(connection.commit).not.toHaveBeenCalled();
      expect(connection.release).toHaveBeenCalledTimes(1);
    });
  });
});
