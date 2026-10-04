import { HttpInterceptorFn } from '@angular/common/http';

export const traceIdInterceptor: HttpInterceptorFn = (req, next) => {
  const traceId = crypto.randomUUID();
  const modifiedReq = req.clone({
    headers: req.headers.set('X-Trace-Id', traceId),
  });
  return next(modifiedReq);
};
