import { Component, OnInit, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { FarmaciaService } from '../../../core/services/farmacia.service';
import { UsuarioService, Usuario } from '../../../core/services/usuario.service';
import { Farmacia, FarmaciaRequest } from '../../../core/models/farmacia.model';
import { forkJoin } from 'rxjs';

const TIPOS_FARMACIA = [
  { label: 'Consulta Externa',  value: 'CONSULTA_EXTERNA' },
  { label: 'Emergencias',       value: 'EMERGENCIA' },
  { label: 'Hospitalización',   value: 'HOSPITALIZACION' },
  { label: 'UCI',               value: 'UCI' },
  { label: 'UCI Neonatal',      value: 'UCI_NEONATAL' },
  { label: 'Oncología',         value: 'ONCOLOGIA' },
  { label: 'Cirugía',           value: 'CIRUGIA' },
  { label: 'Pediatría',         value: 'PEDIATRIA' },
  { label: 'Otro',              value: 'OTRO' },
];

@Component({
  selector: 'app-farmacias-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule,
            InputTextModule, DialogModule, SelectModule, PageHeaderComponent],
  /* v8 ignore start */
  template: `
    <div class="p-6">
      <app-page-header title="Gestión de Farmacias"
                       subtitle="Farmacias del Hospital Nacional Sergio E. Bernales">
        <p-button label="Nueva farmacia" icon="pi pi-plus"
                  (onClick)="abrirCrear()" />
      </app-page-header>

      <!-- Buscador -->
      <div style="margin-bottom:1rem;display:flex;gap:0.75rem;align-items:center">
        <span style="position:relative;flex:1;max-width:400px">
          <i class="pi pi-search"
             style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#64748B"></i>
          <input pInputText type="text" [(ngModel)]="busqueda"
                 placeholder="Buscar por nombre, código o departamento..."
                 style="padding-left:2rem;width:100%" />
        </span>
        <span style="font-size:0.8rem;color:#64748B">{{ farmaciasFiltradas.length }} farmacia(s)</span>
      </div>

      <!-- Error -->
      <div *ngIf="error"
           style="margin-bottom:1rem;color:#B91C1C;background:#FEE2E2;padding:10px 14px;border-radius:6px">
        {{ error }}
      </div>

      <p-table [value]="farmaciasFiltradas" [loading]="cargando"
               styleClass="p-datatable-sm hospital-table"
               [paginator]="true" [rows]="10"
               [rowsPerPageOptions]="[10, 25, 50]">
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="codigo">Código <p-sortIcon field="codigo"/></th>
            <th pSortableColumn="nombre">Nombre <p-sortIcon field="nombre"/></th>
            <th>Tipo</th>
            <th>Departamento / Ubicación</th>
            <th>Jefe de Farmacia</th>
            <th>Teléfono</th>
            <th style="text-align:center">Estado</th>
            <th style="text-align:center">Acciones</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-f>
          <tr [style.opacity]="f.activo === 0 ? '0.55' : '1'">
            <td style="font-family:monospace;font-weight:600;color:#1A4F8A">{{ f.codigo }}</td>
            <td style="font-weight:500">{{ f.nombre }}</td>
            <td>
              <span [style.background]="tipoBg(f.tipo)"
                    style="padding:2px 10px;border-radius:9999px;font-size:0.75rem;
                           font-weight:600;color:#1A4F8A;display:inline-block">
                {{ tipoLabel(f.tipo) }}
              </span>
            </td>
            <td>
              <div style="font-size:0.85rem;font-weight:500">{{ f.departamento || '—' }}</div>
              <div *ngIf="f.ubicacion" style="font-size:0.78rem;color:#64748B">{{ f.ubicacion }}</div>
            </td>
            <td>
              <div *ngIf="f.jefeNombre; else sinJefe" style="font-size:0.85rem">
                <i class="pi pi-user" style="color:#1A4F8A;margin-right:4px;font-size:0.75rem"></i>
                {{ f.jefeNombre }}
              </div>
              <ng-template #sinJefe>
                <span style="color:#94A3B8;font-size:0.82rem">Sin asignar</span>
              </ng-template>
            </td>
            <td style="font-size:0.85rem;color:#475569">{{ f.telefono || '—' }}</td>
            <td style="text-align:center">
              <span [style.color]="f.activo === 1 ? '#15803D' : '#B91C1C'"
                    [style.background]="f.activo === 1 ? '#DCFCE7' : '#FEE2E2'"
                    style="padding:2px 10px;border-radius:9999px;font-size:0.75rem;font-weight:600">
                {{ f.activo === 1 ? 'Activa' : 'Inactiva' }}
              </span>
            </td>
            <td style="text-align:center">
              <div style="display:flex;gap:4px;justify-content:center">
                <p-button icon="pi pi-pencil" size="small" [text]="true" severity="secondary"
                          (onClick)="abrirEditar(f)" pTooltip="Editar" />
                <p-button *ngIf="f.activo === 1"
                          icon="pi pi-ban" size="small" [text]="true" severity="danger"
                          (onClick)="confirmarDesactivar(f)" pTooltip="Desactivar" />
                <p-button *ngIf="f.activo === 0"
                          icon="pi pi-check-circle" size="small" [text]="true" severity="success"
                          (onClick)="confirmarActivar(f)" pTooltip="Activar" />
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="8" style="text-align:center;padding:2.5rem;color:#64748B">
              <i class="pi pi-building" style="font-size:1.5rem;display:block;margin-bottom:0.5rem"></i>
              No hay farmacias registradas.
            </td>
          </tr>
        </ng-template>
      </p-table>

      <!-- Dialog Crear / Editar -->
      <p-dialog [header]="editandoId ? 'Editar Farmacia' : 'Nueva Farmacia'"
                [(visible)]="dialogVisible"
                [modal]="true" [style]="{width:'620px'}" [draggable]="false">

        <form [formGroup]="form" (ngSubmit)="guardar()"
              style="display:flex;flex-direction:column;gap:1rem;padding-top:0.5rem">

          <!-- Fila 1: Código + Nombre -->
          <div style="display:grid;grid-template-columns:140px 1fr;gap:1rem">
            <div>
              <label class="form-label">Código *</label>
              <input pInputText formControlName="codigo"
                     placeholder="FAR-008" style="width:100%;font-family:monospace"
                     [readOnly]="!!editandoId" />
              <small *ngIf="f['codigo'].invalid && f['codigo'].touched" class="form-error">
                Formato FAR-XXX requerido.
              </small>
            </div>
            <div>
              <label class="form-label">Nombre *</label>
              <input pInputText formControlName="nombre"
                     placeholder="Farmacia de ..." style="width:100%" />
              <small *ngIf="f['nombre'].invalid && f['nombre'].touched" class="form-error">Requerido.</small>
            </div>
          </div>

          <!-- Fila 2: Tipo -->
          <div>
            <label class="form-label">Tipo de Farmacia *</label>
            <p-select formControlName="tipo" [options]="tipos"
                      optionLabel="label" optionValue="value"
                      placeholder="Seleccionar tipo" styleClass="w-full" />
            <small *ngIf="f['tipo'].invalid && f['tipo'].touched" class="form-error">Requerido.</small>
          </div>

          <!-- Fila 3: Departamento + Área -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div>
              <label class="form-label">Departamento</label>
              <input pInputText formControlName="departamento"
                     placeholder="Ej: Emergencias" style="width:100%" />
            </div>
            <div>
              <label class="form-label">Área / Servicio</label>
              <input pInputText formControlName="area"
                     placeholder="Ej: Emergencias — Planta Baja" style="width:100%" />
            </div>
          </div>

          <!-- Fila 4: Ubicación -->
          <div>
            <label class="form-label">Ubicación física</label>
            <input pInputText formControlName="ubicacion"
                   placeholder="Ej: Planta Baja, Ingreso Norte — Pabellón A" style="width:100%" />
          </div>

          <!-- Fila 5: Jefe de Farmacia -->
          <div>
            <label class="form-label">Jefe de Farmacia</label>
            <p-select formControlName="jefeId"
                      [options]="jefesOpciones"
                      optionLabel="label" optionValue="value"
                      placeholder="Seleccionar jefe (opcional)"
                      [showClear]="true"
                      (onChange)="onJefeSeleccionado($event)"
                      styleClass="w-full" />
            <small style="color:#64748B;font-size:0.75rem">
              Solo usuarios con rol JEFE_FARMACIA
            </small>
          </div>

          <!-- Fila 6: Teléfono -->
          <div>
            <label class="form-label">Teléfono</label>
            <input pInputText formControlName="telefono"
                   placeholder="Ej: 5190000 anexo 201" style="width:100%" />
          </div>

          <!-- Error -->
          <div *ngIf="errorDialog"
               style="color:#B91C1C;font-size:0.8rem;padding:6px;background:#FEE2E2;border-radius:4px">
            {{ errorDialog }}
          </div>

          <!-- Acciones -->
          <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:0.5rem">
            <p-button type="button" label="Cancelar" severity="secondary"
                      (onClick)="cerrarDialog()" [disabled]="guardando" />
            <p-button type="submit" [label]="editandoId ? 'Actualizar' : 'Crear'"
                      icon="pi pi-check"
                      [loading]="guardando" [disabled]="form.invalid || guardando" />
          </div>
        </form>
      </p-dialog>
    </div>
  `
  /* v8 ignore stop */
})
export class FarmaciasListComponent implements OnInit {
  private readonly farmaciaSvc  = inject(FarmaciaService);
  private readonly usuarioSvc   = inject(UsuarioService);
  private readonly msgSvc       = inject(MessageService);
  private readonly fb           = inject(FormBuilder);
  private readonly cdr          = inject(ChangeDetectorRef);
  private readonly destroyRef   = inject(DestroyRef);

