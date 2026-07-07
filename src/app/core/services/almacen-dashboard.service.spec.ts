import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AlmacenDashboardService } from './almacen-dashboard.service';
import { StockCriticoItem, ProximoVencerItem, SolicitudPendienteItem } from '../models/dashboard.models';

describe('AlmacenDashboardService', () => {
  let service: AlmacenDashboardService;
  let http: HttpTestingController;

  const mockCritico: StockCriticoItem = {
    medicamentoNombre: 'Paracetamol 500mg', codigoSismed: 'PA-001',
    presentacion: 'Tableta', cantidadActual: 5, stockMinimo: 20
  };

  const mockVencer: ProximoVencerItem = {
    medicamentoNombre: 'Amoxicilina 500mg', codigoSismed: 'AM-002',
    lote: 'LOTE-A1', fechaVencimiento: '2025-08-01',
    diasRestantes: 30, cantidad: 100, almacenNombre: 'Almacén Central'
  };

  const mockSolicitud: SolicitudPendienteItem = {
    id: 1, nroSolicitud: 'SOL-000001', farmaciaId: 1, almacenId: 1,
    farmaceuticoId: 5, fechaSolicitud: '2026-06-29T10:00:00',
    estado: 'EN_PROCESO', detalles: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AlmacenDashboardService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getStockCritico llama GET /api/almacen/dashboard/stock-critico', () => {
    service.getStockCritico().subscribe(data => {
      expect(data[0].medicamentoNombre).toBe('Paracetamol 500mg');
      expect(data[0].cantidadActual).toBe(5);
    });

    const req = http.expectOne(r => r.url.includes('/almacen/dashboard/stock-critico'));
    expect(req.request.method).toBe('GET');
    req.flush([mockCritico]);
  });

  it('getProximosVencer llama GET con param dias=90 por defecto', () => {
    service.getProximosVencer().subscribe(data => {
      expect(data[0].lote).toBe('LOTE-A1');
    });

    const req = http.expectOne(r =>
      r.url.includes('/almacen/dashboard/proximos-vencer') &&
      r.params.get('dias') === '90'
    );
    expect(req.request.method).toBe('GET');
    req.flush([mockVencer]);
  });

  it('getProximosVencer llama GET con param dias personalizado', () => {
    service.getProximosVencer(30).subscribe();

    const req = http.expectOne(r =>
      r.url.includes('/almacen/dashboard/proximos-vencer') &&
      r.params.get('dias') === '30'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getSolicitudesPendientes llama GET con param estado=EN_PROCESO', () => {
    service.getSolicitudesPendientes().subscribe(data => {
      expect(data[0].nroSolicitud).toBe('SOL-000001');
    });

    const req = http.expectOne(r =>
      r.url.includes('/farmacia/solicitudes') &&
      r.params.get('estado') === 'EN_PROCESO'
    );
    expect(req.request.method).toBe('GET');
    req.flush([mockSolicitud]);
  });
});
