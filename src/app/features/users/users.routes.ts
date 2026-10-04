import { Routes } from '@angular/router';
import { roleGuard } from '@core/guards/role.guard';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    data: { roles: ['ROLE_ADMIN'] },
    loadComponent: () => import('./user-list/user-list.component').then((m) => m.UserListComponent)
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./user-profile/user-profile.component').then((m) => m.UserProfileComponent)
  }
];

