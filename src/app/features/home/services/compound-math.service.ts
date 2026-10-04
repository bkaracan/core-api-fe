import { Injectable, computed, signal } from '@angular/core';
import { SimulationDataPoint } from '../models/behavioral-habit.model';

@Injectable({
  providedIn: 'root',
})
export class CompoundMathService {
  /**
   * Daily improvement percentage (e.g. 1.0 for +1% per day)
   */
  readonly dailyChangeRate = signal<number>(1.0);

  /**
   * Time horizon in days (default: 365 days / 1 year)
   */
  readonly horizonDays = signal<number>(365);

  /**
   * Multiplier result for compounding improvement: (1 + r)^n
   */
  readonly compoundMultiplier = computed(() => {
    const rate = this.dailyChangeRate() / 100;
    const days = this.horizonDays();
    if (rate >= 0) {
      return Math.pow(1 + rate, days);
    } else {
      return Math.pow(1 + rate, days);
    }
  });

  /**
   * Multiplier result if one declines by that rate: (1 - r)^n
   */
  readonly declineMultiplier = computed(() => {
    const absRate = Math.abs(this.dailyChangeRate()) / 100;
    const days = this.horizonDays();
    return Math.max(0.001, Math.pow(1 - absRate, days));
  });

  /**
   * Linear comparison (simple arithmetic addition: 1 + r*n)
   */
  readonly linearMultiplier = computed(() => {
    const rate = this.dailyChangeRate() / 100;
    const days = this.horizonDays();
    return Math.max(0, 1 + rate * days);
  });

  /**
   * Multiplier formatted as clean string (e.g. "37.78x")
   */
  readonly formattedCompoundMultiplier = computed(() => {
    const val = this.compoundMultiplier();
    if (val >= 1000) {
      return `${val.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}×`;
    }
    return `${val.toFixed(2)}×`;
  });

  /**
   * Decline multiplier formatted (e.g. "0.03x")
   */
  readonly formattedDeclineMultiplier = computed(() => {
    const val = this.declineMultiplier();
    return `${val.toFixed(2)}×`;
  });

  /**
   * Percentage gain or loss
   */
  readonly percentageChange = computed(() => {
    const val = this.compoundMultiplier();
    return ((val - 1) * 100).toFixed(0);
  });

  /**
   * Key milestones across the 365-day year
   */
  readonly simulationCurve = computed<SimulationDataPoint[]>(() => {
    const rate = this.dailyChangeRate() / 100;
    const absRate = Math.abs(this.dailyChangeRate()) / 100;
    const milestones = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 365];

    return milestones.map((day) => ({
      day,
      compound: Number(Math.pow(1 + rate, day).toFixed(2)),
      linear: Number(Math.max(0, 1 + rate * day).toFixed(2)),
      decline: Number(Math.max(0.01, Math.pow(1 - absRate, day)).toFixed(2)),
    }));
  });

  /**
   * SVG Path generator for chart visualization
   * Width: 500, Height: 240, Padding: 20
   */
  readonly svgPaths = computed(() => {
    const points = this.simulationCurve();
    const width = 500;
    const height = 240;
    const pad = 24;

    const maxDay = 365;
    // Cap visual max to ensure the exponential curve stays visually aesthetic in the chart viewBox
    const maxVal = Math.max(40, this.compoundMultiplier());

    const toX = (day: number) => pad + (day / maxDay) * (width - 2 * pad);
    const toY = (val: number) => {
      // Logarithmic scaling for smooth visualization of huge compound multipliers
      const normalized = Math.log10(val + 0.1) / Math.log10(maxVal + 0.1);
      const clamped = Math.min(1, Math.max(0, normalized));
      return height - pad - clamped * (height - 2 * pad);
    };

    // Compound Curve
    const compoundPathD = points
      .map(
        (p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.day).toFixed(1)} ${toY(p.compound).toFixed(1)}`,
      )
      .join(' ');

    // Linear Path
    const linearPathD = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.day).toFixed(1)} ${toY(p.linear).toFixed(1)}`)
      .join(' ');

    // Decline Path
    const declinePathD = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.day).toFixed(1)} ${toY(p.decline).toFixed(1)}`)
      .join(' ');

    // Baseline (1.0 constant line)
    const baselineY = toY(1.0);
    const baselinePathD = `M ${pad} ${baselineY.toFixed(1)} L ${width - pad} ${baselineY.toFixed(1)}`;

    // Compound Area Gradient Fill
    const compoundAreaD = `${compoundPathD} L ${toX(365)} ${height - pad} L ${toX(0)} ${height - pad} Z`;

    return {
      compoundPath: compoundPathD,
      compoundArea: compoundAreaD,
      linearPath: linearPathD,
      declinePath: declinePathD,
      baselinePath: baselinePathD,
      currentEndY: toY(this.compoundMultiplier()),
      baselineY,
    };
  });

  setRate(rate: number): void {
    const clamped = Math.max(-1.5, Math.min(2.5, rate));
    this.dailyChangeRate.set(Number(clamped.toFixed(1)));
  }

  setPreset(preset: 'kaizen_1' | 'kaizen_micro' | 'kaizen_high' | 'decline_1'): void {
    switch (preset) {
      case 'kaizen_1':
        this.setRate(1.0);
        break;
      case 'kaizen_micro':
        this.setRate(0.5);
        break;
      case 'kaizen_high':
        this.setRate(1.5);
        break;
      case 'decline_1':
        this.setRate(-1.0);
        break;
    }
  }
}
