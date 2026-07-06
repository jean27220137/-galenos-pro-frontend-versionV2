import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Farmacia } from '../models/farmacia.model';

@Injectable({ providedIn: 'root' })
export class FarmaciaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/farmacia/farmacias`;

  listar(): Observable<Farmacia[]> {
    return this.http.get<Farmacia[]>(this.base);
  }

  buscarPorId(id: number): Observable<Farmacia> {
    return this.http.get<Farmacia>(`${this.base}/${id}`);
  }
}
