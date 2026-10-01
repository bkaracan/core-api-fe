import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./user-list/user-list.component').then((m) => m.UserListComponent)
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./user-profile/user-profile.component').then((m) => m.UserProfileComponent)
  }
];
