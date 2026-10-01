import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[var(--color-bg-subtle)] text-[var(--color-text-main)] flex flex-col font-sans transition-colors duration-200">
      <!-- Enterprise Top Navigation Bar -->
      <header class="h-16 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs backdrop-blur-md">
        <div class="flex items-center gap-4">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20">
            C
          </div>
          <div>
            <h1 class="text-base font-bold tracking-tight">Core Enterprise</h1>
            <p class="text-xs text-[var(--color-text-muted)] hidden sm:block">Microservices Governance Portal</p>
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
              <div class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-center text-xs">
                {{ user.firstName[0] || 'U' }}{{ user.lastName[0] || 'P' }}
              </div>
              <div class="hidden sm:block text-left text-xs">
                <div class="font-semibold leading-tight">{{ user.firstName }} {{ user.lastName }}</div>
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
        <aside class="w-64 border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4 flex flex-col justify-between hidden md:flex">
          <nav class="space-y-1.5" aria-label="Ana Menü">
            <a
              routerLink="/dashboard"
              routerLinkActive="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-main)] transition-colors"
            >
              <span>📊</span>
              <span>Dashboard</span>
            </a>

            <a
              routerLink="/users"
              routerLinkActive="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-main)] transition-colors"
            >
              <span>👥</span>
              <span>Kullanıcı Yönetimi</span>
            </a>

            <a
              routerLink="/users/profile"
              routerLinkActive="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-main)] transition-colors"
            >
              <span>⚙️</span>
              <span>Profil & Güvenlik</span>
            </a>
          </nav>

          <!-- System Status Footer -->
          <div class="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] text-xs space-y-1">
            <div class="flex items-center justify-between text-[var(--color-text-muted)]">
              <span>Ortam:</span>
              <span class="font-mono font-semibold text-emerald-600">PRODUCTION</span>
            </div>
            <div class="flex items-center justify-between text-[var(--color-text-muted)]">
              <span>Protokol:</span>
              <span class="font-mono">OAuth 2.1 PKCE</span>
            </div>
          </div>
        </aside>

        <!-- Dynamic Routed Content -->
        <main class="flex-1 overflow-y-auto p-6 md:p-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class ShellComponent {
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
}
