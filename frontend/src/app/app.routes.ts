import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout';
import { CallbackComponent } from './features/auth/callback.component';
import { Home } from './features/home/home';
import { Profile } from './features/profile/profile';
import { authGuard, onboardingGuard } from './guards/auth.guard';

export const routes: Routes = [
  // --- Public Unprotected Routes ---
  {
    path: '',
    pathMatch: 'full',
    component: Home,
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () => import('./features/signup/signup.component').then(m => m.SignupComponent),
  },
  {
    path: 'auth-callback',
    component: CallbackComponent,
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about-us/about-us').then(m => m.AboutUsComponent),
  },

  // --- Onboarding Route (Requires auth session, blocks if already completed) ---
  {
    path: 'onboarding',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () => import('./features/onboarding/onboarding.component').then(m => m.OnboardingComponent),
  },

  // --- Protected Routes (Requires auth session + completed onboarding) ---
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard, onboardingGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'students',
        loadComponent: () => import('./features/students/students').then(m => m.StudentsList),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile').then(m => m.Profile),
      },
      {
        path: 'profile/:userId',
        component: Profile,
      },
      {
        path: 'studygroup',
        loadComponent: () => import('./features/studygroup/studygroup').then(m => m.StudygroupComponent),
      },
      {
        path: 'progress',
        loadComponent: () => import('./features/progress/progress').then(m => m.ProgressTracker),
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications').then(m => m.NotificationsList),
      },
      {
        path: 'viewGroups/:groupId',
        loadComponent: () => import('./features/group-session/group-session').then(m => m.GroupSession),
      },
      {
        path: 'matches',
        loadComponent: () => import('./features/matches/matches').then(m => m.Matches),
      },
      {
        path: 'groupChats/:groupId',
        loadComponent: () => import('./features/group-chats/group-chats.component').then(m => m.GroupChatsComponent),
      },
    ],
  },

  // Fallback
  {
    path: '**',
    redirectTo: '',
  },
];
