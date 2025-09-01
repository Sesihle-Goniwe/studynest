import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

interface Notification {
  id: number;
  type: 'session' | 'message' | 'system';
  message: string;
  time: Date;
  read: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  displayName: string | null = null;
  userID: string | null = null;
  showNotifications = false;
  unreadCount = 3; // Example count
  
  notifications: Notification[] = [
    {
      id: 1,
      type: 'session',
      message: 'Your study session "Advanced Calculus" starts in 30 minutes',
      time: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      read: false
    },
    {
      id: 2,
      type: 'message',
      message: 'Sarah sent you a message in the "Biology 101" group',
      time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: false
    },
    {
      id: 3,
      type: 'system',
      message: 'Your account has been successfully verified',
      time: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      read: true
    },
    {
      id: 4,
      type: 'session',
      message: 'Reminder: "Chemistry Review" session tomorrow at 3 PM',
      time: new Date(Date.now() - 1000 * 60 * 60 * 26), // 26 hours ago
      read: true
    }
  ];

  constructor(private authser: AuthService, private router: Router) {}

  ngOnInit() {
    const user = this.authser.getCurrentUser();
    if (user) {
      this.userID = user.id;
      this.displayName = this.authser.getUserDisplayName();
    }
    
    // Calculate unread count
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  // Toggle notifications dropdown
  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.notifications.forEach(notification => notification.read = true);
    this.unreadCount = 0;
  }

  // Dismiss a single notification
  dismissNotification(id: number) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  // View all notifications (could navigate to a notifications page)
  viewAllNotifications() {
    this.showNotifications = false;
    // this.router.navigate(['/notifications']);
    console.log('Navigate to all notifications page');
  }

  // Close notifications when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-container') && this.showNotifications) {
      this.showNotifications = false;
    }
  }

  async handleSignOut() {
    await this.authser.signOut();
    this.router.navigate(['/']);
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }
  
  goToStudyGroups() {
    this.router.navigate(['/studygroup']);
  }
  
  goToProgress() {
    this.router.navigate(['./progress']);
  }
  
  createSession() {
    console.log('Create session clicked');
    // Implement create session functionality
  }
}
