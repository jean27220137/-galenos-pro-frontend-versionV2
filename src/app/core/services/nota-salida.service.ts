import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotaSalida } from '../models/nota-salida.model';

export interface DespachoRequest {
  solicitudId:     number;
  almacenId:       number;
  almacenDestinoId: number;
  farmaciaId:      number;
  detalles: { medicamentoId: number; cantidadSolicitada: number }[];
}

@Injectable({ providedIn: 'root' })
export class NotaSalidaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/almacen/notas-salida`;
  private readonly despachoBase = `${environment.apiUrl}/api/almacen/despacho`;

  listarPorAlmacen(almacenId: number): Observable<NotaSalida[]> {
    return this.http.get<NotaSalida[]>(`${this.base}?almacenId=${almacenId}`);
  }

  buscarPorId(id: number): Observable<NotaSalida> {
    return this.http.get<NotaSalida>(`${this.base}/${id}`);
  }

  confirmarEntrega(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/entregar`, {});
  }

  despachar(dto: DespachoRequest): Observable<NotaSalida> {
    return this.http.post<NotaSalida>(this.despachoBase, dto);
  }
}
