import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChatService } from '../../services/chat/chat.service';
import { AuthService } from '../../services/auth/auth.service';
import { Subscription } from 'rxjs';

interface ChatMessage {
  _id?: string;
  message: string;
  sender: 'user' | 'admin';
  userId?: string;
  adminId?: string;
  createdAt?: Date;
  isRead?: boolean;
}

@Component({
  selector: 'app-chatbox',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './chatbox.component.html',
  styleUrls: ['./chatbox.component.css']
})
export class ChatboxComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;

  isOpen = false;
  messages: ChatMessage[] = [];
  newMessage = '';
  isLoading = false;
  isSending = false;
  isLogin: any = false;
  unreadCount = 0;

  private subscriptions: Subscription[] = [];
  private refreshInterval: any;
  private unreadCountInterval: any;

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isLogin = this.authService.checkLogin();

    if (this.isLogin) {
      this.loadMessages();
      this.loadUnreadCount();
      // Refresh messages every 5 seconds
      this.refreshInterval = setInterval(() => {
        if (this.isOpen) {
          this.loadMessages();
        }
      }, 5000);
      // Refresh unread count every 3 seconds
      this.unreadCountInterval = setInterval(() => {
        this.loadUnreadCount();
      }, 3000);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.unreadCountInterval) {
      clearInterval(this.unreadCountInterval);
    }
  }

  toggleChatbox() {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.isLogin) {
      this.loadMessages();
      // Đánh dấu tất cả tin nhắn admin là đã đọc khi mở chat
      this.markAllAdminMessagesAsRead();
    }
  }

  loadMessages() {
    if (!this.isLogin) return;

    this.isLoading = true;
    const sub = this.chatService.getMessages().subscribe({
      next: (messages) => {
        this.messages = messages || [];
        this.isLoading = false;
        setTimeout(() => this.scrollToBottom(), 100);
        // Cập nhật unread count sau khi load messages
        this.loadUnreadCount();
      },
      error: (err) => {
        console.error('Error loading messages:', err);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  loadUnreadCount() {
    if (!this.isLogin) return;

    const sub = this.chatService.getUnreadCount().subscribe({
      next: (count) => {
        this.unreadCount = count || 0;
      },
      error: (err) => {
        console.error('Error loading unread count:', err);
      }
    });
    this.subscriptions.push(sub);
  }

  markAllAdminMessagesAsRead() {
    if (!this.isLogin) return;

    const sub = this.chatService.markAllAdminMessagesAsRead().subscribe({
      next: () => {
        // Cập nhật trạng thái isRead trong messages array
        this.messages.forEach(msg => {
          if (msg.sender === 'admin' && !msg.isRead) {
            msg.isRead = true;
          }
        });
        // Refresh unread count
        this.loadUnreadCount();
      },
      error: (err) => {
        console.error('Error marking messages as read:', err);
      }
    });
    this.subscriptions.push(sub);
  }

  isMessageRead(message: ChatMessage): boolean {
    return message.isRead === true;
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.isLogin || this.isSending) return;

    const messageText = this.newMessage.trim();
    this.newMessage = '';
    this.isSending = true;

    const tempMessage: ChatMessage = {
      message: messageText,
      sender: 'user',
      createdAt: new Date()
    };
    this.messages.push(tempMessage);
    this.scrollToBottom();

    const sub = this.chatService.sendMessage(messageText).subscribe({
      next: (response) => {
        // Remove temp message and add real one
        this.messages = this.messages.filter(m => m !== tempMessage);
        if (response && response.message) {
          this.messages.push(response.message);
        }
        this.isSending = false;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Error sending message:', err);
        // Remove temp message on error
        this.messages = this.messages.filter(m => m !== tempMessage);
        this.isSending = false;
        alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
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
      minute: '2-digit'
    }).format(d);
  }

  // Method to open chat from external components
  openChat() {
    if (this.isLogin) {
      this.isOpen = true;
      this.loadMessages();
      this.markAllAdminMessagesAsRead();
    } else {
      // Redirect to login if not logged in
      window.location.href = '/login';
    }
  }
}