  farmacias:     Farmacia[] = [];
  jefes:         Usuario[]  = [];
  jefesOpciones: { label: string; value: number }[] = [];
  busqueda       = '';
  cargando       = false;
  dialogVisible  = false;
  guardando      = false;
  error          = '';
  errorDialog    = '';
  editandoId: number | null = null;

  readonly tipos = TIPOS_FARMACIA;

  form: FormGroup = this.fb.group({
    codigo:       ['', [Validators.required, Validators.pattern(/^FAR-\d{3}$/)]],
    nombre:       ['', Validators.required],
    tipo:         ['', Validators.required],
    departamento: [''],
    area:         [''],
    ubicacion:    [''],
    jefeId:       [null],
    jefeNombre:   [''],
    telefono:     [''],
  });

  get f() { return this.form.controls; }

  get farmaciasFiltradas(): Farmacia[] {
    if (!this.busqueda.trim()) return this.farmacias;
    const q = this.busqueda.toLowerCase();
    return this.farmacias.filter(f =>
      f.codigo?.toLowerCase().includes(q) ||
      f.nombre?.toLowerCase().includes(q) ||
      f.departamento?.toLowerCase().includes(q) ||
      f.tipo?.toLowerCase().includes(q)
    );
  }

  ngOnInit(): void {
    this.cargando = true;
    forkJoin({
      farmacias: this.farmaciaSvc.listarTodas(),
      usuarios:  this.usuarioSvc.listar()
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ farmacias, usuarios }) => {
          this.farmacias = farmacias;
          this.jefes     = usuarios.filter(u => u.rol === 'JEFE_FARMACIA' && u.activo === 1);
          this.jefesOpciones = this.jefes.map(u => ({
            label: `${u.nombres} ${u.apellidos}`,
            value: u.id
          }));
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargando = false;
          this.error = 'No se pudo cargar la información.';
          this.cdr.markForCheck();
        }
      });
  }

  tipoLabel(tipo: string): string {
    return TIPOS_FARMACIA.find(t => t.value === tipo)?.label ?? tipo;
  }

  tipoBg(tipo: string): string {
    const map: Record<string, string> = {
      EMERGENCIA:      '#FEF3C7',
      UCI:             '#FEE2E2',
      UCI_NEONATAL:    '#FEE2E2',
      ONCOLOGIA:       '#F3E8FF',
      CIRUGIA:         '#E0F2FE',
      PEDIATRIA:       '#DCFCE7',
      HOSPITALIZACION: '#EFF6FF',
      CONSULTA_EXTERNA:'#EFF6FF',
    };
    return map[tipo] ?? '#F1F5F9';
  }

  onJefeSeleccionado(event: { value: number | null }): void {
    if (event.value === null || event.value === undefined) {
      this.form.patchValue({ jefeNombre: '' });
      return;
    }
    const jefe = this.jefes.find(u => u.id === event.value);
    if (jefe) {
      this.form.patchValue({ jefeNombre: `${jefe.nombres} ${jefe.apellidos}` });
    }
  }

  abrirCrear(): void {
    this.editandoId   = null;
    this.errorDialog  = '';
    this.form.reset();
    this.form.get('codigo')!.enable();
    this.dialogVisible = true;
  }

  abrirEditar(f: Farmacia): void {
    this.editandoId  = f.id;
    this.errorDialog = '';
    this.form.patchValue({
      codigo:       f.codigo,
      nombre:       f.nombre,
      tipo:         f.tipo,
      departamento: f.departamento,
      area:         f.area,
      ubicacion:    f.ubicacion,
      jefeId:       f.jefeId,
      jefeNombre:   f.jefeNombre,
      telefono:     f.telefono,
    });
    this.form.get('codigo')!.disable();
    this.dialogVisible = true;
  }

  cerrarDialog(): void {
    this.dialogVisible = false;
    this.editandoId    = null;
    this.errorDialog   = '';
    this.form.get('codigo')!.enable();
  }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando   = true;
    this.errorDialog = '';

    const v = this.form.getRawValue();
    const dto: FarmaciaRequest = {
      codigo:       v.codigo,
      nombre:       v.nombre,
      tipo:         v.tipo,
      departamento: v.departamento || '',
      area:         v.area         || '',
      ubicacion:    v.ubicacion    || '',
      jefeId:       v.jefeId       ?? null,
      jefeNombre:   v.jefeNombre   || '',
      telefono:     v.telefono     || '',
    };

    const op$ = this.editandoId
      ? this.farmaciaSvc.actualizar(this.editandoId, dto)
      : this.farmaciaSvc.crear(dto);

    op$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          if (this.editandoId) {
            this.farmacias = this.farmacias.map(f => f.id === this.editandoId! ? result : f);
            this.msgSvc.add({ severity: 'success', summary: 'Actualizada', detail: result.nombre });
          } else {
            this.farmacias = [result, ...this.farmacias];
            this.msgSvc.add({ severity: 'success', summary: 'Creada', detail: result.nombre });
          }
          this.guardando = false;
          this.cerrarDialog();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.guardando   = false;
          /* v8 ignore start */
          this.errorDialog = err?.error?.error ?? 'Error al guardar la farmacia.';
          /* v8 ignore stop */
          this.cdr.markForCheck();
        }
      });
  }

  confirmarDesactivar(f: Farmacia): void {
    if (!window.confirm(`¿Desactivar "${f.nombre}"?\nLos usuarios asignados no podrán operar.`)) return;
    this.farmaciaSvc.desactivar(f.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.farmacias = this.farmacias.map(x => x.id === f.id ? { ...x, activo: 0 } : x);
          this.msgSvc.add({ severity: 'warn', summary: 'Desactivada', detail: f.nombre });
          this.cdr.markForCheck();
        },
        error: () => {
          this.msgSvc.add({ severity: 'error', summary: 'Error', detail: 'No se pudo desactivar.' });
          this.cdr.markForCheck();
        }
      });
  }

  confirmarActivar(f: Farmacia): void {
    if (!window.confirm(`¿Reactivar "${f.nombre}"?`)) return;
    this.farmaciaSvc.activar(f.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.farmacias = this.farmacias.map(x => x.id === f.id ? { ...x, activo: 1 } : x);
          this.msgSvc.add({ severity: 'success', summary: 'Activada', detail: f.nombre });
          this.cdr.markForCheck();
        },
        error: () => {
          this.msgSvc.add({ severity: 'error', summary: 'Error', detail: 'No se pudo activar.' });
          this.cdr.markForCheck();
        }
      });
  }
}
