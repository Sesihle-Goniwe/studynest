import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, of, throwError, Subscription } from 'rxjs';
import { CallbackComponent } from './callback.component';
import { AuthService } from './auth.service';
import { User } from '@supabase/supabase-js';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

// Mock User
const mockUser: User = {
  id: '123',
  email: 'test@example.com',
  user_metadata: { full_name: 'Test User' },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2023-01-01',
} as User;

describe('CallbackComponent', () => {
  let component: CallbackComponent;
  let fixture: ComponentFixture<CallbackComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  let currentUserSubject: BehaviorSubject<User | null>;

  beforeEach(async () => {
    currentUserSubject = new BehaviorSubject<User | null>(null);

    const authServiceSpy = jasmine.createSpyObj('AuthService', ['checkOnboardingStatus'], {
      currentUser$: currentUserSubject.asObservable()
    });

    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        MatProgressSpinnerModule,
        NoopAnimationsModule,
        CallbackComponent
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CallbackComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  afterEach(() => {
    currentUserSubject.complete();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should show loading spinner initially', () => {
      fixture.detectChanges();
      const spinner = fixture.nativeElement.querySelector('mat-spinner');
      const loadingText = fixture.nativeElement.querySelector('p');
      
      expect(spinner).toBeTruthy();
      expect(loadingText.textContent).toContain('Completing login...');
    });
  });

  describe('Successful Authentication Flow', () => {
    it('should redirect to dashboard when user is onboarded', fakeAsync(() => {
      authService.checkOnboardingStatus.and.returnValue(Promise.resolve(true));
      
      // Trigger user authentication
      currentUserSubject.next(mockUser);
      fixture.detectChanges();
      
      tick(); // Advance timer for async operations
      
      expect(authService.checkOnboardingStatus).toHaveBeenCalledWith('123');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard', { replaceUrl: true });
      expect(component.error).toBeNull();
    }));

    it('should redirect to onboarding when user is not onboarded', fakeAsync(() => {
      authService.checkOnboardingStatus.and.returnValue(Promise.resolve(false));
      
      // Trigger user authentication
      currentUserSubject.next(mockUser);
      fixture.detectChanges();
      
      tick(); // Advance timer for async operations
      
      expect(authService.checkOnboardingStatus).toHaveBeenCalledWith('123');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/onboarding', { replaceUrl: true });
      expect(component.error).toBeNull();
    }));
  });

  describe('Error Handling', () => {
    it('should handle null user by redirecting to login', fakeAsync(() => {
      // Trigger null user (authentication failed)
      currentUserSubject.next(null);
      fixture.detectChanges();
      
      tick();
      
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      expect(component.error).toBeNull();
    }));

    it('should handle onboarding check error', fakeAsync(() => {
      const error = new Error('Database error');
      authService.checkOnboardingStatus.and.returnValue(Promise.reject(error));
      
      // Trigger user authentication
      currentUserSubject.next(mockUser);
      fixture.detectChanges();
      
      tick();
      
      expect(authService.checkOnboardingStatus).toHaveBeenCalledWith('123');
      expect(snackBar.open).toHaveBeenCalledWith(
        'Error verifying your account status',
        'Close',
        {
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
      expect(router.navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
    }));

    it('should handle authentication error', fakeAsync(() => {
      // Create a new component instance with error scenario
      const errorSubject = new BehaviorSubject<User | null>(null);
      const errorAuthService = jasmine.createSpyObj('AuthService', [], {
        currentUser$: throwError(() => new Error('Auth failed'))
      });

      TestBed.overrideProvider(AuthService, { useValue: errorAuthService });
      
      const errorFixture = TestBed.createComponent(CallbackComponent);
      const errorComponent = errorFixture.componentInstance;
      errorFixture.detectChanges();
      
      tick();
      
      expect(errorComponent.error).toBe('Login failed. Please try again.');
      expect(snackBar.open).toHaveBeenCalledWith(
        'Login failed. Please try again.',
        'Close',
        {
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
      expect(router.navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
      
      errorFixture.destroy();
    }));
  });

  describe('Timeout Functionality', () => {
    it('should show timeout message after 10 seconds', fakeAsync(() => {
      fixture.detectChanges(); // Component initialized
      
      // Initially no error
      expect(component.error).toBeNull();
      
      // Advance time by 10 seconds
      tick(10000);
      
      expect(component.error).toBe('Login is taking longer than expected...');
      
      // Verify the message is displayed in template
      fixture.detectChanges();
      const errorElement = fixture.nativeElement.querySelector('.error-message');
      expect(errorElement.textContent).toContain('Login is taking longer than expected...');
    }));

    it('should not show timeout message if authentication completes quickly', fakeAsync(() => {
      authService.checkOnboardingStatus.and.returnValue(Promise.resolve(true));
      
      fixture.detectChanges(); // Component initialized
      
      // Complete authentication quickly (before timeout)
      currentUserSubject.next(mockUser);
      tick(5000); // 5 seconds - less than timeout
      
      expect(component.error).toBeNull();
      
      // Advance past timeout - should not set error because auth completed
      tick(5000); // Total 10 seconds
      
      expect(component.error).toBeNull();
    }));
  });

  describe('Template Rendering', () => {
    it('should not show error message when no error', () => {
      fixture.detectChanges();
      
      const errorElement = fixture.nativeElement.querySelector('.error-message');
      expect(errorElement).toBeNull();
    });

    it('should show error message when error exists', () => {
      component.error = 'Test error message';
      fixture.detectChanges();
      
      const errorElement = fixture.nativeElement.querySelector('.error-message');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Test error message');
    });

    it('should display loading spinner and text', () => {
      fixture.detectChanges();
      
      const spinner = fixture.nativeElement.querySelector('mat-spinner');
      const loadingText = fixture.nativeElement.querySelector('p:not(.error-message)');
      
      expect(spinner).toBeTruthy();
      expect(loadingText.textContent).toBe('Completing login...');
    });
  });

  describe('Subscription Management', () => {
    it('should unsubscribe from auth subscription on destroy', () => {
      fixture.detectChanges();
      
      // Spy on unsubscribe method
      const authSubUnsubscribeSpy = jasmine.createSpyObj('Subscription', ['unsubscribe']);
      const timeoutSubUnsubscribeSpy = jasmine.createSpyObj('Subscription', ['unsubscribe']);
      
      // Replace component subscriptions with spies
      (component as any).authSub = authSubUnsubscribeSpy;
      (component as any).timeoutSub = timeoutSubUnsubscribeSpy;
      
      component.ngOnDestroy();
      
      expect(authSubUnsubscribeSpy.unsubscribe).toHaveBeenCalled();
      expect(timeoutSubUnsubscribeSpy.unsubscribe).toHaveBeenCalled();
    });

    it('should handle ngOnDestroy when subscriptions are undefined', () => {
      // Ensure no errors when subscriptions are undefined
      (component as any).authSub = undefined;
      (component as any).timeoutSub = undefined;
      
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid multiple user emissions by taking only first', fakeAsync(() => {
      authService.checkOnboardingStatus.and.returnValue(Promise.resolve(true));
      
      // Emit multiple users rapidly
      currentUserSubject.next(mockUser);
      currentUserSubject.next({ ...mockUser, id: '456' });
      currentUserSubject.next({ ...mockUser, id: '789' });
      
      fixture.detectChanges();
      tick();
      
      // Should only call with first user due to take(1)
      expect(authService.checkOnboardingStatus).toHaveBeenCalledTimes(1);
      expect(authService.checkOnboardingStatus).toHaveBeenCalledWith('123');
    }));

    it('should handle user with minimal data', fakeAsync(() => {
      const minimalUser = {
        id: 'minimal-123',
        email: null,
        user_metadata: null,
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01',
      } as User;
      
      authService.checkOnboardingStatus.and.returnValue(Promise.resolve(true));
      
      currentUserSubject.next(minimalUser);
      fixture.detectChanges();
      tick();
      
      expect(authService.checkOnboardingStatus).toHaveBeenCalledWith('minimal-123');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard', { replaceUrl: true });
    }));
  });
});