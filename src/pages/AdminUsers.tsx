import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminUser } from "@/types/employee";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserPlus, Trash2, ArrowLeft, Shield, Users } from "lucide-react";

const AdminUsers = () => {
  const navigate   = useNavigate();
  const [usuarios, setUsuarios]       = useState<AdminUser[]>([]);
  const [loading, setLoading]         = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget]       = useState<AdminUser | null>(null);

  // Formulario de creación
  const [form, setForm] = useState({
    username: "",
    password: "",
    nombre:   "",
    rol:      "operador",
  });
  const [formLoading, setFormLoading] = useState(false);

  const currentUserId = Number(localStorage.getItem("userId"));

  const loadUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getUsuarios();
      setUsuarios(data);
    } catch {
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsuarios();
  }, [loadUsuarios]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.username.trim() || !form.password.trim() || !form.nombre.trim()) {
      toast.error("Todos los campos son requeridos");
      return;
    }

    if (form.password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    try {
      setFormLoading(true);
      const result = await api.createUsuario(form);

      if (result.ok) {
        toast.success(`Usuario "${form.username}" creado exitosamente`);
        setShowCreateModal(false);
        setForm({ username: "", password: "", nombre: "", rol: "operador" });
        await loadUsuarios();
      } else {
        toast.error(result.error || "Error al crear el usuario");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setLoading(true);
      const result = await api.deleteUsuario(deleteTarget.id);
      if (result.ok) {
        toast.success(`Usuario "${deleteTarget.username}" eliminado`);
        await loadUsuarios();
      } else {
        toast.error(result.error || "Error al eliminar el usuario");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-header py-8 px-4">
        <div className="container mx-auto flex items-center gap-3">
          <div className="p-3 bg-primary-foreground/20 rounded-xl">
            <img src="/r.png" alt="Regency Logo" className="h-8 w-8 object-contain" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">
              Panel de Administración
            </h1>
            <p className="text-primary-foreground/80">Gestión de usuarios del sistema</p>
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
                <Users className="h-5 w-5" />
                Usuarios ({usuarios.length})
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                <span className="text-muted-foreground">Cargando usuarios...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay usuarios registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    usuarios.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.nombre}</TableCell>
                        <TableCell className="text-muted-foreground">@{u.username}</TableCell>
                        <TableCell>
                          <Badge
                            variant={u.rol === "admin" ? "default" : "secondary"}
                            className="gap-1"
                          >
                            {u.rol === "admin" && <Shield className="h-3 w-3" />}
                            {u.rol}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.activo ? "default" : "destructive"}>
                            {u.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString("es-CO")}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={u.id === currentUserId}
                            title={u.id === currentUserId ? "No podés eliminarte a vos mismo" : "Eliminar usuario"}
                            onClick={() => setDeleteTarget(u)}
                            className="hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Modal — Crear usuario */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Crear Nuevo Usuario
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="new-nombre">Nombre completo *</Label>
                <Input
                  id="new-nombre"
                  placeholder="Ej: María García"
                  value={form.nombre}
                  onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-username">Username *</Label>
                <Input
                  id="new-username"
                  placeholder="Ej: mgarcia"
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">Contraseña * (mín. 8 caracteres)</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-rol">Rol *</Label>
                <Select
                  value={form.rol}
                  onValueChange={(val) => setForm((p) => ({ ...p, rol: val }))}
                >
                  <SelectTrigger id="new-rol">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operador">Operador</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={formLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={formLoading} className="gradient-primary text-white">
                {formLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Creando...
                  </div>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Crear Usuario
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog — Confirmar eliminación */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar a <strong>{deleteTarget?.nombre}</strong> (@{deleteTarget?.username}).
              Sus registros en BD permanecerán pero sin asociación de usuario.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
