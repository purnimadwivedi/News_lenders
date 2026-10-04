import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { Configuration, Category, ImpactDefinition, LevelDefinitions } from '../models';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'financial', name: 'Financial' },
  { id: 'operational', name: 'Operational' },
  { id: 'reputational', name: 'Reputational' },
  { id: 'regulatory', name: 'Regulatory' },
  { id: 'competitive', name: 'Competitive' },
  { id: 'strategic', name: 'Strategic' }
];

const EMPTY_DEFS: LevelDefinitions = {
  High: { imgcDefinition: '', llmInstructions: '' },
  Medium: { imgcDefinition: '', llmInstructions: '' },
  Low: { imgcDefinition: '', llmInstructions: '' },
  Critical: { imgcDefinition: '', llmInstructions: '' }
};

const EMPTY: Configuration = {
  impactLevelDefinitions: {
    High: { imgcDefinition: '', llmInstructions: '' },
    Medium: { imgcDefinition: '', llmInstructions: '' },
    Low: { imgcDefinition: '', llmInstructions: '' },
    Critical: { imgcDefinition: '', llmInstructions: '' }
  },
  categories: DEFAULT_CATEGORIES,
  extraGuidance: ''
};

const LEVELS = ['Critical', 'High', 'Medium', 'Low'] as const;

const IMGC_PLACEHOLDERS: Record<string, string> = {
  High: 'Defines what High impact means from the IMGC business perspective (e.g. material impact on our portfolio or a key lender partner).',
  Medium: 'Defines what Medium impact means from the IMGC business perspective (e.g. indirect impact or signals a sectoral shift).',
  Low: 'Defines what Low impact means from the IMGC business perspective (e.g. routine market noise, no exposure to our book).',
  Critical: 'Defines what Critical impact means from the IMGC business perspective (e.g. direct threat, large lender default, NHB rule changes).'
};

