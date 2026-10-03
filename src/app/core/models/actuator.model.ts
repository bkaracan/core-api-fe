export interface ActuatorComponentHealth {
  status: 'UP' | 'DOWN' | 'OUT_OF_SERVICE' | 'UNKNOWN';
  details?: Record<string, unknown>;
}

export interface ActuatorHealthResponse {
  status: 'UP' | 'DOWN' | 'OUT_OF_SERVICE' | 'UNKNOWN';
  components?: {
    db?: ActuatorComponentHealth;
    diskSpace?: ActuatorComponentHealth;
    ping?: ActuatorComponentHealth;
    livenessState?: ActuatorComponentHealth;
    readinessState?: ActuatorComponentHealth;
    [key: string]: ActuatorComponentHealth | undefined;
  };
}

export interface ActuatorInfoResponse {
  app?: {
    name?: string;
    version?: string;
    description?: string;
  };
  java?: {
    version?: string;
    vendor?: {
      name?: string;
    };
    runtime?: {
      name?: string;
      version?: string;
    };
  };
  os?: {
    name?: string;
    version?: string;
    arch?: string;
  };
  [key: string]: unknown;
}

export interface ActuatorMetricMeasurement {
  statistic: string;
  value: number;
}

export interface ActuatorMetricResponse {
  name: string;
  description: string;
  baseUnit?: string;
  measurements: ActuatorMetricMeasurement[];
  availableTags?: { tag: string; values: string[] }[];
}
