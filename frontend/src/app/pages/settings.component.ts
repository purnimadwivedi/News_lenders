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

      <!-- Section 1: Two Configuration Buttons / Tabs -->
      <div class="config-tabs-nav">
        <button
          type="button"
          class="config-tab-btn"
          [class.active]="selectedConfiguration === 'impact'"
          (click)="selectedConfiguration = 'impact'">
          Impact Configuration
        </button>
        <button
          type="button"
          class="config-tab-btn"
          [class.active]="selectedConfiguration === 'category'"
          (click)="selectedConfiguration = 'category'">
          Category Configuration
        </button>
      </div>

      <!-- ========================================================= -->
      <!-- TAB 1: IMPACT CONFIGURATION (Default view)                -->
      <!-- ========================================================= -->
      <ng-container *ngIf="cfg && selectedConfiguration === 'impact'">
        <!-- Impact Configuration Card -->
        <div class="card section">
          <div class="section-head">
            <h2>Impact Configuration</h2>
          </div>

          <div class="config-content-wrapper">
            <!-- Impact Configuration Grid / Table (2 Columns: Impact & IMGC Specific Definition) -->
            <div class="impact-table-section">
              <div class="impact-table-wrapper">
                <table class="impact-table">
                  <thead>
                    <tr>
                      <th class="col-impact">Impact</th>
                      <th class="col-imgc">IMGC Specific Definition</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let lvl of levels">
                      <td class="col-impact">
                        <span class="badge badge-{{ lvl }}" style="font-size: 12px; padding: 4px 10px; font-weight: 700; display: inline-block;">
                          {{ lvl }}
                        </span>
                      </td>
                      <td class="col-imgc">
                        <textarea
                          [(ngModel)]="cfg.impactLevelDefinitions[lvl].imgcDefinition"
                          [placeholder]="imgcPlaceholders[lvl]"
                          rows="2"
                          class="grid-textarea"
                        ></textarea>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Single Unified LLM Instructions for Impact Configuration (BELOW THE GRID) -->
            <div class="shared-instruction-card card">
              <div class="textbox-field">
                <label class="field-label">
                  <span class="label-badge llm-badge">B</span>
                  <strong>LLM Instructions for Impact Configuration</strong>
                </label>
                <textarea
                  [(ngModel)]="cfg.impactLlmInstructions"
                  placeholder="e.g. When evaluating impact for IMGC, focus on systemic liquidity, borrowing cost escalations for counterparty banks and HFCs, and major regulatory directives by RBI/NHB..."
                  rows="2"
                  class="definition-textarea shared-textarea"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- ========================================================= -->
      <!-- TAB 2: CATEGORY CONFIGURATION                            -->
      <!-- ========================================================= -->
      <ng-container *ngIf="cfg && selectedConfiguration === 'category'">
        <div class="card section category-config-card">
          <!-- Category Configuration Header Area with + Add Category Button -->
          <div class="category-header-bar">
            <h2>Category Configuration</h2>
            <button type="button" class="primary add-cat-btn" (click)="openAddCategoryModal()">
              + Add Category
            </button>
          </div>

          <div class="config-content-wrapper">
            <!-- Clean Category Grid / Table (3 Columns: Category, IMGC Specific Definition, Actions) -->
            <div class="category-table-wrapper">
              <table class="category-table">
                <thead>
                  <tr>
                    <th class="col-category">Category</th>
                    <th class="col-imgc">IMGC Specific Definition</th>
                    <th class="col-actions" style="width: 120px; text-align: right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let cat of cfg.categories">
                    <td class="col-category">
                      <div class="category-cell-content">
                        <span class="category-dot"></span>
                        <strong class="cat-name-text">{{ cat.name }}</strong>
                        <span class="cat-id-text" *ngIf="cat.id && cat.id !== cat.name.toLowerCase()">({{ cat.id }})</span>
                      </div>
                    </td>
                    <td class="col-imgc">
                      <textarea
                        [(ngModel)]="cat.imgcDefinition"
                        [placeholder]="categoryImgcPlaceholder(cat)"
                        rows="2"
                        class="grid-textarea"
                      ></textarea>
                    </td>
                    <td class="col-actions" style="text-align: right; vertical-align: top; padding-top: 6px;">
                      <div class="table-actions">
                        <button type="button" class="pill-btn edit-btn" (click)="openEditCategoryModal(cat)">Edit</button>
                        <button type="button" class="pill-btn delete-btn" (click)="confirmDeleteCategory(cat)">Delete</button>
                      </div>
                    </td>
                  </tr>
                  <tr *ngIf="!cfg.categories || cfg.categories.length === 0">
                    <td colspan="3" class="empty-table-state">
                      No categories configured yet. Click "+ Add Category" to create one.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Single Shared LLM Instructions for Category Configuration (AT THE BOTTOM OF CATEGORY GRID) -->
            <div class="shared-instruction-card card">
              <div class="textbox-field">
                <label class="field-label">
                  <span class="label-badge llm-badge">B</span>
                  <strong>LLM Instructions for Category Configuration</strong>
                </label>
                <textarea
                  [(ngModel)]="cfg.categoryLlmInstructions"
                  placeholder="e.g. Prioritize Regulatory when direct RBI, NHB, or Ministry circulars or penalties are involved. Assign Financial for balance sheet stress, liquidity, rating changes, and NPA data..."
                  rows="2"
                  class="definition-textarea shared-textarea"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Action Toolbar (Save & Apply / Discard / Reset) -->
      <div *ngIf="cfg" class="toolbar settings-toolbar" style="display: flex; align-items: center; gap: 10px;">
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

      <!-- ========================================================= -->
      <!-- MODAL 1: ADD / EDIT CATEGORY POPUP DIALOG                 -->
      <!-- ========================================================= -->
      <div class="modal-backdrop" *ngIf="showCategoryModal" (click)="cancelCategoryModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">{{ modalMode === 'edit' ? 'Edit Category' : 'Add Category' }}</h3>
            <button type="button" class="modal-close-btn" (click)="cancelCategoryModal()" title="Close dialog">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label" for="categoryNameField">Category Name *</label>
              <input
                id="categoryNameField"
                type="text"
                class="form-control"
                [(ngModel)]="categoryFormName"
                placeholder="e.g. Regulatory, Financial"
                (keyup.enter)="saveCategoryModal()"
                autofocus
              />
              <div *ngIf="categoryFormError" class="field-error-msg">
                {{ categoryFormError }}
              </div>
            </div>

            <div class="form-group" style="margin-top: 14px;">
              <label class="form-label" for="categoryDefField">
                IMGC Specific Definition <span class="muted font-normal" style="font-size: 11.5px; font-weight: normal;">(Optional)</span>
              </label>
              <textarea
                id="categoryDefField"
                class="form-control textarea-control"
                [(ngModel)]="categoryFormDefinition"
                placeholder="Defines what this category means specifically from the organization's business perspective..."
                rows="3"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-cancel" (click)="cancelCategoryModal()" [disabled]="modalSaving">
              Cancel
            </button>
            <button type="button" class="primary btn-save" (click)="saveCategoryModal()" [disabled]="modalSaving">
              {{ modalSaving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- MODAL 2: DELETE CONFIRMATION POPUP DIALOG                 -->
      <!-- ========================================================= -->
      <div class="modal-backdrop" *ngIf="categoryToDelete" (click)="cancelDeleteCategory()">
        <div class="modal-card confirm-modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">Delete Category</h3>
            <button type="button" class="modal-close-btn" (click)="cancelDeleteCategory()" title="Close dialog">✕</button>
          </div>
          <div class="modal-body">
            <p class="confirm-message">
              Are you sure you want to delete this category?
            </p>
            <div class="cat-to-delete-tag">
              <span class="category-dot"></span>
              <strong>{{ categoryToDelete.name }}</strong>
            </div>
            <p class="muted small" style="margin-top: 8px; line-height: 1.4;">
              This category will be permanently removed from LLM classification options.
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-cancel" (click)="cancelDeleteCategory()" [disabled]="deleteSaving">
              Cancel
            </button>
            <button type="button" class="danger btn-delete" (click)="executeDeleteCategory()" [disabled]="deleteSaving">
              {{ deleteSaving ? 'Deleting…' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [
    `
      /* Full width with tight spacing so the configuration fits on screen without a page scrollbar. */
      .settings-page {
        display: block;
      }
      h2 { margin: 0 0 2px 0; font-size: 15px; font-weight: 700; color: #1e293b; }
      .small { font-size: 11.5px; }
      .section { margin-top: 4px; }
      .settings-page .card.section { padding: 12px 14px; }
      .settings-toolbar { margin: 6px 0 0; }
      .section-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
      }

      /* Two Configuration Tabs Navigation */
      .config-tabs-nav {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 0;
        margin-bottom: 0;
        flex-wrap: wrap;
      }
      .config-tab-btn {
        padding: 5px 18px;
        font-size: 13px;
        font-weight: 600;
        border-radius: 7px;
        cursor: pointer;
        transition: all 0.18s ease;
        border: 1px solid #cbd5e1;
        background: #ffffff;
        color: #475569;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      }
      .config-tab-btn:hover {
        background: #f8fafc;
        color: #1e293b;
        border-color: #94a3b8;
      }
      .config-tab-btn.active {
        background: var(--primary, #f97316);
        color: #ffffff;
        border-color: var(--primary, #f97316);
        box-shadow: 0 2px 5px rgba(249, 115, 22, 0.25);
      }

      .config-content-wrapper {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .shared-instruction-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-left: 4px solid #6366f1;
        border-radius: 8px;
        padding: 6px 12px;
        margin-top: 0;
      }
      .shared-textarea {
        background: #ffffff;
      }
      .config-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      @media (max-width: 768px) {
        .config-grid {
          grid-template-columns: 1fr;
        }
      }
      .config-card {
        background: #fbfcfe;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        transition: all 0.15s ease;
      }
      .config-card:hover {
        border-color: #cbd5e1;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
      }
      .config-card-header {
        margin-bottom: 2px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .textbox-field {
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-width: 0;
      }
      .field-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12.5px;
        color: #334155;
        font-weight: 600;
      }
      .label-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #e2e8f0;
        color: #475569;
        font-size: 10.5px;
        font-weight: 700;
      }
      .label-badge.llm-badge {
        background: #ede9fe;
        color: #7c3aed;
      }
      .field-hint {
        font-size: 11px;
        color: #64748b;
        line-height: 1.25;
      }
      .definition-textarea {
        display: block;
        width: 100%;
        min-height: 38px;
        height: 38px;
        margin: 0;
        box-sizing: border-box;
        resize: vertical;
        font-size: 12px;
        line-height: 1.25;
        border-radius: 6px;
        border: 1px solid #cbd5e1;
        background: #ffffff;
        padding: 3px 10px;
      }

      /* Impact Configuration Grid / Table Styles */
      .impact-table-section {
        margin-top: 2px;
      }
      .impact-table-wrapper {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow-x: auto;
      }
      .impact-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      .impact-table th {
        background: #f8fafc;
        color: #475569;
        font-weight: 600;
        font-size: 11.5px;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        padding: 4px 12px;
        border-bottom: 1px solid #e2e8f0;
        text-align: left;
      }
      .impact-table td {
        padding: 3px 10px;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: top;
      }
      .impact-table tr:last-child td {
        border-bottom: none;
      }
      .impact-table tr:hover td {
        background: #fbfcfe;
      }
      .col-impact {
        width: 110px;
        min-width: 95px;
        white-space: nowrap;
        vertical-align: top;
        padding-top: 6px;
      }
      .col-imgc {
        vertical-align: top;
      }
      .grid-textarea {
        display: block; /* inline textareas leave a baseline gap under them in each row */
        width: 100%;
        min-height: 36px;
        height: 36px;
        margin: 0;
        box-sizing: border-box;
        resize: vertical;
        font-size: 12px;
        line-height: 1.25;
        border-radius: 6px;
        border: 1px solid #cbd5e1;
        background: #ffffff;
        color: #1e293b;
        padding: 2px 10px;
        font-family: inherit;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .grid-textarea:focus {
        outline: none;
        border-color: var(--primary, #f97316);
        box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.15);
      }
      .cell-text-wrap {
        line-height: 1.4;
        color: #334155;
        white-space: pre-wrap;
        word-break: break-word;
      }

      /* Category Configuration Section Styles */
      .category-config-card {
        padding: 10px 14px;
      }
      .category-header-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 4px;
      }
      .add-cat-btn {
        padding: 5px 14px;
        font-size: 12px;
        font-weight: 600;
        border-radius: 6px;
        white-space: nowrap;
      }

      /* Category Table */
      .category-table-wrapper {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
      }
      .category-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      .category-table th {
        background: #f8fafc;
        color: #475569;
        font-weight: 600;
        font-size: 11.5px;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        padding: 4px 12px;
        border-bottom: 1px solid #e2e8f0;
        text-align: left;
      }
      .category-table td {
        padding: 3px 10px;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: top;
      }
      .category-table tr:last-child td {
        border-bottom: none;
      }
      .category-table tr:hover td {
        background: #fbfcfe;
      }
      .col-category {
        width: 140px;
        min-width: 120px;
        white-space: nowrap;
        vertical-align: top;
        padding-top: 6px;
      }
      .col-actions {
        width: 120px;
        min-width: 110px;
        white-space: nowrap;
        vertical-align: top;
        padding-top: 6px;
      }
      .category-cell-content {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .category-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--primary, #f97316);
        display: inline-block;
        flex-shrink: 0;
      }
      .cat-name-text {
        font-size: 13px;
        color: #1e293b;
        font-weight: 600;
      }
      .cat-id-text {
        font-size: 11.5px;
        color: #94a3b8;
      }
      .cat-desc-preview {
        margin-top: 2px;
        margin-left: 13px;
        color: #64748b;
        font-size: 11px;
        line-height: 1.3;
      }
      .table-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 6px;
      }
      .table-actions .pill-btn {
        padding: 3px 10px;
        font-size: 11.5px;
        font-weight: 600;
      }
      .table-actions .edit-btn {
        background: #ffffff;
        color: #0284c7;
        border: 1px solid #bae6fd;
      }
      .table-actions .edit-btn:hover {
        background: #f0f9ff;
        border-color: #0284c7;
      }
      .table-actions .delete-btn {
        background: #ffffff;
        color: #ef4444;
        border: 1px solid #fecaca;
      }
      .table-actions .delete-btn:hover {
        background: #fee2e2;
        border-color: #ef4444;
      }
      .empty-table-state {
        text-align: center;
        padding: 20px 14px;
        color: #94a3b8;
        font-size: 12.5px;
      }

      /* Modal Popups */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        animation: modalFadeIn 0.2s ease-out;
      }
      .modal-card {
        width: 100%;
        max-width: 480px;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: modalPopIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .confirm-modal-card {
        max-width: 420px;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 18px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }
      .modal-title {
        margin: 0;
        font-size: 15px;
        font-weight: 700;
        color: #1e293b;
      }
      .modal-close-btn {
        background: transparent;
        border: none;
        color: #64748b;
        font-size: 16px;
        cursor: pointer;
        padding: 4px 6px;
        line-height: 1;
        border-radius: 4px;
      }
      .modal-close-btn:hover {
        background: #e2e8f0;
        color: #1e293b;
      }
      .modal-body {
        padding: 18px;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .form-label {
        font-size: 12.5px;
        font-weight: 600;
        color: #334155;
      }
      .form-control {
        width: 100%;
        box-sizing: border-box;
        padding: 8px 12px;
        font-size: 13.5px;
        border-radius: 6px;
        border: 1px solid #cbd5e1;
        background: #ffffff;
        transition: border-color 0.15s ease;
      }
      .form-control:focus {
        outline: none;
        border-color: var(--primary, #f97316);
        box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12);
      }
      .textarea-control {
        resize: vertical;
        line-height: 1.45;
      }
      .field-error-msg {
        color: #ef4444;
        font-size: 12px;
        font-weight: 500;
        margin-top: 2px;
      }
      .confirm-message {
        margin: 0 0 10px 0;
        font-size: 14px;
        color: #1e293b;
        line-height: 1.5;
      }
      .cat-to-delete-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #fff7ed;
        border: 1px solid #fed7aa;
        color: #c2410c;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 13px;
      }
      .modal-footer {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 10px;
        padding: 12px 18px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
      }
      .btn-cancel {
        padding: 7px 16px;
        font-size: 13px;
        font-weight: 600;
        border-radius: 6px;
        background: #ffffff;
        color: #475569;
        border: 1px solid #cbd5e1;
        cursor: pointer;
      }
      .btn-cancel:hover {
        background: #f1f5f9;
        color: #1e293b;
      }
      .btn-save, .btn-delete {
        padding: 7px 18px;
        font-size: 13px;
        font-weight: 600;
        border-radius: 6px;
      }

      @keyframes modalFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes modalPopIn {
        from { opacity: 0; transform: scale(0.96); }
        to { opacity: 1; transform: scale(1); }
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
  status: { kind: 'ok' | 'err'; msg: string } | null = null;

  // Selected Tab: Default 'impact'
  selectedConfiguration: 'impact' | 'category' = 'impact';

  levels = LEVELS;
  imgcPlaceholders = IMGC_PLACEHOLDERS;
  llmPlaceholders = LLM_PLACEHOLDERS;
  lenderName = 'your organization';

  // Category Modal State
  showCategoryModal = false;
  modalMode: 'add' | 'edit' = 'add';
  editingCategory: Category | null = null;
  categoryFormName = '';
  categoryFormDefinition = '';
  categoryFormError = '';
  modalSaving = false;

  // Category Delete Confirmation Modal State
  categoryToDelete: Category | null = null;
  deleteSaving = false;

  get impactConfigurations(): { impact: string; imgcSpecificDefinition: string; llmInstructions: string }[] {
    if (!this.cfg || !this.cfg.impactLevelDefinitions) return [];

    const defs = this.cfg.impactLevelDefinitions as Record<string, ImpactDefinition>;
    const keys = Object.keys(defs);
    const order = ['Critical', 'High', 'Medium', 'Low'];
    const sortedLevels = [
      ...order.filter((lvl) => keys.includes(lvl)),
      ...keys.filter((lvl) => !order.includes(lvl))
    ];

    return sortedLevels.map((lvl) => {
      const def = defs[lvl] || { imgcDefinition: '', llmInstructions: '' };
      return {
        impact: lvl,
        imgcSpecificDefinition: def.imgcDefinition || this.imgcPlaceholders[lvl] || '',
        llmInstructions: def.llmInstructions || this.llmPlaceholders[lvl] || ''
      };
    });
  }

  ngOnInit() {
    this.selectedConfiguration = 'impact';
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

    if (!this.cfg.riskTypeDefinitions) {
      this.cfg.riskTypeDefinitions = {} as any;
    }
    (this.cfg.riskTypeDefinitions as any).impactLlmInstructions = this.cfg.impactLlmInstructions || '';
    (this.cfg.riskTypeDefinitions as any).categoryLlmInstructions = this.cfg.categoryLlmInstructions || '';

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

  // --- Category Modal Management Methods ---
  openAddCategoryModal() {
    this.modalMode = 'add';
    this.editingCategory = null;
    this.categoryFormName = '';
    this.categoryFormDefinition = '';
    this.categoryFormError = '';
    this.modalSaving = false;
    this.showCategoryModal = true;
  }

  openEditCategoryModal(cat: Category) {
    this.modalMode = 'edit';
    this.editingCategory = cat;
    this.categoryFormName = cat.name;
    this.categoryFormDefinition = cat.imgcDefinition || '';
    this.categoryFormError = '';
    this.modalSaving = false;
    this.showCategoryModal = true;
  }

  cancelCategoryModal() {
    this.showCategoryModal = false;
    this.editingCategory = null;
    this.categoryFormName = '';
    this.categoryFormDefinition = '';
    this.categoryFormError = '';
    this.modalSaving = false;
  }

  saveCategoryModal() {
    const trimmed = (this.categoryFormName || '').trim();
    if (!trimmed) {
      this.categoryFormError = 'Category Name is required.';
      return;
    }

    if (!this.cfg) return;

    // Check duplicate name
    const isDuplicate = (this.cfg.categories || []).some(
      (c) => c.name.trim().toLowerCase() === trimmed.toLowerCase() &&
             (this.modalMode !== 'edit' || c.id !== this.editingCategory?.id)
    );
    if (isDuplicate) {
      this.categoryFormError = 'Category already exists.';
      return;
    }

    this.modalSaving = true;
    this.categoryFormError = '';

    if (this.modalMode === 'edit' && this.editingCategory) {
      // Edit existing category
      this.editingCategory.name = trimmed;
      this.editingCategory.imgcDefinition = (this.categoryFormDefinition || '').trim();
      this.editingCategory.updatedAt = new Date().toISOString();
    } else {
      // Add new category
      const id = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${Date.now()}`;
      const newCategory: Category = {
        id,
        name: trimmed,
        imgcDefinition: (this.categoryFormDefinition || '').trim(),
        llmInstructions: this.cfg.categoryLlmInstructions || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (!this.cfg.categories) this.cfg.categories = [];
      this.cfg.categories.push(newCategory);
    }

    // Call existing API to save
    this.api.updateConfig(this.cfg).subscribe({
      next: (c) => {
        this.cfg = this.normalize(c);
        this.modalSaving = false;
        const savedName = trimmed;
        const isEdit = this.modalMode === 'edit';
        this.cancelCategoryModal();
        this.status = {
          kind: 'ok',
          msg: isEdit ? `Category "${savedName}" updated successfully.` : `Category "${savedName}" added successfully.`
        };
        setTimeout(() => (this.status = null), 4000);
      },
      error: (err) => {
        this.modalSaving = false;
        this.categoryFormError = 'Failed to save category: ' + (err.error?.error || err.message);
      }
    });
  }

  // --- Category Delete Confirmation Methods ---
  confirmDeleteCategory(cat: Category) {
    this.categoryToDelete = cat;
    this.deleteSaving = false;
  }

  cancelDeleteCategory() {
    this.categoryToDelete = null;
    this.deleteSaving = false;
  }

  executeDeleteCategory() {
    if (!this.categoryToDelete || !this.cfg || !this.cfg.categories) return;

    this.deleteSaving = true;
    const catName = this.categoryToDelete.name;
    const catId = this.categoryToDelete.id;

    this.cfg.categories = this.cfg.categories.filter((c) => c.id !== catId);

    this.api.updateConfig(this.cfg).subscribe({
      next: (c) => {
        this.cfg = this.normalize(c);
        this.deleteSaving = false;
        this.categoryToDelete = null;
        this.status = { kind: 'ok', msg: `Category "${catName}" deleted successfully.` };
        setTimeout(() => (this.status = null), 4000);
      },
      error: (err) => {
        this.deleteSaving = false;
        this.status = { kind: 'err', msg: 'Failed to delete category: ' + (err.error?.error || err.message) };
      }
    });
  }

  // Aliases for backward compatibility
  openAddCategory() {
    this.openAddCategoryModal();
  }

  openEditCategory(cat: Category) {
    this.openEditCategoryModal(cat);
  }

  deleteCategory(cat: Category) {
    this.confirmDeleteCategory(cat);
  }

  private normalize(c: Configuration): Configuration {
    const rawImpacts = c?.impactLevelDefinitions || {};
    const normImpacts: LevelDefinitions = {
      Critical: { imgcDefinition: '', llmInstructions: '' },
      High: { imgcDefinition: '', llmInstructions: '' },
      Medium: { imgcDefinition: '', llmInstructions: '' },
      Low: { imgcDefinition: '', llmInstructions: '' }
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

    const impactLlm = c?.impactLlmInstructions || (c?.riskTypeDefinitions as any)?.impactLlmInstructions || '';
    const catLlm = c?.categoryLlmInstructions || (c?.riskTypeDefinitions as any)?.categoryLlmInstructions || '';

    return {
      ...EMPTY,
      ...c,
      impactLevelDefinitions: normImpacts,
      impactLlmInstructions: impactLlm,
      categoryLlmInstructions: catLlm,
      categories: (c?.categories && c.categories.length > 0 ? c.categories : DEFAULT_CATEGORIES).map((cat) => ({
        ...cat,
        imgcDefinition: cat.imgcDefinition || '',
        llmInstructions: cat.llmInstructions || ''
      }))
    };
  }
}
