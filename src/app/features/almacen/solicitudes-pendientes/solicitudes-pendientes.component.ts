import { Component, OnInit, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { BadgeModule } from 'primeng/badge';
import { MessageService } from 'primeng/api';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { SolicitudService } from '../../../core/services/solicitud.service';
import { NotaSalidaService } from '../../../core/services/nota-salida.service';
import { MedicamentoService } from '../../../core/services/medicamento.service';
import { Solicitud } from '../../../core/models/solicitud.model';
import { Medicamento } from '../../../core/models/medicamento.model';
import { catchError, of } from 'rxjs';

const ALMACEN_ID = 1;

@Component({
  selector: 'app-solicitudes-pendientes',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule,
            ToastModule, BadgeModule, PageHeaderComponent, StatusBadgeComponent],
  /* v8 ignore start */
  template: `
    <p-toast />
    <div class="p-6">
      <app-page-header title="Solicitudes Recibidas"
                       subtitle="Requerimientos de medicamentos de las farmacias" />

      <!-- Banner de alerta si hay solicitudes listas para despachar -->
      <div *ngIf="paraDespachar > 0"
           style="background:#FEF9C3;border:1px solid #EAB308;border-radius:8px;
                  padding:0.75rem 1rem;margin-bottom:1rem;
                  display:flex;align-items:center;gap:0.75rem">
        <i class="pi pi-box" style="color:#CA8A04;font-size:1.2rem"></i>
        <span style="color:#713F12;font-weight:600">
          {{ paraDespachar }} solicitud(es) lista(s) para despachar
        </span>
      </div>

      <p-table [value]="solicitudes" [loading]="cargando"
               styleClass="p-datatable-sm hospital-table"
               [paginator]="true" [rows]="10"
               [rowsPerPageOptions]="[10, 25, 50]">
        <ng-template pTemplate="header">
          <tr>
            <th style="width:3rem"></th>
            <th>N° Solicitud</th>
            <th>Fecha</th>
            <th style="text-align:center">Farmacia</th>
            <th>Estado</th>
            <th style="text-align:center">Ítems</th>
            <th style="text-align:center">Acción</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-sol>
          <!-- Fila principal -->
          <tr>
            <td>
              <button type="button" (click)="toggleRow(sol)"
                      style="border:none;background:transparent;cursor:pointer;
                             color:#1A4F8A;padding:4px 6px;border-radius:4px">
                <i [class]="expandidos.has(sol.id) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"></i>
              </button>
            </td>
            <td>
              <button type="button" (click)="toggleRow(sol)"
                      style="border:none;background:transparent;cursor:pointer;
                             font-family:monospace;font-weight:600;color:#1A4F8A;
                             text-decoration:underline;text-underline-offset:3px;padding:0">
                {{ sol.nroSolicitud }}
              </button>
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
              <!-- PENDIENTE: aún sin aprobación del jefe -->
              <span *ngIf="sol.estado === 'PENDIENTE'"
                    style="font-size:0.78rem;color:#92400E;background:#FEF3C7;
                           padding:3px 8px;border-radius:4px;font-weight:500">
                <i class="pi pi-clock" style="margin-right:4px"></i>Esperando aprobación
              </span>
              <!-- APROBADO o EN_PROCESO: puede despachar -->
              <p-button *ngIf="sol.estado === 'APROBADO_JEFE' || sol.estado === 'EN_PROCESO'"
                        label="Registrar Salida"
                        icon="pi pi-send"
                        severity="success"
                        size="small"
                        [loading]="procesando[sol.id]"
                        (onClick)="despachar(sol)" />
            </td>
          </tr>

          <!-- Fila expandida: medicamentos -->
          <tr *ngIf="expandidos.has(sol.id)">
            <td colspan="7" style="padding:0;background:#F8FAFC;border-top:none">
              <div style="padding:1rem 2rem">
                <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem">
                  <i class="pi pi-pills" style="color:#1A4F8A"></i>
                  <strong style="color:#1A4F8A;font-size:0.82rem;text-transform:uppercase;letter-spacing:0.05em">
                    Medicamentos a preparar
                  </strong>
                </div>
                <table style="width:100%;border-collapse:collapse;font-size:0.82rem">
                  <thead>
                    <tr style="background:#EFF6FF">
                      <th style="padding:6px 10px;text-align:left;color:#1A4F8A;font-weight:600">#</th>
                      <th style="padding:6px 10px;text-align:left;color:#1A4F8A;font-weight:600">Medicamento</th>
                      <th style="padding:6px 10px;text-align:right;color:#1A4F8A;font-weight:600">Cant. Solicitada</th>
                      <th style="padding:6px 10px;text-align:right;color:#1A4F8A;font-weight:600">Cant. Aprobada</th>
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
                        {{ det.cantidadAprobada ?? det.cantidadSolicitada }}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div *ngIf="!sol.detalles?.length"
                     style="text-align:center;padding:1rem;color:#94A3B8;font-size:0.82rem">
                  Sin ítems registrados.
                </div>
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" style="text-align:center;padding:3rem;color:#64748B">
              <i class="pi pi-inbox" style="font-size:2rem;display:block;margin-bottom:0.75rem;color:#CBD5E1"></i>
              <strong style="display:block;margin-bottom:0.25rem">No hay solicitudes activas</strong>
              <span style="font-size:0.85rem">Las farmacias aún no han enviado requerimientos.</span>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `
  /* v8 ignore stop */
})
export class SolicitudesPendientesComponent implements OnInit {
  private readonly solicitudSvc   = inject(SolicitudService);
  private readonly notaSalidaSvc  = inject(NotaSalidaService);
  private readonly medicSvc       = inject(MedicamentoService);
  private readonly msgSvc         = inject(MessageService);
  private readonly cdr            = inject(ChangeDetectorRef);
  private readonly destroyRef     = inject(DestroyRef);

