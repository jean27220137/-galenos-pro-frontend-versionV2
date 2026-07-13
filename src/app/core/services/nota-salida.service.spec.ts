import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { NotaSalidaService } from './nota-salida.service';
import { NotaSalida } from '../models/nota-salida.model';

const mockNota: NotaSalida = {
  id: 1, nroNotaSalida: 'NS-000001', solicitudId: 1,
  almacenOrigenId: 1, almacenDestinoId: 2,
  nroMovimiento: 'MOV-001', fechaMovimiento: '2026-07-01',
  estado: 'GENERADA', detalles: []
};

describe('NotaSalidaService', () => {
  let service: NotaSalidaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(NotaSalidaService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('listarPorAlmacen llama GET con almacenId', () => {
    service.listarPorAlmacen(1).subscribe(data => expect(data.length).toBe(1));
    const req = http.expectOne(r => r.url.includes('/notas-salida') && r.url.includes('almacenId=1'));
    expect(req.request.method).toBe('GET');
    req.flush([mockNota]);
  });

  it('buscarPorId llama GET /notas-salida/:id', () => {
    service.buscarPorId(1).subscribe(data => expect(data.nroNotaSalida).toBe('NS-000001'));
    const req = http.expectOne(r => r.url.includes('/notas-salida/1') && r.method === 'GET');
    req.flush(mockNota);
  });

  it('confirmarEntrega llama PUT /notas-salida/:id/entregar', () => {
    let done = false;
    service.confirmarEntrega(1).subscribe(() => { done = true; });
    const req = http.expectOne(r => r.url.includes('/notas-salida/1/entregar'));
    expect(req.request.method).toBe('PUT');
    req.flush(null);
    expect(done).toBe(true);
  });

  it('despachar llama POST /despacho', () => {
    const dto = { solicitudId: 1, almacenId: 1, almacenDestinoId: 2,
                  farmaciaId: 2, detalles: [{ medicamentoId: 10, cantidadSolicitada: 5 }] };
    service.despachar(dto).subscribe(data => expect(data.id).toBe(1));
    const req = http.expectOne(r => r.url.includes('/despacho') && r.method === 'POST');
    req.flush(mockNota);
  });
});
