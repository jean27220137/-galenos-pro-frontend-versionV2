import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [NotificationService, MessageService] });
    service = TestBed.inject(NotificationService);
  });

  it('se crea correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('notificaciones$ es observable', () => {
    expect(service.notificaciones$).toBeTruthy();
  });

  it('conectar no lanza error (WebSocket pendiente)', () => {
    expect(() => service.conectar()).not.toThrow();
  });

  it('desconectar cierra ws null sin error', () => {
    expect(() => service.desconectar()).not.toThrow();
  });

  it('desconectar cierra WebSocket real si existe', () => {
    const fakeWs = { close: vi.fn() } as unknown as WebSocket;
    (service as any).ws = fakeWs;
    service.desconectar();
    expect(fakeWs.close).toHaveBeenCalled();
    expect((service as any).ws).toBeNull();
  });

  it('parsearEvento retorna evento con tipo conocido', () => {
    const ev = (service as any).parsearEvento({ tipo: 'despacho.confirmado', mensaje: 'OK' });
    expect(ev.severidad).toBe('success');
    expect(ev.tipo).toBe('despacho.confirmado');
  });

  it('parsearEvento retorna info para tipo desconocido', () => {
    const ev = (service as any).parsearEvento({ tipo: 'otro', mensaje: 'msg' });
    expect(ev.severidad).toBe('info');
  });

  it('parsearEvento usa defaults cuando faltan campos', () => {
    const ev = (service as any).parsearEvento({});
    expect(ev.tipo).toBe('info');
    expect(ev.mensaje).toBe('Notificación recibida');
  });

  it('titulo retorna título para tipo conocido', () => {
    expect((service as any).titulo('solicitud.nueva')).toBe('Nueva solicitud');
    expect((service as any).titulo('stock.critico')).toBe('Stock crítico');
  });

  it('titulo retorna Notificación para tipo desconocido', () => {
    expect((service as any).titulo('otro')).toBe('Notificación');
  });
});
