import { describe, it, expect, vi } from "vitest";
import { updateUsuario } from "./usuariosService.js";

function makePool({ usuario, updateAffectedRows = 1, auditInsertId = 30 }) {
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
    execute: vi.fn().mockResolvedValue([usuario ? [usuario] : []]),
    getConnection: vi.fn().mockResolvedValue(connection),
  };
  return { pool, connection };
}

const admin = { id: 1, rol: "admin" };
const existingUsuario = { id: 7, username: "mgarcia", nombre: "Maria Garcia", rol: "operador", activo: 1 };

describe("usuariosService — updateUsuario", () => {
  it("returns 404 when the usuario id is unknown", async () => {
    const { pool } = makePool({ usuario: null });

    const result = await updateUsuario(pool, { actor: admin, id: 999, nombre: "Nuevo Nombre", reason: "corrección" });

    expect(result.httpStatus).toBe(404);
    expect(result.body).toEqual({ ok: false, error: "not_found" });
  });

  it("returns 400 invalid_rol when rol is not admin or operador", async () => {
    const { pool, connection } = makePool({ usuario: existingUsuario });

    const result = await updateUsuario(pool, { actor: admin, id: 7, rol: "superadmin", reason: "corrección" });

    expect(result.httpStatus).toBe(400);
    expect(result.body).toEqual({ ok: false, error: "invalid_rol" });
    expect(connection.beginTransaction).not.toHaveBeenCalled();
  });

  it("returns 400 invalid_payload when neither nombre nor rol is supplied", async () => {
    const { pool, connection } = makePool({ usuario: existingUsuario });

    const result = await updateUsuario(pool, { actor: admin, id: 7, reason: "corrección" });

    expect(result.httpStatus).toBe(400);
    expect(result.body).toEqual({ ok: false, error: "invalid_payload" });
    expect(connection.beginTransaction).not.toHaveBeenCalled();
  });

  it("returns 400 invalid_payload when both nombre and rol are supplied together", async () => {
    const { pool } = makePool({ usuario: existingUsuario });

    const result = await updateUsuario(pool, {
      actor: admin,
      id: 7,
      nombre: "Nuevo Nombre",
      rol: "admin",
      reason: "corrección",
    });

    expect(result.httpStatus).toBe(400);
    expect(result.body).toEqual({ ok: false, error: "invalid_payload" });
  });

  it("returns 400 reason_required when reason is missing", async () => {
    const { pool, connection } = makePool({ usuario: existingUsuario });

    const result = await updateUsuario(pool, { actor: admin, id: 7, nombre: "Nuevo Nombre", reason: "   " });

    expect(result.httpStatus).toBe(400);
    expect(result.body).toEqual({ ok: false, error: "reason_required" });
    expect(connection.beginTransaction).not.toHaveBeenCalled();
  });

  it("updates nombre, commits the transaction, and writes a 'nombre' audit row", async () => {
    const { pool, connection } = makePool({ usuario: existingUsuario, auditInsertId: 41 });

    const result = await updateUsuario(pool, {
      actor: admin,
      id: 7,
      nombre: "Maria Garcia Lopez",
      reason: "corrección de apellido",
    });

    expect(result.httpStatus).toBe(200);
    expect(result.body).toEqual({ ok: true, id: 7, nombre: "Maria Garcia Lopez", rol: undefined, auditId: 41 });
    expect(connection.execute).toHaveBeenNthCalledWith(1, "UPDATE usuarios SET nombre = ? WHERE id = ?", [
      "Maria Garcia Lopez",
      7,
    ]);
    expect(connection.execute).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO admin_audit_log"),
      expect.arrayContaining(["usuario", "7", "user_update", "nombre", "Maria Garcia", "Maria Garcia Lopez"])
    );
    expect(connection.commit).toHaveBeenCalledTimes(1);
  });

  it("updates rol, commits the transaction, and writes a 'rol' audit row", async () => {
    const { pool, connection } = makePool({ usuario: existingUsuario, auditInsertId: 42 });

    const result = await updateUsuario(pool, { actor: admin, id: 7, rol: "admin", reason: "promoción" });

    expect(result.httpStatus).toBe(200);
    expect(result.body.rol).toBe("admin");
    expect(connection.execute).toHaveBeenNthCalledWith(1, "UPDATE usuarios SET rol = ? WHERE id = ?", ["admin", 7]);
    expect(connection.execute).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO admin_audit_log"),
      expect.arrayContaining(["usuario", "7", "user_update", "rol", "operador", "admin"])
    );
  });

  it("returns 404 when the row disappears between fetch and update (0 affected rows)", async () => {
    const { pool, connection } = makePool({ usuario: existingUsuario, updateAffectedRows: 0 });

    const result = await updateUsuario(pool, { actor: admin, id: 7, nombre: "Otro Nombre", reason: "corrección" });

    expect(result.httpStatus).toBe(404);
    expect(result.body).toEqual({ ok: false, error: "not_found" });
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.rollback).toHaveBeenCalledTimes(1);
  });
});
