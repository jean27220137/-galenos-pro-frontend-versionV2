import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { roleGuard } from './role.guard';
import { routes } from '../../app.routes';
import { vi } from 'vitest';

describe('roleGuard', () => {
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

  it('permite acceso cuando el usuario tiene el rol requerido', () => {
    vi.spyOn(authService, 'tieneRol').mockReturnValue(true);
    const route = { data: { roles: ['JEFE_FARMACIA'] } } as unknown as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as any));
    expect(result).toBe(true);
  });

  it('redirige a /login cuando el usuario no tiene el rol requerido', () => {
    vi.spyOn(authService, 'tieneRol').mockReturnValue(false);
    const route = { data: { roles: ['ADMIN'] } } as unknown as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as any));
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
