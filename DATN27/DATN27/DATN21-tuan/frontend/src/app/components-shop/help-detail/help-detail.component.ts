import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HelpService, Help } from '../../services/help/help.service';
import { ChatboxComponent } from '../chatbox/chatbox.component';

@Component({
  selector: 'app-help-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ChatboxComponent],
  templateUrl: './help-detail.component.html',
  styleUrls: ['./help-detail.component.css']
})
export class HelpDetailComponent implements OnInit {
  @ViewChild(ChatboxComponent) chatboxComponent!: ChatboxComponent;

  helpItem: Help | null = null;
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private helpService: HelpService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadHelpDetail(id);
    } else {
      this.error = 'Không tìm thấy ID trợ giúp';
    }
  }

  loadHelpDetail(id: string) {
    this.loading = true;
    this.error = null;

    this.helpService.getDetail(id).subscribe({
      next: (data) => {
        this.helpItem = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading help detail:', err);
        this.error = 'Không thể tải thông tin trợ giúp';
        this.loading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/help']);
  }

  openChat() {
    if (this.chatboxComponent) {
      this.chatboxComponent.openChat();
    }
  }
}

