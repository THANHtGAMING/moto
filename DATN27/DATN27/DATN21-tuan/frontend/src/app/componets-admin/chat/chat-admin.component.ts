import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../services/chat/chat.service';
import { ToastService } from '../../services/toast/toast.service';
import { Subscription } from 'rxjs';

interface Conversation {
  userId: string;
  user: {
    _id: string;
    fullName: string;
    email: string;
  };
  lastMessage: {
    _id: string;
    message: string;
    sender: 'user' | 'admin';
    createdAt: Date;
  };
  unreadCount: number;
}

@Component({
  selector: 'app-chat-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-admin.component.html',
  styleUrls: ['./chat-admin.component.css']
})
export class ChatAdminComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;

  conversations: Conversation[] = [];
  selectedUserId: string | null = null;
  selectedUser: any = null;
  messages: ChatMessage[] = [];
  newMessage = '';
  isLoading = false;
  isSending = false;
  isLoadingConversations = false;

  private subscriptions: Subscription[] = [];
  private refreshInterval: any;

  constructor(
    private chatService: ChatService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadConversations();
    // Refresh conversations every 10 seconds
    this.refreshInterval = setInterval(() => {
      this.loadConversations();
      if (this.selectedUserId) {
        this.loadMessages(this.selectedUserId);
      }
    }, 10000);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadConversations() {
    this.isLoadingConversations = true;
    const sub = this.chatService.getAdminConversations().subscribe({
      next: (conversations) => {
        this.conversations = conversations || [];
        this.isLoadingConversations = false;
      },
      error: (err) => {
        console.error('Error loading conversations:', err);
        this.isLoadingConversations = false;
      }
    });
    this.subscriptions.push(sub);
  }

  selectConversation(conversation: Conversation) {
    this.selectedUserId = conversation.userId;
    this.selectedUser = conversation.user;
    this.loadMessages(conversation.userId);
  }

  loadMessages(userId: string) {
    this.isLoading = true;
    const sub = this.chatService.getAdminMessages(userId).subscribe({
      next: (messages) => {
        this.messages = messages || [];
        this.isLoading = false;
        setTimeout(() => this.scrollToBottom(), 100);
        // Đánh dấu tất cả tin nhắn chưa đọc là đã đọc khi load lại
        this.markAllMessagesAsRead(userId);
      },
      error: (err) => {
        console.error('Error loading messages:', err);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  markAllMessagesAsRead(userId: string) {
    const sub = this.chatService.markAllAsReadByUserId(userId).subscribe({
      next: () => {
        // Cập nhật trạng thái isRead trong messages array
        this.messages.forEach(msg => {
          if (msg.sender === 'user' && !msg.isRead) {
            msg.isRead = true;
          }
        });
        // Refresh conversations để cập nhật unread count
        this.loadConversations();
      },
      error: (err) => {
        console.error('Error marking messages as read:', err);
      }
    });
    this.subscriptions.push(sub);
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedUserId || this.isSending) return;

    const messageText = this.newMessage.trim();
    this.newMessage = '';
    this.isSending = true;

    const tempMessage: ChatMessage = {
      message: messageText,
      sender: 'admin',
      createdAt: new Date()
    };
    this.messages.push(tempMessage);
    this.scrollToBottom();

    const sub = this.chatService.sendAdminMessage(this.selectedUserId, messageText).subscribe({
      next: (response) => {
        // Remove temp message and add real one
        this.messages = this.messages.filter(m => m !== tempMessage);
        if (response && response.message) {
          this.messages.push(response.message);
        }
        this.isSending = false;
        this.scrollToBottom();
        // Refresh conversations to update unread count
        this.loadConversations();
      },
      error: (err) => {
        console.error('Error sending message:', err);
        this.messages = this.messages.filter(m => m !== tempMessage);
        this.isSending = false;
        this.toastService.error('Không thể gửi tin nhắn. Vui lòng thử lại.');
      }
    });
    this.subscriptions.push(sub);
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  scrollToBottom() {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling:', err);
    }
  }

  formatTime(date: Date | string | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    }).format(d);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    const messageDate = new Date(d);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    }

    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(d);
  }

  getUnreadCountForUser(userId: string): number {
    const conv = this.conversations.find(c => c.userId === userId);
    return conv?.unreadCount || 0;
  }

  isMessageRead(message: ChatMessage): boolean {
    // Tin nhắn từ admin luôn được coi là đã đọc (admin tự gửi)
    if (message.sender === 'admin') {
      return true;
    }
    // Tin nhắn từ user: kiểm tra trạng thái isRead
    return message.isRead === true;
  }
}

