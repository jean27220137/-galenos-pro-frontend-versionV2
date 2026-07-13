import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { AlmacenDashboardService } from '../../../core/services/almacen-dashboard.service';
import { ProximoVencerItem, SolicitudPendienteItem, StockCriticoItem } from '../../../core/models/dashboard.models';
import { Stock } from '../../../core/models/stock.model';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-almacen-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, CardModule, TableModule, TagModule, ButtonModule],
  /* v8 ignore start */
  template: `
    <div class="gp-fade-in">

      <!-- ── Banner header estilo v1 ──────────────────────────────────── -->
      <div class="dash-banner">
        <div class="dash-banner__inner">
          <div>
            <h1 class="dash-banner__title">
              <i class="pi pi-building" style="margin-right:0.5rem;opacity:0.85"></i>
              Almacén Especializado — Dashboard
            </h1>
            <p class="dash-banner__sub">Hospital Nacional Sergio E. Bernales · Comas, Lima</p>
          </div>
          <div class="dash-banner__chips">
            <span class="dash-banner__chip">
              <i class="pi pi-calendar"></i>
              {{ hoy | date:'dd/MM/yyyy' }}
            </span>
            <span class="dash-banner__chip dash-banner__chip--alert"
                  *ngIf="totalAlertas > 0">
              <i class="pi pi-bell"></i>
              {{ totalAlertas }} alerta(s) activa(s)
            </span>
          </div>
        </div>
      </div>

      <div class="p-6" style="display:flex;flex-direction:column;gap:1.25rem">

        <!-- ── Fila 1: KPIs principales ────────────────────────────────── -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem">

          <div class="kpi-card kpi-card--blue">
            <div class="kpi-icon" style="background:#E8F2FF">
              <i class="pi pi-list" style="color:#2378f0"></i>
            </div>
            <div>
              <div class="kpi-value">{{ totalMedicamentos }}</div>
              <div class="kpi-label">Total Medicamentos</div>
            </div>
          </div>

          <div class="kpi-card kpi-card--red">
            <div class="kpi-icon" style="background:#FEE2E2">
              <i class="pi pi-times-circle" style="color:#ef4444"></i>
            </div>
            <div>
              <div class="kpi-value" style="color:#ef4444">{{ sinStock }}</div>
              <div class="kpi-label">Sin Stock</div>
            </div>
          </div>

          <div class="kpi-card kpi-card--orange">
            <div class="kpi-icon" style="background:#FEF3C7">
              <i class="pi pi-exclamation-triangle" style="color:#D97706"></i>
            </div>
            <div>
              <div class="kpi-value" style="color:#D97706">{{ stockCritico.length }}</div>
              <div class="kpi-label">Stock Crítico</div>
            </div>
          </div>

          <div class="kpi-card kpi-card--teal">
            <div class="kpi-icon" style="background:#E0F9FC">
              <i class="pi pi-inbox" style="color:#00bcd4"></i>
            </div>
            <div>
              <div class="kpi-value" style="color:#00bcd4">{{ solicitudesPendientes.length }}</div>
              <div class="kpi-label">Solicitudes Pendientes</div>
            </div>
          </div>

        </div>

        <!-- ── Fila 2: KPIs de vencimientos ─────────────────────────────── -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem">

          <div class="kpi-card kpi-card--red">
            <div class="kpi-icon" style="background:#FEE2E2">
              <i class="pi pi-calendar-times" style="color:#ef4444"></i>
            </div>
            <div>
              <div class="kpi-value" style="color:#ef4444">{{ proximos30 }}</div>
              <div class="kpi-label">Vencen ≤ 30 días</div>
            </div>
          </div>

          <div class="kpi-card kpi-card--orange">
            <div class="kpi-icon" style="background:#FEF3C7">
              <i class="pi pi-calendar" style="color:#D97706"></i>
            </div>
            <div>
              <div class="kpi-value" style="color:#D97706">{{ proximos31_90 }}</div>
              <div class="kpi-label">Vencen 31–90 días</div>
            </div>
          </div>

          <div class="kpi-card kpi-card--purple">
            <div class="kpi-icon" style="background:#EDE9FE">
              <i class="pi pi-ban" style="color:#7C3AED"></i>
            </div>
            <div>
              <div class="kpi-value" style="color:#7C3AED">{{ vencidos.length }}</div>
              <div class="kpi-label">Lotes Vencidos</div>
            </div>
          </div>

          <div class="kpi-card kpi-card--green">
            <div class="kpi-icon" style="background:#DCFCE7">
              <i class="pi pi-check-circle" style="color:#15803D"></i>
            </div>
            <div>
              <div class="kpi-value" style="color:#15803D">{{ totalAlertas }}</div>
              <div class="kpi-label">Total Alertas Activas</div>
            </div>
          </div>

        </div>

        <!-- ── Gráficos ──────────────────────────────────────────────────── -->
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:1rem"
             *ngIf="stockCritico.length > 0 || proximosVencer.length > 0">

          <div class="chart-card">
            <div class="chart-card__header">
              <i class="pi pi-chart-bar" style="color:#2378f0"></i>
              <span>Stock crítico — Top 8 (cantidad actual)</span>
            </div>
            <div style="height:230px;position:relative">
              <canvas #stockCanvas></canvas>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-card__header">
              <i class="pi pi-chart-pie" style="color:#00bcd4"></i>
              <span>Distribución de vencimientos (90 días)</span>
            </div>
            <div style="height:230px;position:relative">
              <canvas #vencerCanvas></canvas>
            </div>
          </div>

        </div>

        <!-- ── Tabla: Stock Crítico ──────────────────────────────────────── -->
        <p-card styleClass="hospital-card">
          <ng-template pTemplate="header">
            <div class="card-section-header">
              <i class="pi pi-exclamation-triangle" style="color:#D97706"></i>
              <span>Stock Crítico</span>
              <span class="count-badge count-badge--orange">{{ stockCritico.length }}</span>
              <p-button label="Ver inventario" icon="pi pi-arrow-right" iconPos="right"
                        size="small" [text]="true" styleClass="ml-auto"
                        (onClick)="router.navigate(['/almacen/stock'])" />
            </div>
          </ng-template>

          <p-table [value]="stockCritico" [loading]="loading.stock"
                   styleClass="p-datatable-sm hospital-table" [rowHover]="true"
                   [paginator]="stockCritico.length > 8" [rows]="8">
            <ng-template pTemplate="header">
              <tr>
                <th>Medicamento</th>
                <th>Cód. SISMED</th>
                <th>Presentación</th>
                <th style="text-align:center">Cantidad</th>
                <th style="text-align:center">Mínimo</th>
                <th style="text-align:center">Estado</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-item>
              <tr [style.background]="item.cantidadActual === 0 ? '#FEF2F2' : '#FFFBEB'">
                <td style="font-weight:500">{{ item.medicamentoNombre }}</td>
                <td style="font-family:monospace;font-size:0.8rem">{{ item.codigoSismed }}</td>
                <td style="font-size:0.85rem">{{ item.presentacion }}</td>
                <td style="text-align:center;font-weight:700"
                    [style.color]="item.cantidadActual === 0 ? '#ef4444' : '#D97706'">
                  {{ item.cantidadActual }}
                </td>
                <td style="text-align:center">{{ item.stockMinimo }}</td>
                <td style="text-align:center">
                  <span *ngIf="item.cantidadActual === 0"
                        class="status-badge" style="color:#B91C1C;background:#FEE2E2">Sin Stock</span>
                  <span *ngIf="item.cantidadActual > 0 && item.cantidadActual < item.stockMinimo / 2"
                        class="status-badge" style="color:#B91C1C;background:#FEE2E2">Crítico</span>
                  <span *ngIf="item.cantidadActual >= item.stockMinimo / 2 && item.cantidadActual <= item.stockMinimo"
                        class="status-badge" style="color:#D97706;background:#FEF3C7">Bajo</span>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="6" style="text-align:center;padding:2rem;color:#64748B">
                  <i class="pi pi-check-circle" style="color:#15803D;margin-right:6px"></i>
                  Sin medicamentos en stock crítico.
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>

        <!-- ── Tabla: Próximos a Vencer ──────────────────────────────────── -->
        <p-card styleClass="hospital-card">
          <ng-template pTemplate="header">
            <div class="card-section-header">
              <i class="pi pi-calendar-times" style="color:#f59e0b"></i>
              <span>Próximos a Vencer (90 días)</span>
              <span class="count-badge count-badge--orange">{{ proximosVencer.length }}</span>
            </div>
          </ng-template>

          <p-table [value]="proximosVencer" [loading]="loading.vencer"
                   styleClass="p-datatable-sm hospital-table" [rowHover]="true"
                   [paginator]="proximosVencer.length > 8" [rows]="8">
            <ng-template pTemplate="header">
              <tr>
                <th>Medicamento</th>
                <th>Cód. SISMED</th>
                <th>Lote</th>
                <th style="text-align:center">Vence</th>
                <th style="text-align:center">Días rest.</th>
                <th style="text-align:center">Cantidad</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-item>
              <tr>
                <td style="font-weight:500">{{ item.medicamentoNombre }}</td>
                <td style="font-family:monospace;font-size:0.8rem">{{ item.codigoSismed }}</td>
                <td style="font-family:monospace;font-size:0.8rem">{{ item.lote }}</td>
                <td style="text-align:center">{{ item.fechaVencimiento | date:'dd/MM/yyyy' }}</td>
                <td style="text-align:center">
                  <span class="status-badge"
                        [style.color]="diasColor(item.diasRestantes)"
                        [style.background]="diasBg(item.diasRestantes)">
                    {{ item.diasRestantes }}d
                  </span>
                </td>
                <td style="text-align:center;font-weight:600">{{ item.cantidad }}</td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="6" style="text-align:center;padding:2rem;color:#64748B">
                  <i class="pi pi-check-circle" style="color:#15803D;margin-right:6px"></i>
                  Sin lotes próximos a vencer en los próximos 90 días.
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>

        <!-- ── Tabla: Vencidos ──────────────────────────────────────────── -->
        <p-card styleClass="hospital-card" *ngIf="vencidos.length > 0 || loading.vencidos">
          <ng-template pTemplate="header">
            <div class="card-section-header">
              <i class="pi pi-ban" style="color:#7C3AED"></i>
              <span>Lotes Vencidos</span>
              <span class="count-badge count-badge--purple">{{ vencidos.length }}</span>
            </div>
          </ng-template>

          <p-table [value]="vencidos" [loading]="loading.vencidos"
                   styleClass="p-datatable-sm hospital-table" [rowHover]="true"
                   [paginator]="vencidos.length > 8" [rows]="8">
            <ng-template pTemplate="header">
              <tr>
                <th>Medicamento</th>
                <th>Cód. SISMED</th>
                <th>Lote</th>
                <th style="text-align:center">Venció</th>
                <th style="text-align:center">Cantidad</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-item>
              <tr style="background:#F5F3FF">
                <td style="font-weight:500">{{ item.nombreMedicamento }}</td>
                <td style="font-family:monospace;font-size:0.8rem">{{ item.codigoSismed }}</td>
                <td style="font-family:monospace;font-size:0.8rem">{{ item.lote }}</td>
                <td style="text-align:center;color:#7C3AED;font-weight:600">
                  {{ item.fechaVencimiento | date:'dd/MM/yyyy' }}
                </td>
                <td style="text-align:center;font-weight:600">{{ item.cantidad }}</td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="5" style="text-align:center;padding:2rem;color:#64748B">
                  <i class="pi pi-check-circle" style="color:#15803D;margin-right:6px"></i>
                  Sin lotes vencidos.
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>

        <!-- ── Tabla: Solicitudes Pendientes ─────────────────────────────── -->
        <p-card styleClass="hospital-card">
          <ng-template pTemplate="header">
            <div class="card-section-header">
              <i class="pi pi-inbox" style="color:#2378f0"></i>
              <span>Solicitudes Pendientes de Despacho</span>
              <span class="count-badge count-badge--blue">{{ solicitudesPendientes.length }}</span>
            </div>
          </ng-template>

          <p-table [value]="solicitudesPendientes" [loading]="loading.solicitudes"
                   styleClass="p-datatable-sm hospital-table" [rowHover]="true">
            <ng-template pTemplate="header">
              <tr>
                <th>N° Solicitud</th>
                <th>Farmacia</th>
                <th style="text-align:center">Fecha</th>
                <th style="text-align:center">Acción</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-item>
              <tr>
                <td style="font-family:monospace;font-weight:600;color:#2378f0">{{ item.nroSolicitud }}</td>
                <td>Farmacia #{{ item.farmaciaId }}</td>
                <td style="text-align:center">{{ item.fechaSolicitud | date:'dd/MM/yyyy' }}</td>
                <td style="text-align:center">
                  <p-button label="Ver" icon="pi pi-eye" size="small" [text]="true"
                            (onClick)="verSolicitud(item.nroSolicitud)" />
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="4" style="text-align:center;padding:2rem;color:#64748B">
                  <i class="pi pi-check-circle" style="color:#15803D;margin-right:6px"></i>
                  Sin solicitudes pendientes de despacho.
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>

      </div>
    </div>
  `
  /* v8 ignore stop */
})
export class AlmacenDashboardComponent implements OnInit, OnDestroy {
  private readonly dashboardService = inject(AlmacenDashboardService);
  private readonly cdr              = inject(ChangeDetectorRef);
  private readonly destroyRef       = inject(DestroyRef);
  readonly router                   = inject(Router);

