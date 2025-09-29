import { Component, HostListener, OnInit, AfterViewChecked, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; // ADDED: Import DomSanitizer
import { AuthService } from '../auth/auth.service';
import { GroupChatsService, GroupMessage } from '../../services/group-chats.service';
import { Students } from '../../services/students';
import { NotesApiService } from '../../services/notes-api.service';
import { Subscription, interval } from 'rxjs';

// Extend GroupMessage to include fullName and profileUrl
interface GroupMessageWithProfile extends GroupMessage {
  fullName: string;
  profileUrl: string;
}

@Component({
  selector: 'app-group-chats',
  imports: [CommonModule, FormsModule],
  templateUrl: './group-chats.component.html',
  styleUrls: ['./group-chats.component.scss']
})
export class GroupChatsComponent implements OnInit, AfterViewChecked, OnDestroy {
  messages: GroupMessageWithProfile[] = [];
  newMessage: string = '';
  currentUserId: string = '';
  groupId: string | null = null;
  groupName: string | null = null;
  errorMessage = '';
  showUploadMenu = false;

  selectedMessage: GroupMessageWithProfile | null = null;
  menuX = 0;
  menuY = 0;

  showPdfViewer = false;
  // CHANGED: The type is now SafeResourceUrl to hold the sanitized URL
  pdfSrc: SafeResourceUrl | null = null;

  private pollingSub!: Subscription;
  @ViewChild('chatMessages') chatMessagesRef!: ElementRef;
  @ViewChild('optionsMenu') optionsMenuRef!: ElementRef;
  @ViewChild('fileInput') fileInputRef!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private groupChatsService: GroupChatsService,
    private studentsService: Students,
    private notesApiService: NotesApiService,
    private sanitizer: DomSanitizer // ADDED: Inject the sanitizer service
  ) {}

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('groupId');
    this.groupName = this.route.snapshot.queryParamMap.get('name');

    if (!this.groupId) {
      console.error('Group ID missing from route');
      return;
    }

    const user = this.authService.getCurrentUser();
    if (user) this.currentUserId = user.id;

    this.loadMessages();
    this.startPolling();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    if (this.pollingSub) this.pollingSub.unsubscribe();
  }

  loadMessages(): void {
    if (!this.groupId) return;

    this.groupChatsService.getMessages(this.groupId).subscribe({
      next: async res => {
        if (res.success) {
          const messagesWithProfiles: GroupMessageWithProfile[] = await Promise.all(
            res.messages.map(async msg => {
              try {
                const student = await this.studentsService.getStudentByUid(msg.userId).toPromise();
                return {
                  ...msg,
                  fullName: student?.full_name || 'Unknown',
                  profileUrl: student?.profileImage || 'assets/default-avatar.png'
                } as GroupMessageWithProfile;
              } catch {
                return {
                  ...msg,
                  fullName: 'Unknown',
                  profileUrl: 'assets/default-avatar.png'
                } as GroupMessageWithProfile;
              }
            })
          );
          this.messages = messagesWithProfiles;
        } else {
          this.errorMessage = 'Error loading messages';
        }
      },
      error: () => this.errorMessage = 'Error loading messages'
    });
  }

  sendMessage(): void {
    if (!this.currentUserId || !this.newMessage.trim() || !this.groupId) return;

    this.groupChatsService.sendMessage(this.groupId, this.currentUserId, this.newMessage)
      .subscribe({
        next: res => {
          if (res.success && res.message) {
            this.messages.push({
              ...res.message,
              fullName: 'You',
              profileUrl: 'assets/default-avatar.png'
            } as GroupMessageWithProfile);
            this.newMessage = '';
            setTimeout(() => this.scrollToBottom(), 100);
          } else this.errorMessage = 'Failed to send message';
        },
        error: () => this.errorMessage = 'Error sending message'
      });
  }

  // Helper method to check if message is a file
  isFileMessage(message: GroupMessageWithProfile): boolean {
    return message.messageType === 'file';
  }

  // Helper method to get file icon based on mime type
  getFileIcon(mimeType: string): string {
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('image')) return '🖼️';
    if (mimeType?.includes('document') || mimeType?.includes('word')) return '📝';
    return '📎';
  }

  // Helper method to format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Method to view PDF file from chat
  viewMessageFile(message: GroupMessageWithProfile): void {
    if (!message.fileId) return;

    this.notesApiService.getGroupNoteUrl(message.fileId, this.currentUserId).subscribe({
      next: (response) => {
        // CHANGED: Sanitize the URL to tell Angular it is safe
        this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(response.signedUrl);
        this.showPdfViewer = true;
      },
      error: (err) => {
        console.error('Failed to get PDF URL', err);
        this.errorMessage = 'Failed to load PDF';
      }
    });
  }

  // Method to close PDF viewer
  closePdfViewer(): void {
    this.showPdfViewer = false;
    this.pdfSrc = null;
  }

  // Updated file upload method
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!this.groupId) return;

    console.log('Uploading file:', file.name);

    this.groupChatsService.uploadFileToChat(file, this.currentUserId, this.groupId)
      .subscribe({
        next: (response) => {
          console.log('File uploaded successfully:', response);
          if (response.success) {
            const newMessage = {
              ...response.message,
              fullName: 'You',
              profileUrl: 'assets/default-avatar.png'
            } as GroupMessageWithProfile;
            this.messages.push(newMessage);
            setTimeout(() => this.scrollToBottom(), 100);
          }
        },
        error: (err) => {
          console.error('Error uploading file:', err);
          this.errorMessage = 'Failed to upload file';
        }
      });

    // Clear the input
    input.value = '';
  }

  // Updated to prevent editing file messages and only allow editing text messages within 5 minutes
  isEditable(msg: GroupMessageWithProfile): boolean {
    const createdAt = new Date(msg.createdAt).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    return (now - createdAt) <= fiveMinutes && msg.userId === this.currentUserId && msg.messageType === 'text';
  }

  // Updated to prevent editing file messages
  editMessage(msg: GroupMessageWithProfile) {
    if (msg.messageType === 'file') {
      alert('Cannot edit file messages');
      return;
    }

    const newText = prompt('Edit your message:', msg.message);
    if (!newText || newText.trim() === msg.message) return;

    this.groupChatsService.editMessage(msg.id, this.currentUserId, newText)
      .subscribe({
        next: res => {
          if (res.success && res.message) {
            const index = this.messages.findIndex(m => m.id === msg.id);
            if (index !== -1) this.messages[index] = {
              ...res.message,
              fullName: msg.fullName,
              profileUrl: msg.profileUrl
            } as GroupMessageWithProfile;
            this.closeOptionsMenu();
          } else alert('Failed to edit message');
        },
        error: () => alert('HTTP error editing message')
      });
  }

  scrollToBottom(): void {
    if (this.chatMessagesRef) {
      const el = this.chatMessagesRef.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  startPolling(): void {
    this.pollingSub = interval(5000).subscribe(() => {
      if (this.groupId) this.loadMessages();
    });
  }

  openOptionsMenu(msg: GroupMessageWithProfile, event: MouseEvent) {
    event.stopPropagation();
    this.selectedMessage = msg;
    this.menuX = event.clientX;
    this.menuY = event.clientY;
  }

  closeOptionsMenu() {
    this.selectedMessage = null;
  }

  onMessageRightClick(event: MouseEvent, msg: GroupMessageWithProfile) {
    event.preventDefault();
    this.openOptionsMenu(msg, event);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.selectedMessage) return;
    const menuEl = this.optionsMenuRef?.nativeElement;
    if (menuEl && !menuEl.contains(event.target as Node)) {
      this.selectedMessage = null;
    }
  }

  deleteMessage(msg: GroupMessageWithProfile) {
    if (!confirm('Delete this message?')) return;

    const backup = [...this.messages];
    this.messages = this.messages.filter(m => m.id !== msg.id);

    this.groupChatsService.deleteMessage(msg.id, this.currentUserId)
      .subscribe({
        next: res => {
          if (!res.success) {
            this.messages = backup;
            alert('Failed to delete message');
          } else this.closeOptionsMenu();
        },
        error: () => {
          this.messages = backup;
          alert('HTTP error deleting message');
        }
      });
  }

  onAvatarClick(msg: GroupMessageWithProfile) {
    // Your existing avatar click logic
    if (msg.userId) {
      // Navigate to profile or handle avatar click
    }
  }

  toggleUploadMenu() {
    this.showUploadMenu = !this.showUploadMenu;
  }

  triggerFileInput(type: 'image' | 'document') {
    const fileInput: HTMLInputElement = this.fileInputRef.nativeElement;
    if (type === 'image') {
      fileInput.accept = 'image/*';
    } else if (type === 'document') {
      fileInput.accept = '.pdf,.doc,.docx,.txt';
    }
    fileInput.click();
    this.showUploadMenu = false;
  }
}