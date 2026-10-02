import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppearanceService, DEFAULT_APPEARANCE_STATE } from '../appearance.service';
import { DEFAULT_AUTH_LOGO } from '../../auth-logo';
import { BrandingConfig } from '../appearance.models';

@Component({
  selector: 'app-branding-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="branding-tab-pane">
      
      <!-- Alert message if file upload errors -->
      <div *ngIf="uploadError" class="branding-alert error">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ uploadError }}</span>
      </div>

      <!-- SECTION 1: Text & Identity -->
      <div class="branding-section">
        <h4 class="section-title">Text &amp; Identity</h4>

        <div class="field-group">
          <label class="field-label" for="appNameInput">Application Name</label>
          <input id="appNameInput"
                 type="text" 
                 class="branding-input" 
                 [ngModel]="draftBranding.applicationName || draftBranding.appName || 'DSA Portal'" 
                 (ngModelChange)="onAppNameChange($event)"
                 placeholder="e.g. DSA Portal" />
        </div>

        <div class="field-group">
          <label class="field-label" for="termsInput">Terms &amp; Privacy Text</label>
          <input id="termsInput"
                 type="text" 
                 class="branding-input" 
                 [ngModel]="draftBranding.termsPrivacyText || defaultTermsText" 
                 (ngModelChange)="onTermsChange($event)"
                 placeholder="By signing in you agree to our Terms of Service and Privacy Policy." />
        </div>
      </div>

      <!-- SECTION 2: Logos & Assets -->
      <div class="branding-section">
        <h4 class="section-title">Logos &amp; Assets</h4>

        <!-- 2A. Login Screen Logo -->
        <div class="asset-field-group">
          <label class="field-label">Login Screen Logo</label>

          <div *ngIf="hasLoginLogo" class="asset-preview-card">
            <div class="asset-logo-box">
              <img [src]="loginLogoDisplay" (error)="onLoginLogoError($event)" alt="Login Logo" class="asset-img" />
            </div>
            <button type="button" class="btn-remove-asset" (click)="removeLoginLogo()">
              Remove
            </button>
          </div>

          <div *ngIf="!hasLoginLogo" class="asset-upload-card">
            <label class="upload-dropzone">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>Upload image</span>
              <input type="file" 
                     accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp" 
                     (change)="onLoginLogoFileSelected($event)" 
                     style="display: none;" />
            </label>
          </div>
        </div>

        <!-- 2B. Sidebar Logo -->
        <div class="asset-field-group">
          <label class="field-label">Sidebar Logo</label>

          <div *ngIf="hasSidebarLogo" class="asset-preview-card">
            <div class="asset-logo-box">
              <img [src]="sidebarLogoDisplay" (error)="onSidebarLogoError($event)" alt="Sidebar Logo" class="asset-img" />
            </div>
            <button type="button" class="btn-remove-asset" (click)="removeSidebarLogo()">
              Remove
            </button>
          </div>

          <div *ngIf="!hasSidebarLogo" class="asset-upload-card">
            <label class="upload-dropzone">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>Upload image</span>
              <input type="file" 
                     accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp" 
                     (change)="onSidebarLogoFileSelected($event)" 
                     style="display: none;" />
            </label>
          </div>
        </div>

        <!-- 2C. Favicon -->
        <div class="asset-field-group">
          <label class="field-label">Favicon</label>

          <div *ngIf="hasFavicon" class="asset-preview-card">
            <div class="asset-logo-box favicon-box">
              <img [src]="draftBranding.favicon || draftBranding.faviconUrl" (error)="removeFavicon()" alt="Favicon" class="favicon-img" />
            </div>
            <button type="button" class="btn-remove-asset" (click)="removeFavicon()">
              Remove
            </button>
          </div>

          <div *ngIf="!hasFavicon" class="asset-upload-card">
            <label class="upload-dropzone">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>Upload image</span>
              <input type="file" 
                     accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp, image/x-icon, image/vnd.microsoft.icon" 
                     (change)="onFaviconFileSelected($event)" 
                     style="display: none;" />
            </label>
          </div>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .branding-tab-pane {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 0;
      font-family: inherit;
      overflow: hidden;
    }

    .branding-alert {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
    }
    .branding-alert.error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
    }

    .branding-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .section-title {
      margin: 0;
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.2px;
    }

    .field-group, .asset-field-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .field-label {
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .branding-input {
      width: 100%;
      height: 36px;
      padding: 0 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 13px;
      color: #0f172a;
      background: #ffffff;
      transition: all 0.15s ease;
      box-sizing: border-box;
    }
    .branding-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .asset-preview-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 42px;
      padding: 0 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: #ffffff;
      box-sizing: border-box;
    }

    .asset-logo-box {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      height: 32px;
      max-width: 140px;
    }
    .asset-img {
      max-height: 28px;
      max-width: 120px;
      object-fit: contain;
    }
    .favicon-box .favicon-img {
      width: 20px;
      height: 20px;
      object-fit: contain;
    }

    .btn-remove-asset {
      background: transparent;
      border: none;
      color: #ef4444;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      padding: 4px;
      transition: color 0.15s ease;
    }
    .btn-remove-asset:hover {
      color: #dc2626;
      text-decoration: underline;
    }

    .upload-dropzone {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      height: 38px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: #ffffff;
      color: #475569;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      box-sizing: border-box;
    }
    .upload-dropzone:hover {
      border-color: #3b82f6;
      color: #2563eb;
      background: #eff6ff;
    }

    /* Dark Mode styling */
    :host-context([data-theme='dark']) .section-title,
    :host-context(.dark-theme) .section-title {
      color: #f8fafc;
    }
    :host-context([data-theme='dark']) .field-label,
    :host-context(.dark-theme) .field-label {
      color: #94a3b8;
    }
    :host-context([data-theme='dark']) .branding-input,
    :host-context(.dark-theme) .branding-input {
      background: #0f172a;
      border-color: #334155;
      color: #f8fafc;
    }
    :host-context([data-theme='dark']) .asset-preview-card,
    :host-context(.dark-theme) .asset-preview-card,
    :host-context([data-theme='dark']) .upload-dropzone,
    :host-context(.dark-theme) .upload-dropzone {
      background: #0f172a;
      border-color: #334155;
      color: #cbd5e1;
    }
  `]
})
export class BrandingTabComponent {
  private appearanceService = inject(AppearanceService);

  uploadError: string | null = null;
  readonly defaultTermsText = 'By signing in you agree to our Terms of Service and Privacy Policy.';
  readonly defaultAppLogo = DEFAULT_AUTH_LOGO;

  get draftBranding(): BrandingConfig {
    return this.appearanceService.draft.branding;
  }

  get hasLoginLogo(): boolean {
    const l = this.draftBranding.loginLogo;
    return !!(l && l.trim().length > 0);
  }

  get loginLogoDisplay(): string {
    const l = this.draftBranding.loginLogo;
    if (!l || l.length === 9122 || (l.startsWith('data:image/jpeg;base64,') && l.length < 12000)) {
      return this.defaultAppLogo;
    }
    return l;
  }

  get hasSidebarLogo(): boolean {
    const s = this.draftBranding.sidebarLogo;
    return !!(s && s.trim().length > 0);
  }

  get sidebarLogoDisplay(): string {
    const s = this.draftBranding.sidebarLogo;
    if (!s || s.length === 9122 || (s.startsWith('data:image/jpeg;base64,') && s.length < 12000)) {
      return this.defaultAppLogo;
    }
    return s;
  }

  get hasFavicon(): boolean {
    const f = this.draftBranding.favicon || this.draftBranding.faviconUrl;
    return !!(f && f.trim().length > 0);
  }

  onAppNameChange(val: string): void {
    this.appearanceService.updateDraftBranding({
      applicationName: val,
      appName: val,
      appTitle: val
    });
  }

  onTermsChange(val: string): void {
    this.appearanceService.updateDraftBranding({
      termsPrivacyText: val
    });
  }

  onLoginLogoFileSelected(event: Event): void {
    this.processImageUpload(event, (dataUrl) => {
      this.appearanceService.updateDraftBranding({
        loginLogo: dataUrl,
        logoUrl: dataUrl
      });
    });
  }

  removeLoginLogo(): void {
    this.uploadError = null;
    this.appearanceService.updateDraftBranding({
      loginLogo: ''
    });
  }

  onLoginLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.defaultAppLogo) {
      img.src = this.defaultAppLogo;
    }
  }

  onSidebarLogoFileSelected(event: Event): void {
    this.processImageUpload(event, (dataUrl) => {
      this.appearanceService.updateDraftBranding({
        sidebarLogo: dataUrl
      });
    });
  }

  removeSidebarLogo(): void {
    this.uploadError = null;
    this.appearanceService.updateDraftBranding({
      sidebarLogo: ''
    });
  }

  onSidebarLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.defaultAppLogo) {
      img.src = this.defaultAppLogo;
    }
  }

  onFaviconFileSelected(event: Event): void {
    this.processImageUpload(event, (dataUrl) => {
      this.appearanceService.updateDraftBranding({
        favicon: dataUrl,
        faviconUrl: dataUrl
      });
    });
  }

  removeFavicon(): void {
    this.uploadError = null;
    this.appearanceService.updateDraftBranding({
      favicon: '',
      faviconUrl: ''
    });
  }

  private processImageUpload(event: Event, onSuccess: (dataUrl: string) => void): void {
    this.uploadError = null;
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!allowed.includes(file.type) && !file.name.endsWith('.ico')) {
      this.uploadError = 'Please upload a valid image file (PNG, JPG, SVG, WEBP, or ICO).';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.uploadError = 'Image file size exceeds maximum limit of 2MB.';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onSuccess(dataUrl);
      input.value = '';
    };
    reader.onerror = () => {
      this.uploadError = 'Failed to read image file.';
    };
    reader.readAsDataURL(file);
  }
}
