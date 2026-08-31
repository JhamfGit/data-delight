import { describe, it, expect, vi } from "vitest";
import { renameProyecto } from "./proyectosService.js";

function makePool({ proyecto, duplicates = [], updateAffectedRows = 1, auditInsertId = 50 }) {
  const connection = {
    beginTransaction: vi.fn().mockResolvedValue(undefined),
    execute: vi
      .fn()
      .mockResolvedValueOnce([{ affectedRows: updateAffectedRows }])
      .mockResolvedValueOnce([{ insertId: auditInsertId }]),
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
    release: vi.fn(),
  };
  const pool = {
    execute: vi
      .fn()
      .mockResolvedValueOnce([proyecto ? [proyecto] : []])
      .mockResolvedValueOnce([duplicates]),
    getConnection: vi.fn().mockResolvedValue(connection),
  };
  return { pool, connection };
}

const admin = { id: 1, rol: "admin" };
const existing = { id: 5, nombre: "GICA", created_at: "2026-01-01" };

describe("proyectosService — renameProyecto", () => {
  it("returns 404 when the proyecto id is unknown", async () => {
    const { pool } = makePool({ proyecto: null });

    const result = await renameProyecto(pool, { actor: admin, id: 999, nombre: "Nuevo", reason: "corrección" });

    expect(result.httpStatus).toBe(404);
    expect(result.body).toEqual({ ok: false, error: "not_found" });
  });

  it("returns 400 nombre_required when nombre is empty", async () => {
    const { pool, connection } = makePool({ proyecto: existing });

    const result = await renameProyecto(pool, { actor: admin, id: 5, nombre: "   ", reason: "corrección" });

    expect(result.httpStatus).toBe(400);
    expect(result.body).toEqual({ ok: false, error: "nombre_required" });
    expect(connection.beginTransaction).not.toHaveBeenCalled();
  });

  it("returns 400 reason_required when reason is empty", async () => {
    const { pool, connection } = makePool({ proyecto: existing });

    const result = await renameProyecto(pool, { actor: admin, id: 5, nombre: "GICA Nueva", reason: "" });

    expect(result.httpStatus).toBe(400);
    expect(result.body).toEqual({ ok: false, error: "reason_required" });
    expect(connection.beginTransaction).not.toHaveBeenCalled();
  });

  it("returns 409 nombre_duplicado when another proyecto already has that nombre", async () => {
    const { pool, connection } = makePool({ proyecto: existing, duplicates: [{ id: 9 }] });

    const result = await renameProyecto(pool, { actor: admin, id: 5, nombre: "V40", reason: "corrección" });

    expect(result.httpStatus).toBe(409);
    expect(result.body).toEqual({ ok: false, error: "nombre_duplicado" });
    expect(connection.beginTransaction).not.toHaveBeenCalled();
  });

  it("renames, commits the transaction, and writes a proyecto_rename audit row", async () => {
    const { pool, connection } = makePool({ proyecto: existing, auditInsertId: 61 });

    const result = await renameProyecto(pool, { actor: admin, id: 5, nombre: "GICA Renombrado", reason: "ajuste de nombre" });

    expect(result.httpStatus).toBe(200);
    expect(result.body).toEqual({ ok: true, id: 5, nombre: "GICA Renombrado", auditId: 61 });
    expect(connection.execute).toHaveBeenNthCalledWith(1, "UPDATE proyectos SET nombre = ? WHERE id = ?", [
      "GICA Renombrado",
      5,
    ]);
    expect(connection.execute).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO admin_audit_log"),
      expect.arrayContaining(["proyecto", "5", "proyecto_rename", "nombre", "GICA", "GICA Renombrado"])
    );
    expect(connection.commit).toHaveBeenCalledTimes(1);
  });

  it("returns 404 when the row disappears between fetch and update (0 affected rows)", async () => {
    const { pool, connection } = makePool({ proyecto: existing, updateAffectedRows: 0 });

    const result = await renameProyecto(pool, { actor: admin, id: 5, nombre: "Otro Nombre", reason: "corrección" });

    expect(result.httpStatus).toBe(404);
    expect(result.body).toEqual({ ok: false, error: "not_found" });
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.rollback).toHaveBeenCalledTimes(1);
  });
});
