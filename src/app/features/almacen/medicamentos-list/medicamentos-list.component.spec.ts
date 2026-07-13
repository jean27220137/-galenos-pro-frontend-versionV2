import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { MessageService } from 'primeng/api';
import { MedicamentosListComponent } from './medicamentos-list.component';
import { Medicamento } from '../../../core/models/medicamento.model';

const mockMeds: Medicamento[] = [
  { id: 1, codigoSismed: 'M001', nombre: 'Amoxicilina', presentacion: 'Cápsula',
    concentracion: '500mg', viaAdministracion: 'Oral', stockMinimo: 10, activo: 1 },
];

describe('MedicamentosListComponent', () => {
  let fixture: ComponentFixture<MedicamentosListComponent>;
  let comp: MedicamentosListComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicamentosListComponent],
      providers: [
        provideZonelessChangeDetection(), provideHttpClient(),
        provideHttpClientTesting(), provideRouter([]), MessageService,
      ]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MedicamentosListComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const flushInit = (data: Medicamento[] = mockMeds) => {
    http.expectOne(r => r.url.includes('/medicamentos')).flush(data);
    fixture.detectChanges();
  };

  it('se crea y carga medicamentos', () => {
    flushInit();
    expect(comp).toBeTruthy();
    expect(comp.medicamentos.length).toBe(1);
  });

  it('filtrados retorna todo cuando no hay búsqueda', () => {
    flushInit();
    expect(comp.filtrados.length).toBe(1);
  });

  it('filtrados filtra por nombre', () => {
    flushInit();
    comp.busqueda = 'amoxi';
    expect(comp.filtrados.length).toBe(1);
    comp.busqueda = 'xyz';
    expect(comp.filtrados.length).toBe(0);
  });

  it('maneja error de carga', () => {
    http.expectOne(r => r.url.includes('/medicamentos'))
        .flush(null, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(comp.errorCarga).toBeTruthy();
    expect(comp.cargando).toBe(false);
  });

  it('abrirDialog y cerrarDialog manejan el estado del diálogo', () => {
    flushInit();
    comp.abrirDialog();
    fixture.detectChanges();
    expect(comp.dialogVisible).toBe(true);
    comp.cerrarDialog();
    fixture.detectChanges();
    expect(comp.dialogVisible).toBe(false);
  });

  it('guardar con form inválido marca touched', () => {
    flushInit([]);
    comp.form.reset();
    comp.guardar();
    expect(comp.form.touched).toBe(true);
  });

  it('guardar con form válido llama POST', () => {
    flushInit([]);
    comp.form.setValue({ codigoSismed: 'M999', nombre: 'Ibuprofeno',
                         presentacion: 'Tableta', concentracion: '400mg',
                         viaAdministracion: 'Oral', stockMinimo: 5 });
    comp.guardar();
    const req = http.expectOne(r => r.url.includes('/medicamentos') && r.method === 'POST');
    req.flush({ ...mockMeds[0], id: 2, nombre: 'Ibuprofeno' });
    expect(comp.medicamentos.length).toBe(1);
  });

  it('guardar muestra error si POST falla', () => {
    flushInit([]);
    comp.form.setValue({ codigoSismed: 'M999', nombre: 'Ibuprofeno',
                         presentacion: 'Tableta', concentracion: '400mg',
                         viaAdministracion: 'Oral', stockMinimo: 5 });
    comp.guardar();
    http.expectOne(r => r.url.includes('/medicamentos') && r.method === 'POST')
        .flush(null, { status: 500, statusText: 'Error' });
    expect(comp.error).toBeTruthy();
  });
});
