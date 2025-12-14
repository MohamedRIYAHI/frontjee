import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Health } from './health';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  providers: [Health]
})
export class App implements OnInit {
  title = signal('frontjee');
  
  constructor(private health: Health) {
}
ngOnInit() {
  console.log('App initialized')
}
}
