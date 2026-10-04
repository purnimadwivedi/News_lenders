import { Component, OnInit, DoCheck, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { Company } from '../models';
import { TopicChipsComponent } from '../components/topic-chips.component';
import { buildNewsQuery, cleanTerms, resolveTopicMode, MAX_QUERY_LENGTH, SHORT_ALIAS_LENGTH } from '../utils/news-query.util';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule, FormsModule, TopicChipsComponent],
  template: `
    <div class="page-header-row" style="justify-content: flex-end;">
      <button class="btn-accent" (click)="openNew()">+ Add lender</button>
    </div>

    <div class="card" style="margin-top: 16px;">
      <h3>Shared topic filter</h3>
      <p class="field-hint" style="margin-top: 4px;">
        Used by {{ defaultModeCount }} of {{ activeCount }} active lenders (those set to "Use the shared default").
        An article must mention the lender <b>and</b> at least one of these topics. Leave empty to fetch all news.
      </p>
      <div style="margin-top: 10px;">
        <app-topic-chips [topics]="draftTopics" (topicsChange)="draftTopics = $event" [disabled]="savingTopics"
                         placeholder="Type a topic and press Enter, e.g. mortgage, home loan, NPA"></app-topic-chips>
      </div>
      <p *ngIf="defaultTopicsChanged" class="field-hint" style="margin-top: 6px;">{{ topicChangeSummary }}</p>
      <div *ngIf="defaultTopicsChanged" class="toolbar" style="margin-top: 10px; display: flex; gap: 8px;">
        <button class="primary" (click)="saveDefaultTopics()" [disabled]="savingTopics">{{ savingTopics ? 'Saving…' : 'Save' }}</button>
        <button type="button" (click)="discardDefaultTopics()" [disabled]="savingTopics">Discard</button>
      </div>
      <p *ngIf="topicsMessage" class="field-hint" [class.field-error]="topicsMessageIsError" style="margin-top: 6px;">{{ topicsMessage }}</p>
    </div>

    <div *ngIf="editing" class="card" style="margin-top: 16px;">
      <h3>{{ editing._id ? 'Edit lender' : 'New lender' }}</h3>
      <div class="grid-2" style="margin-top: 12px;">
        <div>
          <label>Name *</label>
          <input [(ngModel)]="editing.name" placeholder="e.g. HDFC Bank" />
        </div>
        <div>
          <label>Sector</label>
          <input [(ngModel)]="editing.sector" placeholder="Banking, NBFC, etc." />
        </div>
        <div>
          <label>Relationship</label>
          <select [(ngModel)]="editing.relationship">
            <option>Self</option>
            <option>Customer</option>
            <option>Lender Partner</option>
            <option>Competitor</option>
            <option>Partner</option>
            <option>Vendor</option>
            <option>Watchlist</option>
          </select>
        </div>
        <div>
          <label>Also known as (aliases, comma-separated)</label>
          <input [ngModel]="aliasesText" (ngModelChange)="setAliases($event)" placeholder="HDFC, Housing Development..." />
          <p class="field-hint">Articles mentioning <b>any</b> of these names are fetched too, along with the main name.</p>
          <p *ngIf="shortAliases.length" class="field-warn">
            Short aliases ({{ shortAliases.join(', ') }}) can match unrelated articles. Prefer longer forms, e.g. "Axis Bank" instead of "AXIS".
          </p>
        </div>
        <div class="grid-span-2">
          <label>Only keep articles about (topic filter)</label>
          <div class="topic-modes">
            <label class="checkbox-label">
              <input type="radio" name="topicMode" value="default" [(ngModel)]="editing.topicMode" />
              <span>Use the shared default
                <span class="muted">— {{ defaultTopics.length ? defaultTopics.join(', ') : 'none set, so all news is fetched' }}</span>
              </span>
            </label>
            <label class="checkbox-label">
              <input type="radio" name="topicMode" value="custom" [(ngModel)]="editing.topicMode" />
              <span>Custom topics for this lender</span>
            </label>
            <app-topic-chips *ngIf="editing.topicMode === 'custom'" class="topic-custom-input"
                             [topics]="editing.searchKeywords || []" (topicsChange)="editing.searchKeywords = $event"
                             placeholder="Type a topic and press Enter, e.g. mortgage, home loan"></app-topic-chips>
            <label class="checkbox-label">
              <input type="radio" name="topicMode" value="none" [(ngModel)]="editing.topicMode" />
              <span>No filter — fetch all news about this lender</span>
            </label>
          </div>
          <p class="field-hint">With a topic filter, an article must <b>also</b> mention at least one topic. Multi-word topics are matched as exact phrases.</p>
        </div>
        <div class="grid-span-2">
          <label>Search preview</label>
          <div class="query-preview" [class.over]="queryTooLong">{{ previewQuery || 'Enter a name to see the search query' }}</div>
          <p class="field-hint" [class.field-error]="queryTooLong">
            {{ previewQuery.length }} / {{ maxQueryLength }} characters{{ queryTooLong ? ' — too long for NewsAPI. Remove some aliases or topics.' : '' }}
          </p>
        </div>
        <div class="grid-span-2">
          <label>Notes</label>
          <textarea [(ngModel)]="editing.notes" rows="2"></textarea>
        </div>
        <div>
          <label class="checkbox-label">
            <input type="checkbox" [(ngModel)]="editing.active" />
            <span>Active (included in fetches)</span>
          </label>
        </div>
      </div>
      <div class="toolbar" style="margin-top: 14px;">
        <button class="primary" (click)="save()" [disabled]="queryTooLong || (editing.topicMode === 'custom' && !(editing.searchKeywords || []).length)"
                [title]="editing.topicMode === 'custom' && !(editing.searchKeywords || []).length ? 'Add at least one custom topic, or pick another option' : ''">
          {{ editing._id ? 'Update' : 'Create' }}
        </button>
        <button (click)="editing = null">Cancel</button>
        <span *ngIf="error" style="color: var(--critical); font-size: 12px;">{{ error }}</span>
      </div>
    </div>

    <div class="card" style="margin-top: 16px; padding: 0;">
      <div class="table-toolbar">
        <div class="pill-input-group">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z" />
          </svg>
          <input [(ngModel)]="search" placeholder="Search lender..." />
        </div>
        <select class="pill-select" [(ngModel)]="selectedSector">
          <option value="">All Sectors</option>
          <option *ngFor="let s of sectors" [value]="s">{{ s }}</option>
        </select>
        <select class="pill-select" [(ngModel)]="selectedRelationship">
          <option value="">All Relationships</option>
          <option *ngFor="let r of relationships" [value]="r">{{ r }}</option>
        </select>
        <div style="flex: 1;"></div>
        <button class="pill-btn" (click)="exportCsv()">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th (click)="sortBy('name')">Name <span class="sort-icon">{{ sortCol === 'name' ? (sortDesc ? '↓' : '↑') : '↑↓' }}</span></th>
              <th (click)="sortBy('sector')">Sector <span class="sort-icon">{{ sortCol === 'sector' ? (sortDesc ? '↓' : '↑') : '↑↓' }}</span></th>
              <th (click)="sortBy('relationship')">Relationship <span class="sort-icon">{{ sortCol === 'relationship' ? (sortDesc ? '↓' : '↑') : '↑↓' }}</span></th>
              <th (click)="sortBy('aliases')">Aliases <span class="sort-icon">{{ sortCol === 'aliases' ? (sortDesc ? '↓' : '↑') : '↑↓' }}</span></th>
              <th (click)="sortBy('active')">Active <span class="sort-icon">{{ sortCol === 'active' ? (sortDesc ? '↓' : '↑') : '↑↓' }}</span></th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of pagedItems">
              <td style="font-weight: 500;">{{ c.name }}</td>
              <td>{{ c.sector || '—' }}</td>
              <td><span style="color: #ea580c; font-weight: 500;">{{ c.relationship }}</span></td>
              <td style="color: #64748b;">{{ (c.aliases || []).join(', ') || '—' }}</td>
              <td [style.color]="c.active ? '#10b981' : '#ef4444'" style="font-weight: 500;">{{ c.active ? 'Active' : 'Inactive' }}</td>
              <td style="text-align: right; white-space: nowrap;">
                <button class="pill-btn" style="padding: 2px 8px;" (click)="edit(c)">Edit</button>
                <button class="pill-btn" style="padding: 2px 8px; margin-left: 6px; color: #ef4444; border-color: #fca5a5;" (click)="del(c)">Del</button>
              </td>
            </tr>
            <tr *ngIf="!pagedItems.length">
              <td colspan="6" style="text-align:center; padding: 30px; color: #94a3b8;">
                {{ search.trim() ? 'No lenders match your search.' : 'No lenders yet.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="table-footer">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>Rows per page</span>
          <select class="pill-select" style="padding: 2px 24px 2px 8px;" [(ngModel)]="pageSize" (change)="currentPage = 1">
            <option [ngValue]="10">10</option>
            <option [ngValue]="20">20</option>
            <option [ngValue]="50">50</option>
          </select>
          <span style="margin-left: 8px;">Total {{ filteredItems.length }} lenders</span>
        </div>
        <div class="pagination-controls">
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button class="page-btn" [disabled]="currentPage === 1" (click)="currentPage = currentPage - 1">&lt; Prev</button>
          <button class="page-btn active">{{ currentPage }}</button>
          <button class="page-btn" [disabled]="currentPage === totalPages" (click)="currentPage = currentPage + 1">Next &gt;</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      h1 { margin: 0 0 4px 0; font-size: 24px; }
      h3 { margin: 0; font-size: 14px; }
      .field-hint { margin: 4px 0 0; font-size: 12px; color: var(--muted); }
      .field-warn { margin: 4px 0 0; font-size: 12px; color: #b45309; }
      .field-error { color: var(--critical); }
      .topic-modes { display: flex; flex-direction: column; gap: 2px; }
      .topic-modes input[type="radio"] { width: 16px; height: 16px; margin: 0; accent-color: var(--app-primary, #f37819); cursor: pointer; }
      .topic-custom-input { display: block; margin: 2px 0 4px 24px; }
      .query-preview {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px;
        background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px;
        white-space: pre-wrap; word-break: break-word; color: var(--text);
      }
      .query-preview.over { border-color: var(--critical); background: #fef2f2; }
      .table-actions {
        display: inline-flex;
        gap: 6px;
        align-items: center;
        justify-content: flex-end;
      }
      .table-actions button {
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 500;
        line-height: 1.2;
      }
    `
  ]
})
export class CompaniesComponent implements OnInit, DoCheck {
  private api = inject(ApiService);
  items: Company[] = [];
  search = '';
  selectedSector = '';
  selectedRelationship = '';
  editing: Partial<Company> | null = null;
  aliasesText = '';
  error = '';

