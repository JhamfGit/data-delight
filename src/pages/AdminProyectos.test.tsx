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
      { id: 1, nombre: "ACCENORTE", created_at: "2026-01-01T00:00:00.000Z", teamSlug: "accenorte", teamActive: true },
    ]);
  });

  it("keeps the create-dialog submit button disabled until nombre, teamSlug, and the checkbox are all set", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /nuevo proyecto/i }));

    const submit = screen.getByRole("button", { name: /crear proyecto/i });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/^nombre \*$/i), { target: { value: "NUEVO PROYECTO" } });
    expect(submit).toBeDisabled(); // nombre alone is not enough

    fireEvent.change(screen.getByLabelText(/etiqueta en la plataforma omnicanal \*/i), {
      target: { value: "nuevo-proyecto" },
    });
    expect(submit).toBeDisabled(); // nombre + teamSlug still isn't enough without the checkbox

    fireEvent.click(screen.getByRole("checkbox"));
    expect(submit).not.toBeDisabled();
  });

  it("re-disables the submit button if the checkbox is unchecked again", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /nuevo proyecto/i }));
    fireEvent.change(screen.getByLabelText(/^nombre \*$/i), { target: { value: "NUEVO PROYECTO" } });
    fireEvent.change(screen.getByLabelText(/etiqueta en la plataforma omnicanal \*/i), {
      target: { value: "nuevo-proyecto" },
    });
    fireEvent.click(screen.getByRole("checkbox"));

    const submit = screen.getByRole("button", { name: /crear proyecto/i });
    expect(submit).not.toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox"));
    expect(submit).toBeDisabled();
  });

  it("re-disables the submit button if teamSlug is cleared after being filled", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /nuevo proyecto/i }));
    fireEvent.change(screen.getByLabelText(/^nombre \*$/i), { target: { value: "NUEVO PROYECTO" } });
    const teamSlugInput = screen.getByLabelText(/etiqueta en la plataforma omnicanal \*/i);
    fireEvent.change(teamSlugInput, { target: { value: "nuevo-proyecto" } });
    fireEvent.click(screen.getByRole("checkbox"));

    const submit = screen.getByRole("button", { name: /crear proyecto/i });
    expect(submit).not.toBeDisabled();

    fireEvent.change(teamSlugInput, { target: { value: "" } });
    expect(submit).toBeDisabled();
  });

  it("submits with both nombre and teamSlug on success", async () => {
    vi.mocked(api.createProyecto).mockResolvedValue({ ok: true, id: 5, nombre: "NUEVO PROYECTO", teamSlug: "nuevo-proyecto" });
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /nuevo proyecto/i }));
    fireEvent.change(screen.getByLabelText(/^nombre \*$/i), { target: { value: "NUEVO PROYECTO" } });
    fireEvent.change(screen.getByLabelText(/etiqueta en la plataforma omnicanal \*/i), {
      target: { value: "nuevo-proyecto" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /crear proyecto/i }));

    await waitFor(() => {
      expect(api.createProyecto).toHaveBeenCalledWith("NUEVO PROYECTO", "nuevo-proyecto");
    });
  });
});

describe("AdminProyectos — table surfaces unmapped proyectos", () => {
  it('shows a "Sin etiqueta" badge for a proyecto with no automation_project_team mapping', async () => {
    vi.mocked(api.getProyectos).mockResolvedValue([
      { id: 1, nombre: "ACCENORTE", created_at: "2026-01-01T00:00:00.000Z", teamSlug: "accenorte", teamActive: true },
      { id: 2, nombre: "PRUEBAS", created_at: "2026-01-01T00:00:00.000Z", teamSlug: null, teamActive: false },
    ]);
    renderPage();

    expect(await screen.findByText("Sin etiqueta")).toBeInTheDocument();
    expect(screen.getByText("accenorte")).toBeInTheDocument();
  });
});
