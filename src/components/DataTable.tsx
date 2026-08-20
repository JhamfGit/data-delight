import { Employee, Pagination } from "@/types/employee";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Download, Trash2, Database, FileSpreadsheet, Play,
  ChevronLeft, ChevronRight, History,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface DataTableProps {
  data: Employee[];
  /** 'pending' = registros aún no enviados a BD | 'saved' = historial de BD */
  mode: "pending" | "saved";
  onDelete: (id: string) => void;
  onClear: () => void;
  onStartProcess: (data: Employee[]) => Promise<void>;
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  showUserColumn?: boolean;
}

const DataTable = ({
  data,
  mode,
  onDelete,
  onClear,
  onStartProcess,
  pagination,
  onPageChange,
  showUserColumn = false,
}: DataTableProps) => {

  const handleExport = () => {
    if (data.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    const exportData = data.map((item) => ({
      PROYECTO:              item.proyecto,
      "CENTRO DE OPERACIÓN": item.centroOperacion,
      CARGO:                 item.cargo,
      CEDULA:                item.cedula,
      NOMBRE:                item.nombre,
      NUMERO:                item.numero,
      STATUS:                item.status,
      ...(showUserColumn && item.usuarioNombre
        ? { USUARIO: item.usuarioNombre }
        : {}),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook  = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");

    worksheet["!cols"] = [
      { wch: 30 }, { wch: 25 }, { wch: 15 },
      { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 10 },
      ...(showUserColumn ? [{ wch: 20 }] : []),
    ];

    XLSX.writeFile(workbook, "datos_empleados.xlsx");
    toast.success("Archivo exportado correctamente");
  };

  const handleDownloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      { PROYECTO: "", "CENTRO DE OPERACIÓN": "", CARGO: "", CEDULA: "", NOMBRE: "", NUMERO: "" },
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla");
    XLSX.writeFile(workbook, "plantilla_empleados.xlsx");
    toast.success("Plantilla descargada");
  };

  const handleProcess = async () => {
    if (data.length === 0) {
      toast.error("No hay registros para procesar");
      return;
    }
    // status se fuerza a "NO" en el servidor — aquí no se toca
    await onStartProcess(data);
  };

  const isPending = mode === "pending";
  const isSaved   = mode === "saved";

  const colSpan = showUserColumn ? 9 : 8;

  return (
    <Card className="card-shadow border-0">
      <CardHeader className="gradient-header rounded-t-xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex gap-2 text-primary-foreground">
            {isPending
              ? <><Play className="h-5 w-5" /> Pendientes de envío ({data.length})</>
              : <><History className="h-5 w-5" /> Historial en BD
                  {pagination && (
                    <span className="text-sm font-normal opacity-80 ml-1">
                      ({pagination.total} registros)
                    </span>
                  )}
                </>
            }
          </CardTitle>

          <div className="flex flex-wrap gap-2">
            {/* Botón Iniciar Proceso — solo en modo pending */}
            {isPending && (
              <Button
                size="sm"
                onClick={handleProcess}
                disabled={data.length === 0}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar Proceso
              </Button>
            )}

            {/* Plantilla — solo en modo pending */}
            {isPending && (
              <Button
                size="sm"
                onClick={handleDownloadTemplate}
                className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Descargar Plantilla
              </Button>
            )}

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
              {showUserColumn && <TableHead>Usuario</TableHead>}
              <TableHead />
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center py-8 text-muted-foreground">
                  {isPending
                    ? "No hay registros pendientes. Agregue datos usando el formulario o cargue un archivo Excel."
                    : "No hay registros en la base de datos."}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.proyecto}</TableCell>
                  <TableCell>{item.centroOperacion}</TableCell>
                  <TableCell>{item.cargo}</TableCell>
                  <TableCell>{item.cedula}</TableCell>
                  <TableCell>{item.nombre}</TableCell>
                  <TableCell>{item.numero}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === "SI" ? "default" : "secondary"}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  {showUserColumn && (
                    <TableCell className="text-xs text-muted-foreground">
                      {item.usuarioNombre || "—"}
                    </TableCell>
                  )}
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(item.id)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Paginación — solo en modo saved */}
        {isSaved && pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Página <strong>{pagination.page}</strong> de <strong>{pagination.totalPages}</strong>
              {" "}· {pagination.total} registros en total
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => onPageChange?.(pagination.page - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => onPageChange?.(pagination.page + 1)}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataTable;
