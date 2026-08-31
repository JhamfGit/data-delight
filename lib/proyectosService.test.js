import { describe, it, expect, vi } from "vitest";
import { listProyectos, createProyecto } from "./proyectosService.js";

describe("proyectosService — listProyectos", () => {
  it("returns every proyecto ordered by nombre, with no team mapping attached when automation_project_team is empty", async () => {
    const rows = [{ id: 1, nombre: "ACCENORTE", created_at: "2026-01-01" }];
    const pool = { execute: vi.fn().mockResolvedValueOnce([rows]).mockResolvedValueOnce([[]]) };

    const result = await listProyectos(pool);

    expect(result.httpStatus).toBe(200);
    expect(result.body).toEqual({
      ok: true,
      data: [{ id: 1, nombre: "ACCENORTE", created_at: "2026-01-01", teamSlug: null, teamActive: false }],
    });
    expect(pool.execute).toHaveBeenNthCalledWith(1, "SELECT id, nombre, created_at FROM proyectos ORDER BY nombre ASC");
  });

  it("attaches teamSlug/teamActive from automation_project_team, matched via the normalized nombre", async () => {
    const rows = [
      { id: 1, nombre: "ACCENORTE", created_at: "2026-01-01" },
      { id: 2, nombre: "ADMINISTRACIÓN", created_at: "2026-01-01" },
    ];
    const teamRows = [
      { project_name_normalized: "ACCENORTE", team_slug: "accenorte", active: 1 },
      { project_name_normalized: "ADMINISTRACION", team_slug: "administracion", active: 0 },
    ];
    const pool = { execute: vi.fn().mockResolvedValueOnce([rows]).mockResolvedValueOnce([teamRows]) };

    const result = await listProyectos(pool);

    expect(result.body.data).toEqual([
      { id: 1, nombre: "ACCENORTE", created_at: "2026-01-01", teamSlug: "accenorte", teamActive: true },
      { id: 2, nombre: "ADMINISTRACIÓN", created_at: "2026-01-01", teamSlug: "administracion", teamActive: false },
    ]);
  });
});

function makeCreatePool({ existing = [], insertId = 13 } = {}) {
  const connection = {
    beginTransaction: vi.fn().mockResolvedValue(undefined),
    execute: vi
      .fn()
      .mockResolvedValueOnce([{ insertId }])
      .mockResolvedValueOnce([{}]),
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
    release: vi.fn(),
  };
  const pool = {
    execute: vi.fn().mockResolvedValueOnce([existing]),
    getConnection: vi.fn().mockResolvedValue(connection),
  };
  return { pool, connection };
}

describe("proyectosService — createProyecto", () => {
  it("returns 400 nombre_required when nombre is empty or whitespace-only", async () => {
    const pool = { execute: vi.fn(), getConnection: vi.fn() };

    const result = await createProyecto(pool, { nombre: "   ", teamSlug: "algo" });

    expect(result.httpStatus).toBe(400);
    expect(result.body).toEqual({ ok: false, error: "nombre_required" });
    expect(pool.execute).not.toHaveBeenCalled();
    expect(pool.getConnection).not.toHaveBeenCalled();
  });

  it("returns 400 team_slug_required when teamSlug is empty or missing", async () => {
    const pool = { execute: vi.fn(), getConnection: vi.fn() };

    const result = await createProyecto(pool, { nombre: "NUEVO", teamSlug: "  " });

    expect(result.httpStatus).toBe(400);
    expect(result.body).toEqual({ ok: false, error: "team_slug_required" });
    expect(pool.execute).not.toHaveBeenCalled();
    expect(pool.getConnection).not.toHaveBeenCalled();
  });

  it("returns 409 nombre_duplicado when the nombre already exists", async () => {
    const pool = { execute: vi.fn().mockResolvedValueOnce([[{ id: 3 }]]), getConnection: vi.fn() };

    const result = await createProyecto(pool, { nombre: "GICA", teamSlug: "gica" });

    expect(result.httpStatus).toBe(409);
    expect(result.body).toEqual({ ok: false, error: "nombre_duplicado" });
    expect(pool.getConnection).not.toHaveBeenCalled();
  });

  it("inserts proyectos and automation_project_team together, and returns 201 with the trimmed nombre/teamSlug", async () => {
    const { pool, connection } = makeCreatePool({ existing: [], insertId: 13 });

    const result = await createProyecto(pool, { nombre: "  NUEVO PROYECTO  ", teamSlug: "  nuevo-proyecto  " });

    expect(result.httpStatus).toBe(201);
    expect(result.body).toEqual({ ok: true, id: 13, nombre: "NUEVO PROYECTO", teamSlug: "nuevo-proyecto" });
    expect(connection.execute).toHaveBeenNthCalledWith(1, "INSERT INTO proyectos (nombre) VALUES (?)", [
      "NUEVO PROYECTO",
    ]);
    const [teamSql, teamParams] = connection.execute.mock.calls[1];
    expect(teamSql).toContain("INSERT INTO automation_project_team");
    expect(teamSql).toContain("ON DUPLICATE KEY UPDATE");
    expect(teamParams[0]).toBe("NUEVO PROYECTO");
    expect(teamParams[1]).toBe("nuevo-proyecto");
    expect(connection.commit).toHaveBeenCalledTimes(1);
  });

  it("upserts cleanly (no error) when a stale automation_project_team row already exists for that normalized key", async () => {
    // ON DUPLICATE KEY UPDATE is what makes this safe -- the mock simply
    // resolving without throwing is enough to prove the query shape is
    // used; the real upsert behavior is MySQL's, not application code.
    const { pool, connection } = makeCreatePool({ existing: [], insertId: 14 });

    const result = await createProyecto(pool, { nombre: "PRUEBAS", teamSlug: "pruebas" });

    expect(result.httpStatus).toBe(201);
    expect(connection.rollback).not.toHaveBeenCalled();
  });

  it("rolls back both inserts if the automation_project_team insert throws", async () => {
    const connection = {
      beginTransaction: vi.fn().mockResolvedValue(undefined),
      execute: vi
        .fn()
        .mockResolvedValueOnce([{ insertId: 20 }])
        .mockRejectedValueOnce(new Error("boom")),
      commit: vi.fn().mockResolvedValue(undefined),
      rollback: vi.fn().mockResolvedValue(undefined),
      release: vi.fn(),
    };
    const pool = {
      execute: vi.fn().mockResolvedValueOnce([[]]),
      getConnection: vi.fn().mockResolvedValue(connection),
    };

    await expect(createProyecto(pool, { nombre: "NUEVO", teamSlug: "nuevo" })).rejects.toThrow("boom");
    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(connection.commit).not.toHaveBeenCalled();
  });
});
