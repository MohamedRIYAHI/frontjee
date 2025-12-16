import { Component, signal, computed, ChangeDetectionStrategy, inject, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterOutlet, RouterModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);
  isSidebarOpen = signal(true);
  currentUrl = signal(this.router.url);

  navItems: NavItem[] = [
    { label: 'Accueil', path: '/home', icon: '🏠' },
    { label: 'Authentification', path: '/auth', icon: '🔐' },
    { label: 'Profil', path: '/profile', icon: '👤' },
    { label: 'Données de santé', path: '/health-data', icon: '💊' }
  ];

  isHomePage = computed(() => {
    const url = this.currentUrl();
    return url === '/home' || url === '/';
  });

  constructor() {
    // Écouter les changements de route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.currentUrl.set(event.urlAfterRedirects);
          this.cdr.markForCheck();
        }
      });
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update(value => !value);
  }
}

