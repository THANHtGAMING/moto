import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HelpService, Help } from '../../services/help/help.service';
import { ChatboxComponent } from '../chatbox/chatbox.component';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, RouterModule, ChatboxComponent],
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.css']
})
export class HelpComponent implements OnInit {
  @ViewChild(ChatboxComponent) chatboxComponent!: ChatboxComponent;

  helpItems: Help[] = [];
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private helpService: HelpService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadHelpItems();
  }

  loadHelpItems() {
    this.loading = true;
    this.error = null;

    this.helpService.getAll().subscribe({
      next: (data) => {
        this.helpItems = Array.isArray(data) ? data : [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading help items:', err);
        this.error = 'Không thể tải thông tin trợ giúp';
        this.loading = false;
      }
    });
  }

  openChat() {
    if (this.chatboxComponent) {
      this.chatboxComponent.openChat();
    }
  }

  goToDetail(id: string) {
    if (id) {
      this.router.navigate(['/help-detail', id]);
    }
  }
}

