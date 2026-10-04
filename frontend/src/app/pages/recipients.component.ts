import { Component, OnInit, DoCheck, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { Recipient } from '../models';

@Component({
  selector: 'app-recipients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header-row" style="justify-content: flex-end;">
      <button class="btn-accent" (click)="openNew()">+ Add recipient</button>
    </div>

    <div *ngIf="editing" class="card" style="margin-top: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3>{{ editing._id ? 'Edit recipient' : 'New recipient' }}</h3>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 13px; font-weight: 500;">Status</span>
          <label class="toggle-switch">
            <input type="checkbox" [(ngModel)]="editing.active" />
            <span class="slider"></span>
          </label>
          <span [style.color]="editing.active ? 'var(--primary)' : 'var(--muted)'" style="font-size: 13px; font-weight: 500;">
            {{ editing.active ? 'Active' : 'Inactive' }}
          </span>
        </div>
      </div>
      
      <fieldset [disabled]="!editing.active" style="border: none; padding: 0; margin: 0;">
        <div class="grid-2" style="margin-top: 12px;">
          <div>
            <label>Name *</label>
            <input [(ngModel)]="editing.name" placeholder="e.g. Priya Sharma" />
          </div>
          <div>
            <label>Email *</label>
            <input [(ngModel)]="editing.email" placeholder="name@lender.com" />
          </div>
          <div>
            <label>Minimum impact level for alerts</label>
            <select [(ngModel)]="editing.minImpactLevel">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>
          <div>
            <label style="visibility: hidden;">Notifications</label>
            <div style="display: flex; align-items: center; gap: 24px; min-height: 38px; flex-wrap: wrap;">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="editing.receiveImmediateAlerts" />
                <span>Immediate alerts (real-time)</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="editing.receiveDailyDigest" />
                <span>Daily digest</span>
              </label>
            </div>
          </div>
        </div>
      </fieldset>
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
          <input [(ngModel)]="search" placeholder="Search recipient..." />
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th (click)="sortBy('name')">Name <span class="sort-icon">{{ sortCol === 'name' ? (sortDesc ? '↓' : '↑') : '↑↓' }}</span></th>
              <th (click)="sortBy('email')">Email <span class="sort-icon">{{ sortCol === 'email' ? (sortDesc ? '↓' : '↑') : '↑↓' }}</span></th>
              <th (click)="sortBy('minImpactLevel')">Min impact <span class="sort-icon">{{ sortCol === 'minImpactLevel' ? (sortDesc ? '↓' : '↑') : '↑↓' }}</span></th>
              <th (click)="sortBy('alerts')">Alerts / Digest <span class="sort-icon">{{ sortCol === 'alerts' ? (sortDesc ? '↓' : '↑') : '↑↓' }}</span></th>
              <th (click)="sortBy('active')">Active <span class="sort-icon">{{ sortCol === 'active' ? (sortDesc ? '↓' : '↑') : '↑↓' }}</span></th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of pagedItems">
              <td style="font-weight: 500;">{{ r.name }}</td>
              <td style="color: #64748b;">{{ r.email }}</td>
              <td><span class="badge badge-{{ r.minImpactLevel }}">{{ r.minImpactLevel }}</span></td>
              <td style="color: #64748b;">
                <span [style.color]="r.receiveImmediateAlerts ? '#ea580c' : 'inherit'">{{ r.receiveImmediateAlerts ? 'Alert' : '—' }}</span> / 
                <span [style.color]="r.receiveDailyDigest ? '#3b82f6' : 'inherit'">{{ r.receiveDailyDigest ? 'Digest' : '—' }}</span>
              </td>
              <td [style.color]="r.active ? '#10b981' : '#ef4444'" style="font-weight: 500;">{{ r.active ? 'Active' : 'Inactive' }}</td>
              <td style="text-align: right; white-space: nowrap;">
                <button class="pill-btn" style="padding: 2px 8px;" (click)="test(r)">Test</button>
                <button class="pill-btn" style="padding: 2px 8px; margin-left: 6px;" (click)="edit(r)">Edit</button>
                <button class="pill-btn" style="padding: 2px 8px; margin-left: 6px; color: #ef4444; border-color: #fca5a5;" (click)="del(r)">Del</button>
              </td>
            </tr>
            <tr *ngIf="!pagedItems.length">
              <td colspan="6" style="text-align:center; padding: 30px; color: #94a3b8;">
                {{ search.trim() ? 'No recipients match your search.' : 'No recipients yet.' }}
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
          <span style="margin-left: 8px;">Total {{ filteredItems.length }} recipients</span>
        </div>
        <div class="pagination-controls">
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button class="page-btn" [disabled]="currentPage === 1" (click)="currentPage = currentPage - 1">&lt; Prev</button>
          <button class="page-btn active">{{ currentPage }}</button>
          <button class="page-btn" [disabled]="currentPage === totalPages" (click)="currentPage = currentPage + 1">Next &gt;</button>
        </div>
      </div>
    </div>

    <div *ngIf="deleting" class="logout-modal-backdrop" (click)="cancelDelete()">
      <div class="logout-modal-card" role="alertdialog" aria-modal="true" aria-labelledby="delete-recipient-title"
           aria-describedby="delete-recipient-msg" (click)="$event.stopPropagation()">
        <div class="logout-modal-icon-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#dc2626" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 id="delete-recipient-title" class="logout-modal-title">Delete recipient?</h3>
        <p id="delete-recipient-msg" class="logout-modal-msg">
          <b>{{ deleting.name }}</b><span *ngIf="deleting.email"> ({{ deleting.email }})</span> will be removed and will
          no longer receive alerts or digests. This cannot be undone.
        </p>
        <div *ngIf="deleteError" class="logout-modal-error">{{ deleteError }}</div>
        <div class="logout-modal-actions">
          <button type="button" class="btn-modal-cancel" (click)="cancelDelete()" [disabled]="deleteBusy">Cancel</button>
          <button type="button" class="btn-modal-logout" (click)="confirmDelete()" [disabled]="deleteBusy">
            {{ deleteBusy ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      h1 { margin: 0 0 4px 0; font-size: 24px; }
      h3 { margin: 0; font-size: 14px; }
      td button { margin-left: 4px; font-size: 11px; padding: 4px 9px; }
      
      .toggle-switch { position: relative; display: inline-block; width: 40px; height: 22px; }
      .toggle-switch input { opacity: 0; width: 0; height: 0; }
      .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .3s; border-radius: 22px; }
      .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 2px; bottom: 2px; background-color: white; transition: .3s; border-radius: 50%; }
      input:checked + .slider { background-color: var(--primary, #f97316); }
      input:focus + .slider { box-shadow: 0 0 1px var(--primary, #f97316); }
      input:checked + .slider:before { transform: translateX(18px); }
    `
  ]
})
export class RecipientsComponent implements OnInit, DoCheck {
  private api = inject(ApiService);
  items: Recipient[] = [];
  search = '';
  editing: Partial<Recipient> | null = null;
  error = '';

  // Recipient awaiting delete confirmation
  deleting: Recipient | null = null;
  deleteBusy = false;
  deleteError = '';
  
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

  get pagedItems(): Recipient[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredItems.slice(start, start + this.pageSize);
  }

  get filteredItems(): Recipient[] {
    let res = [...this.items];
    
    const q = this.search.trim().toLowerCase();
    if (q) {
      res = res.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q)
      );
    }

    res.sort((a, b) => {
      let v1 = (a as any)[this.sortCol] || '';
      let v2 = (b as any)[this.sortCol] || '';
      
      if (this.sortCol === 'alerts') {
        v1 = (a.receiveImmediateAlerts ? '1' : '0') + (a.receiveDailyDigest ? '1' : '0');
        v2 = (b.receiveImmediateAlerts ? '1' : '0') + (b.receiveDailyDigest ? '1' : '0');
      }
      
      if (typeof v1 === 'string') v1 = v1.toLowerCase();
      if (typeof v2 === 'string') v2 = v2.toLowerCase();
      
      if (v1 < v2) return this.sortDesc ? 1 : -1;
      if (v1 > v2) return this.sortDesc ? -1 : 1;
      return 0;
    });

    return res;
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
    this.api.listRecipients().subscribe((r) => (this.items = r));
  }

  openNew() {
    this.editing = {
      name: '',
      email: '',
      minImpactLevel: 'High',
      receiveImmediateAlerts: true,
      receiveDailyDigest: true,
      active: true
    };
    this.error = '';
  }

  edit(r: Recipient) {
    const copy = { ...r };
    delete (copy as any).role;
    this.editing = copy;
    this.error = '';
  }

  save() {
    if (!this.editing) return;
    this.error = '';
    const payload = { ...this.editing };
    delete (payload as any).role;
    const obs = payload._id
      ? this.api.updateRecipient(payload._id, payload)
      : this.api.createRecipient(payload);
    obs.subscribe({
      next: () => {
        this.editing = null;
        this.load();
      },
      error: (err) => (this.error = err.error?.error || err.message)
    });
  }

  del(r: Recipient) {
    this.deleting = r;
    this.deleteError = '';
  }

  cancelDelete() {
    if (this.deleteBusy) return;
    this.deleting = null;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.deleting) this.cancelDelete();
  }

  confirmDelete() {
    if (!this.deleting?._id) return;
    this.deleteBusy = true;
    this.deleteError = '';
    this.api.deleteRecipient(this.deleting._id).subscribe({
      next: () => {
        this.deleteBusy = false;
        this.deleting = null;
        this.load();
      },
      error: (err) => {
        this.deleteBusy = false;
        this.deleteError = err.error?.error || 'Could not delete this recipient. Please try again.';
      }
    });
  }

  test(r: Recipient) {
    this.api.testEmail(r._id!).subscribe({
      next: () => alert(`Test email sent to ${r.email}`),
      error: (err) => alert('Failed: ' + (err.error?.error || err.message))
    });
  }
}
