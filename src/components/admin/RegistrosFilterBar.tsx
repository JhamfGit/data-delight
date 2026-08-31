import { useQuery } from "@tanstack/react-query";
import { RegistroFilters } from "@/types/admin";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RegistrosFilterBarProps {
  filters: RegistroFilters;
  onFilterChange: (patch: Partial<RegistroFilters>) => void;
}

/**
 * Filter bar for `/admin/registros` (spec "Role-Scoped Registro Search,
 * Filter, and Detail"). Controlled entirely by `filters`/`onFilterChange` —
 * the page owns the URL-search-param sync via `useRegistrosFilters`, this
 * component only renders the current values and reports patches.
 *
 * "Proyecto" and "Usuario" are `Select`s fed by the existing catalogs
 * (`GET /api/proyectos`, `GET /api/admin/usuarios`) rather than free-text
 * inputs, so a filter value always matches a real row instead of a typo.
 * This page is already admin-only (`AdminRoute`), so the usuario filter
 * needs no extra role check here.
 */
export function RegistrosFilterBar({ filters, onFilterChange }: RegistrosFilterBarProps) {
  const proyectosQuery = useQuery({
    queryKey: ["proyectos"],
    queryFn: () => api.getProyectos(),
  });
  const proyectos = proyectosQuery.data ?? [];

  const usuariosQuery = useQuery({
    queryKey: ["usuarios"],
    queryFn: () => api.getUsuarios(),
  });
  const usuarios = usuariosQuery.data ?? [];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="grid gap-2">
        <Label htmlFor="filter-q">Buscar (cédula o nombre)</Label>
        <Input
          id="filter-q"
          value={filters.q}
          onChange={(e) => onFilterChange({ q: e.target.value })}
          placeholder="Cédula o nombre"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="filter-status">Estado</Label>
        <Select
          value={filters.status || "__all__"}
          onValueChange={(val) => onFilterChange({ status: val === "__all__" ? "" : val })}
        >
          <SelectTrigger id="filter-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            <SelectItem value="NO">NO</SelectItem>
            <SelectItem value="SI">SI</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="filter-proyecto">Proyecto</Label>
        <Select
          value={filters.proyecto || "__all__"}
          onValueChange={(val) => onFilterChange({ proyecto: val === "__all__" ? "" : val })}
        >
          <SelectTrigger id="filter-proyecto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {proyectos.map((p) => (
              <SelectItem key={p.id} value={p.nombre}>
                {p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="filter-usuario">Usuario</Label>
        <Select
          value={filters.user_id || "__all__"}
          onValueChange={(val) => onFilterChange({ user_id: val === "__all__" ? "" : val })}
        >
          <SelectTrigger id="filter-usuario">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {usuarios.map((u) => (
              <SelectItem key={u.id} value={String(u.id)}>
                {u.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="filter-centro">Centro de operación</Label>
        <Input
          id="filter-centro"
          value={filters.centro_operacion}
          onChange={(e) => onFilterChange({ centro_operacion: e.target.value })}
        />
      </div>
    </div>
  );
}