  // Shared topic filter (Configuration.defaultTopicKeywords): defaultTopics is what's saved, draftTopics is being edited.
  defaultTopics: string[] = [];
  draftTopics: string[] = [];
  savingTopics = false;
  topicsMessage = '';
  topicsMessageIsError = false;
  maxQueryLength = MAX_QUERY_LENGTH;

  get activeCount(): number {
    return this.items.filter((c) => c.active).length;
  }

  get defaultModeCount(): number {
    return this.items.filter((c) => c.active && resolveTopicMode(c) === 'default').length;
  }

  get defaultTopicsChanged(): boolean {
    return this.draftTopics.join('\n') !== this.defaultTopics.join('\n');
  }

  get topicChangeSummary(): string {
    const has = (list: string[], t: string) => list.some((x) => x.toLowerCase() === t.toLowerCase());
    const quoted = (list: string[]) => list.map((t) => `"${t}"`).join(', ');
    const added = this.draftTopics.filter((t) => !has(this.defaultTopics, t));
    const removed = this.defaultTopics.filter((t) => !has(this.draftTopics, t));
    const n = this.defaultModeCount;
    const lenders = `${n} lender${n === 1 ? '' : 's'} on the shared default`;
    if (!this.draftTopics.length) return `Removing all topics — ${lenders} will fetch all news. Not saved yet.`;
    const what = [added.length ? `adding ${quoted(added)}` : '', removed.length ? `removing ${quoted(removed)}` : '']
      .filter(Boolean)
      .join('; ');
    return `${what.charAt(0).toUpperCase()}${what.slice(1)} — affects ${lenders}. Not saved yet.`;
  }

