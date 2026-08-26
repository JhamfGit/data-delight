/**
 * src/types/admin.ts — types for the Phase 6 admin frontend (registros
 * filter/detail + extended usuarios). Field names match the REAL API
 * response shapes confirmed by reading server.js / lib/registrosService.js
 * / lib/usuariosService.js on this branch — NOT design.md's literal
 * `{items,page,pageSize,total}` envelope, which was never implemented.
 */

/** Raw row shape returned by `GET /api/registros` / `GET /api/registros/:id` (`SELECT r.*`). */
export interface RegistroRow {
  id_registro: number;
  user_id: number | null;
  proyecto: string;
  centro_operacion: string;
  cargo: string;
  cedula: string;
  nombre: string;
  numero: string;
  status: string;
  created_at: string;
  usuario_nombre?: string; // only present on admin (LEFT JOIN), see registrosService.js
}

export interface RegistroFilters {
  q: string;
  status: string;
  proyecto: string;
  centro_operacion: string;
  page: number;
  pageSize: number;
}

export const EMPTY_REGISTRO_FILTERS: RegistroFilters = {
  q: "",
  status: "",
  proyecto: "",
  centro_operacion: "",
  page: 1,
  pageSize: 10,
};

/** Row shape returned by both audit endpoints (`admin_audit_log.*`). */
export interface AuditLogRow {
  id: number;
  actor_id: number;
  actor_rol: string;
  entity: "registro" | "usuario";
  entity_id: string;
  action: string;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  reason: string;
  created_at: string;
}
