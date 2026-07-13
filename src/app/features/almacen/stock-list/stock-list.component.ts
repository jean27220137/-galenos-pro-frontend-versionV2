import { Component, OnInit, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StockService } from '../../../core/services/stock.service';
import { MedicamentoService } from '../../../core/services/medicamento.service';
import { Stock } from '../../../core/models/stock.model';
import { Medicamento } from '../../../core/models/medicamento.model';

const ALMACEN_ID    = 1;
const UMBRAL_CRITICO = 10;

@Component({
  selector: 'app-stock-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule,
            InputTextModule, DialogModule, InputNumberModule, PageHeaderComponent],
  /* v8 ignore start */
  template: `
    <div class="p-6">
      <app-page-header title="Stock del Almacén" subtitle="Inventario de medicamentos por lote">
        <p-button label="Registrar entrada" icon="pi pi-plus"
                  (onClick)="abrirDialog()" />
      </app-page-header>

      <!-- Error de carga -->
      <div *ngIf="errorCarga" class="page-error" style="margin-bottom:1rem">
        <i class="pi pi-server"></i>
        <strong>{{ errorCarga }}</strong>
        <p>El stock se cargará automáticamente cuando el servicio esté disponible.</p>
      </div>

      <!-- Buscador -->
      <div style="margin-bottom:1rem;display:flex;gap:0.75rem;align-items:center">
        <span style="position:relative;flex:1;max-width:360px">
          <i class="pi pi-search"
             style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#64748B"></i>
          <input pInputText type="text"
                 [(ngModel)]="busqueda"
                 placeholder="Buscar por medicamento o lote..."
                 style="padding-left:2rem;width:100%"
                 aria-label="Buscar stock" />
        </span>
        <span style="font-size:0.8rem;color:#64748B">
          {{ stockFiltrado.length }} registro(s)
        </span>
      </div>

      <p-table [value]="stockFiltrado" [loading]="cargando"
               styleClass="p-datatable-sm hospital-table"
               [paginator]="true" [rows]="15"
               [rowsPerPageOptions]="[15, 30, 50]">
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="nombreMedicamento">Medicamento <p-sortIcon field="nombreMedicamento"/></th>
            <th>Cód. SISMED</th>
            <th>Lote</th>
            <th pSortableColumn="cantidad" style="text-align:center">Cantidad <p-sortIcon field="cantidad"/></th>
            <th pSortableColumn="fechaVencimiento">Vencimiento <p-sortIcon field="fechaVencimiento"/></th>
            <th style="text-align:center">Estado</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-s>
          <tr [style.background]="s.cantidad <= UMBRAL_CRITICO ? '#FEF3C7' : 'inherit'">
            <td style="font-weight:500">{{ s.nombreMedicamento }}</td>
            <td style="font-family:monospace;font-size:0.8rem">{{ s.codigoSismed }}</td>
            <td style="font-family:monospace;font-size:0.8rem">{{ s.lote }}</td>
            <td style="text-align:center;font-weight:700"
                [style.color]="s.cantidad <= UMBRAL_CRITICO ? '#B91C1C' : '#15803D'">
              {{ s.cantidad }}
            </td>
            <td>{{ s.fechaVencimiento | date:'dd/MM/yyyy' }}</td>
            <td style="text-align:center">
              <span *ngIf="s.cantidad <= UMBRAL_CRITICO"
                    class="status-badge" style="color:#B91C1C;background:#FEE2E2">Crítico</span>
              <span *ngIf="s.cantidad > UMBRAL_CRITICO"
                    class="status-badge" style="color:#15803D;background:#DCFCE7">OK</span>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="6" style="text-align:center;padding:2.5rem;color:#64748B">
              No hay stock registrado.
            </td>
          </tr>
        </ng-template>
      </p-table>

      <!-- Dialog: Registrar entrada de stock -->
      <p-dialog header="Registrar Entrada de Stock" [(visible)]="dialogVisible"
                [modal]="true" [style]="{width:'500px'}" [draggable]="false">

        <form [formGroup]="form" (ngSubmit)="guardar()"
              style="display:flex;flex-direction:column;gap:1rem;padding-top:0.5rem">

          <div>
            <label class="form-label">Medicamento *</label>
            <select formControlName="medicamentoId"
                    style="width:100%;padding:0.5rem;border:1px solid #CBD5E1;border-radius:6px;
                           font-size:0.875rem;background:#fff">
              <option [ngValue]="null" disabled>Seleccionar medicamento...</option>
              <option *ngFor="let m of medicamentos" [ngValue]="m.id">
                {{ m.nombre }} — {{ m.presentacion }}
              </option>
            </select>
            <small *ngIf="f['medicamentoId'].invalid && f['medicamentoId'].touched" class="form-error">
              Requerido.
            </small>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div>
              <label class="form-label">Lote *</label>
              <input pInputText formControlName="lote"
                     placeholder="Ej: LOT-2026-001" style="width:100%" />
              <small *ngIf="f['lote'].invalid && f['lote'].touched" class="form-error">
                Requerido.
              </small>
            </div>
            <div>
              <label class="form-label">Cantidad *</label>
              <p-inputnumber formControlName="cantidad" [min]="1" [showButtons]="true"
                             styleClass="w-full" />
              <small *ngIf="f['cantidad'].invalid && f['cantidad'].touched" class="form-error">
                Mínimo 1.
              </small>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div>
              <label class="form-label">Fecha de Vencimiento *</label>
              <input pInputText type="date" formControlName="fechaVencimiento" style="width:100%" />
              <small *ngIf="f['fechaVencimiento'].invalid && f['fechaVencimiento'].touched" class="form-error">
                Requerido.
              </small>
            </div>
            <div>
              <label class="form-label">Precio Unitario (S/) *</label>
              <p-inputnumber formControlName="precioUnitario" [min]="0.01" [minFractionDigits]="2"
                             [maxFractionDigits]="2" styleClass="w-full" />
              <small *ngIf="f['precioUnitario'].invalid && f['precioUnitario'].touched" class="form-error">
                Requerido.
              </small>
            </div>
          </div>

          <div *ngIf="errorDialog"
               style="color:#B91C1C;font-size:0.8rem;padding:6px;background:#FEE2E2;border-radius:4px">
            {{ errorDialog }}
          </div>

          <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:0.5rem">
            <p-button type="button" label="Cancelar" severity="secondary"
                      (onClick)="cerrarDialog()" [disabled]="guardando" />
            <p-button type="submit" label="Registrar" icon="pi pi-check"
                      [loading]="guardando" [disabled]="form.invalid || guardando" />
          </div>
        </form>
      </p-dialog>
    </div>
  `
  /* v8 ignore stop */
})
export class StockListComponent implements OnInit {
  private readonly stockService       = inject(StockService);
  private readonly medicamentoService = inject(MedicamentoService);
  private readonly messageService     = inject(MessageService);
  private readonly fb                 = inject(FormBuilder);
  private readonly cdr                = inject(ChangeDetectorRef);
  private readonly destroyRef         = inject(DestroyRef);

