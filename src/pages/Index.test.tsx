import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Index from "./Index";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: {
    getRegistros: vi.fn(),
  },
}));

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/dashboard" element={<Index />} />
        <Route path="/admin/registros" element={<p>Registros panel page</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Index — /admin/registros discoverability (sdd-verify WARNING fix)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.mocked(api.getRegistros).mockResolvedValue({
      data: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    });
  });

  it("shows a visible Registros nav link for an authenticated operador and navigates to /admin/registros on click", async () => {
    window.localStorage.setItem("userRol", "operador");
    window.localStorage.setItem("userNombre", "Juan Perez");

    renderDashboard();

    const button = screen.getByRole("button", { name: /registros/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Registros panel page")).toBeInTheDocument();
    });
  });

  it("also shows the Registros nav button for an authenticated admin, alongside the existing Usuarios button", async () => {
    window.localStorage.setItem("userRol", "admin");
    window.localStorage.setItem("userNombre", "Ana Admin");

    renderDashboard();

    expect(screen.getByRole("button", { name: /registros/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /usuarios/i })).toBeInTheDocument();
  });
});
