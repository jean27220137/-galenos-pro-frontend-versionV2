import { Component, OnInit, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SolicitudService } from '../../../core/services/solicitud.service';
import { MedicamentoService } from '../../../core/services/medicamento.service';
import { AuthService } from '../../../core/services/auth.service';
import { Medicamento } from '../../../core/models/medicamento.model';
import { MessageService } from 'primeng/api';

interface DetalleItem {
  medicamentoId: number | null;
  cantidadSolicitada: number;
  duplicado?: boolean;
}

@Component({
  selector: 'app-solicitud-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, PageHeaderComponent],
  /* v8 ignore start */
  template: `
    <div class="p-6">
      <app-page-header title="Nueva Solicitud"
                       subtitle="Registrar solicitud de requerimiento de medicamentos" />

      <div *ngIf="error"
           style="margin-bottom:1rem;color:#B91C1C;background:#FEE2E2;padding:10px 14px;border-radius:6px">
        {{ error }}
      </div>

      <!-- Info -->
      <div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;
                  padding:1.25rem;margin-bottom:1.5rem;font-size:0.85rem">
        <strong>Farmacia ID:</strong> {{ farmaciaId ?? '—' }} &nbsp;|&nbsp;
        <strong>Almacén destino:</strong> Almacén Central (ID: 1)
      </div>

      <!-- Error catálogo -->
      <div *ngIf="errorCatalogo"
           style="margin-bottom:1rem;color:#B91C1C;background:#FEE2E2;padding:10px 14px;border-radius:6px">
        {{ errorCatalogo }}
      </div>

      <!-- Líneas de medicamentos -->
      <div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:1.25rem;margin-bottom:1.5rem">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
          <strong style="color:#1A4F8A;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em">
            Medicamentos solicitados
          </strong>
          <p-button type="button" label="Agregar medicamento" icon="pi pi-plus"
                    size="small" severity="secondary"
                    (onClick)="agregarDetalle()" />
        </div>

        <!-- Cabecera -->
        <div style="display:grid;grid-template-columns:1fr 140px 36px;gap:0.75rem;
                    margin-bottom:0.4rem;padding:0 4px">
          <span style="font-size:0.75rem;color:#64748B;font-weight:600;text-transform:uppercase">Medicamento</span>
          <span style="font-size:0.75rem;color:#64748B;font-weight:600;text-transform:uppercase">Cantidad</span>
          <span></span>
        </div>

        <div *ngFor="let d of detalles; let i = index">
          <div style="display:grid;grid-template-columns:1fr 140px 36px;gap:0.75rem;
                      align-items:center;margin-bottom:0.25rem">

            <select [(ngModel)]="d.medicamentoId"
                    [name]="'med_' + i"
                    (change)="verificarDuplicado(i)"
                    [style.border-color]="d.duplicado ? '#EF4444' : '#CBD5E1'"
                    style="width:100%;padding:8px 10px;border:1px solid;
                           border-radius:6px;font-size:0.875rem;color:#1E293B;
                           background:#fff;height:38px">
              <option [ngValue]="null" disabled>
                {{ cargandoCatalogo ? 'Cargando...' : 'Seleccionar medicamento...' }}
              </option>
              <option *ngFor="let m of medicamentos" [ngValue]="m.id">
                {{ m.nombre }} — {{ m.codigoSismed }} ({{ m.presentacion }})
              </option>
            </select>

            <input type="number"
                   [(ngModel)]="d.cantidadSolicitada"
                   [name]="'qty_' + i"
                   min="1"
                   placeholder="Cantidad"
                   style="width:100%;padding:8px 10px;border:1px solid #CBD5E1;
                          border-radius:6px;font-size:0.875rem;height:38px" />

            <button type="button"
                    (click)="quitarDetalle(i)"
                    [disabled]="detalles.length === 1"
                    style="width:36px;height:36px;border:none;border-radius:6px;cursor:pointer;
                           background:transparent;color:#EF4444;font-size:1rem;
                           display:flex;align-items:center;justify-content:center">
              <i class="pi pi-trash"></i>
            </button>
          </div>

          <!-- Aviso duplicado -->
          <div *ngIf="d.duplicado"
               style="margin-bottom:0.5rem;margin-left:4px;
                      color:#B91C1C;font-size:0.78rem;display:flex;align-items:center;gap:4px">
            <i class="pi pi-exclamation-triangle"></i>
            Este medicamento ya está en la lista. Elimina la línea duplicada.
          </div>
        </div>

        <!-- Resumen -->
        <div *ngIf="detalles.length > 0"
             style="margin-top:1rem;padding-top:1rem;border-top:1px solid #E2E8F0;
                    font-size:0.82rem;color:#64748B">
          <strong>{{ detallesValidos }} medicamento(s)</strong> seleccionado(s) para solicitar
        </div>
      </div>

      <!-- Vista previa -->
      <div *ngIf="detallesValidos > 0"
           style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;
                  padding:1rem;margin-bottom:1.5rem">
        <strong style="color:#1A4F8A;font-size:0.82rem;display:block;margin-bottom:0.5rem">
          Vista previa de la solicitud
        </strong>
        <table style="width:100%;border-collapse:collapse;font-size:0.82rem">
          <thead>
            <tr style="border-bottom:1px solid #BFDBFE">
              <th style="text-align:left;padding:4px 8px;color:#64748B">#</th>
              <th style="text-align:left;padding:4px 8px;color:#64748B">Medicamento</th>
              <th style="text-align:right;padding:4px 8px;color:#64748B">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of detallesParaPreview(); let i = index"
                style="border-bottom:1px solid #E0EFFE">
              <td style="padding:4px 8px;color:#64748B">{{ i + 1 }}</td>
              <td style="padding:4px 8px;color:#1E293B">{{ nombreMedicamento(d.medicamentoId!) }}</td>
              <td style="padding:4px 8px;text-align:right;font-weight:600;color:#1A4F8A">
                {{ d.cantidadSolicitada }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Acciones -->
      <div style="display:flex;gap:0.75rem">
        <p-button type="button" label="Enviar solicitud" icon="pi pi-send"
                  [loading]="cargando"
                  [disabled]="!puedeEnviar || cargando"
                  (onClick)="onSubmit()" />
        <p-button type="button" label="Cancelar" severity="secondary"
                  (onClick)="router.navigate(['/farmacia/solicitudes'])" />
      </div>
    </div>
  `
  /* v8 ignore stop */
})
export class SolicitudFormComponent implements OnInit {
  readonly router               = inject(Router);
  private readonly solicitudSvc = inject(SolicitudService);
  private readonly medicSvc     = inject(MedicamentoService);
  private readonly authSvc      = inject(AuthService);
  private readonly cdr          = inject(ChangeDetectorRef);
  private readonly msgSvc       = inject(MessageService);
  private readonly destroyRef   = inject(DestroyRef);

