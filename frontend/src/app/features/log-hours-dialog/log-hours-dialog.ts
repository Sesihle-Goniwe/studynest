import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- Angular Material Imports ---
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { RemoveExtensionPipe } from '../../pipes/remove-extension-pipe';


@Component({
  selector: 'app-log-hours-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    RemoveExtensionPipe
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: '../log-hours-dialog/log-hours-dialog.html',
  styleUrls: ['../log-hours-dialog/log-hours-dialog.scss']
})
export class LogHoursDialogComponent {
  showSuccessMessage = false;
  logData = {
    topicId: '',
    date: new Date(),
    hours: 1
  };

  constructor(
    public dialogRef: MatDialogRef<LogHoursDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { topics: any[], selectedTopicId?: string  }
  ) {
    // If a selectedTopicId was passed, use it as the default
    if (data.selectedTopicId) {
      this.logData.topicId = data.selectedTopicId;
    }

  }

  // This method will be called when the Log button is clicked
  submitLog(): void {
    // Show the success message
    this.showSuccessMessage = true;

    // Wait 2 seconds, then close the dialog, passing the data back
    setTimeout(() => {
      this.dialogRef.close(this.logData);
    }, 2000);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
