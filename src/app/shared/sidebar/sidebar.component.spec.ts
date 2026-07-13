import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { MessageService } from 'primeng/api';
import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../core/services/auth.service';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let comp: SidebarComponent;
  let http: HttpTestingController;
  let authSvc: AuthService;
  let router: Router;

  const buildWithRol = async (rol: string) => {
    localStorage.setItem('galenos_sesion', JSON.stringify({ userId: 1, rol, farmaciaId: 1, token: 'tok', expira: '2099-01-01' }));
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
      ]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    authSvc = TestBed.inject(AuthService);
    router  = TestBed.inject(Router);
    fixture = TestBed.createComponent(SidebarComponent);
    comp    = fixture.componentInstance;
    fixture.detectChanges();
  };

  afterEach(() => { http.verify(); localStorage.clear(); TestBed.resetTestingModule(); });

  it('construye navItems para ALMACENERO', async () => {
    await buildWithRol('ALMACENERO');
    expect(comp.navItems.length).toBeGreaterThan(0);
    expect(comp.inicial).toBe('A');
  });

  it('construye navItems para ADMIN', async () => {
    await buildWithRol('ADMIN');
    expect(comp.navItems.some(n => n.route.includes('/admin'))).toBe(true);
  });

  it('construye navItems para JEFE_FARMACIA', async () => {
    await buildWithRol('JEFE_FARMACIA');
    expect(comp.navItems.some(n => n.label === 'Nueva Solicitud')).toBe(true);
  });

  it('construye navItems para FARMACEUTICO (default)', async () => {
    await buildWithRol('FARMACEUTICO');
    expect(comp.navItems.length).toBeGreaterThan(0);
    expect(comp.rol).toBe('FARMACEUTICO');
  });

  it('trackByRoute retorna el route del item', async () => {
    await buildWithRol('ALMACENERO');
    expect(comp.trackByRoute(0, { label: 'X', icon: 'pi-x', route: '/test' })).toBe('/test');
  });

  it('cerrarSesion navega a /login en éxito', async () => {
    await buildWithRol('ALMACENERO');
    const navigateSpy = vi.spyOn(router, 'navigate');
    comp.cerrarSesion();
    const req = http.expectOne(r => r.url.includes('/logout'));
    req.flush(null);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('cerrarSesion llama cerrarSesionLocal y navega en error', async () => {
    await buildWithRol('ALMACENERO');
    const navigateSpy = vi.spyOn(router, 'navigate');
    const localSpy    = vi.spyOn(authSvc, 'cerrarSesionLocal');
    comp.cerrarSesion();
    const req = http.expectOne(r => r.url.includes('/logout'));
    req.flush(null, { status: 500, statusText: 'Error' });
    expect(localSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('muestra "Usuario" cuando no hay sesión', async () => {
    localStorage.clear();
    await buildWithRol('');
    expect(comp.nombre).toBe('Usuario #1');
  });
});
