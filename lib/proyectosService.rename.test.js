import { describe, it, expect, vi } from "vitest";
import { renameProyecto } from "./proyectosService.js";

function makePool({
  proyecto,
  duplicates = [],
  updateAffectedRows = 1,
  teamMoveAffectedRows = 1,
  auditInsertId = 50,
}) {
  const connectionExecute = vi.fn().mockResolvedValueOnce([{ affectedRows: updateAffectedRows }]);

  if (updateAffectedRows !== 0) {
    connectionExecute.mockResolvedValueOnce([{ affectedRows: teamMoveAffectedRows }]);
    if (teamMoveAffectedRows === 0) {
      // Move found nothing to move -- the upsert-insert fallback runs next.
      connectionExecute.mockResolvedValueOnce([{}]);
    }
    connectionExecute.mockResolvedValueOnce([{ insertId: auditInsertId }]);
  }

  const connection = {
    beginTransaction: vi.fn().mockResolvedValue(undefined),
    execute: connectionExecute,
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

    const result = await renameProyecto(pool, {
      actor: admin,
      id: 999,
      nombre: "Nuevo",
      reason: "corrección",
      teamSlug: "nuevo",
    });

    expect(result.httpStatus).toBe(404);
    expect(result.body).toEqual({ ok: false, error: "not_found" });
  });

  it("returns 400 nombre_required when nombre is empty", async () => {
    const { pool, connection } = makePool({ proyecto: existing });

    const result = await renameProyecto(pool, {
      actor: admin,
      id: 5,
      nombre: "   ",
      reason: "corrección",
      teamSlug: "gica",
    });

    expect(result.httpStatus).toBe(400);
    expect(result.body).toEqual({ ok: false, error: "nombre_required" });
    expect(connection.beginTransaction).not.toHaveBeenCalled();
  });

  it("returns 400 team_slug_required when teamSlug is empty", async () => {
    const { pool, connection } = makePool({ proyecto: existing });

    const result = await renameProyecto(pool, {
      actor: admin,
      id: 5,
      nombre: "GICA Nueva",
      reason: "corrección",
      teamSlug: "   ",
    });

    expect(result.httpStatus).toBe(400);
    expect(result.body).toEqual({ ok: false, error: "team_slug_required" });
    expect(connection.beginTransaction).not.toHaveBeenCalled();
  });

  it("returns 400 reason_required when reason is empty", async () => {
    const { pool, connection } = makePool({ proyecto: existing });

    const result = await renameProyecto(pool, {
      actor: admin,
      id: 5,
      nombre: "GICA Nueva",
      reason: "",
      teamSlug: "gica",
    });

    expect(result.httpStatus).toBe(400);
    expect(result.body).toEqual({ ok: false, error: "reason_required" });
    expect(connection.beginTransaction).not.toHaveBeenCalled();
  });

  it("returns 409 nombre_duplicado when another proyecto already has that nombre", async () => {
    const { pool, connection } = makePool({ proyecto: existing, duplicates: [{ id: 9 }] });

    const result = await renameProyecto(pool, {
      actor: admin,
      id: 5,
      nombre: "V40",
      reason: "corrección",
      teamSlug: "v40",
    });

    expect(result.httpStatus).toBe(409);
    expect(result.body).toEqual({ ok: false, error: "nombre_duplicado" });
    expect(connection.beginTransaction).not.toHaveBeenCalled();
  });

  it("renames, moves the automation_project_team mapping, commits, and writes a proyecto_rename audit row", async () => {
    const { pool, connection } = makePool({ proyecto: existing, auditInsertId: 61 });

    const result = await renameProyecto(pool, {
      actor: admin,
      id: 5,
      nombre: "GICA Renombrado",
      reason: "ajuste de nombre",
      teamSlug: "gica",
    });

    expect(result.httpStatus).toBe(200);
    expect(result.body).toEqual({ ok: true, id: 5, nombre: "GICA Renombrado", teamSlug: "gica", auditId: 61 });
    expect(connection.execute).toHaveBeenNthCalledWith(1, "UPDATE proyectos SET nombre = ? WHERE id = ?", [
      "GICA Renombrado",
      5,
    ]);
    expect(connection.execute).toHaveBeenNthCalledWith(
      2,
      "UPDATE automation_project_team SET project_name_normalized = ?, team_slug = ? WHERE project_name_normalized = ?",
      ["GICA RENOMBRADO", "gica", "GICA"]
    );
    expect(connection.execute).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("INSERT INTO admin_audit_log"),
      expect.arrayContaining(["proyecto", "5", "proyecto_rename", "nombre", "GICA", "GICA Renombrado"])
    );
    expect(connection.commit).toHaveBeenCalledTimes(1);
  });

  it("inserts a fresh automation_project_team row when the proyecto had no prior mapping (move affects 0 rows)", async () => {
    const { pool, connection } = makePool({ proyecto: existing, teamMoveAffectedRows: 0 });

    const result = await renameProyecto(pool, {
      actor: admin,
      id: 5,
      nombre: "GICA Renombrado",
      reason: "ajuste de nombre",
      teamSlug: "gica",
    });

    expect(result.httpStatus).toBe(200);
    expect(connection.execute).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("INSERT INTO automation_project_team"),
      ["GICA RENOMBRADO", "gica"]
    );
    expect(connection.execute).toHaveBeenNthCalledWith(4, expect.stringContaining("INSERT INTO admin_audit_log"), expect.any(Array));
    expect(connection.commit).toHaveBeenCalledTimes(1);
  });

  it("returns 404 when the row disappears between fetch and update (0 affected rows)", async () => {
    const { pool, connection } = makePool({ proyecto: existing, updateAffectedRows: 0 });

    const result = await renameProyecto(pool, {
      actor: admin,
      id: 5,
      nombre: "Otro Nombre",
      reason: "corrección",
      teamSlug: "otro",
    });

    expect(result.httpStatus).toBe(404);
    expect(result.body).toEqual({ ok: false, error: "not_found" });
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.rollback).toHaveBeenCalledTimes(1);
  });
});
