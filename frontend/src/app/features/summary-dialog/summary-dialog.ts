import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-summary-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule, MarkdownModule],
  templateUrl: './summary-dialog.html',
  styleUrls: ['./summary-dialog.scss']
})
export class SummaryDialogComponent {
  // The data passed to the dialog is an Observable of the summary
  constructor(@Inject(MAT_DIALOG_DATA) public data: { summary$: Observable<{ summary: string }> }) {}
}