  medicamentos:     Medicamento[] = [];
  detalles:         DetalleItem[] = [{ medicamentoId: null, cantidadSolicitada: 1 }];
  error            = '';
  errorCatalogo    = '';
  cargando         = false;
  cargandoCatalogo = false;
  farmaciaId: number | null = null;

  get detallesValidos(): number {
    return this.detalles.filter(d => d.medicamentoId !== null && d.cantidadSolicitada >= 1 && !d.duplicado).length;
  }

  get puedeEnviar(): boolean {
    return this.detallesValidos > 0 &&
           this.detalles.every(d => d.medicamentoId !== null && d.cantidadSolicitada >= 1) &&
           !this.detalles.some(d => d.duplicado);
  }

  ngOnInit(): void {
    /* v8 ignore start */
    this.farmaciaId = this.authSvc.getSesion()?.farmaciaId ?? null;
    /* v8 ignore stop */
    this.cargandoCatalogo = true;
    this.medicSvc.listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.medicamentos     = data.filter(m => m.activo === 1);
          this.cargandoCatalogo = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargandoCatalogo = false;
          this.errorCatalogo    = 'No se pudo cargar el catálogo (almacen-service puerto 8083).';
          this.cdr.markForCheck();
        }
      });
  }

  verificarDuplicado(_indice: number): void {
    const ids = this.detalles.map(d => d.medicamentoId);
    this.detalles.forEach(d => {
      d.duplicado = d.medicamentoId !== null &&
                    ids.filter(id => id === d.medicamentoId).length > 1;
    });
    this.cdr.markForCheck();
  }

  nombreMedicamento(id: number): string {
    const m = this.medicamentos.find(x => x.id === id);
    return m ? `${m.nombre} (${m.codigoSismed})` : `ID: ${id}`;
  }

  detallesParaPreview(): DetalleItem[] {
    return this.detalles.filter(d => d.medicamentoId !== null && d.cantidadSolicitada >= 1 && !d.duplicado);
  }

  agregarDetalle(): void {
    this.detalles = [...this.detalles, { medicamentoId: null, cantidadSolicitada: 1 }];
    this.cdr.markForCheck();
  }

  quitarDetalle(i: number): void {
    const removedId = this.detalles[i].medicamentoId;
    this.detalles = this.detalles.filter((_, idx) => idx !== i);
    if (removedId !== null) {
      const restantes = this.detalles.filter(d => d.medicamentoId === removedId);
      if (restantes.length === 1) restantes[0].duplicado = false;
    }
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (!this.puedeEnviar) {
      this.error = 'Corrija los errores antes de enviar.';
      this.cdr.markForCheck();
      return;
    }
    const sesion = this.authSvc.getSesion();
    if (!sesion) return;

    this.cargando = true;
    this.error    = '';

    this.solicitudSvc.crear({
      farmaciaId: sesion.farmaciaId!,
      almacenId:  1,
      detalles: this.detallesParaPreview().map(d => ({
        medicamentoId:      d.medicamentoId!,
        cantidadSolicitada: d.cantidadSolicitada
      }))
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.msgSvc.add({ severity: 'success', summary: 'Enviada', detail: 'Solicitud registrada correctamente.' });
          this.router.navigate(['/farmacia/solicitudes']);
        },
        error: (err) => {
          this.cargando = false;
          /* v8 ignore start */
          this.error = err?.error?.error ?? 'Error al registrar la solicitud.';
          /* v8 ignore stop */
          this.cdr.markForCheck();
        }
      });
  }
}
