import { Component, Input } from '@angular/core';

interface BadgeStyle { color: string; background: string; label: string; }

const ESTADO_MAP: Record<string, BadgeStyle> = {
  PENDIENTE:     { color: '#D97706', background: '#FEF3C7', label: 'Pendiente' },
  APROBADO_JEFE: { color: '#1D4ED8', background: '#DBEAFE', label: 'Aprobado Jefe' },
  EN_PROCESO:    { color: '#1A4F8A', background: '#E8F0FB', label: 'En Proceso' },
  DESPACHADO:    { color: '#0D7377', background: '#E0F4F4', label: 'Despachado' },
  DESPACHADA:    { color: '#0D7377', background: '#E0F4F4', label: 'Despachada' },
  ENTREGADO:     { color: '#15803D', background: '#DCFCE7', label: 'Entregado' },
  ENTREGADA:     { color: '#15803D', background: '#DCFCE7', label: 'Entregada' },
  RECHAZADO:     { color: '#B91C1C', background: '#FEE2E2', label: 'Rechazado' },
  RECHAZADA:     { color: '#B91C1C', background: '#FEE2E2', label: 'Rechazada' },
  CANCELADA:     { color: '#64748B', background: '#F1F5F9', label: 'Cancelada' },
  GENERADA:      { color: '#1D4ED8', background: '#DBEAFE', label: 'Generada' },
  ADMIN:         { color: '#1A4F8A', background: '#E8F0FB', label: 'Admin' },
  FARMACEUTICO:  { color: '#0D7377', background: '#E0F4F4', label: 'Farmacéutico' },
  JEFE_FARMACIA: { color: '#1D4ED8', background: '#DBEAFE', label: 'Jefe Farmacia' },
  ALMACENERO:    { color: '#15803D', background: '#DCFCE7', label: 'Almacenero' },
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span class="status-badge"
          [style.color]="style.color"
          [style.background]="style.background"
          role="status"
          [attr.aria-label]="'Estado: ' + style.label">
      {{ style.label }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input() set estado(value: string) { this._estado = value ?? ''; }
  private _estado = '';

  get style(): BadgeStyle {
    return ESTADO_MAP[this._estado] ?? { color: '#64748B', background: '#F1F5F9', label: this._estado };
  }
}
