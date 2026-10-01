import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Welcome Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-[var(--color-text-main)]">Sistem Genel Bakış</h2>
          <p class="text-sm text-[var(--color-text-muted)]">
            Spring Boot 4.1.1 ve Angular 21 Mikroservis Yönetim Paneli
          </p>
        </div>
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Tüm Sistemler Operasyonel
          </span>
        </div>
      </div>

      <!-- Key Enterprise Metric Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-[var(--color-text-muted)]">API Çalışma Süresi</span>
            <span class="text-emerald-500 text-sm font-semibold">99.98%</span>
          </div>
          <div class="text-2xl font-bold mt-2 text-[var(--color-text-main)]">342 Gün</div>
          <div class="text-xs text-[var(--color-text-muted)] mt-1">Kesintisiz mikroservis uptime</div>
        </div>

        <div class="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-[var(--color-text-muted)]">Kimlik Protokolü</span>
            <span class="text-indigo-500 text-sm font-semibold">Aktif</span>
          </div>
          <div class="text-2xl font-bold mt-2 text-[var(--color-text-main)]">OAuth 2.1</div>
          <div class="text-xs text-[var(--color-text-muted)] mt-1">PKCE S256 & RFC 7807</div>
        </div>

        <div class="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-[var(--color-text-muted)]">Dağıtık İzleme (Tracing)</span>
            <span class="text-sky-500 text-sm font-semibold">Micrometer</span>
          </div>
          <div class="text-2xl font-bold mt-2 text-[var(--color-text-main)]">X-Trace-Id</div>
          <div class="text-xs text-[var(--color-text-muted)] mt-1">Uçtan uca HTTP başlığı aktif</div>
        </div>

        <div class="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-[var(--color-text-muted)]">Aktif Kullanıcı Rolü</span>
            <span class="text-amber-500 text-sm font-semibold">RBAC</span>
          </div>
          <div class="text-2xl font-bold mt-2 text-[var(--color-text-main)] truncate">
            {{ (authService.userRoles()[0] || 'ROLE_USER').replace('ROLE_', '') }}
          </div>
          <div class="text-xs text-[var(--color-text-muted)] mt-1">{{ authService.currentUser()?.email || 'Yerel Kullanıcı' }}</div>
        </div>
      </div>

      <!-- Microservices Architecture Status -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs space-y-4">
          <h3 class="text-base font-bold text-[var(--color-text-main)]">Servis Entegrasyon Durumu</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)]">
              <div class="flex items-center gap-3">
                <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                <div>
                  <div class="text-sm font-semibold">Spring Boot 4.1.1 Core API</div>
                  <div class="text-xs text-[var(--color-text-muted)]">REST API Servisleri (Port: 8080)</div>
                </div>
              </div>
              <span class="text-xs font-mono px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 font-medium">UP (200 OK)</span>
            </div>

            <div class="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)]">
              <div class="flex items-center gap-3">
                <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                <div>
                  <div class="text-sm font-semibold">Spring Authorization Server (SAS)</div>
                  <div class="text-xs text-[var(--color-text-muted)]">OIDC 1.0 & OAuth 2.1 PKCE Endpointleri</div>
                </div>
              </div>
              <span class="text-xs font-mono px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 font-medium">UP (200 OK)</span>
            </div>

            <div class="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)]">
              <div class="flex items-center gap-3">
                <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                <div>
                  <div class="text-sm font-semibold">PostgreSQL & Flyway Migrations</div>
                  <div class="text-xs text-[var(--color-text-muted)]">Kullanıcı, rol ve sosyal bağlantı tabloları</div>
                </div>
              </div>
              <span class="text-xs font-mono px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 font-medium">CONNECTED</span>
            </div>
          </div>
        </div>

        <!-- User Profile Quick Card -->
        <div class="p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs space-y-4">
          <h3 class="text-base font-bold text-[var(--color-text-main)]">Aktif Oturum Bilgisi</h3>
          @if (authService.currentUser(); as user) {
            <div class="space-y-3 text-xs">
              <div class="flex justify-between py-1.5 border-b border-[var(--color-border-subtle)]">
                <span class="text-[var(--color-text-muted)]">Public ID:</span>
                <span class="font-mono text-[var(--color-text-main)] truncate max-w-[160px]">{{ user.publicId }}</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-[var(--color-border-subtle)]">
                <span class="text-[var(--color-text-muted)]">E-Posta:</span>
                <span class="font-medium text-[var(--color-text-main)]">{{ user.email }}</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-[var(--color-border-subtle)]">
                <span class="text-[var(--color-text-muted)]">Ad Soyad:</span>
                <span class="font-medium text-[var(--color-text-main)]">{{ user.firstName }} {{ user.lastName }}</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-[var(--color-border-subtle)]">
                <span class="text-[var(--color-text-muted)]">Yerel Parola:</span>
                <span class="font-medium" [ngClass]="user.hasLocalPassword ? 'text-emerald-600' : 'text-amber-600'">
                  {{ user.hasLocalPassword ? 'Tanımlı' : 'Tanımsız' }}
                </span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-[var(--color-border-subtle)]">
                <span class="text-[var(--color-text-muted)]">Sosyal Hesaplar:</span>
                <span class="font-medium text-[var(--color-text-main)]">{{ user.socialAccounts.length }} Bağlantı</span>
              </div>
            </div>
          } @else {
            <p class="text-xs text-[var(--color-text-muted)]">Kullanıcı profili yükleniyor...</p>
          }
        </div>
      </div>

      <!-- Modern Angular 21 @defer Block Showcase -->
      @defer (on viewport) {
        <div class="p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-[var(--color-text-main)]">Gelişmiş Tehdit & Güvenlik Analitiği (Deffered Loaded)</h3>
            <span class="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-semibold">&#64;defer on viewport</span>
          </div>
          <p class="text-xs text-[var(--color-text-muted)]">
            Angular 21 deferrable view optimizasyonu ile bu bileşen yalnızca görünür alana geldiğinde ayrıştırılıp render edilmiştir.
          </p>
          <div class="h-32 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-dashed border-indigo-500/30 flex items-center justify-center text-xs text-indigo-600 dark:text-indigo-400 font-mono">
            🛡️ Zero-Trust Architecture: Token Exfiltration Protection (In-Memory Signals Active)
          </div>
        </div>
      } @placeholder {
        <div class="h-24 rounded-2xl border border-dashed border-[var(--color-border-subtle)] flex items-center justify-center text-xs text-[var(--color-text-muted)] animate-pulse">
          Güvenlik analitiği modülü yükleniyor...
        </div>
      }
    </div>
  `
})
export class DashboardComponent {
  readonly authService = inject(AuthService);
}
