import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import { EmployeeFormData } from "@/types/employee";
import { toast } from "sonner";

interface EmployeeFormProps {
  onSubmit: (data: EmployeeFormData) => void;
}

const EmployeeForm = ({ onSubmit }: EmployeeFormProps) => {
  const [formData, setFormData] = useState<EmployeeFormData>({
    proyecto: "",
    centroOperacion: "",
    cargo: "",
    cedula: "",
    nombre: "",
    numero: "",
    status: "NO", // 👈 se envía, pero no se muestra
  });

  const handleChange = (field: keyof EmployeeFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.proyecto || !formData.nombre || !formData.cedula) {
      toast.error("Por favor complete los campos requeridos");
      return;
    }

    // 👉 status viaja aquí aunque no esté en el UI
    onSubmit(formData);

    setFormData({
      proyecto: "",
      centroOperacion: "",
      cargo: "",
      cedula: "",
      nombre: "",
      numero: "",
      status: "SI",
    });

    toast.success("Registro agregado exitosamente");
  };

  return (
    <Card className="card-shadow border-0">
      <CardHeader className="gradient-header rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-primary-foreground">
          <UserPlus className="h-5 w-5" />
          Nuevo Registro
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Proyecto */}
            <div className="space-y-2">
              <Label htmlFor="proyecto">Proyecto *</Label>
              <Select
                value={formData.proyecto}
                onValueChange={(value) => handleChange("proyecto", value)}
              >
                <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Seleccione un proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUMAPAZGICA OP VIAL">SUMAPAZGICA OP VIAL</SelectItem>
                  <SelectItem value="RUTA AL SUR OP VIAL">RUTA AL SUR OP VIAL</SelectItem>
                  <SelectItem value="VINUS OP VIAL">VINUS OP VIAL</SelectItem>
                  <SelectItem value="ACCENORTE">ACCENORTE</SelectItem>
                  <SelectItem value="FRIGORINUS VIGILANCIA">FRIGORINUS VIGILANCIA</SelectItem>
                  <SelectItem value="MINEROS LA MARIA VIGILANCIA">MINEROS LA MARIA VIGILANCIA</SelectItem>
                  <SelectItem value="APP GICA (VIGILANCIA)">APP GICA (VIGILANCIA)</SelectItem>
                  <SelectItem value="D5 EL FARO 118 VIGILANCIA">D5 EL FARO 118 VIGILANCIA</SelectItem>
                  <SelectItem value="VINUS - VIGILANCIA">VINUS - VIGILANCIA</SelectItem>
                  <SelectItem value="RUTA AL SUR - VIGILANCIA">RUTA AL SUR - VIGILANCIA</SelectItem>
                  <SelectItem value="RUTAS DEL VALLE - VIGILANCIA">RUTAS DEL VALLE - VIGILANCIA</SelectItem>
                  <SelectItem value="ACCENORTE - VIGILANCIA">ACCENORTE - VIGILANCIA</SelectItem>
                  <SelectItem value="CONSORCIO PEAJES 2526 - VIGILANCIA">CONSORCIO PEAJES 2526 - VIGILANCIA</SelectItem>
                  <SelectItem value="CONSORCIO PEAJES 2526 - PLANTA">CONSORCIO PEAJES 2526 - PLANTA</SelectItem>
                  <SelectItem value="RUTA AL SUR - RECOLECTOR TEMPORADA">RUTA AL SUR - RECOLECTOR TEMPORADA</SelectItem>
                  <SelectItem value="RUTAS DEL VALLE - RECOLECTOR TEMPORADA">RUTAS DEL VALLE - RECOLECTOR TEMPORADA</SelectItem>
                  <SelectItem value="GICA - RECOLECTOR TEMPORADA">GICA - RECOLECTOR TEMPORADA</SelectItem>
                  <SelectItem value="CONSORCIO PEAJES 2526 - CANGUROS">CONSORCIO PEAJES 2526 - CANGUROS</SelectItem>
                  <SelectItem value="RUTA AL SUR PLANTA">RUTA AL SUR PLANTA</SelectItem>
                  <SelectItem value="RUTAS DEL VALLE PLANTA">RUTAS DEL VALLE PLANTA</SelectItem>
                  <SelectItem value="GICA PLANTA">GICA PLANTA</SelectItem>
                  <SelectItem value="VINUS PLANTA">VINUS PLANTA</SelectItem>
                  <SelectItem value="ADMINISTRACION">ADMINISTRACION</SelectItem>
                  <SelectItem value="TOLIS">TOLIS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Centro de Operación */}
            <div className="space-y-2">
              <Label htmlFor="centroOperacion">Centro de Operación</Label>
              <Input
                id="centroOperacion"
                value={formData.centroOperacion}
                onChange={(e) => handleChange("centroOperacion", e.target.value)}
                placeholder="Ej: Medellín"
              />
            </div>

            {/* Cargo */}
            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                value={formData.cargo}
                onChange={(e) => handleChange("cargo", e.target.value)}
                placeholder="Ej: Consultor"
              />
            </div>

            {/* Cédula */}
            <div className="space-y-2">
              <Label htmlFor="cedula">Cédula *</Label>
              <Input
                id="cedula"
                value={formData.cedula}
                onChange={(e) => handleChange("cedula", e.target.value)}
                placeholder="Ej: 125444354"
              />
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                placeholder="Ej: Daniel González"
              />
            </div>

            {/* Número */}
            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => handleChange("numero", e.target.value)}
                placeholder="Ej: 573157690773"
              />
            </div>

            {/* STATUS OCULTO */}
            <input type="hidden" value={formData.status} />

          </div>

          <Button
            type="submit"
            className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Agregar Registro
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default EmployeeForm;
