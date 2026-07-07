import { Component, OnInit, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { SolicitudService } from '../../../core/services/solicitud.service';
import { NotaSalidaService } from '../../../core/services/nota-salida.service';
import { Solicitud } from '../../../core/models/solicitud.model';

const ESTADOS = [
  { label: 'Pendientes',    value: 'PENDIENTE' },
  { label: 'En proceso',    value: 'EN_PROCESO' },
  { label: 'Despachadas',   value: 'DESPACHADO' },
  { label: 'Entregadas',    value: 'ENTREGADO' },
  { label: 'Canceladas',    value: 'CANCELADA' },
];

@Component({
  selector: 'app-solicitudes-pendientes',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, SelectModule,
            PageHeaderComponent, StatusBadgeComponent],
  template: `
    <div class="p-6">
      <app-page-header title="Solicitudes de Farmacia"
                       subtitle="Requerimientos de medicamentos recibidos" />

      <!-- Filtro de estado -->
      <div style="margin-bottom:1rem;display:flex;gap:0.75rem;align-items:center">
        <p-select [options]="estados"
                  [(ngModel)]="estadoSeleccionado"
                  optionLabel="label" optionValue="value"
                  placeholder="Filtrar por estado"
                  (onChange)="cargar()"
                  style="min-width:200px" />
        <span style="font-size:0.8rem;color:#64748B">
          {{ solicitudes.length }} resultado(s)
        </span>
      </div>

      <!-- Error -->
      <div *ngIf="error"
           style="margin-bottom:1rem;color:#B91C1C;background:#FEE2E2;
                  padding:10px 14px;border-radius:6px;display:flex;gap:8px;align-items:center">
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ error }}</span>
      </div>

      <!-- Éxito -->
      <div *ngIf="mensaje"
           style="margin-bottom:1rem;color:#166534;background:#DCFCE7;
                  padding:10px 14px;border-radius:6px;display:flex;gap:8px;align-items:center">
        <i class="pi pi-check-circle"></i>
        <span>{{ mensaje }}</span>
      </div>

      <p-table [value]="solicitudes" [loading]="cargando"
               styleClass="p-datatable-sm hospital-table"
               [paginator]="true" [rows]="10"
               [rowsPerPageOptions]="[10, 25, 50]">
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="nroSolicitud">N° Solicitud <p-sortIcon field="nroSolicitud"/></th>
            <th pSortableColumn="fechaSolicitud">Fecha <p-sortIcon field="fechaSolicitud"/></th>
            <th style="text-align:center">Farmacia</th>
            <th>Estado</th>
            <th style="text-align:center">Ítems</th>
            <th style="text-align:center">Nota Salida</th>
            <th style="text-align:center">Acción</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-sol>
          <tr>
            <td style="font-family:monospace;font-weight:600;color:#1A4F8A">
              {{ sol.nroSolicitud }}
            </td>
            <td>{{ sol.fechaSolicitud | date:'dd/MM/yyyy HH:mm' }}</td>
            <td style="text-align:center">
              <span style="background:#EFF6FF;color:#1A4F8A;padding:2px 8px;
                           border-radius:4px;font-size:0.8rem;font-family:monospace">
                Farmacia #{{ sol.farmaciaId }}
              </span>
            </td>
            <td><app-status-badge [estado]="sol.estado" /></td>
            <td style="text-align:center">{{ sol.detalles?.length ?? 0 }}</td>
            <td style="text-align:center">
              <span *ngIf="sol.notaSalidaId; else sinNota"
                    style="color:#15803D;font-family:monospace;font-size:0.85rem">
                NS-{{ sol.notaSalidaId }}
              </span>
              <ng-template #sinNota>
                <span style="color:#94A3B8;font-size:0.8rem">—</span>
              </ng-template>
            </td>
            <td style="text-align:center">
              <!-- Botón Tomar: solo cuando PENDIENTE -->
              <p-button *ngIf="sol.estado === 'PENDIENTE'"
                        label="Tomar"
                        icon="pi pi-arrow-right"
                        severity="warn"
                        size="small"
                        [loading]="procesando[sol.id]"
                        (onClick)="tomarSolicitud(sol)" />

              <!-- Botón Despachar: solo cuando EN_PROCESO -->
              <p-button *ngIf="sol.estado === 'EN_PROCESO'"
                        label="Despachar"
                        icon="pi pi-send"
                        severity="success"
                        size="small"
                        [loading]="procesando[sol.id]"
                        (onClick)="despacharSolicitud(sol)" />

              <!-- Sin acción para otros estados -->
              <span *ngIf="sol.estado !== 'PENDIENTE' && sol.estado !== 'EN_PROCESO'"
                    style="color:#94A3B8;font-size:0.8rem">—</span>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" style="text-align:center;padding:2.5rem;color:#64748B">
              <i class="pi pi-inbox" style="font-size:1.5rem;display:block;margin-bottom:0.5rem"></i>
              No hay solicitudes con estado "{{ estadoSeleccionado }}".
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `
})
export class SolicitudesPendientesComponent implements OnInit {
  private readonly solicitudService  = inject(SolicitudService);
  private readonly notaSalidaService = inject(NotaSalidaService);
  private readonly cdr               = inject(ChangeDetectorRef);
  private readonly destroyRef        = inject(DestroyRef);

  readonly estados = ESTADOS;
  estadoSeleccionado = 'PENDIENTE';
  solicitudes: Solicitud[] = [];
  procesando: Record<number, boolean> = {};
  cargando = false;
  error    = '';
  mensaje  = '';

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando = true;
    this.error    = '';
    this.mensaje  = '';
    this.solicitudService.listarPorEstado(this.estadoSeleccionado)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => { this.solicitudes = data; this.cargando = false; this.cdr.markForCheck(); },
        error: ()  => {
          this.cargando = false;
          this.error = 'No se pudieron cargar las solicitudes. Verifique que farmacia-service esté en línea.';
          this.cdr.markForCheck();
        }
      });
  }

  tomarSolicitud(sol: Solicitud): void {
    this.procesando[sol.id] = true;
    this.error   = '';
    this.mensaje = '';
    this.solicitudService.marcarEnProceso(sol.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.procesando[sol.id] = false;
          this.mensaje = `Solicitud ${sol.nroSolicitud} tomada — ahora está EN PROCESO.`;
          this.cargar();
        },
        error: () => {
          this.procesando[sol.id] = false;
          this.error = `No se pudo tomar la solicitud ${sol.nroSolicitud}.`;
          this.cdr.markForCheck();
        }
      });
  }

  despacharSolicitud(sol: Solicitud): void {
    this.procesando[sol.id] = true;
    this.error   = '';
    this.mensaje = '';

    const dto = {
      solicitudId:      sol.id,
      almacenId:        sol.almacenId,
      almacenDestinoId: sol.farmaciaId,
      farmaciaId:       sol.farmaciaId,
      detalles: sol.detalles.map(d => ({
        medicamentoId:      d.medicamentoId,
        cantidadSolicitada: d.cantidadSolicitada
      }))
    };

    this.notaSalidaService.despachar(dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: nota => {
          this.procesando[sol.id] = false;
          this.mensaje = `Solicitud ${sol.nroSolicitud} despachada — Nota de Salida generada.`;
          this.cargar();
        },
        error: () => {
          this.procesando[sol.id] = false;
          this.error = `Error al despachar la solicitud ${sol.nroSolicitud}.`;
          this.cdr.markForCheck();
        }
      });
  }
}
