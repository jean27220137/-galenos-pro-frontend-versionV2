import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, ToastModule, SidebarComponent],
  /* v8 ignore start */
  template: `
    <div class="shell-layout">
      <app-sidebar />
      <main class="shell-content" id="main-content">
        <router-outlet />
      </main>
    </div>
    <p-toast position="top-right" [life]="5000" />
  `
  /* v8 ignore stop */
})
export class ShellComponent implements OnInit, OnDestroy {
  private readonly notificationService = inject(NotificationService);

  ngOnInit(): void  { this.notificationService.conectar(); }
  ngOnDestroy(): void { this.notificationService.desconectar(); }
}
