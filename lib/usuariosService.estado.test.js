import { describe, it, expect, vi } from "vitest";
import { changeUsuarioEstado } from "./usuariosService.js";

function makePool({ updateAffectedRows = 1, auditInsertId = 60 } = {}) {
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
  const pool = { getConnection: vi.fn().mockResolvedValue(connection) };
  return { pool, connection };
}

const admin = { id: 1, rol: "admin" };
const operador = { id: 7, rol: "operador" };

describe("usuariosService — changeUsuarioEstado", () => {
  it("returns 403 reactivate_forbidden when an operador attempts to reactivate any usuario", async () => {
    const { pool, connection } = makePool();

    const result = await changeUsuarioEstado(pool, { actor: operador, id: 42, activo: true, reason: "motivo" });

    expect(result.httpStatus).toBe(403);
    expect(result.body).toEqual({ ok: false, error: "reactivate_forbidden" });
    expect(connection.beginTransaction).not.toHaveBeenCalled();
  });

  it("returns 403 reactivate_forbidden even when the operador targets its own account", async () => {
    const { pool } = makePool();

    const result = await changeUsuarioEstado(pool, { actor: operador, id: operador.id, activo: true, reason: "motivo" });

    expect(result.httpStatus).toBe(403);
    expect(result.body).toEqual({ ok: false, error: "reactivate_forbidden" });
  });

  it("returns 403 forbidden (generic) when an operador attempts to deactivate a usuario", async () => {
    const { pool, connection } = makePool();

    const result = await changeUsuarioEstado(pool, { actor: operador, id: 42, activo: false, reason: "motivo" });

    expect(result.httpStatus).toBe(403);
    expect(result.body).toEqual({ ok: false, error: "forbidden" });
    expect(connection.beginTransaction).not.toHaveBeenCalled();
  });

  it("returns 400 reason_required when admin submits a valid transition without a reason", async () => {
    const { pool, connection } = makePool();

    const result = await changeUsuarioEstado(pool, { actor: admin, id: 42, activo: false, reason: "  " });

    expect(result.httpStatus).toBe(400);
    expect(result.body).toEqual({ ok: false, error: "reason_required" });
    expect(connection.beginTransaction).not.toHaveBeenCalled();
  });

  it("deactivates as admin, commits, and writes an audit row with action user_deactivate", async () => {
    const { pool, connection } = makePool({ auditInsertId: 61 });

    const result = await changeUsuarioEstado(pool, {
      actor: admin,
      id: 42,
      activo: false,
      reason: "solicitud de baja",
    });

    expect(result.httpStatus).toBe(200);
    expect(result.body).toEqual({ ok: true, activo: false, auditId: 61 });
    expect(connection.execute).toHaveBeenNthCalledWith(
      1,
      "UPDATE usuarios SET activo = ? WHERE id = ? AND activo <> ?",
      [0, 42, 1]
    );
    expect(connection.execute).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO admin_audit_log"),
      expect.arrayContaining([1, "admin", "usuario", "42", "user_deactivate", "activo", "true", "false"])
    );
    expect(connection.commit).toHaveBeenCalledTimes(1);
  });

  it("reactivates as admin, commits, and writes an audit row with action user_reactivate", async () => {
    const { pool, connection } = makePool({ auditInsertId: 62 });

    const result = await changeUsuarioEstado(pool, {
      actor: admin,
      id: 42,
      activo: true,
      reason: "verificado por soporte",
    });

    expect(result.httpStatus).toBe(200);
    expect(result.body).toEqual({ ok: true, activo: true, auditId: 62 });
    expect(connection.execute).toHaveBeenNthCalledWith(
      1,
      "UPDATE usuarios SET activo = ? WHERE id = ? AND activo <> ?",
      [1, 42, 0]
    );
    expect(connection.commit).toHaveBeenCalledTimes(1);
  });

  it("returns 409 stale_estado and does not commit when the conditional UPDATE affects 0 rows", async () => {
    const { pool, connection } = makePool({ updateAffectedRows: 0 });

    const result = await changeUsuarioEstado(pool, {
      actor: admin,
      id: 999,
      activo: false,
      reason: "motivo",
    });

    expect(result.httpStatus).toBe(409);
    expect(result.body).toEqual({ ok: false, error: "stale_estado" });
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.rollback).toHaveBeenCalledTimes(1);
  });
});
