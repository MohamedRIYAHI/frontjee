import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Guard qui empêche l'accès à la route /auth si l'utilisateur est déjà authentifié
 * Redirige vers /home si l'utilisateur est authentifié
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // L'utilisateur est déjà authentifié, rediriger vers la page d'accueil
    router.navigate(['/home']);
    return false;
  }

  // L'utilisateur n'est pas authentifié, autoriser l'accès à /auth
  return true;
};

