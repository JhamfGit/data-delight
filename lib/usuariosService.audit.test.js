import { describe, it, expect, vi } from "vitest";
import { getUsuarioAuditLog } from "./usuariosService.js";

describe("usuariosService — getUsuarioAuditLog", () => {
  it("queries admin_audit_log scoped to the usuario as entity or as actor, ordered by newest first", async () => {
    const rows = [
      { id: 2, entity: "usuario", entity_id: "7", action: "user_deactivate" },
      { id: 1, entity: "registro", entity_id: "42", actor_id: 7, action: "status_change" },
    ];
    const execute = vi.fn().mockResolvedValue([rows]);
    const pool = { execute };

    const result = await getUsuarioAuditLog(pool, 7);

    expect(result.httpStatus).toBe(200);
    expect(result.body).toEqual({ ok: true, data: rows });
    expect(execute).toHaveBeenCalledWith(expect.stringContaining("FROM admin_audit_log"), ["7", 7]);
    expect(execute).toHaveBeenCalledWith(expect.stringContaining("ORDER BY created_at DESC"), ["7", 7]);
  });

  it("returns an empty list when the usuario has no audit history at all", async () => {
    const execute = vi.fn().mockResolvedValue([[]]);
    const pool = { execute };

    const result = await getUsuarioAuditLog(pool, 999);

    expect(result.httpStatus).toBe(200);
    expect(result.body).toEqual({ ok: true, data: [] });
  });
});
