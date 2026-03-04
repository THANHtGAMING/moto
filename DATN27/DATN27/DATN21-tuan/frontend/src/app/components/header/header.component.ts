import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  imports: [RouterModule]
})
export class HeaderComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
