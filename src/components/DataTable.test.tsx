import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

describe("DataTable — numbered pagination", () => {
  const pagination = { total: 95, page: 5, limit: 10, totalPages: 10 };

  it("renders the collapsed page-number range around the current page, with the current page marked active", () => {
    render(<DataTable {...baseProps} mode="saved" pagination={pagination} onPageChange={vi.fn()} />);

    // getPaginationRange(5, 10) -> [1, "…", 4, 5, 6, "…", 10]
    for (const page of [1, 4, 5, 6, 10]) {
      expect(screen.getByRole("link", { name: String(page) })).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: "5" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "1" })).not.toHaveAttribute("aria-current");
    expect(screen.getAllByText("More pages")).toHaveLength(2); // sr-only label on each ellipsis
  });

  it("calls onPageChange with the clicked page number, not the current one", () => {
    const onPageChange = vi.fn();
    render(<DataTable {...baseProps} mode="saved" pagination={pagination} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole("link", { name: "6" }));
    expect(onPageChange).toHaveBeenCalledWith(6);

    onPageChange.mockClear();
    fireEvent.click(screen.getByRole("link", { name: "5" })); // already the current page
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("Previous/Next step the page by one and disable at the first/last page", () => {
    const onPageChange = vi.fn();
    const { rerender } = render(
      <DataTable {...baseProps} mode="saved" pagination={pagination} onPageChange={onPageChange} />,
    );

    fireEvent.click(screen.getByRole("link", { name: /go to previous page/i }));
    expect(onPageChange).toHaveBeenCalledWith(4);
    onPageChange.mockClear();
    fireEvent.click(screen.getByRole("link", { name: /go to next page/i }));
    expect(onPageChange).toHaveBeenCalledWith(6);

    rerender(
      <DataTable
        {...baseProps}
        mode="saved"
        pagination={{ ...pagination, page: 1 }}
        onPageChange={onPageChange}
      />,
    );
    onPageChange.mockClear();
    fireEvent.click(screen.getByRole("link", { name: /go to previous page/i }));
    expect(onPageChange).not.toHaveBeenCalled();

    rerender(
      <DataTable
        {...baseProps}
        mode="saved"
        pagination={{ ...pagination, page: 10 }}
        onPageChange={onPageChange}
      />,
    );
    fireEvent.click(screen.getByRole("link", { name: /go to next page/i }));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("renders no pagination controls at all for a single-page result", () => {
    render(
      <DataTable
        {...baseProps}
        mode="saved"
        pagination={{ total: 3, page: 1, limit: 10, totalPages: 1 }}
      />,
    );

    expect(screen.queryByRole("navigation", { name: /pagination/i })).not.toBeInTheDocument();
  });
});
