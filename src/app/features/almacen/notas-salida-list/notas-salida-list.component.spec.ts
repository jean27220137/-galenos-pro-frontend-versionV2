import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { MessageService } from 'primeng/api';
import { NotasSalidaListComponent } from './notas-salida-list.component';
import { NotaSalida } from '../../../core/models/nota-salida.model';

const mockNotas: NotaSalida[] = [
  { id: 1, nroNotaSalida: 'NS-000001', solicitudId: 1, almacenOrigenId: 1,
    almacenDestinoId: 2, nroMovimiento: 'MOV-001', fechaMovimiento: '2026-07-01',
    estado: 'GENERADA', detalles: [] },
  { id: 2, nroNotaSalida: 'NS-000002', solicitudId: 2, almacenOrigenId: 1,
    almacenDestinoId: 2, nroMovimiento: 'MOV-002', fechaMovimiento: '2026-07-02',
    estado: 'ENTREGADA', detalles: [] },
];

describe('NotasSalidaListComponent', () => {
  let fixture: ComponentFixture<NotasSalidaListComponent>;
  let comp: NotasSalidaListComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotasSalidaListComponent],
      providers: [
        provideZonelessChangeDetection(), provideHttpClient(),
        provideHttpClientTesting(), provideRouter([]), MessageService,
      ]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(NotasSalidaListComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('se crea y carga notas de salida', () => {
    http.expectOne(r => r.url.includes('/notas-salida')).flush(mockNotas);
    fixture.detectChanges();
    expect(comp.notas.length).toBe(2);
    expect(comp.cargando).toBe(false);
  });

  it('maneja error de carga', () => {
    http.expectOne(r => r.url.includes('/notas-salida'))
        .flush(null, { status: 503, statusText: 'Error' });
    expect(comp.cargando).toBe(false);
  });

  it('verDetalle navega a la ruta correcta', () => {
    http.expectOne(r => r.url.includes('/notas-salida')).flush(mockNotas);
    const routerSpy = vi.spyOn((comp as any).router, 'navigate');
    comp.verDetalle(5);
    expect(routerSpy).toHaveBeenCalledWith(['/almacen/notas-salida', 5]);
  });

  it('confirmarEntrega llama PUT y actualiza estado', () => {
    http.expectOne(r => r.url.includes('/notas-salida'))
        .flush(mockNotas.map(n => ({ ...n })));
    const nota = comp.notas[0];
    comp.confirmarEntrega(nota);
    http.expectOne(r => r.url.includes('/notas-salida/1/entregar')).flush(null);
    expect(nota.estado).toBe('ENTREGADA');
  });

  it('confirmarEntrega muestra error si PUT falla', () => {
    http.expectOne(r => r.url.includes('/notas-salida'))
        .flush(mockNotas.map(n => ({ ...n })));
    const nota = comp.notas[0];
    const estadoOriginal = nota.estado;
    comp.confirmarEntrega(nota);
    http.expectOne(r => r.url.includes('/notas-salida/1/entregar'))
        .flush({ error: 'Error de prueba' }, { status: 500, statusText: 'Error' });
    expect(nota.estado).toBe(estadoOriginal);
  });
});
