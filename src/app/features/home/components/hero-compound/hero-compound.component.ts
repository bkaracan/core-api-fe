import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CompoundMathService } from '../../services/compound-math.service';
import { HabitFlowScrollService } from '../../services/habit-flow-scroll.service';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-hero-compound',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hero-compound.component.html',
  styleUrl: './hero-compound.component.scss',
})
export class HeroCompoundComponent {
  readonly math = inject(CompoundMathService);
  readonly scrollService = inject(HabitFlowScrollService);
  readonly authService = inject(AuthService);

  onSliderInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.math.setRate(parseFloat(input.value));
  }

  scrollToKaizen(): void {
    this.scrollService.scrollToSection('kaizen');
  }
}
