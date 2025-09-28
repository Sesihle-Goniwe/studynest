import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

// Mock environment
jest.mock('../../../environments/environment', () => ({
  environment: {
    supabaseUrl: 'https://mock-url.supabase.co',
    supabaseKey: 'mock-key'
  }
}));

const mockUser: User = {
  id: '123',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    name: 'Test User'
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2023-01-01',
} as User;

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
    signInWithOAuth: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
  from: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let router: Router;
  let formBuilder: FormBuilder;
  let supabaseClient: jest.Mocked<SupabaseClient>;

  beforeEach(() => {
    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        FormBuilder,
        {
          provide: Router,
          useValue: {
            navigate: jest.fn()
          }
        }
      ]
    });

    service = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    formBuilder = TestBed.inject(FormBuilder);
    supabaseClient = mockSupabase as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize Supabase client', () => {
      expect(createClient).toHaveBeenCalledWith(
        environment.supabaseUrl,
        environment.supabaseKey
      );
    });
  });

  describe('Form Creation', () => {
    it('should create onboarding form with validation', () => {
      const form = service.createOnboardingForm();

      expect(form).toBeTruthy();
      expect(form.contains('university')).toBe(true);
      expect(form.contains('course')).toBe(true);
      expect(form.contains('year')).toBe(true);

      // Test validation
      expect(form.get('university')?.hasError('required')).toBe(true);
      expect(form.get('course')?.hasError('required')).toBe(true);
      expect(form.get('year')?.hasError('required')).toBe(true);
    });
  });

  describe('User Management', () => {
    it('should get current user', () => {
      // Access private property for testing (not ideal but works)
      (service as any).currentUser.next(mockUser);
      
      const result = service.getCurrentUser();
      expect(result).toEqual(mockUser);
    });

    it('should get user display name - full_name', () => {
      (service as any).currentUser.next(mockUser);
      
      const displayName = service.getUserDisplayName();
      expect(displayName).toBe('Test User');
    });

    it('should get user display name - email fallback', () => {
      const userWithoutName = { ...mockUser, user_metadata: {} };
      (service as any).currentUser.next(userWithoutName);
      
      const displayName = service.getUserDisplayName();
      expect(displayName).toBe('test@example.com');
    });

    it('should return null for display name when no user', () => {
      (service as any).currentUser.next(null);
      
      const displayName = service.getUserDisplayName();
      expect(displayName).toBeNull();
    });
  });

  describe('Authentication Methods', () => {
    it('should sign in with Google', async () => {
      const mockResponse = { data: { user: mockUser }, error: null };
      supabaseClient.auth.signInWithOAuth.mockResolvedValue(mockResponse as any);

      const result = await service.signInWithGoogle();

      expect(supabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth-callback`,
          queryParams: {
            prompt: 'select_account'
          }
        }
      });
      expect(result).toEqual(mockResponse);
    });

    it('should sign in with Microsoft', async () => {
      const mockResponse = { error: null };
      supabaseClient.auth.signInWithOAuth.mockResolvedValue(mockResponse as any);

      await service.signInWithMicrosoft();

      expect(supabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/auth-callback`,
          scopes: 'openid email profile',
          queryParams: {
            prompt: 'select_account'
          }
        }
      });
    });

    it('should handle Microsoft sign in error', async () => {
      const mockError = new Error('Sign in failed');
      supabaseClient.auth.signInWithOAuth.mockRejectedValue(mockError);

      await expect(service.signInWithMicrosoft()).rejects.toThrow('Sign in failed');
    });
  });

  describe('Onboarding', () => {
    it('should complete onboarding successfully', async () => {
      (service as any).currentUser.next(mockUser);
      
      const profileData = {
        university: 'Test University',
        course: 'Computer Science',
        year: 2
      };

      const mockUpsertResponse = { error: null };
      supabaseClient.from.mockReturnValue({
        upsert: jest.fn().mockResolvedValue(mockUpsertResponse)
      } as any);

      await service.completeOnboarding(profileData);

      expect(supabaseClient.from).toHaveBeenCalledWith('students');
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should throw error when completing onboarding without user', async () => {
      (service as any).currentUser.next(null);
      
      const profileData = {
        university: 'Test University',
        course: 'Computer Science',
        year: 2
      };

      await expect(service.completeOnboarding(profileData))
        .rejects.toThrow('No authenticated user');
    });

    it('should handle onboarding completion error', async () => {
      (service as any).currentUser.next(mockUser);
      
      const profileData = {
        university: 'Test University',
        course: 'Computer Science',
        year: 2
      };

      const mockError = new Error('Database error');
      supabaseClient.from.mockReturnValue({
        upsert: jest.fn().mockRejectedValue(mockError)
      } as any);

      await expect(service.completeOnboarding(profileData))
        .rejects.toThrow('Database error');
    });
  });

  describe('Sign Out', () => {
    it('should sign out successfully', async () => {
      const mockResponse = { error: null };
      supabaseClient.auth.signOut.mockResolvedValue(mockResponse);

      await service.signOut();

      expect(supabaseClient.auth.signOut).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should handle sign out error', async () => {
      const mockError = new Error('Sign out failed');
      supabaseClient.auth.signOut.mockRejectedValue(mockError);

      await expect(service.signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('Observables', () => {
    it('should expose currentUser$ observable', (done) => {
      service.currentUser$.subscribe(user => {
        expect(user).toBeNull(); // Initial state
        done();
      });
    });

    it('should expose isLoading$ observable', (done) => {
      service.isLoading$.subscribe(loading => {
        expect(loading).toBe(false); // Initial state
        done();
      });
    });
  });

  describe('Private Methods (via public interface)', () => {
    it('should check onboarding status - completed', async () => {
      const mockData = {
        university: 'Test Uni',
        course: 'Test Course',
        year: 2
      };
      
      supabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockData, error: null })
          })
        })
      } as any);

      const result = await (service as any).checkOnboardingStatus('123');
      expect(result).toBe(true);
    });

    it('should check onboarding status - not completed', async () => {
      const mockData = {
        university: 'Test Uni',
        course: null, // Missing course
        year: 2
      };
      
      supabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockData, error: null })
          })
        })
      } as any);

      const result = await (service as any).checkOnboardingStatus('123');
      expect(result).toBe(false);
    });
  });
});