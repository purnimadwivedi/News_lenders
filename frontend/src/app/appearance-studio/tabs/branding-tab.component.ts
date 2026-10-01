import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AppearanceService, DEFAULT_APPEARANCE_STATE } from '../appearance.service';
import { AuthService } from '../../auth.service';
import { BrandingConfig } from '../appearance.models';

@Component({
  selector: 'app-branding-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tab-pane">
      <div class="branding-intro">
        <h3 class="branding-header-title">Enterprise Branding</h3>
        <p class="branding-header-sub">Configure organization identity, logos, and brand colors applied across all users.</p>
      </div>

      <!-- File Validation Error Message -->
      <div *ngIf="uploadError" class="branding-alert error">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ uploadError }}</span>
      </div>

      <div class="branding-fields-wrapper">
        
        <!-- 1. Application Name & Subtitle -->
        <div class="field-card">
          <label class="field-label" for="appNameInput">Application Name</label>
          <p class="field-desc">Workspace title displayed across headers, sidebar brand, and browser window.</p>
          <input id="appNameInput"
                 type="text" 
                 class="text-input" 
                 [ngModel]="draftBranding.applicationName || draftBranding.appName || draftBranding.appTitle" 
                 (ngModelChange)="onAppNameChange($event)"
                 placeholder="e.g. Lender News Portal" />

          <label class="field-label" for="appSubtitleInput" style="margin-top: 10px;">Brand Subtitle</label>
          <p class="field-desc">Descriptive portal tagline shown below the title in the sidebar.</p>
          <input id="appSubtitleInput"
                 type="text" 
                 class="text-input" 
                 [ngModel]="draftBranding.appSubtitle" 
                 (ngModelChange)="onSubtitleChange($event)"
                 placeholder="e.g. IMGC Reviewer Portal" />
        </div>

        <!-- 2. Logo Upload & Management -->
        <div class="field-card">
          <label class="field-label">Organization Logo</label>
          <p class="field-desc">Upload a high-resolution PNG, JPG, or SVG logo (max 2MB). Cached-busting is applied automatically.</p>

          <div class="logo-preview-row">
            <!-- Logo Preview Container -->
            <div class="logo-box">
              <img *ngIf="draftBranding.logoUrl" 
                   [src]="draftBranding.logoUrl" 
                   alt="Logo Preview" 
                   class="logo-img" />
              <div *ngIf="!draftBranding.logoUrl" class="no-logo-placeholder">No Logo</div>
            </div>

            <!-- Upload, Replace, Remove Actions -->
            <div class="logo-action-buttons">
              <label class="btn-action-brand btn-upload">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <span>{{ draftBranding.logoUrl ? 'Replace Logo' : 'Upload Logo' }}</span>
                <input type="file" 
                       accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp" 
                       (change)="onFileSelected($event)" 
                       style="display: none;" />
              </label>

              <button *ngIf="draftBranding.logoUrl" 
                      type="button" 
                      class="btn-action-brand btn-remove" 
                      (click)="removeLogo()">
                Remove
              </button>

              <button type="button" 
                      class="btn-action-brand btn-reset-default" 
                      (click)="resetToDefaultLogo()">
                Reset Default
              </button>
            </div>
          </div>
        </div>

        <!-- 3. Brand Colors -->
        <div class="field-card">
          <label class="field-label">Brand Colors</label>
          <p class="field-desc">Central primary and secondary accents used across navigation, buttons, and badges.</p>

          <div class="brand-colors-grid">
            <div class="color-item-wrap">
              <span class="color-item-lbl">Primary Brand Color</span>
              <div class="color-picker-row">
                <input type="color" 
                       class="color-swatch-input" 
                       [ngModel]="primaryColor" 
                       (ngModelChange)="onPrimaryColorChange($event)" />
                <input type="text" 
                       class="text-input hex-input" 
                       [ngModel]="primaryColor" 
                       (ngModelChange)="onPrimaryColorChange($event)" />
              </div>
            </div>

            <div class="color-item-wrap">
              <span class="color-item-lbl">Secondary Brand Color</span>
              <div class="color-picker-row">
                <input type="color" 
                       class="color-swatch-input" 
                       [ngModel]="secondaryColor" 
                       (ngModelChange)="onSecondaryColorChange($event)" />
                <input type="text" 
                       class="text-input hex-input" 
                       [ngModel]="secondaryColor" 
                       (ngModelChange)="onSecondaryColorChange($event)" />
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Favicon Configuration -->
        <div class="field-card">
          <label class="field-label" for="faviconInput">Browser Favicon URL</label>
          <p class="field-desc">Browser tab icon URL (.ico or .png).</p>
          <div class="favicon-row">
            <input id="faviconInput"
                   type="text" 
                   class="text-input" 
                   [ngModel]="draftBranding.faviconUrl" 
                   (ngModelChange)="onFaviconChange($event)" 
                   placeholder="https://example.com/favicon.ico" />
            <div *ngIf="draftBranding.faviconUrl" class="favicon-preview-box">
              <img [src]="draftBranding.faviconUrl" alt="Favicon" class="favicon-img" (error)="onFaviconError()" />
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .tab-pane {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .branding-intro {
      margin-bottom: 2px;
    }

    .branding-header-title {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .branding-header-sub {
      font-size: 11.5px;
      color: #64748b;
      margin: 2px 0 0 0;
    }

    .branding-alert {
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 11.5px;
      font-weight: 600;
    }

    .branding-alert.error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
    }

    .branding-fields-wrapper {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .field-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field-label {
      font-size: 12.5px;
      font-weight: 700;
      color: #0f172a;
    }

    .field-desc {
      font-size: 11px;
      color: #64748b;
      margin: 0 0 6px 0;
      line-height: 1.35;
    }

    .text-input {
      width: 100%;
      padding: 8px 12px;
      font-size: 13px;
      color: #0f172a;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      outline: none;
      box-sizing: border-box;
      font-family: inherit;
    }

    .text-input:focus {
      border-color: #2563eb;
      background: #ffffff;
    }

    .logo-preview-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 4px;
    }

    .logo-box {
      width: 64px;
      height: 64px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }

    .logo-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .no-logo-placeholder {
      font-size: 10px;
      font-weight: 600;
      color: #94a3b8;
    }

    .logo-action-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .btn-action-brand {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      font-size: 11.5px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
    }

    .btn-upload {
      background: #2563eb;
      color: #ffffff;
      border: 1px solid #2563eb;
    }

    .btn-upload:hover {
      background: #1d4ed8;
      border-color: #1d4ed8;
    }

    .btn-remove {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .btn-remove:hover {
      background: #fee2e2;
    }

    .btn-reset-default {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }

    .btn-reset-default:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .brand-colors-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 4px;
    }

    .color-item-wrap {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .color-item-lbl {
      font-size: 11px;
      font-weight: 600;
      color: #475569;
    }

    .color-picker-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .color-swatch-input {
      width: 36px;
      height: 36px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 0;
      cursor: pointer;
      background: transparent;
      flex-shrink: 0;
    }

    .hex-input {
      font-family: monospace;
      font-size: 12px;
      padding: 7px 8px;
    }

    .favicon-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .favicon-preview-box {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      flex-shrink: 0;
    }

    .favicon-img {
      width: 20px;
      height: 20px;
      object-fit: contain;
    }

    /* Dark Mode styles for branding tab */
    :host-context([data-theme='dark']) .branding-header-title,
    :host-context(.dark-theme) .branding-header-title {
      color: #f8fafc;
    }

    :host-context([data-theme='dark']) .field-card,
    :host-context(.dark-theme) .field-card {
      background: #0b1220;
      border-color: #243247;
    }

    :host-context([data-theme='dark']) .field-label,
    :host-context(.dark-theme) .field-label {
      color: #f8fafc;
    }

    :host-context([data-theme='dark']) .text-input,
    :host-context(.dark-theme) .text-input {
      background: #111827;
      border-color: #243247;
      color: #f8fafc;
    }

    :host-context([data-theme='dark']) .logo-box,
    :host-context(.dark-theme) .logo-box,
    :host-context([data-theme='dark']) .favicon-preview-box,
    :host-context(.dark-theme) .favicon-preview-box {
      background: #111827;
      border-color: #243247;
    }

    :host-context([data-theme='dark']) .btn-reset-default,
    :host-context(.dark-theme) .btn-reset-default {
      background: #111827;
      border-color: #243247;
      color: #cbd5e1;
    }
  `]
})
export class BrandingTabComponent {
  private appearanceService = inject(AppearanceService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  uploadError: string | null = null;

  get draftBranding(): BrandingConfig {
    return this.appearanceService.draft.branding;
  }

  get primaryColor(): string {
    return this.appearanceService.draft.branding.primaryColor || this.appearanceService.draft.colors.primary || '#2563eb';
  }

  get secondaryColor(): string {
    return this.appearanceService.draft.branding.secondaryColor || this.appearanceService.draft.colors.secondary || '#475569';
  }

  onAppNameChange(appName: string): void {
    this.appearanceService.updateDraftBranding({
      applicationName: appName,
      appName: appName,
      appTitle: appName
    });
  }

  onSubtitleChange(appSubtitle: string): void {
    this.appearanceService.updateDraftBranding({ appSubtitle });
  }

  onPrimaryColorChange(color: string): void {
    this.appearanceService.updateDraftBranding({ primaryColor: color });
    this.appearanceService.updateDraftColors({ primary: color, accent: color });
  }

  onSecondaryColorChange(color: string): void {
    this.appearanceService.updateDraftBranding({ secondaryColor: color });
    this.appearanceService.updateDraftColors({ secondary: color });
  }

  onFaviconChange(faviconUrl: string): void {
    this.appearanceService.updateDraftBranding({ faviconUrl });
  }

  onFaviconError(): void {
    console.warn('Favicon URL failed to load');
  }

  onFileSelected(event: Event): void {
    this.uploadError = null;
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // 1. Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.uploadError = `Invalid file format (${file.type || 'unknown'}). Please upload a PNG, JPEG, SVG, or WebP image.`;
      return;
    }

    // 2. Validate file size (max 2MB)
    const maxSizeBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.uploadError = `File size ${(file.size / (1024 * 1024)).toFixed(2)} MB exceeds the maximum 2.0 MB limit.`;
      return;
    }

    // 3. Read image as Data URL
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;

      // Call API endpoint /api/appearance/logo
      this.http.post<{ success: boolean; logoUrl: string }>('/api/appearance/logo', {
        fileData: dataUrl,
        filename: file.name
      }).subscribe({
        next: (res) => {
          const versionedUrl = res?.logoUrl || `${dataUrl}#v=${Date.now()}`;
          this.appearanceService.updateDraftBranding({ logoUrl: versionedUrl });
        },
        error: (err) => {
          // If server rejects, display error
          this.uploadError = err.error?.message || 'Failed to upload logo to server.';
        }
      });
    };
    reader.onerror = () => {
      this.uploadError = 'Error reading image file. Please try another file.';
    };
    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    this.uploadError = null;
    this.appearanceService.updateDraftBranding({ logoUrl: '' });
  }

  resetToDefaultLogo(): void {
    this.uploadError = null;
    this.appearanceService.updateDraftBranding({
      logoUrl: DEFAULT_APPEARANCE_STATE.branding.logoUrl,
      applicationName: DEFAULT_APPEARANCE_STATE.branding.applicationName,
      appName: DEFAULT_APPEARANCE_STATE.branding.appName,
      appTitle: DEFAULT_APPEARANCE_STATE.branding.appTitle,
      appSubtitle: DEFAULT_APPEARANCE_STATE.branding.appSubtitle,
      primaryColor: DEFAULT_APPEARANCE_STATE.colors.primary,
      secondaryColor: DEFAULT_APPEARANCE_STATE.colors.secondary
    });
    this.appearanceService.updateDraftColors({
      primary: DEFAULT_APPEARANCE_STATE.colors.primary,
      secondary: DEFAULT_APPEARANCE_STATE.colors.secondary
    });
  }
}
