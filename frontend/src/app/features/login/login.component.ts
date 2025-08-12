// src/app/features/login/login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
// src/app/features/login/login.component.ts (original working version)
export class LoginComponent {
  googleLoading = false;
  microsoftLoading = false;
  constructor(
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}


  async onGoogleLogin() {
    this.googleLoading = true;
    try {
      await this.authService.signInWithGoogle();
    } catch (error) {
      this.snackBar.open('Google login failed', 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.googleLoading = false;
    }
  }

  async onMicrosoftLogin() {
    this.microsoftLoading = true;
    try {
      await this.authService.signInWithMicrosoft();
    } catch (error) {
      this.snackBar.open('Microsoft login failed', 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.microsoftLoading = false;
    }
  }


  navigateToSignup() {
    this.router.navigate(['/signup']);
  }
}