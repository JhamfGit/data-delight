import { useState, useEffect } from "react";
import { Employee, EmployeeFormData } from "@/types/employee";
import EmployeeForm from "@/components/EmployeeForm";
import ExcelUploader from "@/components/ExcelUploader";
import DataTable from "@/components/DataTable";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

const Index = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  const generateId = () => Math.random().toString(36).substring(2, 11);

  /* =========================
     CARGA INICIAL (BD)
  ==========================*/
  useEffect(() => {
    loadEmployees();
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
  ==========================*/
  const handleAddEmployee = async (data: EmployeeFormData) => {
    const tempEmployee: Employee = {
      ...data,
      id: generateId(),
    };

    // Mostrar inmediatamente
    setEmployees((prev) => [...prev, tempEmployee]);

    try {
      setLoading(true);
      const result = await api.saveRegistro(data);
      if (result.ok) {
        toast.success("Registro guardado");
      } else {
        toast.error("Error al guardar en BD");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     CARGA MASIVA (EXCEL)
  ==========================*/
  const handleBulkUpload = async (data: EmployeeFormData[]) => {
    const tempEmployees: Employee[] = data.map((item) => ({
      ...item,
      id: generateId(),
    }));

    // Mostrar inmediatamente
    setEmployees((prev) => [...prev, ...tempEmployees]);

    try {
      setLoading(true);
      toast.info(`Guardando ${data.length} registros...`);
      const result = await api.saveMultipleRegistros(data);
      toast.success(`${result.saved} registros guardados en la base de datos`);
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar los registros");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     INICIAR PROCESO (BOTÓN AZUL)
  ==========================*/
  const handleStartProcess = async (data: Employee[]) => {
    if (data.length === 0) {
      toast.error("No hay registros para procesar");
      return;
    }

    try {
      setLoading(true);
      toast.info(`Enviando ${data.length} registros...`);

      // Quitamos el id temporal antes de enviar
      const payload: EmployeeFormData[] = data.map(({ id, ...rest }) => rest);

      const result = await api.saveMultipleRegistros(payload);
      toast.success(`${result.saved} registros procesados correctamente`);
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
        toast.success("Registro eliminado");
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

    try {
      setLoading(true);
      await api.clearRegistros();
      toast.success("Registros eliminados");
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
          <div className="p-3 bg-primary-foreground/20 rounded-xl">
            <FileSpreadsheet className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">
              Gestión de Datos
            </h1>
            <p className="text-primary-foreground/80">
              Ingrese datos manualmente o cargue desde Excel
            </p>
          </div>
        </div>
      </header>

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
        Sistema de Gestión de Datos • {new Date().getFullYear()} • MySQL
      </footer>
    </div>
  );
};

export default Index;
