import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DataTable from "./DataTable";
import type { Employee } from "@/types/employee";

const sampleData: Employee[] = [
  {
    id: "1",
    proyecto: "ACCENORTE",
    centroOperacion: "Bogota",
    cargo: "Aux",
    cedula: "123",
    nombre: "Juan Perez",
    numero: "573000000000",
    status: "SI",
  },
];

const baseProps = {
  data: sampleData,
  onDelete: vi.fn(),
  onClear: vi.fn(),
  onStartProcess: vi.fn(),
};

describe("DataTable — delete permissions", () => {
  it("hides 'Limpiar' and the per-row delete button in saved mode when canDelete is false", () => {
    render(<DataTable {...baseProps} mode="saved" canDelete={false} />);

    expect(screen.queryByRole("button", { name: /limpiar/i })).not.toBeInTheDocument();
    // The per-row delete button has no accessible name (icon-only), so its
    // column must be gone entirely -- assert via header cell count instead.
    expect(screen.getAllByRole("columnheader")).toHaveLength(7);
  });

  it("shows 'Limpiar' and the per-row delete button in saved mode when canDelete is true", () => {
    render(<DataTable {...baseProps} mode="saved" canDelete={true} />);

    expect(screen.getByRole("button", { name: /limpiar/i })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(8);
  });

  it("defaults canDelete to true when the prop is omitted", () => {
    render(<DataTable {...baseProps} mode="saved" />);

    expect(screen.getByRole("button", { name: /limpiar/i })).toBeInTheDocument();
  });

  it("keeps delete controls in pending mode even when canDelete is false -- pending never touches the DB", () => {
    render(<DataTable {...baseProps} mode="pending" canDelete={false} />);

    expect(screen.getByRole("button", { name: /limpiar/i })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(8);
  });
});
