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
              <Input
                id="proyecto"
                value={formData.proyecto}
                onChange={(e) => handleChange("proyecto", e.target.value)}
                placeholder="Ej: CONSORCIO PEAJES 2526"
                className="transition-all focus:ring-2 focus:ring-primary/20"
              />
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