  stock:        Stock[]       = [];
  medicamentos: Medicamento[] = [];
  busqueda      = '';
  cargando      = false;
  errorCarga    = '';
  dialogVisible = false;
  guardando     = false;
  errorDialog   = '';
  readonly UMBRAL_CRITICO = UMBRAL_CRITICO;

  form: FormGroup = this.fb.group({
    medicamentoId:    [null, Validators.required],
    lote:             ['',   Validators.required],
    cantidad:         [1,    [Validators.required, Validators.min(1)]],
    fechaVencimiento: ['',   Validators.required],
    precioUnitario:   [null, [Validators.required, Validators.min(0.01)]]
  });

  get f() { return this.form.controls; }

  get stockFiltrado(): Stock[] {
    if (!this.busqueda.trim()) return this.stock;
    const q = this.busqueda.toLowerCase();
    return this.stock.filter(s =>
      s.nombreMedicamento?.toLowerCase().includes(q) ||
      s.lote?.toLowerCase().includes(q) ||
      s.codigoSismed?.toLowerCase().includes(q)
    );
  }

  ngOnInit(): void {
    this.cargar();
    this.cargarMedicamentos();
  }

  cargar(): void {
    this.cargando = true;
    this.errorCarga = '';
    this.stockService.listarPorAlmacen(ALMACEN_ID)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => { this.stock = data; this.cargando = false; this.cdr.markForCheck(); },
        error: ()  => {
          this.cargando = false;
          this.errorCarga = 'No se pudo cargar el inventario. Verifique que almacen-service esté corriendo (puerto 8083).';
          this.cdr.markForCheck();
        }
      });
  }

  private cargarMedicamentos(): void {
    this.medicamentoService.listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => { this.medicamentos = data; this.cdr.markForCheck(); },
        error: ()  => {}
      });
  }

  abrirDialog(): void {
    this.form.reset({ cantidad: 1 });
    this.errorDialog = '';
    this.dialogVisible = true;
  }

  cerrarDialog(): void {
    this.dialogVisible = false;
    this.form.reset({ cantidad: 1 });
    this.errorDialog = '';
  }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;
    this.errorDialog = '';
    const dto = { ...this.form.value, almacenId: ALMACEN_ID };
    this.stockService.registrarEntrada(dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: nuevoLote => {
          this.stock = [nuevoLote, ...this.stock];
          this.cerrarDialog();
          this.guardando = false;
          this.messageService.add({ severity: 'success', summary: 'Entrada registrada',
                                    detail: `Lote ${nuevoLote.lote} ingresado al inventario.` });
          this.cdr.markForCheck();
        },
        error: () => {
          this.guardando = false;
          this.errorDialog = 'Error al registrar la entrada. Verifique que almacen-service esté en línea.';
          this.cdr.markForCheck();
        }
      });
  }
}
