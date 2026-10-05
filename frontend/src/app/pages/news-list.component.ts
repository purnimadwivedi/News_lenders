import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { Company, ImpactLevel, NewsArticle, RiskType, UserOverride, AuditEntry, ClassificationAuditHistory } from '../models';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';
import { formatDate, getDateRange } from '../utils/date-period.util';

interface EditState {
  riskType: RiskType;
  riskLevel: ImpactLevel;
  impactLevel: ImpactLevel;
  note: string;
}

interface AuditTimelineItem {
  id?: string;
  action: 'initial_classification' | 'override_applied' | 'override_cleared';
  title: string;
  performedBy: string;
  performedAt: string | Date;
  previousImpact?: string;
  newImpact?: string;
  previousRiskType?: string;
  newRiskType?: string;
  fieldName?: string;
  previousValue?: string;
  newValue?: string;
  note?: string;
  details?: string;
  isAi?: boolean;
}

@Component({
  selector: 'app-news-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `

    <div class="card filter-card">
      <div class="toolbar news-toolbar">
        <div class="toolbar-item toolbar-search">
          <input [(ngModel)]="search" (ngModelChange)="reload()" placeholder="Search title..." />
        </div>
        <div class="toolbar-item">
          <select [(ngModel)]="company" (ngModelChange)="reload()">
            <option value="">All lenders</option>
            <option *ngFor="let c of companies" [value]="c._id">{{ c.name }}</option>
          </select>
        </div>
       
        <div class="toolbar-item">
          <select [(ngModel)]="impactLevel" (ngModelChange)="reload()">
            <option value="">All impact</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div class="toolbar-item">
          <select [(ngModel)]="riskType" (ngModelChange)="reload()">
            <option value="">All categories</option>
            <option value="financial">Financial</option>
            <option value="operational">Operational</option>
            <option value="reputational">Reputational</option>
            <option value="regulatory">Regulatory</option>
            <option value="competitive">Competitive</option>
            <option value="strategic">Strategic</option>
            <!--<option value="none">None</option>-->
          </select>
        </div>

        <!-- Date Filter Dropdown -->
        <div class="toolbar-item">
          <select [(ngModel)]="dateFilter" (ngModelChange)="onDateFilterChange()">
            <option value="">All dates</option>
            <option value="TODAY">Today</option>
            <option value="7D">Last 7 days</option>
            <option value="MTD">Month to Date (MTD)</option>
            <option value="QTD">Quarter to Date (QTD)</option>
            <option value="CFY">Financial Year (CFY)</option>
            <option value="CUSTOM">Custom range...</option>
          </select>
        </div>

        <!-- Reset Button -->
        <button *ngIf="hasActiveFilters" 
                type="button" 
                class="btn-reset-filters hand-cursor" 
                (click)="resetFilters()" 
                title="Reset all filters">
          ✕ Reset
        </button>

        <div class="spacer"></div>
        <span class="muted toolbar-count" style="font-size: 12px;">{{ total }} total</span>
      </div>

      <!-- Custom Date Range Bar (When Custom range... is selected) -->
      <div *ngIf="dateFilter === 'CUSTOM'" class="custom-range-bar">
        <div class="range-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>Date Range:</span>
        </div>

        <div class="range-inputs-group">
          <div class="date-field">
            <label class="date-field-label">From</label>
            <input type="date" [(ngModel)]="startDate" (change)="onCustomDateChange()" class="date-picker-input" title="Start date" [max]="maxToday" />
          </div>

          <span class="date-range-sep">to</span>

          <div class="date-field">
            <label class="date-field-label">To</label>
            <input type="date" [(ngModel)]="endDate" (change)="onCustomDateChange()" class="date-picker-input" title="End date" [max]="maxToday" [min]="startDate" />
          </div>

          <button *ngIf="startDate || endDate" 
                  type="button" 
                  class="btn-clear-range hand-cursor" 
                  (click)="clearCustomDates()" 
                  title="Clear custom dates">
            Clear dates
          </button>
        </div>
      </div>
    </div>

    <div *ngIf="!articles.length && !loading" class="card" style="margin-top: 8px; text-align: center; padding: 28px; color: var(--muted);">
      No articles match your filters yet.
    </div>

    <div *ngFor="let a of articles" class="card article-card">
      <div class="article-head">
        <div style="min-width: 0; flex: 1;">
          <a [href]="a.url" target="_blank" rel="noopener" class="title">{{ a.title }}</a>
          <div class="meta">
            <span><strong>{{ a.companyName }}</strong> · <strong>{{ a.source || 'unknown' }}</strong> ·
            {{ a.publishedAt | date: 'medium' }}</span>
            <span class="badges">
              <ng-container *ngIf="effective(a) as eff">
                <span class="badge badge-{{ eff.impactLevel }}">
                  Impact: {{ eff.impactLevel || '—' }}
                </span>
                <span class="badge">{{ eff.riskType || 'unclassified' }}</span>
              </ng-container>
              <span class="badge" *ngIf="a.classificationStatus !== 'classified'" style="background:#fef3c7; color:#92400e;">
                {{ a.classificationStatus }}
              </span>
              <span class="badge" *ngIf="a.emailedImmediate" style="background:#dbeafe; color:#1e40af;">alerted</span>
            </span>
          </div>
        </div>
        <div class="actions">
          <!-- Audit Trail (i) Icon Button placed before Change Classification -->
          <button type="button"
                  class="btn-audit-icon hand-cursor"
                  [class.active]="auditArticle?._id === a._id"
                  [class.changed]="!!classificationChange(a)"
                  (click)="openAuditModal(a)"
                  [title]="auditButtonTitle(a)"
                  [attr.aria-label]="auditButtonTitle(a)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </button>
          <ng-container *ngIf="isAdmin">
            <button type="button" (click)="openEditModal(a)">Change Classification</button>
            <button type="button" class="danger" (click)="openDeleteModal(a)">Delete</button>
          </ng-container>
        </div>
      </div>

      <p *ngIf="a.classification?.rationale" class="rationale">
        <strong style="font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.4px;">AI rationale</strong><br/>
        {{ a.classification?.rationale }}
      </p>
      <p *ngIf="a.description && !a.classification?.rationale" class="description">{{ a.description }}</p>

      <div *ngIf="a.classification?.suggestedActions?.length" class="suggested">
        <strong>Suggested actions:</strong>
        <ul>
          <li *ngFor="let s of a.classification?.suggestedActions">{{ s }}</li>
        </ul>
      </div>


    </div>

    <div *ngIf="total > articles.length" style="text-align: center; margin-top: 10px;">
      <button (click)="loadMore()" [disabled]="loading">Load more</button>
    </div>

    <!-- Classification Audit Trail Modal Popup -->
    <div class="audit-modal-backdrop" *ngIf="auditArticle" (click)="closeAuditModal()">
      <div class="audit-modal-card" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="audit-modal-header">
          <div class="audit-header-title">
            <div class="audit-icon-badge">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <div class="audit-title-text">Classification Audit Trail</div>
          </div>
          <button type="button" class="btn-close-audit hand-cursor" (click)="closeAuditModal()" title="Close audit trail">✕</button>
        </div>

        <!-- Modal Timeline Body -->
        <div class="audit-modal-body">
          <div *ngIf="getAuditHistory(auditArticle).length === 0" class="audit-empty-state">
            <div class="empty-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div class="empty-title">No Classification Changes</div>
            <div class="empty-desc">This article has not been manually reclassified yet. Any future changes made via "Change Classification" will appear here.</div>
          </div>

          <div class="audit-timeline" *ngIf="getAuditHistory(auditArticle).length > 0">
            <div *ngFor="let item of getAuditHistory(auditArticle); let last = last" class="audit-timeline-item">
              <!-- Timeline track line & marker -->
              <div class="timeline-indicator">
                <div class="timeline-dot" 
                     [class.override-dot]="item.action === 'override_applied'" 
                     [class.revert-dot]="item.action === 'override_cleared'">
                  <svg *ngIf="item.action === 'override_applied'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  <svg *ngIf="item.action === 'override_cleared'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                </div>
                <div *ngIf="!last" class="timeline-line"></div>
              </div>

              <!-- Content Card -->
              <div class="audit-item-card">
                <div class="audit-card-top">
                  <div class="audit-card-actor">
                    <span class="actor-avatar">{{ getInitials(item.performedBy) }}</span>
                    <div class="actor-details">
                      <span class="actor-name">{{ item.performedBy }}</span>
                      <span class="audit-action-tag" 
                            [class.tag-override]="item.action === 'override_applied'" 
                            [class.tag-revert]="item.action === 'override_cleared'">
                        {{ item.title }}
                      </span>
                      <span class="audit-field-badge">Field: {{ item.fieldName || 'Classification' }}</span>
                    </div>
                  </div>

                  <div class="audit-timestamp" [title]="item.performedAt | date:'medium'">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px; vertical-align: -1px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    {{ item.performedAt | date:'medium' }}
                  </div>
                </div>

                <!-- Changes summary -->
                <div class="audit-changes-grid">
                  <div class="change-cell">
                    <span class="change-label">Impact Level:</span>
                    <div class="change-value">
                      <span class="badge badge-sm badge-{{ item.previousImpact || 'Low' }}">{{ item.previousImpact || 'Low' }}</span>
                      <span class="change-arrow">→</span>
                      <span class="badge badge-sm badge-{{ item.newImpact || 'Low' }}">{{ item.newImpact || 'Low' }}</span>
                    </div>
                  </div>

                  <div class="change-cell">
                    <span class="change-label">Category:</span>
                    <div class="change-value">
                      <span class="badge-cat badge-cat-prev">{{ formatCategory(item.previousRiskType || 'none') }}</span>
                      <span class="change-arrow">→</span>
                      <span class="badge-cat active-cat">{{ formatCategory(item.newRiskType || 'none') }}</span>
                    </div>
                  </div>
                </div>

                <!-- User Note -->
                <div *ngIf="item.note" class="audit-note-box">
                  <span class="note-box-title">Note from {{ item.performedBy }}:</span>
                  <p class="note-box-text">{{ item.note }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="audit-modal-footer">
          <button type="button" class="btn-modal-close" (click)="closeAuditModal()">Close</button>
        </div>
      </div>
    </div>

    <!-- Change Classification Modal Popup -->
    <div class="edit-modal-backdrop" *ngIf="editingArticle && editState" (click)="closeEditModal()">
      <div class="edit-modal-card" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="edit-modal-header">
          <div class="edit-header-title">
            <div class="edit-icon-badge">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
            <div>
              <div class="edit-title-text">Change Classification</div>
              <div class="edit-subtitle-text">Manually override impact level, category, and teach the AI classifier</div>
            </div>
          </div>
          <button type="button" class="btn-close-edit hand-cursor" (click)="closeEditModal()" title="Close dialog">✕</button>
        </div>

        <!-- Article Context Banner -->
        <div class="edit-article-context">
          <div class="edit-article-title">{{ editingArticle.title }}</div>
          <div class="edit-article-meta">
            <span>{{ editingArticle.companyName }}</span> · 
            <span>{{ editingArticle.source || 'unknown' }}</span> · 
            <span>{{ editingArticle.publishedAt | date: 'medium' }}</span>
          </div>
          <div class="edit-article-current-badges">
            <span class="badge-label">Current:</span>
            <span class="badge badge-sm badge-{{ effective(editingArticle).impactLevel }}">
              Impact: {{ effective(editingArticle).impactLevel || 'Low' }}
            </span>
            <span class="badge-cat active-cat">
              Category: {{ formatCategory(effective(editingArticle).riskType) }}
            </span>
          </div>
        </div>

        <!-- Modal Body Form -->
        <div class="edit-modal-body">
          <div class="edit-form-grid">
            <div class="form-field">
              <label class="field-label-bold">Impact Level</label>
              <select [(ngModel)]="editState.impactLevel" class="modal-select">
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div class="form-field">
              <label class="field-label-bold">Category</label>
              <select [(ngModel)]="editState.riskType" class="modal-select">
                <option value="financial">Financial</option>
                <option value="operational">Operational</option>
                <option value="reputational">Reputational</option>
                <option value="regulatory">Regulatory</option>
                <option value="competitive">Competitive</option>
                <option value="strategic">Strategic</option>
              </select>
            </div>
          </div>

          <div class="form-field" style="margin-top: 14px;">
            <label class="field-label-bold">
              Why does this need correction?
              <span class="field-label-hint">(used to teach future classifications)</span>
            </label>
            <textarea
              [(ngModel)]="editState.note"
              rows="3"
              class="modal-textarea"
              placeholder="e.g. This kind of RBI circular always has Critical impact on us due to mortgage guarantee compliance rules."
            ></textarea>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="edit-modal-footer">
          <div>
            <button
              type="button"
              class="danger pill-btn"
              *ngIf="editingArticle.userOverride?.overriddenAt"
              (click)="clearOverride()"
              [disabled]="saving"
            >
              Clear override
            </button>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span *ngIf="saveError" style="color: var(--critical); font-size: 12px;">{{ saveError }}</span>
            <button type="button" (click)="closeEditModal()" [disabled]="saving">Cancel</button>
            <button type="button" class="primary" (click)="saveOverride()" [disabled]="saving">
              {{ saving ? 'Saving…' : 'Save & teach AI' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Article Confirmation Modal Popup -->
    <div class="delete-modal-backdrop" *ngIf="articleToDelete" (click)="cancelDeleteArticle()">
      <div class="delete-modal-card" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="delete-modal-header">
          <div class="delete-header-title">
            <div class="delete-icon-badge">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </div>
            <div class="delete-title-text">Delete Article</div>
          </div>
          <button type="button" class="btn-close-delete hand-cursor" (click)="cancelDeleteArticle()" title="Close dialog">✕</button>
        </div>

        <!-- Modal Body -->
        <div class="delete-modal-body">
          <p class="delete-confirm-prompt">
            Are you sure you want to delete this article?
          </p>
          <div class="delete-article-box">
            <div class="delete-article-title">
              "{{ articleToDelete.title }}"
            </div>
            <div class="delete-article-meta" *ngIf="articleToDelete.companyName || articleToDelete.source">
              <span>{{ articleToDelete.companyName }}</span> · <span>{{ articleToDelete.source || 'unknown' }}</span>
              <span *ngIf="articleToDelete.publishedAt"> · {{ articleToDelete.publishedAt | date:'medium' }}</span>
            </div>
          </div>
          <p class="delete-warning-text">
            This action cannot be undone.
          </p>
          <div *ngIf="deleteError" class="delete-error-msg">
            {{ deleteError }}
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="delete-modal-footer">
          <button type="button" class="btn-cancel hand-cursor" (click)="cancelDeleteArticle()" [disabled]="deletingArticle">
            Cancel
          </button>
          <button type="button" class="danger btn-delete-confirm hand-cursor" (click)="confirmDeleteArticle()" [disabled]="deletingArticle">
            {{ deletingArticle ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      h1 { margin: 0 0 4px 0; font-size: 24px; }
      /* Compact layout: tight card spacing; impact/category tags share the lender · source · date line */
      .filter-card { padding: 10px 12px; }
      .article-card { margin-top: 8px; padding: 10px 14px; }
      .article-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
      .title { font-size: 16px; font-weight: 600; color: var(--text); text-decoration: none; line-height: 1.4; word-break: break-word; }
      .title:hover { color: var(--primary); }
      .meta { font-size: 12px; color: var(--muted); margin-top: 2px; display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; }
      .badges { display: inline-flex; flex-wrap: wrap; gap: 4px; }
      .meta .badge { margin: 0; }
      .actions { display: flex; gap: 6px; flex-shrink: 0; align-items: center; }
      .actions button { font-size: 11px; padding: 4px 9px; }

      .btn-audit-icon {
        width: 28px !important;
        height: 28px !important;
        padding: 0 !important;
        border-radius: 50% !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: #f8fafc !important;
        border: 1px solid #cbd5e1 !important;
        color: #0284c7 !important;
        cursor: pointer;
        transition: all 0.18s ease;
        flex-shrink: 0;
      }
      .btn-audit-icon:hover {
        background: #e0f2fe !important;
        border-color: #38bdf8 !important;
        color: #0369a1 !important;
        transform: scale(1.08);
      }
      /* Classification was changed by a user at some point */
      .btn-audit-icon.changed {
        position: relative;
        background: #fef3c7 !important;
        border-color: #f59e0b !important;
        color: #b45309 !important;
      }
      .btn-audit-icon.changed::after {
        content: '';
        position: absolute;
        top: -2px;
        right: -2px;
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: #f59e0b;
        border: 2px solid #ffffff;
      }
      .btn-audit-icon.changed:hover {
        background: #fde68a !important;
        border-color: #d97706 !important;
        color: #92400e !important;
      }
      .btn-audit-icon.active {
        background: #0284c7 !important;
        border-color: #0284c7 !important;
        color: #ffffff !important;
        box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.25);
      }

      /* Classification Audit Trail Modal */
      .audit-modal-backdrop {
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
      .audit-modal-card {
        width: 100%;
        max-width: 650px;
        max-height: 85vh;
        background: #ffffff;
        border-radius: 14px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: modalPopIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .audit-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 18px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }
      .audit-modal-body {
        padding: 16px 18px;
        overflow-y: auto;
        flex: 1;
        min-height: 140px;
      }
      .audit-modal-footer {
        display: flex;
        justify-content: flex-end;
        padding: 10px 18px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
      }
      .btn-modal-close {
        padding: 6px 16px;
        font-size: 13px;
        font-weight: 600;
        border-radius: 6px;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        color: #334155;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .btn-modal-close:hover {
        background: #f1f5f9;
        border-color: #94a3b8;
      }
      .audit-empty-state {
        text-align: center;
        padding: 36px 16px;
        color: #64748b;
      }
      .empty-icon-wrap {
        margin-bottom: 10px;
      }
      .empty-title {
        font-size: 14px;
        font-weight: 700;
        color: #334155;
        margin-bottom: 4px;
      }
      .empty-desc {
        font-size: 12px;
        color: #64748b;
        max-width: 400px;
        margin: 0 auto;
        line-height: 1.45;
      }
      .audit-header-title {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .audit-icon-badge {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: #e0f2fe;
        color: #0284c7;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .audit-title-text {
        font-size: 14px;
        font-weight: 700;
        color: #0f172a;
        line-height: 1.2;
      }
      .btn-close-audit {
        background: transparent !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 6px !important;
        width: 26px !important;
        height: 26px !important;
        padding: 0 !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 12px !important;
        color: #64748b !important;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .btn-close-audit:hover {
        background: #fee2e2 !important;
        border-color: #fca5a5 !important;
        color: #dc2626 !important;
      }
      .audit-timeline {
        display: flex;
        flex-direction: column;
      }
      .audit-timeline-item {
        display: flex;
        gap: 14px;
        position: relative;
        padding-bottom: 16px;
      }
      .audit-timeline-item:last-child {
        padding-bottom: 0;
      }
      .timeline-indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 26px;
        flex-shrink: 0;
      }
      .timeline-dot {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #ffffff;
        border: 2px solid #94a3b8;
        color: #64748b;
        z-index: 2;
      }
      .timeline-dot.ai-dot {
        border-color: #6366f1;
        background: #eef2ff;
        color: #4f46e5;
      }
      .timeline-dot.override-dot {
        border-color: #0284c7;
        background: #f0f9ff;
        color: #0284c7;
      }
      .timeline-dot.revert-dot {
        border-color: #f59e0b;
        background: #fffbeb;
        color: #d97706;
      }
      .timeline-line {
        width: 2px;
        flex-grow: 1;
        background: #e2e8f0;
        margin-top: 4px;
      }
      .audit-item-card {
        flex: 1;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px 14px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      }
      .audit-card-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 10px;
      }
      .audit-card-actor {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .actor-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #0284c7;
        color: #ffffff;
        font-size: 10px;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .actor-avatar.ai-avatar {
        background: #6366f1;
      }
      .actor-details {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }
      .actor-name {
        font-size: 12px;
        font-weight: 600;
        color: #1e293b;
      }
      .audit-action-tag {
        font-size: 10px;
        font-weight: 600;
        padding: 2px 7px;
        border-radius: 4px;
      }
      .tag-override {
        background: #e0f2fe;
        color: #0369a1;
      }
      .tag-ai {
        background: #ede9fe;
        color: #6d28d9;
      }
      .tag-revert {
        background: #fef3c7;
        color: #92400e;
      }
      .audit-field-badge {
        font-size: 10px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #e2e8f0;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      .audit-timestamp {
        font-size: 11px;
        color: #64748b;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
      }
      .audit-changes-grid {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 8px;
        padding: 8px 10px;
        background: #f8fafc;
        border-radius: 6px;
        border: 1px solid #f1f5f9;
      }
      .change-cell {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
      }
      .change-label {
        font-weight: 600;
        color: #64748b;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      .change-value {
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      .change-arrow {
        color: #94a3b8;
        font-weight: 700;
        font-size: 11px;
      }
      .badge-sm {
        font-size: 10px !important;
        padding: 2px 7px !important;
      }
      .badge-cat {
        display: inline-flex;
        align-items: center;
        font-size: 10px !important;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 4px;
        text-transform: capitalize;
      }
      .badge-cat-prev {
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #cbd5e1;
      }
      .badge-cat.active-cat {
        background: #eff6ff;
        color: #1d4ed8;
        border: 1px solid #bfdbfe;
      }
      .audit-note-box {
        margin-top: 8px;
        padding: 8px 10px;
        background: #faf5ff;
        border-left: 3px solid #8b5cf6;
        border-radius: 4px;
      }
      .audit-ai-box {
        margin-top: 8px;
        padding: 8px 10px;
        background: #f0fdf4;
        border-left: 3px solid #22c55e;
        border-radius: 4px;
      }
      .note-box-title {
        font-size: 10px;
        font-weight: 700;
        color: #7c3aed;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        display: block;
      }
      .audit-ai-box .note-box-title {
        color: #16a34a;
      }
      .note-box-text {
        margin: 3px 0 0 0;
        font-size: 12px;
        color: #334155;
        line-height: 1.45;
      }
      .rationale { font-size: 13px; line-height: 1.45; color: #374151; margin: 8px 0 0 0; padding: 6px 12px; background: var(--surface-2); border-left: 3px solid var(--primary); border-radius: 4px; }
      .rationale.override-note { background: #f5f3ff; border-left-color: #7c3aed; }
      .description { font-size: 12px; color: var(--muted); line-height: 1.45; margin: 6px 0 0 0; }
      .suggested { font-size: 12px; color: #374151; margin-top: 6px; }
      .suggested ul { margin: 2px 0 0 18px; padding: 0; }

      /* Change Classification Modal */
      .edit-modal-backdrop {
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
      .edit-modal-card {
        width: 100%;
        max-width: 580px;
        background: #ffffff;
        border-radius: 14px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: modalPopIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .edit-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 18px;
        background: #faf5ff;
        border-bottom: 1px solid #f3e8ff;
      }
      .edit-header-title {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .edit-icon-badge {
        width: 34px;
        height: 34px;
        border-radius: 8px;
        background: #ede9fe;
        color: #7c3aed;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .edit-title-text {
        font-size: 14.5px;
        font-weight: 700;
        color: #1e1b4b;
        line-height: 1.2;
      }
      .edit-subtitle-text {
        font-size: 11px;
        color: #6b21a8;
        margin-top: 2px;
      }
      .btn-close-edit {
        background: transparent !important;
        border: 1px solid #e9d5ff !important;
        border-radius: 6px !important;
        width: 26px !important;
        height: 26px !important;
        padding: 0 !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 12px !important;
        color: #7c3aed !important;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .btn-close-edit:hover {
        background: #fee2e2 !important;
        border-color: #fca5a5 !important;
        color: #dc2626 !important;
      }
      .edit-article-context {
        padding: 12px 18px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }
      .edit-article-title {
        font-size: 13.5px;
        font-weight: 700;
        color: #1e293b;
        line-height: 1.35;
        margin-bottom: 4px;
      }
      .edit-article-meta {
        font-size: 11.5px;
        color: #64748b;
        margin-bottom: 8px;
      }
      .edit-article-current-badges {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .edit-modal-body {
        padding: 18px;
      }
      .edit-form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      .form-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .field-label-bold {
        font-size: 12.5px;
        font-weight: 600;
        color: #334155;
      }
      .field-label-hint {
        font-weight: 400;
        color: #64748b;
        font-size: 11px;
        margin-left: 4px;
      }
      .modal-select {
        width: 100%;
        padding: 7px 10px;
        font-size: 13px;
        border-radius: 6px;
        border: 1px solid #cbd5e1;
        background: #ffffff;
      }
      .modal-textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 8px 10px;
        font-size: 13px;
        line-height: 1.45;
        border-radius: 6px;
        border: 1px solid #cbd5e1;
        resize: vertical;
        font-family: inherit;
      }
      .edit-modal-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 18px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
      }

      /* Delete Confirmation Modal */
      .delete-modal-backdrop {
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
      .delete-modal-card {
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
      .delete-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 18px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }
      .delete-header-title {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .delete-icon-badge {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: #fee2e2;
        color: #ef4444;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .delete-title-text {
        font-size: 15px;
        font-weight: 700;
        color: #0f172a;
      }
      .btn-close-delete {
        background: transparent !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 6px !important;
        width: 26px !important;
        height: 26px !important;
        padding: 0 !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 12px !important;
        color: #64748b !important;
        cursor: pointer !important;
        transition: all 0.15s ease;
      }
      .btn-close-delete:hover {
        background: #fee2e2 !important;
        color: #ef4444 !important;
        border-color: #fca5a5 !important;
      }
      .delete-modal-body {
        padding: 18px 20px;
      }
      .delete-confirm-prompt {
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 12px 0;
      }
      .delete-article-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-left: 4px solid #ef4444;
        border-radius: 6px;
        padding: 10px 14px;
        margin-bottom: 12px;
      }
      .delete-article-title {
        font-size: 13.5px;
        font-weight: 600;
        color: #0f172a;
        line-height: 1.4;
      }
      .delete-article-meta {
        font-size: 11.5px;
        color: #64748b;
        margin-top: 4px;
      }
      .delete-warning-text {
        font-size: 12px;
        color: #ef4444;
        font-weight: 500;
        margin: 0;
      }
      .delete-error-msg {
        margin-top: 10px;
        padding: 8px 12px;
        background: #fee2e2;
        border: 1px solid #fecaca;
        border-radius: 6px;
        color: #b91c1c;
        font-size: 12px;
        font-weight: 500;
      }
      .delete-modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 12px 18px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
      }
      .btn-delete-confirm {
        padding: 6px 18px !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        border-radius: 6px !important;
      }

      .news-toolbar {
        margin-bottom: 0px;
      }
      .custom-range-bar {
        margin-top: 12px;
        padding-top: 10px;
        border-top: 1px dashed var(--border, #cbd5e1);
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        animation: fadeIn 0.18s ease-out;
      }
      .range-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 600;
        color: var(--primary, #0284c7);
      }
      .range-inputs-group {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .date-field {
        display: inline-flex;
        align-items: center;
        background: var(--surface-2, #f8fafc);
        border: 1px solid var(--border, #cbd5e1);
        border-radius: 6px;
        padding: 2px 8px;
        gap: 6px;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      .date-field:focus-within {
        border-color: var(--primary, #0284c7);
        box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15);
      }
      .date-field-label {
        font-size: 11px;
        font-weight: 600;
        color: var(--muted, #64748b);
        text-transform: uppercase;
        letter-spacing: 0.3px;
        margin: 0;
        user-select: none;
      }
      .date-picker-input {
        border: none !important;
        background: transparent !important;
        font-size: 12px !important;
        font-family: inherit !important;
        color: var(--text, #1e293b) !important;
        padding: 4px 2px !important;
        outline: none !important;
        box-shadow: none !important;
        min-width: 135px;
        cursor: pointer;
      }
      .date-range-sep {
        font-size: 12px;
        color: var(--muted, #94a3b8);
        font-weight: 500;
      }
      .btn-clear-range {
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        border-radius: 5px;
        font-size: 11px;
        font-weight: 600;
        padding: 5px 10px;
        color: #64748b;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .btn-clear-range:hover {
        background: #fee2e2;
        border-color: #fca5a5;
        color: #dc2626;
      }
      .btn-reset-filters {
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        color: #475569;
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .btn-reset-filters:hover {
        background: #fee2e2;
        color: #b91c1c;
        border-color: #fca5a5;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .hand-cursor { cursor: pointer; }
    `
  ]
})
export class NewsListComponent implements OnInit {
  private api = inject(ApiService);
  private authService = inject(AuthService);
  
  get isAdmin() {
    return this.authService.getUserProfile()?.role === 'Admin';
  }

  articles: NewsArticle[] = [];
  companies: Company[] = [];
  total = 0;
  loading = false;
  saving = false;
  saveError = '';
  pageSize = 25;
  skip = 0;
  search = '';
  company = '';
  riskLevel = '';
  impactLevel = '';
  riskType = '';
  period = '';
  dateFilter = '';
  startDate = '';
  endDate = '';

  editingArticle: NewsArticle | null = null;
  editingId: string | null = null;
  editState: EditState | null = null;

  articleToDelete: NewsArticle | null = null;
  deletingArticle = false;
  deleteError = '';

  cmpny: string | null = null;

  constructor(private route: ActivatedRoute) { }

  get maxToday(): string {
    return formatDate(new Date());
  }

  get hasActiveFilters(): boolean {
    return !!(this.search || this.company || this.impactLevel || this.riskType || this.dateFilter || this.startDate || this.endDate);
  }

  ngOnInit() {
    this.clearLegacyAuditCopies();
    this.route.paramMap.subscribe(params => {
      if (params.has('impact')) this.impactLevel = params.get('impact') ?? '';
      if (params.has('risk') || params.has('riskLevel')) this.riskLevel = params.get('risk') ?? params.get('riskLevel') ?? '';
      if (params.has('riskType')) this.riskType = params.get('riskType') ?? '';
      if (params.has('company')) this.cmpny = params.get('company') ?? '';
      const p = params.get('period');
      if (p) {
        this.dateFilter = p;
        this.applyDateFilterPreset(p);
      }
    });

    this.route.queryParamMap.subscribe(qParams => {
      if (qParams.has('impact')) this.impactLevel = qParams.get('impact') || '';
      if (qParams.has('riskType')) this.riskType = qParams.get('riskType') || '';
      if (qParams.has('company')) this.cmpny = qParams.get('company') || '';
      if (qParams.has('period')) {
        const p = qParams.get('period') || '';
        this.dateFilter = p;
        this.applyDateFilterPreset(p);
      }
      if (qParams.has('startDate')) {
        const qStart = qParams.get('startDate') || '';
        this.startDate = qStart > this.maxToday ? this.maxToday : qStart;
        this.dateFilter = 'CUSTOM';
      }
      if (qParams.has('endDate')) {
        const qEnd = qParams.get('endDate') || '';
        this.endDate = qEnd > this.maxToday ? this.maxToday : qEnd;
        this.dateFilter = 'CUSTOM';
      }
    });

    this.api.listCompanies().subscribe((c) => {
      this.companies = c;
      this.reload();
    });
  }

  onDateFilterChange() {
    this.applyDateFilterPreset(this.dateFilter);
    this.reload();
  }

  onCustomDateChange() {
    const todayStr = this.maxToday;
    if (this.endDate && this.endDate > todayStr) {
      this.endDate = todayStr;
    }
    if (this.startDate && this.startDate > todayStr) {
      this.startDate = todayStr;
    }
    if (this.startDate && this.endDate && this.startDate > this.endDate) {
      this.endDate = this.startDate;
    }
    this.reload();
  }

  clearCustomDates() {
    this.startDate = '';
    this.endDate = '';
    this.reload();
  }

  applyDateFilterPreset(filter: string) {
    const now = new Date();
    switch (filter) {
      case 'TODAY': {
        const todayStr = formatDate(now);
        this.startDate = todayStr;
        this.endDate = todayStr;
        this.period = '';
        break;
      }
      case '7D': {
        const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        this.startDate = formatDate(d);
        this.endDate = formatDate(now);
        this.period = '';
        break;
      }
      case 'MTD': {
        const range = getDateRange('MTD', now);
        this.startDate = range.startDate;
        this.endDate = range.endDate;
        this.period = 'MTD';
        break;
      }
      case 'QTD': {
        const range = getDateRange('QTD', now);
        this.startDate = range.startDate;
        this.endDate = range.endDate;
        this.period = 'QTD';
        break;
      }
      case 'CFY': {
        const range = getDateRange('CFY', now);
        this.startDate = range.startDate;
        this.endDate = range.endDate;
        this.period = 'CFY';
        break;
      }
      case 'CUSTOM': {
        this.period = '';
        break;
      }
      default: {
        this.startDate = '';
        this.endDate = '';
        this.period = '';
        break;
      }
    }
  }

  resetFilters() {
    this.search = '';
    this.company = '';
    this.cmpny = null;
    this.impactLevel = '';
    this.riskLevel = '';
    this.riskType = '';
    this.dateFilter = '';
    this.period = '';
    this.startDate = '';
    this.endDate = '';
    this.reload();
  }

  reload() {
    if (this.companies && this.cmpny) {
      const temp = this.companies.find(a => a.name.toLowerCase().trim() === this.cmpny?.toLowerCase().trim()) ?? null;
      if (temp) {
        this.company = temp._id ?? '';
      }
    }

    this.skip = 0;
    this.fetch(true);
  }

  loadMore() {
    this.skip += this.pageSize;
    this.fetch(false);
  }

  effective(a: NewsArticle): {
    impactLevel?: ImpactLevel;
    riskLevel?: ImpactLevel;
    riskType?: RiskType;
    sentiment?: string;
  } {
    const eff = (a as any).effectiveClassification || {};
    const c = a.classification || eff || {};
    const u = a.userOverride;
    if (!u || !u.overriddenAt) {
      return {
        impactLevel: c.impactLevel || eff.impactLevel,
        riskLevel: c.riskLevel || eff.riskLevel,
        riskType: c.riskType || eff.riskType,
        sentiment: c.sentiment || eff.sentiment
      };
    }
    return {
      impactLevel: u.impactLevel || c.impactLevel || eff.impactLevel,
      riskLevel: u.riskLevel || c.riskLevel || eff.riskLevel,
      riskType: u.riskType || c.riskType || eff.riskType,
      sentiment: u.sentiment || c.sentiment || eff.sentiment
    };
  }

  auditArticle: NewsArticle | null = null;

  formatCategory(val?: string): string {
    if (!val || val === 'none') return 'None';
    return val.charAt(0).toUpperCase() + val.slice(1);
  }

  getInitials(name: string): string {
    if (!name) return 'US';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // The audit trail is stored and served by the backend only. Older builds also kept a browser copy under
  // 'audit_history_<id>', whose client-timestamped entries never matched the server's and showed up twice.
  private clearLegacyAuditCopies() {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('audit_history_')) localStorage.removeItem(key);
      }
    } catch (_) {}
  }

  getAuditHistory(a: NewsArticle): AuditTimelineItem[] {
    const history: AuditTimelineItem[] = [];
    const baseImpact = a.classification?.impactLevel || 'Low';
    const baseRiskType = a.classification?.riskType || 'none';

    // 1. The backend's auditTrail is the single source of truth
    const combined: ClassificationAuditHistory[] = [];
    if (a.auditTrail && Array.isArray(a.auditTrail)) {
      combined.push(...a.auditTrail);
    }

    // 2. Fallback for overrides made before the audit trail existed: show (but never store) an entry for it
    if (a.userOverride && a.userOverride.overriddenAt) {
      const u = a.userOverride;
      const uTime = new Date(u.overriddenAt || Date.now()).getTime();
      const hasOverrideEntry = combined.some(
        (x) => Math.abs(new Date(x.performedAt || x.changedAt || '').getTime() - uTime) < 5000 ||
               (x.action === 'override_applied' && (x.note || '') === (u.note || ''))
      );
      if (!hasOverrideEntry) {
        const syntheticEntry: ClassificationAuditHistory = {
          id: 'audit_override_' + uTime,
          _id: 'audit_override_' + uTime,
          entityId: a._id,
          fieldName: 'Classification',
          previousValue: `Impact: ${baseImpact}, Category: ${this.formatCategory(baseRiskType)}`,
          newValue: `Impact: ${u.impactLevel || baseImpact}, Category: ${this.formatCategory(u.riskType || baseRiskType)}`,
          previousImpact: baseImpact,
          newImpact: u.impactLevel || baseImpact,
          previousRiskType: baseRiskType,
          newRiskType: u.riskType || baseRiskType,
          changedBy: u.overriddenBy || 'Admin (Meera)',
          changedAt: u.overriddenAt,
          performedBy: u.overriddenBy || 'Admin (Meera)',
          performedAt: u.overriddenAt,
          action: 'override_applied',
          title: 'Classification Override',
          note: u.note || '',
          details: `Classification changed from ${baseImpact} (${this.formatCategory(baseRiskType)}) to ${u.impactLevel || baseImpact} (${this.formatCategory(u.riskType || baseRiskType)})`
        };
        combined.push(syntheticEntry);
      }
    }

    // 3. Convert all records to timeline items (excluding initial_classification per requirement)
    for (const entry of combined) {
      if (entry.action === 'initial_classification') continue;

      let title = 'Classification Override';
      if (entry.action === 'override_cleared') title = 'Override Cleared';

      const actor = entry.changedBy || entry.performedBy || 'Admin (Meera)';
      const time = entry.changedAt || entry.performedAt || a.publishedAt || new Date().toISOString();

      history.push({
        id: entry.id || entry._id,
        action: entry.action || 'override_applied',
        title,
        performedBy: actor,
        performedAt: time,
        previousImpact: entry.previousImpact || baseImpact,
        newImpact: entry.newImpact || baseImpact,
        previousRiskType: entry.previousRiskType || baseRiskType,
        newRiskType: entry.newRiskType || baseRiskType,
        fieldName: entry.fieldName || 'Classification',
        previousValue: entry.previousValue,
        newValue: entry.newValue,
        note: entry.note,
        details: entry.details,
        isAi: false
      });
    }

    // 4. Sort descending (newest on top)
    history.sort((x, y) => new Date(y.performedAt).getTime() - new Date(x.performedAt).getTime());

    return history;
  }

  /**
   * The latest user change to this article's classification, or null if it still has the AI's original one.
   * Uses the server's audit trail, falling back to the current override for overrides made before the trail existed.
   */
  classificationChange(a: NewsArticle): { by: string; at: string; cleared: boolean } | null {
    const entries = (a.auditTrail || []).filter(
      (e) => e.action === 'override_applied' || e.action === 'override_cleared'
    );
    if (entries.length) {
      const latest = entries.reduce((x, y) =>
        new Date(y.changedAt || y.performedAt || 0).getTime() > new Date(x.changedAt || x.performedAt || 0).getTime() ? y : x
      );
      return {
        by: latest.changedBy || latest.performedBy || 'a user',
        at: (latest.changedAt || latest.performedAt || '') as string,
        cleared: latest.action === 'override_cleared'
      };
    }
    const u = a.userOverride;
    if (u && u.overriddenAt) return { by: u.overriddenBy || 'a user', at: u.overriddenAt, cleared: false };
    return null;
  }

  auditButtonTitle(a: NewsArticle): string {
    const ch = this.classificationChange(a);
    if (!ch) return 'View Classification Audit Trail & History';
    const when = ch.at
      ? new Date(ch.at).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '';
    const what = ch.cleared ? 'Override cleared (back to AI classification)' : 'Classification changed';
    return `${what} by ${ch.by}${when ? ' on ' + when : ''} — view audit trail`;
  }

  openAuditModal(a: NewsArticle) {
    this.auditArticle = a;
    // Always sync with dedicated audit history endpoint
    this.api.getAuditHistory(a._id).subscribe({
      next: (history) => {
        a.auditTrail = Array.isArray(history) ? history : [];
        if (this.auditArticle && this.auditArticle._id === a._id) {
          this.auditArticle = { ...a };
        }
      },
      error: () => {
        // Keep showing the trail that came with the article
      }
    });
  }

  closeAuditModal() {
    this.auditArticle = null;
  }

  openEditModal(a: NewsArticle) {
    this.editingArticle = a;
    this.editingId = a._id;
    const eff = this.effective(a);
    const effRisk = (eff.riskType || 'financial').toLowerCase();
    this.editState = {
      impactLevel: (eff.impactLevel || 'Low') as ImpactLevel,
      riskLevel: (eff.riskLevel || 'Low') as ImpactLevel,
      riskType: (effRisk || 'financial') as RiskType,
      note: a.userOverride?.note || ''
    };
  }

  closeEditModal() {
    this.saveError = '';
    this.editingArticle = null;
    this.editingId = null;
    this.editState = null;
  }

  toggleEdit(a: NewsArticle) {
    this.openEditModal(a);
  }

  cancelEdit() {
    this.closeEditModal();
  }

  saveOverride(a?: NewsArticle) {
    const target = a || this.editingArticle;
    if (!target || !this.editState) return;

    this.saving = true;
    const eff = this.effective(target);
    const currentImpact = eff.impactLevel || target.classification?.impactLevel || 'Low';
    const currentRiskType = eff.riskType || target.classification?.riskType || 'none';
    const newImpact = this.editState.impactLevel || currentImpact;
    const newRiskType = this.editState.riskType || currentRiskType;
    const noteText = (this.editState.note || '').trim();

    const profile = this.authService.getUserProfile();
    const actorName = profile?.name || 'Admin (Meera)';
    const nowIso = new Date().toISOString();

    const isSameValues = (newImpact === currentImpact && String(newRiskType).toLowerCase() === String(currentRiskType).toLowerCase());

    // Create immutable audit record
    const newAuditEntry: ClassificationAuditHistory = {
      id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      _id: 'audit_' + Date.now(),
      entityId: target._id,
      fieldName: 'Classification',
      previousValue: `Impact: ${currentImpact}, Category: ${this.formatCategory(currentRiskType)}`,
      newValue: `Impact: ${newImpact}, Category: ${this.formatCategory(newRiskType)}`,
      previousImpact: currentImpact,
      newImpact: newImpact,
      previousRiskType: currentRiskType,
      newRiskType: newRiskType,
      changedBy: actorName,
      changedAt: nowIso,
      performedBy: actorName,
      performedAt: nowIso,
      action: 'override_applied',
      title: 'Classification Override',
      note: noteText,
      details: isSameValues
        ? `Classification confirmed with note: "${noteText}"`
        : `Classification changed from ${currentImpact} (${this.formatCategory(currentRiskType)}) to ${newImpact} (${this.formatCategory(newRiskType)})`
    };

    // Show the change immediately; the server's response replaces it with the stored record
    const previousOverride = target.userOverride;
    const previousTrail = target.auditTrail ? [...target.auditTrail] : [];
    this.saveError = '';
    target.userOverride = {
      impactLevel: newImpact,
      riskLevel: this.editState.riskLevel || 'Low',
      riskType: newRiskType,
      note: noteText,
      overriddenBy: actorName,
      overriddenAt: nowIso
    };
    if (!target.auditTrail) target.auditTrail = [];
    target.auditTrail.push(newAuditEntry);

    const payload: Partial<UserOverride> = {
      impactLevel: newImpact,
      riskLevel: this.editState.riskLevel || 'Low',
      riskType: newRiskType,
      note: noteText,
      overriddenBy: actorName
    };

    this.api.overrideClassification(target._id, payload).subscribe({
      next: (updated) => {
        const idx = this.articles.findIndex((x) => x._id === target._id);
        if (idx >= 0) {
          updated.auditTrail = Array.isArray(updated.auditTrail) ? updated.auditTrail : [];
          if (!updated.userOverride || !updated.userOverride.overriddenAt) {
            updated.userOverride = target.userOverride;
          } else if (noteText && !updated.userOverride.note) {
            updated.userOverride.note = noteText;
          }
          this.articles[idx] = updated;
          if (this.auditArticle && this.auditArticle._id === target._id) {
            this.auditArticle = updated;
          }
        }
        this.saving = false;
        this.closeEditModal();
      },
      error: (err) => {
        // Nothing was saved: undo the on-screen change so the audit trail only ever shows stored records
        target.userOverride = previousOverride;
        target.auditTrail = previousTrail;
        const idx = this.articles.findIndex((x) => x._id === target._id);
        if (idx >= 0) this.articles[idx] = { ...target };
        if (this.auditArticle && this.auditArticle._id === target._id) {
          this.auditArticle = { ...target };
        }
        this.saving = false;
        this.saveError = err?.error?.error || 'The override could not be saved. Please try again.';
      }
    });
  }

  clearOverride(a?: NewsArticle) {
    const target = a || this.editingArticle;
    if (!target) return;
    if (!confirm('Remove your override and revert to the AI classification?')) return;

    this.saving = true;
    this.saveError = '';

    // The backend records the 'override_cleared' audit entry; the page shows what it returns
    this.api.clearOverride(target._id).subscribe({
      next: (updated) => {
        const idx = this.articles.findIndex((x) => x._id === target._id);
        if (idx >= 0) {
          updated.auditTrail = Array.isArray(updated.auditTrail) ? updated.auditTrail : [];
          this.articles[idx] = updated;
          if (this.auditArticle && this.auditArticle._id === target._id) {
            this.auditArticle = updated;
          }
        }
        this.saving = false;
        this.closeEditModal();
      },
      error: (err) => {
        this.saving = false;
        this.saveError = err?.error?.error || 'The override could not be cleared. Please try again.';
      }
    });
  }

  private fetch(replace: boolean) {
    this.loading = true;
    const todayStr = this.maxToday;
    if (this.endDate && this.endDate > todayStr) {
      this.endDate = todayStr;
    }
    if (this.startDate && this.startDate > todayStr) {
      this.startDate = todayStr;
    }
    if (this.startDate && this.endDate && this.startDate > this.endDate) {
      this.endDate = this.startDate;
    }

    const isCustomDate = !!(this.startDate || this.endDate);
    const hasClientFilter = !!(this.impactLevel || this.riskType || this.riskLevel || isCustomDate);
    const limit = hasClientFilter ? '200' : String(this.pageSize);
    const skip = hasClientFilter ? '0' : String(this.skip);
    const params: Record<string, string> = { limit, skip };
    if (this.search) params['search'] = this.search;
    if (this.company) params['company'] = this.company;
    if (this.period && !isCustomDate) params['period'] = this.period;
    if (this.startDate) params['startDate'] = this.startDate;
    if (this.endDate) params['endDate'] = this.endDate;

    this.api.listNews(params).subscribe({
      next: (r) => {
        let items = r.items || [];
        if (this.impactLevel) {
          items = items.filter((a) => (this.effective(a).impactLevel || '').toLowerCase() === this.impactLevel.toLowerCase());
        }
        if (this.riskType) {
          items = items.filter((a) => (this.effective(a).riskType || '').toLowerCase() === this.riskType.toLowerCase());
        }
        if (this.riskLevel) {
          items = items.filter((a) => (this.effective(a).riskLevel || '').toLowerCase() === this.riskLevel.toLowerCase());
        }
        if (this.startDate || this.endDate) {
          const startMs = this.startDate ? new Date(this.startDate + 'T00:00:00').getTime() : 0;
          const endMs = this.endDate ? new Date(this.endDate + 'T23:59:59.999').getTime() : Number.MAX_SAFE_INTEGER;
          items = items.filter((a) => {
            if (!a.publishedAt) return true;
            const pMs = new Date(a.publishedAt).getTime();
            return pMs >= startMs && pMs <= endMs;
          });
        }
        this.total = hasClientFilter ? items.length : r.total;
        this.articles = replace ? items : [...this.articles, ...items];
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.articleToDelete && !this.deletingArticle) {
      this.cancelDeleteArticle();
    } else if (this.auditArticle) {
      this.closeAuditModal();
    } else if (this.editingArticle && !this.saving) {
      this.closeEditModal();
    }
  }

  openDeleteModal(a: NewsArticle) {
    this.articleToDelete = a;
    this.deletingArticle = false;
    this.deleteError = '';
  }

  cancelDeleteArticle() {
    if (this.deletingArticle) return;
    this.articleToDelete = null;
    this.deleteError = '';
  }

  confirmDeleteArticle() {
    if (!this.articleToDelete || this.deletingArticle) return;
    const target = this.articleToDelete;
    this.deletingArticle = true;
    this.deleteError = '';

    this.api.deleteNews(target._id).subscribe({
      next: () => {
        this.articles = this.articles.filter((x) => x._id !== target._id);
        if (this.total > 0) {
          this.total -= 1;
        }
        if (this.auditArticle?._id === target._id) {
          this.closeAuditModal();
        }
        this.deletingArticle = false;
        this.articleToDelete = null;
      },
      error: () => {
        this.deletingArticle = false;
        this.deleteError = 'Unable to delete article. Please try again.';
      }
    });
  }

  del(a: NewsArticle) {
    this.openDeleteModal(a);
  }
}
