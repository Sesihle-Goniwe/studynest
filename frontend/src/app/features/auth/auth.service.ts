import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { filter, take } from 'rxjs/operators';

export interface OnboardingData {
  university: string;
  course: string;
  year: number;
  fullName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private currentUser = new BehaviorSubject<User | null>(null);
  private isOnboarded = new BehaviorSubject<boolean | null>(null);
  private isLoading = new BehaviorSubject<boolean>(true);
  private initialSessionResolved = new BehaviorSubject<boolean>(false);

  // Observable streams
  public currentUser$ = this.currentUser.asObservable();
  public isOnboarded$ = this.isOnboarded.asObservable();
  public isLoading$ = this.isLoading.asObservable();

  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      environment.supabaseOptions
    );

    // Initialize auth state listener
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        this.handleAuthChange(session?.user ?? null);
      } else if (event === 'SIGNED_OUT') {
        this.handleSignOut();
      }
    });

    // Load initial user state
    this.loadInitialUser();
  }

  getCurrentUser(): User | null {
    return this.currentUser.value;
  }

  getUserDisplayName(): string | null {
    const user = this.currentUser.value;
    return (
      user?.user_metadata?.['full_name'] ||
      user?.user_metadata?.['name'] ||
      user?.email ||
      null
    );
  }

  /**
   * Retrieves the current active access token.
   * Auto-refreshes if needed via Supabase client.
   */
  async getAccessToken(): Promise<string | null> {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session?.access_token || null;
  }

  /**
   * Awaits until initial session resolution is complete.
   * Crucial for route guards preventing flash-redirect to /login on F5 refresh.
   */
  async waitForInitialSession(): Promise<User | null> {
    if (this.initialSessionResolved.value) {
      return this.currentUser.value;
    }
    await firstValueFrom(
      this.initialSessionResolved.pipe(
        filter(resolved => resolved === true),
        take(1)
      )
    );
    return this.currentUser.value;
  }

  // Handle authentication state changes purely in state (no navigation)
  private handleAuthChange(user: User | null): void {
    this.currentUser.next(user);
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
      this.isOnboarded.next(null);
    }
  }

  private handleSignOut(): void {
    this.currentUser.next(null);
    this.isOnboarded.next(null);
    localStorage.removeItem('currentUser');
  }

  private async loadInitialUser(): Promise<void> {
    this.isLoading.next(true);
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      if (error) throw error;
      const user = session?.user ?? null;
      this.currentUser.next(user);
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Error loading initial session:', error);
      this.currentUser.next(null);
    } finally {
      this.isLoading.next(false);
      this.initialSessionResolved.next(true);
    }
  }

  /**
   * Check onboarding status through the backend API.
   * Caches the result in this.isOnboarded state.
   */
  async checkOnboardingStatus(): Promise<boolean> {
    if (this.isOnboarded.value !== null) {
      return this.isOnboarded.value;
    }

    try {
      const token = await this.getAccessToken();
      if (!token) return false;

      const response = await firstValueFrom(
        this.http.get<{ isOnboarded: boolean }>(`${this.apiUrl}/students/me/status`)
      );
      const status = Boolean(response?.isOnboarded);
      this.isOnboarded.next(status);
      return status;
    } catch (error) {
      console.error('Error checking onboarding status from backend:', error);
      return false;
    }
  }

  async signInWithGoogle() {
    return this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth-callback`,
        queryParams: {
          prompt: 'select_account'
        }
      }
    });
  }

  async signInWithMicrosoft(): Promise<void> {
    this.isLoading.next(true);
    try {
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/auth-callback`,
          scopes: 'openid email profile',
          queryParams: {
            prompt: 'select_account'
          }
        }
      });
      if (error) throw error;
    } finally {
      this.isLoading.next(false);
    }
  }

  /**
   * Submit onboarding data via the backend POST /students/onboard endpoint.
   */
  async completeOnboarding(profileData: OnboardingData): Promise<any> {
    this.isLoading.next(true);
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; student: any }>(
          `${this.apiUrl}/students/onboard`,
          profileData
        )
      );
      this.isOnboarded.next(true);
      return response;
    } catch (error) {
      console.error('Onboarding completion error:', error);
      throw error;
    } finally {
      this.isLoading.next(false);
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    this.isLoading.next(true);
    try {
      await this.supabase.auth.signOut();
      this.handleSignOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      this.isLoading.next(false);
    }
  }
}
