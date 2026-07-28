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

  const formatNumeroConIndicativo = (val: string) => {
    const numLimpio = val.replace(/\D/g, "");
    if (!numLimpio) return "";
    if (numLimpio.startsWith("57") && numLimpio.length >= 12) {
      return numLimpio;
    }
    return `57${numLimpio}`;
  };

  const handleChange = (field: keyof EmployeeFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.proyecto || !formData.nombre || !formData.cedula) {
      toast.error("Por favor complete los campos requeridos");
      return;
    }

    const numeroFinal = formatNumeroConIndicativo(formData.numero);

    // 👉 status viaja aquí aunque no esté en el UI
    onSubmit({
      ...formData,
      numero: numeroFinal,
    });

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
                  <SelectItem value="ACCENORTE">ACCENORTE</SelectItem>
                  <SelectItem value="RUTAS DEL VALLE">RUTAS DEL VALLE</SelectItem>
                  <SelectItem value="VINUS">VINUS</SelectItem>
                  <SelectItem value="GICA">GICA</SelectItem>
                  <SelectItem value="V40">V40</SelectItem>
                  <SelectItem value="CPC256">CPC256</SelectItem>
                  <SelectItem value="RUTA AL SUR">RUTA AL SUR</SelectItem>
                  <SelectItem value="CPC256 CONT">CPC256 CONT</SelectItem>
                  <SelectItem value="RUTA AL SUR CONT">RUTA AL SUR CONT</SelectItem>
                  <SelectItem value="RUTAS DEL VALLE CONT">RUTAS DEL VALLE CONT</SelectItem>
                  <SelectItem value="VINUS CONT">VINUS CONT</SelectItem>
                  <SelectItem value="GICA CONT">GICA CONT</SelectItem>
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
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm font-medium select-none">
                  +57
                </span>
                <Input
                  id="numero"
                  className="rounded-l-none"
                  value={formData.numero}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Solo permite números
                    if (value === '' || /^\d*$/.test(value)) {
                      handleChange("numero", value);
                    }
                  }}
                  placeholder="Ej: 3157690773"
                />
              </div>
            </div>

            {/* STATUS OCULTO */}
            <input type="hidden" value={formData.status} />

          </div>

          <Button
            type="submit"
            className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Agregar Registro al Formato
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default EmployeeForm;