  solicitudes:  Solicitud[]             = [];
  medicamentos: Medicamento[]           = [];
  expandidos:   Set<number>             = new Set();
  procesando:   Record<number, boolean> = {};
  cargando = false;
  error    = false;

  get paraDespachar(): number {
    return this.solicitudes.filter(
      s => s.estado === 'APROBADO_JEFE' || s.estado === 'EN_PROCESO'
    ).length;
  }

  ngOnInit(): void {
    this.medicSvc.listar()
      .pipe(takeUntilDestroyed(this.destroyRef), catchError(() => of([])))
      .subscribe(meds => { this.medicamentos = meds; this.cdr.markForCheck(); });
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error    = false;
    this.expandidos = new Set();
    this.solicitudSvc.listarActivas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.solicitudes = data;
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargando = false;
          this.error    = true;
          this.msgSvc.add({
            severity: 'error', summary: 'Error de conexión',
            detail: 'No se pudo conectar con farmacia-service. Verifique que esté en línea.',
            life: 7000
          });
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

  despachar(sol: Solicitud): void {
    this.procesando[sol.id] = true;

    const ejecutarDespacho = () => {
      const dto = {
        solicitudId:      sol.id,
        /* v8 ignore start */
        almacenId:        sol.almacenId ?? ALMACEN_ID,
        almacenDestinoId: sol.farmaciaId,
        farmaciaId:       sol.farmaciaId,
        detalles: (sol.detalles ?? []).map(d => ({
          medicamentoId:      d.medicamentoId,
          cantidadSolicitada: d.cantidadSolicitada
        }))
        /* v8 ignore stop */
      };
      this.notaSalidaSvc.despachar(dto)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: nota => {
            this.procesando[sol.id] = false;
            this.msgSvc.add({
              severity: 'success', summary: 'Despachado',
              detail: `Nota de Salida ${nota.nroNotaSalida} generada. La farmacia debe confirmar la recepción.`
            });
            this.cargar();
          },
          error: (err) => {
            this.procesando[sol.id] = false;
            /* v8 ignore start */
            const det = err?.error?.error ?? err?.error?.message ?? 'Error al generar nota de salida.';
            /* v8 ignore stop */
            this.msgSvc.add({ severity: 'error', summary: 'Error al despachar', detail: det, life: 8000 });
            this.cdr.markForCheck();
          }
        });
    };

    // Oracle requiere EN_PROCESO antes de DESPACHADA; transición automática
    if (sol.estado === 'APROBADO_JEFE') {
      this.solicitudSvc.marcarEnProceso(sol.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => ejecutarDespacho(),
          error: (err) => {
            this.procesando[sol.id] = false;
            /* v8 ignore start */
            const det = err?.error?.error ?? err?.error?.message ?? 'Error al procesar la solicitud.';
            /* v8 ignore stop */
            this.msgSvc.add({ severity: 'error', summary: 'Error', detail: det, life: 8000 });
            this.cdr.markForCheck();
          }
        });
    } else {
      ejecutarDespacho(); // Ya está EN_PROCESO
    }
  }
}
