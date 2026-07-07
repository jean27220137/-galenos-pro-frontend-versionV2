import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" role="navigation" aria-label="Navegación principal">

      <!-- Header -->
      <div class="sidebar-header">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:1.5rem">⚕</span>
          <div>
            <div class="sidebar-logo">Galenos Pro</div>
            <div class="sidebar-hospital">H.N. Sergio E. Bernales</div>
          </div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <div class="nav-section-label">Menú</div>
        <a *ngFor="let item of navItems; trackBy: trackByRoute"
           [routerLink]="item.route"
           routerLinkActive="active"
           #rla="routerLinkActive"
           [attr.aria-current]="rla.isActive ? 'page' : null"
           class="nav-item">
          <i [class]="'pi ' + item.icon"></i>
          <span>{{ item.label }}</span>
        </a>
      </nav>

      <!-- Footer usuario -->
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-avatar">{{ inicial }}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">{{ nombre }}</div>
            <div class="sidebar-user-rol">{{ rol }}</div>
          </div>
        </div>
        <button (click)="cerrarSesion()"
                class="sidebar-logout-btn"
                aria-label="Cerrar sesión">
          <i class="pi pi-sign-out"></i>
          Cerrar sesión
        </button>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);

  readonly rol:      string;
  readonly nombre:   string;
  readonly inicial:  string;
  readonly navItems: NavItem[];

  constructor() {
    const sesion  = this.authService.getSesion();
    this.rol      = sesion?.rol ?? '';
    this.nombre   = sesion ? `Usuario #${sesion.userId}` : 'Usuario';
    this.inicial  = this.rol.charAt(0).toUpperCase();
    this.navItems = this.buildNavItems(this.rol);
  }

  private buildNavItems(rol: string): NavItem[] {
    if (rol === 'ALMACENERO') {
      return [
        { label: 'Dashboard',       icon: 'pi-chart-bar',   route: '/almacen/dashboard' },
        { label: 'Solicitudes',     icon: 'pi-inbox',       route: '/almacen/solicitudes' },
        { label: 'Inventario',      icon: 'pi-box',         route: '/almacen/stock' },
        { label: 'Medicamentos',    icon: 'pi-pills',       route: '/almacen/medicamentos' },
        { label: 'Notas de Salida', icon: 'pi-file-export', route: '/almacen/notas-salida' },
      ];
    }
    if (rol === 'ADMIN') {
      return [
        { label: 'Usuarios',        icon: 'pi-users',       route: '/admin/usuarios' },
        { label: 'Solicitudes',     icon: 'pi-list',        route: '/farmacia/solicitudes' },
        { label: 'Inventario',      icon: 'pi-box',         route: '/almacen/stock' },
        { label: 'Medicamentos',    icon: 'pi-pills',       route: '/almacen/medicamentos' },
        { label: 'Dashboard',       icon: 'pi-chart-bar',   route: '/almacen/dashboard' },
      ];
    }
    // FARMACEUTICO / JEFE_FARMACIA
    return [
      { label: 'Mis Solicitudes', icon: 'pi-list',        route: '/farmacia/solicitudes' },
      { label: 'Nueva Solicitud', icon: 'pi-plus-circle', route: '/farmacia/solicitudes/nueva' },
    ];
  }

  trackByRoute(_: number, item: NavItem): string { return item.route; }

  cerrarSesion(): void {
    this.authService.logout().subscribe({
      next:  () => this.router.navigate(['/login']),
      error: () => {
        this.authService.cerrarSesionLocal();
        this.router.navigate(['/login']);
      }
    });
  }
}
