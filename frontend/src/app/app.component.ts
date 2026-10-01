import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { AppearanceService, AppearanceStudioComponent } from './appearance-studio';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, AppearanceStudioComponent],
  template: `
    <ng-container *ngIf="!isLoginPage">
      <div class="mobile-header">
        <div class="mobile-header-left">
          <button class="hamburger" (click)="toggleSidebar()" aria-label="Open navigation menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <span class="brand-mini">{{ appearanceService.branding.applicationName || appearanceService.branding.appName || appearanceService.branding.appTitle }}</span>
        </div>
        <div class="mobile-header-right">
          <!-- Appearance Studio Launcher (Mobile) -->
          <button type="button" 
                  class="btn-studio-star-mobile" 
                  (click)="appearanceService.openStudio()" 
                  title="Appearance Studio" 
                  aria-label="Appearance Studio">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4.5"/>
              <line x1="12" y1="2" x2="12" y2="4.5"/>
              <line x1="12" y1="19.5" x2="12" y2="22"/>
              <line x1="2" y1="12" x2="4.5" y2="12"/>
              <line x1="19.5" y1="12" x2="22" y2="12"/>
              <line x1="4.93" y1="4.93" x2="6.7" y2="6.7"/>
              <line x1="17.3" y1="17.3" x2="19.07" y2="19.07"/>
              <line x1="4.93" y1="19.07" x2="6.7" y2="17.3"/>
              <line x1="17.3" y1="6.7" x2="19.07" y2="4.93"/>
            </svg>
          </button>
          <span class="status-indicator" [class.ok]="health?.ok" [class.bad]="healthError" [title]="health?.ok ? 'API online' : 'API offline'"></span>
          <div class="mobile-profile-wrap" 
               [class.active]="mobileDropdownOpen"
               (click)="toggleMobileDropdown($event)" 
               role="button" 
               tabindex="0" 
               aria-label="Profile menu"
               [attr.aria-expanded]="mobileDropdownOpen">
            <div class="dash-avatar mini">{{ userProfile.avatar }}</div>
            <svg class="dash-chevron mini" [class.open]="mobileDropdownOpen" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            <div class="user-dropdown-menu mobile-pos" *ngIf="mobileDropdownOpen" (click)="$event.stopPropagation()" role="menu">
              <div class="user-dropdown-header">
                <div class="user-dropdown-avatar">{{ userProfile.avatar }}</div>
                <div class="user-dropdown-details">
                  <span class="user-dropdown-name">{{ userProfile.name }}</span>
                  <span class="user-dropdown-email">{{ userProfile.email }}</span>
                  <span class="user-dropdown-badge">{{ userProfile.role }}</span>
                </div>
              </div>
              <div class="user-dropdown-divider"></div>
              <div class="user-dropdown-items">
                <button type="button" class="user-dropdown-item danger" (click)="triggerLogout($event)" role="menuitem">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    <div class="sidebar-backdrop" [class.show]="sidebarOpen" (click)="closeSidebar()"></div>

    <div class="shell">
      <aside class="sidebar" 
             [class.open]="sidebarOpen" 
             [class.collapsed]="isSidebarVisuallyCollapsed"
             (mouseenter)="onSidebarEnter()"
             (mouseleave)="onSidebarLeave()">
        <div class="brand">
          <img class="brand-logo" src="data:image/jpeg;base64,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" alt="Logo" />
          <div *ngIf="!isSidebarVisuallyCollapsed">
            <div class="brand-title">Lender News</div>
          </div>
          <button class="sidebar-close-btn" (click)="closeSidebar()" aria-label="Close navigation menu">✕</button>
        </div>
        <nav>
          <a routerLink="/dashboard" routerLinkActive="active" (click)="closeSidebar()" title="Dashboard">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            <span class="nav-text">Dashboard</span>
          </a>
          <a routerLink="/news" routerLinkActive="active" (click)="closeSidebar()" title="News Feed">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span class="nav-text">News Feed</span>
          </a>
          <ng-container *ngIf="role === 'admin'">
            <a routerLink="/companies" routerLinkActive="active" (click)="closeSidebar()" title="Lenders">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <span class="nav-text">Lenders</span>
            </a>
            <a routerLink="/recipients" routerLinkActive="active" (click)="closeSidebar()" title="Recipients">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <span class="nav-text">Recipients</span>
            </a>
            <a routerLink="/runs" routerLinkActive="active" (click)="closeSidebar()" title="Runs">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              <span class="nav-text">Runs</span>
            </a>
            <a routerLink="/settings" routerLinkActive="active" (click)="closeSidebar()" title="Settings">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              <span class="nav-text">Settings</span>
            </a>
          </ng-container>
        </nav>

        <div class="sidebar-collapse-bar">
          <button class="collapse-btn" (click)="toggleSidebarCollapse()" style="font-size: 16px; font-weight: bold; line-height: 1;">
            <span *ngIf="!sidebarCollapsed">&laquo;</span>
            <span *ngIf="sidebarCollapsed">&raquo;</span>
          </button>
        </div>
      </aside>
      <main class="content" [class.expanded]="isSidebarVisuallyCollapsed">
        <div class="dash-header-bar global-header">
          <h1 class="dash-main-title">{{ pageTitle }}</h1>
          <div class="dash-user-bar">
            <!-- Appearance Studio Launcher (Desktop) -->
            <button type="button" 
                    class="btn-studio-star" 
                    (click)="appearanceService.openStudio()" 
                    title="Appearance Studio" 
                    aria-label="Appearance Studio">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4.5"/>
                <line x1="12" y1="2" x2="12" y2="4.5"/>
                <line x1="12" y1="19.5" x2="12" y2="22"/>
                <line x1="2" y1="12" x2="4.5" y2="12"/>
                <line x1="19.5" y1="12" x2="22" y2="12"/>
                <line x1="4.93" y1="4.93" x2="6.7" y2="6.7"/>
                <line x1="17.3" y1="17.3" x2="19.07" y2="19.07"/>
                <line x1="4.93" y1="19.07" x2="6.7" y2="17.3"/>
                <line x1="17.3" y1="6.7" x2="19.07" y2="4.93"/>
              </svg>
            </button>

            <div class="dash-profile"
                 [class.active]="mobileDropdownOpen"
                 (click)="toggleMobileDropdown($event)"
                 role="button"
                 tabindex="0"
                 aria-haspopup="true"
                 [attr.aria-expanded]="mobileDropdownOpen">
              <div class="dash-avatar">{{ userProfile.avatar }}</div>
              <div class="dash-user-info">
                <span class="dash-user-name">{{ userProfile.name }}</span>
                <span class="dash-user-role">{{ userProfile.role }}</span>
              </div>
              <svg class="dash-chevron" [class.open]="mobileDropdownOpen" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>

              <!-- User Profile Dropdown Menu -->
              <div class="user-dropdown-menu" 
                   *ngIf="mobileDropdownOpen" 
                   (click)="$event.stopPropagation()"
                   role="menu"
                   aria-label="User account menu">
                <div class="user-dropdown-header">
                  <div class="user-dropdown-avatar">{{ userProfile.avatar }}</div>
                  <div class="user-dropdown-details">
                    <span class="user-dropdown-name">{{ userProfile.name }}</span>
                    <span class="user-dropdown-email">{{ userProfile.email }}</span>
                    <span class="user-dropdown-badge">{{ userProfile.role }}</span>
                  </div>
                </div>

                <div class="user-dropdown-divider"></div>

                <div class="user-dropdown-items">
                  <button type="button" 
                          class="user-dropdown-item danger" 
                          (click)="triggerLogout($event)"
                          role="menuitem"
                          aria-label="Logout">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <router-outlet></router-outlet>
      </main>
      </div>

      <!-- Global Non-Routed Appearance Studio Overlay Panel -->
      <app-appearance-studio *ngIf="appearanceService.isOpen$ | async"></app-appearance-studio>
    </ng-container>
    <ng-container *ngIf="isLoginPage">
      <router-outlet></router-outlet>
    </ng-container>
  `,
  styles: [
    `
      .brand { display: flex; gap: 10px; align-items: center; justify-content: flex-start; padding: 4px 6px; }
      .brand-logo {
        width: 44px; height: 44px; border-radius: 10px;
        object-fit: contain; background: white; padding: 3px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      }
      .brand-title { display: block; font-weight: 700; color: #fff; font-size: 15px; margin-bottom: 2px; }
      .brand-sub { display: block; font-size: 11px; color: #9ca3af; }
      .sidebar-close-btn {
        display: none;
        margin-left: auto;
        background: transparent;
        border: none;
        color: #9ca3af;
        font-size: 18px;
        padding: 6px;
        cursor: pointer;
        line-height: 1;
        border-radius: 6px;
      }
      .sidebar-close-btn:hover { color: #fff; background: rgba(255, 255, 255, 0.1); }
      @media (max-width: 1023px) {
        .sidebar-close-btn { display: flex; align-items: center; justify-content: center; }
      }
      nav { display: flex; flex-direction: column; gap: 4px; }
      nav a {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: 10px;
        color: #9ca3af;
        text-decoration: none;
        transition: all 0.15s ease;
      }
      .nav-text { display: block; font-size: 14px; font-weight: 500; }
      nav a:hover { background: rgba(255, 255, 255, 0.08); color: #ffffff; }
      nav a.active {
        background: #f37819;
        color: #ffffff;
        font-weight: 700;
        box-shadow: 0 4px 14px rgba(243, 120, 25, 0.35);
      }
      nav a.logout-link { color: #f87171; display: flex; align-items: center; gap: 8px; margin-top: 8px; cursor: pointer; }
      nav a.logout-link:hover { color: #fca5a5; background: rgba(239, 68, 68, 0.15); }
      .sidebar-footer {
        font-size: 11px;
        color: #9ca3af;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 6px;
      }
      .status-dot { width: 8px; height: 8px; border-radius: 50%; }
      .status-dot.ok { background: #22c55e; }
      .status-dot.bad { background: #ef4444; }

      .sidebar.collapsed .brand { justify-content: center; }
      .sidebar.collapsed nav a { justify-content: center; padding: 12px 0; }
      .sidebar.collapsed .sidebar-footer { justify-content: center; }
    `
  ]
})
export class AppComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  public authService = inject(AuthService);
  public appearanceService = inject(AppearanceService);
  health: { ok: boolean; time: string; company: string; model: string } | null = null;
  healthError = false;
  sidebarOpen = false;
  sidebarCollapsed = false;
  isSidebarHovered = false;
  sidebarForceCollapsed = false;
  mobileDropdownOpen = false;

  get userProfile() {
    return this.authService.getUserProfile();
  }

  get isSidebarVisuallyCollapsed(): boolean {
    return this.sidebarCollapsed && !(this.isSidebarHovered && !this.sidebarForceCollapsed);
  }

  ngOnInit() {
    this.api.health().subscribe({
      next: (h) => (this.health = h),
      error: () => (this.healthError = true)
    });
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.closeSidebar();
      this.mobileDropdownOpen = false;
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  toggleSidebarCollapse() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.sidebarForceCollapsed = true;
  }

  onSidebarEnter() {
    this.isSidebarHovered = true;
  }

  onSidebarLeave() {
    this.isSidebarHovered = false;
    this.sidebarForceCollapsed = false;
  }

  toggleMobileDropdown(event: Event) {
    event.stopPropagation();
    this.mobileDropdownOpen = !this.mobileDropdownOpen;
  }

  triggerLogout(event?: Event) {
    if (event) event.stopPropagation();
    this.mobileDropdownOpen = false;
    this.closeSidebar();
    this.authService.logout();
  }

  @HostListener('document:click')
  onDocClick() {
    if (this.mobileDropdownOpen) {
      this.mobileDropdownOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.mobileDropdownOpen) {
      this.mobileDropdownOpen = false;
    }
  }

  get isLoginPage(): boolean {
    return this.router.url === '/login';
  }

  get role(): string {
    return this.authService.getRole() || 'admin';
  }

  get pageTitle(): string {
    const url = this.router.url.split('?')[0];
    if (url.includes('/dashboard')) return 'Dashboard';
    if (url.includes('/news')) return 'News Feed';
    if (url.includes('/companies')) return 'Lenders';
    if (url.includes('/recipients')) return 'Recipients';
    if (url.includes('/runs')) return 'Runs';
    if (url.includes('/settings')) return 'Settings';
    return 'Dashboard';
  }
}
