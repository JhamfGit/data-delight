import { describe, it, expect, vi } from "vitest";
import { getRegistroDetail } from "./registrosService.js";

describe("registrosService — getRegistroDetail", () => {
  it("returns 200 with the record when the operador owns it", async () => {
    const operador = { id: 7, rol: "operador" };
    const pool = { execute: vi.fn().mockResolvedValue([[{ id_registro: 42, user_id: 7, status: "NO" }]]) };

    const result = await getRegistroDetail(pool, operador, 42);

    expect(result.httpStatus).toBe(200);
    expect(result.body.data).toEqual({ id_registro: 42, user_id: 7, status: "NO" });
    expect(pool.execute).toHaveBeenCalledWith("SELECT * FROM registros WHERE id_registro = ?", [42]);
  });

  it("returns 403 for a known id owned by a different operador", async () => {
    const operador = { id: 7, rol: "operador" };
    const pool = { execute: vi.fn().mockResolvedValue([[{ id_registro: 42, user_id: 99, status: "NO" }]]) };

    const result = await getRegistroDetail(pool, operador, 42);

    expect(result.httpStatus).toBe(403);
    expect(result.body).toEqual({ ok: false, error: "forbidden" });
  });

  it("returns 404 for an unknown id", async () => {
    const admin = { id: 1, rol: "admin" };
    const pool = { execute: vi.fn().mockResolvedValue([[]]) };

    const result = await getRegistroDetail(pool, admin, 999);

    expect(result.httpStatus).toBe(404);
    expect(result.body).toEqual({ ok: false, error: "not_found" });
  });

  it("returns 200 for an admin viewing a registro owned by another user", async () => {
    const admin = { id: 1, rol: "admin" };
    const pool = { execute: vi.fn().mockResolvedValue([[{ id_registro: 5, user_id: 42, status: "SI" }]]) };

    const result = await getRegistroDetail(pool, admin, 5);

    expect(result.httpStatus).toBe(200);
    expect(result.body.data.user_id).toBe(42);
  });
});
