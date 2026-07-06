import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';
import { routes } from '../../app.routes';
import { vi } from 'vitest';

describe('authGuard', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient()]
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    localStorage.clear();
    vi.spyOn(router, 'navigate').mockImplementation(async () => true);
  });

  afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

  it('redirige a /login si no hay sesión', () => {
    vi.spyOn(authService, 'estaAutenticado').mockReturnValue(false);
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('permite acceso si hay sesión activa', () => {
    vi.spyOn(authService, 'estaAutenticado').mockReturnValue(true);
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(result).toBe(true);
  });
});
