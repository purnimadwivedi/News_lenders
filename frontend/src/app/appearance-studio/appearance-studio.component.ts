import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppearanceService } from './appearance.service';
import { ThemeTabComponent } from './tabs/theme-tab.component';
import { ColorsTabComponent } from './tabs/colors-tab.component';
import { BgTabComponent } from './tabs/bg-tab.component';
import { DisplayTabComponent } from './tabs/display-tab.component';
import { BrandingTabComponent } from './tabs/branding-tab.component';
import { LivePreviewComponent } from './live-preview.component';

import { AuthService } from '../auth.service';

export type StudioTab = 'theme' | 'colors' | 'bg' | 'display' | 'branding';

@Component({
  selector: 'app-appearance-studio',
  standalone: true,
  imports: [
    CommonModule,
    ThemeTabComponent,
    ColorsTabComponent,
    BgTabComponent,
    DisplayTabComponent,
    BrandingTabComponent,
    LivePreviewComponent
  ],
  template: `
    <div class="studio-overlay-root" [class.dark-theme]="isDark" [attr.data-theme]="isDark ? 'dark' : 'light'">
      
      <!-- Top Header -->
      <header class="studio-header">
        <div class="header-left">
          <button type="button" class="btn-icon-close" (click)="onClose()" title="Close (Esc)" aria-label="Close">
            ✕
          </button>

          <div class="studio-icon-circle">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
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
          </div>

          <div class="header-titles">
            <h2 class="studio-title">Appearance Studio</h2>
            <span class="studio-subtitle">Customize your workspace</span>
          </div>
        </div>

        <div class="header-right">
          <!-- Status pill: Live Preview -->
          <div class="live-preview-pill">
            <span class="live-dot"></span>
            <span>Live Preview</span>
          </div>

          <!-- Actions -->
          <button type="button" class="btn-header-action btn-reset" (click)="onReset()" title="Reset to default settings">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
            <span>Reset</span>
          </button>

          <button type="button" class="btn-header-action btn-cancel" (click)="onCancel()" title="Discard changes and exit">
            <span>Cancel</span>
          </button>

          <button type="button" class="btn-header-action btn-apply" (click)="onApply()" title="Save and apply configuration">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Apply Changes</span>
          </button>
        </div>
      </header>

      <!-- Second Row: Tab Navigation Bar -->
      <nav class="studio-tabs-row" role="tablist">
        <button type="button" 
                class="tab-link" 
                [class.active]="activeTab === 'theme'"
                (click)="activeTab = 'theme'"
                role="tab"
                [attr.aria-selected]="activeTab === 'theme'">
          Theme
        </button>

        <button type="button" 
                class="tab-link" 
                [class.active]="activeTab === 'colors'"
                (click)="activeTab = 'colors'"
                role="tab"
                [attr.aria-selected]="activeTab === 'colors'">
          Colors
        </button>

        <button type="button" 
                class="tab-link" 
                [class.active]="activeTab === 'bg'"
                (click)="activeTab = 'bg'"
                role="tab"
                [attr.aria-selected]="activeTab === 'bg'">
          BG
        </button>

        <button type="button" 
                class="tab-link" 
                [class.active]="activeTab === 'display'"
                (click)="activeTab = 'display'"
                role="tab"
                [attr.aria-selected]="activeTab === 'display'">
          Display
        </button>

        <button *ngIf="canManageBranding"
                type="button" 
                class="tab-link" 
                [class.active]="activeTab === 'branding'"
                (click)="activeTab = 'branding'"
                role="tab"
                [attr.aria-selected]="activeTab === 'branding'">
          Branding
        </button>
      </nav>

      <!-- Main Split Content Area -->
      <div class="studio-body-layout">
        
        <!-- Left: Configuration Panel (scrollable) -->
        <section class="studio-config-pane">
          <app-theme-tab *ngIf="activeTab === 'theme'"></app-theme-tab>
          <app-colors-tab *ngIf="activeTab === 'colors'"></app-colors-tab>
          <app-bg-tab *ngIf="activeTab === 'bg'"></app-bg-tab>
          <app-display-tab *ngIf="activeTab === 'display'"></app-display-tab>
          <app-branding-tab *ngIf="activeTab === 'branding' && canManageBranding"></app-branding-tab>
        </section>

        <!-- Right: Fixed Live Preview Panel -->
        <section class="studio-preview-pane">
          <app-live-preview [activeTab]="activeTab"></app-live-preview>
        </section>

      </div>

      <!-- Feedback Toast Notification -->
      <div *ngIf="toast$ | async as msg" class="studio-toast-banner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>{{ msg }}</span>
      </div>

    </div>
  `,
  styles: [`
    .studio-overlay-root {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: #ffffff;
      color: #0f172a;
      display: flex;
      flex-direction: column;
      font-family: inherit;
      overflow: hidden;
      animation: studioOverlayFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes studioOverlayFadeIn {
      from { opacity: 0; transform: scale(0.995); }
      to { opacity: 1; transform: scale(1); }
    }

    /* ----------------------------------------------------
       Top Header
       ---------------------------------------------------- */
    .studio-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 60px;
      padding: 0 24px;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      flex-shrink: 0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .btn-icon-close {
      background: transparent;
      border: none;
      color: #64748b;
      font-size: 16px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }

    .btn-icon-close:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    .studio-icon-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-titles {
      display: flex;
      flex-direction: column;
    }

    .studio-title {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.01em;
      line-height: 1.2;
    }

    .studio-subtitle {
      font-size: 11px;
      color: #64748b;
      margin-top: 1px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .live-preview-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #059669;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.2px;
      margin-right: 6px;
    }

    .live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
    }

    .btn-header-action {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 32px;
      padding: 0 14px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
    }

    .btn-reset, .btn-cancel {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #475569;
    }

    .btn-reset:hover, .btn-cancel:hover {
      background: #f8fafc;
      color: #0f172a;
      border-color: #94a3b8;
    }

    .btn-apply {
      background: #2563eb;
      border: 1px solid #2563eb;
      color: #ffffff;
      box-shadow: 0 1px 3px rgba(37, 99, 235, 0.25);
    }

    .btn-apply:hover {
      background: #1d4ed8;
      border-color: #1d4ed8;
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.35);
    }

    /* ----------------------------------------------------
       Second Row: Tabs Navigation
       ---------------------------------------------------- */
    .studio-tabs-row {
      display: flex;
      align-items: center;
      gap: 28px;
      padding: 0 24px;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      height: 44px;
      flex-shrink: 0;
    }

    .tab-link {
      background: transparent;
      border: none;
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      padding: 11px 0;
      position: relative;
      transition: color 0.15s;
    }

    .tab-link:hover {
      color: #0f172a;
    }

    .tab-link.active {
      color: #2563eb;
      font-weight: 700;
    }

    .tab-link.active::after {
      content: "";
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: #2563eb;
      border-radius: 2px 2px 0 0;
    }

    /* ----------------------------------------------------
       Body Split Layout
       ---------------------------------------------------- */
    .studio-body-layout {
      flex: 1;
      display: flex;
      overflow: hidden;
      background: #f8fafc;
    }

    .studio-config-pane {
      width: 440px;
      min-width: 420px;
      max-width: 480px;
      background: #ffffff;
      border-right: 1px solid #e2e8f0;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .studio-config-pane::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
    }

    .studio-preview-pane {
      flex: 1;
      overflow: hidden;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      background: #f8fafc;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .studio-preview-pane::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
    }

    /* Toast */
    .studio-toast-banner {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #0f172a;
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 30px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
      z-index: 10000;
      animation: toastFade 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes toastFade {
      from { opacity: 0; transform: translate(-50%, 10px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }

    /* ----------------------------------------------------
       Dark Theme Overrides for Studio Chrome
       ---------------------------------------------------- */
    .studio-overlay-root.dark-theme {
      background: #050b18;
      color: #f8fafc;
    }

    .studio-overlay-root.dark-theme .studio-header {
      background: #0b1220;
      border-bottom: 1px solid #243247;
    }

    .studio-overlay-root.dark-theme .studio-title {
      color: #f8fafc;
    }

    .studio-overlay-root.dark-theme .studio-subtitle {
      color: #94a3b8;
    }

    .studio-overlay-root.dark-theme .btn-icon-close {
      color: #94a3b8;
    }

    .studio-overlay-root.dark-theme .btn-icon-close:hover {
      background: #111827;
      color: #f8fafc;
    }

    .studio-overlay-root.dark-theme .studio-icon-circle {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.3);
    }

    .studio-overlay-root.dark-theme .btn-reset,
    .studio-overlay-root.dark-theme .btn-cancel {
      background: #111827;
      border: 1px solid #243247;
      color: #cbd5e1;
    }

    .studio-overlay-root.dark-theme .btn-reset:hover,
    .studio-overlay-root.dark-theme .btn-cancel:hover {
      background: #1b283a;
      color: #f8fafc;
      border-color: #3b82f6;
    }

    .studio-overlay-root.dark-theme .studio-tabs-row {
      background: #0b1220;
      border-bottom: 1px solid #243247;
    }

    .studio-overlay-root.dark-theme .tab-link {
      color: #94a3b8;
    }

    .studio-overlay-root.dark-theme .tab-link:hover {
      color: #f8fafc;
    }

    .studio-overlay-root.dark-theme .tab-link.active {
      color: #3b82f6;
    }

    .studio-overlay-root.dark-theme .tab-link.active::after {
      background: #3b82f6;
    }

    .studio-overlay-root.dark-theme .studio-body-layout {
      background: #050b18;
    }

    .studio-overlay-root.dark-theme .studio-config-pane {
      background: #0b1220;
      border-right: 1px solid #243247;
    }

    .studio-overlay-root.dark-theme .studio-preview-pane {
      background: #050b18;
    }

    @media (max-width: 900px) {
      .studio-body-layout {
        flex-direction: column;
        overflow-y: auto;
      }
      .studio-config-pane {
        width: 100%;
        max-width: none;
        border-right: none;
        border-bottom: 1px solid #e2e8f0;
      }
      .studio-overlay-root.dark-theme .studio-config-pane {
        border-bottom-color: #243247;
      }
      .studio-preview-pane {
        min-height: 480px;
      }
    }
  `]
})
export class AppearanceStudioComponent {
  private appearanceService = inject(AppearanceService);
  private authService = inject(AuthService);

  private _activeTab: StudioTab = 'theme';

  get activeTab(): StudioTab {
    if (this._activeTab === 'branding' && !this.canManageBranding) {
      return 'theme';
    }
    return this._activeTab;
  }

  set activeTab(tab: StudioTab) {
    if (tab === 'branding' && !this.canManageBranding) {
      this._activeTab = 'theme';
      return;
    }
    this._activeTab = tab;
  }

  get canManageBranding(): boolean {
    return this.authService.hasPermission('appearance.branding.manage');
  }

  get isDark(): boolean {
    return this.appearanceService.draft.theme.mode === 'dark';
  }

  get toast$() {
    return this.appearanceService.toastMessage$;
  }

  onReset(): void {
    this.appearanceService.resetDraftToDefaults();
  }

  onCancel(): void {
    this.appearanceService.cancelStudio();
  }

  onApply(): void {
    this.appearanceService.applyChanges();
  }

  onClose(): void {
    this.appearanceService.closeStudio();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.onClose();
  }
}
