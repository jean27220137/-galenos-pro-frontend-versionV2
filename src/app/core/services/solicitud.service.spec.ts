import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SolicitudService } from './solicitud.service';
import { Solicitud, SolicitudRequest } from '../models/solicitud.model';

describe('SolicitudService', () => {
  let service: SolicitudService;
  let http: HttpTestingController;

  const mockSolicitud: Solicitud = {
    id: 1, nroSolicitud: 'SOL-000001', farmaciaId: 1, almacenId: 1,
    farmaceuticoId: 10, fechaSolicitud: '2026-06-24', estado: 'PENDIENTE', detalles: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(SolicitudService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarPorFarmacia llama GET con farmaciaId', () => {
    service.listarPorFarmacia(1).subscribe(data => {
      expect(data.length).toBe(1);
      expect(data[0].nroSolicitud).toBe('SOL-000001');
    });

    const req = http.expectOne(r => r.url.includes('/solicitudes') && r.url.includes('farmaciaId=1'));
    expect(req.request.method).toBe('GET');
    req.flush([mockSolicitud]);
  });

  it('crear llama POST y retorna solicitud', () => {
    const request: SolicitudRequest = {
      farmaciaId: 1, almacenId: 1,
      detalles: [{ medicamentoId: 10, cantidadSolicitada: 50 }]
    };
    service.crear(request).subscribe(data => {
      expect(data.estado).toBe('PENDIENTE');
    });

    const req = http.expectOne(r => r.url.includes('/solicitudes') && r.method === 'POST');
    req.flush(mockSolicitud);
  });

  it('cancelar llama PUT al endpoint correcto', () => {
    service.cancelar(1).subscribe();

    const req = http.expectOne(r => r.url.includes('/solicitudes/1/cancelar'));
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });

  it('listarPorEstado llama GET con parámetro estado', () => {
    service.listarPorEstado('PENDIENTE').subscribe(data => {
      expect(data.length).toBe(1);
      expect(data[0].estado).toBe('PENDIENTE');
    });

    const req = http.expectOne(r =>
      r.url.includes('/solicitudes') && r.url.includes('estado=PENDIENTE')
    );
    expect(req.request.method).toBe('GET');
    req.flush([mockSolicitud]);
  });
});
