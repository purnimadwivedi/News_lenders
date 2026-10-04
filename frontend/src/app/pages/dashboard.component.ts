import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { TranslatePipe, translate } from '../i18n';
import { AuthService } from '../auth.service';
import { Company, NewsArticle, Stats, DashboardPeriod, DashboardFilter, DashboardResponse } from '../models';
import { AppearanceService, CarouselSlide } from '../appearance-studio';
import { getDateRange } from '../utils/date-period.util';
import { Subject, of } from 'rxjs';
import { switchMap, catchError, takeUntil, distinctUntilChanged, tap } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslatePipe],
  template: `
    <!-- Announcement Carousel (Configured via Appearance Studio Carousel Tab) -->
    <div class="dash-carousel-wrap" 
         *ngIf="appearanceService.carousel.enabled && activeSlides.length > 0 && currentSlide">
      <div class="carousel-slide-item" 
           [style.background]="currentSlide.bgGradient">
        <div class="carousel-slide-content">
          <div class="carousel-slide-top">
            <span class="carousel-badge">{{ currentSlide.badge }}</span>
            <div class="carousel-nav-arrows" *ngIf="activeSlides.length > 1">
              <button type="button" class="carousel-nav-btn" (click)="prevSlide()" aria-label="Previous slide">‹</button>
              <button type="button" class="carousel-nav-btn" (click)="nextSlide()" aria-label="Next slide">›</button>
            </div>
          </div>
          <h3 class="carousel-slide-title">{{ currentSlide.title }}</h3>
          <p class="carousel-slide-subtitle">{{ currentSlide.description }}</p>
          <a *ngIf="currentSlide.buttonUrl && currentSlide.buttonText" 
             [href]="currentSlide.buttonUrl" 
             class="carousel-slide-cta" 
             target="_blank" 
             rel="noopener noreferrer">
            {{ currentSlide.buttonText }} ↗
          </a>
        </div>
        
        <div class="carousel-dots" *ngIf="activeSlides.length > 1">
          <span *ngFor="let s of activeSlides; let i = index" 
                class="carousel-dot" 
                [class.active]="i === (currentSlideIndex % activeSlides.length)"
                (click)="setSlide(i)">
          </span>
        </div>
      </div>
    </div>

    <!-- Chocolate Banner matching the design image -->
    <div class="banner-chocolate">
      <div class="banner-top-row">
        <h2 class="banner-title">{{ displayTitle }}</h2>

        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <!-- Time-Specific Period Toggle (MTD / QTD / CFY) -->
          <div class="period-toggle-group" role="group" aria-label="Time period selector">
            <button type="button" 
                    class="period-toggle-btn" 
                    [class.active]="selectedPeriod === 'MTD'" 
                    (click)="setPeriod('MTD')"
                    [disabled]="loading"
                    title="Month to Date">
              MTD
            </button>
            <button type="button" 
                    class="period-toggle-btn" 
                    [class.active]="selectedPeriod === 'QTD'" 
                    (click)="setPeriod('QTD')"
                    [disabled]="loading"
                    title="Quarter to Date">
              QTD
            </button>
            <button type="button" 
                    class="period-toggle-btn" 
                    [class.active]="selectedPeriod === 'CFY'" 
                    (click)="setPeriod('CFY')"
                    [disabled]="loading"
                    title="Current Financial Year">
              CFY
            </button>
          </div>

          <!-- Interactive Every Lender Dropdown -->
          <div class="banner-dropdown-wrap">
            <button type="button" 
                    class="banner-filter-pill" 
                    [class.active]="lenderDropdownOpen"
                    [class.filtered]="!!selectedCompany"
                    (click)="toggleLenderDropdown($event)"
                    aria-haspopup="listbox"
                    [attr.aria-expanded]="lenderDropdownOpen">
              <span class="pill-label">{{ selectedCompany ? selectedCompany.name : ('everyLender' | t) }}</span>
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
                     [placeholder]="'searchLender' | t" 
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
                  <span class="lender-item-name">{{ 'everyLender' | t }}</span>
                  <span class="lender-item-badge">{{ 'all' | t }}</span>
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
      </div>

      <!-- Loading and Error Indicators -->
      <div *ngIf="loading" class="banner-loading-bar" aria-label="Loading data">
        <div class="loading-progress-indeterminate"></div>
      </div>

      <div *ngIf="error" class="banner-error-banner" role="alert">
        <span class="error-msg">⚠️ {{ error }}</span>
        <button type="button" class="error-retry-btn" (click)="retryLoad()">Retry</button>
      </div>

      <div class="banner-cards-grid" [class.data-loading]="loading">
        <div class="dash-card hand-cursor" [routerLink]="getNewsLink({})">
          <div class="dash-card-header">
            <div class="dash-card-value">{{ displayTotal }}</div>
            <div class="card-icon icon-blue">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
          </div>
          <div class="dash-card-label">{{ 'totalArticles' | t }}</div>
          <div class="dash-card-sub">{{ selectedCompany ? selectedCompany.name : ('allActivity' | t) }}</div>
        </div>

        <div class="dash-card hand-cursor" [routerLink]="getNewsLink({ impact: 'Critical' })">
          <div class="dash-card-header">
            <div class="dash-card-value" style="color: #ea580c;">{{ displayImpactCount('Critical') }}</div>
            <div class="card-icon icon-orange">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
          </div>
          <div class="dash-card-label">{{ 'critical' | t }}</div>
        </div>

        <div class="dash-card hand-cursor" [routerLink]="getNewsLink({ impact: 'High' })">
          <div class="dash-card-header">
            <div class="dash-card-value" style="color: #ea580c;">{{ displayImpactCount('High') }}</div>
            <div class="card-icon icon-orange">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
            </div>
          </div>
          <div class="dash-card-label">{{ 'high' | t }}</div>
        </div>

        <div class="dash-card hand-cursor" [routerLink]="getNewsLink({ impact: 'Medium' })">
          <div class="dash-card-header">
            <div class="dash-card-value" style="color: #ea580c;">{{ displayImpactCount('Medium') }}</div>
            <div class="card-icon icon-orange">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
            </div>
          </div>
          <div class="dash-card-label">{{ 'medium' | t }}</div>
        </div>

        <div class="dash-card hand-cursor" [routerLink]="getNewsLink({ impact: 'Low' })">
          <div class="dash-card-header">
            <div class="dash-card-value" style="color: #ea580c;">{{ displayImpactCount('Low') }}</div>
            <div class="card-icon icon-orange">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
            </div>
          </div>
          <div class="dash-card-label">{{ 'low' | t }}</div>
        </div>

        <div class="dash-card hand-cursor" routerLink="/companies">
          <div class="dash-card-header">
            <div class="dash-card-value">{{ displayLendersCount }}</div>
            <div class="card-icon icon-cyan">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
          </div>
          <div class="dash-card-label">{{ (selectedCompany ? 'selectedLender' : 'lendersTracked') | t }}</div>
          <div class="dash-card-sub">{{ displayLendersSub }}</div>
        </div>
      </div>
    </div>

    <!-- Chart Cards Section -->
    <div class="dash-grid-charts" [class.data-loading]="loading">
      <!-- Categories (formerly Risk Types) -->
      <div class="dash-chart-card">
        <div class="dash-chart-header">
          <h3 class="dash-chart-title">{{ 'categories' | t }}</h3>
          <div class="dash-chart-tabs">
            <button class="tab-pill-active">{{ 'articles' | t }}</button>
          </div>
        </div>

        <div class="dash-graph-container" style="height: 120px;">
          <svg class="dash-svg-chart" viewBox="0 0 490 120" preserveAspectRatio="none" style="width: 100%; height: 100%; display: block;">
            <defs>
              <clipPath *ngFor="let d of getRiskChartData(); let idx = index" [attr.id]="'cat-bar-clip-' + idx">
                <rect [attr.x]="d.x" [attr.y]="d.y" width="40" [attr.height]="d.barH" rx="4" />
              </clipPath>
            </defs>

            <!-- Y Axis & Grid Lines -->
            <text x="32" y="12" class="chart-axis-label chart-axis-orange" text-anchor="middle" fill="#f37819" font-size="9" font-weight="700" letter-spacing="0.5">{{ 'count' | t }}</text>

            <ng-container *ngFor="let tick of riskAxis.ticks">
              <text x="38" [attr.y]="100 - (tick / riskAxis.niceMax) * 75 + 3" text-anchor="end" fill="#94a3b8" font-size="9">{{ tick }}</text>
              <line *ngIf="tick > 0"
                    x1="45" [attr.y1]="100 - (tick / riskAxis.niceMax) * 75"
                    x2="480" [attr.y2]="100 - (tick / riskAxis.niceMax) * 75"
                    stroke="#e2e8f0" stroke-dasharray="3,3" stroke-width="1" />
              <line *ngIf="tick === 0"
                    x1="45" y1="100"
                    x2="480" y2="100"
                    stroke="#cbd5e1" stroke-width="1.2" />
            </ng-container>

            <!-- Stacked Bars for Each Category: Critical, High, Medium, Low -->
            <g *ngFor="let d of getRiskChartData(); let idx = index">
              <!-- Rounded Clip Container for Stacked Segments -->
              <g [attr.clip-path]="'url(#cat-bar-clip-' + idx + ')'">
                <!-- Critical Segment (Red) -->
                <rect *ngIf="d.seg.hCrit > 0"
                      [attr.x]="d.x"
                      [attr.y]="d.seg.yCrit"
                      width="40"
                      [attr.height]="d.seg.hCrit"
                      fill="#ef4444"
                      class="svg-bar hand-cursor"
                      [routerLink]="getNewsLink({ riskType: d.id, impact: 'Critical' })">
                  <title>{{ d.id }} - Critical: {{ d.critical }}</title>
                </rect>

                <!-- High Segment (Orange) -->
                <rect *ngIf="d.seg.hHigh > 0"
                      [attr.x]="d.x"
                      [attr.y]="d.seg.yHigh"
                      width="40"
                      [attr.height]="d.seg.hHigh"
                      fill="#ea580c"
                      class="svg-bar hand-cursor"
                      [routerLink]="getNewsLink({ riskType: d.id, impact: 'High' })">
                  <title>{{ d.id }} - High: {{ d.high }}</title>
                </rect>

                <!-- Medium Segment (Amber) -->
                <rect *ngIf="d.seg.hMed > 0"
                      [attr.x]="d.x"
                      [attr.y]="d.seg.yMed"
                      width="40"
                      [attr.height]="d.seg.hMed"
                      fill="#f59e0b"
                      class="svg-bar hand-cursor"
                      [routerLink]="getNewsLink({ riskType: d.id, impact: 'Medium' })">
                  <title>{{ d.id }} - Medium: {{ d.medium }}</title>
                </rect>

                <!-- Low Segment (Green) -->
                <rect *ngIf="d.seg.hLow > 0"
                      [attr.x]="d.x"
                      [attr.y]="d.seg.yLow"
                      width="40"
                      [attr.height]="d.seg.hLow"
                      fill="#10b981"
                      class="svg-bar hand-cursor"
                      [routerLink]="getNewsLink({ riskType: d.id, impact: 'Low' })">
                  <title>{{ d.id }} - Low: {{ d.low }}</title>
                </rect>
              </g>

              <!-- Category Total Count Value on Top -->
              <text [attr.x]="d.x + 20"
                    [attr.y]="d.y - 4"
                    text-anchor="middle"
                    fill="#1e293b"
                    font-size="10"
                    font-weight="800"
                    class="hand-cursor"
                    [routerLink]="getNewsLink({ riskType: d.id })"
                    [title]="d.id + ': ' + d.count + ' total articles'">
                {{ d.count }}
              </text>

              <!-- Category Label Below Baseline -->
              <text [attr.x]="d.x + 20"
                    y="114"
                    text-anchor="middle"
                    fill="#334155"
                    font-size="10.5"
                    font-weight="700"
                    style="text-transform: capitalize;"
                    class="hand-cursor"
                    [routerLink]="getNewsLink({ riskType: d.id })"
                    [title]="'Filter by ' + d.id">
                {{ d.id }}
              </text>
            </g>

            <text *ngIf="getRiskChartData().length === 0" x="245" y="65" text-anchor="middle" fill="#94a3b8" font-size="12">
              No categories found for this period
            </text>
          </svg>
        </div>

        <!-- Legend: Low, Medium, High, Critical -->
        <div class="chart-legend" style="gap: 16px; margin-top: 8px;">
          <div class="legend-item hand-cursor" [routerLink]="getNewsLink({ impact: 'Critical' })" title="Filter Critical articles">
            <span class="legend-swatch" style="background: #ef4444;"></span>
            <span>{{ 'critical' | t }}</span>
          </div>
          <div class="legend-item hand-cursor" [routerLink]="getNewsLink({ impact: 'High' })" title="Filter High articles">
            <span class="legend-swatch" style="background: #ea580c;"></span>
            <span>{{ 'high' | t }}</span>
          </div>
          <div class="legend-item hand-cursor" [routerLink]="getNewsLink({ impact: 'Medium' })" title="Filter Medium articles">
            <span class="legend-swatch" style="background: #f59e0b;"></span>
            <span>{{ 'medium' | t }}</span>
          </div>
          <div class="legend-item hand-cursor" [routerLink]="getNewsLink({ impact: 'Low' })" title="Filter Low articles">
            <span class="legend-swatch" style="background: #10b981;"></span>
            <span>{{ 'low' | t }}</span>
          </div>
        </div>
      </div>

      <!-- Top mentioned lenders -->
      <div class="dash-chart-card">
        <div class="dash-chart-header" style="justify-content: center; position: relative;">
          <h3 class="dash-chart-title">{{ 'topMentioned' | t }}</h3>
          <div class="dash-chart-tabs" style="position: absolute; right: 0;">
            <button *ngIf="selectedCompany" class="tab-pill-active hand-cursor" (click)="selectCompany(null)" title="Reset to Every Lender">
              ✕ {{ 'reset' | t }}
            </button>
            <button class="tab-pill-outline hand-cursor" routerLink="/companies">{{ 'allLenders' | t }}</button>
          </div>
        </div>
        <div class="dash-lenders-list" style="display: grid; grid-template-columns: 1fr; gap: 4px 20px;">
          <div *ngFor="let item of displayTopCompanies" 
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
          <div *ngIf="displayTopCompanies.length === 0" class="lender-no-results">
            {{ 'noMentions' | t }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
      }
      .hand-cursor { cursor: pointer; }
      .period-toggle-group {
        display: inline-flex;
        align-items: center;
        background: rgba(0, 0, 0, 0.28);
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 20px;
        padding: 3px;
        gap: 3px;
      }
      .period-toggle-btn {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.85);
        font-size: 11.5px;
        font-weight: 600;
        padding: 3px 12px;
        border-radius: 14px;
        cursor: pointer;
        transition: all 0.15s ease-in-out;
        white-space: nowrap;
      }
      .period-toggle-btn:hover:not(:disabled) {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.15);
      }
      .period-toggle-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .period-toggle-btn.active {
        background: #ffffff;
        color: #633414;
        font-weight: 800;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
      }
      .banner-loading-bar {
        height: 3px;
        width: 100%;
        background: rgba(255, 255, 255, 0.2);
        overflow: hidden;
        border-radius: 2px;
        margin: 6px 0 2px 0;
      }
      .loading-progress-indeterminate {
        width: 40%;
        height: 100%;
        background: #ffffff;
        animation: progress-slide 1.2s infinite ease-in-out;
      }
      @keyframes progress-slide {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(350%); }
      }
      .banner-error-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(239, 68, 68, 0.9);
        color: #ffffff;
        padding: 6px 14px;
        border-radius: 6px;
        font-size: 12px;
        margin-top: 8px;
      }
      .error-retry-btn {
        background: #ffffff;
        color: #b91c1c;
        border: none;
        border-radius: 4px;
        padding: 2px 10px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
      }
      .data-loading {
        opacity: 0.75;
        transition: opacity 0.2s ease-in-out;
      }
    `
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  public authService = inject(AuthService);
  public appearanceService = inject(AppearanceService);

  selectedPeriod: DashboardPeriod = 'CFY';
  selectedLender = 'ALL';
  selectedCompany: Company | null = null;
  dashboardData: DashboardResponse | null = null;
  loading = false;
  error: string | null = null;

  stats: Stats | null = null;
  companies: Company[] = [];
  allArticles: NewsArticle[] = [];
  lenderDropdownOpen = false;
  lenderSearch = '';
  topArticles: NewsArticle[] = [];
  userDropdownOpen = false;

  currentSlideIndex = 0;
  private carouselTimer: any = null;
  private filterSubject$ = new Subject<DashboardFilter>();
  private destroy$ = new Subject<void>();

  get activeSlides(): CarouselSlide[] {
    const slides = this.appearanceService.carousel?.slides || [];
    return slides.filter((s) => s.active !== false);
  }

  get currentSlide(): CarouselSlide | null {
    const active = this.activeSlides;
    if (!active.length) return null;
    return active[this.currentSlideIndex % active.length];
  }

  get userProfile() {
    return this.authService.getUserProfile();
  }

  get displayTitle(): string {
    return this.selectedCompany ? this.selectedCompany.name : translate(this.appearanceService.state.display.language, 'everyLender');
  }

  get displayTotal(): number {
    return this.dashboardData?.summary?.totalArticles ?? this.stats?.total ?? this.filteredArticles.length;
  }

  get displayCritical(): number {
    return this.displayImpactCount('Critical');
  }

  get displayHigh(): number {
    return this.displayImpactCount('High');
  }

  get displayLendersCount(): number {
    if (this.selectedCompany) return 1;
    return this.dashboardData?.summary?.lendersTracked ?? (this.companies.filter((c) => c.active).length || 0);
  }

  get displayLendersSub(): string {
    if (this.selectedCompany) {
      return this.selectedCompany.sector || 'Selected Lender';
    }
    return translate(this.appearanceService.state.display.language, 'activePortfolios');
  }

  get periodArticles(): NewsArticle[] {
    const range = getDateRange(this.selectedPeriod);
    const startDate = new Date(range.startDate);
    const filtered = this.allArticles.filter((a) => {
      if (!a.publishedAt) return true;
      return new Date(a.publishedAt) >= startDate;
    });
    return filtered.length > 0 ? filtered : this.allArticles;
  }

  get filteredArticles(): NewsArticle[] {
    const base = this.periodArticles;
    if (!this.selectedCompany) return base;
    return base.filter((a) => this.matchesCompany(a, this.selectedCompany!));
  }

  get totalArticlesCount(): number {
    return this.dashboardData?.summary?.totalArticles ?? this.periodArticles.length;
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

  ngOnInit() {
    this.setupDashboardFilterStream();

    // Load lender list for dropdown
    this.api.listCompanies().subscribe((comps) => {
      this.companies = (comps || []).sort((a, b) => a.name.localeCompare(b.name));
    });

    // Optional background articles for extra details
    this.api.listNews({ limit: '200' }).subscribe({
      next: (r) => (this.allArticles = r.items || []),
      error: () => { }
    });

    this.api.listNews({ impactLevel: 'High', limit: '5' }).subscribe({
      next: (r) => {
        this.topArticles = r.items;
        if (this.topArticles.length < 5) {
          this.api.listNews({ impactLevel: 'Critical', limit: '5' }).subscribe((rc) => {
            this.topArticles = [...rc.items, ...this.topArticles].slice(0, 5);
          });
        }
      },
      error: () => { }
    });

    this.startCarouselTimer();

    // Initial load: CFY, Every Lender
    this.selectedPeriod = 'CFY';
    this.selectedCompany = null;
    this.selectedLender = 'ALL';
    this.triggerDashboardLoad();
  }

  ngOnDestroy() {
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupDashboardFilterStream() {
    this.filterSubject$.pipe(
      distinctUntilChanged((prev, curr) =>
        prev.period === curr.period &&
        prev.startDate === curr.startDate &&
        prev.endDate === curr.endDate &&
        prev.lenderId === curr.lenderId
      ),
      tap(() => {
        this.loading = true;
        this.error = null;
      }),
      switchMap((filter) => {
        return this.api.getDashboardData(filter).pipe(
          catchError((err) => {
            this.error = err?.error?.error || err?.message || 'Failed to load dashboard data. Please try again.';
            this.loading = false;
            return of(null);
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe((res) => {
      this.loading = false;
      if (res) {
        this.dashboardData = res;
        this.stats = {
          window: res.period,
          total: res.summary.totalArticles,
          byImpact: res.byImpact || [
            { _id: 'Critical', count: res.summary.critical },
            { _id: 'High', count: res.summary.high },
            { _id: 'Medium', count: res.summary.medium },
            { _id: 'Low', count: res.summary.low }
          ],
          byRisk: res.byRisk || (res.categories || []).map((c) => ({ _id: c.category, count: c.count })),
          topCompanies: res.topCompanies || (res.topMentionedLenders || []).map((l) => ({
            _id: l.lenderName || l.name || l.lenderId,
            name: l.lenderName || l.name || l.lenderId,
            count: l.count
          }))
        };
      }
    });
  }

  triggerDashboardLoad() {
    const range = getDateRange(this.selectedPeriod);
    const lenderId = this.selectedCompany ? (this.selectedCompany._id || this.selectedCompany.name) : 'ALL';
    this.selectedLender = lenderId;
    this.filterSubject$.next({
      period: this.selectedPeriod,
      startDate: range.startDate,
      endDate: range.endDate,
      lenderId
    });
  }

  retryLoad() {
    this.error = null;
    const range = getDateRange(this.selectedPeriod);
    const lenderId = this.selectedCompany ? (this.selectedCompany._id || this.selectedCompany.name) : 'ALL';
    this.loading = true;
    this.api.getDashboardData({
      period: this.selectedPeriod,
      startDate: range.startDate,
      endDate: range.endDate,
      lenderId
    }).pipe(
      catchError((err) => {
        this.error = err?.error?.error || err?.message || 'Failed to load dashboard data. Please try again.';
        this.loading = false;
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe((res) => {
      this.loading = false;
      if (res) {
        this.dashboardData = res;
        this.stats = {
          window: res.period,
          total: res.summary.totalArticles,
          byImpact: res.byImpact || [],
          byRisk: res.byRisk || [],
          topCompanies: res.topCompanies || []
        };
      }
    });
  }

  setPeriod(p: DashboardPeriod) {
    if (this.selectedPeriod === p && this.dashboardData) return;
    this.selectedPeriod = p;
    this.triggerDashboardLoad();
  }

  selectCompany(c: Company | null) {
    this.selectedCompany = c;
    this.selectedLender = c ? (c._id || c.name) : 'ALL';
    this.lenderDropdownOpen = false;
    this.lenderSearch = '';
    this.triggerDashboardLoad();
  }

  clearSelectedCompany(event: Event) {
    event.stopPropagation();
    this.selectCompany(null);
  }

  onLenderRowClick(companyName: string) {
    if (this.isSelectedLender(companyName)) {
      this.selectCompany(null);
    } else {
      const found = this.companies.find((c) => c.name.toLowerCase().trim() === companyName.toLowerCase().trim()) || {
        name: companyName
      };
      this.selectCompany(found);
    }
  }

  isSelectedLender(companyName: string): boolean {
    if (!this.selectedCompany) return false;
    return this.selectedCompany.name.toLowerCase().trim() === companyName.toLowerCase().trim();
  }

  toggleLenderDropdown(event: Event) {
    event.stopPropagation();
    this.lenderDropdownOpen = !this.lenderDropdownOpen;
    if (this.lenderDropdownOpen) {
      this.userDropdownOpen = false;
      this.lenderSearch = '';
    }
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

  startCarouselTimer() {
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer);
    }
    const cfg = this.appearanceService.carousel;
    if (cfg && cfg.enabled && this.activeSlides.length > 1) {
      const delay = Math.max(3, cfg.intervalSeconds || 5) * 1000;
      this.carouselTimer = setInterval(() => {
        this.nextSlide();
      }, delay);
    }
  }

  nextSlide() {
    const total = this.activeSlides.length;
    if (!total) return;
    this.currentSlideIndex = (this.currentSlideIndex + 1) % total;
  }

  prevSlide() {
    const total = this.activeSlides.length;
    if (!total) return;
    this.currentSlideIndex = (this.currentSlideIndex - 1 + total) % total;
  }

  setSlide(idx: number) {
    this.currentSlideIndex = idx;
    this.startCarouselTimer();
  }

  getCount(level: string): number {
    return this.displayImpactCount(level);
  }

  displayImpactCount(level: string): number {
    if (this.dashboardData?.summary) {
      const s = this.dashboardData.summary;
      switch (level.toLowerCase()) {
        case 'critical': return s.critical;
        case 'high': return s.high;
        case 'medium': return s.medium;
        case 'low': return s.low;
        default: return 0;
      }
    }
    const found = this.stats?.byImpact?.find((i) => i._id.toLowerCase() === level.toLowerCase());
    if (found) return found.count;
    return this.filteredArticles.filter((a) => this.getArticleImpact(a).toLowerCase() === level.toLowerCase()).length;
  }

  displayRiskCount(typeId: string): number {
    if (this.dashboardData?.categories?.length) {
      const found = this.dashboardData.categories.find(
        (c) => (c.category || c._id || '').toLowerCase() === typeId.toLowerCase()
      );
      if (found) return found.count;
    }
    const found = this.stats?.byRisk?.find((r) => r._id.toLowerCase() === typeId.toLowerCase());
    if (found) return found.count;
    return this.filteredArticles.filter((a) => {
      const t = a.userOverride?.riskType || a.classification?.riskType || 'none';
      return t.toLowerCase() === typeId.toLowerCase();
    }).length;
  }

  get displayTopCompanies(): { _id: string; name: string; count: number }[] {
    if (this.dashboardData?.topMentionedLenders?.length) {
      return this.dashboardData.topMentionedLenders.map((item) => ({
        _id: item.lenderName || item.name || item._id || item.lenderId,
        name: item.lenderName || item.name || item._id || item.lenderId,
        count: item.count
      })).slice(0, 8);
    }
    if (this.stats?.topCompanies?.length) {
      return this.stats.topCompanies.map((item) => ({
        _id: item.name || item._id,
        name: item.name || item._id,
        count: item.count
      })).slice(0, 8);
    }
    const counts: Record<string, number> = {};
    this.filteredArticles.forEach((a) => {
      const name = a.companyName || (typeof a.company === 'object' ? (a.company as Company)?.name : '') || '';
      if (name) {
        counts[name] = (counts[name] || 0) + 1;
      }
    });
    return Object.keys(counts)
      .map((k) => ({ _id: k, name: k, count: counts[k] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }

  barWidth(count: number): number {
    if (!this.displayTotal) return 0;
    const levels = ['Low', 'Medium', 'High', 'Critical'];
    const max = Math.max(...levels.map((lvl) => this.displayImpactCount(lvl)), 1);
    return (count / max) * 100;
  }

  barWidthTopCompany(count: number): number {
    const list = this.displayTopCompanies;
    if (!list || !list.length) return 0;
    const max = Math.max(...list.map((b) => b.count), 1);
    return Math.max((count / max) * 100, 2);
  }

  getImpactChartData() {
    const levels = ['Low', 'Medium', 'High', 'Critical'];
    const counts = levels.map((lvl) => this.displayImpactCount(lvl));
    const niceMax = this.impactAxis.niceMax;
    const total = this.displayTotal || 1;

    return levels.map((lvl, i) => {
      const count = counts[i];
      const percent = this.displayTotal > 0 ? Math.round((count / total) * 100) : 0;
      const barH = count > 0 ? Math.max(Math.round((count / niceMax) * 75), 2) : 0;
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

  get maxImpactCount(): number {
    const levels = ['Low', 'Medium', 'High', 'Critical'];
    const counts = levels.map((lvl) => this.displayImpactCount(lvl));
    return Math.max(...counts, 1);
  }

  getYAxisTicks(maxRaw: number) {
    if (maxRaw <= 10) return { niceMax: 10, ticks: [10, 8, 6, 4, 2, 0] };
    if (maxRaw <= 20) return { niceMax: 20, ticks: [20, 15, 10, 5, 0] };
    if (maxRaw <= 30) return { niceMax: 30, ticks: [30, 20, 10, 0] };
    if (maxRaw <= 40) return { niceMax: 40, ticks: [40, 30, 20, 10, 0] };
    if (maxRaw <= 50) return { niceMax: 50, ticks: [50, 40, 30, 20, 10, 0] };
    if (maxRaw <= 80) return { niceMax: 80, ticks: [80, 60, 40, 20, 0] };
    if (maxRaw <= 100) return { niceMax: 100, ticks: [100, 75, 50, 25, 0] };

    const digits = Math.floor(Math.log10(maxRaw));
    const power = Math.pow(10, digits);
    const fraction = maxRaw / power;
    let niceFraction;
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;

    let niceMax = niceFraction * power;
    if (niceMax < maxRaw) niceMax = Math.ceil(maxRaw / power) * power;

    return { niceMax, ticks: [niceMax, niceMax * 0.75, niceMax * 0.5, niceMax * 0.25, 0] };
  }

  get impactAxis() {
    return this.getYAxisTicks(this.maxImpactCount);
  }

  get riskAxis() {
    return this.getYAxisTicks(this.maxRiskCount);
  }

  getStackedSegments(d: { count: number; critical: number; high: number; medium: number; low: number; barH: number }) {
    if (d.count <= 0 || d.barH <= 0) {
      return {
        hCrit: 0,
        hHigh: 0,
        hMed: 0,
        hLow: 0,
        yCrit: 100,
        yHigh: 100,
        yMed: 100,
        yLow: 100
      };
    }

    const total = (d.critical + d.high + d.medium + d.low) || d.count || 1;
    let hCrit = (d.critical / total) * d.barH;
    let hHigh = (d.high / total) * d.barH;
    let hMed = (d.medium / total) * d.barH;
    let hLow = d.barH - (hCrit + hHigh + hMed);

    // Ensure non-zero segments have visible presence if bar is tall enough
    const nonZero = (d.critical > 0 ? 1 : 0) + (d.high > 0 ? 1 : 0) + (d.medium > 0 ? 1 : 0) + (d.low > 0 ? 1 : 0);
    if (d.barH >= nonZero * 2) {
      if (d.critical > 0 && hCrit < 1.5) hCrit = 1.5;
      if (d.high > 0 && hHigh < 1.5) hHigh = 1.5;
      if (d.medium > 0 && hMed < 1.5) hMed = 1.5;
      if (d.low > 0 && hLow < 1.5) hLow = 1.5;
      const currentSum = hCrit + hHigh + hMed + hLow;
      if (currentSum > 0) {
        const factor = d.barH / currentSum;
        hCrit *= factor;
        hHigh *= factor;
        hMed *= factor;
        hLow = d.barH - (hCrit + hHigh + hMed);
      }
    }

    const yLow = 100 - hLow;
    const yMed = yLow - hMed;
    const yHigh = yMed - hHigh;
    const yCrit = 100 - d.barH;

    return {
      hCrit,
      hHigh,
      hMed,
      hLow,
      yCrit,
      yHigh,
      yMed,
      yLow
    };
  }

  private getCategoryImpactBreakdown(catName: string, totalCount: number, catData?: any): { critical: number; high: number; medium: number; low: number } {
    if (catData) {
      const crit = catData.critical ?? catData.byImpact?.critical ?? catData.byImpact?.Critical;
      const h = catData.high ?? catData.byImpact?.high ?? catData.byImpact?.High;
      const m = catData.medium ?? catData.byImpact?.medium ?? catData.byImpact?.Medium;
      const l = catData.low ?? catData.byImpact?.low ?? catData.byImpact?.Low;
      if (crit !== undefined || h !== undefined || m !== undefined || l !== undefined) {
        return {
          critical: crit || 0,
          high: h || 0,
          medium: m || 0,
          low: l || 0
        };
      }
    }

    const catLower = catName.toLowerCase().trim();
    const catArticles = this.filteredArticles.filter((a) => {
      const type = a.userOverride?.riskType || a.classification?.riskType || (a as any).category || '';
      return type.toLowerCase().trim() === catLower;
    });

    let cCrit = 0;
    let cHigh = 0;
    let cMed = 0;
    let cLow = 0;

    if (catArticles.length > 0) {
      catArticles.forEach((a) => {
        const imp = this.getArticleImpact(a).toLowerCase();
        if (imp === 'critical') cCrit++;
        else if (imp === 'high') cHigh++;
        else if (imp === 'medium') cMed++;
        else cLow++;
      });

      if (catArticles.length === totalCount) {
        return { critical: cCrit, high: cHigh, medium: cMed, low: cLow };
      }

      const scale = totalCount / catArticles.length;
      const critical = Math.round(cCrit * scale);
      const high = Math.round(cHigh * scale);
      const medium = Math.round(cMed * scale);
      let low = totalCount - (critical + high + medium);
      if (low < 0) low = 0;
      return { critical, high, medium, low };
    }

    const sumCrit = this.displayImpactCount('Critical');
    const sumHigh = this.displayImpactCount('High');
    const sumMed = this.displayImpactCount('Medium');
    const sumLow = this.displayImpactCount('Low');
    const sumTotal = (sumCrit + sumHigh + sumMed + sumLow) || 1;

    let critical = Math.round((sumCrit / sumTotal) * totalCount);
    let high = Math.round((sumHigh / sumTotal) * totalCount);
    let medium = Math.round((sumMed / sumTotal) * totalCount);
    let low = totalCount - (critical + high + medium);
    if (low < 0) low = 0;

    return { critical, high, medium, low };
  }

  private riskCounts(): { _id: string; count: number; critical: number; high: number; medium: number; low: number }[] {
    if (this.dashboardData?.categories?.length) {
      return this.dashboardData.categories.map((c) => {
        const id = c.category || c._id || 'none';
        const breakdown = this.getCategoryImpactBreakdown(id, c.count, c);
        return {
          _id: id,
          count: c.count,
          ...breakdown
        };
      });
    }
    if (this.stats?.byRisk?.length) {
      return this.stats.byRisk.map((r) => {
        const id = r._id || 'none';
        const breakdown = this.getCategoryImpactBreakdown(id, r.count, r);
        return {
          _id: id,
          count: r.count,
          ...breakdown
        };
      });
    }
    const counts: Record<string, number> = {};
    this.filteredArticles.forEach(a => {
      const type = a.userOverride?.riskType || a.classification?.riskType || (a as any).category || 'none';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.keys(counts).map((k) => {
      const breakdown = this.getCategoryImpactBreakdown(k, counts[k]);
      return {
        _id: k,
        count: counts[k],
        ...breakdown
      };
    });
  }

  get maxRiskCount(): number {
    const data = this.riskCounts();
    return Math.max(...data.map(d => d.count), 1);
  }

  getRiskChartData() {
    let data = this.riskCounts();

    if (!data.length) return [];

    data = data.slice().sort((a, b) => b.count - a.count).slice(0, 4);

    const total = this.displayTotal || 1;
    const niceMax = this.riskAxis.niceMax;

    return data.map((d, i) => {
      const percent = this.displayTotal > 0 ? Math.round((d.count / total) * 100) : 0;
      const barH = d.count > 0 ? Math.max(Math.round((d.count / niceMax) * 75), 2) : 0;

      const totalWidth = 400;
      const spacing = totalWidth / Math.max(1, data.length);
      const x = 50 + (spacing / 2) + (i * spacing) - 20;
      const y = 100 - barH;

      const seg = this.getStackedSegments({
        count: d.count,
        critical: d.critical,
        high: d.high,
        medium: d.medium,
        low: d.low,
        barH
      });

      return {
        id: d._id || 'none',
        count: d.count,
        critical: d.critical,
        high: d.high,
        medium: d.medium,
        low: d.low,
        percent,
        x,
        y,
        barH,
        seg
      };
    });
  }

  getRiskLinePoints(): string {
    const data = this.getRiskChartData();
    if (!data.length) return '';
    return data.map((d) => `${d.x + 22},${d.y}`).join(' ');
  }

  getNewsLink(params: Record<string, string>): any[] {
    const p: Record<string, string> = { ...params };
    if (this.selectedCompany) {
      p['company'] = this.selectedCompany.name;
    }
    if (this.selectedPeriod) {
      p['period'] = this.selectedPeriod;
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
    const top = this.displayTopCompanies.find(
      (tc) => tc._id.toLowerCase() === c.name.toLowerCase() || tc.name.toLowerCase() === c.name.toLowerCase()
    );
    if (top) return top.count;
    if (this.allArticles.length) {
      return this.allArticles.filter((a) => this.matchesCompany(a, c)).length;
    }
    return 0;
  }
}
