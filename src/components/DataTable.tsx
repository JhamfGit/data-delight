import { Employee } from "@/types/employee";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, Database, FileSpreadsheet, Play } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface DataTableProps {
  data: Employee[];
  onDelete: (id: string) => void;
  onClear: () => void;
  onStartProcess: (data: Employee[]) => void; // 👈 NUEVO
}

const DataTable = ({ data, onDelete, onClear, onStartProcess }: DataTableProps) => {
  const handleExport = () => {
    if (data.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    const exportData = data.map((item) => ({
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

    worksheet["!cols"] = [
      { wch: 30 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 10 },
    ];

    XLSX.writeFile(workbook, "datos_empleados.xlsx");
  };

  const handleDownloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      {
        PROYECTO: "",
        "CENTRO DE OPERACIÓN": "",
        CARGO: "",
        CEDULA: "",
        NOMBRE: "",
        NUMERO: "",
        STATUS: "NO",
      },
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla");
    XLSX.writeFile(workbook, "plantilla_empleados.xlsx");
  };

  const handleStartProcess = () => {
    if (data.length === 0) {
      toast.error("No hay registros para procesar");
      return;
    }

    onStartProcess(data); // 👈 ENVÍA TODO
  };

  return (
    <Card className="card-shadow border-0">
      <CardHeader className="gradient-header rounded-t-xl flex justify-between items-center">
        <CardTitle className="flex gap-2 text-primary-foreground">
          <Database className="h-5 w-5" />
          Registros ({data.length})
        </CardTitle>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleStartProcess}
            disabled={data.length === 0}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Play className="h-4 w-4 mr-2" />
            Iniciar Proceso
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadTemplate}
            className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Descargar Plantilla
          </Button>

          <Button
            size="sm"
            onClick={handleExport}
            disabled={data.length === 0}
            className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>

          <Button
            size="sm"
            onClick={onClear}
            disabled={data.length === 0}
            className="bg-destructive text-white"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proyecto</TableHead>
              <TableHead>Centro</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Número</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.proyecto}</TableCell>
                <TableCell>{item.centroOperacion}</TableCell>
                <TableCell>{item.cargo}</TableCell>
                <TableCell>{item.cedula}</TableCell>
                <TableCell>{item.nombre}</TableCell>
                <TableCell>{item.numero}</TableCell>
                <TableCell>
                  <Badge>{item.status}</Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default DataTable;
