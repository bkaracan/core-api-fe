import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActuatorHealthResponse, ActuatorInfoResponse, ActuatorMetricResponse } from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class ActuatorService {
  private readonly http = inject(HttpClient);

  getHealth(): Observable<ActuatorHealthResponse> {
    return this.http.get<ActuatorHealthResponse>('/actuator/health');
  }

  getInfo(): Observable<ActuatorInfoResponse> {
    return this.http.get<ActuatorInfoResponse>('/actuator/info');
  }

  getMetric(metricName: string): Observable<ActuatorMetricResponse> {
    return this.http.get<ActuatorMetricResponse>(`/actuator/metrics/${metricName}`);
  }
}
