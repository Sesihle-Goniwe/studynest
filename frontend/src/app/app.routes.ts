import { Routes } from '@angular/router';
import { CallbackComponent } from './features/auth/callback.component';
import {Home} from './features/home/home';
import { noAuthGuard } from './features/auth/auth.guard';


export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
    canActivate: [noAuthGuard]
  },
  {
    path: 'auth-callback',
    component: CallbackComponent
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./features/onboarding/onboarding.component').then(m => m.OnboardingComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
        path: 'students',
        loadComponent : ()=> 
            import('./features/students/students').then(m=>m.StudentsList),
    }
];