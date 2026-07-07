import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  rol: string;
  cargo: string;
  farmaciaId: number | null;
  activo: number;
}

export interface UsuarioRequest {
  nombres: string;
  apellidos: string;
  email: string;
  password?: string;
  rol: string;
  cargo: string;
  farmaciaId: number | null;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/auth/usuarios`;

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.base);
  }

  crear(dto: UsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.base, dto);
  }

  actualizar(id: number, dto: UsuarioRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.base}/${id}`, dto);
  }

  desactivar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
