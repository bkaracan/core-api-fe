import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '@env/environment';

export const apiPrefixInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('/api') || (!req.url.startsWith('http://') && !req.url.startsWith('https://') && !req.url.startsWith('./') && !req.url.startsWith('assets/'))) {
    const cleanBase = environment.apiUrl.replace(/\/+$/, '');
    const cleanUrl = req.url.startsWith('/') ? req.url : `/${req.url}`;
    const modifiedReq = req.clone({
      url: `${cleanBase}${cleanUrl}`
    });
    return next(modifiedReq);
  }

  return next(req);
};
