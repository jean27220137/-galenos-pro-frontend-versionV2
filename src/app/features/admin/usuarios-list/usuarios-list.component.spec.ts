import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { MessageService } from 'primeng/api';
import { UsuariosListComponent } from './usuarios-list.component';
import { Usuario } from '../../../core/services/usuario.service';

const mockUs: Usuario[] = [
  { id: 1, nombres: 'Juan', apellidos: 'Pérez', email: 'juan@test.com',
    rol: 'FARMACEUTICO', cargo: 'QF', farmaciaId: 1, activo: 1 },
  { id: 2, nombres: 'Ana', apellidos: 'García', email: 'ana@test.com',
    rol: 'JEFE_FARMACIA', cargo: 'Jefe QF', farmaciaId: 1, activo: 1 },
];

describe('UsuariosListComponent', () => {
  let fixture: ComponentFixture<UsuariosListComponent>;
  let comp: UsuariosListComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuariosListComponent],
      providers: [
        provideZonelessChangeDetection(), provideHttpClient(),
        provideHttpClientTesting(), provideRouter([]), MessageService,
      ]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(UsuariosListComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const flushInit = (us: Usuario[] = mockUs) => {
    http.expectOne(r => r.url.includes('/usuarios') && r.method === 'GET').flush(us);
    http.expectOne(r => r.url.includes('/farmacias/todas')).flush([]);
    fixture.detectChanges();
  };

  it('se crea y carga usuarios', () => {
    flushInit();
    expect(comp.usuarios.length).toBe(2);
    expect(comp.cargando).toBe(false);
  });

  it('usuariosFiltrados filtra por nombre', () => {
    flushInit();
    comp.busqueda = 'juan';
    expect(comp.usuariosFiltrados.length).toBe(1);
  });

  it('usuariosFiltrados filtra por email', () => {
    flushInit();
    comp.busqueda = 'ana@';
    expect(comp.usuariosFiltrados.length).toBe(1);
  });

  it('usuariosFiltrados retorna todos sin búsqueda', () => {
    flushInit();
    expect(comp.usuariosFiltrados.length).toBe(2);
  });

  it('abrirCrear abre el dialog en modo crear', () => {
    flushInit();
    comp.abrirCrear();
    expect(comp.dialogVisible).toBe(true);
    expect(comp.editandoId).toBeNull();
  });

  it('abrirEditar carga los datos del usuario', () => {
    flushInit();
    comp.abrirEditar(mockUs[0]);
    expect(comp.editandoId).toBe(1);
    expect(comp.form.value.nombres).toBe('Juan');
  });

  it('cerrarDialog limpia el estado', () => {
    flushInit();
    comp.abrirCrear();
    comp.cerrarDialog();
    expect(comp.dialogVisible).toBe(false);
    expect(comp.editandoId).toBeNull();
  });

  it('guardar con form inválido marca touched', () => {
    flushInit();
    comp.abrirCrear();
    comp.form.reset();
    comp.guardar();
    expect(comp.form.touched).toBe(true);
  });

  it('guardar crear llama POST y agrega usuario', () => {
    flushInit();
    comp.abrirCrear();
    comp.form.patchValue({ nombres: 'Luis', apellidos: 'Torres', email: 'luis@test.com',
                           password: 'pass1234', rol: 'ALMACENERO', cargo: 'ALM', farmaciaId: null });
    comp.guardar();
    const nuevo = { ...mockUs[0], id: 3, nombres: 'Luis' };
    http.expectOne(r => r.url.includes('/usuarios') && r.method === 'POST').flush(nuevo);
    expect(comp.usuarios.some(u => u.id === 3)).toBe(true);
  });

  it('guardar editar llama PUT y actualiza usuario', () => {
    flushInit();
    comp.abrirEditar(mockUs[0]);
    comp.form.patchValue({ nombres: 'Juan Editado' });
    comp.guardar();
    const actualizado = { ...mockUs[0], nombres: 'Juan Editado' };
    http.expectOne(r => r.url.includes('/usuarios/1') && r.method === 'PUT').flush(actualizado);
    expect(comp.usuarios[0].nombres).toBe('Juan Editado');
  });

  it('guardar muestra error si la operación falla', () => {
    flushInit();
    comp.abrirCrear();
    comp.form.patchValue({ nombres: 'Luis', apellidos: 'Torres', email: 'luis@test.com',
                           password: 'pass1234', rol: 'ALMACENERO', cargo: '', farmaciaId: null });
    comp.guardar();
    http.expectOne(r => r.url.includes('/usuarios') && r.method === 'POST')
        .flush(null, { status: 400, statusText: 'Error' });
    expect(comp.error).toBeTruthy();
  });

  it('guardar editar muestra error de actualización si PUT falla', () => {
    flushInit();
    comp.abrirEditar(mockUs[0]);
    comp.form.patchValue({ nombres: 'Juan Editado' });
    comp.guardar();
    http.expectOne(r => r.url.includes('/usuarios/1') && r.method === 'PUT')
        .flush(null, { status: 500, statusText: 'Error' });
    expect(comp.error).toContain('actualizar');
  });

  it('confirmarDesactivar cancela si el usuario niega', () => {
    flushInit();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    comp.confirmarDesactivar(mockUs[0]);
    http.expectNone(r => r.url.includes('/usuarios/1') && r.method === 'DELETE');
  });

  it('confirmarDesactivar llama DELETE si el usuario confirma', () => {
    flushInit();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    comp.confirmarDesactivar(mockUs[0]);
    http.expectOne(r => r.url.includes('/usuarios/1') && r.method === 'DELETE').flush(null);
    expect(comp.usuarios[0].activo).toBe(0);
  });

  it('confirmarDesactivar muestra error si DELETE falla', () => {
    flushInit();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    comp.confirmarDesactivar(mockUs[0]);
    http.expectOne(r => r.url.includes('/usuarios/1') && r.method === 'DELETE')
        .flush(null, { status: 500, statusText: 'Error' });
    expect(comp.usuarios[0].activo).toBe(1);
  });

  it('farmaciaOpciones mapea farmacias a etiquetas', () => {
    http.expectOne(r => r.url.includes('/usuarios') && r.method === 'GET').flush(mockUs);
    http.expectOne(r => r.url.includes('/farmacias/todas'))
        .flush([{ id: 1, nombre: 'Farmacia Central', codigo: 'FC01', tipo: 'CENTRAL',
                  area: 'A1', ubicacion: 'U1', departamento: 'Lima', jefeId: null,
                  jefeNombre: '', telefono: '', activo: 1 }]);
    fixture.detectChanges();
    const opts = comp.farmaciaOpciones;
    expect(opts[0].label).toBe('Farmacia Central');
    expect(opts[0].value).toBe(1);
  });

  it('catchError en farmacias retorna lista vacía silenciosamente', () => {
    http.expectOne(r => r.url.includes('/usuarios') && r.method === 'GET').flush(mockUs);
    http.expectOne(r => r.url.includes('/farmacias/todas'))
        .flush(null, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(comp.farmacias.length).toBe(0);
  });

  it('error al cargar usuarios muestra cargando false', () => {
    http.expectOne(r => r.url.includes('/usuarios') && r.method === 'GET')
        .flush(null, { status: 500, statusText: 'Error' });
    http.expectOne(r => r.url.includes('/farmacias/todas')).flush([]);
    fixture.detectChanges();
    expect(comp.cargando).toBe(false);
  });
});
