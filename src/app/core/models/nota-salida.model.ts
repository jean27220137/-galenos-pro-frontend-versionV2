export interface DetalleNotaSalida {
  id: number;
  medicamentoId: number;
  lote: string;
  fechaVencimiento: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export interface NotaSalida {
  id: number;
  nroNotaSalida: string;
  solicitudId: number;
  almacenOrigenId: number;
  almacenDestinoId: number;
  nroMovimiento: string;
  fechaMovimiento: string;
  estado: string;
  detalles: DetalleNotaSalida[];
}
