import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet } from "lucide-react";
import { EmployeeFormData } from "@/types/employee";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ExcelUploaderProps {
  onUpload: (data: EmployeeFormData[]) => void;
}

const ExcelUploader = ({ onUpload }: ExcelUploaderProps) => {
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

          if (jsonData.length < 2) {
            toast.error("El archivo está vacío o no tiene datos");
            return;
          }

          const headers = jsonData[0].map((h) => String(h).toLowerCase().trim());
          const rows = jsonData.slice(1);

          const mappedData: EmployeeFormData[] = rows
            .filter((row) => row.some((cell) => cell))
            .map((row) => {
              const findColumn = (names: string[]) => {
                const index = headers.findIndex((h) =>
                  names.some((name) => h.includes(name))
                );
                return index >= 0 ? String(row[index] || "") : "";
              };

              return {
                proyecto: findColumn(["proyecto"]),
                centroOperacion: findColumn(["centro", "operacion", "operación"]),
                cargo: findColumn(["cargo"]),
                cedula: findColumn(["cedula", "cédula"]),
                nombre: findColumn(["nombre"]),
                numero: findColumn(["numero", "número", "telefono", "teléfono"]),
                status: findColumn(["status", "estado"]) || "SI",
              };
            });

          if (mappedData.length === 0) {
            toast.error("No se encontraron datos válidos en el archivo");
            return;
          }

          onUpload(mappedData);
          toast.success(`${mappedData.length} registros cargados exitosamente`);
        } catch (error) {
          console.error("Error parsing Excel:", error);
          toast.error("Error al procesar el archivo Excel");
        }
      };
      reader.readAsArrayBuffer(file);
      e.target.value = "";
    },
    [onUpload]
  );

  return (
    <Card className="card-shadow border-0">
      <CardHeader className="gradient-header rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-primary-foreground">
          <FileSpreadsheet className="h-5 w-5" />
          Carga Masiva
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer bg-accent/30 hover:bg-accent/50 transition-colors group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 mb-3 text-primary group-hover:scale-110 transition-transform" />
            <p className="mb-2 text-sm text-foreground">
              <span className="font-semibold">Click para subir</span> o arrastra y suelta
            </p>
            <p className="text-xs text-muted-foreground">Excel (.xlsx, .xls)</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
          />
        </label>
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Columnas esperadas:</strong> Proyecto, Centro de Operación, Cargo, Cédula, Nombre, Número, Status
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExcelUploader;
