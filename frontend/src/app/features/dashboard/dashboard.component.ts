import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import {Notifications, _Notifications } from '../../services/notifications';
import {Dashboard} from '../../services/dashboard'; 
import { UpcomingEventsService, ClubEvent } from '../../services/upcoming-events.service';
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
  unreadCount = 0; 
  
  notifications: _Notifications[] = []

  upcomingEvents: ClubEvent[] = [];
  isLoadingEvents = true;
  eventsError: string | null = null;

  constructor(
    private authser: AuthService,
    private router: Router,
    private notSer: Notifications,
    private userSer: Dashboard,
    private eventsService: UpcomingEventsService
  ) {}

  ngOnInit() 
  {
    const user = this.authser.getCurrentUser();
    if (user && !sessionStorage.getItem('dashboardRefreshed')) {
    sessionStorage.setItem('dashboardRefreshed', 'true');
    location.reload(); 
    location.reload(); 
    return; 
  }
    if (user) {
      this.userID = user.id;
      this.displayName = this.authser.getUserDisplayName();
      if (this.displayName) 
        {
        this.userSer.updateUserName(this.userID, this.displayName).subscribe();
      }

      
    }
    
    this.loadNotifications();
    this.loadUpcomingEvents();
  }

  loadUpcomingEvents(): void {
    this.isLoadingEvents = true;
    this.eventsService.getStudyEvents().subscribe({
      next: (data) => {
        this.upcomingEvents = data;
        this.isLoadingEvents = false;
      },
      error: (err) => {
        console.error('Failed to load upcoming events', err);
        this.eventsError = 'Could not load events at this time.';
        this.isLoadingEvents = false;
      }
    });
  }


loadNotifications()
{
  const user = this.authser.getCurrentUser();
    const uid = user?.id;
    if(uid)
    {
      this.notSer.getNotificationsByUser(uid).subscribe({
          next: (data) => {
            this.notifications = data;
            this.unreadCount = this.notifications.filter(n => !n.read).length;
          },
          error: (err) => console.error('Failed to load notifications', err)
        });
  }
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
  /*
  dismissNotification(id: number) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }
*/

  viewAllNotifications() {
    this.router.navigate(['/notifications']);
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

  goToStudyPartner(){
    this.router.navigate(['/matches']);
  }
  
}
