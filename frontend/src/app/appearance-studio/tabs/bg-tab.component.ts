import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppearanceService } from '../appearance.service';
import { BgConfig, BgStyle } from '../appearance.models';

@Component({
  selector: 'app-bg-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tab-pane">
      
      <!-- 1. Application Background -->
      <div class="setting-section">
        <h3 class="section-title">Application Background</h3>
        <p class="section-desc">Select the backdrop style for the workspace viewport.</p>

        <!-- Style Choice Segmented Pills -->
        <div class="bg-style-selector">
          <button type="button" 
                  class="style-pill" 
                  [class.active]="bg.style === 'solid'"
                  (click)="setStyle('solid')">
            Solid
          </button>
          <button type="button" 
                  class="style-pill" 
                  [class.active]="bg.style === 'gradient'"
                  (click)="setStyle('gradient')">
            Gradient
          </button>
          <button type="button" 
                  class="style-pill" 
                  [class.active]="bg.style === 'image'"
                  (click)="setStyle('image')">
            Image
          </button>
        </div>

        <!-- Solid Background Controls -->
        <div *ngIf="bg.style === 'solid'" class="sub-controls-box">
          <div class="setting-row">
            <span class="setting-label">Canvas Color</span>
            <div class="picker-group">
              <label class="color-swatch-box" [style.background]="bg.appBg || '#f8fafc'">
                <input type="color" 
                       class="hidden-picker" 
                       [ngModel]="bg.appBg || '#f8fafc'" 
                       (ngModelChange)="onAppBgChange($event)" />
              </label>
              <input type="text" 
                     class="hex-box" 
                     [ngModel]="bg.appBg || '#f8fafc'" 
                     (ngModelChange)="onAppBgChange($event)" 
                     maxlength="7" />
            </div>
          </div>
        </div>

        <!-- Gradient Controls -->
        <div *ngIf="bg.style === 'gradient'" class="sub-controls-box">
          <div class="gradient-grid">
            <div *ngFor="let g of gradientPresets" 
                 class="gradient-card" 
                 [style.background]="g.css"
                 [class.active]="bg.gradientPreset === g.css"
                 (click)="onGradientSelect(g.css)">
              <span class="gradient-title">{{ g.name }}</span>
            </div>
          </div>
        </div>

        <!-- Image Upload Controls -->
        <div *ngIf="bg.style === 'image'" class="sub-controls-box">
          <div class="image-upload-wrap">
            <label class="btn-file-upload">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>Upload Background Image</span>
              <input type="file" accept="image/*" (change)="onFileSelected($event)" style="display: none;" />
            </label>

            <button *ngIf="bg.customImageUrl" 
                    type="button" 
                    class="btn-remove-img" 
                    (click)="removeImage()">
              Remove
            </button>
          </div>

          <div *ngIf="bg.customImageUrl" class="image-preview-thumb">
            <img [src]="bg.customImageUrl" alt="Background preview" />
          </div>
        </div>
      </div>

      <div class="section-divider"></div>

      <!-- 2. Surface Background (Cards, Panels, Content area) -->
      <div class="setting-section">
        <h3 class="section-title">Surface Background</h3>
        <p class="section-desc">Customize container cards, data tables, and modal backgrounds.</p>

        <div class="setting-card-rows">
          <div class="setting-row">
            <div>
              <div class="setting-label">Card & Panel Surface</div>
              <div class="setting-sub">Base color for content cards</div>
            </div>
            <div class="picker-group">
              <label class="color-swatch-box" [style.background]="bg.surfaceBg || '#ffffff'">
                <input type="color" 
                       class="hidden-picker" 
                       [ngModel]="bg.surfaceBg || '#ffffff'" 
                       (ngModelChange)="onSurfaceBgChange($event)" />
              </label>
              <input type="text" 
                     class="hex-box" 
                     [ngModel]="bg.surfaceBg || '#ffffff'" 
                     (ngModelChange)="onSurfaceBgChange($event)" 
                     maxlength="7" />
            </div>
          </div>
        </div>
      </div>

      <div class="section-divider"></div>

      <!-- 3. Sidebar Background -->
      <div class="setting-section">
        <h3 class="section-title">Sidebar Background</h3>
        <p class="section-desc">Customize the vertical left navigation bar color.</p>

        <div class="setting-card-rows">
          <div class="setting-row">
            <div>
              <div class="setting-label">Sidebar Background Color</div>
              <div class="setting-sub">Applied to navigation bar and brand area</div>
            </div>
            <div class="picker-group">
              <label class="color-swatch-box" [style.background]="bg.sidebarBg || '#1e293b'">
                <input type="color" 
                       class="hidden-picker" 
                       [ngModel]="bg.sidebarBg || '#1e293b'" 
                       (ngModelChange)="onSidebarBgChange($event)" />
              </label>
              <input type="text" 
                     class="hex-box" 
                     [ngModel]="bg.sidebarBg || '#1e293b'" 
                     (ngModelChange)="onSidebarBgChange($event)" 
                     maxlength="7" />
            </div>
          </div>

          <!-- Quick Sidebar Swatches -->
          <div class="quick-swatches">
            <span class="swatches-label">Presets:</span>
            <button type="button" 
                    *ngFor="let s of sidebarPresets" 
                    class="swatch-circle" 
                    [style.background]="s.color"
                    [class.active]="bg.sidebarBg === s.color"
                    (click)="onSidebarBgChange(s.color)"
                    [title]="s.name"></button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .tab-pane {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .setting-section {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: 0.2px;
    }

    .section-desc {
      font-size: 11px;
      color: #64748b;
      margin: 0;
    }

    .section-divider {
      height: 1px;
      background: #f1f5f9;
      margin: 0;
    }

    /* Style Pills */
    .bg-style-selector {
      display: flex;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 3px;
      gap: 3px;
    }

    .style-pill {
      flex: 1;
      padding: 7px 12px;
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      background: transparent;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
    }

    .style-pill.active {
      background: #2563eb;
      color: #ffffff;
      font-weight: 700;
      box-shadow: 0 1px 3px rgba(37, 99, 235, 0.2);
    }

    .sub-controls-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 12px;
    }

    .setting-card-rows {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .setting-label {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }

    .setting-sub {
      font-size: 10.5px;
      color: #64748b;
      margin-top: 1px;
    }

    .picker-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .color-swatch-box {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: 1.5px solid #cbd5e1;
      cursor: pointer;
      display: block;
      position: relative;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .hidden-picker {
      opacity: 0;
      width: 100%;
      height: 100%;
      cursor: pointer;
      position: absolute;
      inset: 0;
    }

    .hex-box {
      width: 82px;
      padding: 5px 8px;
      font-size: 11.5px;
      font-weight: 700;
      font-family: monospace;
      color: #0f172a;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      text-transform: uppercase;
      outline: none;
    }

    .hex-box:focus {
      border-color: #2563eb;
    }

    /* Gradients */
    .gradient-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .gradient-card {
      height: 36px;
      border-radius: 6px;
      border: 1.5px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 4px;
      transition: all 0.15s ease;
    }

    .gradient-card.active {
      border-color: #2563eb;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.3);
    }

    .gradient-title {
      font-size: 10.5px;
      font-weight: 700;
      color: #0f172a;
      background: rgba(255, 255, 255, 0.85);
      padding: 2px 6px;
      border-radius: 4px;
    }

    /* Image upload */
    .image-upload-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-file-upload {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      font-size: 11.5px;
      font-weight: 600;
      color: #2563eb;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-file-upload:hover {
      background: #dbeafe;
    }

    .btn-remove-img {
      padding: 6px 10px;
      font-size: 11.5px;
      font-weight: 600;
      color: #dc2626;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      cursor: pointer;
    }

    .image-preview-thumb {
      margin-top: 10px;
      height: 70px;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }

    .image-preview-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Quick Swatches */
    .quick-swatches {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-top: 2px;
      border-top: 1px dashed #f1f5f9;
    }

    .swatches-label {
      font-size: 10.5px;
      font-weight: 600;
      color: #94a3b8;
    }

    .swatch-circle {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 1.5px solid #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      cursor: pointer;
      padding: 0;
      transition: transform 0.12s;
    }

    .swatch-circle:hover {
      transform: scale(1.15);
    }

    .swatch-circle.active {
      outline: 2px solid #2563eb;
      outline-offset: 1px;
    }
  `]
})
export class BgTabComponent {
  private appearanceService = inject(AppearanceService);

  sidebarPresets = [
    { name: 'Dark Slate', color: '#1E293B' },
    { name: 'Pure Navy', color: '#0F172A' },
    { name: 'Deep Indigo', color: '#1E1B4B' },
    { name: 'Forest Dark', color: '#064E3B' },
    { name: 'Clean White', color: '#FFFFFF' }
  ];

  gradientPresets = [
    { name: 'Clean Slate', css: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)' },
    { name: 'Soft Blue', css: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)' },
    { name: 'Warm Amber', css: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)' },
    { name: 'Purple Tint', css: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)' }
  ];

  get bg(): BgConfig {
    return this.appearanceService.draft.bg;
  }

  setStyle(style: BgStyle): void {
    this.appearanceService.updateDraftBg({ style });
  }

  onAppBgChange(color: string): void {
    this.appearanceService.updateDraftBg({ appBg: color, bgColor: color });
  }

  onSurfaceBgChange(color: string): void {
    this.appearanceService.updateDraftBg({ surfaceBg: color, surfaceColor: color });
  }

  onSidebarBgChange(color: string): void {
    this.appearanceService.updateDraftBg({ sidebarBg: color });
  }

  onGradientSelect(css: string): void {
    this.appearanceService.updateDraftBg({ gradientPreset: css, appBg: '#f8fafc' });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.appearanceService.updateDraftBg({ customImageUrl: dataUrl, style: 'image' });
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.appearanceService.updateDraftBg({ customImageUrl: '', style: 'solid' });
  }
}
