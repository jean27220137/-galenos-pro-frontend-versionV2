import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { MedicamentosCatalogoComponent } from './medicamentos-catalogo.component';
import { Medicamento } from '../../../core/models/medicamento.model';

const mockMeds: Medicamento[] = [
  { id: 1, codigoSismed: 'M001', nombre: 'Amoxicilina', presentacion: 'Cápsula',
    concentracion: '500mg', viaAdministracion: 'Oral', stockMinimo: 10, activo: 1 },
  { id: 2, codigoSismed: 'M002', nombre: 'Ibuprofeno', presentacion: 'Tableta',
    concentracion: '400mg', viaAdministracion: 'Oral', stockMinimo: 5, activo: 0 },
];

describe('MedicamentosCatalogoComponent', () => {
  let fixture: ComponentFixture<MedicamentosCatalogoComponent>;
  let comp: MedicamentosCatalogoComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicamentosCatalogoComponent],
      providers: [
        provideZonelessChangeDetection(), provideHttpClient(),
        provideHttpClientTesting(), provideRouter([]),
      ]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MedicamentosCatalogoComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const flushInit = (data: Medicamento[] = mockMeds) => {
    http.expectOne(r => r.url.includes('/medicamentos')).flush(data);
    fixture.detectChanges();
  };

  it('se crea y carga catálogo', () => {
    flushInit();
    expect(comp.medicamentos.length).toBe(2);
    expect(comp.cargando).toBe(false);
  });

  it('filtrados devuelve todos sin búsqueda', () => {
    flushInit();
    expect(comp.filtrados.length).toBe(2);
  });

  it('filtrados filtra por nombre', () => {
    flushInit();
    comp.busqueda = 'ibup';
    expect(comp.filtrados.length).toBe(1);
    expect(comp.filtrados[0].nombre).toBe('Ibuprofeno');
  });

  it('filtrados filtra por código SISMED', () => {
    flushInit();
    comp.busqueda = 'M001';
    expect(comp.filtrados.length).toBe(1);
  });

  it('maneja error de carga', () => {
    http.expectOne(r => r.url.includes('/medicamentos'))
        .flush(null, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(comp.errorCarga).toBeTruthy();
    expect(comp.cargando).toBe(false);
  });
});
