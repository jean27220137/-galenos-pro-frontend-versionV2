import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Medicamento } from '../models/medicamento.model';

export interface MedicamentoRequest {
  codigoSismed: string;
  nombre: string;
  presentacion: string;
  concentracion: string;
  viaAdministracion: string;
  stockMinimo: number;
}

@Injectable({ providedIn: 'root' })
export class MedicamentoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/almacen/medicamentos`;

  listar(): Observable<Medicamento[]> {
    return this.http.get<Medicamento[]>(this.base);
  }

  buscarPorId(id: number): Observable<Medicamento> {
    return this.http.get<Medicamento>(`${this.base}/${id}`);
  }

  crear(dto: MedicamentoRequest): Observable<Medicamento> {
    return this.http.post<Medicamento>(this.base, dto);
  }
}
