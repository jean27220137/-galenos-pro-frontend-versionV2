import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MedicamentoService } from './medicamento.service';
import { Medicamento } from '../models/medicamento.model';

const mockMed: Medicamento = {
  id: 1, codigoSismed: 'M001', nombre: 'Amoxicilina',
  presentacion: 'Cápsula', concentracion: '500mg',
  viaAdministracion: 'Oral', stockMinimo: 10, activo: 1
};

describe('MedicamentoService', () => {
  let service: MedicamentoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(MedicamentoService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('listar llama GET /medicamentos', () => {
    service.listar().subscribe(data => expect(data.length).toBe(1));
    const req = http.expectOne(r => r.url.includes('/medicamentos') && r.method === 'GET');
    req.flush([mockMed]);
  });

  it('buscarPorId llama GET /medicamentos/:id', () => {
    service.buscarPorId(1).subscribe(data => expect(data.nombre).toBe('Amoxicilina'));
    const req = http.expectOne(r => r.url.includes('/medicamentos/1'));
    expect(req.request.method).toBe('GET');
    req.flush(mockMed);
  });

  it('crear llama POST /medicamentos', () => {
    const dto = { codigoSismed: 'M001', nombre: 'Amoxicilina', presentacion: 'Cápsula',
                  concentracion: '500mg', viaAdministracion: 'Oral', stockMinimo: 10 };
    service.crear(dto).subscribe(data => expect(data.id).toBe(1));
    const req = http.expectOne(r => r.url.includes('/medicamentos') && r.method === 'POST');
    req.flush(mockMed);
  });
});
