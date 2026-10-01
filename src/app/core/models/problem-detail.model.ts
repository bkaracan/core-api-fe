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
  invalidParams?: InvalidParam[];
  traceId?: string;
  timestamp?: string;
}
