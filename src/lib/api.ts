import { Employee } from "@/types/employee";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const api = {
  // Obtener todos los registros
  async getRegistros(): Promise<Employee[]> {
    const response = await fetch(`${API_URL}/api/registros`);
    const data = await response.json();
    return data.ok ? data.data : [];
  },

  // Guardar un registro
  async saveRegistro(empleado: Omit<Employee, "id">): Promise<{ ok: boolean; id_registro?: number }> {
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

  // Eliminar un registro (si lo implementas en el backend)
  async deleteRegistro(id: number): Promise<{ ok: boolean }> {
    const response = await fetch(`${API_URL}/api/registros/${id}`, {
      method: "DELETE",
    });
    return await response.json();
  },

  // Limpiar todos los registros (si lo implementas en el backend)
  async clearRegistros(): Promise<{ ok: boolean }> {
    const response = await fetch(`${API_URL}/api/registros`, {
      method: "DELETE",
    });
    return await response.json();
  },
};
