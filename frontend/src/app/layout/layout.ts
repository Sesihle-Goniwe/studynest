import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router'; // Import RouterOutlet
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet], // Make sure RouterOutlet is imported
  templateUrl: './layout.html',
  styleUrls: ['./layout.scss']
})
export class LayoutComponent {
  sidebarOpen = false;

  constructor(private router: Router) {}

  // All your navigation methods live here now
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
    this.sidebarOpen = false; // Close sidebar on navigation
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
    this.sidebarOpen = false;
  }

  goToNotification(): void {
    this.router.navigate(['/notifications']);
    this.sidebarOpen = false;
  }
  goToMatches(): void {
    this.router.navigate(['/matches']);
    this.sidebarOpen = false;
  }
  goToProgress(): void {
    this.router.navigate(['/progress']);
    this.sidebarOpen = false;
  }
  goToStudyGroups(): void {
    this.router.navigate(['/studygroup']);
    this.sidebarOpen = false;
  }
}