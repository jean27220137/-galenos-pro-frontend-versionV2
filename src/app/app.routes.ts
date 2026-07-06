import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { ShellComponent } from './shared/shell/shell.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent) },

  {
    path: '',
    component: ShellComponent,
    children: [
      { path: 'farmacia',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['JEFE_FARMACIA', 'FARMACEUTICO', 'ADMIN'] },
        children: [
          { path: 'solicitudes', loadComponent: () =>
              import('./features/farmacia/solicitudes-list/solicitudes-list.component')
                .then(m => m.SolicitudesListComponent) },
          { path: 'solicitudes/nueva', loadComponent: () =>
              import('./features/farmacia/solicitud-form/solicitud-form.component')
                .then(m => m.SolicitudFormComponent) },
          { path: '', redirectTo: 'solicitudes', pathMatch: 'full' }
        ]
      },

      { path: 'almacen',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['ALMACENERO', 'ADMIN'] },
        children: [
          { path: 'dashboard', loadComponent: () =>
              import('./features/almacen/dashboard/almacen-dashboard.component')
                .then(m => m.AlmacenDashboardComponent) },
          { path: 'stock', loadComponent: () =>
              import('./features/almacen/stock-list/stock-list.component')
                .then(m => m.StockListComponent) },
          { path: 'solicitudes', loadComponent: () =>
              import('./features/almacen/solicitudes-pendientes/solicitudes-pendientes.component')
                .then(m => m.SolicitudesPendientesComponent) },
          { path: 'notas-salida', loadComponent: () =>
              import('./features/almacen/notas-salida-list/notas-salida-list.component')
                .then(m => m.NotasSalidaListComponent) },
          { path: 'notas-salida/:id', loadComponent: () =>
              import('./features/almacen/nota-salida-detail/nota-salida-detail.component')
                .then(m => m.NotaSalidaDetailComponent) },
          { path: 'medicamentos', loadComponent: () =>
              import('./features/almacen/medicamentos-list/medicamentos-list.component')
                .then(m => m.MedicamentosListComponent) },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
      },

      { path: 'admin',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['ADMIN'] },
        children: [
          { path: 'usuarios', loadComponent: () =>
              import('./features/admin/usuarios-list/usuarios-list.component')
                .then(m => m.UsuariosListComponent) },
          { path: '', redirectTo: 'usuarios', pathMatch: 'full' }
        ]
      }
    ]
  },

  { path: '**', redirectTo: 'login' }
];
