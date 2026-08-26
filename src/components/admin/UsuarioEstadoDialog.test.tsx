import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UsuarioEstadoDialog } from "./UsuarioEstadoDialog";

const activeUsuario = { id: 3, username: "jperez", nombre: "Juan Perez", rol: "operador" as const, activo: 1, created_at: "2026-01-01" };
const inactiveUsuario = { ...activeUsuario, id: 4, activo: 0 };

describe("UsuarioEstadoDialog", () => {
  it("offers to deactivate an active usuario and requires a reason before confirming", () => {
    const onConfirm = vi.fn();
    render(
      <UsuarioEstadoDialog open onOpenChange={() => {}} usuario={activeUsuario} onConfirm={onConfirm} />
    );

    expect(screen.getByRole("button", { name: /desactivar usuario/i })).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/motivo/i), { target: { value: "Fin de contrato" } });
    fireEvent.click(screen.getByRole("button", { name: /desactivar usuario/i }));

    expect(onConfirm).toHaveBeenCalledWith(activeUsuario.id, { activo: false, reason: "Fin de contrato" });
  });

  it("offers to reactivate an inactive usuario and requires a reason before confirming", () => {
    const onConfirm = vi.fn();
    render(
      <UsuarioEstadoDialog open onOpenChange={() => {}} usuario={inactiveUsuario} onConfirm={onConfirm} />
    );

    expect(screen.getByRole("button", { name: /reactivar usuario/i })).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/motivo/i), { target: { value: "Reingreso aprobado" } });
    fireEvent.click(screen.getByRole("button", { name: /reactivar usuario/i }));

    expect(onConfirm).toHaveBeenCalledWith(inactiveUsuario.id, { activo: true, reason: "Reingreso aprobado" });
  });

  it("keeps the confirm button disabled when the reason is whitespace-only", () => {
    render(
      <UsuarioEstadoDialog open onOpenChange={() => {}} usuario={activeUsuario} onConfirm={vi.fn()} />
    );

    fireEvent.change(screen.getByPlaceholderText(/motivo/i), { target: { value: "   " } });
    expect(screen.getByRole("button", { name: /desactivar usuario/i })).toBeDisabled();
  });
});
