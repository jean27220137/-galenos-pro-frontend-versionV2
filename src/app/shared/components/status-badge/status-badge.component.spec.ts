import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let fixture: ComponentFixture<StatusBadgeComponent>;
  let comp: StatusBadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
    fixture = TestBed.createComponent(StatusBadgeComponent);
    comp = fixture.componentInstance;
  });

  it('se crea correctamente', () => expect(comp).toBeTruthy());

  it('retorna estilo correcto para PENDIENTE', () => {
    comp.estado = 'PENDIENTE';
    expect(comp.style.label).toBe('Pendiente');
    expect(comp.style.color).toBe('#D97706');
  });

  it('retorna estilo correcto para APROBADO_JEFE', () => {
    comp.estado = 'APROBADO_JEFE';
    expect(comp.style.label).toBe('Aprobado Jefe');
  });

  it('retorna estilo correcto para ALMACENERO', () => {
    comp.estado = 'ALMACENERO';
    expect(comp.style.label).toBe('Almacenero');
  });

  it('retorna fallback para estado desconocido', () => {
    comp.estado = 'DESCONOCIDO';
    expect(comp.style.label).toBe('DESCONOCIDO');
    expect(comp.style.color).toBe('#64748B');
  });

  it('maneja estado null/undefined con fallback', () => {
    comp.estado = null as any;
    expect(comp.style).toBeTruthy();
  });
});
