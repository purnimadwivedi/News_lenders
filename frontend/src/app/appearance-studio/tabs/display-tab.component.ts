import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppearanceService } from '../appearance.service';
import {
  DisplayConfig,
  TypographyScale,
  LanguageCode,
  DISPLAY_LANGUAGES,
  DisplayLanguageOption
} from '../appearance.models';

@Component({
  selector: 'app-display-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="display-tab-container">
      
      <!-- Section A: Typography Scale -->
      <section class="config-section" aria-labelledby="typography-heading">
        <h3 id="typography-heading" class="section-title">Typography Scale</h3>
        
        <div class="typography-segmented-control" role="radiogroup" aria-label="Typography Scale">
          <button type="button" 
                  class="segment-btn" 
                  [class.active]="display.typographyScale === 'small'" 
                  (click)="setTypographyScale('small')"
                  role="radio"
                  [attr.aria-checked]="display.typographyScale === 'small'"
                  aria-label="Small typography scale">
            Small
          </button>
          
          <button type="button" 
                  class="segment-btn" 
                  [class.active]="display.typographyScale === 'medium'" 
                  (click)="setTypographyScale('medium')"
                  role="radio"
                  [attr.aria-checked]="display.typographyScale === 'medium'"
                  aria-label="Medium typography scale (Default)">
            Medium
          </button>
          
          <button type="button" 
                  class="segment-btn" 
                  [class.active]="display.typographyScale === 'large'" 
                  (click)="setTypographyScale('large')"
                  role="radio"
                  [attr.aria-checked]="display.typographyScale === 'large'"
                  aria-label="Large typography scale">
            Large
          </button>
        </div>
      </section>

      <!-- Section B: Language Preference -->
      <section class="config-section" aria-labelledby="language-heading">
        <h3 id="language-heading" class="section-title">Language Preference</h3>

        <div class="languages-grid" role="radiogroup" aria-label="Language Preference">
          <button *ngFor="let lang of languages" 
                  type="button" 
                  class="language-card" 
                  [class.selected]="display.language === lang.code" 
                  (click)="setLanguage(lang.code)"
                  role="radio"
                  [attr.aria-checked]="display.language === lang.code"
                  [attr.aria-label]="lang.label">
            <span class="language-name">{{ lang.label }}</span>
          </button>
        </div>
      </section>

    </div>
  `,
  styles: [`
    .display-tab-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .config-section {
      display: flex;
      flex-direction: column;
    }

    .section-title {
      font-size: 13.5px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 10px 0;
      letter-spacing: -0.01em;
    }

    /* ----------------------------------------------------
       Typography Scale Segmented Control
       ---------------------------------------------------- */
    .typography-segmented-control {
      display: flex;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 3px;
      gap: 3px;
      width: 100%;
      box-sizing: border-box;
    }

    .segment-btn {
      flex: 1;
      padding: 7px 12px;
      font-size: 12.5px;
      font-weight: 500;
      border: 1px solid transparent;
      background: transparent;
      color: #64748b;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
    }

    .segment-btn:hover:not(.active) {
      color: #0f172a;
      background: rgba(0, 0, 0, 0.02);
    }

    .segment-btn:focus-visible {
      outline: 2px solid #2563eb;
      outline-offset: 1px;
    }

    .segment-btn.active {
      background: #ffffff;
      color: #0f172a;
      font-weight: 700;
      border-color: #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    }

    /* ----------------------------------------------------
       Language Preference Responsive Grid
       ---------------------------------------------------- */
    .languages-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px 12px;
    }

    .language-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 12.5px;
      font-weight: 500;
      color: #334155;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      text-align: left;
      width: 100%;
      box-sizing: border-box;
      outline: none;
      user-select: none;
    }

    .language-card:hover:not(.selected) {
      border-color: #cbd5e1;
      background: #f8fafc;
      color: #0f172a;
    }

    .language-card:focus-visible {
      outline: 2px solid #2563eb;
      outline-offset: 2px;
    }

    .language-card.selected {
      border: 2px solid #2563eb;
      color: #2563eb;
      font-weight: 600;
      padding: 9px 13px; /* Compensate for 2px border to prevent layout shift */
      background: #ffffff;
      box-shadow: 0 1px 2px rgba(37, 99, 235, 0.08);
    }

    .language-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    @media (max-width: 480px) {
      .languages-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DisplayTabComponent {
  private appearanceService = inject(AppearanceService);

  readonly languages: DisplayLanguageOption[] = DISPLAY_LANGUAGES;

  get display(): DisplayConfig {
    return this.appearanceService.draft.display;
  }

  setTypographyScale(scale: TypographyScale): void {
    this.appearanceService.updateDraftDisplay({ typographyScale: scale });
  }

  setLanguage(code: LanguageCode): void {
    this.appearanceService.updateDraftDisplay({ language: code });
  }
}
