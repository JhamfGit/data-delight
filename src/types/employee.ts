export interface Employee {
  id: string;
  proyecto: string;
  centroOperacion: string;
  cargo: string;
  cedula: string;
  nombre: string;
  numero: string;
  status: string;
}

export type EmployeeFormData = Omit<Employee, 'id'>;
