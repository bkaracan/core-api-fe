import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ActuatorService } from './actuator.service';

describe('ActuatorService', () => {
  let service: ActuatorService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ActuatorService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ActuatorService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should query health endpoint', () => {
    service.getHealth().subscribe((res) => {
      expect(res.status).toBe('UP');
    });

    const req = httpTesting.expectOne('/actuator/health');
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'UP' });
  });

  it('should query info endpoint', () => {
    service.getInfo().subscribe((res) => {
      expect(res.app?.name).toBe('core-api-service');
    });

    const req = httpTesting.expectOne('/actuator/info');
    expect(req.request.method).toBe('GET');
    req.flush({ app: { name: 'core-api-service' } });
  });
});
