import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/services/toast.service';
import { UserProfileResponse, SocialAccountResponse } from '@core/models';

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

            <!-- Social Accounts Federation (Google & GitHub) -->
            <div class="p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs space-y-4">
              <div>
                <h3 class="text-base font-bold text-[var(--color-text-main)]">Bağlı Sosyal Hesaplar (Federasyon)</h3>
                <p class="text-xs text-[var(--color-text-muted)]">Hesabınıza Google veya GitHub hesabınızı bağlayarak tek tıkla güvenli giriş yapabilirsiniz.</p>
              </div>

              <div class="space-y-3">
                <!-- Google Card -->
                <div class="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)]">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] flex items-center justify-center">
                      <svg class="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.28-2.09 3.665-5.18 3.665-9.14z"/>
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z"/>
                        <path fill="#FBBC05" d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.41l4.04-3.13z"/>
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.59l4.04 3.13c.95-2.83 3.6-4.97 6.72-4.97z"/>
                      </svg>
                    </div>
                    <div>
                      <div class="text-xs font-bold text-[var(--color-text-main)]">Google Hesabı</div>
                      @if (getSocialAccount('google'); as googleAcc) {
                        <div class="text-[11px] text-emerald-500 font-medium">Bağlı: {{ googleAcc.providerEmail }}</div>
                      } @else {
                        <div class="text-[11px] text-[var(--color-text-muted)]">Bağlantı bulunmuyor</div>
                      }
                    </div>
                  </div>

                  @if (getSocialAccount('google'); as googleAcc) {
                    <button
                      type="button"
                      (click)="unlinkSocial('GOOGLE')"
                      class="text-xs px-2.5 py-1 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
                    >
                      Bağlantıyı Kopar
                    </button>
                  } @else {
                    <button
                      type="button"
                      (click)="linkSocial('google')"
                      class="text-xs px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors cursor-pointer"
                    >
                      + Google'ı Bağla
                    </button>
                  }
                </div>

                <!-- GitHub Card -->
                <div class="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)]">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] flex items-center justify-center">
                      <svg class="w-4 h-4 fill-current text-[var(--color-text-main)]" viewBox="0 0 24 24">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                      </svg>
                    </div>
                    <div>
                      <div class="text-xs font-bold text-[var(--color-text-main)]">GitHub Hesabı</div>
                      @if (getSocialAccount('github'); as githubAcc) {
                        <div class="text-[11px] text-emerald-500 font-medium">Bağlı: {{ githubAcc.providerEmail }}</div>
                      } @else {
                        <div class="text-[11px] text-[var(--color-text-muted)]">Bağlantı bulunmuyor</div>
                      }
                    </div>
                  </div>

                  @if (getSocialAccount('github'); as githubAcc) {
                    <button
                      type="button"
                      (click)="unlinkSocial('GITHUB')"
                      class="text-xs px-2.5 py-1 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
                    >
                      Bağlantıyı Kopar
                    </button>
                  } @else {
                    <button
                      type="button"
                      (click)="linkSocial('github')"
                      class="text-xs px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors cursor-pointer"
                    >
                      + GitHub'ı Bağla
                    </button>
                  }
                </div>
              </div>
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

  getSocialAccount(provider: string): SocialAccountResponse | undefined {
    return this.profile()?.socialAccounts?.find(
      (a) => a.provider.toLowerCase() === provider.toLowerCase()
    );
  }

  linkSocial(provider: 'google' | 'github'): void {
    this.authService.loginWithSocial(provider);
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
