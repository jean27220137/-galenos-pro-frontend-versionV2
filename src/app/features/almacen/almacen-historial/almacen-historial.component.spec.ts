import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AlmacenHistorialComponent } from './almacen-historial.component';
import { Solicitud } from '../../../core/models/solicitud.model';

const base = (id: number, estado: string, extra: Partial<Solicitud> = {}): Solicitud => ({
  id, nroSolicitud: `SOL-00000${id}`, farmaciaId: 1, almacenId: 1,
  farmaceuticoId: 5, fechaSolicitud: '2026-07-01', estado,
  detalles: [{ id: id * 10, medicamentoId: 1, cantidadSolicitada: 5 }],
  ...extra
});

describe('AlmacenHistorialComponent', () => {
  let fixture: ComponentFixture<AlmacenHistorialComponent>;
  let comp: AlmacenHistorialComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlmacenHistorialComponent],
      providers: [
        provideZonelessChangeDetection(), provideHttpClient(),
        provideHttpClientTesting(), provideRouter([]), MessageService,
      ]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AlmacenHistorialComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const flushInit = (desp: Solicitud[] = [], entr: Solicitud[] = [], rech: Solicitud[] = []) => {
    http.expectOne(r => r.url.includes('/medicamentos')).flush([]);
    http.expectOne(r => r.url.includes('estado=DESPACHADA')).flush(desp);
    http.expectOne(r => r.url.includes('estado=ENTREGADA')).flush(entr);
    http.expectOne(r => r.url.includes('estado=RECHAZADA')).flush(rech);
    fixture.detectChanges();
  };

  it('se crea y carga datos del historial', () => {
    flushInit([base(1, 'DESPACHADA')], [base(2, 'ENTREGADA')], [base(3, 'RECHAZADA')]);
    expect(comp.solicitudes.length).toBe(3);
    expect(comp.cargando).toBe(false);
  });

  it('kpis cuenta correctamente cada estado', () => {
    flushInit([base(1, 'DESPACHADA')], [base(2, 'ENTREGADA')], [base(3, 'RECHAZADA')]);
    expect(comp.kpis[0].valor).toBe(3);
    expect(comp.kpis[1].valor).toBe(1);
    expect(comp.kpis[2].valor).toBe(1);
    expect(comp.kpis[3].valor).toBe(1);
  });

  it('solicitudesFiltradas filtra por estado', () => {
    flushInit([base(1, 'DESPACHADA')], [base(2, 'ENTREGADA')], []);
    comp.estadoFiltro = 'DESPACHADA';
    expect(comp.solicitudesFiltradas.length).toBe(1);
    comp.estadoFiltro = 'TODOS';
    expect(comp.solicitudesFiltradas.length).toBe(2);
  });

  it('solicitudesFiltradas filtra por búsqueda', () => {
    flushInit([base(1, 'DESPACHADA')], [], []);
    comp.busqueda = 'SOL-000001';
    expect(comp.solicitudesFiltradas.length).toBe(1);
    comp.busqueda = 'SOL-999';
    expect(comp.solicitudesFiltradas.length).toBe(0);
  });

  it('toggleRow expande y colapsa filas y re-renderiza', () => {
    flushInit([base(1, 'DESPACHADA', { notaSalidaId: 42 })], [], []);
    const sol = comp.solicitudes[0];
    comp.toggleRow(sol);
    fixture.detectChanges();
    expect(comp.expandidos.has(sol.id)).toBe(true);
    comp.toggleRow(sol);
    fixture.detectChanges();
    expect(comp.expandidos.has(sol.id)).toBe(false);
  });

  it('toggleRow con solicitud RECHAZADA con observacion y detectChanges', () => {
    const sol = base(3, 'RECHAZADA', { observacion: 'Faltan unidades' });
    flushInit([], [], [sol]);
    comp.toggleRow(comp.solicitudes[0]);
    fixture.detectChanges();
    expect(comp.expandidos.has(sol.id)).toBe(true);
  });

  it('nombreMed retorna nombre si existe', () => {
    flushInit([], [], []);
    comp['medicamentos'] = [{ id: 1, nombre: 'Amox', codigoSismed: 'M001', presentacion: '',
                               concentracion: '', viaAdministracion: '', stockMinimo: 0, activo: 1 }];
    expect(comp.nombreMed(1)).toContain('Amox');
    expect(comp.nombreMed(99)).toContain('#99');
  });

  it('catchError en medicamentos retorna lista vacía', () => {
    http.expectOne(r => r.url.includes('/medicamentos')).flush(null, { status: 500, statusText: 'Error' });
    http.expectOne(r => r.url.includes('estado=DESPACHADA')).flush([]);
    http.expectOne(r => r.url.includes('estado=ENTREGADA')).flush([]);
    http.expectOne(r => r.url.includes('estado=RECHAZADA')).flush([]);
    fixture.detectChanges();
    expect(comp.solicitudes.length).toBe(0);
  });

  it('catchError en despachadas retorna lista vacía', () => {
    http.expectOne(r => r.url.includes('/medicamentos')).flush([]);
    http.expectOne(r => r.url.includes('estado=DESPACHADA')).flush(null, { status: 500, statusText: 'Error' });
    http.expectOne(r => r.url.includes('estado=ENTREGADA')).flush([base(2, 'ENTREGADA')]);
    http.expectOne(r => r.url.includes('estado=RECHAZADA')).flush([]);
    fixture.detectChanges();
    expect(comp.solicitudes.length).toBe(1);
  });

  it('catchError en entregadas retorna lista vacía', () => {
    http.expectOne(r => r.url.includes('/medicamentos')).flush([]);
    http.expectOne(r => r.url.includes('estado=DESPACHADA')).flush([]);
    http.expectOne(r => r.url.includes('estado=ENTREGADA')).flush(null, { status: 500, statusText: 'Error' });
    http.expectOne(r => r.url.includes('estado=RECHAZADA')).flush([]);
    fixture.detectChanges();
    expect(comp.solicitudes.length).toBe(0);
  });

  it('catchError en rechazadas retorna lista vacía', () => {
    http.expectOne(r => r.url.includes('/medicamentos')).flush([]);
    http.expectOne(r => r.url.includes('estado=DESPACHADA')).flush([]);
    http.expectOne(r => r.url.includes('estado=ENTREGADA')).flush([]);
    http.expectOne(r => r.url.includes('estado=RECHAZADA')).flush(null, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(comp.solicitudes.length).toBe(0);
  });
});
