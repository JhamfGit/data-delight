import { describe, it, expect } from "vitest";
import { canAccessOwnedResource, extractActor } from "./accessScope.js";

describe("accessScope", () => {
  describe("canAccessOwnedResource", () => {
    it("allows an operador to access a resource it owns", () => {
      const operador = { id: 7, rol: "operador" };
      expect(canAccessOwnedResource(operador, 7)).toBe(true);
    });

    it("blocks an operador from accessing a resource owned by another user", () => {
      const operador = { id: 7, rol: "operador" };
      expect(canAccessOwnedResource(operador, 42)).toBe(false);
    });

    it("allows an admin to access a resource owned by another user", () => {
      const admin = { id: 1, rol: "admin" };
      expect(canAccessOwnedResource(admin, 42)).toBe(true);
    });

    it("allows an admin to access a resource with a null/unassigned owner", () => {
      const admin = { id: 1, rol: "admin" };
      expect(canAccessOwnedResource(admin, null)).toBe(true);
    });

    it("blocks an operador from accessing a resource with a null/unassigned owner", () => {
      const operador = { id: 7, rol: "operador" };
      expect(canAccessOwnedResource(operador, null)).toBe(false);
    });
  });

  describe("extractActor", () => {
    it("pulls id and rol out of a decoded JWT payload, dropping other claims", () => {
      const decoded = { id: 3, username: "mgarcia", nombre: "María", rol: "operador", iat: 111, exp: 222 };
      expect(extractActor(decoded)).toEqual({ id: 3, rol: "operador" });
    });

    it("preserves admin rol from a different decoded payload", () => {
      const decoded = { id: 1, username: "admin", nombre: "Admin", rol: "admin", iat: 999, exp: 1000 };
      expect(extractActor(decoded)).toEqual({ id: 1, rol: "admin" });
    });
  });
});
