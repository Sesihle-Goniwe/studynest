/* --- progress.ts ---
  Refactored to use NotesApiService
*/
import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
// Import the service
import { NotesApiService } from '../../services/notes-api.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-progress-tracker',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './progress.html',
  styleUrl: './progress.scss'
})
export class ProgressTracker {
  // --- Properties ---
  completedTopics: { name: string; dateCompleted: Date }[] = [];
  totalHoursStudied = 0;
  selectedFile: File | null = null;
  sidebarOpen = false;
  aiExtractedText: string | null = null;
  uploadStatus: string | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // --- Constructor ---
  // Inject your new service here instead of HttpClient
  constructor(
    private notesApiService: NotesApiService,
    private authService: AuthService
  ) {}

  // --- File Selection & Drag-and-Drop ---

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.handleFile(file);
    } else {
      console.log('No file selected');
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.handleFile(file);
      event.dataTransfer.clearData();
    } else {
      console.log('No file dropped');
    }
  }

  /**
   * Centralized method to process the selected/dropped file.
   * It now calls the service to perform the upload.
   * @param file The file to handle.
   */
  private handleFile(file: File) {
    // 3. Get the current user from the AuthService
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.uploadStatus = 'You must be logged in to upload a file.';
      console.error('Upload cancelled: No user is logged in.');
      return; // Stop the function if no user is found
    }
    this.selectedFile = file;
    this.uploadStatus = `Uploading ${file.name}...`;
    console.log('File handled, passing to service:', file.name);

    // Call the service to handle the actual upload logic
    this.notesApiService.uploadNote(file, user.id).subscribe({
      next: (response) => {
        this.uploadStatus = 'Upload successful!';
        console.log('Backend response:', response);
        setTimeout(() => { this.selectedFile = null; this.uploadStatus = null; }, 3000);
      },
      error: (err) => {
        this.uploadStatus = 'Upload failed. Please try again.';
        console.error('Upload error:', err);
        setTimeout(() => { this.selectedFile = null; this.uploadStatus = null; }, 5000);
      }
    });

    // You can also handle the Gemini part here if needed,
    // by reading the file and calling the service method.
    const reader = new FileReader();
    reader.onload = () => {
      const fileText = reader.result as string;
      // Example of calling the Gemini method from the service
      // this.notesApiService.analyzeNoteWithGemini(fileText).subscribe( ... );
    };
    reader.readAsText(file);
  }

  // The uploadFile and sendToGemini methods are no longer needed here!
  // Their logic has been moved to the NotesApiService.
}