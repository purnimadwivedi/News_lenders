import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppearanceService } from '../appearance.service';
import { ColorMode, THEME_PRESETS, ThemePreset } from '../appearance.models';

@Component({
  selector: 'app-theme-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tab-pane" [class.dark-mode]="draft.theme.mode === 'dark'">
      <!-- Section: Color Mode -->
      <div class="section-heading" id="color-mode-heading">COLOR MODE</div>
      
      <div class="color-mode-segmented" 
           role="radiogroup" 
           aria-labelledby="color-mode-heading">
        <button type="button" 
                role="radio"
                class="seg-btn" 
                [class.active]="draft.theme.mode === 'light'"
                [attr.aria-checked]="draft.theme.mode === 'light'"
                [attr.aria-selected]="draft.theme.mode === 'light'"
                tabindex="0"
                (keydown.arrowright)="setMode('dark')"
                (keydown.arrowdown)="setMode('dark')"
                (click)="setMode('light')">
          <span class="mode-glyph">☼</span> Light
        </button>

        <button type="button" 
                role="radio"
                class="seg-btn" 
                [class.active]="draft.theme.mode === 'dark'"
                [attr.aria-checked]="draft.theme.mode === 'dark'"
                [attr.aria-selected]="draft.theme.mode === 'dark'"
                tabindex="0"
                (keydown.arrowleft)="setMode('light')"
                (keydown.arrowup)="setMode('light')"
                (click)="setMode('dark')">
          <span class="mode-glyph">☾</span> Dark
        </button>
      </div>

      <div class="section-divider"></div>

      <!-- Section: Themes & Presets -->
      <div class="presets-header-row">
        <span class="section-heading">
          {{ draft.theme.mode === 'dark' ? 'DARK THEMES' : 'LIGHT THEMES' }}
        </span>
        <span class="presets-count">{{ presets.length }} presets</span>
      </div>

      <div class="presets-grid" role="listbox" aria-label="Theme presets">
        <div *ngFor="let p of presets" 
             role="option"
             tabindex="0"
             class="preset-card" 
             [class.selected]="draft.theme.presetId === p.id"
             [attr.aria-selected]="draft.theme.presetId === p.id"
             (click)="applyPreset(p.id)"
             (keydown.enter)="applyPreset(p.id)"
             (keydown.space)="applyPreset(p.id); $event.preventDefault()">
          
          <!-- Color Swatch Bars (Primary, Accent, Surface) -->
          <div class="swatch-bars">
            <span class="bar-line primary-bar" [style.background]="p.primary"></span>
            <span class="bar-line accent-bar" [style.background]="p.accent"></span>
            <span class="bar-line surface-bar" 
                  [style.background]="draft.theme.mode === 'dark' ? '#0b1220' : p.surface" 
                  [style.border]="draft.theme.mode === 'dark' ? '1px solid #243247' : ('1px solid ' + p.border)"></span>
          </div>

          <!-- Preset Name & Selection Indicator -->
          <div class="preset-footer">
            <span class="preset-name">{{ p.name }}</span>
            <span class="preset-check-icon" *ngIf="draft.theme.presetId === p.id">✓</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tab-pane {
      display: flex;
      flex-direction: column;
      gap: 16px;
      transition: color 0.15s ease;
    }

    .section-heading {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.6px;
      color: #64748b;
      text-transform: uppercase;
    }

    /* Segmented Control for Color Mode */
    .color-mode-segmented {
      display: flex;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 3px;
      gap: 3px;
      transition: background 0.15s ease, border-color 0.15s ease;
    }

    .seg-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 9px 16px;
      font-size: 13px;
      font-weight: 600;
      color: #475569;
      background: transparent;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
    }

    .seg-btn:focus-visible {
      outline: 2px solid var(--color-primary, #3b82f6);
      outline-offset: 2px;
    }

    .seg-btn.active {
      background: var(--color-primary, #2563eb);
      color: #ffffff;
      font-weight: 700;
      box-shadow: 0 1px 3px rgba(37, 99, 235, 0.3);
    }

    .seg-btn:not(.active):hover {
      background: rgba(255, 255, 255, 0.6);
      color: #0f172a;
    }

    .mode-glyph {
      font-size: 14px;
      line-height: 1;
    }

    .section-divider {
      height: 1px;
      background: #f1f5f9;
      margin: 4px 0;
      transition: background 0.15s ease;
    }

    /* Presets Header */
    .presets-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .presets-count {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 600;
    }

    /* Scrollable Presets Grid */
    .presets-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      max-height: 480px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .preset-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      cursor: pointer;
      transition: all 0.18s ease;
      display: flex;
      flex-direction: column;
      gap: 12px;
      position: relative;
    }

    .preset-card:focus-visible {
      outline: 2px solid var(--color-primary, #3b82f6);
      outline-offset: 2px;
    }

    .preset-card:hover {
      border-color: #93c5fd;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .preset-card.selected {
      border: 2px solid var(--color-primary, #2563eb);
      background: #f8faff;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.12);
      padding: 11px 13px; /* accommodate 2px border */
    }

    .swatch-bars {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .bar-line {
      display: block;
      height: 5px;
      border-radius: 3px;
      width: 100%;
    }

    .preset-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }

    .preset-name {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .preset-check-icon {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--color-primary, #2563eb);
      color: #ffffff;
      font-size: 10px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    /* ----------------------------------------------------
       Dark Mode Variations for Theme Tab
       ---------------------------------------------------- */
    .tab-pane.dark-mode .section-heading {
      color: #94a3b8;
    }

    .tab-pane.dark-mode .color-mode-segmented {
      background: #111827;
      border-color: #243247;
    }

    .tab-pane.dark-mode .seg-btn {
      color: #cbd5e1;
    }

    .tab-pane.dark-mode .seg-btn:not(.active):hover {
      background: rgba(255, 255, 255, 0.08);
      color: #f8fafc;
    }

    .tab-pane.dark-mode .section-divider {
      background: #243247;
    }

    .tab-pane.dark-mode .presets-count {
      color: #64748b;
    }

    .tab-pane.dark-mode .preset-card {
      background: #0b1220;
      border-color: #243247;
    }

    .tab-pane.dark-mode .preset-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
    }

    .tab-pane.dark-mode .preset-card.selected {
      border-color: var(--color-primary, #3b82f6);
      background: #111827;
      box-shadow: 0 2px 10px rgba(59, 130, 246, 0.2);
    }

    .tab-pane.dark-mode .preset-name {
      color: #f8fafc;
    }
  `]
})
export class ThemeTabComponent {
  private appearanceService = inject(AppearanceService);
  presets: ThemePreset[] = THEME_PRESETS;

  get draft() {
    return this.appearanceService.draft;
  }

  setMode(mode: ColorMode): void {
    this.appearanceService.updateDraftTheme({ mode });
  }

  applyPreset(presetId: string): void {
    this.appearanceService.applyDraftPreset(presetId);
  }
}

