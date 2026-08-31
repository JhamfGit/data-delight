import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RegistrosFilterBar } from "./RegistrosFilterBar";
import { EMPTY_REGISTRO_FILTERS } from "@/types/admin";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: {
    getProyectos: vi.fn(),
    getUsuarios: vi.fn(),
  },
}));

function renderBar(filters = EMPTY_REGISTRO_FILTERS, onFilterChange = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <RegistrosFilterBar filters={filters} onFilterChange={onFilterChange} />
    </QueryClientProvider>
  );
  return onFilterChange;
}

describe("RegistrosFilterBar", () => {
  beforeEach(() => {
    vi.mocked(api.getProyectos).mockResolvedValue([
      { id: 1, nombre: "ACCENORTE", created_at: "2026-01-01T00:00:00.000Z", teamSlug: "accenorte", teamActive: true },
      { id: 2, nombre: "RUTA AL SUR", created_at: "2026-01-01T00:00:00.000Z", teamSlug: "ruta-sur", teamActive: true },
    ]);
    vi.mocked(api.getUsuarios).mockResolvedValue([
      { id: 10, username: "mgarcia", nombre: "María García", rol: "operador", activo: 1, created_at: "2026-01-01T00:00:00.000Z" },
      { id: 11, username: "jperez", nombre: "Juan Pérez", rol: "operador", activo: 1, created_at: "2026-01-01T00:00:00.000Z" },
    ]);
  });

  it("calls onFilterChange with the updated search term when the search input changes", () => {
    const onFilterChange = renderBar();

    fireEvent.change(screen.getByLabelText(/buscar/i), { target: { value: "1234567" } });

    expect(onFilterChange).toHaveBeenCalledWith({ q: "1234567" });
  });

  it("calls onFilterChange with the selected proyecto when a Proyecto option is picked", async () => {
    const onFilterChange = renderBar();

    fireEvent.click(await screen.findByLabelText(/^proyecto$/i));
    const option = await screen.findByRole("option", { name: "RUTA AL SUR" });
    fireEvent.click(option);

    expect(onFilterChange).toHaveBeenCalledWith({ proyecto: "RUTA AL SUR" });
  });

  it("calls onFilterChange with the selected usuario id when a Usuario option is picked", async () => {
    const onFilterChange = renderBar();

    fireEvent.click(await screen.findByLabelText(/^usuario$/i));
    const option = await screen.findByRole("option", { name: "Juan Pérez" });
    fireEvent.click(option);

    expect(onFilterChange).toHaveBeenCalledWith({ user_id: "11" });
  });

  it("reflects an already-active filter value from props back into its input", () => {
    renderBar({ ...EMPTY_REGISTRO_FILTERS, centro_operacion: "Centro Sur" });

    expect(screen.getByLabelText(/centro de operación/i)).toHaveValue("Centro Sur");
  });
});
