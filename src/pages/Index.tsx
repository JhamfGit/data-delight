import { useState, useEffect } from "react";
import { Employee, EmployeeFormData } from "@/types/employee";
import EmployeeForm from "@/components/EmployeeForm";
import ExcelUploader from "@/components/ExcelUploader";
import DataTable from "@/components/DataTable";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

const STORAGE_KEY = "employee_data_cache";

const Index = () => {
  // Inicializar con localStorage
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        toast.info(`${parsed.length} registros recuperados de la sesión anterior`);
        return parsed;
      }
      return [];
    } catch (error) {
      console.error("Error al cargar datos de localStorage:", error);
      return [];
    }
  });

  const [loading, setLoading] = useState(false);

  const generateId = () => Math.random().toString(36).substring(2, 11);

  // Guardar en localStorage cada vez que cambien los employees
  useEffect(() => {
    if (employees.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [employees]);

  /* =========================
     CARGA INICIAL DESDE BD
     (solo lectura)
  ==========================*/
  useEffect(() => {
    // Solo cargar desde BD si NO hay datos en localStorage
    const hasLocalData = localStorage.getItem(STORAGE_KEY);
    if (!hasLocalData) {
      loadEmployees();
    }
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await api.getRegistros();

      const mapped: Employee[] = data.map((item: any) => ({
        id: item.id?.toString() || generateId(),
        proyecto: item.proyecto || "",
        centroOperacion: item.centro_operacion || "",
        cargo: item.cargo || "",
        cedula: item.cedula || "",
        nombre: item.nombre || "",
        numero: item.numero || "",
        status: item.status || "NO",
      }));

      setEmployees(mapped);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar datos de la base de datos");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     FORMULARIO INDIVIDUAL
     (SOLO UI)
  ==========================*/
  const handleAddEmployee = (data: EmployeeFormData) => {
    const tempEmployee: Employee = {
      ...data,
      id: generateId(),
    };

    setEmployees((prev) => [...prev, tempEmployee]);
    toast.success("Registro agregado a la tabla");
  };

  /* =========================
     CARGA MASIVA EXCEL
     (SOLO UI)
  ==========================*/
  const handleBulkUpload = (data: EmployeeFormData[]) => {
    const tempEmployees: Employee[] = data.map((item) => ({
      ...item,
      id: generateId(),
    }));

    setEmployees((prev) => [...prev, ...tempEmployees]);
    toast.success(`${data.length} registros cargados en la tabla`);
  };

  /* =========================
     INICIAR PROCESO (BOTÓN AZUL)
     ÚNICO GUARDADO EN BD
  ==========================*/
  const handleStartProcess = async (data: Employee[]) => {
    if (data.length === 0) {
      toast.error("No hay registros para procesar");
      return;
    }

    try {
      setLoading(true);
      toast.info(`Enviando ${data.length} registros a la base de datos...`);

      const payload: EmployeeFormData[] = data.map(({ id, ...rest }) => rest);

      const result = await api.saveMultipleRegistros(payload);

      toast.success(`${result.saved} registros guardados correctamente`);
      
      // Limpiar localStorage después de guardar en BD
      localStorage.removeItem(STORAGE_KEY);
      
      await loadEmployees(); // refrescar desde BD
    } catch (error) {
      console.error(error);
      toast.error("Error al iniciar el proceso");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     ELIMINAR REGISTRO
  ==========================*/
  const handleDelete = async (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));

    try {
      setLoading(true);
      if (!isNaN(Number(id))) {
        await api.deleteRegistro(Number(id));
        toast.success("Registro eliminado de la base de datos");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar el registro");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     LIMPIAR TODO
  ==========================*/
  const handleClear = async () => {
    if (!confirm("¿Está seguro de eliminar TODOS los registros?")) return;

    setEmployees([]);
    localStorage.removeItem(STORAGE_KEY); // Limpiar localStorage también

    try {
      setLoading(true);
      await api.clearRegistros();
      toast.success("Todos los registros fueron eliminados");
    } catch (error) {
      console.error(error);
      toast.error("Error al limpiar los registros");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UI
  ==========================*/
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-header py-8 px-4">
        <div className="container mx-auto flex items-center gap-3">
          {/* Logo Regency */}
          <div className="p-3 bg-primary-foreground/20 rounded-xl">
            <img
              src="/r.png"
              alt="Regency Logo"
              className="h-8 w-8 object-contain"
            />
          </div>
    
          {/* Textos */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">
              Gestión de Datos Regency
            </h1>
            <p className="text-primary-foreground/80">
              Cargue datos y ejecute el proceso cuando esté listo
            </p>
          </div>
        </div>
      </header>
    </div>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {loading && (
          <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
            <span className="text-blue-600 font-medium">Procesando...</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmployeeForm onSubmit={handleAddEmployee} />
          <ExcelUploader onUpload={handleBulkUpload} />
        </div>

        <DataTable
          data={employees}
          onDelete={handleDelete}
          onClear={handleClear}
          onStartProcess={handleStartProcess}
        />
      </main>

      <footer className="py-6 border-t border-border text-center text-sm text-muted-foreground">
        Sistema de Gestión de Datos Regency• {new Date().getFullYear()} • MySQL
      </footer>
    </div>
  );
};

export default Index;
