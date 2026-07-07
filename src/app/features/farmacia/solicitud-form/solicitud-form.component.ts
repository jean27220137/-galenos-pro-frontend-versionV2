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
}

@Component({
  selector: 'app-solicitud-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, PageHeaderComponent],
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
          <p-button type="button" label="Agregar" icon="pi pi-plus"
                    size="small" severity="secondary"
                    (onClick)="agregarDetalle()" />
        </div>

        <div *ngFor="let d of detalles; let i = index"
             style="display:grid;grid-template-columns:1fr 140px 36px;gap:0.75rem;
                    align-items:center;margin-bottom:0.5rem">

          <select [(ngModel)]="d.medicamentoId"
                  [name]="'med_' + i"
                  (change)="marcarCambio()"
                  style="width:100%;padding:8px 10px;border:1px solid #CBD5E1;
                         border-radius:6px;font-size:0.875rem;color:#1E293B;
                         background:#fff;height:38px">
            <option [ngValue]="null" disabled>
              {{ cargandoCatalogo ? 'Cargando...' : 'Seleccionar medicamento...' }}
            </option>
            <option *ngFor="let m of medicamentos" [ngValue]="m.id">
              {{ m.nombre }} ({{ m.codigoSismed }})
            </option>
          </select>

          <input type="number"
                 [(ngModel)]="d.cantidadSolicitada"
                 [name]="'qty_' + i"
                 min="1"
                 placeholder="Cantidad"
                 (input)="marcarCambio()"
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
})
export class SolicitudFormComponent implements OnInit {
  readonly router              = inject(Router);
  private readonly solicitudSvc = inject(SolicitudService);
  private readonly medicSvc    = inject(MedicamentoService);
  private readonly authSvc     = inject(AuthService);
  private readonly cdr         = inject(ChangeDetectorRef);
  private readonly msgSvc      = inject(MessageService);
  private readonly destroyRef  = inject(DestroyRef);

  medicamentos:     Medicamento[] = [];
  detalles:         DetalleItem[] = [{ medicamentoId: null, cantidadSolicitada: 1 }];
  error            = '';
  errorCatalogo    = '';
  cargando         = false;
  cargandoCatalogo = false;
  farmaciaId: number | null = null;

  get puedeEnviar(): boolean {
    return this.medicamentos.length > 0 &&
           this.detalles.every(d => d.medicamentoId !== null && d.cantidadSolicitada >= 1);
  }

  ngOnInit(): void {
    this.farmaciaId = this.authSvc.getSesion()?.farmaciaId ?? null;
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

  marcarCambio(): void { this.cdr.markForCheck(); }

  agregarDetalle(): void {
    this.detalles = [...this.detalles, { medicamentoId: null, cantidadSolicitada: 1 }];
    this.cdr.markForCheck();
  }

  quitarDetalle(i: number): void {
    this.detalles = this.detalles.filter((_, idx) => idx !== i);
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (!this.puedeEnviar) {
      this.error = 'Complete todos los medicamentos y cantidades antes de enviar.';
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
      detalles: this.detalles.map(d => ({
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
          this.error = err?.error?.error ?? 'Error al registrar la solicitud. Verifique que farmacia-service esté en línea.';
          this.cdr.markForCheck();
        }
      });
  }
}
