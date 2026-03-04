import { Component, OnInit } from '@angular/core';
import { NewsService } from '../../services/news/news.service';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
   imports: [RouterModule, CommonModule, FormsModule]
})
export class HomeComponent implements OnInit {
  news : any [] =[];
   news6to10: any[] = [];
   news12to16: any[] = [];
  constructor(private  newsService : NewsService) { }

  ngOnInit() {
    this.newsService.getAll().subscribe( data =>{
       this.news = data
        this.news6to10 = this.news.slice(3, 7);
        this.news12to16 = this.news.slice(6,10)
     console.log(this.news.length);
     
       
    })
  }

}

