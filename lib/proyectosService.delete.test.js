import { describe, it, expect, vi } from "vitest";
import { deleteProyectoGuarded } from "./proyectosService.js";

function makePool({
  proyecto,
  registroRefs = [],
  deleteAffectedRows = 1,
  teamDeleteAffectedRows = 1,
  auditInsertId = 70,
} = {}) {
  const connection = {
    beginTransaction: vi.fn().mockResolvedValue(undefined),
    execute: vi
      .fn()
      .mockResolvedValueOnce([{ affectedRows: deleteAffectedRows }])
      .mockResolvedValueOnce([{ affectedRows: teamDeleteAffectedRows }])
      .mockResolvedValueOnce([{ insertId: auditInsertId }]),
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
    release: vi.fn(),
  };
  const pool = {
    execute: vi
      .fn()
      .mockResolvedValueOnce([proyecto ? [proyecto] : []])
      .mockResolvedValueOnce([registroRefs]),
    getConnection: vi.fn().mockResolvedValue(connection),
  };
  return { pool, connection };
}

const admin = { id: 1, rol: "admin" };
const existing = { id: 9, nombre: "TOLIS", created_at: "2026-01-01" };

describe("proyectosService — deleteProyectoGuarded", () => {
  it("returns 404 when the proyecto id is unknown", async () => {
    const { pool } = makePool({ proyecto: null });

    const result = await deleteProyectoGuarded(pool, { actor: admin, id: 999, reason: "ya no se usa" });

    expect(result.httpStatus).toBe(404);
    expect(result.body).toEqual({ ok: false, error: "not_found" });
  });

  it("returns 400 reason_required when reason is empty", async () => {
    const { pool } = makePool({ proyecto: existing });

    const result = await deleteProyectoGuarded(pool, { actor: admin, id: 9, reason: "   " });

    expect(result.httpStatus).toBe(400);
    expect(result.body).toEqual({ ok: false, error: "reason_required" });
  });

  it("returns 409 proyecto_has_history when at least one registro already uses this proyecto", async () => {
    const { pool, connection } = makePool({ proyecto: existing, registroRefs: [{ 1: 1 }] });

    const result = await deleteProyectoGuarded(pool, { actor: admin, id: 9, reason: "ya no se usa" });

    expect(result.httpStatus).toBe(409);
    expect(result.body).toEqual({ ok: false, error: "proyecto_has_history" });
    expect(connection.beginTransaction).not.toHaveBeenCalled();
  });

  it("deletes, commits the transaction, and writes a proyecto_delete audit row when there is no history", async () => {
    const { pool, connection } = makePool({ proyecto: existing, registroRefs: [], auditInsertId: 81 });

    const result = await deleteProyectoGuarded(pool, { actor: admin, id: 9, reason: "proyecto descontinuado" });

    expect(result.httpStatus).toBe(200);
    expect(result.body).toEqual({ ok: true, message: "Proyecto eliminado", auditId: 81 });
    expect(connection.execute).toHaveBeenNthCalledWith(1, "DELETE FROM proyectos WHERE id = ?", [9]);
    expect(connection.execute).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("INSERT INTO admin_audit_log"),
      expect.arrayContaining(["proyecto", "9", "proyecto_delete", null, "TOLIS", null])
    );
    expect(connection.commit).toHaveBeenCalledTimes(1);
  });

  it("also deletes the matching automation_project_team row, keyed by the normalized nombre", async () => {
    const { pool, connection } = makePool({ proyecto: existing, registroRefs: [] });

    await deleteProyectoGuarded(pool, { actor: admin, id: 9, reason: "proyecto descontinuado" });

    expect(connection.execute).toHaveBeenNthCalledWith(
      2,
      "DELETE FROM automation_project_team WHERE project_name_normalized = ?",
      ["TOLIS"]
    );
  });

  it("succeeds even when the proyecto was never mapped in automation_project_team (0 rows deleted there)", async () => {
    const { pool, connection } = makePool({ proyecto: existing, registroRefs: [], teamDeleteAffectedRows: 0 });

    const result = await deleteProyectoGuarded(pool, { actor: admin, id: 9, reason: "proyecto descontinuado" });

    expect(result.httpStatus).toBe(200);
    expect(connection.commit).toHaveBeenCalledTimes(1);
  });

  it("returns 404 when the row disappears between fetch and delete (0 affected rows)", async () => {
    const { pool, connection } = makePool({ proyecto: existing, registroRefs: [], deleteAffectedRows: 0 });

    const result = await deleteProyectoGuarded(pool, { actor: admin, id: 9, reason: "proyecto descontinuado" });

    expect(result.httpStatus).toBe(404);
    expect(result.body).toEqual({ ok: false, error: "not_found" });
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.rollback).toHaveBeenCalledTimes(1);
  });
});
