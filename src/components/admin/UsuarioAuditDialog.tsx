import { useQuery } from "@tanstack/react-query";
import { AdminUser } from "@/types/employee";
import { api } from "@/lib/api";
import { AuditTimeline } from "@/components/admin/AuditTimeline";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface UsuarioAuditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: AdminUser | null;
}

/**
 * Usuario audit-trail viewer for `/admin/usuarios` (sdd-verify CRITICAL-2
 * fix — spec "Audited Usuario Lifecycle Changes": every create/edit/
 * deactivate/reactivate action MUST be viewable inside the panel). Backend
 * persistence (`GET /api/admin/usuarios/:id/audit` → `getUsuarioAuditLog`)
 * and the frontend fetch wrapper (`api.getUsuarioAudit`) already existed and
 * were already tested — this component is purely the missing presentational
 * wiring, reusing the same `AuditTimeline` already built for registros audit.
 */
export function UsuarioAuditDialog({ open, onOpenChange, usuario }: UsuarioAuditDialogProps) {
  const auditQuery = useQuery({
    queryKey: ["audit", "usuario", usuario ? String(usuario.id) : ""],
    queryFn: () => api.getUsuarioAudit(usuario!.id),
    enabled: open && !!usuario,
  });

  const entries = auditQuery.data?.ok ? auditQuery.data.data : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Auditoría de {usuario?.nombre}</DialogTitle>
          <DialogDescription>
            Historial de cambios auditados para este usuario (creación, edición,
            activación/desactivación).
          </DialogDescription>
        </DialogHeader>

        {auditQuery.isLoading ? (
          <p className="text-sm text-muted-foreground py-4">Cargando...</p>
        ) : (
          <AuditTimeline entries={entries} />
        )}
      </DialogContent>
    </Dialog>
  );
}
