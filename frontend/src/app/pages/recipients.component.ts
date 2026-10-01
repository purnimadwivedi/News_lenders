import { Component, OnInit, inject } from '@angular/core';
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
            <label>Role</label>
            <input [(ngModel)]="editing.role" placeholder="CRO, Head of Risk, etc." />
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
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="editing.receiveImmediateAlerts" />
              <span>Immediate alerts (real-time)</span>
            </label>
          </div>
          <div>
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="editing.receiveDailyDigest" />
              <span>Daily digest</span>
            </label>
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
     <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Min impact</th>
            <th>Alerts / Digest</th>
            <th>Active</th>
             <th style="text-align: center;">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let r of items">
            <td><strong>{{ r.name }}</strong></td>
            <td>{{ r.email }}</td>
            <td class="muted">{{ r.role || '—' }}</td>
            <td><span class="badge badge-{{ r.minImpactLevel }}">{{ r.minImpactLevel }}</span></td>
            <td class="muted" style="font-size: 11px;">
              {{ r.receiveImmediateAlerts ? 'alert' : '—' }} / {{ r.receiveDailyDigest ? 'digest' : '—' }}
            </td>
            <td>{{ r.active ? '✓' : '✗' }}</td>
            <td style="text-align: right; white-space: nowrap;">
              <div class="table-actions">
                <button (click)="test(r)">Test</button>
                <button (click)="edit(r)">Edit</button>
                <button class="danger" (click)="del(r)">Delete</button>
              </div>
            </td>
          </tr>
          <tr *ngIf="!items.length">
            <td colspan="7" class="muted" style="text-align:center; padding: 30px;">No recipients yet.</td>
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
export class RecipientsComponent implements OnInit {
  private api = inject(ApiService);
  items: Recipient[] = [];
  editing: Partial<Recipient> | null = null;
  error = '';

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.listRecipients().subscribe((r) => (this.items = r));
  }

  openNew() {
    this.editing = {
      name: '',
      email: '',
      role: '',
      minImpactLevel: 'High',
      receiveImmediateAlerts: true,
      receiveDailyDigest: true,
      active: true
    };
    this.error = '';
  }

  edit(r: Recipient) {
    this.editing = { ...r };
    this.error = '';
  }

  save() {
    if (!this.editing) return;
    this.error = '';
    const obs = this.editing._id
      ? this.api.updateRecipient(this.editing._id, this.editing)
      : this.api.createRecipient(this.editing);
    obs.subscribe({
      next: () => {
        this.editing = null;
        this.load();
      },
      error: (err) => (this.error = err.error?.error || err.message)
    });
  }

  del(r: Recipient) {
    if (!confirm(`Remove ${r.name}?`)) return;
    this.api.deleteRecipient(r._id!).subscribe(() => this.load());
  }

  test(r: Recipient) {
    this.api.testEmail(r._id!).subscribe({
      next: () => alert(`Test email sent to ${r.email}`),
      error: (err) => alert('Failed: ' + (err.error?.error || err.message))
    });
  }
}
