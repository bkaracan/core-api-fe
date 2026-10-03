import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-[var(--color-bg-subtle)] p-4">
      <div class="w-full max-w-md bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-xl p-8 space-y-6">
        <div class="text-center space-y-2">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 mx-auto flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/25">
            C
          </div>
          <h2 class="text-2xl font-bold tracking-tight text-[var(--color-text-main)]">Hesap Oluştur</h2>
          <p class="text-xs text-[var(--color-text-muted)]">Kurumsal API Portalına Kayıt Olun</p>
        </div>

        <!-- Social Providers (Google & GitHub) -->
        <div class="space-y-2.5">
          <button
            type="button"
            (click)="loginWithSocial('google')"
            class="w-full py-2.5 px-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-card)] text-[var(--color-text-main)] font-semibold text-sm transition-all flex items-center justify-center gap-3 cursor-pointer hover:shadow-xs"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.28-2.09 3.665-5.18 3.665-9.14z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.41l4.04-3.13z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.59l4.04 3.13c.95-2.83 3.6-4.97 6.72-4.97z"/>
            </svg>
            <span>Google ile Kayıt Ol</span>
          </button>

          <button
            type="button"
            (click)="loginWithSocial('github')"
            class="w-full py-2.5 px-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-card)] text-[var(--color-text-main)] font-semibold text-sm transition-all flex items-center justify-center gap-3 cursor-pointer hover:shadow-xs"
          >
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            <span>GitHub ile Kayıt Ol</span>
          </button>
        </div>

        <div class="relative flex py-1 items-center">
          <div class="flex-grow border-t border-[var(--color-border-subtle)]"></div>
          <span class="flex-shrink mx-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">veya e-posta ile kayıt ol</span>
          <div class="flex-grow border-t border-[var(--color-border-subtle)]"></div>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="firstName" class="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Ad</label>
              <input
                id="firstName"
                type="text"
                formControlName="firstName"
                placeholder="Ahmet"
                class="w-full px-3 py-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] text-[var(--color-text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              @if (registerForm.controls.firstName.touched && registerForm.controls.firstName.errors?.['required']) {
                <p class="text-rose-500 text-xs mt-1">Ad zorunludur.</p>
              }
            </div>

            <div>
              <label for="lastName" class="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Soyad</label>
              <input
                id="lastName"
                type="text"
                formControlName="lastName"
                placeholder="Yılmaz"
                class="w-full px-3 py-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] text-[var(--color-text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              @if (registerForm.controls.lastName.touched && registerForm.controls.lastName.errors?.['required']) {
                <p class="text-rose-500 text-xs mt-1">Soyad zorunludur.</p>
              }
            </div>
          </div>

          <div>
            <label for="email" class="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Kurumsal E-Posta</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="ahmet.yilmaz@enterprise.com"
              class="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] text-[var(--color-text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            @if (registerForm.controls.email.touched && registerForm.controls.email.errors?.['required']) {
              <p class="text-rose-500 text-xs mt-1">E-posta adresi zorunludur.</p>
            }
            @if (registerForm.controls.email.touched && registerForm.controls.email.errors?.['email']) {
              <p class="text-rose-500 text-xs mt-1">Geçerli bir e-posta formatı giriniz.</p>
            }
          </div>

          <div>
            <label for="password" class="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Parola (En az 8 karakter)</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="••••••••"
              class="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] text-[var(--color-text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            @if (registerForm.controls.password.touched && registerForm.controls.password.errors?.['required']) {
              <p class="text-rose-500 text-xs mt-1">Parola zorunludur.</p>
            }
            @if (registerForm.controls.password.touched && registerForm.controls.password.errors?.['minlength']) {
              <p class="text-rose-500 text-xs mt-1">Parola en az 8 karakter olmalıdır.</p>
            }
          </div>

          <button
            type="submit"
            [disabled]="registerForm.invalid || isLoading()"
            class="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            @if (isLoading()) {
              <span>Kayıt Yapılıyor...</span>
            } @else {
              <span>Hesap Oluştur</span>
            }
          </button>
        </form>

        <div class="text-center text-xs text-[var(--color-text-muted)]">
          Zaten bir hesabınız var mı?
          <a routerLink="/auth/login" class="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Giriş Yapın
          </a>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly isLoading = signal(false);

  readonly registerForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]]
  });

  loginWithSocial(provider: 'google' | 'github'): void {
    this.authService.loginWithSocial(provider);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const data = this.registerForm.getRawValue();

    this.authService.register(data).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.toastService.success('Hesabınız başarıyla oluşturuldu. Lütfen giriş yapınız.');
          this.router.navigate(['/auth/login']);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}
