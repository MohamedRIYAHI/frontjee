import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home-content',
  imports: [RouterModule, CommonModule],
  templateUrl: './home-content.component.html',
  styleUrl: './home-content.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeContentComponent {
}

