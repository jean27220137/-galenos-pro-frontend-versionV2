import { Component, OnInit, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { SolicitudService } from '../../../core/services/solicitud.service';
import { MedicamentoService } from '../../../core/services/medicamento.service';
import { AuthService } from '../../../core/services/auth.service';
import { Solicitud } from '../../../core/models/solicitud.model';
import { Medicamento } from '../../../core/models/medicamento.model';
import { catchError, forkJoin, of } from 'rxjs';

const ESTADOS_HISTORIAL = [
  { label: 'Todos',       value: 'TODOS' },
  { label: 'Por recibir', value: 'DESPACHADA' },
  { label: 'Entregadas',  value: 'ENTREGADA' },
  { label: 'Rechazadas',  value: 'RECHAZADA' },
  { label: 'Canceladas',  value: 'CANCELADA' },
  { label: 'Aprobadas',   value: 'APROBADO_JEFE' },
  { label: 'En proceso',  value: 'EN_PROCESO' },
];

const ESTADOS_VISIBLES =
  ['APROBADO_JEFE', 'EN_PROCESO', 'DESPACHADA', 'ENTREGADA', 'RECHAZADA', 'CANCELADA'];

@Component({
  selector: 'app-solicitudes-historial',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
            SelectModule, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <div class="p-6">
      <app-page-header title="Historial de Solicitudes"
                       subtitle="Registro completo de solicitudes procesadas" />

      <!-- Filtros -->
      <div style="margin-bottom:1rem;display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap">
        <span style="position:relative;flex:1;min-width:220px;max-width:340px">
          <i class="pi pi-search"
             style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#64748B"></i>
          <input pInputText type="text" [(ngModel)]="busqueda"
                 placeholder="Buscar por N° solicitud..."
                 style="padding-left:2rem;width:100%" />
        </span>
        <p-select [options]="estadosOpciones"
                  [(ngModel)]="estadoFiltro"
                  optionLabel="label" optionValue="value"
                  (onChange)="cdr.markForCheck()"
                  style="min-width:180px" />
        <span style="font-size:0.8rem;color:#64748B">
          {{ solicitudesFiltradas.length }} resultado(s)
        </span>
      </div>

      <p-table [value]="solicitudesFiltradas"
               [loading]="cargando"
               styleClass="p-datatable-sm hospital-table"
               [paginator]="true" [rows]="10"
               [rowsPerPageOptions]="[10,25,50]">

        <ng-template pTemplate="header">
          <tr>
            <th style="width:3rem"></th>
            <th pSortableColumn="nroSolicitud">N° Solicitud <p-sortIcon field="nroSolicitud"/></th>
            <th pSortableColumn="fechaSolicitud">Fecha <p-sortIcon field="fechaSolicitud"/></th>
            <th>Estado</th>
            <th style="text-align:center">Ítems</th>
            <th style="text-align:center">Nota de Salida</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-sol>
          <tr>
            <td>
              <button type="button" (click)="toggleRow(sol)"
                      style="border:none;background:transparent;cursor:pointer;
                             color:#1A4F8A;padding:4px 6px;border-radius:4px">
                <i [class]="expandidos.has(sol.id) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"></i>
              </button>
            </td>
            <td style="font-family:monospace;font-weight:600;color:#1A4F8A">{{ sol.nroSolicitud }}</td>
            <td>{{ sol.fechaSolicitud | date:'dd/MM/yyyy HH:mm' }}</td>
            <td><app-status-badge [estado]="sol.estado" /></td>
            <td style="text-align:center">{{ sol.detalles?.length ?? 0 }}</td>
            <td style="text-align:center">
              <span *ngIf="sol.notaSalidaId"
                    style="color:#15803D;font-family:monospace;font-size:0.85rem;
                           background:#DCFCE7;padding:2px 8px;border-radius:4px">
                NS-{{ sol.notaSalidaId }}
              </span>
              <span *ngIf="!sol.notaSalidaId" style="color:#94A3B8;font-size:0.8rem">—</span>
            </td>
          </tr>

          <!-- Fila expandida: detalles (solo lectura) -->
          <tr *ngIf="expandidos.has(sol.id)">
            <td colspan="6" style="padding:0;background:#F8FAFC;border-top:none">
              <div style="padding:1rem 2rem">

                <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem">
                  <i class="pi pi-list" style="color:#1A4F8A"></i>
                  <strong style="color:#1A4F8A;font-size:0.82rem;
                                 text-transform:uppercase;letter-spacing:0.05em">
                    Medicamentos de la solicitud
                  </strong>
                </div>

                <table style="width:100%;border-collapse:collapse;font-size:0.82rem">
                  <thead>
                    <tr style="background:#EFF6FF">
                      <th style="padding:6px 10px;text-align:left;color:#1A4F8A;font-weight:600">#</th>
                      <th style="padding:6px 10px;text-align:left;color:#1A4F8A;font-weight:600">Medicamento</th>
                      <th style="padding:6px 10px;text-align:right;color:#1A4F8A;font-weight:600">Cant. Solicitada</th>
                      <th style="padding:6px 10px;text-align:right;color:#1A4F8A;font-weight:600">Cant. Aprobada</th>
                      <th style="padding:6px 10px;text-align:center;color:#1A4F8A;font-weight:600">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let det of sol.detalles; let i = index"
                        [style.background]="i % 2 === 0 ? '#fff' : '#F8FAFC'">
                      <td style="padding:6px 10px;color:#94A3B8">{{ i + 1 }}</td>
                      <td style="padding:6px 10px;color:#1E293B;font-weight:500">
                        {{ nombreMed(det.medicamentoId) }}
                      </td>
                      <td style="padding:6px 10px;text-align:right;font-weight:600;color:#1A4F8A">
                        {{ det.cantidadSolicitada }}
                      </td>
                      <td style="padding:6px 10px;text-align:right;color:#059669;font-weight:600">
                        {{ det.cantidadAprobada ?? '—' }}
                      </td>
                      <td style="padding:6px 10px;text-align:center">
                        <span *ngIf="det.observacion"
                              [style.color]="det.observacion === 'APROBADO'  ? '#059669' :
                                             det.observacion === 'SIN_STOCK' ? '#EF4444' : '#F59E0B'"
                              [style.background]="det.observacion === 'APROBADO'  ? '#DCFCE7' :
                                                  det.observacion === 'SIN_STOCK' ? '#FEE2E2' : '#FEF3C7'"
                              style="font-size:0.75rem;font-weight:700;padding:2px 10px;border-radius:9999px">
                          {{ det.observacion }}
                        </span>
                        <span *ngIf="!det.observacion" style="color:#94A3B8">—</span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- Motivo de rechazo -->
                <div *ngIf="sol.estado === 'RECHAZADA' && sol.observacion"
                     style="margin-top:0.75rem;background:#FEF2F2;border:1px solid #FECACA;
                            border-radius:6px;padding:10px 14px">
                  <strong style="color:#DC2626;font-size:0.8rem">Motivo del rechazo:</strong>
                  <p style="color:#7F1D1D;font-size:0.82rem;margin:4px 0 0">{{ sol.observacion }}</p>
                </div>

                <div *ngIf="!sol.detalles?.length"
                     style="text-align:center;padding:1rem;color:#94A3B8;font-size:0.82rem">
                  Sin detalles disponibles.
                </div>
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="6" style="text-align:center;padding:2.5rem;color:#64748B">
              <i class="pi pi-history" style="font-size:1.5rem;display:block;margin-bottom:0.5rem"></i>
              No hay solicitudes en el historial.
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `
})
export class SolicitudesHistorialComponent implements OnInit {
  readonly cdr = inject(ChangeDetectorRef);

  private readonly solicitudSvc = inject(SolicitudService);
  private readonly medicSvc     = inject(MedicamentoService);
  private readonly authSvc      = inject(AuthService);
  private readonly msgSvc       = inject(MessageService);
  private readonly destroyRef   = inject(DestroyRef);

  solicitudes:  Solicitud[]   = [];
  medicamentos: Medicamento[] = [];
  expandidos:   Set<number>   = new Set();
  busqueda      = '';
  estadoFiltro  = 'TODOS';
  cargando      = false;

  readonly estadosOpciones = ESTADOS_HISTORIAL;

  get solicitudesFiltradas(): Solicitud[] {
    let lista = this.estadoFiltro === 'TODOS'
      ? this.solicitudes
      : this.solicitudes.filter(s => s.estado === this.estadoFiltro);
    if (this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase();
      lista = lista.filter(s => s.nroSolicitud?.toLowerCase().includes(q));
    }
    return lista;
  }

  ngOnInit(): void {
    const farmaciaId = this.authSvc.getSesion()?.farmaciaId ?? 1;
    this.cargando    = true;

    forkJoin({
      medicamentos: this.medicSvc.listar().pipe(catchError(() => of([]))),
      solicitudes:  this.solicitudSvc.listarPorFarmacia(farmaciaId)
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ medicamentos, solicitudes }) => {
          this.medicamentos = medicamentos;
          this.solicitudes  = solicitudes
            .filter(s => ESTADOS_VISIBLES.includes(s.estado))
            .sort((a, b) =>
              new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime()
            );
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargando = false;
          this.msgSvc.add({ severity: 'error', summary: 'Error',
            detail: 'No se pudo cargar el historial.', life: 6000 });
          this.cdr.markForCheck();
        }
      });
  }

  toggleRow(sol: Solicitud): void {
    if (this.expandidos.has(sol.id)) this.expandidos.delete(sol.id);
    else this.expandidos.add(sol.id);
    this.expandidos = new Set(this.expandidos);
    this.cdr.markForCheck();
  }

  nombreMed(id: number): string {
    const m = this.medicamentos.find(x => x.id === id);
    return m ? `${m.nombre} (${m.codigoSismed})` : `Medicamento #${id}`;
  }
}
