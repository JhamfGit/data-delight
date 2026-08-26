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
import { Textarea } from "@/components/ui/textarea";

interface UsuarioEstadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: AdminUser;
  onConfirm: (id: number, payload: { activo: boolean; reason: string }) => void;
  isSubmitting?: boolean;
}

/**
 * Activate/deactivate dialog for `/admin/usuarios` (design D5, spec
 * "Reversible Deactivation and Admin-Only Reactivation"). The reason is
 * mandatory for both directions, matching `changeUsuarioEstado`'s
 * `400 reason_required`. This page is already `AdminRoute`-gated (only
 * `admin` reaches it), so a non-admin `reactivate_forbidden`/`forbidden`
 * response is a server-side defense-in-depth case, not something this UI
 * needs a separate disabled-state branch for — there is no reachable
 * non-admin viewer of this control.
 */
export function UsuarioEstadoDialog({
  open,
  onOpenChange,
  usuario,
  onConfirm,
  isSubmitting = false,
}: UsuarioEstadoDialogProps) {
  const willDeactivate = Boolean(usuario.activo);
  const targetActivo = !willDeactivate;
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open, usuario.id]);

  const trimmedReason = reason.trim();
  const canConfirm = trimmedReason !== "" && !isSubmitting;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(usuario.id, { activo: targetActivo, reason: trimmedReason });
  };

  const actionLabel = willDeactivate ? "Desactivar usuario" : "Reactivar usuario";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionLabel}</DialogTitle>
          <DialogDescription>
            {willDeactivate
              ? `${usuario.nombre} no podrá autenticarse hasta ser reactivado. Sus registros e historial se conservan.`
              : `${usuario.nombre} podrá volver a autenticarse.`}
          </DialogDescription>
        </DialogHeader>

        <Textarea
          placeholder="Motivo (obligatorio)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant={willDeactivate ? "destructive" : "default"}
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
