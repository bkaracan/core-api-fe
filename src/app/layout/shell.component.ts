import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div
      class="min-h-screen bg-[var(--color-bg-subtle)] text-[var(--color-text-main)] flex flex-col font-sans transition-colors duration-200"
    >
      <!-- Enterprise Top Navigation Bar -->
      <header
        class="h-16 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs backdrop-blur-md"
      >
        <div class="flex items-center gap-3">
          <div class="relative flex items-center justify-center">
            <img
              src="/images/becomer-icon.png"
              alt="Becomer Logo"
              class="w-9 h-9 object-contain drop-shadow-md"
            />
          </div>
          <div>
            <h1 class="text-base font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500 dark:from-indigo-400 dark:via-purple-400 dark:to-emerald-400 bg-clip-text text-transparent">
              Becomer
            </h1>
            <p class="text-[11px] text-[var(--color-text-muted)] hidden sm:block font-medium">
              Kimlik & Davranışsal Dönüşüm
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- Theme Switcher -->
          <button
            type="button"
            (click)="themeService.toggleTheme()"
            class="p-2 rounded-lg border border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-subtle)] transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer"
            [title]="themeService.currentTheme() === 'dark' ? 'Açık Moda Geç' : 'Koyu Moda Geç'"
          >
            @if (themeService.currentTheme() === 'dark') {
              <span>☀️</span>
              <span class="text-xs hidden md:inline">Açık</span>
            } @else {
              <span>🌙</span>
              <span class="text-xs hidden md:inline">Koyu</span>
            }
          </button>

          <!-- Current User Profile Info -->
          @if (authService.currentUser(); as user) {
            <div class="flex items-center gap-3 pl-3 border-l border-[var(--color-border-subtle)]">
              <div
                class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-center text-xs"
              >
                {{ user.firstName[0] || 'U' }}{{ user.lastName[0] || 'P' }}
              </div>
              <div class="hidden sm:block text-left text-xs">
                <div class="font-semibold leading-tight">
                  {{ user.firstName }} {{ user.lastName }}
                </div>
                <div class="text-[var(--color-text-muted)]">{{ user.email }}</div>
              </div>
              <button
                type="button"
                (click)="authService.logout()"
                class="ml-2 text-xs px-2.5 py-1.5 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
              >
                Çıkış
              </button>
            </div>
          }
        </div>
      </header>

      <!-- Main Shell Body (Sidebar + Content) -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Sidebar Navigation -->
        <aside
          class="w-64 border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4 flex flex-col justify-between hidden md:flex"
        >
          <div class="space-y-6">
            <!-- User Workspace Section -->
            <div>
              <div
                class="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]"
              >
                Kişisel Alan
              </div>
              <nav class="space-y-1" aria-label="Kullanıcı Menüsü">
                <!-- Programım Menüsü ve Alt Sekmeleri -->
                <div class="space-y-0.5">
                  <a
                    routerLink="/dashboard"
                    [queryParams]="{ tab: 'program' }"
                    class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                    [class.bg-indigo-50]="isDashboardActive()"
                    [class.dark:bg-indigo-950/50]="isDashboardActive()"
                    [class.text-indigo-600]="isDashboardActive()"
                    [class.dark:text-indigo-400]="isDashboardActive()"
                    [class.font-semibold]="isDashboardActive()"
                    [class.text-[var(--color-text-muted)]]="!isDashboardActive()"
                    [class.hover:bg-[var(--color-bg-subtle)]]="!isDashboardActive()"
                    [class.hover:text-[var(--color-text-main)]]="!isDashboardActive()"
                  >
                    <span class="text-base">📅</span>
                    <span>Programım</span>
                  </a>

                  <!-- Programım Alt Sekmeleri -->
                  <div class="pl-4 ml-3 border-l-2 border-indigo-500/20 space-y-0.5 pt-0.5">
                    <a
                      routerLink="/dashboard"
                      [queryParams]="{ tab: 'program' }"
                      class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                      [class.bg-indigo-50]="isCurrentTab('program')"
                      [class.dark:bg-indigo-950/50]="isCurrentTab('program')"
                      [class.text-indigo-600]="isCurrentTab('program')"
                      [class.dark:text-indigo-400]="isCurrentTab('program')"
                      [class.font-semibold]="isCurrentTab('program')"
                      [class.text-[var(--color-text-muted)]]="!isCurrentTab('program')"
                      [class.hover:bg-[var(--color-bg-subtle)]]="!isCurrentTab('program')"
                      [class.hover:text-[var(--color-text-main)]]="!isCurrentTab('program')"
                    >
                      <span class="text-xs">📋</span>
                      <span>Günün Alışkanlıkları</span>
                    </a>

                    <a
                      routerLink="/dashboard"
                      [queryParams]="{ tab: 'identities' }"
                      class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                      [class.bg-indigo-50]="isCurrentTab('identities')"
                      [class.dark:bg-indigo-950/50]="isCurrentTab('identities')"
                      [class.text-indigo-600]="isCurrentTab('identities')"
                      [class.dark:text-indigo-400]="isCurrentTab('identities')"
                      [class.font-semibold]="isCurrentTab('identities')"
                      [class.text-[var(--color-text-muted)]]="!isCurrentTab('identities')"
                      [class.hover:bg-[var(--color-bg-subtle)]]="!isCurrentTab('identities')"
                      [class.hover:text-[var(--color-text-main)]]="!isCurrentTab('identities')"
                    >
                      <span class="text-xs">🧬</span>
                      <span>Kimlik Matrisi</span>
                    </a>

                    <a
                      routerLink="/dashboard"
                      [queryParams]="{ tab: 'tiers' }"
                      class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                      [class.bg-indigo-50]="isCurrentTab('tiers')"
                      [class.dark:bg-indigo-950/50]="isCurrentTab('tiers')"
                      [class.text-indigo-600]="isCurrentTab('tiers')"
                      [class.dark:text-indigo-400]="isCurrentTab('tiers')"
                      [class.font-semibold]="isCurrentTab('tiers')"
                      [class.text-[var(--color-text-muted)]]="!isCurrentTab('tiers')"
                      [class.hover:bg-[var(--color-bg-subtle)]]="!isCurrentTab('tiers')"
                      [class.hover:text-[var(--color-text-main)]]="!isCurrentTab('tiers')"
                    >
                      <span class="text-xs">🏆</span>
                      <span>Kategori Rozetleri</span>
                    </a>
                  </div>
                </div>

                <a
                  routerLink="/users/profile"
                  routerLinkActive="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold"
                  class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-main)] transition-colors"
                >
                  <span class="text-base">⚙️</span>
                  <span>Profil & Güvenlik</span>
                </a>
              </nav>
            </div>

            <!-- Admin Infrastructure Section (Only visible for ROLE_ADMIN) -->
            @if (authService.hasRole('ROLE_ADMIN')) {
              <div>
                <div
                  class="px-3 mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-indigo-500"
                >
                  <span>Yönetim & Sistem</span>
                  <span class="px-1.5 py-0.2 rounded bg-indigo-500/10 text-[9px]">Admin</span>
                </div>
                <nav class="space-y-1" aria-label="Admin Menüsü">
                  <a
                    routerLink="/admin/system-health"
                    routerLinkActive="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold"
                    class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-main)] transition-colors"
                  >
                    <span class="text-base">🖥️</span>
                    <span>Sistem Sağlığı</span>
                  </a>

                  <a
                    routerLink="/users"
                    routerLinkActive="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold"
                    [routerLinkActiveOptions]="{ exact: true }"
                    class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-main)] transition-colors"
                  >
                    <span class="text-base">👥</span>
                    <span>Kullanıcı Yönetimi</span>
                  </a>
                </nav>
              </div>
            }
          </div>

          <!-- User Status Footer -->
          <div
            class="p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] text-xs space-y-2"
          >
            <div class="flex items-center justify-between text-[var(--color-text-muted)]">
              <span>Yetki Düzeyi:</span>
              <span class="font-semibold font-mono text-indigo-600 dark:text-indigo-400">
                {{ authService.hasRole('ROLE_ADMIN') ? 'Sistem Yöneticisi' : 'Atomik Üye' }}
              </span>
            </div>
            <div class="flex items-center justify-between text-[var(--color-text-muted)]">
              <span>Hedef Felsefe:</span>
              <span class="font-medium text-emerald-600 dark:text-emerald-400"
                >Her Gün %1 Kaizen</span
              >
            </div>
          </div>
        </aside>

        <!-- Dynamic Routed Content -->
        <main class="flex-1 overflow-y-auto p-6 md:p-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class ShellComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  readonly router = inject(Router);

  isDashboardActive(): boolean {
    return this.router.url.startsWith('/dashboard');
  }

  isCurrentTab(tab: string): boolean {
    const url = this.router.url;
    if (!url.startsWith('/dashboard')) return false;
    const urlTree = this.router.parseUrl(url);
    const currentTab = urlTree.queryParams['tab'] || 'program';
    return currentTab === tab;
  }

  ngOnInit(): void {
    if (!this.authService.currentUser() && this.authService.isAuthenticated()) {
      this.authService.fetchCurrentUser().subscribe({
        error: () => {
          this.authService.logout();
        },
      });
    }
  }
}
