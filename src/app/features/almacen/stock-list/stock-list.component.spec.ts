import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { MessageService } from 'primeng/api';
import { StockListComponent } from './stock-list.component';
import { Stock } from '../../../core/models/stock.model';
import { Medicamento } from '../../../core/models/medicamento.model';

const mockStock: Stock[] = [
  { id: 1, medicamentoId: 1, almacenId: 1, lote: 'LOT-001',
    cantidad: 50, fechaVencimiento: '2027-01-01', precioUnitario: 5.5,
    nombreMedicamento: 'Amoxicilina', codigoSismed: 'M001' },
];
const mockCritico: Stock[] = [
  { id: 2, medicamentoId: 2, almacenId: 1, lote: 'LOT-002',
    cantidad: 5, fechaVencimiento: '2027-01-01', precioUnitario: 2,
    nombreMedicamento: 'Ibuprofeno', codigoSismed: 'M002' },
];
const mockMeds: Medicamento[] = [
  { id: 1, codigoSismed: 'M001', nombre: 'Amoxicilina', presentacion: 'Cápsula',
    concentracion: '500mg', viaAdministracion: 'Oral', stockMinimo: 10, activo: 1 },
];

describe('StockListComponent', () => {
  let fixture: ComponentFixture<StockListComponent>;
  let comp: StockListComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockListComponent],
      providers: [
        provideZonelessChangeDetection(), provideHttpClient(),
        provideHttpClientTesting(), provideRouter([]), MessageService,
      ]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(StockListComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const flushInit = () => {
    http.expectOne(r => r.url.includes('/stock')).flush(mockStock);
    http.expectOne(r => r.url.includes('/medicamentos')).flush(mockMeds);
    fixture.detectChanges();
  };

  it('se crea y carga stock y medicamentos', () => {
    flushInit();
    expect(comp.stock.length).toBe(1);
    expect(comp.medicamentos.length).toBe(1);
  });

  it('stockFiltrado retorna todo sin búsqueda', () => {
    flushInit();
    expect(comp.stockFiltrado.length).toBe(1);
  });

  it('stockFiltrado filtra por nombre de medicamento', () => {
    flushInit();
    comp.busqueda = 'amoxi';
    expect(comp.stockFiltrado.length).toBe(1);
    comp.busqueda = 'xyz';
    expect(comp.stockFiltrado.length).toBe(0);
  });

  it('stockFiltrado filtra por lote', () => {
    flushInit();
    comp.busqueda = 'LOT-001';
    expect(comp.stockFiltrado.length).toBe(1);
  });

  it('maneja error de carga de stock', () => {
    http.expectOne(r => r.url.includes('/stock')).flush(null, { status: 503, statusText: 'Unavailable' });
    http.expectOne(r => r.url.includes('/medicamentos')).flush([]);
    expect(comp.errorCarga).toBeTruthy();
    expect(comp.cargando).toBe(false);
  });

  it('abrirDialog y cerrarDialog controlan la visibilidad', () => {
    flushInit();
    comp.abrirDialog();
    expect(comp.dialogVisible).toBe(true);
    comp.cerrarDialog();
    expect(comp.dialogVisible).toBe(false);
  });

  it('guardar con form inválido no hace request', () => {
    flushInit();
    comp.form.reset();
    comp.guardar();
    http.expectNone(r => r.url.includes('/stock') && r.method === 'POST');
  });

  it('guardar válido llama POST y agrega lote al stock', () => {
    flushInit();
    comp.form.setValue({ medicamentoId: 1, lote: 'LOT-NEW', cantidad: 20,
                         fechaVencimiento: '2027-06-01', precioUnitario: 4.5 });
    comp.guardar();
    const nuevoLote = { ...mockStock[0], id: 99, lote: 'LOT-NEW' };
    http.expectOne(r => r.url.includes('/stock') && r.method === 'POST').flush(nuevoLote);
    expect(comp.stock.length).toBe(2);
    expect(comp.dialogVisible).toBe(false);
  });

  it('guardar muestra error si POST falla', () => {
    flushInit();
    comp.form.setValue({ medicamentoId: 1, lote: 'LOT-NEW', cantidad: 20,
                         fechaVencimiento: '2027-06-01', precioUnitario: 4.5 });
    comp.guardar();
    http.expectOne(r => r.url.includes('/stock') && r.method === 'POST')
        .flush(null, { status: 500, statusText: 'Error' });
    expect(comp.errorDialog).toBeTruthy();
  });

  it('maneja error al cargar medicamentos silenciosamente', () => {
    http.expectOne(r => r.url.includes('/stock')).flush(mockStock);
    http.expectOne(r => r.url.includes('/medicamentos'))
        .flush(null, { status: 500, statusText: 'Error' });
    expect(comp.medicamentos.length).toBe(0);
  });
});
