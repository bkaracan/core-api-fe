import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(toast: Omit<Toast, 'id'>): void {
    const id = crypto.randomUUID();
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000
    };

    this.toasts.update((items) => [...items, newToast]);

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, newToast.duration);
    }
  }

  success(message: string, title = 'Başarılı'): void {
    this.show({ type: 'success', title, message });
  }

  error(message: string, title = 'Hata'): void {
    this.show({ type: 'error', title, message });
  }

  warning(message: string, title = 'Uyarı'): void {
    this.show({ type: 'warning', title, message });
  }

  info(message: string, title = 'Bilgi'): void {
    this.show({ type: 'info', title, message });
  }

  remove(id: string): void {
    this.toasts.update((items) => items.filter((t) => t.id !== id));
  }
}