  get previewQuery(): string {
    return this.editing ? buildNewsQuery(this.editing, this.defaultTopics) : '';
  }

  get queryTooLong(): boolean {
    return this.previewQuery.length > MAX_QUERY_LENGTH;
  }

  get shortAliases(): string[] {
    return cleanTerms(this.editing?.aliases).filter((a) => a.length <= SHORT_ALIAS_LENGTH);
  }

  saveDefaultTopics() {
    const topics = cleanTerms(this.draftTopics);
    this.savingTopics = true;
    this.topicsMessage = '';
    this.api.updateConfig({ defaultTopicKeywords: topics }).subscribe({
      next: (cfg) => {
        this.savingTopics = false;
        // A backend without this setting drops the field and still answers 200; keep the draft and say so.
        if (!Array.isArray(cfg.defaultTopicKeywords)) {
          this.topicsMessageIsError = true;
          this.topicsMessage = 'The server did not store the topics — the backend needs updating to support the shared topic filter.';
          return;
        }
        this.setDefaultTopics(cfg.defaultTopicKeywords);
        this.topicsMessageIsError = false;
        this.topicsMessage = 'Saved. The next fetch uses these topics.';
        setTimeout(() => (this.topicsMessage = ''), 5000);
      },
      error: (err) => {
        this.savingTopics = false;
        this.topicsMessageIsError = true;
        this.topicsMessage = err.error?.error || 'Could not save the shared topics';
      }
    });
  }

