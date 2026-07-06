import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { UsuarioSesion } from '../../../core/models/usuario.model';
import { vi } from 'vitest';

describe('LoginComponent (lógica)', () => {
  const mockSesion: UsuarioSesion = {
    userId: 1, rol: 'JEFE_FARMACIA',
    farmaciaId: 1, token: 'tok', expira: '2026-01-01T00:00:00'
  };

  let authService: AuthService;
  let router: Router;
  let component: LoginComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideRouter([])]
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component = TestBed.runInInjectionContext(() => new LoginComponent());
  });

  afterEach(() => vi.restoreAllMocks());

  it('onSubmit no llama login si el form está vacío', () => {
    vi.spyOn(authService, 'login');
    component.form.controls['email'].setValue('');
    component.form.controls['password'].setValue('');
    component.onSubmit();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('login exitoso navega al módulo de farmacia', () => {
    vi.spyOn(authService, 'login').mockReturnValue(of(mockSesion));
    component.form.controls['email'].setValue('ana@test.com');
    component.form.controls['password'].setValue('clave');
    component.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/farmacia/solicitudes']);
  });

  it('login fallido establece mensaje de error', () => {
    vi.spyOn(authService, 'login').mockReturnValue(throwError(() => new Error('401')));
    component.form.controls['email'].setValue('x@x.com');
    component.form.controls['password'].setValue('wrong');
    component.onSubmit();
    expect(component.error).toBe('Credenciales inválidas. Verifique su correo y contraseña.');
  });

  it('ALMACENERO navega a /almacen/dashboard', () => {
    const sesionAlmacenero: UsuarioSesion = { ...mockSesion, rol: 'ALMACENERO' };
    vi.spyOn(authService, 'login').mockReturnValue(of(sesionAlmacenero));
    component.form.controls['email'].setValue('al@test.com');
    component.form.controls['password'].setValue('clave');
    component.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/almacen/dashboard']);
  });

  it('ADMIN navega a /admin/usuarios', () => {
    const sesionAdmin: UsuarioSesion = { ...mockSesion, rol: 'ADMIN' };
    vi.spyOn(authService, 'login').mockReturnValue(of(sesionAdmin));
    component.form.controls['email'].setValue('admin@test.com');
    component.form.controls['password'].setValue('clave');
    component.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/usuarios']);
  });
});
