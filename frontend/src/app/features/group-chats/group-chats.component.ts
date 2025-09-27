import { Component, HostListener, OnInit, AfterViewChecked, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { GroupChatsService, GroupMessage } from '../../services/group-chats.service';
import { Students } from '../../services/students';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-group-chats',
  imports: [CommonModule, FormsModule],
  templateUrl: './group-chats.component.html',
  styleUrls: ['./group-chats.component.scss']
})
export class GroupChatsComponent implements OnInit, AfterViewChecked, OnDestroy {
  messages: GroupMessage[] = [];
  newMessage: string = '';
  currentUserId: string = '';
  groupId: string | null = null;
  groupName: string | null = null;
  errorMessage = '';

  selectedMessage: GroupMessage | null = null;
  menuX = 0;
  menuY = 0;

  private pollingSub!: Subscription;
  @ViewChild('chatMessages') chatMessagesRef!: ElementRef;
  @ViewChild('optionsMenu') optionsMenuRef!: ElementRef;

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
          // Resolve full names for each message
          const messagesWithNames = await Promise.all(res.messages.map(async msg => {
            try {
              const student = await this.studentsService.getStudentByUid(msg.userId).toPromise();
              return { ...msg, fullName: student?.full_name || 'Unknown' };
            } catch {
              return { ...msg, fullName: 'Unknown' };
            }
          }));
          this.messages = messagesWithNames;
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
            this.messages.push(res.message);
            this.newMessage = '';
            setTimeout(() => this.scrollToBottom(), 100);
          } else this.errorMessage = 'Failed to send message';
        },
        error: () => this.errorMessage = 'Error sending message'
      });
  }

  isEditable(msg: GroupMessage): boolean {
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
openOptionsMenu(msg: GroupMessage, event: MouseEvent) {
  event.stopPropagation();
  this.selectedMessage = msg;
  this.menuX = event.clientX;
  this.menuY = event.clientY;
}

closeOptionsMenu() {
  this.selectedMessage = null;
}

onMessageRightClick(event: MouseEvent, msg: GroupMessage) {
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

  editMessage(msg: GroupMessage) {
    const newText = prompt('Edit your message:', msg.message);
    if (!newText || newText.trim() === msg.message) return;

    this.groupChatsService.editMessage(msg.id, this.currentUserId, newText)
      .subscribe({
        next: res => {
          if (res.success && res.message) {
            const index = this.messages.findIndex(m => m.id === msg.id);
            if (index !== -1) this.messages[index] = res.message;
            this.closeOptionsMenu();
          } else alert('Failed to edit message');
        },
        error: () => alert('HTTP error editing message')
      });
  }

  deleteMessage(msg: GroupMessage) {
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
}
