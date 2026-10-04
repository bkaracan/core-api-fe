import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '@core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside
      aria-label="Bildirimler"
      aria-live="polite"
      class="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 transform translate-y-0"
          [ngClass]="{
            'bg-emerald-500/15 border-emerald-500/30 text-emerald-950 dark:text-emerald-200':
              toast.type === 'success',
            'bg-rose-500/15 border-rose-500/30 text-rose-950 dark:text-rose-200':
              toast.type === 'error',
            'bg-amber-500/15 border-amber-500/30 text-amber-950 dark:text-amber-200':
              toast.type === 'warning',
            'bg-sky-500/15 border-sky-500/30 text-sky-950 dark:text-sky-200': toast.type === 'info',
          }"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <h4 class="font-semibold text-sm">{{ toast.title }}</h4>
              <p class="text-xs mt-1 leading-relaxed opacity-90 break-words">{{ toast.message }}</p>
            </div>
            <button
              type="button"
              (click)="toastService.remove(toast.id)"
              aria-label="Kapat"
              class="opacity-60 hover:opacity-100 transition-opacity p-1 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      }
    </aside>
  `,
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
