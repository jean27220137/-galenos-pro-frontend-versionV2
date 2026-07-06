import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { MessageService } from 'primeng/api';

export interface NotificacionEvento {
  tipo: string;
  mensaje: string;
  severidad: 'success' | 'info' | 'warn' | 'error';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly messageService = inject(MessageService);
  private readonly eventos$ = new Subject<NotificacionEvento>();
  private ws: WebSocket | null = null;

  readonly notificaciones$ = this.eventos$.asObservable();

  conectar(): void {
    // WebSocket pendiente de habilitar cuando gateway-service exponga /ws/notificaciones
  }

  desconectar(): void {
    this.ws?.close();
    this.ws = null;
  }

  private parsearEvento(data: any): NotificacionEvento {
    const tipo = data.tipo ?? 'info';
    const mensaje = data.mensaje ?? 'Notificación recibida';
    const severidadMap: Record<string, 'success' | 'info' | 'warn' | 'error'> = {
      'despacho.confirmado': 'success',
      'solicitud.nueva':     'info',
      'stock.critico':       'warn',
    };
    return { tipo, mensaje, severidad: severidadMap[tipo] ?? 'info' };
  }

  private titulo(tipo: string): string {
    const titulos: Record<string, string> = {
      'despacho.confirmado': 'Despacho confirmado',
      'solicitud.nueva':     'Nueva solicitud',
      'stock.critico':       'Stock crítico',
    };
    return titulos[tipo] ?? 'Notificación';
  }
}
