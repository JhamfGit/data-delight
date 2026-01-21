import { Employee } from "@/types/employee";

// Detectar la URL del API automáticamente
const getApiUrl = () => {
  // Si hay variable de entorno, úsala
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Si estamos en localhost, usa localhost:3001
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:3001";
  }
  
  // En producción, usa la misma IP del servidor con puerto 3001
  return `http://${window.location.hostname}:3001`;
};

const API_URL = getApiUrl();
console.log("🔗 API URL configurada:", API_URL);

export const api = {
  // Obtener todos los registros
  async getRegistros(): Promise<Employee[]> {
    try {
      const response = await fetch(`${API_URL}/api/registros`);
      const data = await response.json();
      return data.ok ? data.data : [];
    } catch (error) {
      console.error("Error obteniendo registros:", error);
      return [];
    }
  },

  // Guardar un registro
  async saveRegistro(empleado: Omit<Employee, "id">): Promise<{ ok: boolean; id_registro?: number }> {
    try {
      const response = await fetch(`${API_URL}/api/registros`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proyecto: empleado.proyecto,
          centro_operacion: empleado.centroOperacion,
          cargo: empleado.cargo,
          cedula: empleado.cedula,
          nombre: empleado.nombre,
          numero: empleado.numero,
          status: empleado.status,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error("Error guardando registro:", error);
      return { ok: false };
    }
  },

  // Guardar múltiples registros
  async saveMultipleRegistros(empleados: Omit<Employee, "id">[]): Promise<{ ok: boolean; saved: number }> {
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

  // Eliminar un registro
  async deleteRegistro(id: number): Promise<{ ok: boolean }> {
    try {
      const response = await fetch(`${API_URL}/api/registros/${id}`, {
        method: "DELETE",
      });
      return await response.json();
    } catch (error) {
      console.error("Error eliminando registro:", error);
      return { ok: false };
    }
  },

  // Limpiar todos los registros
  async clearRegistros(): Promise<{ ok: boolean }> {
    try {
      const response = await fetch(`${API_URL}/api/registros`, {
        method: "DELETE",
      });
      return await response.json();
    } catch (error) {
      console.error("Error limpiando registros:", error);
      return { ok: false };
    }
  },
};
