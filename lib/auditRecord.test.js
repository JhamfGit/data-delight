import { describe, it, expect } from "vitest";
import { buildAuditRecord, ReasonRequiredError } from "./auditRecord.js";

const actor = { id: 1, rol: "admin" };
const fixedNow = () => new Date("2026-08-25T12:00:00.000Z");

describe("auditRecord", () => {
  describe("buildAuditRecord", () => {
    it("builds a valid row for a registro status change", () => {
      const row = buildAuditRecord({
        actor,
        entity: "registro",
        entityId: "42",
        action: "status_change",
        field: "status",
        oldValue: "NO",
        newValue: "SI",
        reason: "Confirmado por el candidato",
        now: fixedNow,
      });

      expect(row).toEqual({
        actor_id: 1,
        actor_rol: "admin",
        entity: "registro",
        entity_id: "42",
        action: "status_change",
        field: "status",
        old_value: "NO",
        new_value: "SI",
        reason: "Confirmado por el candidato",
        created_at: fixedNow(),
      });
    });

    it("builds a differently-shaped valid row for a usuario deactivation", () => {
      const row = buildAuditRecord({
        actor: { id: 9, rol: "admin" },
        entity: "usuario",
        entityId: "13",
        action: "user_deactivate",
        field: "activo",
        oldValue: "1",
        newValue: "0",
        reason: "Baja del operador",
        now: fixedNow,
      });

      expect(row.entity).toBe("usuario");
      expect(row.action).toBe("user_deactivate");
      expect(row.actor_id).toBe(9);
      expect(row.old_value).toBe("1");
      expect(row.new_value).toBe("0");
    });

    it("trims surrounding whitespace from a valid reason", () => {
      const row = buildAuditRecord({
        actor,
        entity: "registro",
        entityId: "1",
        action: "status_change",
        field: "status",
        oldValue: "NO",
        newValue: "SI",
        reason: "  motivo con espacios  ",
        now: fixedNow,
      });

      expect(row.reason).toBe("motivo con espacios");
    });

    it("rejects an empty reason and does not build a row", () => {
      expect(() =>
        buildAuditRecord({
          actor,
          entity: "registro",
          entityId: "1",
          action: "status_change",
          field: "status",
          oldValue: "NO",
          newValue: "SI",
          reason: "",
          now: fixedNow,
        })
      ).toThrow(ReasonRequiredError);
    });

    it("rejects a whitespace-only reason and does not build a row", () => {
      expect(() =>
        buildAuditRecord({
          actor,
          entity: "registro",
          entityId: "1",
          action: "status_change",
          field: "status",
          oldValue: "NO",
          newValue: "SI",
          reason: "   ",
          now: fixedNow,
        })
      ).toThrow(ReasonRequiredError);
    });
  });
});
