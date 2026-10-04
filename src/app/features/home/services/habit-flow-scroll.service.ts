import { Injectable, signal, OnDestroy } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HabitFlowScrollService implements OnDestroy {
  readonly activeSection = signal<string>('hero');
  private observer?: IntersectionObserver;

  initObserver(sectionIds: string[]): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    this.disconnect();

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.activeSection.set(entry.target.id);
          }
        });
      },
      {
        root: null,
        rootMargin: '-20% 0px -50% 0px',
        threshold: [0.1, 0.5],
      },
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        this.observer?.observe(el);
      }
    });
  }

  scrollToSection(sectionId: string): void {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(sectionId);
    if (el) {
      const yOffset = -72; // Header offset
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
