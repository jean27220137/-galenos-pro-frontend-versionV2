export interface Medicamento {
  id: number;
  codigoSismed: string;
  nombre: string;
  presentacion: string;
  concentracion: string;
  viaAdministracion: string;
  stockMinimo: number;
  activo: number;
}
