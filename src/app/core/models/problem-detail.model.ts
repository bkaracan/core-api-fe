export interface ValidationError {
  field: string;
  rejectedValue?: unknown;
  message: string;
}

export interface InvalidParam {
  name: string;
  reason: string;
}

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errorCode?: string;
  errors?: ValidationError[];
  invalidParams?: InvalidParam[];
  traceId?: string;
  timestamp?: string;
}
