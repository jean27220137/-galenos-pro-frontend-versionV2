export interface Stock {
  id: number;
  medicamentoId: number;
  codigoSismed: string;
  nombreMedicamento: string;
  almacenId: number;
  lote: string;
  cantidad: number;
  fechaVencimiento: string;
  precioUnitario: number;
}

export interface EntradaStockRequest {
  medicamentoId: number;
  almacenId: number;
  lote: string;
  cantidad: number;
  fechaVencimiento: string;
  precioUnitario: number;
}
