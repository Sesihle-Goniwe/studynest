import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private currentUser = new BehaviorSubject<User | null>(null);
  private isLoading = new BehaviorSubject<boolean>(false);

  // Observable streams
  public currentUser$ = this.currentUser.asObservable();
  public isLoading$ = this.isLoading.asObservable();

  constructor(private router: Router, private fb: FormBuilder) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    // Initialize auth state listener
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        this.handleAuthChange(session?.user ?? null);
      } else if (event === 'SIGNED_OUT') {
        this.handleSignOut();
      }
    });

    // Load initial user state
    this.loadInitialUser();
  }

  // Initialize the onboarding form with validation
  createOnboardingForm() {
    return this.fb.group({
      university: ['', Validators.required],
      course: ['', Validators.required],
      year: [null, [Validators.required, Validators.min(1)]]
    });
  }

  getCurrentUser(): User | null {
  return this.currentUser.value;
}

getUserDisplayName () : string | null{
    const user = this.currentUser.value;


    return(
      user?.user_metadata?.['full_name'] ||
      user?.user_metadata?.['name'] ||
      user?.email ||
      null
    );
}

  // Handle authentication state changes
  private async handleAuthChange(user: User | null) 
  {
    this.currentUser.next(user);
     if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('currentUser');
  }
    
    if (user) {
      // For new users, redirect to onboarding
      const isNewUser = await this.checkIsNewUser(user.id);
      if (isNewUser) {
        this.router.navigate(['/onboarding']);
      } 
    }
  }

  private handleSignOut() {
    this.currentUser.next(null);
    localStorage.removeItem('currentUser'); // ensure user cleared
    this.router.navigate(['/login']);
  }

private async loadInitialUser() {
  this.isLoading.next(true);
  try {
    // Try to restore from localStorage first
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      this.currentUser.next(JSON.parse(stored));
    } else {
      // Fallback: get from Supabase session
      const { data: { user }, error } = await this.supabase.auth.getUser();
      if (error) throw error;
      this.currentUser.next(user);
      if (user) localStorage.setItem('currentUser', JSON.stringify(user));
    }
  } catch (error) {
    console.error('Error loading initial user:', error);
  } finally {
    this.isLoading.next(false);
  }
}


  private async checkIsNewUser(userId: string): Promise<boolean> {
    if (!userId) return true;
    
    try {
      const { data, error } = await this.supabase
        .from('students')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      return !data;
    } catch (error) {
      return true;
    }
  }

  // Check if user has completed onboarding
  public async checkOnboardingStatus(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('students')
        .select('university, course, year')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return !!data?.university && !!data?.course && !!data?.year;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
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

  async completeOnboarding(profileData: {
    university: string;
    course: string;
    year: number;
  }): Promise<void> {
    this.isLoading.next(true);
    const user = this.currentUser.value;
    
    if (!user) {
      this.isLoading.next(false);
      throw new Error('No authenticated user');
    }

    try {
      const { error } = await this.supabase.from('students').upsert({
        user_id: user.id,
        email: user.email,
        university: profileData.university,
        course: profileData.course,
        year: profileData.year,
        created_at: new Date(),
        updated_at: new Date()
      });

      if (error) throw error;
      this.router.navigate(['/dashboard']);
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
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      this.handleSignOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      this.isLoading.next(false);
    }
  }
}