import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/services/toast.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  const requiredRoles = (route.data?.['roles'] as string[]) ?? [];

  if (requiredRoles.length === 0 || authService.hasAnyRole(requiredRoles)) {
    return true;
  }

  toastService.error('Bu sayfaya erişim için gerekli role sahip değilsiniz.', 'Yetki Yetersiz');
  return router.createUrlTree(['/dashboard']);
};
