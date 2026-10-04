import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/services/toast.service';

import { TokenStorageService } from '@core/auth/token-storage.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-[var(--color-bg-subtle)] p-4">
      <div
        class="w-full max-w-sm bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-xl p-8 text-center space-y-4"
      >
        @if (isProcessing()) {
          <div
            class="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"
          ></div>
          <h3 class="text-base font-semibold text-[var(--color-text-main)]">
            Kimlik Doğrulanıyor...
          </h3>
          <p class="text-xs text-[var(--color-text-muted)]">Oturum açma işlemi tamamlanıyor.</p>
        } @else {
          <div
            class="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold"
          >
            ✕
          </div>
          <h3 class="text-base font-semibold text-rose-600">Yetkilendirme Başarısız</h3>
          <p class="text-xs text-[var(--color-text-muted)]">{{ errorMessage() }}</p>
          <button
            type="button"
            (click)="returnToLogin()"
            class="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
          >
            Giriş Ekranına Dön
          </button>
        }
      </div>
    </div>
  `,
})
export class AuthCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly toastService = inject(ToastService);

  readonly isProcessing = signal(true);
  readonly errorMessage = signal('Geçersiz istek parametreleri.');

  ngOnInit(): void {
    const directToken =
      this.route.snapshot.queryParamMap.get('token') ||
      this.route.snapshot.queryParamMap.get('accessToken') ||
      this.route.snapshot.queryParamMap.get('access_token');

    if (directToken) {
      this.tokenStorage.setAccessToken(directToken);
      this.authService.fetchCurrentUser().subscribe({
        next: (profileRes) => {
          this.isProcessing.set(false);
          this.toastService.success(`Hoş geldiniz, ${profileRes.data.firstName}!`);
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.isProcessing.set(false);
          this.router.navigate(['/dashboard']);
        },
      });
      return;
    }

    const code = this.route.snapshot.queryParamMap.get('code');
    const state = this.route.snapshot.queryParamMap.get('state');

    if (!code || !state) {
      this.isProcessing.set(false);
      this.errorMessage.set('Eksik yetkilendirme kodu veya durum bilgisi.');
      return;
    }

    try {
      this.authService.handleAuthCallback(code, state).subscribe({
        next: () => {
          // After token is saved in memory, fetch current user profile
          this.authService.fetchCurrentUser().subscribe({
            next: (profileRes) => {
              this.isProcessing.set(false);
              this.toastService.success(`Hoş geldiniz, ${profileRes.data.firstName}!`);
              this.router.navigate(['/dashboard']);
            },
            error: () => {
              this.isProcessing.set(false);
              this.router.navigate(['/dashboard']);
            },
          });
        },
        error: (err: unknown) => {
          this.isProcessing.set(false);
          const msg = err instanceof Error ? err.message : 'SSO doğrulama işlemi başarısız oldu.';
          this.errorMessage.set(msg);
          this.toastService.error(msg);
        },
      });
    } catch (err: unknown) {
      this.isProcessing.set(false);
      const msg = err instanceof Error ? err.message : 'PKCE parametreleri doğrulanamadı.';
      this.errorMessage.set(msg);
      this.toastService.error(msg);
    }
  }

  returnToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
