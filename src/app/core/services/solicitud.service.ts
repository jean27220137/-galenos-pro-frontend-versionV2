import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Solicitud, SolicitudRequest } from '../models/solicitud.model';

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/farmacia/solicitudes`;

  listarPorFarmacia(farmaciaId: number): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(`${this.base}?farmaciaId=${farmaciaId}`);
  }

  listarPorEstado(estado: string): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(`${this.base}?estado=${estado}`);
  }

  buscarPorId(id: number): Observable<Solicitud> {
    return this.http.get<Solicitud>(`${this.base}/${id}`);
  }

  consultarEstado(id: number): Observable<{ estado: string }> {
    return this.http.get<{ estado: string }>(`${this.base}/${id}/estado`);
  }

  crear(dto: SolicitudRequest): Observable<Solicitud> {
    return this.http.post<Solicitud>(this.base, dto);
  }

  aprobar(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/aprobar`, {});
  }

  cancelar(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/cancelar`, {});
  }

  marcarEnProceso(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/en-proceso`, {});
  }

  listarActivas(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(`${this.base}/activas`);
  }

  confirmarEntrega(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/entregar`, {});
  }

  rechazar(id: number, motivo: string): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/rechazar`, { motivo });
  }
}
