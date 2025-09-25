import { Component, OnInit, AfterViewChecked, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { GroupChatsService, GroupMessage } from '../../services/group-chats.service';
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
  groupId!: string | null;
  isLoading = false;
  errorMessage = '';

  private pollingSub!: Subscription;

  @ViewChild('chatMessages') chatMessagesRef!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private groupChatsService: GroupChatsService
  ) {}

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('groupId');
    const user = this.authService.getCurrentUser();
    if (user) this.currentUserId = user.id;

    if (this.groupId) {
      this.loadMessages();
      this.startPolling();
    }
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
      next: res => {
        if (res.success) {
          this.messages = res.messages;
        } else {
          this.errorMessage = 'Error loading messages';
        }
      },
      error: err => {
        console.error('HTTP error loading messages:', err);
        this.errorMessage = 'Error loading messages';
      }
    });
  }

  sendMessage(): void {
    if (!this.currentUserId) return alert('User not logged in');
    if (!this.newMessage.trim()) return alert('Enter a message');
    if (!this.groupId) return alert('No group selected');

    this.groupChatsService.sendMessage(this.groupId!, this.currentUserId, this.newMessage)
      .subscribe({
        next: res => {
          if (res.success && res.message) {
            this.messages.push(res.message);
            this.newMessage = '';
            setTimeout(() => this.scrollToBottom(), 100);
          } else {
            this.errorMessage = 'Failed to send message';
          }
        },
        error: err => {
          this.errorMessage = 'Error sending message';
        }
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
}
