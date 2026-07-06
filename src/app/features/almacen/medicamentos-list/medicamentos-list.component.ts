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
import { MedicamentoService } from '../../../core/services/medicamento.service';
import { Medicamento } from '../../../core/models/medicamento.model';

@Component({
  selector: 'app-medicamentos-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule,
            InputTextModule, DialogModule, InputNumberModule, PageHeaderComponent],
  template: `
    <div class="p-6">
      <app-page-header title="Catálogo de Medicamentos" subtitle="Medicamentos registrados en el sistema SISMED">
        <p-button label="Nuevo medicamento" icon="pi pi-plus"
                  (onClick)="abrirDialog()" />
      </app-page-header>


      <!-- Error de carga -->
      <div *ngIf="errorCarga" class="page-error" style="margin-bottom:1rem">
        <i class="pi pi-server"></i>
        <strong>{{ errorCarga }}</strong>
        <p>El catálogo se cargará automáticamente cuando el servicio esté disponible.</p>
      </div>

      <!-- Buscador -->
      <div style="margin-bottom:1rem;display:flex;gap:0.75rem;align-items:center">
        <span style="position:relative;flex:1;max-width:380px">
          <i class="pi pi-search"
             style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#64748B"></i>
          <input pInputText type="text"
                 [(ngModel)]="busqueda"
                 placeholder="Buscar por nombre o código SISMED..."
                 style="padding-left:2rem;width:100%"
                 aria-label="Buscar medicamento" />
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
            <td style="font-family:monospace;font-size:0.8rem;font-weight:600">{{ m.codigoSismed }}</td>
            <td style="font-weight:500">{{ m.nombre }}</td>
            <td style="font-size:0.85rem">{{ m.presentacion }}</td>
            <td style="font-size:0.85rem">{{ m.concentracion }}</td>
            <td style="font-size:0.85rem">{{ m.viaAdministracion }}</td>
            <td style="text-align:center">{{ m.stockMinimo }}</td>
            <td style="text-align:center">
              <span class="status-badge"
                    [style.color]="m.activo === 1 ? '#15803D' : '#B91C1C'"
                    [style.background]="m.activo === 1 ? '#DCFCE7' : '#FEE2E2'">
                {{ m.activo === 1 ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" style="text-align:center;padding:2.5rem;color:#64748B">
              No hay medicamentos registrados.
            </td>
          </tr>
        </ng-template>
      </p-table>

      <!-- Dialog: Nuevo medicamento -->
      <p-dialog header="Nuevo Medicamento" [(visible)]="dialogVisible"
                [modal]="true" [style]="{width:'520px'}" [draggable]="false">

        <form [formGroup]="form" (ngSubmit)="guardar()" style="display:flex;flex-direction:column;gap:1rem;padding-top:0.5rem">

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div>
              <label class="form-label">Código SISMED *</label>
              <input pInputText formControlName="codigoSismed" placeholder="Ej: M001234" style="width:100%" />
              <small *ngIf="f['codigoSismed'].invalid && f['codigoSismed'].touched" class="form-error">
                Requerido.
              </small>
            </div>
            <div>
              <label class="form-label">Stock Mínimo *</label>
              <p-inputnumber formControlName="stockMinimo" [min]="0" [showButtons]="true" styleClass="w-full" />
            </div>
          </div>

          <div>
            <label class="form-label">Nombre del medicamento *</label>
            <input pInputText formControlName="nombre" placeholder="Ej: Amoxicilina" style="width:100%" />
            <small *ngIf="f['nombre'].invalid && f['nombre'].touched" class="form-error">
              Requerido.
            </small>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div>
              <label class="form-label">Presentación *</label>
              <input pInputText formControlName="presentacion" placeholder="Ej: Cápsula 500mg" style="width:100%" />
              <small *ngIf="f['presentacion'].invalid && f['presentacion'].touched" class="form-error">
                Requerido.
              </small>
            </div>
            <div>
              <label class="form-label">Concentración *</label>
              <input pInputText formControlName="concentracion" placeholder="Ej: 500mg" style="width:100%" />
              <small *ngIf="f['concentracion'].invalid && f['concentracion'].touched" class="form-error">
                Requerido.
              </small>
            </div>
          </div>

          <div>
            <label class="form-label">Vía de administración *</label>
            <input pInputText formControlName="viaAdministracion" placeholder="Ej: Oral" style="width:100%" />
            <small *ngIf="f['viaAdministracion'].invalid && f['viaAdministracion'].touched" class="form-error">
              Requerido.
            </small>
          </div>

          <div *ngIf="error" style="color:#B91C1C;font-size:0.8rem;padding:6px;background:#FEE2E2;border-radius:4px">
            {{ error }}
          </div>

          <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:0.5rem">
            <p-button type="button" label="Cancelar" severity="secondary"
                      (onClick)="cerrarDialog()" [disabled]="guardando" />
            <p-button type="submit" label="Guardar" icon="pi pi-check"
                      [loading]="guardando" [disabled]="form.invalid || guardando" />
          </div>
        </form>
      </p-dialog>
    </div>
  `
})
export class MedicamentosListComponent implements OnInit {
  private readonly medicamentoService = inject(MedicamentoService);
  private readonly messageService     = inject(MessageService);
  private readonly fb                 = inject(FormBuilder);
  private readonly cdr                = inject(ChangeDetectorRef);
  private readonly destroyRef         = inject(DestroyRef);

  medicamentos: Medicamento[] = [];
  busqueda     = '';
  cargando     = false;
  dialogVisible = false;
  guardando    = false;
  error        = '';

  form: FormGroup = this.fb.group({
    codigoSismed:       ['', Validators.required],
    nombre:             ['', Validators.required],
    presentacion:       ['', Validators.required],
    concentracion:      ['', Validators.required],
    viaAdministracion:  ['', Validators.required],
    stockMinimo:        [10, [Validators.required, Validators.min(0)]]
  });

  get f() { return this.form.controls; }

  get filtrados(): Medicamento[] {
    if (!this.busqueda.trim()) return this.medicamentos;
    const q = this.busqueda.toLowerCase();
    return this.medicamentos.filter(m =>
      m.nombre?.toLowerCase().includes(q) ||
      m.codigoSismed?.toLowerCase().includes(q)
    );
  }

  ngOnInit(): void { this.cargar(); }

  errorCarga = '';

  cargar(): void {
    this.cargando = true;
    this.errorCarga = '';
    this.medicamentoService.listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => { this.medicamentos = data; this.cargando = false; this.cdr.markForCheck(); },
        error: ()  => {
          this.cargando = false;
          this.errorCarga = 'No se pudo cargar el catálogo. Verifique que almacen-service esté corriendo (puerto 8083).';
          this.cdr.markForCheck();
        }
      });
  }

  abrirDialog(): void {
    this.form.reset({ stockMinimo: 10 });
    this.error = '';
    this.dialogVisible = true;
  }

  cerrarDialog(): void {
    this.dialogVisible = false;
    this.form.reset({ stockMinimo: 10 });
    this.error = '';
  }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;
    this.error = '';
    this.medicamentoService.crear(this.form.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: nuevo => {
          this.medicamentos = [nuevo, ...this.medicamentos];
          this.cerrarDialog();
          this.guardando = false;
          this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Medicamento registrado correctamente.' });
          this.cdr.markForCheck();
        },
        error: () => {
          this.guardando = false;
          this.error = 'Error al registrar el medicamento. Verifique que el código SISMED no exista.';
          this.cdr.markForCheck();
        }
      });
  }
}
