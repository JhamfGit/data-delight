import { useState } from "react";
import { Employee, EmployeeFormData } from "@/types/employee";
import EmployeeForm from "@/components/EmployeeForm";
import ExcelUploader from "@/components/ExcelUploader";
import DataTable from "@/components/DataTable";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);

  const generateId = () => Math.random().toString(36).substring(2, 11);

  const handleAddEmployee = (data: EmployeeFormData) => {
    const newEmployee: Employee = {
      ...data,
      id: generateId(),
    };
    setEmployees((prev) => [...prev, newEmployee]);
  };

  const handleBulkUpload = (data: EmployeeFormData[]) => {
    const newEmployees: Employee[] = data.map((item) => ({
      ...item,
      id: generateId(),
    }));
    setEmployees((prev) => [...prev, ...newEmployees]);
  };

  const handleDelete = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    toast.success("Registro eliminado");
  };

  const handleClear = () => {
    setEmployees([]);
    toast.success("Todos los registros han sido eliminados");
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
          <p>Sistema de Gestión de Datos • {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
