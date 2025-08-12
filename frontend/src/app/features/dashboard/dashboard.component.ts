// src/app/features/dashboard/dashboard.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card>
      <mat-card-content>
        <h2>Welcome to your Dashboard</h2>
        <p>You're successfully logged in and onboarded!</p>
      </mat-card-content>
    </mat-card>
  `,
  //styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  constructor(private authService: AuthService) {}
}






// src/app/features/dashboard/dashboard.component.ts
/*import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
//import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  template: `
    <div class="dashboard-container">
      <mat-card class="dashboard-card">
        <mat-card-header>
          <mat-card-title>Welcome to Study Buddy!</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p *ngIf="authService.user$ | async as user">
            You're logged in as: <strong>{{ user.email }}</strong>
          </p>
          <p>This is your dashboard where you'll find study groups, partners, and resources.</p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="warn" (click)="logout()">Logout</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .dashboard-card {
      padding: 20px;
    }
  `]
})
export class DashboardComponent {
  constructor(public authService: AuthService, private router: Router) {}

  async logout() {
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }
}*/
