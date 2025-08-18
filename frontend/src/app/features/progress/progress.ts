import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-progress-tracker',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './progress.html',
  styleUrl: './progress.scss'
})
export class ProgressTracker {
  constructor(private http: HttpClient) {}

  completedTopics: { name: string; dateCompleted: Date }[] = [];
  totalHoursStudied = 0;
  selectedFile: File | null = null;
  sidebarOpen = false;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  aiExtractedText: string | null = null;

  sendToGemini(fileText: string) {
  const apiKey = 'AIzaSyCUq25Q13Cn0wFxNH6jxUDJiR5_M3YrDZw'; // <-- Replace with your real key
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [
          {
            text: `Extract the main topics, sections, and any study hours mentioned from the following study notes:\n\n${fileText}`
          }
        ]
      }
    ]
  };

  this.http.post<any>(url, body).subscribe({
    next: (response) => {
      // Gemini's response is in response.candidates[0].content.parts[0].text
      this.aiExtractedText = response?.candidates?.[0]?.content?.parts?.[0]?.text || 'No data extracted.';
    },
    error: (err) => {
      this.aiExtractedText = 'Error extracting data from Gemini API.';
      console.error(err);
    }
  });
}
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      console.log('File selected:', this.selectedFile);
      // Read the file as text
      const reader = new FileReader();
      reader.onload = () => {
        const fileText = reader.result as string;
        this.sendToGemini(fileText);
      };
      reader.readAsText(this.selectedFile);
    }
    else {
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
      this.selectedFile = event.dataTransfer.files[0];
      console.log('File dropped:', this.selectedFile);
    }
    else {
      console.log('No file dropped');
    }
  }

  uploadFile() {
    if (!this.selectedFile) return;
    // TODO: Add Supabase upload logic here
    alert(`File "${this.selectedFile.name}" selected for upload.`);
    this.selectedFile = null;
  }
}