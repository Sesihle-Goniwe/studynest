import { Component, OnInit } from '@angular/core';
import {Notifications, _Notifications } from '../../services/notifications';
import { NotificationDialogComponent } from './notifications-dialog';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/auth.service';
@Component({
  selector: 'app-notifications',
  imports: [CommonModule],
  standalone:true,
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.scss']
})
export class NotificationsList implements OnInit{
  notifications: _Notifications[]=[];
  constructor(private notservice: Notifications , private dialog: MatDialog
    , private authser:AuthService
   ){}

    
ngOnInit(): void 
{
    const user = this.authser.getCurrentUser();
    const uid = user?.id;
    if(uid)
    {
        this.notservice.getNotificationsByUser(uid).subscribe({
        next: (data: _Notifications[]) => {
        this.notifications = data;
  },
  error: (err) => console.error('Failed to fetch notifications', err)
});

  }
  }


  openNotification(notif: _Notifications)
  {
    const dialogRef = this.dialog.open(NotificationDialogComponent, 
      {width: '400px', data: notif}
    );
    dialogRef.afterClosed().subscribe((markAsRead:boolean)=>
    {
      if(markAsRead && !notif.read)
      {
        this.markAsRead(notif.id);
      }
    })
  }

    markAsRead(notificationId: string) {
    this.notservice.markAsRead(notificationId).subscribe({
      next: () => {
      
        const notif = this.notifications.find(n => n.id === notificationId);
        if (notif) 
          {
            notif.read = true;
          }
      },
      error: (err) => console.error('Failed to mark as read', err)
    });
  }

clearNotifications() 
{
  const user = this.authser.getCurrentUser();
  const uid = user?.id;
  if(uid)
  {
  this.notservice.clearNotifications(uid).subscribe({
    next: () => {
      this.notifications = [];
    },
    error: (err) => console.error('Failed to clear notifications', err)
  });
}
}

}
