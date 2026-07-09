import { Component, OnInit, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, catchError, of, map } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { SolicitudService } from '../../../core/services/solicitud.service';
import { NotaSalidaService } from '../../../core/services/nota-salida.service';
import { MedicamentoService } from '../../../core/services/medicamento.service';
import { AuthService } from '../../../core/services/auth.service';
import { Solicitud } from '../../../core/models/solicitud.model';
import { Medicamento } from '../../../core/models/medicamento.model';

@Component({
  selector: 'app-solicitudes-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
            TextareaModule, ToastModule, ConfirmDialogModule,
            PageHeaderComponent, StatusBadgeComponent],
  template: `
    <p-toast />
    <p-confirmDialog />
    <div class="p-6">

      <app-page-header [title]="esAdmin ? 'Todas las Solicitudes' : 'Mis Solicitudes'"
                       subtitle="Solicitudes de requerimiento de medicamentos">
        <button *ngIf="!esJefeFarmacia && !esAdmin" type="button"
                (click)="router.navigate(['/farmacia/solicitudes/nueva'])"
                style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.5rem 1rem;
                       border:none;border-radius:6px;cursor:pointer;font-size:0.875rem;
                       background:#1A4F8A;color:#fff;font-weight:500">
          <i class="pi pi-plus"></i> Nueva Solicitud
        </button>
      </app-page-header>

      <!-- Banner: medicamentos por verificar -->
      <div *ngIf="pendienteVerificar > 0"
           style="margin-bottom:1rem;background:#FEF3C7;border:1px solid #F59E0B;
                  border-radius:8px;padding:10px 16px;display:flex;align-items:center;gap:10px">
        <i class="pi pi-truck" style="color:#D97706;font-size:1.1rem"></i>
        <span style="color:#92400E;font-size:0.88rem;font-weight:500">
          Tienes <strong>{{ pendienteVerificar }}</strong>
          {{ pendienteVerificar === 1 ? 'despacho' : 'despachos' }}
          pendiente{{ pendienteVerificar === 1 ? '' : 's' }} de verificación.
          Confirma si los medicamentos llegaron correctamente.
        </span>
      </div>

      <!-- Tip jefe -->
      <div *ngIf="esJefeFarmacia && !esAdmin"
           style="margin-bottom:1rem;display:flex;align-items:center;gap:8px;
                  background:#EFF6FF;border:1px solid #BFDBFE;border-radius:6px;
                  padding:8px 14px;font-size:0.82rem;color:#1A4F8A">
        <i class="pi pi-info-circle"></i>
        Haz clic en el <strong style="margin:0 3px">N° Solicitud</strong> para revisar los medicamentos
        y habilitar la aprobación.
      </div>

      <!-- Buscador -->
      <div style="margin-bottom:1rem;display:flex;gap:0.75rem;align-items:center">
        <span style="position:relative;flex:1;max-width:360px">
          <i class="pi pi-search"
             style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#64748B"></i>
          <input pInputText type="text" [(ngModel)]="busqueda"
                 placeholder="Buscar por N° solicitud o estado..."
                 style="padding-left:2rem;width:100%" />
        </span>
        <span style="font-size:0.8rem;color:#64748B">{{ solicitudesFiltradas.length }} resultado(s)</span>
      </div>

      <p-table [value]="solicitudesFiltradas" [loading]="cargando"
               styleClass="p-datatable-sm hospital-table"
               [paginator]="true" [rows]="10"
               [rowsPerPageOptions]="[10,25,50]">

        <ng-template pTemplate="header">
          <tr>
            <th style="width:3rem"></th>
            <th>N° Solicitud</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th style="text-align:center">Ítems</th>
            <th style="text-align:center">Acciones</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-sol>

          <!-- Fila principal -->
          <tr [style.background]="sol.estado === 'DESPACHADA' ? '#FFFBEB' : ''">
            <td>
              <button type="button" (click)="toggleRow(sol)"
                      style="border:none;background:transparent;cursor:pointer;
                             color:#1A4F8A;padding:4px 6px;border-radius:4px">
                <i [class]="expandidos.has(sol.id) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"></i>
              </button>
            </td>
            <td>
              <button type="button" (click)="toggleRow(sol)"
                      style="background:none;border:none;cursor:pointer;padding:0;
                             display:inline-flex;align-items:center;gap:6px">
                <span style="font-family:monospace;font-weight:600;color:#1A4F8A;
                             text-decoration:underline;text-underline-offset:3px">
                  {{ sol.nroSolicitud }}
                </span>
                <i *ngIf="sol.estado === 'DESPACHADA'"
                   class="pi pi-truck"
                   style="font-size:0.75rem;color:#D97706"
                   title="Pendiente de verificación"></i>
              </button>
            </td>
            <td>{{ sol.fechaSolicitud | date:'dd/MM/yyyy HH:mm' }}</td>
            <td><app-status-badge [estado]="sol.estado" /></td>
            <td style="text-align:center">{{ sol.detalles?.length ?? 0 }}</td>
            <td style="text-align:center">
              <div style="display:flex;gap:0.4rem;justify-content:center;align-items:center;flex-wrap:wrap">

                <!-- Jefe: Aprobar solicitudes PENDIENTE -->
                <p-button *ngIf="esJefeFarmacia && sol.estado === 'PENDIENTE'"
                          icon="pi pi-check" severity="success" [text]="true" size="small"
                          label="Aprobar"
                          [disabled]="!revisadas.has(sol.id)"
                          (onClick)="confirmarAprobar(sol)" />

                <!-- DESPACHADA: Aceptar (requiere todos los checks) -->
                <p-button *ngIf="sol.estado === 'DESPACHADA'"
                          label="Aceptar"
                          icon="pi pi-check-circle"
                          severity="success"
                          size="small"
                          [loading]="confirmando[sol.id]"
                          [disabled]="!todosRevisados(sol)"
                          (onClick)="confirmarRecepcion(sol)" />

                <!-- DESPACHADA: Rechazar -->
                <p-button *ngIf="sol.estado === 'DESPACHADA'"
                          label="Rechazar"
                          icon="pi pi-times"
                          severity="danger"
                          [text]="true"
                          size="small"
                          [disabled]="confirmando[sol.id]"
                          (onClick)="toggleRechazo(sol)" />

                <!-- Cancelar (solo PENDIENTE o APROBADO_JEFE) -->
                <p-button *ngIf="sol.estado === 'PENDIENTE' || sol.estado === 'APROBADO_JEFE'"
                          icon="pi pi-times" severity="danger" [text]="true" size="small"
                          label="Cancelar"
                          (onClick)="confirmarCancelar(sol)" />

                <!-- Estados finales -->
                <span *ngIf="sol.estado === 'ENTREGADA'"
                      style="color:#059669;font-size:0.78rem;font-weight:600;
                             background:#DCFCE7;padding:2px 8px;border-radius:4px">
                  <i class="pi pi-check-circle" style="margin-right:3px"></i>Confirmado
                </span>
                <span *ngIf="sol.estado === 'RECHAZADA'"
                      style="color:#DC2626;font-size:0.78rem;font-weight:600;
                             background:#FEE2E2;padding:2px 8px;border-radius:4px">
                  <i class="pi pi-times-circle" style="margin-right:3px"></i>Rechazado
                </span>
                <span *ngIf="sol.estado === 'CANCELADA'"
                      style="color:#6B7280;font-size:0.78rem;
                             background:#F1F5F9;padding:2px 8px;border-radius:4px">
                  Cancelada
                </span>
                <span *ngIf="sol.estado === 'EN_PROCESO'"
                      style="color:#7C3AED;font-size:0.78rem;
                             background:#EDE9FE;padding:2px 8px;border-radius:4px">
                  En preparación
                </span>
                <span *ngIf="sol.estado === 'APROBADO_JEFE' && !esJefeFarmacia"
                      style="color:#D97706;font-size:0.78rem;
                             background:#FEF3C7;padding:2px 8px;border-radius:4px">
                  Esperando almacén
                </span>
              </div>
            </td>
          </tr>

          <!-- Formulario de rechazo inline -->
          <tr *ngIf="rechazando[sol.id]">
            <td colspan="6" style="padding:0;background:#FFF5F5;border-top:none">
              <div style="padding:1rem 2rem;display:flex;flex-direction:column;gap:0.75rem">
                <div style="display:flex;align-items:center;gap:0.5rem">
                  <i class="pi pi-exclamation-triangle" style="color:#DC2626"></i>
                  <strong style="color:#DC2626;font-size:0.85rem">
                    Rechazar despacho — {{ sol.nroSolicitud }}
                  </strong>
                </div>
                <textarea pTextarea
                          [(ngModel)]="motivos[sol.id]"
                          rows="3"
                          placeholder="Explique qué falta o qué llegó incorrecto..."
                          style="width:100%;font-size:0.85rem;resize:vertical;
                                 border:1px solid #FECACA;border-radius:6px;padding:0.5rem">
                </textarea>
                <div style="display:flex;gap:0.5rem">
                  <p-button label="Confirmar rechazo"
                            icon="pi pi-times-circle"
                            severity="danger"
                            size="small"
                            [loading]="enviandoRechazo[sol.id]"
                            [disabled]="!motivos[sol.id]?.trim()"
                            (onClick)="enviarRechazo(sol)" />
                  <p-button label="Cancelar"
                            severity="secondary"
                            [text]="true"
                            size="small"
                            (onClick)="toggleRechazo(sol)" />
                </div>
              </div>
            </td>
          </tr>

          <!-- Fila expandida: detalles del pedido -->
          <tr *ngIf="expandidos.has(sol.id)">
            <td colspan="6" style="padding:0;background:#F8FAFC;border-top:none">
              <div style="padding:1rem 2rem">

                <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem">
                  <i [class]="sol.estado === 'DESPACHADA' ? 'pi pi-file-check' : 'pi pi-list'"
                     style="color:#1A4F8A"></i>
                  <strong style="color:#1A4F8A;font-size:0.82rem;
                                 text-transform:uppercase;letter-spacing:0.05em">
                    {{ sol.estado === 'DESPACHADA'
                        ? 'Marque cada medicamento recibido correctamente'
                        : 'Medicamentos de la solicitud' }}
                  </strong>
                  <span *ngIf="sol.estado === 'DESPACHADA' && sol.detalles?.length"
                        style="margin-left:auto;font-size:0.78rem;color:#D97706;
                               background:#FEF3C7;padding:2px 10px;border-radius:9999px;font-weight:600">
                    {{ cantRevisados(sol) }} / {{ sol.detalles.length }} verificados
                  </span>
                </div>

                <table style="width:100%;border-collapse:collapse;font-size:0.82rem">
                  <thead>
                    <tr style="background:#EFF6FF">
                      <th *ngIf="sol.estado === 'DESPACHADA'"
                          style="padding:6px 10px;text-align:center;color:#1A4F8A;font-weight:600;width:52px">
                        Recibido
                      </th>
                      <th style="padding:6px 10px;text-align:left;color:#1A4F8A;font-weight:600">#</th>
                      <th style="padding:6px 10px;text-align:left;color:#1A4F8A;font-weight:600">Medicamento</th>
                      <th style="padding:6px 10px;text-align:right;color:#1A4F8A;font-weight:600">Cant. Solicitada</th>
                      <th style="padding:6px 10px;text-align:right;color:#1A4F8A;font-weight:600">Cant. Aprobada</th>
                      <th *ngIf="sol.estado !== 'DESPACHADA'"
                          style="padding:6px 10px;text-align:center;color:#1A4F8A;font-weight:600">
                        Resultado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let det of sol.detalles; let i = index"
                        [style.background]="sol.estado === 'DESPACHADA' && recibidoCheck(sol.id, det.id ?? i)
                                            ? '#F0FDF4'
                                            : (i % 2 === 0 ? '#fff' : '#F0F4F8')"
                        style="transition:background 0.2s">
                      <td *ngIf="sol.estado === 'DESPACHADA'"
                          style="padding:6px 10px;text-align:center">
                        <input type="checkbox"
                               [checked]="recibidoCheck(sol.id, det.id ?? i)"
                               (change)="toggleCheck(sol.id, det.id ?? i)"
                               style="width:16px;height:16px;cursor:pointer;accent-color:#059669" />
                      </td>
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
                      <td *ngIf="sol.estado !== 'DESPACHADA'"
                          style="padding:6px 10px;text-align:center">
                        <span *ngIf="det.observacion"
                              [style.color]="det.observacion==='APROBADO'  ? '#059669' :
                                             det.observacion==='SIN_STOCK' ? '#EF4444' : '#F59E0B'"
                              [style.background]="det.observacion==='APROBADO'  ? '#DCFCE7' :
                                                  det.observacion==='SIN_STOCK' ? '#FEE2E2' : '#FEF3C7'"
                              style="font-size:0.75rem;font-weight:700;
                                     padding:2px 10px;border-radius:9999px">
                          {{ det.observacion }}
                        </span>
                        <span *ngIf="!det.observacion" style="color:#94A3B8">—</span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- Barra de progreso (solo DESPACHADA) -->
                <div *ngIf="sol.estado === 'DESPACHADA' && sol.detalles?.length"
                     style="margin-top:0.75rem;display:flex;align-items:center;gap:0.75rem">
                  <div style="flex:1;height:6px;background:#E2E8F0;border-radius:9999px;overflow:hidden">
                    <div [style.width]="porcentajeRevisados(sol) + '%'"
                         style="height:100%;background:#059669;border-radius:9999px;transition:width 0.3s">
                    </div>
                  </div>
                  <span style="font-size:0.78rem;color:#64748B;white-space:nowrap">
                    {{ porcentajeRevisados(sol) }}% verificado
                  </span>
                </div>

                <!-- Motivo de rechazo si aplica -->
                <div *ngIf="sol.estado === 'RECHAZADA' && sol.observacion"
                     style="margin-top:0.75rem;background:#FEF2F2;border:1px solid #FECACA;
                            border-radius:6px;padding:10px 14px">
                  <strong style="color:#DC2626;font-size:0.8rem">Motivo del rechazo:</strong>
                  <p style="color:#7F1D1D;font-size:0.82rem;margin:4px 0 0">{{ sol.observacion }}</p>
                </div>

                <!-- Pie: botón aprobar dentro de la proforma (solo jefe) -->
                <div *ngIf="esJefeFarmacia && sol.estado === 'PENDIENTE'"
                     style="margin-top:0.75rem;display:flex;justify-content:flex-end">
                  <p-button icon="pi pi-check" severity="success" size="small"
                            label="Aprobar esta solicitud"
                            (onClick)="confirmarAprobar(sol)" />
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
              <i class="pi pi-inbox" style="font-size:1.5rem;display:block;margin-bottom:0.5rem"></i>
              No hay solicitudes registradas.
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `
})
export class SolicitudesListComponent implements OnInit {
  readonly router               = inject(Router);
  private readonly solicitudSvc = inject(SolicitudService);
  private readonly notaSalidaSvc = inject(NotaSalidaService);
  private readonly medicSvc     = inject(MedicamentoService);
  private readonly authSvc      = inject(AuthService);
  private readonly msgSvc       = inject(MessageService);
  private readonly confirmSvc   = inject(ConfirmationService);
  private readonly cdr          = inject(ChangeDetectorRef);
  private readonly destroyRef   = inject(DestroyRef);

