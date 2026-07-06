import { Component, OnInit, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { SolicitudService } from '../../../core/services/solicitud.service';
import { AuthService } from '../../../core/services/auth.service';
import { Solicitud } from '../../../core/models/solicitud.model';

@Component({
  selector: 'app-solicitudes-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
            PageHeaderComponent, StatusBadgeComponent],
  template: `
    <div class="p-6">
      <app-page-header [title]="esAdmin ? 'Todas las Solicitudes' : 'Mis Solicitudes'"
                   subtitle="Solicitudes de requerimiento de medicamentos">
        <button type="button" (click)="router.navigate(['/farmacia/solicitudes/nueva'])"
                class="p-button p-button-primary"
                style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.5rem 1rem;
                       border:none;border-radius:6px;cursor:pointer;font-size:0.875rem;
                       background:#1A4F8A;color:#fff;font-weight:500">
          <i class="pi pi-plus"></i> Nueva Solicitud
        </button>
      </app-page-header>


      <!-- Error de carga -->
      <div *ngIf="errorCarga" class="page-error" style="margin-bottom:1rem">
        <i class="pi pi-wifi"></i>
        <strong>{{ errorCarga }}</strong>
        <p>Asegúrese de que farmacia-service esté corriendo en el puerto 8082.</p>
      </div>

      <!-- Buscador -->
      <div style="margin-bottom:1rem;display:flex;gap:0.75rem;align-items:center">
        <span style="position:relative;flex:1;max-width:360px">
          <i class="pi pi-search"
             style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#64748B"></i>
          <input pInputText type="text"
                 [(ngModel)]="busqueda"
                 placeholder="Buscar por N° solicitud o estado..."
                 style="padding-left:2rem;width:100%"
                 aria-label="Buscar solicitudes" />
        </span>
        <span style="font-size:0.8rem;color:#64748B">
          {{ solicitudesFiltradas.length }} resultado(s)
        </span>
      </div>

      <p-table [value]="solicitudesFiltradas" [loading]="cargando"
               styleClass="p-datatable-sm hospital-table"
               [paginator]="true" [rows]="10"
               [rowsPerPageOptions]="[10, 25, 50]">
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="nroSolicitud">N° Solicitud <p-sortIcon field="nroSolicitud"/></th>
            <th pSortableColumn="fechaSolicitud">Fecha <p-sortIcon field="fechaSolicitud"/></th>
            <th>Estado</th>
            <th style="text-align:center">Medicamentos</th>
            <th style="text-align:center">Acciones</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-sol>
          <tr>
            <td style="font-family:monospace;font-weight:600;color:#1A4F8A">{{ sol.nroSolicitud }}</td>
            <td>{{ sol.fechaSolicitud | date:'dd/MM/yyyy' }}</td>
            <td><app-status-badge [estado]="sol.estado" /></td>
            <td style="text-align:center">{{ sol.detalles?.length ?? 0 }} ítem(s)</td>
            <td style="text-align:center">
              <p-button icon="pi pi-times" severity="danger" [text]="true" size="small"
                        label="Cancelar"
                        [disabled]="sol.estado !== 'PENDIENTE'"
                        (onClick)="confirmarCancelar(sol)" />
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="5" style="text-align:center;padding:2.5rem;color:#64748B">
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
  readonly router = inject(Router);
  private readonly solicitudService = inject(SolicitudService);
  private readonly authService      = inject(AuthService);
  private readonly messageService   = inject(MessageService);
  private readonly cdr              = inject(ChangeDetectorRef);
  private readonly destroyRef       = inject(DestroyRef);

  solicitudes: Solicitud[] = [];
  busqueda  = '';
  cargando  = false;
  esAdmin   = false;
  errorCarga = '';

  get solicitudesFiltradas(): Solicitud[] {
    if (!this.busqueda.trim()) return this.solicitudes;
    const q = this.busqueda.toLowerCase();
    return this.solicitudes.filter(s =>
      s.nroSolicitud?.toLowerCase().includes(q) ||
      s.estado?.toLowerCase().includes(q)
    );
  }

  ngOnInit(): void {
    const sesion     = this.authService.getSesion();
    this.esAdmin     = sesion?.rol === 'ADMIN';
    const farmaciaId = sesion?.farmaciaId || 1;

    if (this.esAdmin) {
      this.cargarTodas();
    } else {
      this.cargar(farmaciaId);
    }
  }

  cargar(farmaciaId: number): void {
    this.cargando = true;
    this.errorCarga = '';
    this.solicitudService.listarPorFarmacia(farmaciaId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => { this.solicitudes = data; this.cargando = false; this.cdr.markForCheck(); },
        error: ()  => {
          this.cargando = false;
          this.errorCarga = 'No se pudieron cargar las solicitudes. Verifique que el servicio esté en línea.';
          this.cdr.markForCheck();
        }
      });
  }

  cargarTodas(): void {
    this.cargando = true;
    this.errorCarga = '';
    const estados = ['PENDIENTE', 'EN_PROCESO', 'DESPACHADO', 'ENTREGADO', 'CANCELADA'];
    forkJoin(estados.map(e => this.solicitudService.listarPorEstado(e)))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: resultados => {
          this.solicitudes = resultados.flat().sort((a, b) =>
            new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime()
          );
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargando = false;
          this.errorCarga = 'No se pudieron cargar las solicitudes. Verifique que el servicio esté en línea.';
          this.cdr.markForCheck();
        }
      });
  }

  confirmarCancelar(sol: Solicitud): void {
    if (!window.confirm(`¿Cancelar la solicitud ${sol.nroSolicitud}?`)) return;
    this.solicitudService.cancelar(sol.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          sol.estado = 'CANCELADA';
          this.messageService.add({ severity: 'success', summary: 'Cancelada', detail: sol.nroSolicitud });
          this.cdr.markForCheck();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cancelar' });
          this.cdr.markForCheck();
        }
      });
  }
}
