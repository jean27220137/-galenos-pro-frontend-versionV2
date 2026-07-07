export interface StockCriticoItem {
  medicamentoNombre: string;
  codigoSismed: string;
  presentacion: string;
  cantidadActual: number;
  stockMinimo: number;
}

export interface ProximoVencerItem {
  medicamentoNombre: string;
  codigoSismed: string;
  lote: string;
  fechaVencimiento: string;
  diasRestantes: number;
  cantidad: number;
  almacenNombre: string;
}

export interface SolicitudPendienteItem {
  id: number;
  nroSolicitud: string;
  farmaciaId: number;
  almacenId: number;
  farmaceuticoId: number;
  fechaSolicitud: string;
  estado: string;
  observacion?: string;
  notaSalidaId?: number;
  detalles?: any[];
}
