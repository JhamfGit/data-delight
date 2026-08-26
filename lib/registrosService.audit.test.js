import { describe, it, expect, vi } from "vitest";
import { getRegistroAuditLog } from "./registrosService.js";

describe("registrosService — getRegistroAuditLog", () => {
  it("returns the scoped audit list for an operador's own registro", async () => {
    const operador = { id: 7, rol: "operador" };
    const auditRows = [
      { id: 1, entity: "registro", entity_id: "42", action: "status_change", reason: "motivo 1" },
      { id: 2, entity: "registro", entity_id: "42", action: "status_change", reason: "motivo 2" },
    ];
    const pool = {
      execute: vi
        .fn()
        .mockResolvedValueOnce([[{ id_registro: 42, user_id: 7, status: "SI" }]])
        .mockResolvedValueOnce([auditRows]),
    };

    const result = await getRegistroAuditLog(pool, operador, 42);

    expect(result.httpStatus).toBe(200);
    expect(result.body.data).toEqual(auditRows);
    expect(pool.execute).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("WHERE entity = ? AND entity_id = ?"),
      ["registro", "42"]
    );
  });

  it("returns 403 when an operador requests audit for another operador's registro", async () => {
    const operador = { id: 7, rol: "operador" };
    const pool = {
      execute: vi.fn().mockResolvedValueOnce([[{ id_registro: 42, user_id: 99, status: "SI" }]]),
    };

    const result = await getRegistroAuditLog(pool, operador, 42);

    expect(result.httpStatus).toBe(403);
    expect(result.body).toEqual({ ok: false, error: "forbidden" });
  });

  it("returns 404 for an unknown registro id", async () => {
    const admin = { id: 1, rol: "admin" };
    const pool = { execute: vi.fn().mockResolvedValueOnce([[]]) };

    const result = await getRegistroAuditLog(pool, admin, 999);

    expect(result.httpStatus).toBe(404);
    expect(result.body).toEqual({ ok: false, error: "not_found" });
  });

  it("returns an empty list when no audit rows exist yet for an in-scope registro", async () => {
    const admin = { id: 1, rol: "admin" };
    const pool = {
      execute: vi
        .fn()
        .mockResolvedValueOnce([[{ id_registro: 5, user_id: 3, status: "NO" }]])
        .mockResolvedValueOnce([[]]),
    };

    const result = await getRegistroAuditLog(pool, admin, 5);

    expect(result.httpStatus).toBe(200);
    expect(result.body.data).toEqual([]);
  });
});
