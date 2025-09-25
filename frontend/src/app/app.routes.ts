import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout'; // Corrected import
import { CallbackComponent } from './features/auth/callback.component';
import { Home } from './features/home/home';

export const routes: Routes = [
  // --- Routes WITHOUT the sidebar ---
  {
    path: '',
    component: Home,
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () => import('./features/signup/signup.component').then(m => m.SignupComponent)
  },
  {
    path: 'auth-callback',
    component: CallbackComponent
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about-us/about-us').then(m => m.AboutUsComponent)
  },
  {
        path: 'dashboard', // It's good practice to keep the dashboard here too
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./features/onboarding/onboarding.component').then(m => m.OnboardingComponent)
  },
  

  // --- Parent route that USES the sidebar layout ---
  {
    path: '',
    component: LayoutComponent,
    children: [
      // --- All routes inside this 'children' array WILL have the sidebar ---
      {
        path: 'students',
        loadComponent: () => import('./features/students/students').then(m => m.StudentsList),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile').then(m => m.Profile)
      },
      {
        path: 'studygroup',
        loadComponent: () => import('./features/studygroup/studygroup').then(m => m.StudygroupComponent)
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
        loadComponent: () => import('./features/matches/matches').then(m => m.Matches)
      },
      {
        path: 'groupChats/:groupId',
        loadComponent: () => import('./features/group-chats/group-chats.component').then(m => m.GroupChatsComponent)
      }
    ]
  }
];