// src/app/progress-tracker/progress.ts

import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NotesApiService } from '../../services/notes-api.service';
import { AuthService } from '../auth/auth.service';
// 1. Clean up the import - no tokens or @Inject needed
import { ProgressApiService } from '../../services/progress-api.service';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { MatDialog } from '@angular/material/dialog';
import { StatsDialogComponent } from '../stats-dialog/stats-dialog';
import { FormsModule } from '@angular/forms';
import { RemoveExtensionPipe } from '../../pipes/remove-extension-pipe';
import { LogHoursDialogComponent } from '../log-hours-dialog/log-hours-dialog';
import { Chart } from 'chart.js';
import { SummaryDialogComponent } from '../summary-dialog/summary-dialog';
import { Router } from '@angular/router';


@Component({
  selector: 'app-progress-tracker',
  standalone: true,
  imports: [CommonModule, DatePipe, NgxExtendedPdfViewerModule, FormsModule, RemoveExtensionPipe],
  templateUrl: './progress.html',
  styleUrls: ['./progress.scss'] // Corrected from styleUrl to styleUrls
})
export class ProgressTracker implements OnInit {
  // --- Properties ---
  activeTopics: any[] = [];
  selectedFile: File | null = null;
  sidebarOpen = false;
  uploadStatus: string | null = null;
  currentUser: any = null;
  completedTopics: any[] = [];
  totalHoursStudied = 0;
  aiExtractedText: string | null = null;
  pdfSrc: string | null = null; // 3. Property to hold the PDF URL
  showPdfViewer = false;
  studyLogs: any[] = []; // <-- holds the study logs
  userGroups: any[] = [];
  selectedGroup: any = null;
  rankingData: any[] = [];
  public rankingsChart: any;

  
  @ViewChild('rankingsChart') rankingsChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // 2. Simplify the constructor
  constructor(
    private notesApiService: NotesApiService,
    private authService: AuthService,
    private progressApiService: ProgressApiService, // Angular injects it automatically now
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    // Add this console.log for debugging
    console.log('Current user in ngOnInit:', this.currentUser);

    if (this.currentUser && this.currentUser.id) {
      this.loadTopics();
      this.loadStudyLogs(); // Load study logs on init
      this.loadUserGroups();
    } else {
      console.error('No valid user found, cannot fetch topics.');
    }

  }


  loadTopics(): void {
  if (!this.currentUser || !this.currentUser.id) {
    console.error('loadTopics called without a valid user ID.');
    return; 
  }

  this.progressApiService.getTopics(this.currentUser.id).subscribe({
    next: (data: any[]) => {
      // Filter the data into two separate lists
      this.activeTopics = data.filter(topic => topic.status !== 'Completed');
      this.completedTopics = data.filter(topic => topic.status === 'Completed');

      console.log('Active Topics:', this.activeTopics);
      console.log('Completed Topics:', this.completedTopics);
    },
    error: (err: any) => {
      console.error('Failed to load topics:', err);
    }
  });
}

  // --- File Selection & Drag-and-Drop ---

  onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  
  if (input.files?.length) {
    this.selectedFile = input.files[0];
    this.uploadStatus = null;
    console.log(`File selected: ${this.selectedFile.name}`);
    this.cdr.detectChanges();
  }
}
  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files.length) {
      this.selectedFile = event.dataTransfer.files[0];
      this.uploadStatus = null;
      console.log(`File dropped: ${this.selectedFile.name}`);

      this.cdr.detectChanges();
    }
  }
  cancelUpload(): void {
    this.selectedFile = null;
    this.uploadStatus = null;
    console.log('File selection cancelled.');

    this.cdr.detectChanges();
  }

  // 4. Fix the onUpload() method syntax
  onUpload(): void {
    if (!this.selectedFile || !this.currentUser) {
      console.error('Upload cancelled: No file selected or user not logged in.');
      return;
    }
    

    const fileToUpload = this.selectedFile;
    this.uploadStatus = `Uploading ${fileToUpload.name}...`;

    this.notesApiService.uploadNote(fileToUpload, this.currentUser.id).subscribe({
      next: (uploadResponse: any) => {
        this.uploadStatus = 'File upload successful! Creating topic...';
        console.log('File upload response:', uploadResponse);

        const newTopic = {
          name: uploadResponse.data.file_name,
          file_id: uploadResponse.data.id,
          userId: this.currentUser.id
        };
        
        this.progressApiService.createTopic(newTopic).subscribe({
          next: () => {
            this.uploadStatus = 'Topic created successfully!';
            this.loadTopics(); // Refresh the topics list
            setTimeout(() => { this.selectedFile = null; this.uploadStatus = null; }, 3000);
          }, // Added a comma here
          error: (err: any) => {
            this.uploadStatus = 'File uploaded, but failed to create topic.';
            console.error('Topic creation error:', err);
          }
        });
      },
      error: (err: any) => {
        this.uploadStatus = 'Upload failed. Please try again.';
        console.error('Upload error:', err);
      }
    });
  }
  viewTopicPdf(topic: any): void {
    if (!topic.file_id || !this.currentUser?.id) {
      console.log('This topic does not have a file associated with it.');
      return;
    }
    this.notesApiService.getPersonalNoteUrl(topic.file_id, this.currentUser.id).subscribe({
      next: (response) => {
        this.pdfSrc = response.signedUrl;
        this.showPdfViewer = true;
        console.log('PDF URL loaded.');
      },
      error: (err) => {
        console.error('Failed to get PDF URL', err);
        // You could add an error message to the UI here
      }
    });
  }
  // 5. Method to close the viewer
  closePdfViewer(): void {
    this.showPdfViewer = false;
    this.pdfSrc = null;
  }
  openStatsDialog(): void {
    this.dialog.open(StatsDialogComponent, {
      width: '600px',
      data: {
        completedTopics: this.completedTopics,
        totalHoursStudied: this.totalHoursStudied,
        studyLogs: this.studyLogs,
        activeTopics: this.activeTopics
      }
    });
  }
 // Add this method
