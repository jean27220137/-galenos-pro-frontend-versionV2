import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FarmaciaService } from './farmacia.service';
import { Farmacia } from '../models/farmacia.model';

const mockFarmacia: Farmacia = {
  id: 1, codigo: 'FAR-001', nombre: 'Farmacia Central',
  tipo: 'CONSULTA_EXTERNA', area: 'Planta Baja', activo: 1,
  ubicacion: '', departamento: '', jefeId: null, jefeNombre: '', telefono: ''
};

describe('FarmaciaService', () => {
  let service: FarmaciaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(FarmaciaService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('listar llama GET /farmacias', () => {
    service.listar().subscribe(data => expect(data.length).toBe(1));
    http.expectOne(r => r.url.includes('/farmacias') && !r.url.includes('/todas') && r.method === 'GET').flush([mockFarmacia]);
  });

  it('listarTodas llama GET /farmacias/todas', () => {
    service.listarTodas().subscribe(data => expect(data.length).toBe(1));
    http.expectOne(r => r.url.includes('/farmacias/todas') && r.method === 'GET').flush([mockFarmacia]);
  });

  it('buscarPorId llama GET /farmacias/:id', () => {
    service.buscarPorId(1).subscribe(data => expect(data.codigo).toBe('FAR-001'));
    http.expectOne(r => r.url.includes('/farmacias/1') && r.method === 'GET').flush(mockFarmacia);
  });

  it('crear llama POST /farmacias', () => {
    const dto = { codigo: 'FAR-001', nombre: 'Farmacia Central', tipo: 'CONSULTA_EXTERNA',
                  area: 'Planta Baja', departamento: '', ubicacion: '', jefeId: null, jefeNombre: '', telefono: '' };
    service.crear(dto).subscribe(data => expect(data.id).toBe(1));
    http.expectOne(r => r.url.includes('/farmacias') && r.method === 'POST').flush(mockFarmacia);
  });

  it('actualizar llama PUT /farmacias/:id', () => {
    const dto = { codigo: 'FAR-001', nombre: 'Farmacia Central', tipo: 'CONSULTA_EXTERNA',
                  area: 'Planta Baja', departamento: '', ubicacion: '', jefeId: null, jefeNombre: '', telefono: '' };
    service.actualizar(1, dto).subscribe(data => expect(data.nombre).toBe('Farmacia Central'));
    http.expectOne(r => r.url.includes('/farmacias/1') && r.method === 'PUT').flush(mockFarmacia);
  });

  it('desactivar llama PUT /farmacias/:id/desactivar', () => {
    let done = false;
    service.desactivar(1).subscribe(() => { done = true; });
    http.expectOne(r => r.url.includes('/farmacias/1/desactivar')).flush(null);
    expect(done).toBe(true);
  });

  it('activar llama PUT /farmacias/:id/activar', () => {
    let done = false;
    service.activar(1).subscribe(() => { done = true; });
    http.expectOne(r => r.url.includes('/farmacias/1/activar')).flush(null);
    expect(done).toBe(true);
  });
});
