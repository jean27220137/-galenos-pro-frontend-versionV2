import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { MessageService } from 'primeng/api';
import { SolicitudesPendientesComponent } from './solicitudes-pendientes.component';
import { Solicitud } from '../../../core/models/solicitud.model';

const mockSolicitudes: Solicitud[] = [
  { id: 1, nroSolicitud: 'SOL-000001', farmaciaId: 1, almacenId: 1,
    farmaceuticoId: 5, fechaSolicitud: '2026-07-01', estado: 'PENDIENTE', detalles: [] },
  { id: 2, nroSolicitud: 'SOL-000002', farmaciaId: 2, almacenId: 1,
    farmaceuticoId: 6, fechaSolicitud: '2026-07-02', estado: 'PENDIENTE', detalles: [] },
];

describe('SolicitudesPendientesComponent', () => {
  let fixture: ComponentFixture<SolicitudesPendientesComponent>;
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
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('se crea correctamente', () => {
    expect(fixture.componentInstance).toBeTruthy();
    http.expectOne(r => r.url.includes('/medicamentos')).flush([]);
    http.expectOne(r => r.url.includes('/activas')).flush(mockSolicitudes);
  });

  it('carga solicitudes activas al iniciar y desactiva el loading', () => {
    const comp = fixture.componentInstance;

    http.expectOne(r => r.url.includes('/medicamentos')).flush([]);
    const req = http.expectOne(r => r.url.includes('/activas'));
    expect(req.request.method).toBe('GET');
    req.flush(mockSolicitudes);

    expect(comp.solicitudes.length).toBe(2);
    expect(comp.cargando).toBeFalsy();
  });

  it('muestra mensaje de error cuando el servicio falla', () => {
    const comp = fixture.componentInstance;

    http.expectOne(r => r.url.includes('/medicamentos')).flush([]);
    http.expectOne(r => r.url.includes('/activas'))
        .flush(null, { status: 503, statusText: 'Service Unavailable' });

    expect(comp.solicitudes.length).toBe(0);
    expect(comp.error).toBeTruthy();
    expect(comp.cargando).toBeFalsy();
  });
});