  discardDefaultTopics() {
    this.draftTopics = [...this.defaultTopics];
    this.topicsMessage = '';
  }

  private setDefaultTopics(topics: string[]) {
    this.defaultTopics = cleanTerms(topics);
    this.draftTopics = [...this.defaultTopics];
  }

  sortCol = 'name';
  sortDesc = false;
  pageSize = 10;
  currentPage = 1;

  sortBy(col: string) {
    if (this.sortCol === col) {
      this.sortDesc = !this.sortDesc;
    } else {
      this.sortCol = col;
      this.sortDesc = false;
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredItems.length / this.pageSize) || 1;
  }

  get pagedItems(): Company[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredItems.slice(start, start + this.pageSize);
  }

  get sectors(): string[] {
    const s = new Set(this.items.map(c => c.sector).filter(Boolean));
    return Array.from(s).sort() as string[];
  }

  get relationships(): string[] {
    const r = new Set(this.items.map(c => c.relationship).filter(Boolean));
    return Array.from(r).sort() as string[];
  }

  get filteredItems(): Company[] {
    let activeItems = this.items.filter(c => c.active);
    
    if (this.selectedSector) {
      activeItems = activeItems.filter(c => c.sector === this.selectedSector);
    }
    if (this.selectedRelationship) {
      activeItems = activeItems.filter(c => c.relationship === this.selectedRelationship);
    }

    const q = this.search.trim().toLowerCase();
    let res = activeItems;
    if (q) {
      res = activeItems.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.aliases && c.aliases.some((a) => a.toLowerCase().includes(q))) ||
          (c.sector && c.sector.toLowerCase().includes(q))
      );
    }
    
    res.sort((a, b) => {
      let v1 = (a as any)[this.sortCol] || '';
      let v2 = (b as any)[this.sortCol] || '';
      
      if (this.sortCol === 'aliases') {
        v1 = (a.aliases || []).join(', ');
        v2 = (b.aliases || []).join(', ');
      }
      
      if (typeof v1 === 'string') v1 = v1.toLowerCase();
      if (typeof v2 === 'string') v2 = v2.toLowerCase();
      
      if (v1 < v2) return this.sortDesc ? 1 : -1;
      if (v1 > v2) return this.sortDesc ? -1 : 1;
      return 0;
    });

    return res;
  }

  exportCsv() {
    const data = this.filteredItems.map(c => ({
      Name: c.name,
      Sector: c.sector || '',
      Relationship: c.relationship || '',
      Aliases: (c.aliases || []).join('; '),
      Active: c.active ? 'Yes' : 'No'
    }));
    
    if (!data.length) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${((row as any)[h] || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lenders_export_${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  ngOnInit() {
    this.load();
  }

  // watch for filter changes and reset page
  ngDoCheck() {
    const total = this.totalPages;
    if (this.currentPage > total && total > 0) {
      this.currentPage = total;
    }
  }

  load() {
    this.api.listCompanies().subscribe((c) => (this.items = c));
    this.api.getConfig().subscribe((cfg) => this.setDefaultTopics(cfg.defaultTopicKeywords || []));
  }

  openNew() {
    this.editing = { name: '', sector: '', relationship: 'Watchlist', active: true, aliases: [], searchKeywords: [], topicMode: 'default' };
    this.aliasesText = '';
    this.error = '';
  }

  edit(c: Company) {
    this.editing = { ...c, topicMode: resolveTopicMode(c) };
    this.aliasesText = (c.aliases || []).join(', ');
    this.error = '';
  }

  setAliases(value: string) {
    this.aliasesText = value;
    if (this.editing) this.editing.aliases = value.split(',').map((s) => s.trim()).filter(Boolean);
  }

  save() {
    if (!this.editing) return;
    this.error = '';
    const obs = this.editing._id
      ? this.api.updateCompany(this.editing._id, this.editing)
      : this.api.createCompany(this.editing);
    obs.subscribe({
      next: () => {
        this.editing = null;
        this.load();
      },
      error: (err) => (this.error = err.error?.error || err.message)
    });
  }

  del(c: Company) {
    if (!confirm(`Delete ${c.name}?`)) return;
    this.api.deleteCompany(c._id!).subscribe(() => this.load());
  }
}
