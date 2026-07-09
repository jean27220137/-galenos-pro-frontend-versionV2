import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Farmacia, FarmaciaRequest } from '../models/farmacia.model';

@Injectable({ providedIn: 'root' })
export class FarmaciaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/farmacia/farmacias`;

  listar(): Observable<Farmacia[]> {
    return this.http.get<Farmacia[]>(this.base);
  }

  listarTodas(): Observable<Farmacia[]> {
    return this.http.get<Farmacia[]>(`${this.base}/todas`);
  }

  buscarPorId(id: number): Observable<Farmacia> {
    return this.http.get<Farmacia>(`${this.base}/${id}`);
  }

  crear(dto: FarmaciaRequest): Observable<Farmacia> {
    return this.http.post<Farmacia>(this.base, dto);
  }

  actualizar(id: number, dto: FarmaciaRequest): Observable<Farmacia> {
    return this.http.put<Farmacia>(`${this.base}/${id}`, dto);
  }

  desactivar(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/desactivar`, {});
  }

  activar(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/activar`, {});
  }
}
