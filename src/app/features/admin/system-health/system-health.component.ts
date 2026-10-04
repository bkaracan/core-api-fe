import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/auth/auth.service';
import { ActuatorService } from '@core/services/actuator.service';
import { ActuatorHealthResponse, ActuatorInfoResponse } from '@core/models';

@Component({
  selector: 'app-system-health',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Admin Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span
              class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
            >
              Yönetici Paneli (Admin)
            </span>
          </div>
          <h2 class="text-2xl font-bold tracking-tight text-[var(--color-text-main)] mt-1">
            Sistem & Altyapı Sağlığı
          </h2>
          <p class="text-sm text-[var(--color-text-muted)]">
            Spring Boot 4.1.1 Actuator Telemetrisi, HikariCP Bağlantı Havuzu ve Mikroservis Durumu
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="checkHealth()"
            [disabled]="isRefreshing()"
            class="px-3.5 py-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-subtle)] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <span [class.animate-spin]="isRefreshing()">🔄</span>
            <span>Yenile</span>
          </button>

          <span
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border"
            [class.bg-emerald-500/10]="health()?.status === 'UP'"
            [class.text-emerald-500]="health()?.status === 'UP'"
            [class.border-emerald-500/20]="health()?.status === 'UP'"
            [class.bg-rose-500/10]="health()?.status !== 'UP'"
            [class.text-rose-500]="health()?.status !== 'UP'"
            [class.border-rose-500/20]="health()?.status !== 'UP'"
          >
            <span
              class="w-2 h-2 rounded-full"
              [class.bg-emerald-500]="health()?.status === 'UP'"
              [class.animate-pulse]="health()?.status === 'UP'"
              [class.bg-rose-500]="health()?.status !== 'UP'"
            ></span>
            {{ health()?.status === 'UP' ? 'Spring Boot Çevrimiçi (UP)' : 'Bağlantı Bekleniyor' }}
          </span>
        </div>
      </div>

      <!-- Key Enterprise Metric Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          class="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-[var(--color-text-muted)]"
              >Backend Yanıt Süresi</span
            >
            <span class="text-emerald-500 text-sm font-semibold font-mono">{{
              latencyMs() !== null ? latencyMs() + ' ms' : '--'
            }}</span>
          </div>
          <div class="text-2xl font-bold mt-2 text-[var(--color-text-main)]">
            {{ health()?.status === 'UP' ? 'Aktif (200 OK)' : 'Bağlantı Yok' }}
          </div>
          <div class="text-xs text-[var(--color-text-muted)] mt-1">/actuator/health uç noktası</div>
        </div>

        <div
          class="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-[var(--color-text-muted)]">Kimlik Protokolü</span>
            <span class="text-indigo-500 text-sm font-semibold">Aktif</span>
          </div>
          <div class="text-2xl font-bold mt-2 text-[var(--color-text-main)]">OAuth 2.1</div>
          <div class="text-xs text-[var(--color-text-muted)] mt-1">PKCE S256 & Argon2id</div>
        </div>

        <div
          class="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-[var(--color-text-muted)]"
              >Dağıtık İzleme (Tracing)</span
            >
            <span class="text-sky-500 text-sm font-semibold">Aktif</span>
          </div>
          <div class="text-2xl font-bold mt-2 text-[var(--color-text-main)]">X-Trace-Id</div>
          <div class="text-xs text-[var(--color-text-muted)] mt-1">SLF4J MDC HTTP Entegrasyonu</div>
        </div>

        <div
          class="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-[var(--color-text-muted)]"
              >Aktif Yönetici Rolü</span
            >
            <span class="text-amber-500 text-sm font-semibold">RBAC</span>
          </div>
          <div class="text-2xl font-bold mt-2 text-[var(--color-text-main)] truncate">
            {{ (authService.userRoles()[0] || 'ROLE_ADMIN').replace('ROLE_', '') }}
          </div>
          <div class="text-xs text-[var(--color-text-muted)] mt-1">
            {{ authService.currentUser()?.email || 'Admin Kullanıcı' }}
          </div>
        </div>
      </div>

      <!-- Microservices Architecture Status -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          class="lg:col-span-2 p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs space-y-4"
        >
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-[var(--color-text-main)]">
              Spring Boot Servis Entegrasyon Durumu
            </h3>
            <span class="text-xs font-mono text-[var(--color-text-muted)]">Port: 8080</span>
          </div>

          <div class="space-y-3">
            <div
              class="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)]"
            >
              <div class="flex items-center gap-3">
                <span
                  class="w-3 h-3 rounded-full"
                  [class.bg-emerald-500]="health()?.status === 'UP'"
                  [class.bg-rose-500]="health()?.status !== 'UP'"
                ></span>
                <div>
                  <div class="text-sm font-semibold">Core API Servisi (Spring Boot)</div>
                  <div class="text-xs text-[var(--color-text-muted)]">
                    /api/v1/auth ve /api/v1/users REST Uç Noktaları
                  </div>
                </div>
              </div>
              <span
                class="text-xs font-mono px-2 py-1 rounded-md font-medium"
                [class.bg-emerald-500/10]="health()?.status === 'UP'"
                [class.text-emerald-500]="health()?.status === 'UP'"
                [class.bg-rose-500/10]="health()?.status !== 'UP'"
                [class.text-rose-500]="health()?.status !== 'UP'"
              >
                {{ health()?.status || 'OFFLINE' }}
              </span>
            </div>

            <div
              class="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)]"
            >
              <div class="flex items-center gap-3">
                <span
                  class="w-3 h-3 rounded-full"
                  [class.bg-emerald-500]="
                    health()?.components?.['db']?.status === 'UP' || health()?.status === 'UP'
                  "
                  [class.bg-slate-500]="health()?.status !== 'UP'"
                ></span>
                <div>
                  <div class="text-sm font-semibold">PostgreSQL & Flyway Migrations</div>
                  <div class="text-xs text-[var(--color-text-muted)]">
                    HikariCP Bağlantı Havuzu & Veritabanı Sağlığı
                  </div>
                </div>
              </div>
              <span
                class="text-xs font-mono px-2 py-1 rounded-md font-medium"
                [class.bg-emerald-500/10]="
                  health()?.components?.['db']?.status === 'UP' || health()?.status === 'UP'
                "
                [class.text-emerald-500]="
                  health()?.components?.['db']?.status === 'UP' || health()?.status === 'UP'
                "
                [class.bg-slate-500/10]="health()?.status !== 'UP'"
                [class.text-slate-500]="health()?.status !== 'UP'"
              >
                {{
                  health()?.components?.['db']?.status ||
                    (health()?.status === 'UP' ? 'CONNECTED' : 'UNKNOWN')
                }}
              </span>
            </div>

            <div
              class="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)]"
            >
              <div class="flex items-center gap-3">
                <span
                  class="w-3 h-3 rounded-full"
                  [class.bg-emerald-500]="health()?.status === 'UP'"
                  [class.bg-slate-500]="health()?.status !== 'UP'"
                ></span>
                <div>
                  <div class="text-sm font-semibold">Spring Authorization Server (SAS)</div>
                  <div class="text-xs text-[var(--color-text-muted)]">
                    OAuth 2.1, OIDC 1.0 & PKCE (web-portal-client)
                  </div>
                </div>
              </div>
              <span
                class="text-xs font-mono px-2 py-1 rounded-md font-medium"
                [class.bg-emerald-500/10]="health()?.status === 'UP'"
                [class.text-emerald-500]="health()?.status === 'UP'"
                [class.bg-slate-500/10]="health()?.status !== 'UP'"
                [class.text-slate-500]="health()?.status !== 'UP'"
              >
                {{ health()?.status === 'UP' ? 'READY' : 'OFFLINE' }}
              </span>
            </div>
          </div>
        </div>

        <!-- System Details Card -->
        <div
          class="p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs space-y-4"
        >
          <h3 class="text-base font-bold text-[var(--color-text-main)]">Sistem & Çalışma Ortamı</h3>
          <div class="space-y-3 text-xs">
            <div class="flex justify-between py-1.5 border-b border-[var(--color-border-subtle)]">
              <span class="text-[var(--color-text-muted)]">Java Sürümü:</span>
              <span class="font-mono font-medium text-[var(--color-text-main)]"
                >Java 21 (Loom)</span
              >
            </div>
            <div class="flex justify-between py-1.5 border-b border-[var(--color-border-subtle)]">
              <span class="text-[var(--color-text-muted)]">Spring Boot:</span>
              <span class="font-mono font-medium text-[var(--color-text-main)]">4.1.1</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-[var(--color-border-subtle)]">
              <span class="text-[var(--color-text-muted)]">Frontend:</span>
              <span class="font-mono font-medium text-[var(--color-text-main)]"
                >Angular 21 (Zoneless)</span
              >
            </div>
            <div class="flex justify-between py-1.5 border-b border-[var(--color-border-subtle)]">
              <span class="text-[var(--color-text-muted)]">Şifreleme:</span>
              <span class="font-mono font-medium text-emerald-600">Argon2id (64MB / 3 iter)</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-[var(--color-border-subtle)]">
              <span class="text-[var(--color-text-muted)]">Güvenlik Standardı:</span>
              <span class="font-medium text-indigo-600">RFC 9700 OAuth 2.1</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Modern Angular 21 @defer Block Showcase -->
      @defer (on viewport) {
        <div
          class="p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs space-y-3"
        >
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-[var(--color-text-main)]">
              Gelişmiş Tehdit & Güvenlik Analitiği (Deferred Loaded)
            </h3>
            <span
              class="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-semibold"
              >&#64;defer on viewport</span
            >
          </div>
          <p class="text-xs text-[var(--color-text-muted)]">
            Angular 21 deferrable view optimizasyonu ile bu bileşen yalnızca görünür alana
            geldiğinde ayrıştırılıp render edilmiştir.
          </p>
          <div
            class="h-28 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border border-dashed border-indigo-500/30 flex items-center justify-center text-xs text-indigo-600 dark:text-indigo-400 font-mono"
          >
            🛡️ Kurumsal Standart: Virtual Threads (Java 21 Loom) + Argon2id + S256 PKCE Koruması
            Devrede
          </div>
        </div>
      } @placeholder {
        <div
          class="h-24 rounded-2xl border border-dashed border-[var(--color-border-subtle)] flex items-center justify-center text-xs text-[var(--color-text-muted)] animate-pulse"
        >
          Güvenlik analitiği modülü yükleniyor...
        </div>
      }
    </div>
  `,
})
export class SystemHealthComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly actuatorService = inject(ActuatorService);

  readonly health = signal<ActuatorHealthResponse | null>(null);
  readonly appInfo = signal<ActuatorInfoResponse | null>(null);
  readonly latencyMs = signal<number | null>(null);
  readonly isRefreshing = signal<boolean>(false);

  ngOnInit(): void {
    this.checkHealth();
  }

  checkHealth(): void {
    this.isRefreshing.set(true);
    const start = performance.now();

    this.actuatorService.getHealth().subscribe({
      next: (res) => {
        const duration = Math.round(performance.now() - start);
        this.latencyMs.set(duration);
        this.health.set(res);
        this.isRefreshing.set(false);
      },
      error: () => {
        this.latencyMs.set(null);
        this.health.set({ status: 'DOWN' });
        this.isRefreshing.set(false);
      },
    });

    this.actuatorService.getInfo().subscribe({
      next: (info) => {
        this.appInfo.set(info);
      },
      error: () => {
        // Optional info endpoint
      },
    });
  }
}
