import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { NotaSalidaDetailComponent } from './nota-salida-detail.component';
import { NotaSalida } from '../../../core/models/nota-salida.model';

const mockNota: NotaSalida = {
  id: 5, nroNotaSalida: 'NS-000005', solicitudId: 1,
  almacenOrigenId: 1, almacenDestinoId: 2,
  nroMovimiento: 'MOV-005', fechaMovimiento: '2026-07-01',
  estado: 'GENERADA',
  detalles: [{ id: 1, medicamentoId: 1, lote: 'LOT-001', fechaVencimiento: '2027-01-01', cantidad: 10, precioUnitario: 5.5, total: 55 }]
};

describe('NotaSalidaDetailComponent', () => {
  let fixture: ComponentFixture<NotaSalidaDetailComponent>;
  let comp: NotaSalidaDetailComponent;
  let http: HttpTestingController;

  const buildWithId = async (id: string) => {
    await TestBed.configureTestingModule({
      imports: [NotaSalidaDetailComponent],
      providers: [
        provideZonelessChangeDetection(), provideHttpClient(),
        provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => id } } } },
      ]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(NotaSalidaDetailComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  };

  afterEach(() => { http.verify(); TestBed.resetTestingModule(); });

  it('se crea y carga nota por id', async () => {
    await buildWithId('5');
    http.expectOne(r => r.url.includes('/notas-salida/5')).flush(mockNota);
    fixture.detectChanges();
    expect(comp.nota).toBeTruthy();
    expect(comp.cargando).toBe(false);
  });

  it('totalGeneral calcula la suma de los totales', async () => {
    await buildWithId('5');
    http.expectOne(r => r.url.includes('/notas-salida/5')).flush(mockNota);
    fixture.detectChanges();
    expect(comp.totalGeneral).toBe(55);
  });

  it('totalGeneral es 0 cuando nota es null', async () => {
    await buildWithId('5');
    http.expectOne(r => r.url.includes('/notas-salida/5')).flush(mockNota);
    fixture.detectChanges();
    comp['nota'] = null;
    expect(comp.totalGeneral).toBe(0);
  });

  it('sin id en ruta no hace petición HTTP', async () => {
    await buildWithId('');
    http.expectNone(r => r.url.includes('/notas-salida'));
    expect(comp.cargando).toBe(false);
  });

  it('maneja error HTTP correctamente', async () => {
    await buildWithId('5');
    http.expectOne(r => r.url.includes('/notas-salida/5'))
        .flush(null, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(comp.nota).toBeNull();
    expect(comp.cargando).toBe(false);
  });

  it('imprimir llama window.print', async () => {
    await buildWithId('5');
    http.expectOne(r => r.url.includes('/notas-salida/5')).flush(mockNota);
    fixture.detectChanges();
    const spy = vi.spyOn(window, 'print').mockImplementation(() => {});
    comp.imprimir();
    expect(spy).toHaveBeenCalled();
  });

  it('carga nota con detalles vacíos muestra sin detalles', async () => {
    await buildWithId('5');
    const notaVacia: NotaSalida = { ...mockNota, detalles: [] };
    http.expectOne(r => r.url.includes('/notas-salida/5')).flush(notaVacia);
    fixture.detectChanges();
    expect(comp.totalGeneral).toBe(0);
  });

  it('totalGeneral trata total undefined como 0', async () => {
    await buildWithId('5');
    const notaSinTotal: NotaSalida = { ...mockNota,
      detalles: [{ id: 1, medicamentoId: 1, lote: 'L', fechaVencimiento: '2027-01-01',
                   cantidad: 5, precioUnitario: 5, total: undefined as any }] };
    http.expectOne(r => r.url.includes('/notas-salida/5')).flush(notaSinTotal);
    fixture.detectChanges();
    expect(comp.totalGeneral).toBe(0);
  });
});
