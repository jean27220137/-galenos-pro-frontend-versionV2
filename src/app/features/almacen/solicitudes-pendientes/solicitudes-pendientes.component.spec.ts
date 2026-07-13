import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { MessageService } from 'primeng/api';
import { SolicitudesPendientesComponent } from './solicitudes-pendientes.component';
import { Solicitud } from '../../../core/models/solicitud.model';
import { NotaSalida } from '../../../core/models/nota-salida.model';

const base = (id: number, estado: string, detalles: any[] = []): Solicitud => ({
  id, nroSolicitud: `SOL-00000${id}`, farmaciaId: 1, almacenId: 1,
  farmaceuticoId: 5, fechaSolicitud: '2026-07-01', estado, detalles,
});

const mockNota: NotaSalida = {
  id: 10, nroNotaSalida: 'NS-000010', solicitudId: 1,
  almacenOrigenId: 1, almacenDestinoId: 1, nroMovimiento: 'MOV-010',
  fechaMovimiento: '2026-07-01', estado: 'GENERADA', detalles: [],
};

describe('SolicitudesPendientesComponent', () => {
  let fixture: ComponentFixture<SolicitudesPendientesComponent>;
  let comp: SolicitudesPendientesComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitudesPendientesComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
      ]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SolicitudesPendientesComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const flushInit = (sols: Solicitud[]) => {
    http.expectOne(r => r.url.includes('/medicamentos')).flush([]);
    http.expectOne(r => r.url.includes('/activas')).flush(sols);
    fixture.detectChanges();
  };

  it('se crea correctamente y carga solicitudes', () => {
    flushInit([base(1, 'PENDIENTE'), base(2, 'APROBADO_JEFE')]);
    expect(comp.solicitudes.length).toBe(2);
    expect(comp.cargando).toBe(false);
  });

  it('maneja error de carga de solicitudes activas', () => {
    http.expectOne(r => r.url.includes('/medicamentos')).flush([]);
    http.expectOne(r => r.url.includes('/activas'))
        .flush(null, { status: 503, statusText: 'Error' });
    expect(comp.error).toBe(true);
    expect(comp.cargando).toBe(false);
  });

  it('medicamentos: error de carga usa lista vacía', () => {
    http.expectOne(r => r.url.includes('/medicamentos'))
        .flush(null, { status: 500, statusText: 'Error' });
    http.expectOne(r => r.url.includes('/activas')).flush([]);
    expect(comp.medicamentos.length).toBe(0);
  });

  it('paraDespachar cuenta solicitudes en APROBADO_JEFE y EN_PROCESO', () => {
    flushInit([base(1, 'PENDIENTE'), base(2, 'APROBADO_JEFE'), base(3, 'EN_PROCESO'), base(4, 'DESPACHADA')]);
    expect(comp.paraDespachar).toBe(2);
  });

  it('paraDespachar es 0 cuando no hay solicitudes activas', () => {
    flushInit([base(1, 'PENDIENTE')]);
    expect(comp.paraDespachar).toBe(0);
  });

  it('toggleRow expande y colapsa una fila', () => {
    flushInit([base(1, 'PENDIENTE')]);
    const sol = comp.solicitudes[0];
    expect(comp.expandidos.has(sol.id)).toBe(false);
    comp.toggleRow(sol);
    expect(comp.expandidos.has(sol.id)).toBe(true);
    comp.toggleRow(sol);
    expect(comp.expandidos.has(sol.id)).toBe(false);
  });

  it('nombreMed retorna nombre del medicamento si existe', () => {
    flushInit([]);
    comp.medicamentos = [{ id: 5, nombre: 'Paracetamol', codigoSismed: 'MED-001', presentacion: '', concentracion: '', viaAdministracion: '', stockMinimo: 10, activo: 1 }];
    expect(comp.nombreMed(5)).toContain('Paracetamol');
  });

  it('nombreMed retorna ID si medicamento no existe', () => {
    flushInit([]);
    expect(comp.nombreMed(99)).toContain('#99');
  });

  it('despachar con EN_PROCESO llama POST /despacho y recarga', () => {
    const sol = base(2, 'EN_PROCESO', [{ id: 10, medicamentoId: 1, cantidadSolicitada: 5 }]);
    flushInit([sol]);
    vi.spyOn(comp, 'cargar').mockImplementation(() => {});
    comp.despachar(comp.solicitudes[0]);
    http.expectOne(r => r.url.includes('/despacho') && r.method === 'POST').flush(mockNota);
    expect(comp.procesando[sol.id]).toBe(false);
    expect(comp.cargar).toHaveBeenCalled();
  });

  it('despachar con APROBADO_JEFE llama en-proceso primero luego POST /despacho', () => {
    const sol = base(1, 'APROBADO_JEFE', [{ id: 10, medicamentoId: 1, cantidadSolicitada: 5 }]);
    flushInit([sol]);
    vi.spyOn(comp, 'cargar').mockImplementation(() => {});
    comp.despachar(comp.solicitudes[0]);
    http.expectOne(r => r.url.includes('/solicitudes/1/en-proceso')).flush(null);
    http.expectOne(r => r.url.includes('/despacho') && r.method === 'POST').flush(mockNota);
    expect(comp.cargar).toHaveBeenCalled();
  });

  it('despachar error en marcarEnProceso muestra mensaje', () => {
    const sol = base(1, 'APROBADO_JEFE');
    flushInit([sol]);
    comp.despachar(comp.solicitudes[0]);
    http.expectOne(r => r.url.includes('/solicitudes/1/en-proceso'))
        .flush({ error: 'Error' }, { status: 500, statusText: 'Error' });
    expect(comp.procesando[sol.id]).toBe(false);
  });

  it('despachar error en POST /despacho muestra mensaje', () => {
    const sol = base(2, 'EN_PROCESO', []);
    flushInit([sol]);
    comp.despachar(comp.solicitudes[0]);
    http.expectOne(r => r.url.includes('/despacho') && r.method === 'POST')
        .flush({ error: 'Stock insuficiente' }, { status: 409, statusText: 'Error' });
    expect(comp.procesando[sol.id]).toBe(false);
  });

  it('cargar resetea expandidos', () => {
    flushInit([base(1, 'PENDIENTE')]);
    comp.expandidos.add(1);
    expect(comp.expandidos.size).toBe(1);
    comp.cargar();
    http.expectOne(r => r.url.includes('/activas')).flush([]);
    expect(comp.expandidos.size).toBe(0);
  });
});
