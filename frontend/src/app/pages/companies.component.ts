import { Component, OnInit, DoCheck, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { Company } from '../models';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header-row" style="justify-content: flex-end;">
      <button class="btn-accent" (click)="openNew()">+ Add lender</button>
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
          <label>Aliases (comma-separated)</label>
          <input [ngModel]="aliasesText" (ngModelChange)="setAliases($event)" placeholder="HDFC, Housing Development..." />
        </div>
        <div class="grid-span-2">
          <label>Extra search keywords (comma-separated)</label>
          <input [ngModel]="keywordsText" (ngModelChange)="setKeywords($event)" placeholder="mortgage, home loan" />
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
        <button class="primary" (click)="save()">{{ editing._id ? 'Update' : 'Create' }}</button>
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
  keywordsText = '';
  error = '';
  
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
  }

  openNew() {
    this.editing = { name: '', sector: '', relationship: 'Watchlist', active: true, aliases: [], searchKeywords: [] };
    this.aliasesText = '';
    this.keywordsText = '';
    this.error = '';
  }

  edit(c: Company) {
    this.editing = { ...c };
    this.aliasesText = (c.aliases || []).join(', ');
    this.keywordsText = (c.searchKeywords || []).join(', ');
    this.error = '';
  }

  setAliases(value: string) {
    this.aliasesText = value;
    if (this.editing) this.editing.aliases = value.split(',').map((s) => s.trim()).filter(Boolean);
  }

  setKeywords(value: string) {
    this.keywordsText = value;
    if (this.editing) this.editing.searchKeywords = value.split(',').map((s) => s.trim()).filter(Boolean);
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
