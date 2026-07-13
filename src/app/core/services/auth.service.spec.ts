import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { UsuarioSesion } from '../models/usuario.model';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  const mockSesion: UsuarioSesion = {
    userId: 1, rol: 'JEFE_FARMACIA',
    farmaciaId: 1, token: 'token-abc', expira: '2026-01-01T00:00:00'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('login exitoso guarda sesión en localStorage', () => {
    let resultado: UsuarioSesion | undefined;
    service.login('juan@test.com', '1234').subscribe(s => resultado = s);
    const req = http.expectOne(r => r.url.includes('/api/auth/login'));
    expect(req.request.method).toBe('POST');
    req.flush(mockSesion);
    expect(resultado?.rol).toBe('JEFE_FARMACIA');
    expect(localStorage.getItem('galenos_sesion')).toBeTruthy();
  });

  it('logout elimina sesión del localStorage', () => {
    localStorage.setItem('galenos_sesion', JSON.stringify(mockSesion));
    service.logout().subscribe();
    const req = http.expectOne(r => r.url.includes('/api/auth/logout'));
    req.flush(null);
    expect(localStorage.getItem('galenos_sesion')).toBeNull();
  });

  it('estaAutenticado retorna false sin sesión', () => {
    expect(service.estaAutenticado()).toBe(false);
  });

  it('estaAutenticado retorna true con sesión activa', () => {
    localStorage.setItem('galenos_sesion', JSON.stringify(mockSesion));
    expect(service.estaAutenticado()).toBe(true);
  });

  it('tieneRol retorna true cuando el rol coincide', () => {
    localStorage.setItem('galenos_sesion', JSON.stringify(mockSesion));
    expect(service.tieneRol('JEFE_FARMACIA', 'ADMIN')).toBe(true);
  });

  it('tieneRol retorna false cuando el rol no coincide', () => {
    localStorage.setItem('galenos_sesion', JSON.stringify(mockSesion));
    expect(service.tieneRol('ALMACENERO')).toBe(false);
  });

  it('tieneRol retorna false sin sesión activa', () => {
    expect(service.tieneRol('ADMIN')).toBe(false);
  });
});
