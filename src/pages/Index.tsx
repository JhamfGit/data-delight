import { useState } from "react";
import { Employee, EmployeeFormData } from "@/types/employee";
import EmployeeForm from "@/components/EmployeeForm";
import ExcelUploader from "@/components/ExcelUploader";
import DataTable from "@/components/DataTable";
import { FileSpreadsheet, Play } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

const Index = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  const generateId = () => Math.random().toString(36).substring(2, 11);

  /* ===============================
     CARGA SOLO EN EL DATATABLE
     =============================== */

  const handleAddEmployee = (data: EmployeeFormData) => {
    const newEmployee: Employee = {
      ...data,
      id: generateId(),
    };

    setEmployees((prev) => [...prev, newEmployee]);
    toast.success("Registro agregado a la tabla");
  };

  const handleBulkUpload = (data: EmployeeFormData[]) => {
    const newEmployees: Employee[] = data.map((item) => ({
      ...item,
      id: generateId(),
    }));

    setEmployees((prev) => [...prev, ...newEmployees]);
    toast.success(`${data.length} registros cargados en la tabla`);
  };

  /* ===============================
     INICIAR PROCESO (GUARDAR TODO)
     =============================== */

  const handleStartProcess = async () => {
    if (employees.length === 0) {
      toast.warning("No hay datos para procesar");
      return;
    }

    try {
      setLoading(true);

      const payload: EmployeeFormData[] = employees.map(
        ({ id, ...rest }) => rest
      );

      toast.info(`Guardando ${payload.length} registros...`);

      const result = await api.saveMultipleRegistros(payload);

      toast.success(
        `${result.saved} de ${payload.length} registros guardados correctamente`
      );

      // 🔒 Opcional: limpiar tabla después de guardar
      // setEmployees([]);

    } catch (error) {
      console.error(error);
      toast.error("Error al guardar los datos en la base de datos");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     ELIMINACIONES SOLO VISUALES
     =============================== */

  const handleDelete = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  const handleClear = () => {
    if (!confirm("¿Eliminar todos los registros de la tabla?")) return;
    setEmployees([]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-header py-8 px-4">
        <div className="container mx-auto flex items-center gap-3">
          <div className="p-3 bg-primary-foreground/20 rounded-xl">
            <FileSpreadsheet className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary-foreground">
              Gestión de Datos
            </h1>
            <p className="text-primary-foreground/80">
              Cargue, revise y luego inicie el proceso
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Loading */}
        {loading && (
          <div className="flex justify-center gap-2 p-4 bg-blue-50 border rounded-lg">
            <div className="animate-spin h-5 w-5 border-b-2 border-blue-600 rounded-full" />
            <span className="text-blue-600 font-medium">Procesando...</span>
          </div>
        )}

        {/* Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmployeeForm onSubmit={handleAddEmployee} />
          <ExcelUploader onUpload={handleBulkUpload} />
        </div>

        {/* Acción principal */}
        <div className="flex justify-end">
          <button
            onClick={handleStartProcess}
            disabled={employees.length === 0 || loading}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="h-5 w-5" />
            Iniciar proceso
          </button>
        </div>

        {/* DataTable */}
        <DataTable
          data={employees}
          onDelete={handleDelete}
          onClear={handleClear}
        />
      </main>

      <footer className="py-6 border-t text-center text-sm text-muted-foreground">
        Sistema de Gestión de Datos • {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default Index;
