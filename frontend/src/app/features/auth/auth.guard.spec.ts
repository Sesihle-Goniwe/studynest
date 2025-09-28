import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { noAuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

// Mock AuthService
class MockAuthService {
  currentUser$ = of(null); // Default to no user
}

describe('noAuthGuard', () => {
  let guard: typeof noAuthGuard;
  let authService: MockAuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'dashboard', component: {} as any },
          { path: 'login', component: {} as any }
        ])
      ],
      providers: [
        { provide: AuthService, useClass: MockAuthService }
      ]
    });

    guard = noAuthGuard;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});