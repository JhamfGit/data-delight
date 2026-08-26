import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UsuarioEditDialog } from "./UsuarioEditDialog";

const usuario = { id: 7, username: "mgarcia", nombre: "Maria Garcia", rol: "operador" as const, activo: 1, created_at: "2026-01-01" };

describe("UsuarioEditDialog", () => {
  it("submits only nombre when the nombre form is saved, never combined with rol", () => {
    const onSaveNombre = vi.fn();
    const onSaveRol = vi.fn();
    render(
      <UsuarioEditDialog
        open
        onOpenChange={() => {}}
        usuario={usuario}
        onSaveNombre={onSaveNombre}
        onSaveRol={onSaveRol}
      />
    );

    fireEvent.change(screen.getByLabelText(/nuevo nombre/i), { target: { value: "Maria G. Perez" } });
    fireEvent.change(screen.getByLabelText(/motivo del cambio de nombre/i), {
      target: { value: "Corrección de apellido" },
    });
    fireEvent.click(screen.getByRole("button", { name: /guardar nombre/i }));

    expect(onSaveNombre).toHaveBeenCalledWith(usuario.id, {
      nombre: "Maria G. Perez",
      reason: "Corrección de apellido",
    });
    expect(onSaveRol).not.toHaveBeenCalled();
  });

  it("disables the nombre save button until a reason is provided", () => {
    render(
      <UsuarioEditDialog
        open
        onOpenChange={() => {}}
        usuario={usuario}
        onSaveNombre={vi.fn()}
        onSaveRol={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/nuevo nombre/i), { target: { value: "Otro Nombre" } });
    expect(screen.getByRole("button", { name: /guardar nombre/i })).toBeDisabled();
  });

  it("submits only rol when the rol form is saved, never combined with nombre", () => {
    const onSaveNombre = vi.fn();
    const onSaveRol = vi.fn();
    render(
      <UsuarioEditDialog
        open
        onOpenChange={() => {}}
        usuario={usuario}
        onSaveNombre={onSaveNombre}
        onSaveRol={onSaveRol}
      />
    );

    fireEvent.change(screen.getByLabelText(/motivo del cambio de rol/i), {
      target: { value: "Promoción a administrador" },
    });
    fireEvent.click(screen.getByRole("button", { name: /guardar rol/i }));

    expect(onSaveRol).toHaveBeenCalledWith(usuario.id, {
      rol: "operador",
      reason: "Promoción a administrador",
    });
    expect(onSaveNombre).not.toHaveBeenCalled();
  });

  it("disables the rol save button until a reason is provided", () => {
    render(
      <UsuarioEditDialog
        open
        onOpenChange={() => {}}
        usuario={usuario}
        onSaveNombre={vi.fn()}
        onSaveRol={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /guardar rol/i })).toBeDisabled();
  });
});
