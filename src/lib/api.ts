import { Employee, AdminUser, Pagination } from "@/types/employee";

// ─── URL del API ──────────────────────────────────────────────
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:3001";
  }
  return `http://${window.location.hostname}:3001`;
};

const API_URL = getApiUrl();
console.log("🔗 API URL configurada:", API_URL);

// ─── Token helpers ────────────────────────────────────────────
const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ─── API ──────────────────────────────────────────────────────
export const api = {
  // ── Auth ────────────────────────────────────────────────────
  async login(username: string, password: string): Promise<{ ok: boolean; token?: string; user?: { id: number; username: string; nombre: string; rol: string }; error?: string }> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return response.json();
  },

  async getMe(): Promise<{ ok: boolean; user?: { id: number; username: string; nombre: string; rol: string } }> {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: authHeaders(),
    });
    return response.json();
  },

  // ── Registros ────────────────────────────────────────────────
  async getRegistros(page = 1, limit = 10): Promise<{ data: Employee[]; pagination: Pagination }> {
    try {
      const response = await fetch(
        `${API_URL}/api/registros?page=${page}&limit=${limit}`,
        { headers: authHeaders() }
      );
      const json = await response.json();
      return {
        data: json.ok ? json.data : [],
        pagination: json.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
    } catch (error) {
      console.error("Error obteniendo registros:", error);
      return { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    }
  },

  async saveRegistro(empleado: Omit<Employee, "id" | "createdAt" | "usuarioNombre">): Promise<{ ok: boolean; id_registro?: number }> {
    try {
      const response = await fetch(`${API_URL}/api/registros`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          proyecto:         empleado.proyecto,
          centro_operacion: empleado.centroOperacion,
          cargo:            empleado.cargo,
          cedula:           empleado.cedula,
          nombre:           empleado.nombre,
          numero:           empleado.numero,
          // status NO se envía — el servidor lo fuerza a "NO"
        }),
      });
      return response.json();
    } catch (error) {
      console.error("Error guardando registro:", error);
      return { ok: false };
    }
  },

  async saveMultipleRegistros(empleados: Omit<Employee, "id" | "createdAt" | "usuarioNombre">[]): Promise<{ ok: boolean; saved: number }> {
    let saved = 0;
    for (const empleado of empleados) {
      try {
        const result = await this.saveRegistro(empleado);
        if (result.ok) saved++;
      } catch (error) {
        console.error("Error guardando registro:", error);
      }
    }
    return { ok: true, saved };
  },

  async deleteRegistro(id: number): Promise<{ ok: boolean }> {
    try {
      const response = await fetch(`${API_URL}/api/registros/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      return response.json();
    } catch (error) {
      console.error("Error eliminando registro:", error);
      return { ok: false };
    }
  },

  async clearRegistros(): Promise<{ ok: boolean }> {
    try {
      const response = await fetch(`${API_URL}/api/registros`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      return response.json();
    } catch (error) {
      console.error("Error limpiando registros:", error);
      return { ok: false };
    }
  },

  // ── Admin — usuarios ─────────────────────────────────────────
  async getUsuarios(): Promise<AdminUser[]> {
    try {
      const response = await fetch(`${API_URL}/api/admin/usuarios`, {
        headers: authHeaders(),
      });
      const json = await response.json();
      return json.ok ? json.data : [];
    } catch (error) {
      console.error("Error obteniendo usuarios:", error);
      return [];
    }
  },

  async createUsuario(data: { username: string; password: string; nombre: string; rol: string }): Promise<{ ok: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/api/admin/usuarios`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      console.error("Error creando usuario:", error);
      return { ok: false, error: "Error de conexión" };
    }
  },

  async deleteUsuario(id: number): Promise<{ ok: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/api/admin/usuarios/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      return response.json();
    } catch (error) {
      console.error("Error eliminando usuario:", error);
      return { ok: false, error: "Error de conexión" };
    }
  },
};
