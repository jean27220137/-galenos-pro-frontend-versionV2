export interface DetalleSolicitud {
  id?: number;
  medicamentoId: number;
  cantidadSolicitada: number;
  cantidadAprobada?: number;
  observacion?: string;
}

export interface Solicitud {
  id: number;
  nroSolicitud: string;
  farmaciaId: number;
  almacenId: number;
  farmaceuticoId: number;
  fechaSolicitud: string;
  estado: string;
  observacion?: string;
  notaSalidaId?: number;
  detalles: DetalleSolicitud[];
}

export interface SolicitudRequest {
  farmaciaId: number;
  almacenId: number;
  detalles: { medicamentoId: number; cantidadSolicitada: number; observacion?: string }[];
}