  @ViewChild('stockCanvas') stockCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('vencerCanvas') vencerCanvas!: ElementRef<HTMLCanvasElement>;

  stockCritico:          StockCriticoItem[]      = [];
  proximosVencer:        ProximoVencerItem[]      = [];
  solicitudesPendientes: SolicitudPendienteItem[] = [];
  vencidos:              Stock[]                  = [];
  totalMedicamentos      = 0;

  loading = { stock: true, vencer: true, solicitudes: true, vencidos: true };

  private stockChart?: Chart;
  private vencerChart?: Chart;
  private readonly hoyDate = new Date();
  readonly hoy = this.hoyDate;

  get sinStock(): number {
    return this.stockCritico.filter(i => i.cantidadActual === 0).length;
  }

  get proximos30(): number {
    return this.proximosVencer.filter(i => i.diasRestantes <= 30).length;
  }

  get proximos31_90(): number {
    return this.proximosVencer.filter(i => i.diasRestantes > 30).length;
  }

  get totalAlertas(): number {
    return this.sinStock + this.stockCritico.filter(i => i.cantidadActual > 0).length
         + this.proximos30 + this.vencidos.length;
  }

  ngOnInit(): void {
    this.dashboardService.getTotalMedicamentos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: n => { this.totalMedicamentos = n; this.cdr.markForCheck(); },
        error: () => { this.cdr.markForCheck(); }
      });

    this.dashboardService.getStockCritico()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.stockCritico = data;
          this.loading.stock = false;
          this.cdr.markForCheck();
          setTimeout(() => this.crearGraficoStock(), 0);
        },
        error: () => { this.loading.stock = false; this.cdr.markForCheck(); }
      });

    this.dashboardService.getProximosVencer()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.proximosVencer = data;
          this.loading.vencer = false;
          this.cdr.markForCheck();
          setTimeout(() => this.crearGraficoVencer(), 0);
        },
        error: () => { this.loading.vencer = false; this.cdr.markForCheck(); }
      });

    this.dashboardService.getSolicitudesPendientes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => { this.solicitudesPendientes = data; this.loading.solicitudes = false; this.cdr.markForCheck(); },
        error: () => { this.loading.solicitudes = false; this.cdr.markForCheck(); }
      });

    this.dashboardService.getVencidos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.vencidos = data.filter(s => new Date(s.fechaVencimiento) < this.hoyDate);
          this.loading.vencidos = false;
          this.cdr.markForCheck();
        },
        error: () => { this.loading.vencidos = false; this.cdr.markForCheck(); }
      });
  }

  ngOnDestroy(): void {
    this.stockChart?.destroy();
    this.vencerChart?.destroy();
  }

  /* v8 ignore start */
  private crearGraficoStock(): void {
    if (!this.stockCanvas?.nativeElement || this.stockCritico.length === 0) return;
    this.stockChart?.destroy();
    const top8 = this.stockCritico.slice(0, 8);
    this.stockChart = new Chart(this.stockCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: top8.map(i => i.medicamentoNombre.length > 16
          ? i.medicamentoNombre.substring(0, 16) + '…'
          : i.medicamentoNombre),
        datasets: [{
          label: 'Cantidad actual',
          data: top8.map(i => i.cantidadActual),
          backgroundColor: top8.map(i => i.cantidadActual === 0 ? '#ef4444' : '#f97316'),
          borderRadius: 5,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          /* v8 ignore next */ tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} unidades` } }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 5 }, grid: { color: '#F1F5F9' } },
          x: { ticks: { font: { size: 10 } }, grid: { display: false } }
        }
      }
    });
  }

  private crearGraficoVencer(): void {
    if (!this.vencerCanvas?.nativeElement || this.proximosVencer.length === 0) return;
    this.vencerChart?.destroy();
    const r1 = this.proximosVencer.filter(i => i.diasRestantes <= 30).length;
    const r2 = this.proximosVencer.filter(i => i.diasRestantes > 30 && i.diasRestantes <= 60).length;
    const r3 = this.proximosVencer.filter(i => i.diasRestantes > 60).length;
    this.vencerChart = new Chart(this.vencerCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['≤ 30 días', '31–60 días', '61–90 días'],
        datasets: [{
          data: [r1, r2, r3],
          backgroundColor: ['#ef4444', '#f97316', '#22c55e'],
          borderWidth: 0,
          hoverOffset: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12, padding: 12 } }
        },
        cutout: '68%'
      }
    });
  }
  /* v8 ignore stop */

  diasColor(dias: number): string {
    if (dias <= 30) return '#B91C1C';
    if (dias <= 60) return '#D97706';
    return '#15803D';
  }

  diasBg(dias: number): string {
    if (dias <= 30) return '#FEE2E2';
    if (dias <= 60) return '#FEF3C7';
    return '#DCFCE7';
  }

  verSolicitud(nroSolicitud: string): void {
    this.router.navigate(['/almacen/notas-salida'], { queryParams: { solicitud: nroSolicitud } });
  }
}
