import { describe, it, expect, vi } from "vitest";
import { buildRegistrosListQuery, listRegistros } from "./registrosService.js";

describe("registrosService", () => {
  describe("buildRegistrosListQuery", () => {
    it("scopes an operador to only its own registros with no filters", () => {
      const operador = { id: 7, rol: "operador" };
      const built = buildRegistrosListQuery(operador, {});

      expect(built.countQuery).toContain("WHERE r.user_id = ?");
      expect(built.countParams).toEqual([7]);
      expect(built.dataQuery).toContain("WHERE r.user_id = ?");
      expect(built.dataParams).toEqual([7, 10, 0]);
    });

    it("does not scope an admin to any user_id with no filters, and joins usuarios for usuario_nombre", () => {
      const admin = { id: 1, rol: "admin" };
      const built = buildRegistrosListQuery(admin, {});

      expect(built.countQuery).not.toContain("user_id");
      expect(built.countParams).toEqual([]);
      expect(built.dataParams).toEqual([10, 0]);
      expect(built.dataQuery).toContain("LEFT JOIN usuarios u ON r.user_id = u.id");
      expect(built.dataQuery).toContain("u.username AS usuario_nombre");
    });

    it("does not join usuarios for an operador (no usuario_nombre needed)", () => {
      const operador = { id: 7, rol: "operador" };
      const built = buildRegistrosListQuery(operador, {});

      expect(built.dataQuery).not.toContain("LEFT JOIN");
      expect(built.dataQuery).not.toContain("usuario_nombre");
    });

    it("adds a cedula/nombre search condition for an admin with q", () => {
      const admin = { id: 1, rol: "admin" };
      const built = buildRegistrosListQuery(admin, { q: "12345" });

      expect(built.countQuery).toContain("(r.cedula LIKE ? OR r.nombre LIKE ?)");
      expect(built.countParams).toEqual(["%12345%", "%12345%"]);
    });

    it("combines operador scope with status/proyecto/centro_operacion filters using AND", () => {
      const operador = { id: 7, rol: "operador" };
      const built = buildRegistrosListQuery(operador, {
        status: "NO",
        proyecto: "Proyecto A",
        centro_operacion: "Bogota",
      });

      expect(built.countQuery).toBe(
        "SELECT COUNT(*) AS total FROM registros r WHERE r.user_id = ? AND r.status = ? AND r.proyecto = ? AND r.centro_operacion = ?"
      );
      expect(built.countParams).toEqual([7, "NO", "Proyecto A", "Bogota"]);
    });

    it("adds a user_id filter condition for an admin filtering by a specific usuario", () => {
      const admin = { id: 1, rol: "admin" };
      const built = buildRegistrosListQuery(admin, { user_id: "11" });

      expect(built.countQuery).toBe("SELECT COUNT(*) AS total FROM registros r WHERE r.user_id = ?");
      expect(built.countParams).toEqual(["11"]);
    });

    it("combines an operador's own forced scope with an unrelated user_id filter into zero rows, never a bypass", () => {
      const operador = { id: 7, rol: "operador" };
      const built = buildRegistrosListQuery(operador, { user_id: "11" });

      expect(built.countQuery).toBe(
        "SELECT COUNT(*) AS total FROM registros r WHERE r.user_id = ? AND r.user_id = ?"
      );
      expect(built.countParams).toEqual([7, "11"]);
    });

    it("clamps page/pageSize and computes the correct offset", () => {
      const admin = { id: 1, rol: "admin" };
      const built = buildRegistrosListQuery(admin, { page: 3, pageSize: 20 });

      expect(built.page).toBe(3);
      expect(built.pageSize).toBe(20);
      expect(built.dataParams).toEqual([20, 40]);
    });

    it("falls back to safe defaults for invalid page/pageSize", () => {
      const admin = { id: 1, rol: "admin" };
      const built = buildRegistrosListQuery(admin, { page: -5, pageSize: "abc" });

      expect(built.page).toBe(1);
      expect(built.pageSize).toBe(10);
    });
  });

  describe("listRegistros", () => {
    it("returns 200 with items/total scoped to the operador via pool.query", async () => {
      const operador = { id: 7, rol: "operador" };
      const pool = {
        query: vi
          .fn()
          .mockResolvedValueOnce([[{ total: 2 }]])
          .mockResolvedValueOnce([[{ id_registro: 1, user_id: 7 }, { id_registro: 2, user_id: 7 }]]),
      };

      const result = await listRegistros(pool, operador, {});

      expect(result.httpStatus).toBe(200);
      expect(result.body.data).toHaveLength(2);
      expect(result.body.pagination.total).toBe(2);
      expect(pool.query).toHaveBeenNthCalledWith(1, expect.stringContaining("WHERE r.user_id = ?"), [7]);
      expect(pool.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("WHERE r.user_id = ?"),
        [7, 10, 0]
      );
    });

    it("returns total 0 with an empty data array when nothing matches", async () => {
      const admin = { id: 1, rol: "admin" };
      const pool = {
        query: vi
          .fn()
          .mockResolvedValueOnce([[{ total: 0 }]])
          .mockResolvedValueOnce([[]]),
      };

      const result = await listRegistros(pool, admin, { status: "FAILED" });

      expect(result.httpStatus).toBe(200);
      expect(result.body.data).toEqual([]);
      expect(result.body.pagination.total).toBe(0);
    });
  });
});
