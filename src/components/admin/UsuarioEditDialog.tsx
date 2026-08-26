import { useEffect, useState } from "react";
import { AdminUser } from "@/types/employee";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface UsuarioEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: AdminUser;
  onSaveNombre: (id: number, payload: { nombre: string; reason: string }) => void;
  onSaveRol: (id: number, payload: { rol: string; reason: string }) => void;
  isSubmittingNombre?: boolean;
  isSubmittingRol?: boolean;
}

/**
 * Admin-only usuario edit dialog. `PATCH /api/admin/usuarios/:id` accepts
 * exactly one of `nombre`/`rol` per call (confirmed in `lib/usuariosService.js`
 * — `admin_audit_log` is single-field-per-row, so a combined edit has no
 * faithful single-row audit representation). Rather than a single form that
 * could tempt a caller into sending both fields, this renders two
 * independent mini-forms — each with its own mandatory reason and its own
 * save action — so the UI can never construct a combined-field request.
 */
export function UsuarioEditDialog({
  open,
  onOpenChange,
  usuario,
  onSaveNombre,
  onSaveRol,
  isSubmittingNombre = false,
  isSubmittingRol = false,
}: UsuarioEditDialogProps) {
  const [nombre, setNombre] = useState(usuario.nombre);
  const [nombreReason, setNombreReason] = useState("");
  const [rol, setRol] = useState<string>(usuario.rol);
  const [rolReason, setRolReason] = useState("");

  useEffect(() => {
    if (open) {
      setNombre(usuario.nombre);
      setNombreReason("");
      setRol(usuario.rol);
      setRolReason("");
    }
  }, [open, usuario]);

  const trimmedNombreReason = nombreReason.trim();
  const trimmedNombre = nombre.trim();
  const canSaveNombre =
    trimmedNombre !== "" && trimmedNombreReason !== "" && !isSubmittingNombre;

  const trimmedRolReason = rolReason.trim();
  const canSaveRol = trimmedRolReason !== "" && !isSubmittingRol;

  const handleSaveNombre = () => {
    if (!canSaveNombre) return;
    onSaveNombre(usuario.id, { nombre: trimmedNombre, reason: trimmedNombreReason });
  };

  const handleSaveRol = () => {
    if (!canSaveRol) return;
    onSaveRol(usuario.id, { rol, reason: trimmedRolReason });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar usuario — {usuario.username}</DialogTitle>
          <DialogDescription>
            Cada guardado actualiza un único campo (nombre o rol) para mantener una auditoría
            de un campo por registro.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-nombre">Nuevo nombre</Label>
            <Input id="edit-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            <Label htmlFor="edit-nombre-reason">Motivo del cambio de nombre</Label>
            <Textarea
              id="edit-nombre-reason"
              placeholder="Motivo (obligatorio)"
              value={nombreReason}
              onChange={(e) => setNombreReason(e.target.value)}
            />
            <Button type="button" size="sm" disabled={!canSaveNombre} onClick={handleSaveNombre}>
              Guardar nombre
            </Button>
          </div>

          <Separator />

          <div className="grid gap-2">
            <Label htmlFor="edit-rol">Nuevo rol</Label>
            <Select value={rol} onValueChange={setRol}>
              <SelectTrigger id="edit-rol">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operador">Operador</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
            <Label htmlFor="edit-rol-reason">Motivo del cambio de rol</Label>
            <Textarea
              id="edit-rol-reason"
              placeholder="Motivo (obligatorio)"
              value={rolReason}
              onChange={(e) => setRolReason(e.target.value)}
            />
            <Button type="button" size="sm" disabled={!canSaveRol} onClick={handleSaveRol}>
              Guardar rol
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
