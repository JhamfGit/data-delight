import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Proyecto } from "@/types/employee";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { FolderKanban, Plus, Pencil, Trash2, ArrowLeft, AlertTriangle } from "lucide-react";

/**
 * Warning shown in every create/rename/delete dialog: this app never talks
 * to Chatwoot's API -- a different service (regency_rrhh_automamtion) reads
 * `registros.proyecto` by exact string match to route WhatsApp conversations
 * to a Chatwoot team label. A proyecto here with no matching label there
 * silently fails to route, which has already bitten this client once
 * (CPC2526/CPC256 label mismatch). The checkbox is required, not just a
 * passive message, so the admin cannot skip acknowledging it.
 */
function ChatwootWarning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

const AdminProyectos = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Proyecto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Proyecto | null>(null);

  const [createNombre, setCreateNombre] = useState("");
  const [createAck, setCreateAck] = useState(false);

  const [editNombre, setEditNombre] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editAck, setEditAck] = useState(false);

  const [deleteReason, setDeleteReason] = useState("");
  const [deleteAck, setDeleteAck] = useState(false);

  const proyectosQuery = useQuery({
    queryKey: ["proyectos"],
    queryFn: () => api.getProyectos(),
  });
  const proyectos = proyectosQuery.data ?? [];
  const loading = proyectosQuery.isLoading;

  const invalidateProyectos = () => {
    queryClient.invalidateQueries({ queryKey: ["proyectos"] });
  };

  const createMutation = useMutation({
    mutationFn: (nombre: string) => api.createProyecto(nombre),
    onSuccess: (result, nombre) => {
      if (!result.ok) {
        toast.error(
          result.error === "nombre_duplicado" ? "Ya existe un proyecto con ese nombre" : (result.error || "No se pudo crear el proyecto")
        );
        return;
      }
      toast.success(`Proyecto "${nombre}" creado. Recuerda crear también la etiqueta en Chatwoot.`);
      setShowCreateModal(false);
      setCreateNombre("");
      setCreateAck(false);
      invalidateProyectos();
    },
    onError: () => toast.error("Error de conexión"),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { nombre: string; reason: string } }) =>
      api.renameProyecto(id, payload),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(
          result.error === "nombre_duplicado" ? "Ya existe un proyecto con ese nombre" : (result.error || "No se pudo renombrar el proyecto")
        );
        return;
      }
      toast.success(`Proyecto renombrado a "${result.nombre}". Recuerda actualizar también la etiqueta en Chatwoot.`);
      setEditTarget(null);
      invalidateProyectos();
    },
    onError: () => toast.error("Error de conexión"),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { reason: string } }) => api.deleteProyecto(id, payload),
    onSuccess: (result) => {
      if (!result.ok) {
        if (result.error === "proyecto_has_history") {
          toast.error("No se puede eliminar: ya hay registros que usan este proyecto.");
        } else {
          toast.error(result.error || "No se pudo eliminar el proyecto");
        }
        return;
      }
      toast.success("Proyecto eliminado. Recuerda eliminar también la etiqueta en Chatwoot.");
      setDeleteTarget(null);
      invalidateProyectos();
    },
    onError: () => toast.error("Error de conexión"),
  });

  const canCreate = createNombre.trim() !== "" && createAck && !createMutation.isPending;
  const canEdit = editNombre.trim() !== "" && editReason.trim() !== "" && editAck && !renameMutation.isPending;
  const canDelete = deleteReason.trim() !== "" && deleteAck && !deleteMutation.isPending;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    createMutation.mutate(createNombre.trim());
  };

  const openEdit = (p: Proyecto) => {
    setEditTarget(p);
    setEditNombre(p.nombre);
    setEditReason("");
    setEditAck(false);
  };

  const openDelete = (p: Proyecto) => {
    setDeleteTarget(p);
    setDeleteReason("");
    setDeleteAck(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-header py-8 px-4">
        <div className="container mx-auto flex items-center gap-3">
          <div className="p-3 bg-primary-foreground/20 rounded-xl">
            <img src="/r.png" alt="Regency Logo" className="h-8 w-8 object-contain" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">
              Panel de Administración
            </h1>
            <p className="text-primary-foreground/80">Catálogo de proyectos</p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden md:inline">Volver</span>
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="card-shadow border-0">
          <CardHeader className="gradient-header rounded-t-xl">
            <div className="flex items-center justify-between">
              <CardTitle className="flex gap-2 text-primary-foreground">
                <FolderKanban className="h-5 w-5" />
                Proyectos ({proyectos.length})
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Proyecto
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                <span className="text-muted-foreground">Cargando proyectos...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proyectos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No hay proyectos registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    proyectos.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.nombre}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString("es-CO")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" title="Editar proyecto" onClick={() => openEdit(p)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" title="Eliminar proyecto" onClick={() => openDelete(p)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Crear proyecto */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nuevo Proyecto
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="create-nombre">Nombre *</Label>
                <Input
                  id="create-nombre"
                  placeholder="Ej: NUEVO PROYECTO"
                  value={createNombre}
                  onChange={(e) => setCreateNombre(e.target.value)}
                  required
                />
              </div>
              <ChatwootWarning>
                Al crear un proyecto también debes crear la etiqueta correspondiente en la plataforma
                multicanal (Chatwoot); si no lo haces, las conversaciones de este proyecto no se
                enrutarán correctamente.
              </ChatwootWarning>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="create-ack"
                  checked={createAck}
                  onCheckedChange={(v) => setCreateAck(v === true)}
                />
                <Label htmlFor="create-ack" className="text-sm font-normal leading-tight">
                  Confirmo que también crearé la etiqueta correspondiente en la plataforma multicanal
                  (Chatwoot) para este proyecto.
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={createMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={!canCreate} className="gradient-primary text-white">
                {createMutation.isPending ? "Creando..." : "Crear Proyecto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Editar proyecto */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar proyecto — {editTarget?.nombre}</DialogTitle>
            <DialogDescription>Cambiar el nombre requiere un motivo; queda auditado.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-nombre">Nuevo nombre</Label>
              <Input id="edit-nombre" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} />
              <Label htmlFor="edit-reason">Motivo del cambio</Label>
              <Textarea
                id="edit-reason"
                placeholder="Motivo (obligatorio)"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
              />
            </div>
            <ChatwootWarning>
              Al editar el nombre también debes actualizar la etiqueta correspondiente en la plataforma
              multicanal (Chatwoot) para que siga apuntando a este proyecto.
            </ChatwootWarning>
            <div className="flex items-start gap-2">
              <Checkbox id="edit-ack" checked={editAck} onCheckedChange={(v) => setEditAck(v === true)} />
              <Label htmlFor="edit-ack" className="text-sm font-normal leading-tight">
                Confirmo que también actualizaré la etiqueta correspondiente en Chatwoot.
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!canEdit}
              onClick={() =>
                editTarget &&
                renameMutation.mutate({
                  id: editTarget.id,
                  payload: { nombre: editNombre.trim(), reason: editReason.trim() },
                })
              }
            >
              {renameMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Eliminar proyecto */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar proyecto — {deleteTarget?.nombre}</DialogTitle>
            <DialogDescription>
              Se bloqueará si ya existen registros con este proyecto. Requiere un motivo; queda auditado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="delete-reason">Motivo</Label>
              <Textarea
                id="delete-reason"
                placeholder="Motivo (obligatorio)"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              />
            </div>
            <ChatwootWarning>
              Al eliminar este proyecto también debes eliminar la etiqueta correspondiente en la
              plataforma multicanal (Chatwoot).
            </ChatwootWarning>
            <div className="flex items-start gap-2">
              <Checkbox id="delete-ack" checked={deleteAck} onCheckedChange={(v) => setDeleteAck(v === true)} />
              <Label htmlFor="delete-ack" className="text-sm font-normal leading-tight">
                Confirmo que también eliminaré la etiqueta correspondiente en Chatwoot.
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!canDelete}
              onClick={() =>
                deleteTarget && deleteMutation.mutate({ id: deleteTarget.id, payload: { reason: deleteReason.trim() } })
              }
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProyectos;
