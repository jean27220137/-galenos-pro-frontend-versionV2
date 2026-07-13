import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UsuarioService, Usuario } from './usuario.service';

const mockUsuario: Usuario = {
  id: 1, nombres: 'Juan', apellidos: 'Pérez', email: 'juan@test.com',
  rol: 'FARMACEUTICO', cargo: 'QF', farmaciaId: 1, activo: 1
};

describe('UsuarioService', () => {
  let service: UsuarioService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(UsuarioService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('listar llama GET /usuarios', () => {
    service.listar().subscribe(data => expect(data.length).toBe(1));
    const req = http.expectOne(r => r.url.includes('/usuarios') && r.method === 'GET');
    req.flush([mockUsuario]);
  });

  it('crear llama POST /usuarios', () => {
    const dto = { nombres: 'Juan', apellidos: 'Pérez', email: 'juan@test.com',
                  rol: 'FARMACEUTICO', cargo: 'QF', farmaciaId: 1 };
    service.crear(dto).subscribe(data => expect(data.id).toBe(1));
    const req = http.expectOne(r => r.url.includes('/usuarios') && r.method === 'POST');
    req.flush(mockUsuario);
  });

  it('actualizar llama PUT /usuarios/:id', () => {
    const dto = { nombres: 'Juan', apellidos: 'Pérez', email: 'juan@test.com',
                  rol: 'FARMACEUTICO', cargo: 'QF', farmaciaId: 1 };
    service.actualizar(1, dto).subscribe(data => expect(data.nombres).toBe('Juan'));
    const req = http.expectOne(r => r.url.includes('/usuarios/1') && r.method === 'PUT');
    req.flush(mockUsuario);
  });

  it('desactivar llama DELETE /usuarios/:id', () => {
    let done = false;
    service.desactivar(1).subscribe(() => { done = true; });
    const req = http.expectOne(r => r.url.includes('/usuarios/1') && r.method === 'DELETE');
    req.flush(null);
    expect(done).toBe(true);
  });
});
