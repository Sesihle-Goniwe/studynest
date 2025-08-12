// src/app/features/signup/signup.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../auth/auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
  googleLoading = false;
  microsoftLoading = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  async onGoogleSignup() {
    this.googleLoading = true;
    try {
   await this.authService.signInWithGoogle();
    } catch (error) {
      console.error('Google signup error:', error);
      this.snackBar.open('Google signup failed', 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.googleLoading = false;
    }
  }

  async onMicrosoftSignup() {
    this.microsoftLoading = true;
    try {
       await this.authService.signInWithMicrosoft();

    } catch (error) {
      console.error('Microsoft signup error:', error);
      this.snackBar.open('Microsoft signup failed', 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.microsoftLoading = false;
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}