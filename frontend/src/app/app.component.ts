import { TranslatePipe, translate, I18nKey } from './i18n';
import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { AppearanceService, AppearanceStudioComponent } from './appearance-studio';
import { DEFAULT_AUTH_LOGO } from './auth-logo';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, AppearanceStudioComponent, TranslatePipe],
  template: `
    <!-- ==========================================
         AUTHENTICATION SHELL (<AuthLayout>)
         Strictly Isolated: Original Unchanged UI
         ========================================== -->
    <div class="auth-layout" *ngIf="isAuthPage">
      <router-outlet></router-outlet>
    </div>

    <!-- ==========================================
         AUTHENTICATED APPLICATION SHELL (<AppLayout>)
         Appearance Studio & Dynamic Branding Applied ONLY Here
         ========================================== -->
    <div class="app-layout authenticated-app app-shell" 
         *ngIf="!isAuthPage"
         [attr.data-theme]="themeMode"
         [class.dark-theme]="isDark"
         [class.light-theme]="!isDark">

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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.83-.44-1.12-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z"/>
              <circle cx="13.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/>
              <circle cx="17.5" cy="10.5" r="1.2" fill="currentColor" stroke="none"/>
              <circle cx="8.5" cy="7.5" r="1.2" fill="currentColor" stroke="none"/>
              <circle cx="6.5" cy="12.5" r="1.2" fill="currentColor" stroke="none"/>
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
                  <span>{{ 'logout' | t }}</span>
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
          <img class="brand-logo" [src]="brandLogoUrl" (error)="onBrandLogoError($event)" alt="Logo" />
          <div *ngIf="!isSidebarVisuallyCollapsed">
            <div class="brand-title">{{ appearanceService.branding.applicationName || appearanceService.branding.appName || 'News Radar' }}</div>
          </div>
          <button class="sidebar-close-btn" (click)="closeSidebar()" aria-label="Close navigation menu">✕</button>
        </div>
        <nav>
          <a routerLink="/dashboard" routerLinkActive="active" (click)="closeSidebar()" [title]="'dashboard' | t">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            <span class="nav-text">{{ 'dashboard' | t }}</span>
          </a>
          <a routerLink="/news" routerLinkActive="active" (click)="closeSidebar()" [title]="'newsFeed' | t">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span class="nav-text">{{ 'newsFeed' | t }}</span>
          </a>
          <ng-container *ngIf="role === 'admin'">
            <a routerLink="/companies" routerLinkActive="active" (click)="closeSidebar()" [title]="'lenders' | t">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <span class="nav-text">{{ 'lenders' | t }}</span>
            </a>
            <a routerLink="/recipients" routerLinkActive="active" (click)="closeSidebar()" [title]="'recipients' | t">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <span class="nav-text">{{ 'recipients' | t }}</span>
            </a>
            <a routerLink="/runs" routerLinkActive="active" (click)="closeSidebar()" [title]="'runs' | t">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              <span class="nav-text">{{ 'runs' | t }}</span>
            </a>
            <a routerLink="/settings" routerLinkActive="active" (click)="closeSidebar()" [title]="'llmConfig' | t">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              <span class="nav-text">{{ 'llmConfig' | t }}</span>
            </a>
          </ng-container>
        </nav>

        <div class="sidebar-collapse-bar">
          <button class="collapse-btn" (click)="toggleSidebarCollapse()" style="font-size: 16px; font-weight: bold; line-height: 1;">
            <span *ngIf="!isSidebarVisuallyCollapsed">&laquo;</span>
            <span *ngIf="isSidebarVisuallyCollapsed">&raquo;</span>
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.83-.44-1.12-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z"/>
                <circle cx="13.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/>
                <circle cx="17.5" cy="10.5" r="1.2" fill="currentColor" stroke="none"/>
                <circle cx="8.5" cy="7.5" r="1.2" fill="currentColor" stroke="none"/>
                <circle cx="6.5" cy="12.5" r="1.2" fill="currentColor" stroke="none"/>
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
                    <span>{{ 'logout' | t }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <router-outlet></router-outlet>
      </main>
      </div>

      <!-- Global Non-Routed Appearance Studio Overlay Panel: strictly scoped to AppLayout -->
      <app-appearance-studio *ngIf="appearanceService.isOpen$ | async"></app-appearance-studio>
    </div>
  `,
  styles: [
    `
      /* Same height as the global header (52px) so the logo and title line up with the page title. */
      .brand {
        display: flex; gap: 10px; align-items: center; justify-content: flex-start;
        box-sizing: border-box; height: 52px; flex-shrink: 0; padding: 0 6px;
      }
      .brand-logo {
        width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
        object-fit: contain; background: white; padding: 3px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      }
      .brand-title { display: block; font-weight: 700; color: var(--app-sidebar-fg-strong, #fff); font-size: 15px; }
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
        color: var(--app-sidebar-fg, #9ca3af);
        text-decoration: none;
        transition: all 0.15s ease;
      }
      .nav-text { display: block; font-size: 14px; font-weight: 500; }
      nav a:hover { background: rgba(127, 127, 127, 0.14); color: var(--app-sidebar-fg-strong, #ffffff); }
      nav a.active {
        background: var(--app-primary, #f37819);
        color: #ffffff;
        font-weight: 700;
        box-shadow: 0 4px 14px var(--app-primary-shadow, rgba(243, 120, 25, 0.35));
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
  sidebarCollapsed = true;
  isSidebarHovered = false;
  sidebarForceCollapsed = false;
  mobileDropdownOpen = false;

  readonly defaultAppLogo = DEFAULT_AUTH_LOGO;

  get brandLogoUrl(): string {
    const url = this.appearanceService.branding?.sidebarLogo || this.appearanceService.branding?.logoUrl;
    if (!url || url.length === 9122 || (url.startsWith('data:image/jpeg;base64,') && url.length < 12000)) {
      return this.defaultAppLogo;
    }
    return url;
  }

  onBrandLogoError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.defaultAppLogo) {
      img.src = this.defaultAppLogo;
    }
  }

  get isAuthPage(): boolean {
    const url = (this.router.url || '').split('?')[0];
    return url === '/login' || url === '/logout' || url === '/session-expired' || !this.authService.isAuthenticated();
  }

  get isLoginPage(): boolean {
    return this.isAuthPage;
  }

  get themeMode(): string {
    return this.appearanceService.themeMode;
  }

  get isDark(): boolean {
    return this.appearanceService.isDark;
  }

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
      if (this.isAuthPage) {
        this.appearanceService.closeStudio();
        this.appearanceService.clearFromDOM();
      } else {
        setTimeout(() => this.appearanceService.applyCurrentToDOM(), 0);
      }
    });

    if (this.isAuthPage) {
      this.appearanceService.clearFromDOM();
    } else {
      setTimeout(() => this.appearanceService.applyCurrentToDOM(), 0);
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  toggleSidebarCollapse() {
    if (this.isSidebarVisuallyCollapsed) {
      this.sidebarCollapsed = false;
    } else {
      this.sidebarCollapsed = true;
      this.sidebarForceCollapsed = true;
    }
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
    this.sidebarCollapsed = true;
    this.appearanceService.closeStudio();
    this.appearanceService.clearFromDOM();
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

  get role(): string {
    return this.authService.getRole() || 'admin';
  }

  get pageTitle(): string {
    const url = this.router.url.split('?')[0];
    let key: I18nKey = 'dashboard';
    if (url.includes('/news')) key = 'newsFeed';
    else if (url.includes('/companies')) key = 'lenders';
    else if (url.includes('/recipients')) key = 'recipients';
    else if (url.includes('/runs')) key = 'runs';
    else if (url.includes('/settings')) key = 'llmConfig';
    return translate(this.appearanceService.state.display.language, key);
  }

}
