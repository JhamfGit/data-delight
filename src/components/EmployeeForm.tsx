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
    status: "SI",
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
            <div className="space-y-2">
              <Label htmlFor="proyecto">Proyecto *</Label>
              <select
                id="proyecto"
                value={formData.proyecto}
                onChange={(e) => handleChange("proyecto", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
              >
                <option value="">Seleccione un proyecto</option>
                <option value="SUMAPAZGICA OP VIAL">SUMAPAZGICA OP VIAL</option>
                <option value="RUTA AL SUR OP VIAL">RUTA AL SUR OP VIAL</option>
                <option value="VINUS OP VIAL">VINUS OP VIAL</option>
                <option value="ACCENORTE">ACCENORTE</option>
                <option value="FRIGORINUS VIGILANCIA">FRIGORINUS VIGILANCIA</option>
                <option value="MINEROS LA MARIA VIGILANCIA">MINEROS LA MARIA VIGILANCIA</option>
                <option value="APP GICA (VIGILANCIA)">APP GICA (VIGILANCIA)</option>
                <option value="D5 EL FARO 118 VIGILANCIA">D5 EL FARO 118 VIGILANCIA</option>
                <option value="VINUS - VIGILANCIA">VINUS - VIGILANCIA</option>
                <option value="RUTA AL SUR - VIGILANCIA">RUTA AL SUR - VIGILANCIA</option>
                <option value="RUTAS DEL VALLE - VIGILANCIA">RUTAS DEL VALLE - VIGILANCIA</option>
                <option value="ACCENORTE - VIGILANCIA">ACCENORTE - VIGILANCIA</option>
                <option value="CONSORCIO PEAJES 2526 - VIGILANCIA">CONSORCIO PEAJES 2526 - VIGILANCIA</option>
                <option value="CONSORCIO PEAJES 2526 - PLANTA">CONSORCIO PEAJES 2526 - PLANTA</option>
                <option value="RUTA AL SUR - RECOLECTOR TEMPORADA">RUTA AL SUR - RECOLECTOR TEMPORADA</option>
                <option value="RUTAS DEL VALLE - RECOLECTOR TEMPORADA">RUTAS DEL VALLE - RECOLECTOR TEMPORADA</option>
                <option value="GICA - RECOLECTOR TEMPORADA">GICA - RECOLECTOR TEMPORADA</option>
                <option value="CONSORCIO PEAJES 2526 - CANGUROS">CONSORCIO PEAJES 2526 - CANGUROS</option>
                <option value="RUTA AL SUR PLANTA">RUTA AL SUR PLANTA</option>
                <option value="RUTAS DEL VALLE PLANTA">RUTAS DEL VALLE PLANTA</option>
                <option value="GICA PLANTA">GICA PLANTA</option>
                <option value="VINUS PLANTA">VINUS PLANTA</option>
                <option value="ADMINISTRACION">ADMINISTRACION</option>
                <option value="TOLIS">TOLIS</option>
              </select>
            </div>
                        <div className="space-y-2">
              <Label htmlFor="centroOperacion">Centro de Operación</Label>
              <Input
                id="centroOperacion"
                value={formData.centroOperacion}
                onChange={(e) => handleChange("centroOperacion", e.target.value)}
                placeholder="Ej: Medellín"
                className="transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                value={formData.cargo}
                onChange={(e) => handleChange("cargo", e.target.value)}
                placeholder="Ej: Consultor"
                className="transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cedula">Cédula *</Label>
              <Input
                id="cedula"
                value={formData.cedula}
                onChange={(e) => handleChange("cedula", e.target.value)}
                placeholder="Ej: 125444354"
                className="transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                placeholder="Ej: Daniel González"
                className="transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => handleChange("numero", e.target.value)}
                placeholder="Ej: 573157690773"
                className="transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange("status", value)}
              >
                <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SI">Activo (SI)</SelectItem>
                  <SelectItem value="NO">Inactivo (NO)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90 transition-opacity">
            <UserPlus className="h-4 w-4 mr-2" />
            Agregar Registro
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default EmployeeForm;
