import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeroCompoundComponent } from './components/hero-compound/hero-compound.component';
import { KaizenMudaComponent } from './components/kaizen-muda/kaizen-muda.component';
import { HabitLoopShowcaseComponent } from './components/habit-loop-showcase/habit-loop-showcase.component';
import { IdentityMatrixComponent } from './components/identity-matrix/identity-matrix.component';
import { PhilosophyQuoteSliderComponent } from './components/philosophy-quote-slider/philosophy-quote-slider.component';
import { HabitFlowScrollService } from './services/habit-flow-scroll.service';
import { ThemeService } from '@core/services/theme.service';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    HeroCompoundComponent,
    KaizenMudaComponent,
    HabitLoopShowcaseComponent,
    IdentityMatrixComponent,
    PhilosophyQuoteSliderComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly scrollService = inject(HabitFlowScrollService);
  readonly themeService = inject(ThemeService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly navItems = [
    { id: 'hero', label: '%1 Ufku' },
    { id: 'kaizen', label: 'Kaizen (İsraf Yok)' },
    { id: 'laws', label: '4 Alışkanlık Yasası' },
    { id: 'identity', label: 'Kimlik Matrisi' },
    { id: 'metrics', label: 'Metrikler & Bilgelik' }
  ];

  fastEmail: string = '';

  ngOnInit(): void {
    const sectionIds = ['hero', 'kaizen', 'laws', 'identity', 'metrics', 'cta'];
    setTimeout(() => {
      this.scrollService.initObserver(sectionIds);
    }, 100);
  }

  scrollTo(sectionId: string): void {
    this.scrollService.scrollToSection(sectionId);
  }

  onFastSubmit(e: Event): void {
    e.preventDefault();
    if (this.fastEmail) {
      this.router.navigate(['/auth/register'], {
        queryParams: { email: this.fastEmail }
      });
    } else {
      this.router.navigate(['/auth/register']);
    }
  }

  ngOnDestroy(): void {
    this.scrollService.disconnect();
  }
}
