import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ShellComponent } from './shell.component';
import { NotificationService } from '../../core/services/notification.service';

describe('ShellComponent', () => {
  let fixture: ComponentFixture<ShellComponent>;
  let notifSvc: NotificationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
        NotificationService,
      ]
    }).compileComponents();
    notifSvc = TestBed.inject(NotificationService);
    fixture = TestBed.createComponent(ShellComponent);
  });

  it('se crea correctamente', () => expect(fixture.componentInstance).toBeTruthy());

  it('llama conectar al inicializar', () => {
    const spy = vi.spyOn(notifSvc, 'conectar');
    fixture.detectChanges();
    expect(spy).toHaveBeenCalled();
  });

  it('llama desconectar al destruir', () => {
    const spy = vi.spyOn(notifSvc, 'desconectar');
    fixture.detectChanges();
    fixture.destroy();
    expect(spy).toHaveBeenCalled();
  });
});
