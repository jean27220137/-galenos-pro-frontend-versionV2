import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  /* v8 ignore start */
  template: `
    <div class="page-header">
      <div>
        <h1>{{ title }}</h1>
        <p *ngIf="subtitle">{{ subtitle }}</p>
      </div>
      <div>
        <ng-content></ng-content>
      </div>
    </div>
  `
  /* v8 ignore stop */
})
export class PageHeaderComponent {
  @Input() title    = '';
  @Input() subtitle = '';
}
