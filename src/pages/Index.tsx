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

  // Cargar datos desde la base de datos al iniciar
  useEffect(() => {
    loadEmployees();
  }, []);

  const generateId = () => Math.random().toString(36).substring(2, 11);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await api.getRegistros();

      const mappedData: Employee[] = data.map((item: any) => ({
        id: item.id?.toString() || generateId(),
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
    } catch (error) {
      console.error("❌ Error cargando datos:", error);
      toast.error("Error al cargar datos de la base de datos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (data: EmployeeFormData) => {
    const newEmployee: Employee = {
      ...data,
      id: generateId(), // ID temporal para mostrar de inmediato
    };

    // Mostrar inmediatamente en DataTable
    setEmployees((prev) => [...prev, newEmployee]);

    // Guardar en la base de datos
    try {
      setLoading(true);
      const result = await api.saveRegistro(data);
      if (result.ok) {
        toast.success("Empleado guardado en la base de datos");
      } else {
        toast.error("Error al guardar el empleado");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (data: EmployeeFormData[]) => {
    const newEmployees: Employee[] = data.map((item) => ({
      ...item,
      id: generateId(), // ID temporal
    }));

    // Mostrar inmediatamente en DataTable
    setEmployees((prev) => [...prev, ...newEmployees]);

    // Guardar en la base de datos
    try {
      setLoading(true);
      toast.info(`Guardando ${data.length} registros...`);
      const result = await api.saveMultipleRegistros(data);
      toast.success(`${result.saved} de ${data.length} registros guardados en la base de datos`);
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar los registros en la base de datos");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Borrar inmediatamente de DataTable
    setEmployees((prev) => prev.filter((e) => e.id !== id));

    // Borrar en la base de datos
    try {
      setLoading(true);
      if (!isNaN(Number(id))) {
        await api.deleteRegistro(Number(id));
        toast.success("Registro eliminado de la base de datos");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar el registro de la base de datos");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("¿Está seguro de eliminar TODOS los registros?")) return;

    // Limpiar inmediatamente DataTable
    setEmployees([]);

    // Limpiar en la base de datos
    try {
      setLoading(true);
      await api.clearRegistros();
      toast.success("Todos los registros han sido eliminados de la base de datos");
    } catch (error) {
      console.error(error);
      toast.error("Error al limpiar los registros en la base de datos");
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
        <DataTable data={employees} onDelete={handleDelete} onClear={handleClear} />
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-border">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>Sistema de Gestión de Datos • {new Date().getFullYear()} • Conectado a MySQL</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
