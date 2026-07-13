import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { UsuarioSesion } from '../../../core/models/usuario.model';

const mockSesion = (rol: string): UsuarioSesion => ({
  userId: 1, rol, farmaciaId: 1, token: 'tok', expira: '2099-01-01'
});

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let comp: LoginComponent;
  let router: Router;
  let auth: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    comp = fixture.componentInstance;
    router = TestBed.inject(Router);
    auth  = TestBed.inject(AuthService);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  afterEach(() => vi.restoreAllMocks());

  it('se crea y renderiza correctamente', () => {
    expect(comp).toBeTruthy();
    expect(comp.form).toBeTruthy();
  });

  it('f getter retorna los controles', () => {
    expect(comp.f['email']).toBeTruthy();
    expect(comp.f['password']).toBeTruthy();
  });

  it('onSubmit con form inválido marca touched y no llama login', () => {
    vi.spyOn(auth, 'login');
    comp.onSubmit();
    expect(auth.login).not.toHaveBeenCalled();
    expect(comp.form.touched).toBe(true);
  });

  it('onSubmit con email inválido no llama login', () => {
    vi.spyOn(auth, 'login');
    comp.form.setValue({ email: 'no-es-email', password: '' });
    comp.onSubmit();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('JEFE_FARMACIA navega a /farmacia/solicitudes', () => {
    vi.spyOn(auth, 'login').mockReturnValue(of(mockSesion('JEFE_FARMACIA')));
    comp.form.setValue({ email: 'jefe@h.com', password: 'clave' });
    comp.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/farmacia/solicitudes']);
    expect(comp.cargando).toBe(false);
  });

  it('FARMACEUTICO navega a /farmacia/solicitudes', () => {
    vi.spyOn(auth, 'login').mockReturnValue(of(mockSesion('FARMACEUTICO')));
    comp.form.setValue({ email: 'far@h.com', password: 'clave' });
    comp.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/farmacia/solicitudes']);
  });

  it('ALMACENERO navega a /almacen/dashboard', () => {
    vi.spyOn(auth, 'login').mockReturnValue(of(mockSesion('ALMACENERO')));
    comp.form.setValue({ email: 'alm@h.com', password: 'clave' });
    comp.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/almacen/dashboard']);
  });

  it('ADMIN navega a /admin/usuarios', () => {
    vi.spyOn(auth, 'login').mockReturnValue(of(mockSesion('ADMIN')));
    comp.form.setValue({ email: 'admin@h.com', password: 'clave' });
    comp.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/usuarios']);
  });

  it('login fallido muestra error y desactiva cargando', () => {
    vi.spyOn(auth, 'login').mockReturnValue(throwError(() => new Error('401')));
    comp.form.setValue({ email: 'x@x.com', password: 'wrong' });
    comp.onSubmit();
    expect(comp.error).toContain('Credenciales inválidas');
    expect(comp.cargando).toBe(false);
  });

  it('error se limpia al enviar nuevo intento', () => {
    comp.error = 'Error previo';
    vi.spyOn(auth, 'login').mockReturnValue(of(mockSesion('ADMIN')));
    comp.form.setValue({ email: 'admin@h.com', password: 'clave' });
    comp.onSubmit();
    expect(comp.error).toBe('');
  });

  it('propiedad error se puede establecer', () => {
    comp.error = 'Credenciales inválidas.';
    expect(comp.error).toBeTruthy();
  });

  it('cargando refleja el estado de la petición', () => {
    vi.spyOn(auth, 'login').mockReturnValue(of(mockSesion('ADMIN')));
    comp.form.setValue({ email: 'admin@h.com', password: 'clave' });
    expect(comp.cargando).toBe(false);
    comp.onSubmit();
    expect(comp.cargando).toBe(false); // sync observable completes immediately
  });
});
