import { Component, OnInit } from '@angular/core';
import { NewsService } from '../../services/news/news.service';
import { CommonModule } from '@angular/common';

import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-home',
  templateUrl: './homedetail.component.html',
  styleUrls: ['./homedetail.component.css'],
   imports: [RouterModule, CommonModule, FormsModule]
})
export class HomeComponentDetail implements OnInit {
  news: any;

  constructor(
    private route: ActivatedRoute,
    private newsService: NewsService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id");

    if (id) {
      this.newsService.getnewsDetail(id).subscribe(data => {
        this.news = data;
       
      });
    }
  }
}
