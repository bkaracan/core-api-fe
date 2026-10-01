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