loadStudyLogs(): void {
  if (!this.currentUser?.id) return;

  this.progressApiService.getStudyLogs(this.currentUser.id).subscribe({
    next: (logs) => {

      console.log('Raw data received from backend:', logs);

      this.studyLogs = logs;
      // Use the .reduce() method to sum all the hours from the logs
      this.totalHoursStudied = this.studyLogs.reduce(
        (total, log) => total + log.hours, 0
      );
      console.log('Study logs loaded, total hours:', this.totalHoursStudied);
    },
    error: (err) => {
      console.error('Failed to load study logs:', err);
    }
  });
}
openLogHoursDialog(topic?: any): void {
    if (this.activeTopics.length === 0) {
      // Optional: handle case where there are no topics to log against
      alert('Please upload a topic before logging hours.');
      return;
    }

    const dialogRef = this.dialog.open(LogHoursDialogComponent, {
      width: '450px',
      data: { 
        topics: this.activeTopics,
        selectedTopicId: topic ? topic.id : null 
       },
      
    });

    dialogRef.afterClosed().subscribe(result => {
      // Check if the user submitted the form (result is not undefined)
      if (result) {
        console.log('The dialog was closed with result:', result);
        // Call the service with the data returned from the dialog
        this.progressApiService.addStudyLog(
          this.currentUser.id,
          result.topicId,
          result.date.toISOString().substring(0, 10), // Format date
          result.hours
        ).subscribe({
          next: () => {
            console.log('Study hours logged successfully!');
            this.loadStudyLogs(); // Refresh logs
          },
          error: (err) => console.error('Failed to log study hours:', err)
        });
      }
    });
  }
  markAsComplete(topic: any): void {
    this.progressApiService.updateTopicStatus(topic.id, 'Completed').subscribe({
      next: () => {
        console.log(`Topic "${topic.name}" marked as complete.`);
        this.loadTopics(); // Refresh the list to show the new status
      },
      error: (err) => console.error('Failed to update topic status:', err)
    });
  }

  deleteTopic(topic: any): void {
    // Add a confirmation dialog to prevent accidental deletion
    if (confirm(`Are you sure you want to delete "${topic.name}"? This process cannot be undone.`)) {
      this.progressApiService.deleteTopic(topic.id).subscribe({
        next: () => {
          console.log(`Topic "${topic.name}" deleted successfully.`);
          this.loadTopics(); // Refresh the list
        },
        error: (err) => console.error('Failed to delete topic:', err)
      });
    }
  }
  loadUserGroups(): void {
    if (!this.currentUser?.id) return;
    this.progressApiService.getUserGroups(this.currentUser.id).subscribe(groups => {
      console.log('Fetched user groups from API:', groups);
      this.userGroups = groups;
      // If the user is in any groups, load the rankings for the first one by default
      if (this.userGroups.length > 0) {
        this.onGroupTabChange(this.userGroups[0]);
      }
    });
  }

  onGroupTabChange(group: any): void {
    this.selectedGroup = group;
    this.progressApiService.getGroupRankings(group.id).subscribe(data => {
      this.rankingData = data;
      this.createRankingsChart();
    });
  }

  // src/app/progress-tracker/progress.ts

  createRankingsChart(): void {
    // 1. Add this check to make sure the canvas is ready
    if (!this.rankingsChartCanvas) {
      // If the canvas isn't available yet, just exit the function.
      // The function will be called again when the user changes tabs.
      return;
    }

    if (this.rankingsChart) {
      this.rankingsChart.destroy();
    }
    
    const labels = this.rankingData.map(d => d.email.split('@')[0]);
    const data = this.rankingData.map(d => d.total_hours);

    const backgroundColors = this.rankingData.map(d => 
      d.user_id === this.currentUser.id ? 'rgba(75, 192, 192, 1)' : 'rgba(54, 162, 235, 0.6)'
    );

    this.rankingsChart = new Chart(this.rankingsChartCanvas.nativeElement, {
      type: 'bar',
      // ... rest of your chart configuration
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Hours Studied',
          data: data,
          backgroundColor: backgroundColors,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, title: { display: true, text: 'Hours' } } }
      }
    });
  }
  summarizeTopic(topic: any): void {
    if (!topic.file_id || !this.currentUser?.id) {
      alert('This topic has no file to summarize.');
      return;
    }
    
    // Show loading state
    const summary$ = this.notesApiService.getSummary(topic.file_id, this.currentUser.id);

    // Open the dialog and pass the Observable to it
    const dialogRef = this.dialog.open(SummaryDialogComponent, {
      width: "1000px",
      data: { summary$ }
    });
    
    // Optional: Add error handling here
    summary$.subscribe({
      error: (err) => {
        console.error('Summarization error details:', err);
        alert(`Failed to generate summary: ${err.error?.message || err.message || 'Unknown error'}`);
        dialogRef.close();
      }
    });
  }

  goToNotification()
  {
      this.router.navigate(['/notifications']);
  }

    goToProfile()
  {
      this.router.navigate(['/profile']);
  }

    goToDashboard()
  {
      this.router.navigate(['/dashboard']);
  }

  
}