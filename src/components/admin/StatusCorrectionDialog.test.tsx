import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StatusCorrectionDialog } from "./StatusCorrectionDialog";

describe("StatusCorrectionDialog", () => {
  it("disables the submit button until a non-empty reason is entered", () => {
    const onConfirm = vi.fn();
    render(
      <StatusCorrectionDialog
        open
        onOpenChange={() => {}}
        currentStatus="NO"
        onConfirm={onConfirm}
      />
    );

    const submit = screen.getByRole("button", { name: /confirmar corrección/i });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/motivo de la corrección/i), {
      target: { value: "Corrección administrativa" },
    });

    expect(submit).toBeEnabled();
  });

  it("keeps the submit button disabled when the reason is whitespace-only", () => {
    render(
      <StatusCorrectionDialog
        open
        onOpenChange={() => {}}
        currentStatus="NO"
        onConfirm={vi.fn()}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/motivo de la corrección/i), {
      target: { value: "   " },
    });

    expect(screen.getByRole("button", { name: /confirmar corrección/i })).toBeDisabled();
  });

  it("calls onConfirm with the trimmed reason and the allowed target status when submitted", () => {
    const onConfirm = vi.fn();
    render(
      <StatusCorrectionDialog
        open
        onOpenChange={() => {}}
        currentStatus="NO"
        onConfirm={onConfirm}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/motivo de la corrección/i), {
      target: { value: "  Dato verificado en sitio  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /confirmar corrección/i }));

    expect(onConfirm).toHaveBeenCalledWith("SI", "Dato verificado en sitio");
  });

  it("renders a disabled control and no reason textarea for a status with no known transitions", () => {
    const onConfirm = vi.fn();
    render(
      <StatusCorrectionDialog
        open
        onOpenChange={() => {}}
        currentStatus="FAILED"
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent("FAILED");
    expect(screen.queryByPlaceholderText(/motivo de la corrección/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirmar corrección/i })).toBeDisabled();
  });
});
