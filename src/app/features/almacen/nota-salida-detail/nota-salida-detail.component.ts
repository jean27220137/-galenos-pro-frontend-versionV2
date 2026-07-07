import { Component, OnInit, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { NotaSalidaService } from '../../../core/services/nota-salida.service';
import { NotaSalida } from '../../../core/models/nota-salida.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-nota-salida-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe, ButtonModule, TableModule, StatusBadgeComponent],
  template: `
    <div class="p-6">

      <!-- Acciones (no imprimibles) -->
      <div class="no-print" style="display:flex;gap:0.75rem;margin-bottom:1.5rem;align-items:center">
        <p-button icon="pi pi-arrow-left" label="Volver" severity="secondary" [text]="true"
                  (onClick)="router.navigate(['/almacen/notas-salida'])" />
        <p-button icon="pi pi-print" label="Imprimir" (onClick)="imprimir()"
                  [disabled]="!nota" />
      </div>

      <!-- Cargando -->
      <div *ngIf="cargando" style="text-align:center;padding:3rem;color:#64748B">
        <i class="pi pi-spin pi-spinner" style="font-size:2rem"></i>
        <p style="margin-top:0.75rem">Cargando nota de salida...</p>
      </div>

      <!-- Error -->
      <div *ngIf="!cargando && !nota" style="text-align:center;padding:3rem">
        <i class="pi pi-exclamation-circle" style="font-size:2rem;color:#B91C1C"></i>
        <p style="margin-top:0.75rem;color:#64748B">No se encontró la nota de salida.</p>
      </div>

      <!-- Documento -->
      <div *ngIf="nota" class="document-wrapper">

        <!-- Encabezado del documento -->
        <div class="document-header">
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:8px">
            <span style="font-size:2rem">⚕</span>
            <div>
              <div class="document-hospital-name">Hospital Nacional Sergio E. Bernales</div>
              <div style="font-size:0.75rem;color:#64748B">Comas, Lima — MINSA</div>
            </div>
          </div>
          <div class="document-title">NOTA DE SALIDA</div>
          <div style="margin-top:6px">
            <app-status-badge [estado]="nota.estado" />
          </div>
        </div>

        <!-- Metadatos -->
        <div class="document-meta">
          <div class="document-meta-item">
            <label>N° Nota de Salida</label>
            <span style="font-family:monospace">{{ nota.nroNotaSalida }}</span>
          </div>
          <div class="document-meta-item">
            <label>N° Movimiento</label>
            <span style="font-family:monospace">{{ nota.nroMovimiento }}</span>
          </div>
          <div class="document-meta-item">
            <label>Fecha de Movimiento</label>
            <span>{{ nota.fechaMovimiento | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
          <div class="document-meta-item">
            <label>N° Solicitud</label>
            <span>{{ nota.solicitudId }}</span>
          </div>
          <div class="document-meta-item">
            <label>Almacén Origen</label>
            <span>Almacén #{{ nota.almacenOrigenId }}</span>
          </div>
          <div class="document-meta-item">
            <label>Farmacia Destino</label>
            <span>Farmacia #{{ nota.almacenDestinoId }}</span>
          </div>
        </div>

        <!-- Tabla de detalles -->
        <p-table [value]="nota.detalles"
                 styleClass="p-datatable-sm hospital-table"
                 [tableStyle]="{'width':'100%'}">
          <ng-template pTemplate="header">
            <tr>
              <th>#</th>
              <th>Lote</th>
              <th style="text-align:center">Vencimiento</th>
              <th style="text-align:center">Cantidad</th>
              <th style="text-align:right">P. Unitario</th>
              <th style="text-align:right">Total</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-d let-i="rowIndex">
            <tr>
              <td style="color:#64748B;font-size:0.8rem">{{ i + 1 }}</td>
              <td style="font-family:monospace;font-size:0.85rem">{{ d.lote }}</td>
              <td style="text-align:center">{{ d.fechaVencimiento | date:'dd/MM/yyyy' }}</td>
              <td style="text-align:center;font-weight:600">{{ d.cantidad }}</td>
              <td style="text-align:right">{{ d.precioUnitario | currency:'PEN':'S/ ':'1.2-2' }}</td>
              <td style="text-align:right;font-weight:600">{{ d.total | currency:'PEN':'S/ ':'1.2-2' }}</td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" style="text-align:center;padding:1.5rem;color:#64748B">
                Sin detalles registrados.
              </td>
            </tr>
          </ng-template>
        </p-table>

        <!-- Total general -->
        <div class="document-total" style="margin-top:1rem">
          TOTAL GENERAL: {{ totalGeneral | currency:'PEN':'S/ ':'1.2-2' }}
        </div>

        <!-- Firma -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-top:3rem;padding-top:1rem;
                    border-top:1px solid #E2E8F0">
          <div style="text-align:center">
            <div style="border-top:1px solid #1E293B;padding-top:6px;margin-top:2.5rem;
                        font-size:0.75rem;color:#64748B">
              Responsable del Almacén
            </div>
          </div>
          <div style="text-align:center">
            <div style="border-top:1px solid #1E293B;padding-top:6px;margin-top:2.5rem;
                        font-size:0.75rem;color:#64748B">
              Responsable de Farmacia
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class NotaSalidaDetailComponent implements OnInit {
  readonly router = inject(Router);
  private readonly route             = inject(ActivatedRoute);
  private readonly notaSalidaService = inject(NotaSalidaService);
  private readonly cdr               = inject(ChangeDetectorRef);
  private readonly destroyRef        = inject(DestroyRef);

  nota:    NotaSalida | null = null;
  cargando = true;

  get totalGeneral(): number {
    return (this.nota?.detalles ?? []).reduce((sum, d) => sum + (d.total ?? 0), 0);
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.cargando = false; return; }

    this.notaSalidaService.buscarPorId(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => { this.nota = data; this.cargando = false; this.cdr.markForCheck(); },
        error: ()  => { this.cargando = false; this.cdr.markForCheck(); }
      });
  }

  imprimir(): void { window.print(); }
}
