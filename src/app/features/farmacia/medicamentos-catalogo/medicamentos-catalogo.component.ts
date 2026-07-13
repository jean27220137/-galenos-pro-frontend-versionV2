import { Component, OnInit, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MedicamentoService } from '../../../core/services/medicamento.service';
import { Medicamento } from '../../../core/models/medicamento.model';

@Component({
  selector: 'app-medicamentos-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, InputTextModule, PageHeaderComponent],
  /* v8 ignore start */
  template: `
    <div class="p-6">
      <app-page-header title="Catálogo de Medicamentos"
                       subtitle="Medicamentos disponibles en el sistema SISMED — solo consulta" />

      <div *ngIf="errorCarga"
           style="margin-bottom:1rem;color:#B91C1C;background:#FEE2E2;
                  padding:10px 14px;border-radius:6px;display:flex;align-items:center;gap:8px">
        <i class="pi pi-exclamation-triangle"></i>
        {{ errorCarga }}
      </div>

      <!-- Buscador -->
      <div style="margin-bottom:1rem;display:flex;gap:0.75rem;align-items:center">
        <span style="position:relative;flex:1;max-width:400px">
          <i class="pi pi-search"
             style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#64748B"></i>
          <input pInputText type="text" [(ngModel)]="busqueda"
                 placeholder="Buscar por nombre o código SISMED..."
                 style="padding-left:2rem;width:100%" />
        </span>
        <span style="font-size:0.8rem;color:#64748B">{{ filtrados.length }} medicamento(s)</span>
      </div>

      <p-table [value]="filtrados" [loading]="cargando"
               styleClass="p-datatable-sm hospital-table"
               [paginator]="true" [rows]="20"
               [rowsPerPageOptions]="[20, 50, 100]">
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="codigoSismed">Cód. SISMED <p-sortIcon field="codigoSismed"/></th>
            <th pSortableColumn="nombre">Nombre <p-sortIcon field="nombre"/></th>
            <th>Presentación</th>
            <th>Concentración</th>
            <th>Vía</th>
            <th style="text-align:center">Stock Mín.</th>
            <th style="text-align:center">Estado</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-m>
          <tr>
            <td style="font-family:monospace;font-size:0.8rem;font-weight:600;color:#1A4F8A">
              {{ m.codigoSismed }}
            </td>
            <td style="font-weight:500">{{ m.nombre }}</td>
            <td style="font-size:0.85rem;color:#475569">{{ m.presentacion }}</td>
            <td style="font-size:0.85rem;color:#475569">{{ m.concentracion }}</td>
            <td style="font-size:0.85rem;color:#475569">{{ m.viaAdministracion }}</td>
            <td style="text-align:center;font-weight:600;color:#1A4F8A">{{ m.stockMinimo }}</td>
            <td style="text-align:center">
              <span [style.color]="m.activo === 1 ? '#15803D' : '#B91C1C'"
                    [style.background]="m.activo === 1 ? '#DCFCE7' : '#FEE2E2'"
                    style="padding:2px 10px;border-radius:9999px;font-size:0.75rem;font-weight:600">
                {{ m.activo === 1 ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" style="text-align:center;padding:2.5rem;color:#64748B">
              <i class="pi pi-pills" style="font-size:1.5rem;display:block;margin-bottom:0.5rem"></i>
              No hay medicamentos en el catálogo.
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `
  /* v8 ignore stop */
})
export class MedicamentosCatalogoComponent implements OnInit {
  private readonly medicSvc   = inject(MedicamentoService);
  private readonly cdr        = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  medicamentos: Medicamento[] = [];
  busqueda     = '';
  cargando     = false;
  errorCarga   = '';

  get filtrados(): Medicamento[] {
    if (!this.busqueda.trim()) return this.medicamentos;
    const q = this.busqueda.toLowerCase();
    return this.medicamentos.filter(m =>
      m.nombre?.toLowerCase().includes(q) ||
      m.codigoSismed?.toLowerCase().includes(q)
    );
  }

  ngOnInit(): void {
    this.cargando = true;
    this.medicSvc.listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.medicamentos = data;
          this.cargando     = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargando   = false;
          this.errorCarga = 'No se pudo cargar el catálogo. Verifique que almacen-service esté disponible (puerto 8083).';
          this.cdr.markForCheck();
        }
      });
  }
}
