// src/app/features/onboarding/onboarding.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../auth/auth.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatSnackBarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss']
})
export class OnboardingComponent {
  onboardingForm: FormGroup;
  isLoading = false;

  // South African universities
  universities: string[] = [
    'University of Cape Town',
    'University of the Witwatersrand',
    'Stellenbosch University',
    'University of Pretoria',
    'University of Johannesburg',
    'University of KwaZulu-Natal',
    'North-West University',
    'University of the Western Cape',
    'University of South Africa (UNISA)',
    'Rhodes University',
    'University of Limpopo',
    'University of the Free State',
    'Nelson Mandela University',
    'Tshwane University of Technology',
    'Cape Peninsula University of Technology',
    'Durban University of Technology',
    'Vaal University of Technology',
    'Central University of Technology',
    'Mangosuthu University of Technology',
    'University of Zululand'
  ];

  // Common courses offered in South African universities
  courses: string[] = [
    'Accounting',
    'Actuarial Science',
    'Agriculture',
    'Architecture',
    'Biochemistry',
    'Bioinformatics',
    'Business Administration',
    'Chemical Engineering',
    'Civil Engineering',
    'Computer Science',
    'Data Science',
    'Dentistry',
    'Economics',
    'Electrical Engineering',
    'Finance',
    'Information Technology',
    'Law',
    'Marketing',
    'Mechanical Engineering',
    'Medicine',
    'Pharmacy',
    'Physics',
    'Psychology',
    'Statistics',
    'Artificial Intelligence',
    'Cybersecurity',
    'Environmental Science',
    'Entrepreneurship',
    'Industrial Engineering',
    'Human Resource Management',
    'Political Science',
    'Public Health',
    'Social Work',
    'Software Engineering'
  ];

  // Year of study options
  yearsOfStudy: string[] = [
    '1',
    '2',
    '3',
    '4',
    'Honors',
    'Masters',
    'PhD'
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.onboardingForm = this.fb.group({
      university: ['', Validators.required],
      course: ['', Validators.required],
      year: ['', Validators.required]
    });
  }

  private mapYearToNumber(year: string): number {
    const yearMap: { [key: string]: number } = {
      '1': 1,
      '2': 2,
      '3': 3,
      '4': 4,
      'Honors': 5,
      'Masters': 6,
      'PhD': 7
    };
    return yearMap[year] || 1;
  }

  async onSubmit() {
    if (this.onboardingForm.invalid) return;

    const formValue = {
      ...this.onboardingForm.value,
      year: this.mapYearToNumber(this.onboardingForm.value.year)
    };

    this.isLoading = true;
    try {
      await this.authService.completeOnboarding(formValue);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Onboarding error:', error);
      this.snackBar.open('Failed to save onboarding data. Please try again.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isLoading = false;
    }
  }
}
