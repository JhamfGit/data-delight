import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, Database, FileSpreadsheet, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface Employee {
  id: string;
  proyecto: string;
  centroOperacion: string;
  cargo: string;
  cedula: string;
  nombre: string;
  numero: string;
  status: string;
}

interface DataTableProps {
  data: Employee[];
  onDelete: (id: string) => void;
  onClear: () => void;
  onRefresh?: () => void;
  loading?: boolean;
}

const DataTable = ({ data, onDelete, onClear, onRefresh, loading = false }: DataTableProps) => {
  const handleExport = () => {
    if (data.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    const exportData = data.map((item) => ({
      ID: item.id,
      PROYECTO: item.proyecto,
      "CENTRO DE OPERACIÓN": item.centroOperacion,
      CARGO: item.cargo,
      CEDULA: item.cedula,
      NOMBRE: item.nombre,
      NUMERO: item.numero,
      STATUS: item.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");

    const colWidths = [
      { wch: 8 },
      { wch: 30 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 10 },
    ];
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(workbook, `datos_empleados_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Archivo exportado exitosamente");
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        PROYECTO: "Ejemplo: Proyecto Norte",
        "CENTRO DE OPERACIÓN": "Ejemplo: Cali",
        CARGO: "Ejemplo: Operario",
        CEDULA: "12345678",
        NOMBRE: "Ejemplo: Juan Pérez",
        NUMERO: "3001234567",
        STATUS: "SI",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla");

    const colWidths = [
      { wch: 30 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 10 },
    ];
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(workbook, "plantilla_empleados.xlsx");
    toast.success("Plantilla descargada exitosamente");
  };

  return (
    <Card className="card-shadow border-0">
      <CardHeader className="gradient-header rounded-t-xl flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-primary-foreground">
          <Database className="h-5 w-5" />
          Registros ({data.length})
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent ml-2"></div>
          )}
        </CardTitle>
        <div className="flex gap-2 flex-wrap">
          {onRefresh && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Recargar
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadTemplate}
            className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Descargar Plantilla
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            disabled={data.length === 0 || loading}
            className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClear}
            disabled={data.length === 0 || loading}
            className="bg-destructive/80 hover:bg-destructive text-destructive-foreground border-0"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Database className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">
              {loading ? "Cargando registros..." : "Sin registros"}
            </p>
            <p className="text-sm">
              {loading 
                ? "Conectando con la base de datos MySQL..." 
                : "Agregue datos manualmente o cargue un archivo Excel"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Proyecto</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Centro Op.</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Cargo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Cédula</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Nombre</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Número</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Estado</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold w-16"></th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                      #{item.id}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium max-w-[200px] truncate" title={item.proyecto}>
                      {item.proyecto}
                    </td>
                    <td className="px-4 py-3 text-sm">{item.centroOperacion}</td>
                    <td className="px-4 py-3 text-sm">{item.cargo}</td>
                    <td className="px-4 py-3 text-sm font-mono">{item.cedula}</td>
                    <td className="px-4 py-3 text-sm">{item.nombre}</td>
                    <td className="px-4 py-3 text-sm font-mono">{item.numero}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge
                        variant={item.status === "SI" ? "default" : "secondary"}
                        className={item.status === "SI" ? "bg-success hover:bg-success/90" : ""}
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(item.id)}
                        disabled={loading}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataTable;
