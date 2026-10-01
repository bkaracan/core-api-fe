import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/services/toast.service';
import { UserProfileResponse } from '@core/models';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-[var(--color-text-main)]">Profil ve Güvenlik Ayarları</h2>
        <p class="text-sm text-[var(--color-text-muted)]">Hesap detaylarınızı, parolanızı ve harici sosyal bağlantılarınızı yönetin.</p>
      </div>

      @if (profile(); as user) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- User Details Card -->
          <div class="p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs space-y-4">
            <div class="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold">
              {{ user.firstName[0] || 'U' }}{{ user.lastName[0] || 'P' }}
            </div>
            <div>
              <h3 class="text-base font-bold text-[var(--color-text-main)]">{{ user.firstName }} {{ user.lastName }}</h3>
              <p class="text-xs text-[var(--color-text-muted)]">{{ user.email }}</p>
            </div>
            <div class="pt-2 border-t border-[var(--color-border-subtle)] space-y-2 text-xs">
              <div class="flex justify-between">
                <span class="text-[var(--color-text-muted)]">Durum:</span>
                <span class="font-medium text-emerald-600 uppercase">{{ user.status }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[var(--color-text-muted)]">Oluşturulma:</span>
                <span class="font-mono text-[var(--color-text-muted)]">{{ user.createdAt | date: 'dd.MM.yyyy HH:mm' }}</span>
              </div>
              <div>
                <span class="text-[var(--color-text-muted)] block mb-1">Roller:</span>
                <div class="flex flex-wrap gap-1">
                  @for (role of user.roles; track role) {
                    <span class="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 font-mono text-[10px] font-semibold">
                      {{ role }}
                    </span>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Password & Social Settings -->
          <div class="md:col-span-2 space-y-6">
            <!-- Set / Change Password Form -->
            <div class="p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs space-y-4">
              <h3 class="text-base font-bold text-[var(--color-text-main)]">
                {{ user.hasLocalPassword ? 'Yerel Parolayı Güncelle' : 'Yerel Parola Belirle' }}
              </h3>
              <p class="text-xs text-[var(--color-text-muted)]">
                {{ user.hasLocalPassword
                  ? 'Hesabınızda yerel parola mevcuttur. Dilerseniz güncelleyebilirsiniz.'
                  : 'Sosyal hesapla giriş yaptıysanız, e-posta ve parola ile giriş yapabilmek için parola tanımlayınız.' }}
              </p>

              <form [formGroup]="passwordForm" (ngSubmit)="onSetPassword()" class="space-y-4">
                <div>
                  <label for="newPassword" class="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Yeni Parola</label>
                  <input
                    id="newPassword"
                    type="password"
                    formControlName="newPassword"
                    placeholder="••••••••"
                    class="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] text-[var(--color-text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  @if (passwordForm.controls.newPassword.touched && passwordForm.controls.newPassword.errors?.['required']) {
                    <p class="text-rose-500 text-xs mt-1">Yeni parola zorunludur.</p>
                  }
                  @if (passwordForm.controls.newPassword.touched && passwordForm.controls.newPassword.errors?.['minlength']) {
                    <p class="text-rose-500 text-xs mt-1">Parola en az 8 karakter olmalıdır.</p>
                  }
                </div>

                <div>
                  <label for="confirmPassword" class="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Parola Tekrarı</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    formControlName="confirmPassword"
                    placeholder="••••••••"
                    class="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] text-[var(--color-text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  @if (passwordForm.controls.confirmPassword.touched && passwordForm.controls.confirmPassword.errors?.['required']) {
                    <p class="text-rose-500 text-xs mt-1">Parola tekrarı zorunludur.</p>
                  }
                  @if (passwordForm.touched && passwordForm.hasError('mismatch')) {
                    <p class="text-rose-500 text-xs mt-1">Parolalar uyuşmuyor.</p>
                  }
                </div>

                <button
                  type="submit"
                  [disabled]="passwordForm.invalid || isSavingPassword()"
                  class="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-md shadow-indigo-600/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {{ isSavingPassword() ? 'Kaydediliyor...' : 'Parolayı Kaydet' }}
                </button>
              </form>
            </div>

            <!-- Social Accounts Federation -->
            <div class="p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs space-y-4">
              <h3 class="text-base font-bold text-[var(--color-text-main)]">Bağlı Sosyal Hesaplar (Federasyon)</h3>
              @if (user.socialAccounts.length === 0) {
                <p class="text-xs text-[var(--color-text-muted)]">Hesabınıza bağlı herhangi bir harici sosyal hesap bulunmamaktadır.</p>
              } @else {
                <div class="space-y-2">
                  @for (account of user.socialAccounts; track account.publicId) {
                    <div class="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)]">
                      <div class="flex items-center gap-3">
                        <span class="text-lg">{{ account.provider === 'google' ? '🇬' : '🐙' }}</span>
                        <div>
                          <div class="text-xs font-bold capitalize text-[var(--color-text-main)]">{{ account.provider }}</div>
                          <div class="text-[11px] text-[var(--color-text-muted)]">{{ account.providerEmail }}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        (click)="unlinkSocial(account.provider)"
                        class="text-xs px-2.5 py-1 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
                      >
                        Bağlantıyı Kopar
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      } @else {
        <div class="p-8 text-center text-sm text-[var(--color-text-muted)] animate-pulse">
          Kullanıcı profil verisi getiriliyor...
        </div>
      }
    </div>
  `
})
export class UserProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly profile = signal<UserProfileResponse | null>(null);
  readonly isSavingPassword = signal(false);

  readonly passwordForm = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
      confirmPassword: ['', [Validators.required]]
    },
    {
      validators: [
        (control) => {
          const pass = control.get('newPassword')?.value;
          const confirm = control.get('confirmPassword')?.value;
          return pass === confirm ? null : { mismatch: true };
        }
      ]
    }
  );

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.userService.getCurrentUser().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.profile.set(res.data);
          this.authService.currentUser.set(res.data);
        }
      }
    });
  }

  onSetPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isSavingPassword.set(true);
    const data = this.passwordForm.getRawValue();

    this.userService.setPassword(data).subscribe({
      next: (res) => {
        this.isSavingPassword.set(false);
        if (res.success) {
          this.toastService.success('Parolanız başarıyla güncellendi.');
          this.passwordForm.reset();
          this.loadProfile();
        }
      },
      error: () => {
        this.isSavingPassword.set(false);
      }
    });
  }

  unlinkSocial(provider: string): void {
    if (!confirm(`${provider} bağlantısını kaldırmak istediğinize emin misiniz?`)) {
      return;
    }

    this.userService.unlinkSocialAccount(provider).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.success(`${provider} bağlantısı başarıyla kaldırıldı.`);
          this.loadProfile();
        }
      }
    });
  }
}
