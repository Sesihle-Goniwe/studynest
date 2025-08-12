import { Component, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { Subscription, filter, take, timer } from 'rxjs';
import { User } from '@supabase/supabase-js';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="callback-container">
      <mat-spinner diameter="50"></mat-spinner>
      <p>Completing login...</p>
      <p *ngIf="error" class="error-message">{{ error }}</p>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 20px;
    }
    .error-message {
      color: red;
      margin-top: 20px;
    }
  `]
})
export class CallbackComponent implements OnDestroy {
  error: string | null = null;
  private authSub: Subscription;
  private timeoutSub: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    // Set a timeout in case authentication hangs
    this.timeoutSub = timer(10000).subscribe(() => {
      if (!this.error) {
        this.error = 'Login is taking longer than expected...';
      }
    });

    // Subscribe to auth state changes
    this.authSub = this.authService.currentUser$.pipe(
      filter(user => user !== null), // Only proceed when we have a user
      take(1) // Complete after first emission
    ).subscribe({
      next: (user) => this.handleUserChange(user),
      error: (err) => this.handleError(err)
    });
  }

  private async handleUserChange(user: User | null): Promise<void> {
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const isOnboarded = await this.authService.checkOnboardingStatus(user.id);
      const redirectUrl = isOnboarded ? '/dashboard' : '/onboarding';
      this.router.navigateByUrl(redirectUrl, { replaceUrl: true });
    } catch (err) {
      console.error('Onboarding check failed:', err);
      this.snackBar.open('Error verifying your account status', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  private handleError(error: any): void {
    console.error('Authentication error:', error);
    this.error = 'Login failed. Please try again.';
    this.snackBar.open(this.error, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.timeoutSub?.unsubscribe();
  }
}