import { Component, OnInit, OnDestroy, DoCheck, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { ExportService } from '../export.service';
import { NewsArticle, RunLog } from '../models';

@Component({
  selector: 'app-runs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header-row" style="justify-content: flex-end;">
      <div class="header-actions" style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button class="btn-accent" (click)="triggerFetch()" [disabled]="busy || fetchRunning" [title]="fetchRunning ? 'A fetch + classify run is in progress' : ''">
          {{ fetchRunning ? 'Fetch running…' : 'Fetch + classify now' }}
        </button>
        <button class="pill-btn" (click)="exportDigestPdf()" [disabled]="busy || exportingPdf" title="Export Digest in PDF format">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          {{ exportingPdf ? 'Preparing PDF…' : 'Export Digest (PDF)' }}
        </button>
        <button (click)="triggerDigest()" [disabled]="busy || digestRunning" [title]="digestRunning ? 'A digest run is in progress' : ''">
          {{ digestRunning ? 'Digest running…' : 'Send digest now' }}
        </button>
      </div>
    </div>

    <div *ngIf="message" class="card" style="margin-top: 14px;" [ngClass]="messageIsError ? 'msg-error' : 'msg-ok'">
      {{ message }}
    </div>

    <div class="card" style="margin-top: 16px; padding: 0;">
      <div class="table-toolbar">
        <div class="pill-input-group">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z" />
          </svg>
          <input [(ngModel)]="search" placeholder="Search jobs..." />
        </div>
        <select class="pill-select" [(ngModel)]="selectedStatus">
          <option value="">All Status</option>
          <option *ngFor="let s of statuses" [value]="s">{{ s | titlecase }}</option>
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
              <th (click)="sortBy('job')">Job <span class="sort-icon">{{ sortCol === 'job' ? (sortDesc ? '↓' : '↑') : '↑↓' }}</span></th>
              <th (click)="sortBy('status')">Status <span class="sort-icon">{{ sortCol === 'status' ? (sortDesc ? '↓' : '↑') : '↑↓' }}</span></th>
              <th (click)="sortBy('startedAt')">Started <span class="sort-icon">{{ sortCol === 'startedAt' ? (sortDesc ? '↓' : '↑') : '↑↓' }}</span></th>
              <th (click)="sortBy('duration')">Duration <span class="sort-icon">{{ sortCol === 'duration' ? (sortDesc ? '↓' : '↑') : '↑↓' }}</span></th>
              <th (click)="sortBy('companiesProcessed')">Lenders <span class="sort-icon">{{ sortCol === 'companiesProcessed' ? (sortDesc ? '↓' : '↑') : '↑↓' }}</span></th>
              <th (click)="sortBy('articlesNew')">New <span class="sort-icon">{{ sortCol === 'articlesNew' ? (sortDesc ? '↓' : '↑') : '↑↓' }}</span></th>
              <th (click)="sortBy('articlesClassified')">Classified <span class="sort-icon">{{ sortCol === 'articlesClassified' ? (sortDesc ? '↓' : '↑') : '↑↓' }}</span></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of pagedRuns">
              <td style="font-weight: 500;">{{ r.job | titlecase }}</td>
              <td>
                <button *ngIf="r.status === 'failed'; else plainStatus" type="button" class="status-badge status-failed status-link"
                        (click)="errorRun = r" title="View error details">{{ r.status | titlecase }}</button>
                <ng-template #plainStatus>
                  <span class="status-badge" [ngClass]="'status-' + r.status">{{ r.status | titlecase }}</span>
                </ng-template>
              </td>
              <td style="color: #64748b;">{{ r.startedAt | date: 'short' }}</td>
              <td style="color: #64748b;">{{ duration(r) }}</td>
              <td>{{ r.stats.companiesProcessed || 0 }}</td>
              <td style="color: #10b981; font-weight: 600;">{{ r.stats.articlesNew || 0 }}</td>
              <td>{{ r.stats.articlesClassified || 0 }}</td>
            </tr>
            <tr *ngIf="!pagedRuns.length">
              <td colspan="7" style="text-align:center; padding: 30px; color: #94a3b8;">
                {{ search.trim() ? 'No jobs match your search.' : 'No runs yet.' }}
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
          <span style="margin-left: 8px;">Total {{ filteredRuns.length }} runs</span>
        </div>
        <div class="pagination-controls">
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button class="page-btn" [disabled]="currentPage === 1" (click)="currentPage = currentPage - 1">&lt; Prev</button>
          <button class="page-btn active">{{ currentPage }}</button>
          <button class="page-btn" [disabled]="currentPage === totalPages" (click)="currentPage = currentPage + 1">Next &gt;</button>
        </div>
      </div>
    </div>

    <div *ngIf="errorRun" class="logout-modal-backdrop" (click)="errorRun = null">
      <div class="logout-modal-card" role="dialog" aria-modal="true" aria-labelledby="run-error-title" (click)="$event.stopPropagation()">
        <h3 id="run-error-title" class="logout-modal-title">Run failed</h3>
        <p class="run-error-meta">{{ errorRun.job | titlecase }} · started {{ errorRun.startedAt | date: 'medium' }}</p>
        <div class="logout-modal-error run-error-text">{{ errorRun.error || 'No error details were recorded for this run.' }}</div>
        <div class="logout-modal-actions">
          <button type="button" class="btn-modal-cancel" (click)="errorRun = null">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      h1 { margin: 0 0 4px 0; font-size: 24px; }
      .status-success { background: #dcfce7; color: var(--low); }
      .status-partial { background: #fef9c3; color: var(--medium); }
      .status-failed { background: #fee2e2; color: var(--critical); }
      .status-running { background: #dbeafe; color: #1d4ed8; }
      .status-badge { font-weight: 500; font-size: 12px; padding: 2px 8px; border-radius: 12px; }
      .status-link {
        border: none; font-family: inherit; line-height: inherit; cursor: pointer;
        min-height: 0; height: auto; display: inline;
        text-decoration: underline; text-underline-offset: 2px;
      }
      .status-link:hover { background: #fecaca; }
      .run-error-meta { font-size: 13px; color: #64748b; margin: 0 0 14px 0; }
      .run-error-text { white-space: pre-wrap; word-break: break-word; font-size: 13px; }
      .msg-ok { background: #ecfdf5; border-color: #a7f3d0; }
      .msg-error { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
    `
  ]
})
export class RunsComponent implements OnInit, OnDestroy, DoCheck {
  private api = inject(ApiService);
  runs: RunLog[] = [];
  search = '';
  selectedStatus = '';
  busy = false;
  message = '';
  messageIsError = false;
  errorRun: RunLog | null = null;

  @HostListener('document:keydown.escape')
  closeErrorDialog() {
    this.errorRun = null;
  }
  private messageTimer?: ReturnType<typeof setTimeout>;
  private poll?: ReturnType<typeof setInterval>;

  sortCol = 'startedAt';
  sortDesc = true;
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
    return Math.ceil(this.filteredRuns.length / this.pageSize) || 1;
  }

  get pagedRuns(): RunLog[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRuns.slice(start, start + this.pageSize);
  }

  get statuses(): string[] {
    const s = new Set(this.runs.map(r => r.status).filter(Boolean));
    return Array.from(s).sort() as string[];
  }

  get filteredRuns(): RunLog[] {
    let res = [...this.runs];
    
    if (this.selectedStatus) {
      res = res.filter(r => r.status === this.selectedStatus);
    }
    
    const q = this.search.trim().toLowerCase();
    if (q) {
      res = res.filter(r => r.job.toLowerCase().includes(q) || r.status.toLowerCase().includes(q));
    }

    res.sort((a, b) => {
      let v1: any = a.startedAt;
      let v2: any = b.startedAt;
      
      if (this.sortCol === 'job') { v1 = a.job; v2 = b.job; }
      if (this.sortCol === 'status') { v1 = a.status; v2 = b.status; }
      if (this.sortCol === 'duration') {
        const ms1 = a.finishedAt ? new Date(a.finishedAt).getTime() - new Date(a.startedAt).getTime() : 0;
        const ms2 = b.finishedAt ? new Date(b.finishedAt).getTime() - new Date(b.startedAt).getTime() : 0;
        v1 = ms1; v2 = ms2;
      }
      if (this.sortCol === 'companiesProcessed') { v1 = a.stats.companiesProcessed || 0; v2 = b.stats.companiesProcessed || 0; }
      if (this.sortCol === 'articlesNew') { v1 = a.stats.articlesNew || 0; v2 = b.stats.articlesNew || 0; }
      if (this.sortCol === 'articlesClassified') { v1 = a.stats.articlesClassified || 0; v2 = b.stats.articlesClassified || 0; }
      
      if (typeof v1 === 'string') v1 = v1.toLowerCase();
      if (typeof v2 === 'string') v2 = v2.toLowerCase();
      
      if (v1 < v2) return this.sortDesc ? 1 : -1;
      if (v1 > v2) return this.sortDesc ? -1 : 1;
      return 0;
    });

    return res;
  }

  exportCsv() {
    const data = this.filteredRuns.map(r => ({
      Job: r.job,
      Status: r.status,
      StartedAt: r.startedAt,
      Duration: this.duration(r),
      Lenders: r.stats.companiesProcessed || 0,
      Fetched: r.stats.articlesFetched || 0,
      New: r.stats.articlesNew || 0,
      Classified: r.stats.articlesClassified || 0,
      Error: r.error || ''
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
    a.download = `runs_export_${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private exportService = inject(ExportService);

  exportingPdf = false;

  exportDigestPdf() {
    if (this.exportingPdf) return;
    this.exportingPdf = true;
    this.fetchAllNews([], (items) => {
      this.exportService.exportDigestToPdf(items)
        .catch((err) => {
          console.error('PDF export failed', err);
          alert('Failed to generate the PDF');
        })
        .finally(() => (this.exportingPdf = false));
    });
  }

  // The API caps a page at 200, so page through until every article is loaded.
  private fetchAllNews(acc: NewsArticle[], done: (items: NewsArticle[]) => void) {
    this.api.listNews({ limit: 200, skip: acc.length }).subscribe({
      next: (res) => {
        const page = res.items || [];
        const items = [...acc, ...page];
        if (page.length && items.length < res.total) {
          this.fetchAllNews(items, done);
        } else {
          done(items);
        }
      },
      error: () => {
        this.exportingPdf = false;
        alert('Failed to fetch articles for export');
      }
    });
  }

  ngOnInit() {
    this.load();
    this.poll = setInterval(() => this.load(), 10000);
  }

  ngDoCheck() {
    const total = this.totalPages;
    if (this.currentPage > total && total > 0) {
      this.currentPage = total;
    }
  }

  ngOnDestroy() {
    if (this.poll) clearInterval(this.poll);
    clearTimeout(this.messageTimer);
  }

  load() {
    this.api.listRuns().subscribe((r) => (this.runs = r));
  }

  // The server refuses overlapping runs; these mirror that so the buttons disable while one is active.
  get fetchRunning(): boolean {
    return this.runs.some((r) => r.status === 'running' && r.job !== 'digest');
  }

  get digestRunning(): boolean {
    return this.runs.some((r) => r.status === 'running' && r.job === 'digest');
  }

  triggerFetch() {
    this.busy = true;
    this.api.triggerFetch().subscribe({
      next: () => this.started('Fetch + classify started — refresh in a few seconds'),
      error: (err) => this.failed(err, 'Could not start fetch + classify')
    });
  }

  triggerDigest() {
    this.busy = true;
    this.api.triggerDigest().subscribe({
      next: () => this.started('Digest generation started'),
      error: (err) => this.failed(err, 'Could not start the digest')
    });
  }

  private started(text: string) {
    this.busy = false;
    this.showMessage(text, false);
    setTimeout(() => this.load(), 1500);
  }

  private failed(err: any, fallback: string) {
    this.busy = false;
    this.showMessage(err?.error?.error || fallback, true);
    this.load();
  }

  private showMessage(text: string, isError: boolean) {
    this.message = text;
    this.messageIsError = isError;
    clearTimeout(this.messageTimer);
    this.messageTimer = setTimeout(() => (this.message = ''), 8000);
  }

  duration(r: RunLog): string {
    if (!r.finishedAt) return r.status === 'running' ? 'running…' : '—';
    const ms = new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime();
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }
}
