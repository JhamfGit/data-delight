import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RegistrosFilterBar } from "./RegistrosFilterBar";
import { EMPTY_REGISTRO_FILTERS } from "@/types/admin";

describe("RegistrosFilterBar", () => {
  it("calls onFilterChange with the updated search term when the search input changes", () => {
    const onFilterChange = vi.fn();
    render(<RegistrosFilterBar filters={EMPTY_REGISTRO_FILTERS} onFilterChange={onFilterChange} />);

    fireEvent.change(screen.getByLabelText(/buscar/i), { target: { value: "1234567" } });

    expect(onFilterChange).toHaveBeenCalledWith({ q: "1234567" });
  });

  it("calls onFilterChange with the updated proyecto when that input changes", () => {
    const onFilterChange = vi.fn();
    render(<RegistrosFilterBar filters={EMPTY_REGISTRO_FILTERS} onFilterChange={onFilterChange} />);

    fireEvent.change(screen.getByLabelText(/proyecto/i), { target: { value: "Obra Norte" } });

    expect(onFilterChange).toHaveBeenCalledWith({ proyecto: "Obra Norte" });
  });

  it("reflects an already-active filter value from props back into its input", () => {
    render(
      <RegistrosFilterBar
        filters={{ ...EMPTY_REGISTRO_FILTERS, centro_operacion: "Centro Sur" }}
        onFilterChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/centro de operación/i)).toHaveValue("Centro Sur");
  });
});
