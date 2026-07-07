import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    ButtonModule, InputTextModule, PasswordModule,
    FloatLabelModule, DividerModule, MessageModule,
  ],
  template: `
    <div class="login-root">

      <!-- Fondo decorativo -->
      <div aria-hidden="true">
        <div class="login-bg__circle login-bg__circle--1"></div>
        <div class="login-bg__circle login-bg__circle--2"></div>
        <div class="login-bg__circle login-bg__circle--3"></div>
      </div>

      <!-- Panel principal -->
      <main class="login-panel gp-fade-in" role="main">

        <!-- Cabecera -->
        <header class="login-panel__header">
          <div class="login-panel__logo" aria-hidden="true">
            <i class="pi pi-heart-fill"></i>
          </div>
          <h1 class="login-panel__title">
            <span class="login-panel__title-name">Galenos</span>
            <span class="login-panel__title-pro">Pro</span>
          </h1>
          <p class="login-panel__subtitle">Sistema de Gestión Hospitalaria</p>
        </header>

        <p-divider />

        <!-- Formulario -->
        <section class="login-panel__body" aria-label="Formulario de acceso">
          <h2 class="login-panel__form-title">Iniciar sesión</h2>

          <!-- Error global -->
          <div *ngIf="error" style="margin-bottom:1rem">
            <p-message severity="error" [text]="error" styleClass="w-full" />
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

            <!-- Email -->
            <div class="login-field">
              <p-floatlabel variant="on">
                <input pInputText id="email" type="email"
                       formControlName="email"
                       autocomplete="username"
                       [class.ng-invalid]="f['email'].invalid && f['email'].touched"
                       [class.ng-dirty]="f['email'].dirty"
                       style="width:100%"
                       aria-describedby="email-error" />
                <label for="email">
                  <i class="pi pi-envelope"></i> Correo electrónico
                </label>
              </p-floatlabel>
              <small *ngIf="f['email'].invalid && f['email'].touched"
                     id="email-error" class="login-field__error" role="alert">
                <ng-container *ngIf="f['email'].hasError('required')">El correo es obligatorio.</ng-container>
                <ng-container *ngIf="f['email'].hasError('email')">Ingrese un correo válido.</ng-container>
              </small>
            </div>

            <!-- Contraseña -->
            <div class="login-field">
              <p-floatlabel variant="on">
                <p-password inputId="password"
                            formControlName="password"
                            [feedback]="false"
                            [toggleMask]="true"
                            autocomplete="current-password"
                            styleClass="w-full"
                            inputStyleClass="w-full"
                            [class.ng-invalid]="f['password'].invalid && f['password'].touched"
                            aria-describedby="password-error" />
                <label for="password">
                  <i class="pi pi-lock"></i> Contraseña
                </label>
              </p-floatlabel>
              <small *ngIf="f['password'].invalid && f['password'].touched"
                     id="password-error" class="login-field__error" role="alert">
                La contraseña es obligatoria.
              </small>
            </div>

            <!-- Botón -->
            <p-button type="submit"
                      label="Acceder al Sistema"
                      icon="pi pi-sign-in"
                      iconPos="right"
                      styleClass="login-submit-btn"
                      size="large"
                      [loading]="cargando"
                      [disabled]="form.invalid || cargando" />

          </form>
        </section>

      </main>

      <!-- Badge de entorno -->
      <div class="login-env-badge" role="note" aria-label="Entorno">
        <i class="pi pi-server"></i> DEV
      </div>

    </div>
  `
})
export class LoginComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  form: FormGroup = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  error    = '';
  cargando = false;

  get f() { return this.form.controls; }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.cargando = true;
    this.error    = '';

    const { email, password } = this.form.value;
    this.auth.login(email, password).subscribe({
      next: sesion => {
        this.cargando = false;
        this.router.navigate([this.rutaPorRol(sesion.rol)]);
      },
      error: () => {
        this.cargando = false;
        this.error = 'Credenciales inválidas. Verifique su correo y contraseña.';
      }
    });
  }

  private rutaPorRol(rol: string): string {
    if (rol === 'ALMACENERO') return '/almacen/dashboard';
    if (rol === 'ADMIN')      return '/admin/usuarios';
    return '/farmacia/solicitudes';
  }
}
