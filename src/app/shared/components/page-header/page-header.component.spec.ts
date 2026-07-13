import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PageHeaderComponent } from './page-header.component';

describe('PageHeaderComponent', () => {
  let fixture: ComponentFixture<PageHeaderComponent>;
  let comp: PageHeaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeaderComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
    fixture = TestBed.createComponent(PageHeaderComponent);
    comp = fixture.componentInstance;
  });

  it('se crea correctamente', () => expect(comp).toBeTruthy());

  it('acepta title y subtitle como inputs', () => {
    comp.title    = 'Mi Título';
    comp.subtitle = 'Subtítulo';
    fixture.detectChanges();
    expect(comp.title).toBe('Mi Título');
    expect(comp.subtitle).toBe('Subtítulo');
  });

  it('valores por defecto son cadenas vacías', () => {
    expect(comp.title).toBe('');
    expect(comp.subtitle).toBe('');
  });
});
