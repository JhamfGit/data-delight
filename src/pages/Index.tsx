import { useState, useEffect } from "react";
import { Employee, EmployeeFormData } from "@/types/employee";
import EmployeeForm from "@/components/EmployeeForm";
import ExcelUploader from "@/components/ExcelUploader";
import DataTable from "@/components/DataTable";
import { FileSpreadsheet, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Configuración de la API desde variable de entorno
const API_URL = "/api";

// Funciones de API
const api = {
  async getRegistros() {
    const response = await fetch(`${API_URL}/registros`);
    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(result.error || "Error al obtener registros");
    }
    
    return result.data;
  },

  async saveRegistro(data: EmployeeFormData) {
    const response = await fetch(`${API_URL}/registros`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proyecto: data.proyecto,
        centro_operacion: data.centroOperacion,
        cargo: data.cargo,
        cedula: data.cedula,
        nombre: data.nombre,
        numero: data.numero,
        status: data.status,
      }),
    });
    
    return await response.json();
  },

  async saveMultipleRegistros(dataArray: EmployeeFormData[]) {
    let saved = 0;
    let errors = 0;

    for (const data of dataArray) {
      try {
        await this.saveRegistro(data);
        saved++;
      } catch (error) {
        errors++;
        console.error("Error guardando registro:", error);
      }
    }

    return { saved, errors, total: dataArray.length };
  },

  async deleteRegistro(id: number) {
    const response = await fetch(`${API_URL}/registros/${id}`, {
      method: "DELETE",
    });
    
    return await response.json();
  },

  async clearRegistros() {
    const response = await fetch(`${API_URL}/registros`, {
      method: "DELETE",
    });
    
    return await response.json();
  },

  async testConnection() {
    try {
      const response = await fetch(`${API_URL.replace('/api', '')}/api/test-db`);
      return await response.json();
    } catch (error) {
      return { status: "error", message: "No se puede conectar con el servidor" };
    }
  }
};

const Index = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    status: string;
    message: string;
  } | null>(null);

  // Verificar conexión y cargar datos al iniciar
  useEffect(() => {
    checkConnection();
    loadEmployees();
  }, []);

  const checkConnection = async () => {
    try {
      const status = await api.testConnection();
      setConnectionStatus(status);
      
      if (status.status === "connected") {
        console.log("✅ Conexión a MySQL exitosa");
      } else {
        console.error("❌ Error de conexión:", status.message);
      }
    } catch (error) {
      console.error("❌ Error verificando conexión:", error);
      setConnectionStatus({
        status: "error",
        message: "No se puede conectar con el servidor backend"
      });
    }
  };

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await api.getRegistros();
      
      // Mapear datos del backend (con guiones bajos) al frontend (camelCase)
      const mappedData: Employee[] = data.map((item: any) => ({
        id: item.id?.toString() || Math.random().toString(36).substring(2, 11),
        proyecto: item.proyecto || "",
        centroOperacion: item.centro_operacion || "",
        cargo: item.cargo || "",
        cedula: item.cedula || "",
        nombre: item.nombre || "",
        numero: item.numero || "",
        status: item.status || "NO",
      }));
      
      setEmployees(mappedData);
      console.log("✅ Registros cargados:", mappedData.length);
      
      if (mappedData.length > 0) {
        toast.success(`${mappedData.length} registros cargados desde MySQL`);
      }
    } catch (error) {
      console.error("❌ Error cargando datos:", error);
      toast.error("Error al cargar datos de la base de datos");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (data: EmployeeFormData) => {
    try {
      setLoading(true);
      const result = await api.saveRegistro(data);
      
      if (result.ok) {
        toast.success(`Empleado guardado con ID: ${result.id_registro}`);
        await loadEmployees(); // Recargar datos
      } else {
        toast.error("Error al guardar el empleado");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (data: EmployeeFormData[]) => {
    try {
      setLoading(true);
      toast.info(`Guardando ${data.length} registros en MySQL...`);
      
      const result = await api.saveMultipleRegistros(data);
      
      if (result.errors > 0) {
        toast.warning(
          `${result.saved} de ${result.total} registros guardados. ${result.errors} errores.`
        );
      } else {
        toast.success(`✅ ${result.saved} registros guardados exitosamente en MySQL`);
      }
      
      await loadEmployees(); // Recargar datos
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al guardar los registros");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este registro?")) {
      return;
    }

    try {
      setLoading(true);
      
      if (!isNaN(Number(id))) {
        const result = await api.deleteRegistro(Number(id));
        
        if (result.ok) {
          toast.success("Registro eliminado de MySQL");
          await loadEmployees(); // Recargar datos
        } else {
          toast.error("Error al eliminar el registro");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar el registro");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("⚠️ ¿Está seguro de eliminar TODOS los registros de la base de datos MySQL? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      setLoading(true);
      const result = await api.clearRegistros();
      
      if (result.ok) {
        toast.success("Todos los registros han sido eliminados de MySQL");
        await loadEmployees(); // Recargar datos
      } else {
        toast.error("Error al limpiar los registros");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al limpiar los registros");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-header py-8 px-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-foreground/20 rounded-xl">
              <FileSpreadsheet className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">
                Gestión de Datos
              </h1>
              <p className="text-primary-foreground/80 text-sm md:text-base">
                Ingrese datos manualmente o cargue desde un archivo Excel
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Connection Status */}
        {connectionStatus && (
          <Alert variant={connectionStatus.status === "connected" ? "default" : "destructive"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {connectionStatus.status === "connected" 
                ? "✅ Conectado a MySQL exitosamente" 
                : `❌ ${connectionStatus.message}`}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-600 font-medium">Procesando...</span>
          </div>
        )}

        {/* Forms Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmployeeForm onSubmit={handleAddEmployee} />
          <ExcelUploader onUpload={handleBulkUpload} />
        </div>

        {/* Data Table */}
        <DataTable 
          data={employees} 
          onDelete={handleDelete} 
          onClear={handleClear}
          onRefresh={loadEmployees}
          loading={loading}
        />
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-border">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>
            Sistema de Gestión de Datos • {new Date().getFullYear()} • 
            <span className={connectionStatus?.status === "connected" ? "text-green-600" : "text-red-600"}>
              {" "}MySQL {connectionStatus?.status === "connected" ? "Conectado" : "Desconectado"}
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
