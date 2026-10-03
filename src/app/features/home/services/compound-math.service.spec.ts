import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { CompoundMathService } from './compound-math.service';

describe('CompoundMathService', () => {
  let service: CompoundMathService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CompoundMathService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should calculate compound multiplier correctly for +1% daily improvement', () => {
    service.setRate(1.0);
    // 1.01^365 is approximately 37.7834
    expect(service.compoundMultiplier()).toBeCloseTo(37.78, 1);
    expect(service.formattedCompoundMultiplier()).toBe('37.78×');
  });

  it('should calculate decline multiplier correctly for -1% decline', () => {
    service.setRate(-1.0);
    // 0.99^365 is approximately 0.0255
    expect(service.declineMultiplier()).toBeCloseTo(0.03, 1);
  });

  it('should produce SVG paths for visualization', () => {
    service.setRate(1.0);
    const paths = service.svgPaths();
    expect(paths.compoundPath).toBeTruthy();
    expect(paths.baselinePath).toBeTruthy();
    expect(paths.compoundArea).toBeTruthy();
  });

  it('should handle presets correctly', () => {
    service.setPreset('kaizen_micro');
    expect(service.dailyChangeRate()).toBe(0.5);

    service.setPreset('kaizen_high');
    expect(service.dailyChangeRate()).toBe(1.5);
  });
});
