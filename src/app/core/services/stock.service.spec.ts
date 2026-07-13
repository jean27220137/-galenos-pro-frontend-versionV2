import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { StockService } from './stock.service';
import { Stock, EntradaStockRequest } from '../models/stock.model';

describe('StockService', () => {
  let service: StockService;
  let http: HttpTestingController;

  const mockStock: Stock = {
    id: 1, medicamentoId: 10, codigoSismed: 'SISMED-001',
    nombreMedicamento: 'Paracetamol 500mg', almacenId: 1,
    lote: 'LOTE-001', cantidad: 200, fechaVencimiento: '2027-12-31', precioUnitario: 3.5
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(StockService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarPorAlmacen llama GET con almacenId', () => {
    service.listarPorAlmacen(1).subscribe(data => {
      expect(data[0].nombreMedicamento).toBe('Paracetamol 500mg');
    });

    const req = http.expectOne(r => r.url.includes('/stock') && r.url.includes('almacenId=1'));
    expect(req.request.method).toBe('GET');
    req.flush([mockStock]);
  });

  it('consultarDisponible llama GET con medicamentoId y almacenId', () => {
    service.consultarDisponible(10, 1).subscribe(qty => { expect(qty).toBe(150); });
    const req = http.expectOne(r => r.url.includes('/stock/10/disponible') && r.url.includes('almacenId=1'));
    expect(req.request.method).toBe('GET');
    req.flush(150);
  });

  it('registrarEntrada llama POST y retorna stock', () => {
    const entrada: EntradaStockRequest = {
      medicamentoId: 10, almacenId: 1, lote: 'LOTE-002',
      cantidad: 100, fechaVencimiento: '2027-06-30', precioUnitario: 5.0
    };
    service.registrarEntrada(entrada).subscribe(data => {
      expect(data.id).toBe(1);
    });

    const req = http.expectOne(r => r.url.includes('/stock/entrada'));
    expect(req.request.method).toBe('POST');
    req.flush(mockStock);
  });
});
