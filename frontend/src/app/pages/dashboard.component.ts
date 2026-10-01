import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';
import { Company, NewsArticle, Stats } from '../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `


    <!-- Chocolate Banner matching the design image -->
    <div class="banner-chocolate" *ngIf="stats">
      <div class="banner-top-row">
        <h2 class="banner-title">{{ displayTitle }}</h2>

        <!-- Interactive Every Lender Dropdown -->
        <div class="banner-dropdown-wrap">
          <button type="button" 
                  class="banner-filter-pill" 
                  [class.active]="lenderDropdownOpen"
                  [class.filtered]="!!selectedCompany"
                  (click)="toggleLenderDropdown($event)"
                  aria-haspopup="listbox"
                  [attr.aria-expanded]="lenderDropdownOpen">
            <span class="pill-label">{{ selectedCompany ? selectedCompany.name : 'Every Lender' }}</span>
            <button *ngIf="selectedCompany" 
                    type="button" 
                    class="pill-clear-btn" 
                    (click)="clearSelectedCompany($event)" 
                    title="Reset to Every Lender">✕</button>
            <svg class="pill-chevron" [class.open]="lenderDropdownOpen" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          <!-- Dropdown Menu -->
          <div class="lender-dropdown-menu" 
               *ngIf="lenderDropdownOpen" 
               (click)="$event.stopPropagation()">
            <div class="lender-search-bar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" 
                     [(ngModel)]="lenderSearch" 
                     placeholder="Search lender..." 
                     (click)="$event.stopPropagation()" />
              <button *ngIf="lenderSearch" 
                      type="button" 
                      class="btn-clear-input" 
                      (click)="lenderSearch = ''">✕</button>
            </div>

            <div class="lender-dropdown-list" role="listbox">
              <!-- 'Every Lender' option to reset -->
              <div class="lender-dropdown-item" 
                   [class.selected]="!selectedCompany"
                   (click)="selectCompany(null)"
                   role="option"
                   [attr.aria-selected]="!selectedCompany">
                <div class="lender-item-left">
                  <span class="lender-item-name">Every Lender</span>
                  <span class="lender-item-badge">All</span>
                </div>
                <div class="lender-item-right">
                  <span class="lender-item-count">{{ totalArticlesCount }}</span>
                </div>
              </div>

              <div class="lender-dropdown-divider"></div>

              <!-- List of All Lenders -->
              <div *ngFor="let c of filteredCompanies" 
                   class="lender-dropdown-item" 
                   [class.selected]="selectedCompany?._id === c._id || selectedCompany?.name === c.name"
                   (click)="selectCompany(c)"
                   role="option"
                   [attr.aria-selected]="selectedCompany?._id === c._id || selectedCompany?.name === c.name">
                <div class="lender-item-left">
                  <span class="lender-item-name" [title]="c.name">{{ c.name }}</span>
                </div>
                <div class="lender-item-right">
                  <span class="lender-item-count" [class.zero]="getCompanyArticleCount(c) === 0">
                    {{ getCompanyArticleCount(c) }}
                  </span>
                </div>
              </div>

              <div *ngIf="filteredCompanies.length === 0" class="lender-no-results">
                No lenders match "{{ lenderSearch }}"
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="banner-cards-grid">
        <div class="dash-card hand-cursor" [routerLink]="getNewsLink({})">
          <div class="dash-card-header">
            <div class="dash-card-value">{{ displayTotal }}</div>
            <div class="card-icon icon-blue">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
          </div>
          <div class="dash-card-label">Total Articles</div>
          <div class="dash-card-sub">{{ selectedCompany ? selectedCompany.name : 'All Tracked Activity' }}</div>
        </div>

        <div class="dash-card hand-cursor" [routerLink]="getNewsLink({ impact: 'Critical' })">
          <div class="dash-card-header">
            <div class="dash-card-value" style="color: #ef4444;">{{ displayCritical }}</div>
            <div class="card-icon icon-red">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
          </div>
          <div class="dash-card-label">Critical Impact</div>
          <div class="dash-card-sub">Immediate Action</div>
        </div>

        <div class="dash-card hand-cursor" [routerLink]="getNewsLink({ impact: 'High' })">
          <div class="dash-card-header">
            <div class="dash-card-value" style="color: #f37819;">{{ displayHigh }}</div>
            <div class="card-icon icon-orange">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
          </div>
          <div class="dash-card-label">High Impact</div>
          <div class="dash-card-sub">Major Developments</div>
        </div>

        <div class="dash-card hand-cursor" routerLink="/companies">
          <div class="dash-card-header">
            <div class="dash-card-value">{{ displayLendersCount }}</div>
            <div class="card-icon icon-cyan">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
          </div>
          <div class="dash-card-label">{{ selectedCompany ? 'Selected Lender' : 'Lenders Tracked' }}</div>
          <div class="dash-card-sub">{{ displayLendersSub }}</div>
        </div>
      </div>
    </div>

    <!-- Chart Cards Section -->
    <div class="dash-grid-charts">
      
      <!-- 1. Top mentioned lenders (Span 2) -->
      <div class="dash-chart-card grid-span-2">
        <div class="dash-chart-header">
          <h3 class="dash-chart-title">Top mentioned lenders</h3>
          <div class="dash-chart-tabs">
            <button *ngIf="selectedCompany" class="tab-pill-active hand-cursor" (click)="selectCompany(null)" title="Reset to Every Lender">
              ✕ Reset
            </button>
            <button class="tab-pill-outline hand-cursor" routerLink="/companies">All Lenders</button>
          </div>
        </div>
        <div class="dash-lenders-list" style="max-height: 110px; display: grid; grid-template-columns: 1fr 1fr; gap: 0 20px;">
          <div *ngFor="let item of stats?.topCompanies" 
               class="dash-bar-row hand-cursor" 
               [class.active-lender-bar]="isSelectedLender(item._id)"
               (click)="onLenderRowClick(item._id)"
               [title]="'Filter dashboard by ' + item._id">
            <span class="company-name">{{ item._id }}</span>
            <div class="dash-bar-track blue-theme">
              <div class="dash-fill-blue" 
                   [class.active-fill]="isSelectedLender(item._id)"
                   [style.width.%]="barWidthTopCompany(item.count)"></div>
            </div>
            <span class="bar-count">{{ item.count }}</span>
          </div>
        </div>
      </div>

      <!-- 2. Impact distribution -->
      <div class="dash-chart-card">
        <div class="dash-chart-header">
          <h3 class="dash-chart-title">Impact distribution</h3>
          <div class="dash-chart-tabs">
            <button class="tab-pill-active">Articles</button>
            <button class="tab-pill-outline">Share %</button>
          </div>
        </div>

        <!-- SVG Graph for Impact Distribution (Compressed Height) -->
        <div class="dash-graph-container" *ngIf="stats" style="height: 120px;">
          <svg class="dash-svg-chart" viewBox="0 0 490 120" preserveAspectRatio="none" style="width: 100%; height: 100%; display: block;">
            <defs>
              <linearGradient id="barOrange" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#f37819" />
                <stop offset="100%" stop-color="#ea580c" />
              </linearGradient>
            </defs>

            <!-- Y Axis & Grid Lines -->
            <text x="32" y="12" class="chart-axis-label chart-axis-orange" text-anchor="middle">COUNT</text>
            <text x="460" y="12" class="chart-axis-label chart-axis-green" text-anchor="middle">SHARE</text>

            <line x1="45" y1="25" x2="445" y2="25" class="chart-grid-line" />
            <text x="38" y="28" text-anchor="end" fill="#94a3b8" font-size="9">Max</text>
            <text x="452" y="28" text-anchor="start" fill="#94a3b8" font-size="9">100%</text>

            <line x1="45" y1="50" x2="445" y2="50" class="chart-grid-line" />
            <text x="38" y="53" text-anchor="end" fill="#94a3b8" font-size="9">75%</text>
            <text x="452" y="53" text-anchor="start" fill="#94a3b8" font-size="9">75%</text>

            <line x1="45" y1="75" x2="445" y2="75" class="chart-grid-line" />
            <text x="38" y="78" text-anchor="end" fill="#94a3b8" font-size="9">50%</text>
            <text x="452" y="78" text-anchor="start" fill="#94a3b8" font-size="9">50%</text>

            <line x1="45" y1="100" x2="445" y2="100" stroke="#cbd5e1" stroke-width="1.5" />
            <text x="38" y="103" text-anchor="end" fill="#94a3b8" font-size="9">0</text>
            <text x="452" y="103" text-anchor="start" fill="#94a3b8" font-size="9">0%</text>

            <!-- Vertical Bars for Each Impact Level -->
            <g *ngFor="let d of getImpactChartData()">
              <rect
                [attr.x]="d.x"
                [attr.y]="d.y"
                width="44"
                [attr.height]="d.barH"
                rx="5"
                fill="url(#barOrange)"
                class="svg-bar hand-cursor"
                [routerLink]="getNewsLink({ impact: d.level })"
              />
              <text [attr.x]="d.x + 22" [attr.y]="d.y - 4" text-anchor="middle" fill="#ea580c" font-size="10" font-weight="800">
                {{ d.count }}
              </text>
              <text [attr.x]="d.x + 22" y="114" text-anchor="middle" fill="#334155" font-size="10.5" font-weight="700">
                {{ d.level }}
              </text>
            </g>

            <!-- Connecting Green Trendline & Nodes -->
            <polyline
              [attr.points]="getLinePoints()"
              fill="none"
              stroke="#10b981"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <g *ngFor="let d of getImpactChartData()">
              <circle [attr.cx]="d.x + 22" [attr.cy]="d.y" r="4" fill="#ffffff" stroke="#10b981" stroke-width="2.5" />
              <text [attr.x]="d.x + 22" [attr.y]="d.y - 16" text-anchor="middle" fill="#059669" font-size="9.5" font-weight="700">
                {{ d.percent }}%
              </text>
            </g>
          </svg>
        </div>

        <!-- Legend -->
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-swatch-orange"></span>
            <span>Articles Count</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot-green"></span>
            <span>Share %</span>
          </div>
        </div>
      </div>

      <!-- 3. Risk Types -->
      <div class="dash-chart-card">
        <div class="dash-chart-header">
          <h3 class="dash-chart-title">Risk Types</h3>
        </div>
        <div class="dash-graph-container" style="display: flex; align-items: center; justify-content: center; height: 120px;" *ngIf="stats">
          <svg viewBox="0 0 100 100" style="width: 120px; height: 120px;">
            <path *ngFor="let slice of getRiskPieChartData()"
                  class="hand-cursor"
                  [attr.d]="slice.path"
                  [attr.fill]="slice.color"
                  [title]="slice.id + ': ' + slice.percent + '%'"
                  [routerLink]="getNewsLink({ riskType: slice.id })"
                  style="transition: all 0.3s ease; stroke: #fff; stroke-width: 1px;">
            </path>
            <!-- Center circle for Donut effect -->
            <circle cx="50" cy="50" r="22" fill="#ffffff"></circle>
            <!-- Total count in center -->
            <text x="50" y="54" text-anchor="middle" font-size="14" font-weight="800" fill="#0f172a">{{ displayTotal }}</text>
          </svg>
          
          <div style="display: flex; flex-direction: column; justify-content: center; margin-left: 20px; gap: 4px; font-size: 11px; max-height: 130px; overflow-y: auto;">
            <div *ngFor="let slice of getRiskPieChartData()" 
                 class="hand-cursor" 
                 [routerLink]="getNewsLink({ riskType: slice.id })"
                 style="display: flex; align-items: center; gap: 6px; padding: 2px 0;">
              <span [style.background]="slice.color" style="width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
              <span style="font-weight: 500; color: #334155; text-transform: capitalize; width: 65px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" [title]="slice.id">{{ slice.id }}</span>
              <span style="font-weight: 700; color: #0f172a; margin-left: auto;">{{ slice.percent }}%</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [
    `
      .hand-cursor { cursor: pointer; }
    `
  ]
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  public authService = inject(AuthService);
  stats: Stats | null = null;
  companies: Company[] = [];
  allArticles: NewsArticle[] = [];
  selectedCompany: Company | null = null;
  lenderDropdownOpen = false;
  lenderSearch = '';
  topArticles: NewsArticle[] = [];
  userDropdownOpen = false;

  get userProfile() {
    return this.authService.getUserProfile();
  }

  get displayTitle(): string {
    return this.selectedCompany ? this.selectedCompany.name : 'Every Lender';
  }

  get totalArticlesCount(): number {
    return this.stats?.total || this.allArticles.length || 0;
  }

  get filteredArticles(): NewsArticle[] {
    if (!this.selectedCompany) return this.allArticles;
    return this.allArticles.filter((a) => this.matchesCompany(a, this.selectedCompany!));
  }

  get displayTotal(): number {
    if (this.selectedCompany) {
      return this.filteredArticles.length;
    }
    return this.stats?.total ?? this.allArticles.length ?? 0;
  }

  get displayCritical(): number {
    return this.displayImpactCount('Critical');
  }

  get displayHigh(): number {
    return this.displayImpactCount('High');
  }

  get displayLendersCount(): number {
    if (this.selectedCompany) return 1;
    const activeCompanies = new Set(this.allArticles.map(a => typeof a.company === 'object' ? a.company._id || a.company : a.company));
    return activeCompanies.size || 0;
  }

  get displayLendersSub(): string {
    if (this.selectedCompany) {
      return this.selectedCompany.sector || 'Selected Lender';
    }
    return 'Active Portfolios';
  }

  get filteredCompanies(): Company[] {
    let list = this.companies;
    if (this.lenderSearch.trim()) {
      const q = this.lenderSearch.toLowerCase().trim();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        (c.aliases && c.aliases.some((a) => a.toLowerCase().includes(q)))
      );
    }
    return [...list].sort((a, b) => {
      const countA = this.getCompanyArticleCount(a);
      const countB = this.getCompanyArticleCount(b);
      if (countB !== countA) return countB - countA;
      return a.name.localeCompare(b.name);
    });
  }

  toggleUserDropdown(event: Event) {
    event.stopPropagation();
    this.userDropdownOpen = !this.userDropdownOpen;
    if (this.userDropdownOpen) {
      this.lenderDropdownOpen = false;
    }
  }

  closeUserDropdown() {
    this.userDropdownOpen = false;
  }

  logout(event: Event) {
    event.stopPropagation();
    this.userDropdownOpen = false;
    this.authService.logout();
  }

  toggleLenderDropdown(event: Event) {
    event.stopPropagation();
    this.lenderDropdownOpen = !this.lenderDropdownOpen;
    if (this.lenderDropdownOpen) {
      this.userDropdownOpen = false;
      this.lenderSearch = '';
    }
  }

  selectCompany(c: Company | null) {
    this.selectedCompany = c;
    this.lenderDropdownOpen = false;
    this.lenderSearch = '';
  }

  clearSelectedCompany(event: Event) {
    event.stopPropagation();
    this.selectedCompany = null;
  }

  isSelectedLender(companyName: string): boolean {
    if (!this.selectedCompany) return false;
    return this.selectedCompany.name.toLowerCase().trim() === companyName.toLowerCase().trim();
  }

  onLenderRowClick(companyName: string) {
    if (this.isSelectedLender(companyName)) {
      this.selectedCompany = null;
    } else {
      const found = this.companies.find((c) => c.name.toLowerCase().trim() === companyName.toLowerCase().trim()) || {
        name: companyName
      };
      this.selectedCompany = found;
    }
  }

  getNewsLink(params: Record<string, string>): any[] {
    const p: Record<string, string> = { ...params };
    if (this.selectedCompany) {
      p['company'] = this.selectedCompany.name;
    }
    return Object.keys(p).length ? ['/news', p] : ['/news'];
  }

  matchesCompany(article: NewsArticle, company: Company): boolean {
    if (!company) return true;
    const companyId = company._id;
    const companyName = company.name?.toLowerCase().trim();

    if (article.company) {
      if (typeof article.company === 'string' && companyId && article.company === companyId) {
        return true;
      }
      if (typeof article.company === 'object' && companyId && (article.company as Company)._id === companyId) {
        return true;
      }
    }
    if (article.companyName && companyName) {
      const artCompName = article.companyName.toLowerCase().trim();
      if (artCompName === companyName) {
        return true;
      }
      if (company.aliases && company.aliases.some((alias) => alias.toLowerCase().trim() === artCompName)) {
        return true;
      }
    }
    return false;
  }

  getArticleImpact(a: NewsArticle): string {
    const eff = (a as any).effectiveClassification || {};
    const c = a.classification || eff || {};
    const u = a.userOverride;
    if (u && u.overriddenAt && u.impactLevel) {
      return u.impactLevel;
    }
    return c.impactLevel || eff.impactLevel || 'Low';
  }

  getCompanyArticleCount(c: Company): number {
    if (this.allArticles.length) {
      return this.allArticles.filter((a) => this.matchesCompany(a, c)).length;
    }
    const item = this.stats?.topCompanies?.find((tc) =>
      tc._id.toLowerCase() === c.name.toLowerCase() || tc.name?.toLowerCase() === c.name.toLowerCase()
    );
    return item ? item.count : 0;
  }

  @HostListener('document:click')
  onDocumentClick() {
    if (this.userDropdownOpen) {
      this.userDropdownOpen = false;
    }
    if (this.lenderDropdownOpen) {
      this.lenderDropdownOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.userDropdownOpen) {
      this.userDropdownOpen = false;
    }
    if (this.lenderDropdownOpen) {
      this.lenderDropdownOpen = false;
    }
  }

  ngOnInit() {
    this.api.newsStats().subscribe((s) => (this.stats = s));
    this.api.listCompanies().subscribe((comps) => {
      this.companies = (comps || []).sort((a, b) => a.name.localeCompare(b.name));
    });
    this.api.listNews({ limit: '200' }).subscribe((r) => {
      this.allArticles = r.items || [];
    });
    this.api.listNews({ impactLevel: 'High', limit: '5' }).subscribe((r) => {
      this.topArticles = r.items;
      if (this.topArticles.length < 5) {
        this.api.listNews({ impactLevel: 'Critical', limit: '5' }).subscribe((rc) => {
          this.topArticles = [...rc.items, ...this.topArticles].slice(0, 5);
        });
      }
    });
  }

  getCount(level: string): number {
    if (!this.stats) return 0;
    const m = this.stats.byImpact.find((b) => b._id === level);
    return m ? m.count : 0;
  }

  displayImpactCount(level: string): number {
    if (this.selectedCompany) {
      return this.filteredArticles.filter((a) => this.getArticleImpact(a) === level).length;
    }
    return this.getCount(level);
  }

  barWidth(count: number): number {
    if (!this.stats || !this.stats.total) return 0;
    const max = Math.max(...this.stats.byImpact.map((b) => b.count), 1);
    return (count / max) * 100;
  }

  barWidthTopCompany(count: number): number {
    if (!this.stats || !this.stats.topCompanies.length) return 0;
    const max = Math.max(...this.stats.topCompanies.map((b) => b.count), 1);
    return (count / max) * 100;
  }

  getImpactChartData() {
    if (!this.stats && !this.allArticles.length) return [];
    const levels = ['Low', 'Medium', 'High', 'Critical'];
    const counts = levels.map((lvl) => this.displayImpactCount(lvl));
    const maxVal = Math.max(...counts, 1);
    const total = this.displayTotal || 1;

    return levels.map((lvl, i) => {
      const count = counts[i];
      const percent = this.displayTotal > 0 ? Math.round((count / total) * 100) : 0;
      const barH = count > 0 ? Math.max(Math.round((count / maxVal) * 70), 8) : 4;
      const x = 70 + i * 105;
      const y = 100 - barH;
      return {
        level: lvl,
        count,
        percent,
        x,
        y,
        barH
      };
    });
  }

  getLinePoints(): string {
    const data = this.getImpactChartData();
    if (!data.length) return '';
    return data.map((d) => `${d.x + 22},${d.y}`).join(' ');
  }

  getRiskPieChartData() {
    let data = [];
    if (this.selectedCompany) {
       const counts: Record<string, number> = {};
       this.filteredArticles.forEach(a => {
         const type = a.userOverride?.riskType || a.classification?.riskType || 'none';
         counts[type] = (counts[type] || 0) + 1;
       });
       data = Object.keys(counts).map(k => ({ _id: k, count: counts[k] }));
    } else {
       data = this.stats?.byRisk || [];
    }

    if (!data.length) return [];
    
    // sort by count descending
    data = data.slice().sort((a,b) => b.count - a.count);

    const total = data.reduce((sum, d) => sum + d.count, 0) || 1;
    let startAngle = -90;
    // Premium color palette for risks
    const colors = ['#f37819', '#2563eb', '#10b981', '#8b5cf6', '#ef4444', '#ec4899', '#64748b'];
    
    return data.map((d, i) => {
      const sliceAngle = (d.count / total) * 360;
      const endAngle = startAngle + sliceAngle;
      
      const x1 = 50 + 40 * Math.cos(Math.PI * startAngle / 180);
      const y1 = 50 + 40 * Math.sin(Math.PI * startAngle / 180);
      const x2 = 50 + 40 * Math.cos(Math.PI * endAngle / 180);
      const y2 = 50 + 40 * Math.sin(Math.PI * endAngle / 180);
      
      const largeArc = sliceAngle > 180 ? 1 : 0;
      
      let pathData = '';
      if (sliceAngle === 360) {
        pathData = `M 50, 10 A 40,40 0 1,1 49.9,10 Z`;
      } else {
        pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
      }
      
      startAngle = endAngle;
      
      return {
        id: d._id || 'none',
        count: d.count,
        percent: Math.round((d.count / total) * 100),
        color: colors[i % colors.length],
        path: pathData
      };
    });
  }
}
