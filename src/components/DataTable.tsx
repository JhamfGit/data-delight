import { useState } from "react";
import { Employee, Pagination } from "@/types/employee";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Download, Trash2, FileSpreadsheet, Play,
  ChevronLeft, ChevronRight, History, FileDown, Loader2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { api } from "@/lib/api";

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
  /**
   * Controla el botón "Limpiar" y el borrado por fila. Solo aplica en
   * modo 'saved' (registros ya en BD) -- en modo 'pending' borrar es
   * puramente local, nunca toca la base de datos, así que cualquier
   * usuario puede hacerlo. Default true para no romper otros llamadores.
   */
  canDelete?: boolean;
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
  canDelete = true,
}: DataTableProps) => {
  const [exportingAll, setExportingAll] = useState(false);

  const generateExcel = (records: Employee[], fileName: string) => {
    const exportData = records.map((item) => ({
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

    XLSX.writeFile(workbook, fileName);
  };

  const handleExportPage = () => {
    if (data.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }
    generateExcel(data, "registros_pagina.xlsx");
    toast.success("Página exportada correctamente");
  };

  const handleExportAll = async () => {
    try {
      setExportingAll(true);
      toast.info("Descargando todos los registros de la base de datos...");
      const allRecords = await api.getAllRegistros();
      if (allRecords.length === 0) {
        toast.error("No se encontraron registros para exportar");
        return;
      }
      generateExcel(allRecords, "todos_los_registros.xlsx");
      toast.success(`${allRecords.length} registros exportados correctamente a Excel`);
    } catch {
      toast.error("Error al exportar todos los registros");
    } finally {
      setExportingAll(false);
    }
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
    await onStartProcess(data);
  };

  const isPending = mode === "pending";
  const isSaved   = mode === "saved";
  // Borrar un registro 'pending' nunca toca la BD -- solo 'saved' respeta `canDelete`.
  const showDeleteControls = isPending || canDelete;
  const colSpan = 7 + (showUserColumn ? 1 : 0) + (showDeleteControls ? 1 : 0);

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

            {/* Exportar Excel en modo pending */}
            {isPending && (
              <Button
                size="sm"
                onClick={handleExportPage}
                disabled={data.length === 0}
                className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
            )}

            {/* Exportar Página en modo saved */}
            {isSaved && (
              <Button
                size="sm"
                onClick={handleExportPage}
                disabled={data.length === 0}
                title="Exportar los 10 registros visibles en esta página"
                className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Página
              </Button>
            )}

            {/* 🔥 NUEVO: Exportar TODO los registros en modo saved */}
            {isSaved && (
              <Button
                size="sm"
                onClick={handleExportAll}
                disabled={exportingAll || (pagination?.total === 0)}
                title="Exportar todos los registros de la base de datos"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
              >
                {exportingAll ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4 mr-2" />
                )}
                Exportar Todo
              </Button>
            )}

            {showDeleteControls && (
              <Button
                size="sm"
                onClick={onClear}
                disabled={data.length === 0 && (!pagination || pagination.total === 0)}
                className="bg-destructive text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            )}
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
              {showDeleteControls && <TableHead />}
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
                  {showDeleteControls && (
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
                  )}
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