const LLM_PLACEHOLDERS: Record<string, string> = {
  High: 'Instructions to the LLM on how to interpret/classify High impact (e.g. severe credit stress, major rating downgrades, key lender NPA disclosures).',
  Medium: 'Instructions to the LLM on how to interpret/classify Medium impact (e.g. minor operational friction, localized issues).',
  Low: 'Instructions to the LLM on how to interpret/classify Low impact (e.g. routine quarterly statements, CSR initiatives).',
  Critical: 'Instructions to the LLM on how to interpret/classify Critical impact (e.g. catastrophic failure, bank runs, regulatory suspension).'
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-page">
      <!-- Status Feedback -->
      <div *ngIf="status" class="card" [ngClass]="status.kind" style="margin-top: 14px;">
        {{ status.msg }}
      </div>

      <!-- Section 1: Impact Configuration with Dual Textbox -->
      <div *ngIf="cfg" class="card section">
        <div class="section-head" (click)="impactConfigOpen = !impactConfigOpen" style="cursor: pointer;">
          <div>
            <h2>Impact Configuration</h2>
            <p class="muted small">Configure IMGC-specific definitions and specific instructions for the LLM classifier for each impact level.</p>
          </div>
          <button type="button" class="pill-btn" (click)="impactConfigOpen = !impactConfigOpen; $event.stopPropagation()">
            {{ impactConfigOpen ? 'Hide' : 'Show' }}
          </button>
        </div>

        <div *ngIf="impactConfigOpen" class="impact-levels-container">
          <div *ngFor="let lvl of levels" class="impact-block card">
            <div class="impact-block-header">
              <span class="badge badge-{{ lvl }}" style="font-size: 13px; padding: 4px 12px;">{{ lvl }} Impact</span>
            </div>

            <div class="dual-textbox-grid">
              <!-- Field A: IMGC Specific Definition -->
              <div class="textbox-field">
                <label class="field-label">
                  <span class="label-badge">A</span>
                  <strong>IMGC Specific Definition</strong>
                </label>
                <div class="field-hint">Defines what {{ lvl }} Impact means specifically from the organization's business perspective.</div>
                <textarea
                  [(ngModel)]="cfg.impactLevelDefinitions[lvl].imgcDefinition"
                  [placeholder]="imgcPlaceholders[lvl]"
                  rows="3"
                  class="definition-textarea"
                ></textarea>
              </div>

              <!-- Field B: LLM Instructions -->
              <div class="textbox-field">
                <label class="field-label">
                  <span class="label-badge llm-badge">B</span>
                  <strong>LLM Instructions</strong>
                </label>
                <div class="field-hint">Gives instructions to the LLM about how it should interpret and classify {{ lvl }} Impact.</div>
                <textarea
                  [(ngModel)]="cfg.impactLevelDefinitions[lvl].llmInstructions"
                  [placeholder]="llmPlaceholders[lvl]"
                  rows="3"
                  class="definition-textarea"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: Category Master List (Management UI) -->
      <div *ngIf="cfg" class="card section">
        <div class="section-head">
          <div>
            <h2>Category Master List</h2>
            <p class="muted small">Manage news classification categories. Add, edit, or delete categories directly from this page.</p>
          </div>
          <button type="button" class="btn-accent" (click)="openAddCategory()">
            + Add Category
          </button>
        </div>

        <!-- Inline Category Add / Edit Form Modal or Inline Card -->
        <div *ngIf="showCategoryForm" class="card category-form-card" style="margin-bottom: 16px; background: #f8fafc; border: 1.5px solid var(--primary, #f97316);">
          <div style="font-weight: 700; margin-bottom: 8px; font-size: 14px;">
            {{ editingCategoryId ? 'Edit Category' : 'New Category' }}
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div>
              <label style="font-size: 12px; font-weight: 600; margin-bottom: 4px; display: block;">Category Name *</label>
              <input
                type="text"
                [(ngModel)]="categoryFormName"
                placeholder="e.g. Liquidity Stress, Governance"
                style="max-width: 400px;"
                (keyup.enter)="saveCategory()"
              />
            </div>
            <div *ngIf="categoryFormError" style="color: var(--critical, #ef4444); font-size: 12px;">
              {{ categoryFormError }}
            </div>
            <div style="display: flex; gap: 8px; margin-top: 6px;">
              <button type="button" class="primary" (click)="saveCategory()">Save</button>
              <button type="button" (click)="cancelCategoryForm()">Cancel</button>
            </div>
          </div>
        </div>

        <!-- Categories List Grid -->
        <div class="categories-list">
          <div *ngFor="let cat of cfg.categories" class="category-item-row">
            <div class="category-info">
              <span class="category-dot"></span>
              <span class="category-name">{{ cat.name }}</span>
              <span class="category-id" style="color: #94a3b8; font-size: 11px;">({{ cat.id }})</span>
            </div>
            <div class="category-actions">
              <button type="button" class="pill-btn edit-btn" (click)="openEditCategory(cat)">Edit</button>
              <button type="button" class="pill-btn delete-btn" (click)="deleteCategory(cat)">Delete</button>
            </div>
          </div>

          <div *ngIf="!cfg.categories || !cfg.categories.length" class="empty-categories">
            No categories defined. Click "+ Add Category" to create one.
          </div>
        </div>
      </div>

      <!-- Section 3: Category Configuration with Dual Textbox -->
      <div *ngIf="cfg && cfg.categories.length" class="card section">
        <div class="section-head" (click)="categoryDefsOpen = !categoryDefsOpen" style="cursor: pointer;">
          <div>
            <h2>Category Configuration</h2>
            <p class="muted small">Configure IMGC-specific definitions and specific instructions for the LLM classifier for each category.</p>
          </div>
          <button type="button" class="pill-btn" (click)="categoryDefsOpen = !categoryDefsOpen; $event.stopPropagation()">
            {{ categoryDefsOpen ? 'Hide' : 'Show' }}
          </button>
        </div>

        <div *ngIf="categoryDefsOpen" class="impact-levels-container">
          <div *ngFor="let cat of cfg.categories" class="impact-block card">
            <div class="impact-block-header">
              <span class="badge category-def-badge" style="font-size: 13px; padding: 4px 12px;">{{ cat.name }}</span>
            </div>

            <div class="dual-textbox-grid">
              <!-- Field A: IMGC Specific Definition -->
              <div class="textbox-field">
                <label class="field-label">
                  <span class="label-badge">A</span>
                  <strong>IMGC Specific Definition</strong>
                </label>
                <div class="field-hint">Defines what {{ cat.name }} news means specifically from the organization's business perspective.</div>
                <textarea
                  [(ngModel)]="cat.imgcDefinition"
                  [placeholder]="categoryImgcPlaceholder(cat)"
                  rows="3"
                  class="definition-textarea"
                ></textarea>
              </div>

              <!-- Field B: LLM Instructions -->
              <div class="textbox-field">
                <label class="field-label">
                  <span class="label-badge llm-badge">B</span>
                  <strong>LLM Instructions</strong>
                </label>
                <div class="field-hint">Gives instructions to the LLM about how it should identify and classify {{ cat.name }} news.</div>
                <textarea
                  [(ngModel)]="cat.llmInstructions"
                  [placeholder]="categoryLlmPlaceholder(cat)"
                  rows="3"
                  class="definition-textarea"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 4: Extra Guidance -->
      <div *ngIf="cfg" class="card section">
        <h2>Extra Guidance</h2>
        <p class="muted small">
          Free-form instructions for the AI classifier. Use this for organization-specific nuances that don't fit
          into an individual level (e.g. "Always treat news mentioning NHB or mortgage guarantee rules as Critical or High impact").
        </p>
        <textarea
          [(ngModel)]="cfg.extraGuidance"
          rows="4"
          placeholder="e.g. Mortgage-guarantee specific rules, sensitive geographies, watchlist lender partners..."
          style="margin-top: 8px;"
        ></textarea>
      </div>

      <!-- Action Toolbar -->
      <div *ngIf="cfg" class="toolbar" style="margin-top: 20px; display: flex; align-items: center; gap: 10px;">
        <button class="primary" (click)="save()" [disabled]="saving">
          {{ saving ? 'Saving…' : 'Save & apply next fetch' }}
        </button>
        <button type="button" (click)="reload()" [disabled]="saving">Discard changes</button>
        <button type="button" class="danger" (click)="reset()" [disabled]="saving">Reset to defaults</button>
        <div class="spacer" style="flex: 1;"></div>
        <span class="muted small" *ngIf="cfg.updatedAt">
          Last updated {{ cfg.updatedAt | date: 'medium' }}
        </span>
      </div>
    </div>
  `,
  styles: [
    `
      .settings-page {
        display: block;
        max-width: 1000px;
        margin: 0 auto;
        padding-bottom: 40px;
      }
      h2 { margin: 0 0 4px 0; font-size: 16px; font-weight: 700; color: #1e293b; }
      .small { font-size: 12px; }
      .section { margin-top: 16px; }
      .section-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 14px;
      }
      .impact-levels-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .impact-block {
        background: #fbfcfe;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
      }
      .impact-block-header {
        margin-bottom: 12px;
      }
      /* Label, hint and textarea rows are shared across both fields (subgrid), so the two
         textareas of a level always start on the same line and have the same height. */
      .dual-textbox-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: auto auto minmax(84px, auto);
        column-gap: 16px;
        row-gap: 6px;
      }
      @media (max-width: 768px) {
        .dual-textbox-grid {
          grid-template-columns: 1fr;
          grid-template-rows: none;
          row-gap: 16px;
        }
        .textbox-field { row-gap: 6px; }
      }
      .textbox-field {
        display: grid;
        grid-row: span 3;
        grid-template-rows: subgrid;
        min-width: 0;
      }
      .field-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #334155;
        font-weight: 600;
      }
      .label-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #e2e8f0;
        color: #475569;
        font-size: 11px;
        font-weight: 700;
      }
      .category-def-badge {
        background: #e0f2fe;
        color: #0369a1;
      }
      .label-badge.llm-badge {
        background: #ede9fe;
        color: #7c3aed;
      }
      .field-hint {
        font-size: 11.5px;
        color: #64748b;
        line-height: 1.35;
      }
      .definition-textarea {
        width: 100%;
        height: 100%;
        min-height: 84px;
        margin: 0;
        box-sizing: border-box;
        resize: vertical;
        font-size: 13px;
        line-height: 1.45;
        border-radius: 6px;
        border: 1px solid #cbd5e1;
        background: #ffffff;
      }
      .categories-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 10px;
        margin-top: 10px;
      }
      .category-item-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        transition: all 0.15s ease;
      }
      .category-item-row:hover {
        border-color: #cbd5e1;
        background: #f8fafc;
      }
      .category-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .category-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--primary, #f97316);
      }
      .category-name {
        font-size: 13.5px;
        font-weight: 600;
        color: #1e293b;
      }
      .category-actions {
        display: flex;
        gap: 6px;
      }
      .edit-btn {
        padding: 2px 10px;
        font-size: 11.5px;
      }
      .delete-btn {
        padding: 2px 10px;
        font-size: 11.5px;
        color: #ef4444;
        border-color: #fca5a5;
      }
      .delete-btn:hover {
        background: #fee2e2;
      }
      .empty-categories {
        grid-column: 1 / -1;
        text-align: center;
        padding: 24px;
        color: #94a3b8;
        font-size: 13px;
      }
      .card.ok { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; }
      .card.err { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
    `
  ]
})
export class SettingsComponent implements OnInit {
  private api = inject(ApiService);
  cfg: Configuration | null = null;
  saving = false;
  impactConfigOpen = true;
  categoryDefsOpen = true;
  status: { kind: 'ok' | 'err'; msg: string } | null = null;

  levels = LEVELS;
  imgcPlaceholders = IMGC_PLACEHOLDERS;
  llmPlaceholders = LLM_PLACEHOLDERS;
  lenderName = 'your organization';

  // Category inline management
  showCategoryForm = false;
  editingCategoryId: string | null = null;
  categoryFormName = '';
  categoryFormError = '';

  ngOnInit() {
    this.reload();
    this.api.health().subscribe({
      next: (h) => (this.lenderName = h.company)
    });
  }

  reload() {
    this.status = null;
    this.api.getConfig().subscribe({
      next: (c) => {
        this.cfg = this.normalize(c);
      },
      error: (err) => (this.status = { kind: 'err', msg: 'Failed to load: ' + (err.error?.error || err.message) })
    });
  }

  save() {
    if (!this.cfg) return;
    this.saving = true;
    this.status = null;
    this.api.updateConfig(this.cfg).subscribe({
      next: (c) => {
        this.cfg = this.normalize(c);
        this.saving = false;
        this.status = { kind: 'ok', msg: 'LLM Configuration saved successfully. The next fetch + classify run will use these definitions.' };
        setTimeout(() => (this.status = null), 6000);
      },
      error: (err) => {
        this.saving = false;
        this.status = { kind: 'err', msg: 'Save failed: ' + (err.error?.error || err.message) };
      }
    });
  }

  reset() {
    if (!confirm('Reset all impact definitions and categories to defaults? The AI will fall back to standard settings.')) return;
    this.saving = true;
    this.api.resetConfig().subscribe({
      next: (c) => {
        this.cfg = this.normalize(c);
        this.saving = false;
        this.status = { kind: 'ok', msg: 'Reset to default configuration.' };
      },
      error: () => (this.saving = false)
    });
  }

  categoryImgcPlaceholder(cat: Category): string {
    const example = cat.description ? ` (e.g. ${cat.description.charAt(0).toLowerCase()}${cat.description.slice(1)})` : '';
    return `Defines what ${cat.name} news means from the IMGC business perspective${example}.`;
  }

  categoryLlmPlaceholder(cat: Category): string {
    return `Instructions to the LLM on how to identify ${cat.name} news (e.g. signals to look for, what to exclude, tie-breakers with other categories).`;
  }

  // --- Category Management Methods ---
  openAddCategory() {
    this.editingCategoryId = null;
    this.categoryFormName = '';
    this.categoryFormError = '';
    this.showCategoryForm = true;
  }

  openEditCategory(cat: Category) {
    this.editingCategoryId = cat.id;
    this.categoryFormName = cat.name;
    this.categoryFormError = '';
    this.showCategoryForm = true;
  }

  cancelCategoryForm() {
    this.showCategoryForm = false;
    this.editingCategoryId = null;
    this.categoryFormName = '';
    this.categoryFormError = '';
  }

  saveCategory() {
    const trimmed = this.categoryFormName.trim();
    if (!trimmed) {
      this.categoryFormError = 'Category Name is required.';
      return;
    }

    if (!this.cfg) return;

    // Check duplicate name
    const isDuplicate = (this.cfg.categories || []).some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase() && c.id !== this.editingCategoryId
    );
    if (isDuplicate) {
      this.categoryFormError = `Category "${trimmed}" already exists.`;
      return;
    }

    if (this.editingCategoryId) {
      // Edit mode
      const cat = (this.cfg.categories || []).find((c) => c.id === this.editingCategoryId);
      if (cat) {
        cat.name = trimmed;
        cat.updatedAt = new Date().toISOString();
      }
    } else {
      // Add mode
      const id = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${Date.now()}`;
      const newCategory: Category = {
        id,
        name: trimmed,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (!this.cfg.categories) this.cfg.categories = [];
      this.cfg.categories.push(newCategory);
    }

    this.cancelCategoryForm();
    this.save();
  }

  deleteCategory(cat: Category) {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
    if (!this.cfg || !this.cfg.categories) return;

    this.cfg.categories = this.cfg.categories.filter((c) => c.id !== cat.id);
    this.save();
  }

  private normalize(c: Configuration): Configuration {
    const rawImpacts = c?.impactLevelDefinitions || {};
    const normImpacts: LevelDefinitions = {
      High: { imgcDefinition: '', llmInstructions: '' },
      Medium: { imgcDefinition: '', llmInstructions: '' },
      Low: { imgcDefinition: '', llmInstructions: '' },
      Critical: { imgcDefinition: '', llmInstructions: '' }
    };

    LEVELS.forEach((lvl) => {
      const item = (rawImpacts as any)[lvl];
      if (typeof item === 'object' && item !== null) {
        normImpacts[lvl] = {
          imgcDefinition: item.imgcDefinition || '',
          llmInstructions: item.llmInstructions || ''
        };
      } else if (typeof item === 'string') {
        normImpacts[lvl] = {
          imgcDefinition: item,
          llmInstructions: ''
        };
      }
    });

    return {
      ...EMPTY,
      ...c,
      impactLevelDefinitions: normImpacts,
      categories: (c?.categories && c.categories.length > 0 ? c.categories : DEFAULT_CATEGORIES).map((cat) => ({
        ...cat,
        imgcDefinition: cat.imgcDefinition || '',
        llmInstructions: cat.llmInstructions || ''
      }))
    };
  }
}
