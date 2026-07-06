import { Component, OnInit, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { UsuarioService, Usuario, UsuarioRequest } from '../../../core/services/usuario.service';

const ROLES = [
  { label: 'Farmacéutico',  value: 'FARMACEUTICO' },
  { label: 'Jefe Farmacia', value: 'JEFE_FARMACIA' },
  { label: 'Almacenero',    value: 'ALMACENERO' },
  { label: 'Administrador', value: 'ADMIN' },
];

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule,
            InputTextModule, DialogModule, SelectModule,
            InputNumberModule, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <div class="p-6">
      <app-page-header title="Usuarios del sistema" subtitle="Gestión de accesos por rol">
        <p-button label="Nuevo usuario" icon="pi pi-user-plus"
                  (onClick)="abrirCrear()" />
      </app-page-header>


      <!-- Buscador -->
      <div style="margin-bottom:1rem;display:flex;gap:0.75rem;align-items:center">
        <span style="position:relative;flex:1;max-width:360px">
          <i class="pi pi-search"
             style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#64748B"></i>
          <input pInputText type="text"
                 [(ngModel)]="busqueda"
                 placeholder="Buscar por nombre, email o rol..."
                 style="padding-left:2rem;width:100%"
                 aria-label="Buscar usuarios" />
        </span>
        <span style="font-size:0.8rem;color:#64748B">{{ usuariosFiltrados.length }} usuario(s)</span>
      </div>

      <p-table [value]="usuariosFiltrados" [loading]="cargando"
               styleClass="p-datatable-sm hospital-table"
               [paginator]="true" [rows]="15">
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="nombres">Nombres <p-sortIcon field="nombres"/></th>
            <th>Email</th>
            <th>Cargo</th>
            <th>Rol</th>
            <th style="text-align:center">Estado</th>
            <th style="text-align:center">Acciones</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-u>
          <tr>
            <td style="font-weight:500">{{ u.nombres }} {{ u.apellidos }}</td>
            <td style="font-size:0.85rem;color:#64748B">{{ u.email }}</td>
            <td style="font-size:0.85rem">{{ u.cargo || '—' }}</td>
            <td><app-status-badge [estado]="u.rol" /></td>
            <td style="text-align:center">
              <span class="status-badge"
                    [style.color]="u.activo === 1 ? '#15803D' : '#B91C1C'"
                    [style.background]="u.activo === 1 ? '#DCFCE7' : '#FEE2E2'">
                {{ u.activo === 1 ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td style="text-align:center">
              <div style="display:flex;gap:4px;justify-content:center">
                <p-button icon="pi pi-pencil" size="small" [text]="true" severity="secondary"
                          (onClick)="abrirEditar(u)" aria-label="Editar" />
                <p-button icon="pi pi-trash" size="small" [text]="true" severity="danger"
                          (onClick)="confirmarDesactivar(u)"
                          [disabled]="u.activo !== 1"
                          aria-label="Desactivar" />
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="6" style="text-align:center;padding:2.5rem;color:#64748B">
              No hay usuarios registrados.
            </td>
          </tr>
        </ng-template>
      </p-table>

      <!-- Dialog Crear / Editar -->
      <p-dialog [header]="editandoId ? 'Editar Usuario' : 'Nuevo Usuario'"
                [(visible)]="dialogVisible"
                [modal]="true" [style]="{width:'520px'}" [draggable]="false">

        <form [formGroup]="form" (ngSubmit)="guardar()"
              style="display:flex;flex-direction:column;gap:1rem;padding-top:0.5rem">

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div>
              <label class="form-label">Nombres *</label>
              <input pInputText formControlName="nombres" placeholder="Juan" style="width:100%" />
              <small *ngIf="f['nombres'].invalid && f['nombres'].touched" class="form-error">Requerido.</small>
            </div>
            <div>
              <label class="form-label">Apellidos *</label>
              <input pInputText formControlName="apellidos" placeholder="Pérez" style="width:100%" />
              <small *ngIf="f['apellidos'].invalid && f['apellidos'].touched" class="form-error">Requerido.</small>
            </div>
          </div>

          <div>
            <label class="form-label">Email *</label>
            <input pInputText formControlName="email" type="email"
                   placeholder="usuario@hospital.gob.pe" style="width:100%" />
            <small *ngIf="f['email'].invalid && f['email'].touched" class="form-error">Email válido requerido.</small>
          </div>

          <div *ngIf="!editandoId">
            <label class="form-label">Contraseña *</label>
            <input pInputText formControlName="password" type="password"
                   placeholder="Mínimo 8 caracteres" style="width:100%" />
            <small *ngIf="f['password'].invalid && f['password'].touched" class="form-error">Mínimo 8 caracteres.</small>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div>
              <label class="form-label">Rol *</label>
              <p-select formControlName="rol" [options]="roles"
                        optionLabel="label" optionValue="value"
                        placeholder="Seleccionar rol" styleClass="w-full" />
              <small *ngIf="f['rol'].invalid && f['rol'].touched" class="form-error">Requerido.</small>
            </div>
            <div>
              <label class="form-label">Farmacia ID</label>
              <p-inputnumber formControlName="farmaciaId" [min]="1"
                             placeholder="ID farmacia" styleClass="w-full" />
            </div>
          </div>

          <div>
            <label class="form-label">Cargo</label>
            <input pInputText formControlName="cargo" placeholder="Ej: Químico Farmacéutico" style="width:100%" />
          </div>

          <div *ngIf="error" style="color:#B91C1C;font-size:0.8rem;padding:6px;background:#FEE2E2;border-radius:4px">
            {{ error }}
          </div>

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
})
export class UsuariosListComponent implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly messageService = inject(MessageService);
  private readonly fb             = inject(FormBuilder);
  private readonly cdr            = inject(ChangeDetectorRef);
  private readonly destroyRef     = inject(DestroyRef);

  usuarios:   Usuario[] = [];
  busqueda    = '';
  cargando    = false;
  dialogVisible = false;
  guardando   = false;
  error       = '';
  editandoId: number | null = null;

  readonly roles = ROLES;

  form: FormGroup = this.fb.group({
    nombres:    ['', Validators.required],
    apellidos:  ['', Validators.required],
    email:      ['', [Validators.required, Validators.email]],
    password:   ['', [Validators.required, Validators.minLength(8)]],
    rol:        ['', Validators.required],
    cargo:      [''],
    farmaciaId: [null],
  });

  get f() { return this.form.controls; }

  get usuariosFiltrados(): Usuario[] {
    if (!this.busqueda.trim()) return this.usuarios;
    const q = this.busqueda.toLowerCase();
    return this.usuarios.filter(u =>
      u.nombres?.toLowerCase().includes(q) ||
      u.apellidos?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.rol?.toLowerCase().includes(q)
    );
  }

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando = true;
    this.usuarioService.listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => { this.usuarios = data; this.cargando = false; this.cdr.markForCheck(); },
        error: ()  => { this.cargando = false; this.cdr.markForCheck(); }
      });
  }

  abrirCrear(): void {
    this.editandoId = null;
    this.form.reset();
    this.form.get('password')!.setValidators([Validators.required, Validators.minLength(8)]);
    this.form.get('password')!.updateValueAndValidity();
    this.error = '';
    this.dialogVisible = true;
  }

  abrirEditar(u: Usuario): void {
    this.editandoId = u.id;
    this.form.patchValue({ nombres: u.nombres, apellidos: u.apellidos,
                           email: u.email, rol: u.rol, cargo: u.cargo, farmaciaId: u.farmaciaId });
    this.form.get('password')!.clearValidators();
    this.form.get('password')!.updateValueAndValidity();
    this.error = '';
    this.dialogVisible = true;
  }

  cerrarDialog(): void {
    this.dialogVisible = false;
    this.editandoId = null;
    this.error = '';
  }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;
    this.error = '';

    const dto: UsuarioRequest = {
      nombres:    this.form.value.nombres,
      apellidos:  this.form.value.apellidos,
      email:      this.form.value.email,
      rol:        this.form.value.rol,
      cargo:      this.form.value.cargo || '',
      farmaciaId: this.form.value.farmaciaId ?? null,
    };
    if (!this.editandoId) dto.password = this.form.value.password;

    const op$ = this.editandoId
      ? this.usuarioService.actualizar(this.editandoId, dto)
      : this.usuarioService.crear(dto);

    op$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          if (this.editandoId) {
            this.usuarios = this.usuarios.map(u => u.id === this.editandoId! ? result : u);
            this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Usuario actualizado correctamente.' });
          } else {
            this.usuarios = [result, ...this.usuarios];
            this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Usuario registrado correctamente.' });
          }
          this.guardando = false;
          this.cerrarDialog();
          this.cdr.markForCheck();
        },
        error: () => {
          this.guardando = false;
          this.error = this.editandoId
            ? 'Error al actualizar el usuario.'
            : 'Error al crear el usuario. El email puede estar en uso.';
          this.cdr.markForCheck();
        }
      });
  }

  confirmarDesactivar(u: Usuario): void {
    if (!window.confirm(`¿Desactivar a ${u.nombres} ${u.apellidos}?\nEl usuario perderá acceso al sistema.`)) return;
    this.desactivar(u);
  }

  private desactivar(u: Usuario): void {
    this.usuarioService.desactivar(u.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.usuarios = this.usuarios.map(x => x.id === u.id ? { ...x, activo: 0 } : x);
          this.messageService.add({ severity: 'warn', summary: 'Desactivado', detail: `${u.nombres} fue desactivado.` });
          this.cdr.markForCheck();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo desactivar el usuario.' });
          this.cdr.markForCheck();
        }
      });
  }
}
