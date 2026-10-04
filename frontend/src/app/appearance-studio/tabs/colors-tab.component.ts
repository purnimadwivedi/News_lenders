import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppearanceService } from '../appearance.service';
import { ColorsConfig } from '../appearance.models';

interface ColorSettingItem {
  key: keyof ColorsConfig;
  name: string;
  description: string;
}

@Component({
  selector: 'app-colors-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tab-pane">
      <div class="tab-intro">
        <h3 class="pane-title">Color Palette</h3>
        <p class="pane-subtitle">Configure design tokens and interface colors across the workspace.</p>
      </div>

      <div class="colors-list">
        <div class="color-row-card" *ngFor="let item of colorItems" [title]="item.name + ': ' + item.description">
          <!-- Native Color Picker Input -->
          <label class="color-picker-thumb" [style.background]="draftColors[item.key]">
            <input type="color" 
                   class="hidden-native-picker" 
                   [ngModel]="draftColors[item.key]" 
                   (ngModelChange)="onColorUpdate(item.key, $event)" />
          </label>

          <div class="color-text-meta">
            <span class="color-item-name">{{ item.name }}</span>
            <!-- Hex Value Text Input -->
            <input type="text" 
                   class="hex-code-input" 
                   [ngModel]="draftColors[item.key]" 
                   (ngModelChange)="onColorUpdate(item.key, $event)" 
                   maxlength="7" />
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tab-pane {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .pane-title {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .pane-subtitle {
      font-size: 11px;
      color: #64748b;
      margin: 2px 0 0 0;
    }

    /* Two compact columns so all 11 colors fit without scrolling; descriptions show as tooltips */
    .colors-list {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .color-row-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 7px 10px;
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      transition: border-color 0.15s;
    }

    .color-row-card:hover {
      border-color: #cbd5e1;
    }

    .color-text-meta {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
      flex: 1;
    }

    .color-item-name {
      font-size: 11.5px;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }



    .color-picker-thumb {
      flex-shrink: 0;
      width: 30px;
      height: 30px;
      border-radius: 6px;
      border: 1.5px solid #cbd5e1;
      cursor: pointer;
      display: block;
      position: relative;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: transform 0.12s ease;
    }

    .color-picker-thumb:hover {
      transform: scale(1.08);
      border-color: #94a3b8;
    }

    .hidden-native-picker {
      opacity: 0;
      width: 100%;
      height: 100%;
      cursor: pointer;
      position: absolute;
      inset: 0;
    }

    .hex-code-input {
      width: 100%;
      max-width: 90px;
      box-sizing: border-box;
      padding: 2px 6px;
      font-size: 11px;
      font-weight: 700;
      font-family: monospace;
      color: #0f172a;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      text-transform: uppercase;
      outline: none;
    }

    .hex-code-input:focus {
      border-color: #2563eb;
      background: #ffffff;
    }
  `]
})
export class ColorsTabComponent {
  private appearanceService = inject(AppearanceService);

  // All 11 color fields specified in Section 9
  colorItems: ColorSettingItem[] = [
    { key: 'primary', name: 'Primary Color', description: 'Main brand, active states and action buttons' },
    { key: 'secondary', name: 'Secondary Color', description: 'Supporting elements and subtle buttons' },
    { key: 'accent', name: 'Accent Color', description: 'Highlights, badges, and notification chips' },
    { key: 'bg', name: 'Background Color', description: 'Main application body background' },
    { key: 'surface', name: 'Surface Color', description: 'Cards, containers, and panels' },
    { key: 'text', name: 'Text Color', description: 'Primary headings and body copy' },
    { key: 'mutedText', name: 'Muted Text Color', description: 'Subtitles, timestamps, and placeholder labels' },
    { key: 'border', name: 'Border Color', description: 'Card outlines, dividers, and table borders' },
    { key: 'success', name: 'Success Color', description: 'Positive KPI trends and low risk signals' },
    { key: 'warning', name: 'Warning Color', description: 'Cautionary notes and medium risk indicators' },
    { key: 'error', name: 'Error Color', description: 'Critical impact and urgent alerts' }
  ];

  get draftColors(): ColorsConfig {
    return this.appearanceService.draft.colors;
  }

  onColorUpdate(key: keyof ColorsConfig, value: string): void {
    if (!value) return;
    this.appearanceService.updateDraftColors({ [key]: value });
  }
}
