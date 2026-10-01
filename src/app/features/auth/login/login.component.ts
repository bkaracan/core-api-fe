import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-[var(--color-bg-subtle)] p-4">
      <div class="w-full max-w-md bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-xl p-8 space-y-6">
        <div class="text-center space-y-2">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 mx-auto flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/25">
            C
          </div>
          <h2 class="text-2xl font-bold tracking-tight text-[var(--color-text-main)]">Giriş Yap</h2>
          <p class="text-xs text-[var(--color-text-muted)]">Core Enterprise Platformuna Hoş Geldiniz</p>
        </div>

        <!-- SSO Login Button -->
        <div>
          <button
            type="button"
            (click)="loginWithSso()"
            [disabled]="isLoading()"
            class="w-full py-2.5 px-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>🔐</span>
            <span>Kurumsal SSO ile Giriş (OAuth 2.1 PKCE)</span>
          </button>
        </div>

        <div class="relative flex py-2 items-center">
          <div class="flex-grow border-t border-[var(--color-border-subtle)]"></div>
          <span class="flex-shrink mx-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">veya yerel hesap</span>
          <div class="flex-grow border-t border-[var(--color-border-subtle)]"></div>
        </div>

        <!-- Local Credentials Form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label for="email" class="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">E-Posta Adresi</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="kullanici@enterprise.com"
              class="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] text-[var(--color-text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
            @if (loginForm.controls.email.touched && loginForm.controls.email.errors?.['required']) {
              <p class="text-rose-500 text-xs mt-1">E-posta adresi zorunludur.</p>
            }
            @if (loginForm.controls.email.touched && loginForm.controls.email.errors?.['email']) {
              <p class="text-rose-500 text-xs mt-1">Geçerli bir e-posta formatı giriniz.</p>
            }
          </div>

          <div>
            <label for="password" class="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Parola</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="••••••••"
              class="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] text-[var(--color-text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
            @if (loginForm.controls.password.touched && loginForm.controls.password.errors?.['required']) {
              <p class="text-rose-500 text-xs mt-1">Parola zorunludur.</p>
            }
          </div>

          <button
            type="submit"
            [disabled]="loginForm.invalid || isLoading()"
            class="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            @if (isLoading()) {
              <span>Giriş Yapılıyor...</span>
            } @else {
              <span>Giriş Yap</span>
            }
          </button>
        </form>

        <div class="text-center text-xs text-[var(--color-text-muted)]">
          Hesabınız yok mu?
          <a routerLink="/auth/register" class="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Yeni Hesap Oluştur
          </a>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly isLoading = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  async loginWithSso(): Promise<void> {
    this.isLoading.set(true);
    try {
      await this.authService.initiateSsoLogin();
    } catch {
      this.toastService.error('SSO giriş akışı başlatılamadı.');
      this.isLoading.set(false);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const credentials = this.loginForm.getRawValue();

    this.authService.loginLocal(credentials).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.toastService.success(`Hoş geldiniz, ${response.data.user.firstName}!`);
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}
