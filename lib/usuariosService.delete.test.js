import { describe, it, expect, vi } from "vitest";
import { deleteUsuarioGuarded } from "./usuariosService.js";

function makePool({ registroRefs = [], auditRefs = [], deleteAffectedRows = 1 } = {}) {
  const execute = vi
    .fn()
    .mockResolvedValueOnce([registroRefs])
    .mockResolvedValueOnce([auditRefs])
    .mockResolvedValueOnce([{ affectedRows: deleteAffectedRows }]);
  const pool = { execute };
  return { pool };
}

const admin = { id: 1, rol: "admin" };

describe("usuariosService — deleteUsuarioGuarded", () => {
  it("returns 400 and never queries when admin attempts to delete its own account", async () => {
    const { pool } = makePool();

    const result = await deleteUsuarioGuarded(pool, admin, admin.id);

    expect(result.httpStatus).toBe(400);
    expect(pool.execute).not.toHaveBeenCalled();
  });

  it("returns 409 user_has_history when the usuario owns at least one registro", async () => {
    const { pool } = makePool({ registroRefs: [{ 1: 1 }] });

    const result = await deleteUsuarioGuarded(pool, admin, 7);

    expect(result.httpStatus).toBe(409);
    expect(result.body).toEqual({ ok: false, error: "user_has_history" });
    expect(pool.execute).toHaveBeenCalledTimes(1);
  });

  it("returns 409 user_has_history when the usuario is referenced as an audit actor", async () => {
    const { pool } = makePool({ registroRefs: [], auditRefs: [{ 1: 1 }] });

    const result = await deleteUsuarioGuarded(pool, admin, 7);

    expect(result.httpStatus).toBe(409);
    expect(result.body).toEqual({ ok: false, error: "user_has_history" });
    expect(pool.execute).toHaveBeenCalledTimes(2);
  });

  it("deletes and returns 200 when the usuario has zero registros and zero audit history", async () => {
    const { pool } = makePool({ registroRefs: [], auditRefs: [], deleteAffectedRows: 1 });

    const result = await deleteUsuarioGuarded(pool, admin, 7);

    expect(result.httpStatus).toBe(200);
    expect(result.body).toEqual({ ok: true, message: "Usuario eliminado" });
    expect(pool.execute).toHaveBeenNthCalledWith(3, "DELETE FROM usuarios WHERE id = ?", [7]);
  });

  it("returns 404 when the unreferenced usuario id does not exist", async () => {
    const { pool } = makePool({ registroRefs: [], auditRefs: [], deleteAffectedRows: 0 });

    const result = await deleteUsuarioGuarded(pool, admin, 999);

    expect(result.httpStatus).toBe(404);
    expect(result.body).toEqual({ ok: false, error: "not_found" });
  });
});
