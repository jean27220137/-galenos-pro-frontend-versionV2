import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UsuarioSesion } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;
  private readonly SESSION_KEY = 'galenos_sesion';

  login(email: string, password: string): Observable<UsuarioSesion> {
    return this.http.post<UsuarioSesion>(`${this.base}/api/auth/login`, { email, password }).pipe(
      tap(sesion => localStorage.setItem(this.SESSION_KEY, JSON.stringify(sesion)))
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.base}/api/auth/logout`, {}).pipe(
      tap(() => localStorage.removeItem(this.SESSION_KEY))
    );
  }

  getSesion(): UsuarioSesion | null {
    const raw = localStorage.getItem(this.SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  estaAutenticado(): boolean {
    return this.getSesion() !== null;
  }

  tieneRol(...roles: string[]): boolean {
    const sesion = this.getSesion();
    return sesion ? roles.includes(sesion.rol) : false;
  }

  cerrarSesionLocal(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }
}
