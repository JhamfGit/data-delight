import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminRegistroDetail from "./AdminRegistroDetail";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: {
    getRegistroDetail: vi.fn(),
    getRegistroAudit: vi.fn(),
    changeRegistroStatus: vi.fn(),
  },
}));

const registro = {
  id_registro: 42,
  user_id: 7,
  proyecto: "Obra Norte",
  centro_operacion: "Centro Sur",
  cargo: "Operario",
  cedula: "1234567",
  nombre: "Maria Garcia",
  numero: "3001234567",
  status: "NO",
  created_at: "2026-08-20T10:00:00.000Z",
};

function renderDetail(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/admin/registros/42"]}>
        <Routes>
          <Route path="/admin/registros/:id" element={<AdminRegistroDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("AdminRegistroDetail", () => {
  beforeEach(() => {
    vi.mocked(api.getRegistroDetail).mockResolvedValue({ ok: true, data: registro });
    vi.mocked(api.getRegistroAudit).mockResolvedValue({ ok: true, data: [] });
    vi.mocked(api.changeRegistroStatus).mockResolvedValue({ ok: true, status: "SI", auditId: 99 });
  });

  it("renders the fetched registro and invalidates the registro + audit + list query keys after a successful status correction", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    renderDetail(queryClient);

    await screen.findByText("Maria Garcia");

    fireEvent.click(screen.getByRole("button", { name: /corregir estado/i }));
    fireEvent.change(screen.getByPlaceholderText(/motivo de la corrección/i), {
      target: { value: "Confirmado en sitio" },
    });
    fireEvent.click(screen.getByRole("button", { name: /confirmar corrección/i }));

    await waitFor(() => {
      expect(api.changeRegistroStatus).toHaveBeenCalledWith("42", {
        fromStatus: "NO",
        toStatus: "SI",
        reason: "Confirmado en sitio",
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["registro", "42"] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["audit", "registro", "42"] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["registros"] });
    });
  });

  it("does not invalidate any query when the mutation returns a non-ok result (e.g. stale status)", async () => {
    vi.mocked(api.changeRegistroStatus).mockResolvedValue({ ok: false, error: "stale_status" });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    renderDetail(queryClient);

    await screen.findByText("Maria Garcia");
    fireEvent.click(screen.getByRole("button", { name: /corregir estado/i }));
    fireEvent.change(screen.getByPlaceholderText(/motivo de la corrección/i), {
      target: { value: "Confirmado en sitio" },
    });
    fireEvent.click(screen.getByRole("button", { name: /confirmar corrección/i }));

    await waitFor(() => {
      expect(api.changeRegistroStatus).toHaveBeenCalled();
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
