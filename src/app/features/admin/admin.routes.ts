import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'system-health',
    pathMatch: 'full',
  },
  {
    path: 'system-health',
    loadComponent: () =>
      import('./system-health/system-health.component').then((m) => m.SystemHealthComponent),
  },
];
