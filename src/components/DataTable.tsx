import { Employee } from "@/types/employee";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, Database } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface DataTableProps {
  data: Employee[];
  onDelete: (id: string) => void;
  onClear: () => void;
}

const DataTable = ({ data, onDelete, onClear }: DataTableProps) => {
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

    XLSX.writeFile(workbook, `datos_empleados_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Archivo exportado exitosamente");
  };

  return (
    <Card className="card-shadow border-0">
      <CardHeader className="gradient-header rounded-t-xl flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-primary-foreground">
          <Database className="h-5 w-5" />
          Registros ({data.length})
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            disabled={data.length === 0}
            className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClear}
            disabled={data.length === 0}
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
            <p className="text-lg font-medium">Sin registros</p>
            <p className="text-sm">Agregue datos manualmente o cargue un archivo Excel</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Proyecto</TableHead>
                  <TableHead className="font-semibold">Centro Op.</TableHead>
                  <TableHead className="font-semibold">Cargo</TableHead>
                  <TableHead className="font-semibold">Cédula</TableHead>
                  <TableHead className="font-semibold">Nombre</TableHead>
                  <TableHead className="font-semibold">Número</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id} className="hover:bg-accent/30 transition-colors">
                    <TableCell className="font-medium max-w-[200px] truncate">{item.proyecto}</TableCell>
                    <TableCell>{item.centroOperacion}</TableCell>
                    <TableCell>{item.cargo}</TableCell>
                    <TableCell className="font-mono">{item.cedula}</TableCell>
                    <TableCell>{item.nombre}</TableCell>
                    <TableCell className="font-mono">{item.numero}</TableCell>
                    <TableCell>
                      <Badge
                        variant={item.status === "SI" ? "default" : "secondary"}
                        className={item.status === "SI" ? "bg-success hover:bg-success/90" : ""}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(item.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataTable;
