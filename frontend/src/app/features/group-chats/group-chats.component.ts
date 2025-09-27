import { Component, HostListener, OnInit, AfterViewChecked, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { GroupChatsService, GroupMessage } from '../../services/group-chats.service';
import { Students } from '../../services/students';
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

  private pollingSub!: Subscription;
  @ViewChild('chatMessages') chatMessagesRef!: ElementRef;
  @ViewChild('optionsMenu') optionsMenuRef!: ElementRef;
  @ViewChild('fileInput') fileInputRef!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private groupChatsService: GroupChatsService,
    private studentsService: Students
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

  isEditable(msg: GroupMessageWithProfile): boolean {
    const createdAt = new Date(msg.createdAt).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    return (now - createdAt) <= fiveMinutes && msg.userId === this.currentUserId;
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

  // Options menu
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
    if (menuEl && !menuEl.contains(event.target)) {
      this.selectedMessage = null;
    }
  }

  editMessage(msg: GroupMessageWithProfile) {
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
            };
            this.closeOptionsMenu();
          } else alert('Failed to edit message');
        },
        error: () => alert('HTTP error editing message')
      });
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

  // Inside GroupChatsComponent class

  onAvatarClick(msg: GroupMessageWithProfile) {
    // Example: Open the user's profile in a new tab
    if (msg.userId) {
      // If you have a profile route, you can navigate like this:
      // this.router.navigate(['/profile', msg.userId]);

      // Or simply open in a new tab
      //window.open(`/profile/${msg.userId}`, '_blank');
    }
  }

  toggleUploadMenu() {
    this.showUploadMenu = !this.showUploadMenu;
  }

  triggerFileInput(type: 'image' | 'document') {
    // Here you can filter file types if needed
    const fileInput: HTMLInputElement = this.fileInputRef.nativeElement;
    if (type === 'image') {
      fileInput.accept = 'image/*';
    } else if (type === 'document') {
      fileInput.accept = '.pdf,.doc,.docx,.txt';
    }
    fileInput.click();
    this.showUploadMenu = false;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    console.log('Selected file:', file);

    // TODO: upload the file to your backend or storage
  }

}
