import { describe, it, expect, vi } from "vitest";
import { changeRegistroStatus } from "./registrosService.js";

function makePool({ registro, updateAffectedRows = 1, auditInsertId = 55 }) {
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
    execute: vi.fn().mockResolvedValue([registro ? [registro] : []]),
    getConnection: vi.fn().mockResolvedValue(connection),
  };
  return { pool, connection };
}

describe("registrosService — changeRegistroStatus", () => {
  it("returns 404 when the registro id is unknown", async () => {
    const { pool } = makePool({ registro: null });
    const admin = { id: 1, rol: "admin" };

    const result = await changeRegistroStatus(pool, {
      actor: admin,
      id: 999,
      fromStatus: "NO",
      toStatus: "SI",
      reason: "motivo",
    });

    expect(result.httpStatus).toBe(404);
    expect(result.body).toEqual({ ok: false, error: "not_found" });
  });

  it("returns 403 when an operador targets another operador's registro", async () => {
    const { pool, connection } = makePool({ registro: { id_registro: 42, user_id: 99, status: "NO" } });
    const operador = { id: 7, rol: "operador" };

    const result = await changeRegistroStatus(pool, {
      actor: operador,
      id: 42,
      fromStatus: "NO",
      toStatus: "SI",
      reason: "motivo",
    });

    expect(result.httpStatus).toBe(403);
    expect(result.body).toEqual({ ok: false, error: "forbidden" });
    expect(connection.beginTransaction).not.toHaveBeenCalled();
  });

  it("returns 400 reason_required when reason is missing", async () => {
    const { pool } = makePool({ registro: { id_registro: 42, user_id: 7, status: "NO" } });
    const operador = { id: 7, rol: "operador" };

    const result = await changeRegistroStatus(pool, {
      actor: operador,
      id: 42,
      fromStatus: "NO",
      toStatus: "SI",
      reason: "   ",
    });

    expect(result.httpStatus).toBe(400);
    expect(result.body).toEqual({ ok: false, error: "reason_required" });
  });

  it("returns 422 unknown_source_status when fromStatus has no mapped transitions", async () => {
    const { pool } = makePool({ registro: { id_registro: 42, user_id: 7, status: "FAILED" } });
    const operador = { id: 7, rol: "operador" };

    const result = await changeRegistroStatus(pool, {
      actor: operador,
      id: 42,
      fromStatus: "FAILED",
      toStatus: "SI",
      reason: "motivo",
    });

    expect(result.httpStatus).toBe(422);
    expect(result.body).toEqual({ ok: false, error: "unknown_source_status" });
  });

  it("returns 422 invalid_transition when the target status is not reachable from fromStatus", async () => {
    const { pool } = makePool({ registro: { id_registro: 42, user_id: 7, status: "NO" } });
    const operador = { id: 7, rol: "operador" };

    const result = await changeRegistroStatus(pool, {
      actor: operador,
      id: 42,
      fromStatus: "NO",
      toStatus: "NO",
      reason: "motivo",
    });

    expect(result.httpStatus).toBe(422);
    expect(result.body).toEqual({ ok: false, error: "invalid_transition" });
  });

  it("returns 409 stale_status and does not commit when the conditional UPDATE affects 0 rows", async () => {
    const { pool, connection } = makePool({
      registro: { id_registro: 42, user_id: 7, status: "SI" },
      updateAffectedRows: 0,
    });
    const operador = { id: 7, rol: "operador" };

    const result = await changeRegistroStatus(pool, {
      actor: operador,
      id: 42,
      fromStatus: "NO",
      toStatus: "SI",
      reason: "motivo",
    });

    expect(result.httpStatus).toBe(409);
    expect(result.body).toEqual({ ok: false, error: "stale_status" });
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.rollback).toHaveBeenCalledTimes(1);
  });

  it("returns 200 with the audit id on a valid in-scope transition and commits the transaction", async () => {
    const { pool, connection } = makePool({
      registro: { id_registro: 42, user_id: 7, status: "NO" },
      updateAffectedRows: 1,
      auditInsertId: 77,
    });
    const operador = { id: 7, rol: "operador" };

    const result = await changeRegistroStatus(pool, {
      actor: operador,
      id: 42,
      fromStatus: "NO",
      toStatus: "SI",
      reason: "Confirmado por el candidato",
    });

    expect(result.httpStatus).toBe(200);
    expect(result.body).toEqual({ ok: true, status: "SI", auditId: 77 });
    expect(connection.execute).toHaveBeenNthCalledWith(
      1,
      "UPDATE registros SET status = ? WHERE id_registro = ? AND status = ?",
      ["SI", 42, "NO"]
    );
    expect(connection.commit).toHaveBeenCalledTimes(1);
  });

  it("allows an admin to change status on a registro owned by a different operador", async () => {
    const { pool } = makePool({
      registro: { id_registro: 5, user_id: 99, status: "SI" },
      updateAffectedRows: 1,
      auditInsertId: 12,
    });
    const admin = { id: 1, rol: "admin" };

    const result = await changeRegistroStatus(pool, {
      actor: admin,
      id: 5,
      fromStatus: "SI",
      toStatus: "NO",
      reason: "Corrección administrativa",
    });

    expect(result.httpStatus).toBe(200);
    expect(result.body.auditId).toBe(12);
  });
});
