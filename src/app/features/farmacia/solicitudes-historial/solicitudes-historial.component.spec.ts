import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { MessageService } from 'primeng/api';
import { SolicitudesHistorialComponent } from './solicitudes-historial.component';
import { Solicitud } from '../../../core/models/solicitud.model';

const base = (id: number, estado: string): Solicitud => ({
  id, nroSolicitud: `SOL-00000${id}`, farmaciaId: 1, almacenId: 1,
  farmaceuticoId: 5, fechaSolicitud: '2026-07-01', estado, detalles: []
});

describe('SolicitudesHistorialComponent', () => {
  let fixture: ComponentFixture<SolicitudesHistorialComponent>;
  let comp: SolicitudesHistorialComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.setItem('galenos_sesion', JSON.stringify({ userId: 1, rol: 'FARMACEUTICO', farmaciaId: 2, token: 'tok', expira: '2099-01-01' }));
    await TestBed.configureTestingModule({
      imports: [SolicitudesHistorialComponent],
      providers: [
        provideZonelessChangeDetection(), provideHttpClient(),
        provideHttpClientTesting(), provideRouter([]), MessageService,
      ]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SolicitudesHistorialComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  const flushInit = (sols: Solicitud[] = []) => {
    http.expectOne(r => r.url.includes('/medicamentos')).flush([]);
    http.expectOne(r => r.url.includes('/solicitudes')).flush(sols);
    fixture.detectChanges();
  };

  it('se crea y carga historial filtrando estados visibles', () => {
    flushInit([base(1, 'ENTREGADA'), base(2, 'PENDIENTE'), base(3, 'DESPACHADA')]);
    expect(comp.solicitudes.some(s => s.estado === 'PENDIENTE')).toBe(false);
    expect(comp.solicitudes.length).toBe(2);
  });

  it('solicitudesFiltradas filtra por estadoFiltro', () => {
    flushInit([base(1, 'ENTREGADA'), base(2, 'DESPACHADA')]);
    comp.estadoFiltro = 'ENTREGADA';
    expect(comp.solicitudesFiltradas.length).toBe(1);
  });

  it('solicitudesFiltradas filtra por búsqueda', () => {
    flushInit([base(1, 'ENTREGADA'), base(2, 'DESPACHADA')]);
    comp.busqueda = 'SOL-000001';
    expect(comp.solicitudesFiltradas.length).toBe(1);
  });

  it('toggleRow expande y colapsa filas', () => {
    flushInit([base(1, 'ENTREGADA')]);
    const sol = comp.solicitudes[0];
    comp.toggleRow(sol);
    expect(comp.expandidos.has(sol.id)).toBe(true);
    comp.toggleRow(sol);
    expect(comp.expandidos.has(sol.id)).toBe(false);
  });

  it('maneja error de forkJoin cuando solicitudes falla', () => {
    http.expectOne(r => r.url.includes('/medicamentos')).flush([]);
    http.expectOne(r => r.url.includes('/solicitudes'))
        .flush(null, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(comp.solicitudes.length).toBe(0);
    expect(comp.cargando).toBe(false);
  });

  it('catchError en medicamentos carga solicitudes de todas formas', () => {
    http.expectOne(r => r.url.includes('/medicamentos'))
        .flush(null, { status: 500, statusText: 'Error' });
    http.expectOne(r => r.url.includes('/solicitudes')).flush([base(1, 'ENTREGADA')]);
    fixture.detectChanges();
    expect(comp.solicitudes.length).toBe(1);
    expect(comp.cargando).toBe(false);
  });

  it('nombreMed retorna nombre si existe', () => {
    flushInit([base(1, 'ENTREGADA')]);
    comp['medicamentos'] = [{ id: 1, nombre: 'Paracetamol', codigoSismed: 'P001',
                               presentacion: '', concentracion: '', viaAdministracion: '', stockMinimo: 0, activo: 1 }];
    expect(comp.nombreMed(1)).toContain('Paracetamol');
    expect(comp.nombreMed(99)).toContain('#99');
  });
});
