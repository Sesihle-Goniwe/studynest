import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../auth/auth.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MatSnackBarModule],
  template: `
    <form [formGroup]="onboardingForm" (ngSubmit)="onSubmit()">
      <input formControlName="university" placeholder="University">
      <div *ngIf="onboardingForm.get('university')?.invalid && onboardingForm.get('university')?.touched">
        University is required
      </div>

      <input formControlName="course" placeholder="Course">
      <div *ngIf="onboardingForm.get('course')?.invalid && onboardingForm.get('course')?.touched">
        Course is required
      </div>

      <input formControlName="year" type="number" placeholder="Year">
      <div *ngIf="onboardingForm.get('year')?.invalid && onboardingForm.get('year')?.touched">
        Valid year is required
      </div>

      <button type="submit" [disabled]="onboardingForm.invalid || loading">
        {{ loading ? 'Saving...' : 'Submit' }}
      </button>
    </form>
  `,
  styles: [`
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 400px;
      margin: 2rem auto;
    }
    input {
      padding: 0.5rem;
    }
    div {
      color: red;
      font-size: 0.8rem;
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class OnboardingComponent {
  onboardingForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.onboardingForm = this.fb.group({
      university: ['', Validators.required],
      course: ['', Validators.required],
      year: [null, [Validators.required, Validators.min(1)]]
    });
  }

  async onSubmit() {
    if (this.onboardingForm.invalid) return;

    this.loading = true;
    try {
      await this.authService.completeOnboarding(this.onboardingForm.value);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Onboarding error:', error);
      this.snackBar.open('Failed to save onboarding data', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.loading = false;
    }
  }
}