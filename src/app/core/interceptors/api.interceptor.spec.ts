import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { apiInterceptor } from './api.interceptor';

describe('apiInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => { httpMock.verify(); localStorage.clear(); });

  it('pasa la petición sin headers si no hay sesión', () => {
    http.get('/test').subscribe();
    const req = httpMock.expectOne('/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('agrega Authorization, X-User-Id y X-User-Rol cuando hay sesión', () => {
    localStorage.setItem('galenos_sesion', JSON.stringify({ token: 'abc', userId: 5, rol: 'ALMACENERO' }));
    http.get('/test').subscribe();
    const req = httpMock.expectOne('/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    expect(req.request.headers.get('X-User-Id')).toBe('5');
    expect(req.request.headers.get('X-User-Rol')).toBe('ALMACENERO');
    req.flush({});
  });

  it('pasa la petición sin modificar si el JSON del localStorage es inválido', () => {
    localStorage.setItem('galenos_sesion', 'no-es-json');
    http.get('/test').subscribe();
    const req = httpMock.expectOne('/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('no agrega Authorization si el token está ausente en la sesión', () => {
    localStorage.setItem('galenos_sesion', JSON.stringify({ userId: 5, rol: 'ADMIN' }));
    http.get('/test').subscribe();
    const req = httpMock.expectOne('/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(req.request.headers.get('X-User-Id')).toBe('5');
    req.flush({});
  });

  it('no agrega X-User-Id ni X-User-Rol si ambos están ausentes', () => {
    localStorage.setItem('galenos_sesion', JSON.stringify({ token: 'abc' }));
    http.get('/test').subscribe();
    const req = httpMock.expectOne('/test');
    expect(req.request.headers.has('X-User-Id')).toBe(false);
    expect(req.request.headers.has('X-User-Rol')).toBe(false);
    req.flush({});
  });
});
