import { Component, OnInit, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { NotaSalidaService } from '../../../core/services/nota-salida.service';
import { NotaSalida } from '../../../core/models/nota-salida.model';

const ALMACEN_ID = 1;

@Component({
  selector: 'app-notas-salida-list',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <div class="p-6">
      <app-page-header title="Notas de Salida" subtitle="Despachos generados por el almacén" />

      <p-table [value]="notas" [loading]="cargando"
               styleClass="p-datatable-sm hospital-table"
               [paginator]="true" [rows]="10"
               [rowsPerPageOptions]="[10, 25, 50]">
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="nroNotaSalida">N° Nota <p-sortIcon field="nroNotaSalida"/></th>
            <th>N° Movimiento</th>
            <th style="text-align:center">Fecha</th>
            <th>Estado</th>
            <th style="text-align:center">Acciones</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-n>
          <tr>
            <td style="font-family:monospace;font-weight:700;color:#1A4F8A">{{ n.nroNotaSalida }}</td>
            <td style="font-family:monospace;font-size:0.8rem">{{ n.nroMovimiento }}</td>
            <td style="text-align:center">{{ n.fechaMovimiento | date:'dd/MM/yyyy HH:mm' }}</td>
            <td><app-status-badge [estado]="n.estado" /></td>
            <td style="text-align:center;display:flex;gap:0.5rem;justify-content:center">
              <p-button label="Ver detalle" icon="pi pi-eye" size="small" [text]="true"
                        (onClick)="verDetalle(n.id)" />
              <p-button label="Confirmar" icon="pi pi-check" size="small"
                        [disabled]="n.estado === 'ENTREGADA'"
                        (onClick)="confirmarEntrega(n)" />
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="5" style="text-align:center;padding:2.5rem;color:#64748B">
              No hay notas de salida.
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `
})
export class NotasSalidaListComponent implements OnInit {
  private readonly notaSalidaService = inject(NotaSalidaService);
  private readonly messageService    = inject(MessageService);
  private readonly router            = inject(Router);
  private readonly cdr               = inject(ChangeDetectorRef);
  private readonly destroyRef        = inject(DestroyRef);

  notas:   NotaSalida[] = [];
  cargando = false;

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando = true;
    this.notaSalidaService.listarPorAlmacen(ALMACEN_ID)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => { this.notas = data; this.cargando = false; this.cdr.markForCheck(); },
        error: ()  => { this.cargando = false; this.cdr.markForCheck(); }
      });
  }

  verDetalle(id: number): void {
    this.router.navigate(['/almacen/notas-salida', id]);
  }

  confirmarEntrega(nota: NotaSalida): void {
    this.notaSalidaService.confirmarEntrega(nota.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          nota.estado = 'ENTREGADA';
          this.messageService.add({ severity: 'success', summary: 'Entrega confirmada', detail: nota.nroNotaSalida });
          this.cdr.markForCheck();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo confirmar la entrega' });
          this.cdr.markForCheck();
        }
      });
  }
}