  solicitudes:     Solicitud[]              = [];
  medicamentos:    Medicamento[]            = [];
  expandidos:      Set<number>              = new Set();
  revisadas:       Set<number>              = new Set();
  revisados:       Map<number, Set<number>> = new Map();
  confirmando:     Record<number, boolean>  = {};
  rechazando:      Record<number, boolean>  = {};
  enviandoRechazo: Record<number, boolean>  = {};
  motivos:         Record<number, string>   = {};
  busqueda         = '';
  cargando         = false;
  esAdmin          = false;
  esJefeFarmacia   = false;

  get pendienteVerificar(): number {
    return this.solicitudes.filter(s => s.estado === 'DESPACHADA').length;
  }

  get solicitudesFiltradas(): Solicitud[] {
    if (!this.busqueda.trim()) return this.solicitudes;
    const q = this.busqueda.toLowerCase();
    return this.solicitudes.filter(s =>
      s.nroSolicitud?.toLowerCase().includes(q) ||
      s.estado?.toLowerCase().includes(q)
    );
  }

  ngOnInit(): void {
    const sesion        = this.authSvc.getSesion();
    this.esAdmin        = sesion?.rol === 'ADMIN';
    this.esJefeFarmacia = sesion?.rol === 'JEFE_FARMACIA';
    const farmaciaId    = sesion?.farmaciaId || 1;

    forkJoin({
      medicamentos: this.medicSvc.listar().pipe(catchError(() => of([]))),
      solicitudes:  this.esAdmin
                      ? this.cargarTodasAdmin()
                      : this.solicitudSvc.listarPorFarmacia(farmaciaId)
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ medicamentos, solicitudes }) => {
          this.medicamentos = medicamentos as Medicamento[];
          this.solicitudes  = (solicitudes as Solicitud[]).sort((a, b) =>
            new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime()
          );
          this.expandidos = new Set(
            this.solicitudes.filter(s => s.estado === 'DESPACHADA').map(s => s.id)
          );
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargando = false;
          this.msgSvc.add({ severity: 'error', summary: 'Error',
            detail: 'No se pudieron cargar las solicitudes.', life: 6000 });
          this.cdr.markForCheck();
        }
      });
  }

  private cargarTodasAdmin() {
    const estados = ['PENDIENTE','APROBADO_JEFE','EN_PROCESO','DESPACHADA','ENTREGADA','CANCELADA','RECHAZADA'];
    return forkJoin(estados.map(e => this.solicitudSvc.listarPorEstado(e).pipe(catchError(() => of([])))))
      .pipe(
        map((arrays: any[]) => (arrays as Solicitud[][]).flat()),
        catchError(() => of([]))
      );
  }

  toggleRow(sol: Solicitud): void {
    if (this.expandidos.has(sol.id)) {
      this.expandidos.delete(sol.id);
    } else {
      this.expandidos.add(sol.id);
      if (sol.estado !== 'DESPACHADA') this.revisadas.add(sol.id);
    }
    this.expandidos = new Set(this.expandidos);
    this.revisadas  = new Set(this.revisadas);
    this.cdr.markForCheck();
  }

  toggleRechazo(sol: Solicitud): void {
    this.rechazando[sol.id] = !this.rechazando[sol.id];
    if (!this.rechazando[sol.id]) this.motivos[sol.id] = '';
    this.cdr.markForCheck();
  }

  nombreMed(id: number): string {
    const m = this.medicamentos.find(x => x.id === id);
    return m ? `${m.nombre} (${m.codigoSismed})` : `Medicamento #${id}`;
  }

  // ── Checkboxes ───────────────────────────────────────────────────────────

  recibidoCheck(solId: number, key: number): boolean {
    return this.revisados.get(solId)?.has(key) ?? false;
  }

  toggleCheck(solId: number, key: number): void {
    if (!this.revisados.has(solId)) this.revisados.set(solId, new Set());
    const set = this.revisados.get(solId)!;
    if (set.has(key)) set.delete(key); else set.add(key);
    this.revisados = new Map(this.revisados);
    this.cdr.markForCheck();
  }

  cantRevisados(sol: Solicitud): number {
    return this.revisados.get(sol.id)?.size ?? 0;
  }

  porcentajeRevisados(sol: Solicitud): number {
    if (!sol.detalles?.length) return 0;
    return Math.round((this.cantRevisados(sol) / sol.detalles.length) * 100);
  }

  todosRevisados(sol: Solicitud): boolean {
    if (!sol.detalles?.length) return false;
    return this.cantRevisados(sol) >= sol.detalles.length;
  }

  // ── Confirmar recepción ──────────────────────────────────────────────────

  confirmarRecepcion(sol: Solicitud): void {
    if (!this.todosRevisados(sol)) return;
    this.confirmando[sol.id] = true;

    this.solicitudSvc.confirmarEntrega(sol.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const afterConfirm = () => {
            this.confirmando[sol.id] = false;
            this.revisados.delete(sol.id);
            this.msgSvc.add({
              severity: 'success', summary: 'Recepción confirmada',
              detail: `Solicitud ${sol.nroSolicitud} marcada como ENTREGADA. Queda registrada en el historial.`
            });
            this.ngOnInit();
          };
          if (sol.notaSalidaId) {
            this.notaSalidaSvc.confirmarEntrega(sol.notaSalidaId)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({ next: afterConfirm, error: afterConfirm });
          } else {
            afterConfirm();
          }
        },
        error: (err) => {
          this.confirmando[sol.id] = false;
          const det = err?.error?.error ?? err?.error?.message ?? 'No se pudo confirmar la recepción.';
          this.msgSvc.add({ severity: 'error', summary: 'Error', detail: det, life: 8000 });
          this.cdr.markForCheck();
        }
      });
  }

  // ── Rechazar recepción ───────────────────────────────────────────────────

  enviarRechazo(sol: Solicitud): void {
    const motivo = this.motivos[sol.id]?.trim();
    if (!motivo) return;

    this.enviandoRechazo[sol.id] = true;
    this.solicitudSvc.rechazar(sol.id, motivo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.enviandoRechazo[sol.id] = false;
          this.rechazando[sol.id]      = false;
          this.motivos[sol.id]         = '';
          this.msgSvc.add({
            severity: 'warn', summary: 'Despacho rechazado',
            detail: `${sol.nroSolicitud} rechazada. Se notificará al almacén.`
          });
          this.ngOnInit();
        },
        error: (err) => {
          this.enviandoRechazo[sol.id] = false;
          const det = err?.error?.error ?? err?.error?.message ?? 'No se pudo registrar el rechazo.';
          this.msgSvc.add({ severity: 'error', summary: 'Error', detail: det, life: 8000 });
          this.cdr.markForCheck();
        }
      });
  }

  // ── Jefe: Aprobar ────────────────────────────────────────────────────────

  confirmarAprobar(sol: Solicitud): void {
    this.confirmSvc.confirm({
      message:                `¿Confirmas la aprobación de <strong>${sol.nroSolicitud}</strong>?`,
      header:                 'Aprobar solicitud',
      icon:                   'pi pi-check-circle',
      acceptLabel:            'Sí, aprobar',
      rejectLabel:            'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.solicitudSvc.aprobar(sol.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              sol.estado = 'APROBADO_JEFE';
              this.msgSvc.add({
                severity: 'success', summary: 'Solicitud aprobada',
                detail: `${sol.nroSolicitud} aprobada y enviada al almacén.`, life: 5000
              });
              this.cdr.markForCheck();
            },
            error: (err) => {
              const det = err?.error?.error ?? err?.error?.message ?? 'Error al comunicarse con el servicio.';
              this.msgSvc.add({ severity: 'error', summary: 'No se pudo aprobar', detail: det, life: 8000 });
              this.cdr.markForCheck();
            }
          });
      }
    });
  }

  // ── Cancelar ─────────────────────────────────────────────────────────────

  confirmarCancelar(sol: Solicitud): void {
    this.confirmSvc.confirm({
      message:                `¿Cancelar <strong>${sol.nroSolicitud}</strong>? Esta acción no se puede deshacer.`,
      header:                 'Cancelar solicitud',
      icon:                   'pi pi-exclamation-triangle',
      acceptLabel:            'Sí, cancelar',
      rejectLabel:            'Volver',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.solicitudSvc.cancelar(sol.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              sol.estado = 'CANCELADA';
              this.msgSvc.add({ severity: 'warn', summary: 'Solicitud cancelada',
                detail: `${sol.nroSolicitud} fue cancelada.` });
              this.cdr.markForCheck();
            },
            error: (err) => {
              const det = err?.error?.error ?? err?.error?.message ?? 'Error al comunicarse con el servicio.';
              this.msgSvc.add({ severity: 'error', summary: 'No se pudo cancelar', detail: det, life: 8000 });
              this.cdr.markForCheck();
            }
          });
      }
    });
  }
}
