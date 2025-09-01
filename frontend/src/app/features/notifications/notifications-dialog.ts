import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { _Notifications } from '../../services/notifications';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification-dialog',
  imports: [MatDialogModule,CommonModule],
  template: `
    <h2 mat-dialog-title>Notification</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close(true)">Mark as Read</button>
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `
})
export class NotificationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<NotificationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: _Notifications
  ) {}

  close(markAsRead: boolean) {
    this.dialogRef.close(markAsRead);
  }
}
