import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppearanceService } from '../appearance.service';
import { AuthService } from '../../auth.service';
import { CarouselConfig, CarouselSlide } from '../appearance.models';

@Component({
  selector: 'app-carousel-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tab-pane">
      <div *ngIf="!isAdmin" class="admin-lock-card">
        <div class="lock-icon">🔒</div>
        <div class="lock-details">
          <span class="lock-title">Administrator Access Required</span>
          <span class="lock-sub">Global announcement carousels and top portal alerts require Admin privileges to create and publish.</span>
        </div>
      </div>

      <div [class.disabled-area]="!isAdmin">
        <div class="section-title">Top Announcement Carousel</div>
        <p class="section-desc">Broadcast high-priority alerts, policy changes, and portal updates to all lender reviewers.</p>

        <div class="setting-card">
          <div class="toggle-row">
            <div>
              <div class="row-label">Enable Portal Announcement Carousel</div>
              <div class="row-sub">Renders rotating headline banner above the dashboard content</div>
            </div>
            <input type="checkbox" 
                   [ngModel]="carousel.enabled" 
                   (ngModelChange)="updateCarouselField('enabled', $event)" 
                   [disabled]="!isAdmin"
                   class="custom-toggle-input" />
          </div>

          <div *ngIf="carousel.enabled" class="carousel-options-area">
            <div class="slider-row">
              <div class="slider-header">
                <span class="slider-label">Auto-Rotation Interval</span>
                <span class="slider-val">{{ carousel.intervalSeconds }} seconds</span>
              </div>
              <input type="range" 
                     min="3" 
                     max="15" 
                     step="1" 
                     [ngModel]="carousel.intervalSeconds" 
                     (ngModelChange)="updateCarouselField('intervalSeconds', $event)" 
                     [disabled]="!isAdmin"
                     class="range-slider" />
            </div>

            <div class="slides-header">
              <span class="slides-title">Announcement Slides ({{ carousel.slides.length }})</span>
              <button type="button" 
                      class="btn-add-slide" 
                      (click)="addNewSlide()" 
                      [disabled]="!isAdmin">
                + Add Slide
              </button>
            </div>

            <div class="slides-list">
              <div *ngFor="let s of carousel.slides; let i = index" class="slide-card">
                <div class="slide-card-header">
                  <div class="slide-index-pill">Slide {{ i + 1 }}</div>
                  <div class="slide-header-actions">
                    <label class="slide-active-toggle" title="Toggle active">
                      <input type="checkbox" 
                             [ngModel]="s.active" 
                             (ngModelChange)="toggleSlideActive(i, $event)" 
                             [disabled]="!isAdmin" />
                      <span>{{ s.active ? 'Active' : 'Disabled' }}</span>
                    </label>
                    <button type="button" 
                            class="btn-delete-slide" 
                            (click)="removeSlide(i)" 
                            [disabled]="!isAdmin"
                            title="Delete slide">✕</button>
                  </div>
                </div>

                <div class="slide-inputs-grid">
                  <div>
                    <label class="form-label">Headline Title</label>
                    <input type="text" 
                           [(ngModel)]="s.title" 
                           (ngModelChange)="saveSlides()" 
                           [disabled]="!isAdmin" 
                           class="form-input" 
                           placeholder="Announcement headline..." />
                  </div>
                  <div>
                    <label class="form-label">Badge Label</label>
                    <input type="text" 
                           [(ngModel)]="s.badge" 
                           (ngModelChange)="saveSlides()" 
                           [disabled]="!isAdmin" 
                           class="form-input" 
                           placeholder="e.g. Priority Alert" />
                  </div>
                  <div class="full-col">
                    <label class="form-label">Description Content</label>
                    <textarea [(ngModel)]="s.description" 
                              (ngModelChange)="saveSlides()" 
                              [disabled]="!isAdmin" 
                              class="form-input" 
                              rows="2" 
                              placeholder="Summary of advisory or update..."></textarea>
                  </div>
                  <div>
                    <label class="form-label">Action Button Text</label>
                    <input type="text" 
                           [(ngModel)]="s.buttonText" 
                           (ngModelChange)="saveSlides()" 
                           [disabled]="!isAdmin" 
                           class="form-input" 
                           placeholder="e.g. View Analysis" />
                  </div>
                  <div>
                    <label class="form-label">Action Link URL</label>
                    <input type="text" 
                           [(ngModel)]="s.buttonUrl" 
                           (ngModelChange)="saveSlides()" 
                           [disabled]="!isAdmin" 
                           class="form-input" 
                           placeholder="/news or https://..." />
                  </div>
                  <div class="full-col">
                    <label class="form-label">Background Gradient</label>
                    <div class="gradient-presets-row">
                      <button *ngFor="let g of gradientPresets" 
                              type="button" 
                              class="gradient-pill" 
                              [style.background]="g.gradient" 
                              [class.active]="s.bgGradient === g.gradient"
                              (click)="setSlideGradient(i, g.gradient)"
                              [title]="g.name"></button>
                    </div>
                  </div>
                </div>

                <!-- Slide Mini Preview -->
                <div class="slide-preview-banner" [style.background]="s.bgGradient">
                  <div class="preview-badge">{{ s.badge || 'Notice' }}</div>
                  <div class="preview-title">{{ s.title || 'Slide Title' }}</div>
                  <div class="preview-desc">{{ s.description || 'Slide description preview text' }}</div>
                  <button *ngIf="s.buttonText" type="button" class="preview-btn">{{ s.buttonText }} →</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tab-pane { padding: 4px 0; }
    .section-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .section-desc { font-size: 12.5px; color: #64748b; margin-bottom: 16px; line-height: 1.4; }

    .admin-lock-card {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 18px;
    }
    .lock-icon { font-size: 20px; }
    .lock-details { display: flex; flex-direction: column; }
    .lock-title { font-size: 13.5px; font-weight: 700; color: #991b1b; }
    .lock-sub { font-size: 11.5px; color: #b91c1c; margin-top: 2px; }

    .disabled-area {
      opacity: 0.75;
      pointer-events: none;
    }

    .setting-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px;
    }

    .toggle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .row-label { font-size: 13.5px; font-weight: 700; color: #0f172a; }
    .row-sub { font-size: 11.5px; color: #64748b; margin-top: 2px; }
    .custom-toggle-input {
      width: 20px;
      height: 20px;
      accent-color: var(--accent, #f37819);
      cursor: pointer;
    }

    .carousel-options-area {
      margin-top: 18px;
      padding-top: 18px;
      border-top: 1px solid #f1f5f9;
    }

    .slider-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 20px;
    }
    .slider-header {
      display: flex;
      justify-content: space-between;
      font-size: 12.5px;
      color: #475569;
    }
    .slider-label { font-weight: 600; }
    .slider-val { font-weight: 700; color: #0f172a; font-family: monospace; }
    .range-slider { width: 100%; accent-color: var(--accent, #f37819); cursor: pointer; }

    .slides-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .slides-title { font-size: 13.5px; font-weight: 700; color: #0f172a; }
    .btn-add-slide {
      background: var(--accent, #f37819);
      color: #ffffff;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      border: none;
    }
    .btn-add-slide:hover { background: #ea580c; }

    .slides-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .slide-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
    }
    .slide-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .slide-index-pill {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      background: #e2e8f0;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .slide-header-actions { display: flex; align-items: center; gap: 12px; }
    .slide-active-toggle {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
    }
    .btn-delete-slide {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 11px;
      cursor: pointer;
    }

    .slide-inputs-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    @media (max-width: 580px) {
      .slide-inputs-grid { grid-template-columns: 1fr; }
    }
    .full-col { grid-column: 1 / -1; }

    .form-label { font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 4px; display: block; text-transform: uppercase; }
    .form-input {
      width: 100%;
      padding: 7px 10px;
      font-size: 12.5px;
      color: #0f172a;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      box-sizing: border-box;
      font-family: inherit;
    }
    .form-input:focus { border-color: var(--accent, #f37819); outline: none; }

    .gradient-presets-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
    .gradient-pill {
      width: 32px;
      height: 20px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.4);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      cursor: pointer;
    }
    .gradient-pill.active { outline: 2px solid #0f172a; outline-offset: 1px; }

    .slide-preview-banner {
      margin-top: 12px;
      padding: 12px 14px;
      border-radius: 8px;
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    .preview-badge {
      font-size: 9.5px;
      font-weight: 700;
      color: #fbbf24;
      background: rgba(0, 0, 0, 0.35);
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 4px;
    }
    .preview-title { font-size: 13.5px; font-weight: 700; margin-bottom: 2px; }
    .preview-desc { font-size: 11px; opacity: 0.9; margin-bottom: 6px; line-height: 1.3; }
    .preview-btn {
      background: #ffffff;
      color: #0f172a;
      border: none;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      cursor: default;
    }
  `]
})
export class CarouselTabComponent {
  private appearanceService = inject(AppearanceService);
  private authService = inject(AuthService);

  get isAdmin(): boolean {
    return this.authService.getRole() === 'admin';
  }

  get carousel(): CarouselConfig {
    return this.appearanceService.state.carousel;
  }

  gradientPresets = [
    { name: 'Warm Chocolate', gradient: 'linear-gradient(135deg, #492812 0%, #2e1709 100%)' },
    { name: 'Midnight Navy', gradient: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)' },
    { name: 'Forest Emerald', gradient: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)' },
    { name: 'Royal Violet', gradient: 'linear-gradient(135deg, #581c87 0%, #2e1065 100%)' },
    { name: 'Sunset Crimson', gradient: 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)' }
  ];

  updateCarouselField(field: keyof CarouselConfig, value: any): void {
    if (!this.isAdmin) return;
    this.appearanceService.updateCarousel({ [field]: value });
  }

  addNewSlide(): void {
    if (!this.isAdmin) return;
    const newSlide: CarouselSlide = {
      id: 'slide-' + Date.now(),
      title: 'New Announcement',
      description: 'Important regulatory or system broadcast details for lender partners.',
      badge: 'Advisory',
      buttonText: 'Learn More',
      buttonUrl: '/news',
      bgGradient: 'linear-gradient(135deg, #492812 0%, #2e1709 100%)',
      active: true
    };
    const updated = [...this.carousel.slides, newSlide];
    this.appearanceService.updateCarousel({ slides: updated });
  }

  removeSlide(index: number): void {
    if (!this.isAdmin) return;
    const updated = this.carousel.slides.filter((_, i) => i !== index);
    this.appearanceService.updateCarousel({ slides: updated });
  }

  toggleSlideActive(index: number, active: boolean): void {
    if (!this.isAdmin) return;
    const updated = [...this.carousel.slides];
    updated[index] = { ...updated[index], active };
    this.appearanceService.updateCarousel({ slides: updated });
  }

  setSlideGradient(index: number, gradient: string): void {
    if (!this.isAdmin) return;
    const updated = [...this.carousel.slides];
    updated[index] = { ...updated[index], bgGradient: gradient };
    this.appearanceService.updateCarousel({ slides: updated });
  }

  saveSlides(): void {
    if (!this.isAdmin) return;
    this.appearanceService.updateCarousel({ slides: [...this.carousel.slides] });
  }
}
