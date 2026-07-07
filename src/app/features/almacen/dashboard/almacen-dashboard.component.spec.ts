import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AlmacenDashboardComponent } from './almacen-dashboard.component';
import { AlmacenDashboardService } from '../../../core/services/almacen-dashboard.service';
import { StockCriticoItem, ProximoVencerItem, SolicitudPendienteItem } from '../../../core/models/dashboard.models';
import { Stock } from '../../../core/models/stock.model';

const mockCritico: StockCriticoItem = {
  medicamentoNombre: 'Paracetamol', codigoSismed: 'PA-001',
  presentacion: 'Tableta', cantidadActual: 0, stockMinimo: 20
};

const mockVencer: ProximoVencerItem = {
  medicamentoNombre: 'Amoxicilina', codigoSismed: 'AM-002',
  lote: 'LOTE-A1', fechaVencimiento: '2099-08-01',
  diasRestantes: 28, cantidad: 50, almacenNombre: 'Almacén Central'
};

const mockSolicitud: SolicitudPendienteItem = {
  id: 1, nroSolicitud: 'SOL-000001', farmaciaId: 1, almacenId: 1,
  farmaceuticoId: 5, fechaSolicitud: '2026-06-29T10:00:00',
  estado: 'EN_PROCESO', detalles: []
};

const mockVencido: Stock = {
  id: 1, medicamentoId: 3, codigoSismed: 'CO-003', nombreMedicamento: 'Ibuprofeno',
  almacenId: 1, lote: 'L-OLD', cantidad: 10, fechaVencimiento: '2020-01-01', precioUnitario: 5.5
};

describe('AlmacenDashboardComponent', () => {
  let component: AlmacenDashboardComponent;
  let dashboardServiceMock: Partial<AlmacenDashboardService>;
  let routerMock: Partial<Router>;

  beforeEach(async () => {
    dashboardServiceMock = {
      getStockCritico:        vi.fn().mockReturnValue(of([mockCritico])),
      getProximosVencer:      vi.fn().mockReturnValue(of([mockVencer])),
      getSolicitudesPendientes: vi.fn().mockReturnValue(of([mockSolicitud])),
      getVencidos:            vi.fn().mockReturnValue(of([mockVencido])),
      getTotalMedicamentos:   vi.fn().mockReturnValue(of(20)),
    };
    routerMock = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AlmacenDashboardComponent],
      providers: [
        { provide: AlmacenDashboardService, useValue: dashboardServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(AlmacenDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('ngOnInit carga las 4 listas', () => {
    expect(component.stockCritico).toHaveLength(1);
    expect(component.proximosVencer).toHaveLength(1);
    expect(component.solicitudesPendientes).toHaveLength(1);
  });

  it('loading queda en false tras recibir datos', () => {
    expect(component.loading.stock).toBeFalsy();
    expect(component.loading.vencer).toBeFalsy();
    expect(component.loading.solicitudes).toBeFalsy();
    expect(component.loading.vencidos).toBeFalsy();
  });

  it('diasBg retorna rojo para dias <= 30', () => {
    expect(component.diasBg(30)).toBe('#FEE2E2');
    expect(component.diasBg(1)).toBe('#FEE2E2');
  });

  it('diasBg retorna amarillo para dias entre 31 y 60', () => {
    expect(component.diasBg(60)).toBe('#FEF3C7');
    expect(component.diasBg(45)).toBe('#FEF3C7');
  });

  it('diasBg retorna verde para dias > 60', () => {
    expect(component.diasBg(61)).toBe('#DCFCE7');
    expect(component.diasBg(90)).toBe('#DCFCE7');
  });

  it('verSolicitud navega con queryParam correcto', () => {
    component.verSolicitud('SOL-000001');
    expect(routerMock.navigate).toHaveBeenCalledWith(
      ['/almacen/notas-salida'], { queryParams: { solicitud: 'SOL-000001' } }
    );
  });

  it('loading.stock es false aunque el servicio falle', () => {
    dashboardServiceMock.getStockCritico = vi.fn().mockReturnValue(
      throwError(() => new Error('error'))
    );
    component.ngOnInit();
    expect(component.loading.stock).toBeFalsy();
  });

  it('getter sinStock cuenta lotes sin cantidad', () => {
    component.stockCritico = [mockCritico, { ...mockCritico, cantidadActual: 5 }];
    expect(component.sinStock).toBe(1);
  });

  it('getter proximos30 cuenta ítems con <= 30 días', () => {
    component.proximosVencer = [mockVencer, { ...mockVencer, diasRestantes: 90 }];
    expect(component.proximos30).toBe(1);
  });
});
