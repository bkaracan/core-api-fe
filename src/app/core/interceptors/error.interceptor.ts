import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/services/toast.service';
import { ProblemDetail } from '@core/models/problem-detail.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        // Attempt to parse RFC 7807 Problem Detail
        const problem: Partial<ProblemDetail> =
          typeof error.error === 'object' && error.error !== null
            ? (error.error as Partial<ProblemDetail>)
            : {
                title: error.statusText || 'Sunucu Hatası',
                detail: error.message,
                status: error.status
              };

        const traceId = problem.traceId || error.headers?.get('X-Trace-Id') || 'N/A';
        const status = error.status;

        switch (status) {
          case 401: {
            toastService.error('Oturum süreniz doldu veya yetkisiz erişim. Lütfen tekrar giriş yapın.');
            authService.logout();
            break;
          }
          case 403: {
            toastService.error(
              problem.detail || 'Bu kaynağa erişim yetkiniz bulunmamaktadır.',
              '403 Yetkisiz Erişim'
            );
            break;
          }
          case 400: {
            if (problem.errors && problem.errors.length > 0) {
              const fieldErrors = problem.errors
                .map((p) => `${p.field}: ${p.message}`)
                .join(', ');
              toastService.warning(fieldErrors, `Doğrulama Hatası (${problem.errorCode || '400'})`);
            } else if (problem.invalidParams && problem.invalidParams.length > 0) {
              const fieldErrors = problem.invalidParams
                .map((p) => `${p.name}: ${p.reason}`)
                .join(', ');
              toastService.warning(fieldErrors, 'Doğrulama Hatası (400)');
            } else {
              toastService.warning(problem.detail || 'Geçersiz istek gönderildi.', 'Hatalı İstek');
            }
            break;
          }
          case 404: {
            toastService.info(problem.detail || 'İstenen kaynak bulunamadı.', 'Bulunamadı (404)');
            break;
          }
          case 500:
          case 502:
          case 503:
          case 504: {
            toastService.error(
              `${problem.detail || 'Sunucu tarafında beklenmeyen bir hata oluştu.'} (Trace: ${traceId})`,
              'Sistem Hatası'
            );
            break;
          }
          default: {
            toastService.error(
              problem.detail || `Beklenmeyen bir hata oluştu: HTTP ${status}`,
              'Hata'
            );
          }
        }
      }

      return throwError(() => error);
    })
  );
};
