import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../features/auth/auth.service';

/**
 * Protects routes requiring an authenticated user session.
 * Preserves target route in returnUrl query parameter for post-login redirect.
 */
export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = await authService.waitForInitialSession();
  if (!user) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }
  return true;
};

/**
 * Enforces onboarding completion.
 * - Redirects users with incomplete profiles to /onboarding.
 * - Redirects users with completed profiles away from /onboarding to /dashboard.
 */
export const onboardingGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = await authService.waitForInitialSession();
  if (!user) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  const isOnboarded = await authService.checkOnboardingStatus();
  const isVisitingOnboarding = state.url.startsWith('/onboarding');

  if (isVisitingOnboarding && isOnboarded) {
    return router.createUrlTree(['/dashboard']);
  }

  if (!isVisitingOnboarding && !isOnboarded) {
    return router.createUrlTree(['/onboarding']);
  }

  return true;
};

