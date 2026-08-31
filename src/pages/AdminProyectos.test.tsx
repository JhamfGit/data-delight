import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminProyectos from "./AdminProyectos";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: {
    getProyectos: vi.fn(),
    createProyecto: vi.fn(),
    renameProyecto: vi.fn(),
    deleteProyecto: vi.fn(),
  },
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminProyectos />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("AdminProyectos — Chatwoot acknowledgment gate", () => {
  beforeEach(() => {
    vi.mocked(api.getProyectos).mockResolvedValue([
      { id: 1, nombre: "ACCENORTE", created_at: "2026-01-01T00:00:00.000Z" },
    ]);
  });

  it("keeps the create-dialog submit button disabled until both nombre and the Chatwoot checkbox are set", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /nuevo proyecto/i }));

    const submit = screen.getByRole("button", { name: /crear proyecto/i });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/^nombre \*$/i), { target: { value: "NUEVO PROYECTO" } });
    expect(submit).toBeDisabled(); // nombre alone is not enough

    fireEvent.click(screen.getByRole("checkbox"));
    expect(submit).not.toBeDisabled();
  });

  it("re-disables the submit button if the checkbox is unchecked again", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /nuevo proyecto/i }));
    fireEvent.change(screen.getByLabelText(/^nombre \*$/i), { target: { value: "NUEVO PROYECTO" } });
    fireEvent.click(screen.getByRole("checkbox"));

    const submit = screen.getByRole("button", { name: /crear proyecto/i });
    expect(submit).not.toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox"));
    expect(submit).toBeDisabled();
  });

  it("submits and shows the Chatwoot-reminder toast on success", async () => {
    vi.mocked(api.createProyecto).mockResolvedValue({ ok: true, id: 5, nombre: "NUEVO PROYECTO" });
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /nuevo proyecto/i }));
    fireEvent.change(screen.getByLabelText(/^nombre \*$/i), { target: { value: "NUEVO PROYECTO" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /crear proyecto/i }));

    await waitFor(() => {
      expect(api.createProyecto).toHaveBeenCalledWith("NUEVO PROYECTO");
    });
  });
});
