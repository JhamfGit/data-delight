import { RegistroFilters } from "@/types/admin";
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
 */
export function RegistrosFilterBar({ filters, onFilterChange }: RegistrosFilterBarProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <Input
          id="filter-proyecto"
          value={filters.proyecto}
          onChange={(e) => onFilterChange({ proyecto: e.target.value })}
        />
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
