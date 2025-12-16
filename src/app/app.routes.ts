import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home-content/home-content.component').then(m => m.HomeContentComponent)
      },
      {
        path: 'auth',
        loadComponent: () => import('./auth/auth.component').then(m => m.AuthComponent),
        canActivate: [authGuard]
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'health-data',
        loadComponent: () => import('./health-data/health-data.component').then(m => m.HealthDataComponent)
      }
    ]
  }
];
