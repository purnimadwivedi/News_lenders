import { Component, OnInit, inject } from '@angular/core';
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

    <div class="card" style="margin-top: 16px;">
      <div class="toolbar" style="margin-bottom: 0;">
        <div class="toolbar-item toolbar-search">
          <input [(ngModel)]="search" placeholder="Search lenders..." />
        </div>
        <div class="spacer"></div>
        <span class="muted" style="font-size: 12px;">{{ filteredItems.length }} total</span>
      </div>
    </div>

    <div class="card" style="margin-top: 16px; padding: 0;">
     <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Sector</th>
            <th>Relationship</th>
            <th>Aliases</th>
            <th>Active</th>
            <th style="text-align: center;">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of filteredItems">
            <td><strong>{{ c.name }}</strong></td>
            <td>{{ c.sector || '—' }}</td>
            <td><span class="badge">{{ c.relationship }}</span></td>
            <td class="muted">{{ (c.aliases || []).join(', ') || '—' }}</td>
            <td>{{ c.active ? '✓' : '✗' }}</td>
            <td style="text-align: right; white-space: nowrap;">
              <div class="table-actions">
                <button (click)="edit(c)">Edit</button>
                <button class="danger" (click)="del(c)">Delete</button>
              </div>
            </td>
          </tr>
          <tr *ngIf="!filteredItems.length">
            <td colspan="6" class="muted" style="text-align:center; padding: 30px;">
              {{ search.trim() ? 'No lenders match your search.' : 'No lenders yet.' }}
            </td>
          </tr>
        </tbody>
      </table>
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
export class CompaniesComponent implements OnInit {
  private api = inject(ApiService);
  items: Company[] = [];
  search = '';
  editing: Partial<Company> | null = null;
  aliasesText = '';
  keywordsText = '';
  error = '';

  get filteredItems(): Company[] {
    const activeItems = this.items.filter(c => c.active);
    const q = this.search.trim().toLowerCase();
    if (!q) return activeItems;
    return activeItems.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.aliases && c.aliases.some((a) => a.toLowerCase().includes(q))) ||
        (c.sector && c.sector.toLowerCase().includes(q))
    );
  }

  ngOnInit() {
    this.load();
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
