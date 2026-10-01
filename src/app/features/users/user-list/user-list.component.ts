import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { UserService } from '@core/services/user.service';
import { UserProfileResponse } from '@core/models';
import { HasRoleDirective } from '@shared/directives/has-role.directive';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HasRoleDirective],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-[var(--color-text-main)]">Kullanıcı Yönetimi</h2>
          <p class="text-sm text-[var(--color-text-muted)]">Sistemdeki aktif kullanıcıları ve rollerini denetleyin.</p>
        </div>

        <div class="flex items-center gap-3">
          <input
            [formControl]="searchControl"
            type="search"
            placeholder="Kullanıcı ara (Ad, E-posta)..."
            class="px-3.5 py-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
          <button
            type="button"
            *appHasRole="'ROLE_ADMIN'"
            class="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
          >
            + Yeni Ekle
          </button>
        </div>
      </div>

      <!-- User Directory Table Card -->
      <div class="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-[var(--color-bg-subtle)] border-b border-[var(--color-border-subtle)] text-[var(--color-text-muted)] text-xs uppercase font-semibold">
              <tr>
                <th scope="col" class="py-3 px-4">Kullanıcı</th>
                <th scope="col" class="py-3 px-4">Durum</th>
                <th scope="col" class="py-3 px-4">Roller</th>
                <th scope="col" class="py-3 px-4">Yerel Parola</th>
                <th scope="col" class="py-3 px-4">Sosyal Giriş</th>
                <th scope="col" class="py-3 px-4 text-right">Kayıt Tarihi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--color-border-subtle)]">
              @for (user of filteredUsers(); track user.publicId) {
                <tr class="hover:bg-[var(--color-bg-subtle)] transition-colors">
                  <td class="py-3.5 px-4">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-center text-xs">
                        {{ user.firstName[0] || 'U' }}{{ user.lastName[0] || 'P' }}
                      </div>
                      <div>
                        <div class="font-medium text-[var(--color-text-main)]">{{ user.firstName }} {{ user.lastName }}</div>
                        <div class="text-xs text-[var(--color-text-muted)]">{{ user.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="py-3.5 px-4">
                    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {{ user.status }}
                    </span>
                  </td>
                  <td class="py-3.5 px-4">
                    <div class="flex flex-wrap gap-1">
                      @for (role of user.roles; track role) {
                        <span class="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 font-mono text-[10px] font-semibold">
                          {{ role }}
                        </span>
                      }
                    </div>
                  </td>
                  <td class="py-3.5 px-4">
                    <span [ngClass]="user.hasLocalPassword ? 'text-emerald-600' : 'text-amber-600'" class="text-xs font-medium">
                      {{ user.hasLocalPassword ? 'Var' : 'Yok' }}
                    </span>
                  </td>
                  <td class="py-3.5 px-4">
                    <div class="flex gap-1">
                      @for (soc of user.socialAccounts; track soc.publicId) {
                        <span class="text-xs font-mono px-1.5 py-0.5 rounded bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]">
                          {{ soc.provider }}
                        </span>
                      }
                      @if (user.socialAccounts.length === 0) {
                        <span class="text-xs text-[var(--color-text-muted)]">-</span>
                      }
                    </div>
                  </td>
                  <td class="py-3.5 px-4 text-right text-xs font-mono text-[var(--color-text-muted)]">
                    {{ user.createdAt | date: 'dd.MM.yyyy' }}
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="py-8 text-center text-xs text-[var(--color-text-muted)]">
                    Kayıtlı kullanıcı bulunamadı.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class UserListComponent implements OnInit {
  private readonly userService = inject(UserService);

  readonly searchControl = new FormControl('');
  readonly users = signal<UserProfileResponse[]>([]);
  readonly filterQuery = signal('');

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((query) => {
        this.filterQuery.set(query || '');
      });

    this.loadUsers();
  }

  loadUsers(): void {
    // Attempt to load current user as initial member, and query users endpoint
    this.userService.getCurrentUser().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.users.set([res.data]);
        }
      }
    });

    this.userService.getUsers().subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.content) {
          this.users.set(res.data.content);
        }
      },
      error: () => {
        // Silently fallback if multi-user query is restricted by role
      }
    });
  }

  filteredUsers(): UserProfileResponse[] {
    const q = this.filterQuery().toLowerCase().trim();
    if (!q) return this.users();

    return this.users().filter(
      (u) =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }
}
