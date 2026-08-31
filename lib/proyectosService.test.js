import { describe, it, expect, vi } from "vitest";
import { listProyectos, createProyecto } from "./proyectosService.js";

describe("proyectosService — listProyectos", () => {
  it("returns every proyecto ordered by nombre", async () => {
    const rows = [{ id: 1, nombre: "ACCENORTE", created_at: "2026-01-01" }];
    const pool = { execute: vi.fn().mockResolvedValue([rows]) };

    const result = await listProyectos(pool);

    expect(result.httpStatus).toBe(200);
    expect(result.body).toEqual({ ok: true, data: rows });
    expect(pool.execute).toHaveBeenCalledWith("SELECT id, nombre, created_at FROM proyectos ORDER BY nombre ASC");
  });
});

describe("proyectosService — createProyecto", () => {
  it("returns 400 nombre_required when nombre is empty or whitespace-only", async () => {
    const pool = { execute: vi.fn() };

    const result = await createProyecto(pool, { nombre: "   " });

    expect(result.httpStatus).toBe(400);
    expect(result.body).toEqual({ ok: false, error: "nombre_required" });
    expect(pool.execute).not.toHaveBeenCalled();
  });

  it("returns 409 nombre_duplicado when the nombre already exists", async () => {
    const pool = { execute: vi.fn().mockResolvedValueOnce([[{ id: 3 }]]) };

    const result = await createProyecto(pool, { nombre: "GICA" });

    expect(result.httpStatus).toBe(409);
    expect(result.body).toEqual({ ok: false, error: "nombre_duplicado" });
    expect(pool.execute).toHaveBeenCalledTimes(1);
  });

  it("inserts and returns 201 with the trimmed nombre when it does not exist yet", async () => {
    const pool = {
      execute: vi
        .fn()
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{ insertId: 13 }]),
    };

    const result = await createProyecto(pool, { nombre: "  NUEVO PROYECTO  " });

    expect(result.httpStatus).toBe(201);
    expect(result.body).toEqual({ ok: true, id: 13, nombre: "NUEVO PROYECTO" });
    expect(pool.execute).toHaveBeenNthCalledWith(2, "INSERT INTO proyectos (nombre) VALUES (?)", [
      "NUEVO PROYECTO",
    ]);
  });
});
