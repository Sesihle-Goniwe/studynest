import { Routes } from '@angular/router';
import { CallbackComponent } from './features/auth/callback.component';
import {Home} from './features/home/home';
import { Profile } from './features/profile/profile';


export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),

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
    },
      {
        path: 'signup',
        loadComponent : ()=> 
            import('./features/signup/signup.component').then(m=>m.SignupComponent)
    },
    {
      path: 'profile',
      loadComponent : ()=>
      import('./features/profile/profile').then(m=>m.Profile)
    },
    {
      path:'studygroup',
      loadComponent : ()=> import('./features/studygroup/studygroup').then(m => m.StudygroupComponent)
    }
    
];