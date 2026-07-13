import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { MessageService } from 'primeng/api';
import { FarmaciasListComponent } from './farmacias-list.component';
import { Farmacia } from '../../../core/models/farmacia.model';
import { Usuario } from '../../../core/services/usuario.service';

const mockFarm: Farmacia[] = [
  { id: 1, codigo: 'FAR-001', nombre: 'Farmacia Central', tipo: 'CONSULTA_EXTERNA', area: 'Planta Baja',
    activo: 1, ubicacion: '', departamento: '', jefeId: null, jefeNombre: '', telefono: '' },
  { id: 2, codigo: 'FAR-002', nombre: 'Farmacia Emergencias', tipo: 'EMERGENCIA', area: 'Emergencias',
    activo: 0, ubicacion: '', departamento: '', jefeId: null, jefeNombre: '', telefono: '' },
];
const mockJefes: Usuario[] = [
  { id: 10, nombres: 'Carmen', apellidos: 'López', email: 'carmen@test.com',
    rol: 'JEFE_FARMACIA', cargo: 'Jefe', farmaciaId: 1, activo: 1 },
];

describe('FarmaciasListComponent', () => {
  let fixture: ComponentFixture<FarmaciasListComponent>;
  let comp: FarmaciasListComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmaciasListComponent],
      providers: [
        provideZonelessChangeDetection(), provideHttpClient(),
        provideHttpClientTesting(), provideRouter([]), MessageService,
      ]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(FarmaciasListComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const flushInit = () => {
    http.expectOne(r => r.url.includes('/farmacias/todas')).flush(mockFarm);
    http.expectOne(r => r.url.includes('/usuarios') && r.method === 'GET').flush(mockJefes);
    fixture.detectChanges();
  };

  it('se crea y carga farmacias y jefes', () => {
    flushInit();
    expect(comp.farmacias.length).toBe(2);
    expect(comp.jefesOpciones.length).toBe(1);
  });

  it('farmaciasFiltradas filtra por nombre', () => {
    flushInit();
    comp.busqueda = 'central';
    expect(comp.farmaciasFiltradas.length).toBe(1);
  });

  it('farmaciasFiltradas filtra por código', () => {
    flushInit();
    comp.busqueda = 'FAR-002';
    expect(comp.farmaciasFiltradas.length).toBe(1);
  });

  it('farmaciasFiltradas retorna todas sin búsqueda', () => {
    flushInit();
    expect(comp.farmaciasFiltradas.length).toBe(2);
  });

  it('tipoLabel retorna la etiqueta correcta', () => {
    flushInit();
    expect(comp.tipoLabel('EMERGENCIA')).toBe('Emergencias');
    expect(comp.tipoLabel('UNKNOWN')).toBe('UNKNOWN');
  });

  it('tipoBg retorna color según tipo', () => {
    flushInit();
    expect(comp.tipoBg('EMERGENCIA')).toBe('#FEF3C7');
    expect(comp.tipoBg('OTRO')).toBe('#F1F5F9');
  });

  it('onJefeSeleccionado actualiza jefeNombre', () => {
    flushInit();
    comp['jefes'] = mockJefes;
    comp.onJefeSeleccionado({ value: 10 });
    expect(comp.form.value.jefeNombre).toContain('Carmen');
  });

  it('onJefeSeleccionado con null limpia jefeNombre', () => {
    flushInit();
    comp.onJefeSeleccionado({ value: null });
    expect(comp.form.value.jefeNombre).toBe('');
  });

  it('onJefeSeleccionado con ID no encontrado no actualiza jefeNombre', () => {
    flushInit();
    comp['jefes'] = mockJefes;
    const prevNombre = comp.form.value.jefeNombre;
    comp.onJefeSeleccionado({ value: 999 });
    expect(comp.form.value.jefeNombre).toBe(prevNombre);
  });

  it('abrirCrear inicializa dialog vacío', () => {
    flushInit();
    comp.abrirCrear();
    expect(comp.dialogVisible).toBe(true);
    expect(comp.editandoId).toBeNull();
  });

  it('abrirEditar carga datos de la farmacia', () => {
    flushInit();
    comp.abrirEditar(mockFarm[0]);
    expect(comp.editandoId).toBe(1);
    expect(comp.form.getRawValue().codigo).toBe('FAR-001');
  });

  it('cerrarDialog limpia estado', () => {
    flushInit();
    comp.abrirCrear();
    comp.cerrarDialog();
    expect(comp.dialogVisible).toBe(false);
    expect(comp.editandoId).toBeNull();
  });

  it('guardar con form inválido marca touched', () => {
    flushInit();
    comp.form.reset();
    comp.guardar();
    expect(comp.form.touched).toBe(true);
  });

  it('guardar crear llama POST y añade farmacia', () => {
    flushInit();
    comp.abrirCrear();
    comp.form.patchValue({ codigo: 'FAR-003', nombre: 'Nueva Farmacia', tipo: 'UCI',
                           departamento: '', area: '', ubicacion: '', jefeId: null, jefeNombre: '', telefono: '' });
    comp.guardar();
    const nueva = { ...mockFarm[0], id: 3, codigo: 'FAR-003', nombre: 'Nueva Farmacia' };
    http.expectOne(r => r.url.includes('/farmacias') && r.method === 'POST').flush(nueva);
    expect(comp.farmacias.length).toBe(3);
  });

  it('guardar editar llama PUT y actualiza farmacia', () => {
    flushInit();
    comp.abrirEditar(mockFarm[0]);
    comp.form.patchValue({ nombre: 'Farmacia Actualizada' });
    comp.guardar();
    const actualizada = { ...mockFarm[0], nombre: 'Farmacia Actualizada' };
    http.expectOne(r => r.url.includes('/farmacias/1') && r.method === 'PUT').flush(actualizada);
    expect(comp.farmacias[0].nombre).toBe('Farmacia Actualizada');
  });

  it('guardar muestra error si operación falla', () => {
    flushInit();
    comp.abrirCrear();
    comp.form.patchValue({ codigo: 'FAR-003', nombre: 'X', tipo: 'UCI',
                           departamento: '', area: '', ubicacion: '', jefeId: null, jefeNombre: '', telefono: '' });
    comp.guardar();
    http.expectOne(r => r.url.includes('/farmacias') && r.method === 'POST')
        .flush({ error: 'Código en uso' }, { status: 400, statusText: 'Error' });
    expect(comp.errorDialog).toBeTruthy();
  });

  it('confirmarDesactivar cancela si usuario niega', () => {
    flushInit();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    comp.confirmarDesactivar(mockFarm[0]);
    http.expectNone(r => r.url.includes('/desactivar'));
  });

  it('confirmarDesactivar llama PUT /desactivar si confirma', () => {
    flushInit();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    comp.confirmarDesactivar(mockFarm[0]);
    http.expectOne(r => r.url.includes('/farmacias/1/desactivar')).flush(null);
    expect(comp.farmacias[0].activo).toBe(0);
  });

  it('confirmarDesactivar muestra error si falla', () => {
    flushInit();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    comp.confirmarDesactivar(mockFarm[0]);
    http.expectOne(r => r.url.includes('/farmacias/1/desactivar'))
        .flush(null, { status: 500, statusText: 'Error' });
    expect(comp.farmacias[0].activo).toBe(1);
  });

  it('confirmarActivar cancela si usuario niega', () => {
    flushInit();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    comp.confirmarActivar(mockFarm[1]);
    http.expectNone(r => r.url.includes('/activar'));
  });

  it('confirmarActivar llama PUT /activar si confirma', () => {
    flushInit();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    comp.confirmarActivar(mockFarm[1]);
    http.expectOne(r => r.url.includes('/farmacias/2/activar')).flush(null);
    expect(comp.farmacias[1].activo).toBe(1);
  });

  it('confirmarActivar muestra error si falla', () => {
    flushInit();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    comp.confirmarActivar(mockFarm[1]);
    http.expectOne(r => r.url.includes('/farmacias/2/activar'))
        .flush(null, { status: 500, statusText: 'Error' });
    expect(comp.farmacias[1].activo).toBe(0);
  });

  it('maneja error de forkJoin en ngOnInit', () => {
    http.expectOne(r => r.url.includes('/usuarios') && r.method === 'GET').flush([]);
    http.expectOne(r => r.url.includes('/farmacias/todas')).flush(null, { status: 500, statusText: 'Error' });
    expect(comp.error).toBeTruthy();
    expect(comp.cargando).toBe(false);
  });
});
