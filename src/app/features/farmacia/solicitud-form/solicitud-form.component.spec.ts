import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { MessageService } from 'primeng/api';
import { SolicitudFormComponent } from './solicitud-form.component';
import { Medicamento } from '../../../core/models/medicamento.model';

const mockMeds: Medicamento[] = [
  { id: 1, codigoSismed: 'M001', nombre: 'Amoxicilina', presentacion: 'Cápsula',
    concentracion: '500mg', viaAdministracion: 'Oral', stockMinimo: 10, activo: 1 },
  { id: 2, codigoSismed: 'M002', nombre: 'Ibuprofeno', presentacion: 'Tableta',
    concentracion: '400mg', viaAdministracion: 'Oral', stockMinimo: 5, activo: 0 },
];

describe('SolicitudFormComponent', () => {
  let fixture: ComponentFixture<SolicitudFormComponent>;
  let comp: SolicitudFormComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.setItem('galenos_sesion', JSON.stringify({ userId: 1, rol: 'FARMACEUTICO', farmaciaId: 2, token: 'tok', expira: '2099-01-01' }));
    await TestBed.configureTestingModule({
      imports: [SolicitudFormComponent],
      providers: [
        provideZonelessChangeDetection(), provideHttpClient(),
        provideHttpClientTesting(), provideRouter([]), MessageService,
      ]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SolicitudFormComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  const flushInit = (data: Medicamento[] = mockMeds) => {
    http.expectOne(r => r.url.includes('/medicamentos')).flush(data);
    fixture.detectChanges();
  };

  it('se crea y carga catálogo filtrando activos', () => {
    flushInit();
    expect(comp.medicamentos.length).toBe(1);
    expect(comp.medicamentos[0].activo).toBe(1);
  });

  it('detallesValidos cuenta detalles con medicamento y cantidad válidos', () => {
    flushInit();
    comp.detalles = [{ medicamentoId: 1, cantidadSolicitada: 5 }];
    expect(comp.detallesValidos).toBe(1);
  });

  it('puedeEnviar es false si hay duplicados', () => {
    flushInit();
    comp.detalles = [
      { medicamentoId: 1, cantidadSolicitada: 5, duplicado: true },
      { medicamentoId: 1, cantidadSolicitada: 3, duplicado: true },
    ];
    expect(comp.puedeEnviar).toBe(false);
  });

  it('puedeEnviar es false si medicamentoId es null', () => {
    flushInit();
    comp.detalles = [{ medicamentoId: null, cantidadSolicitada: 1 }];
    expect(comp.puedeEnviar).toBe(false);
  });

  it('agregarDetalle añade nueva fila', () => {
    flushInit();
    comp.agregarDetalle();
    expect(comp.detalles.length).toBe(2);
  });

  it('quitarDetalle elimina la fila indicada', () => {
    flushInit();
    comp.detalles = [{ medicamentoId: 1, cantidadSolicitada: 5 }, { medicamentoId: 2, cantidadSolicitada: 3 }];
    comp.quitarDetalle(0);
    expect(comp.detalles.length).toBe(1);
    expect(comp.detalles[0].medicamentoId).toBe(2);
  });

  it('quitarDetalle con medicamentoId null no lanza error', () => {
    flushInit();
    comp.detalles = [{ medicamentoId: null, cantidadSolicitada: 1 }, { medicamentoId: 2, cantidadSolicitada: 3 }];
    comp.quitarDetalle(0);
    expect(comp.detalles.length).toBe(1);
    expect(comp.detalles[0].medicamentoId).toBe(2);
  });

  it('quitarDetalle limpia duplicado del hermano', () => {
    flushInit();
    comp.detalles = [
      { medicamentoId: 1, cantidadSolicitada: 5, duplicado: true },
      { medicamentoId: 1, cantidadSolicitada: 3, duplicado: true },
    ];
    comp.quitarDetalle(0);
    expect(comp.detalles[0].duplicado).toBe(false);
  });

  it('verificarDuplicado marca duplicados', () => {
    flushInit();
    comp.detalles = [{ medicamentoId: 1, cantidadSolicitada: 5 }, { medicamentoId: 1, cantidadSolicitada: 3 }];
    comp.verificarDuplicado(0);
    expect(comp.detalles[0].duplicado).toBe(true);
  });

  it('nombreMedicamento retorna nombre si id coincide', () => {
    flushInit();
    expect(comp.nombreMedicamento(1)).toContain('Amoxicilina');
    expect(comp.nombreMedicamento(99)).toContain('99');
  });

  it('detallesParaPreview filtra inválidos y duplicados', () => {
    flushInit();
    comp.detalles = [
      { medicamentoId: 1, cantidadSolicitada: 5 },
      { medicamentoId: null, cantidadSolicitada: 3 },
      { medicamentoId: 2, cantidadSolicitada: 2, duplicado: true },
    ];
    expect(comp.detallesParaPreview().length).toBe(1);
  });

  it('onSubmit sin sesión no envía', () => {
    flushInit();
    localStorage.clear();
    comp.detalles = [{ medicamentoId: 1, cantidadSolicitada: 5 }];
    comp.onSubmit();
    http.expectNone(r => r.url.includes('/solicitudes') && r.method === 'POST');
  });

  it('onSubmit envía solicitud y navega', () => {
    flushInit();
    comp.detalles = [{ medicamentoId: 1, cantidadSolicitada: 5 }];
    const routerSpy = vi.spyOn(comp.router, 'navigate');
    comp.onSubmit();
    http.expectOne(r => r.url.includes('/solicitudes') && r.method === 'POST')
        .flush({ id: 1, nroSolicitud: 'SOL-001', estado: 'PENDIENTE' });
    expect(routerSpy).toHaveBeenCalledWith(['/farmacia/solicitudes']);
  });

  it('onSubmit muestra error si POST falla', () => {
    flushInit();
    comp.detalles = [{ medicamentoId: 1, cantidadSolicitada: 5 }];
    comp.onSubmit();
    http.expectOne(r => r.url.includes('/solicitudes') && r.method === 'POST')
        .flush({ error: 'Error de stock' }, { status: 400, statusText: 'Bad Request' });
    expect(comp.error).toBeTruthy();
  });

  it('maneja error al cargar catálogo', () => {
    http.expectOne(r => r.url.includes('/medicamentos'))
        .flush(null, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(comp.errorCatalogo).toBeTruthy();
    expect(comp.cargandoCatalogo).toBe(false);
  });

  it('onSubmit con puedeEnviar false muestra error y no envía', () => {
    flushInit();
    comp.detalles = [
      { medicamentoId: 1, cantidadSolicitada: 5, duplicado: true },
      { medicamentoId: 1, cantidadSolicitada: 3, duplicado: true },
    ];
    expect(comp.puedeEnviar).toBe(false);
    comp.onSubmit();
    http.expectNone(r => r.url.includes('/solicitudes') && r.method === 'POST');
    expect(comp.error).toBeTruthy();
  });
});
