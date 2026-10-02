import { DEFAULT_AUTH_LOGO } from '../auth-logo';
import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppearanceService } from './appearance.service';
import { AuthService } from '../auth.service';
import { LanguageCode } from './appearance.models';

interface PortalTranslationMap {
  dashboard: string;
  newsFeed: string;
  lenders: string;
  recipients: string;
  runs: string;
  settings: string;
  everyLender: string;
  totalArticles: string;
  criticalImpact: string;
  highImpact: string;
  lendersTracked: string;
  allActivity: string;
  immediateAction: string;
  majorDevelopments: string;
  activePortfolios: string;
  topMentioned: string;
  impactDistribution: string;
  riskTypes: string;
  connected: string;
}

const PORTAL_TRANSLATIONS: Record<LanguageCode, PortalTranslationMap> = {
  en: {
    dashboard: 'Dashboard',
    newsFeed: 'News Feed',
    lenders: 'Lenders',
    recipients: 'Recipients',
    runs: 'Runs',
    settings: 'Settings',
    everyLender: 'Every Lender',
    totalArticles: 'Total Articles',
    criticalImpact: 'Critical Impact',
    highImpact: 'High Impact',
    lendersTracked: 'Lenders Tracked',
    allActivity: 'All Tracked Activity',
    immediateAction: 'Immediate Action',
    majorDevelopments: 'Major Developments',
    activePortfolios: 'Active Portfolios',
    topMentioned: 'Top mentioned lenders',
    impactDistribution: 'Impact distribution',
    riskTypes: 'Risk Types',
    connected: 'Connected'
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    newsFeed: 'समाचार फ़ीड',
    lenders: 'ऋणदाता',
    recipients: 'प्राप्तकर्ता',
    runs: 'रन विवरण',
    settings: 'सेटिंग्स',
    everyLender: 'सभी ऋणदाता',
    totalArticles: 'कुल लेख',
    criticalImpact: 'गंभीर प्रभाव',
    highImpact: 'उच्च प्रभाव',
    lendersTracked: 'ट्रैक किए गए ऋणदाता',
    allActivity: 'सभी ट्रैक की गई गतिविधि',
    immediateAction: 'तत्काल कार्रवाई',
    majorDevelopments: 'प्रमुख घटनाक्रम',
    activePortfolios: 'सक्रिय पोर्टफोलियो',
    topMentioned: 'शीर्ष उल्लेखित ऋणदाता',
    impactDistribution: 'प्रभाव वितरण',
    riskTypes: 'जोखिम के प्रकार',
    connected: 'कनेक्टेड'
  },
  ta: {
    dashboard: 'டாஷ்போர்டு',
    newsFeed: 'செய்தி ஓடை',
    lenders: 'கடன் வழங்குநர்கள்',
    recipients: 'பெறுநர்கள்',
    runs: 'இயக்கங்கள்',
    settings: 'அமைப்புகள்',
    everyLender: 'அனைத்து கடன் வழங்குநர்கள்',
    totalArticles: 'மொத்த கட்டுரைகள்',
    criticalImpact: 'முக்கிய தாக்கம்',
    highImpact: 'அதிக தாக்கம்',
    lendersTracked: 'கண்காணிக்கப்படும் கடன் வழங்குநர்கள்',
    allActivity: 'அனைத்து செயல்பாடுகளும்',
    immediateAction: 'உடனடி நடவடிக்கை',
    majorDevelopments: 'முக்கிய முன்னேற்றங்கள்',
    activePortfolios: 'செயலில் உள்ள போர்ட்ஃபோலியோக்கள்',
    topMentioned: 'அதிகம் குறிப்பிடப்பட்டவர்கள்',
    impactDistribution: 'தாக்க விநியோகம்',
    riskTypes: 'ஆபத்து வகைகள்',
    connected: 'இணைக்கப்பட்டது'
  },
  te: {
    dashboard: 'డ్యాష్‌బోర్డ్',
    newsFeed: 'వార్తల ఫీడ్',
    lenders: 'రుణదాతలు',
    recipients: 'గ్రహీతలు',
    runs: 'రన్స్',
    settings: 'సెట్టింగ్‌లు',
    everyLender: 'ప్రతి రుణదాత',
    totalArticles: 'మొత్తం కథనాలు',
    criticalImpact: 'కీలక ప్రభావం',
    highImpact: 'అధిక ప్రభావం',
    lendersTracked: 'ట్రాక్ చేయబడిన రుణదాతలు',
    allActivity: 'అన్ని కార్యకలాపాలు',
    immediateAction: 'తక్షణ చర్య',
    majorDevelopments: 'ప్రధాన పరిణామాలు',
    activePortfolios: 'యాక్టివ్ పోర్ట్‌ఫోలియోలు',
    topMentioned: 'అగ్ర రుణదాతలు',
    impactDistribution: 'ప్రభావ పంపిణీ',
    riskTypes: 'ప్రమాద రకాలు',
    connected: 'కనెక్ట్ చేయబడింది'
  },
  ml: {
    dashboard: 'ഡാഷ്‌ബോർഡ്',
    newsFeed: 'വാർത്താ ഫീഡ്',
    lenders: 'വായ്പാ ദാതാക്കൾ',
    recipients: 'സ്വീകർത്താക്കൾ',
    runs: 'റൺസ്',
    settings: 'ക്രമീകരണങ്ങൾ',
    everyLender: 'എല്ലാ വായ്പാ ദാതാക്കളും',
    totalArticles: 'ആകെ ലേഖനങ്ങൾ',
    criticalImpact: 'ഗുരുതരമായ ആഘാതം',
    highImpact: 'ഉയർന്ന ആഘാതം',
    lendersTracked: 'ട്രാക്ക് ചെയ്ത വായ്പാ ദാതാക്കൾ',
    allActivity: 'എല്ലാ പ്രവർത്തനങ്ങളും',
    immediateAction: 'ഉടനടി നടപടി',
    majorDevelopments: 'പ്രധാന സംഭവവികാസങ്ങൾ',
    activePortfolios: 'സജീവ പോർട്ട്ഫോളിയോകൾ',
    topMentioned: 'പ്രമുഖ വായ്പാ ദാതാക്കൾ',
    impactDistribution: 'ആഘാത വിതരണം',
    riskTypes: 'റിസ്ക് തരങ്ങൾ',
    connected: 'കണക്റ്റ് ചെയ്തു'
  },
  fr: {
    dashboard: 'Tableau de bord',
    newsFeed: 'Flux d’actualités',
    lenders: 'Prêteurs',
    recipients: 'Destinataires',
    runs: 'Exécutions',
    settings: 'Paramètres',
    everyLender: 'Tous les prêteurs',
    totalArticles: 'Total des articles',
    criticalImpact: 'Impact critique',
    highImpact: 'Impact élevé',
    lendersTracked: 'Prêteurs suivis',
    allActivity: 'Activité globale suivie',
    immediateAction: 'Action immédiate',
    majorDevelopments: 'Développements majeurs',
    activePortfolios: 'Portefeuilles actifs',
    topMentioned: 'Principaux prêteurs cités',
    impactDistribution: 'Distribution de l’impact',
    riskTypes: 'Types de risque',
    connected: 'Connecté'
  },
  es: {
    dashboard: 'Panel de control',
    newsFeed: 'Noticias',
    lenders: 'Prestamistas',
    recipients: 'Destinatarios',
    runs: 'Ejecuciones',
    settings: 'Configuración',
    everyLender: 'Todos los prestamistas',
    totalArticles: 'Total artículos',
    criticalImpact: 'Impacto crítico',
    highImpact: 'Impacto alto',
    lendersTracked: 'Prestamistas seguidos',
    allActivity: 'Toda la actividad',
    immediateAction: 'Acción inmediata',
    majorDevelopments: 'Acontecimientos clave',
    activePortfolios: 'Carteras activas',
    topMentioned: 'Prestamistas más citados',
    impactDistribution: 'Distribución de impacto',
    riskTypes: 'Tipos de riesgo',
    connected: 'Conectado'
  },
  de: {
    dashboard: 'Dashboard',
    newsFeed: 'Nachrichten-Feed',
    lenders: 'Kreditgeber',
    recipients: 'Empfänger',
    runs: 'Durchläufe',
    settings: 'Einstellungen',
    everyLender: 'Jeder Kreditgeber',
    totalArticles: 'Artikel gesamt',
    criticalImpact: 'Kritischer Einfluss',
    highImpact: 'Hoher Einfluss',
    lendersTracked: 'Kreditgeber verfolgt',
    allActivity: 'Alle Aktivitäten',
    immediateAction: 'Sofortige Maßnahme',
    majorDevelopments: 'Wichtige Entwicklungen',
    activePortfolios: 'Aktive Portfolios',
    topMentioned: 'Meistgenannte Kreditgeber',
    impactDistribution: 'Einfluss-Verteilung',
    riskTypes: 'Risikoarten',
    connected: 'Verbunden'
  },
  ja: {
    dashboard: 'ダッシュボード',
    newsFeed: 'ニュースフィード',
    lenders: '金融機関',
    recipients: '受信者',
    runs: '実行履歴',
    settings: '設定',
    everyLender: 'すべての金融機関',
    totalArticles: '記事総数',
    criticalImpact: '重大な影響',
    highImpact: '高影響',
    lendersTracked: '追跡中の金融機関',
    allActivity: '追跡アクティビティ全体',
    immediateAction: '緊急対応',
    majorDevelopments: '主な動向',
    activePortfolios: 'アクティブポートフォリオ',
    topMentioned: '言及数の多い機関',
    impactDistribution: '影響度の分布',
    riskTypes: 'リスク種別',
    connected: '接続中'
  },
  zh: {
    dashboard: '仪表板',
    newsFeed: '新闻简报',
    lenders: '合作金融机构',
    recipients: '接收人',
    runs: '运行日志',
    settings: '系统设置',
    everyLender: '全部合作方',
    totalArticles: '文章总数',
    criticalImpact: '严重影响',
    highImpact: '高影响',
    lendersTracked: '追踪机构数',
    allActivity: '全部追踪动态',
    immediateAction: '即时响应',
    majorDevelopments: '关键进展',
    activePortfolios: '活跃组合',
    topMentioned: '提及最多机构',
    impactDistribution: '影响度分布',
    riskTypes: '风险类型',
    connected: '已连接'
  },
  ar: {
    dashboard: 'لوحة التحكم',
    newsFeed: 'موجز الأخبار',
    lenders: 'المقرضون',
    recipients: 'المستلمون',
    runs: 'التشغيلات',
    settings: 'الإعدادات',
    everyLender: 'كل المقرضين',
    totalArticles: 'إجمالي المقالات',
    criticalImpact: 'تأثير حرج',
    highImpact: 'تأثير عالٍ',
    lendersTracked: 'المقرضون المتابعون',
    allActivity: 'جميع الأنشطة المتابعة',
    immediateAction: 'إجراء فوري',
    majorDevelopments: 'تطورات رئيسية',
    activePortfolios: 'المحافظ النشطة',
    topMentioned: 'أبرز المقرضين ذكراً',
    impactDistribution: 'توزيع التأثير',
    riskTypes: 'أنواع المخاطر',
    connected: 'متصل'
  }
};

@Component({
  selector: 'app-live-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="live-preview-wrapper">
      
      <!-- Top meta header -->
      <div class="preview-meta-row">
        <div class="preview-title-col">
          <h3 class="preview-tag-title">Live Preview</h3>
          <span class="preview-tag-sub">Real application rendering &amp; immediate theme feedback</span>
        </div>
        <div class="preview-mode-tag">
          <span class="pulse-indicator"></span>
          <span>PREVIEW MODE (ISOLATED)</span>
        </div>
      </div>

      <!-- Real Application Shell in Miniature -->
      <div class="real-app-shell"
           [class.preview-isolated]="previewMode"
           [class.dark-mode]="isDark"
           [attr.dir]="isArabic ? 'rtl' : 'ltr'"
           [style.--preview-scale]="fontScale"
           [style.--preview-primary]="primaryColor"
           [style.--preview-secondary]="secondaryColor"
           [style.--preview-bg]="previewAppBg"
           [style.--preview-surface]="previewSurface"
           [style.--preview-text]="isDark ? '#f8fafc' : '#0f172a'"
           [style.--preview-muted]="isDark ? '#94a3b8' : '#64748b'"
           [style.--preview-border]="isDark ? '#243247' : '#e2e8f0'"
           [style.--preview-sidebar]="isDark ? '#0b1220' : (draft.bg.sidebarBg || '#1e293b')"
           [style.--preview-radius]="radiusPx"
           [style.background]="previewAppBg"
           [style.color]="isDark ? '#f8fafc' : '#0f172a'">

        <!-- Real Application Sidebar Component -->
        <aside class="real-sidebar" [style.background]="isDark ? '#0b1220' : (draft.bg.sidebarBg || '#1e293b')">
          
          <!-- Real Logo & Brand Title -->
          <div class="real-brand-header">
            <img class="real-brand-logo" 
                 [src]="previewLogoUrl" 
                 (error)="onPreviewLogoError($event)"
                 [style.border-radius.px]="draft.branding.logoBorderRadius || 8"
                 alt="Logo" />
            <div class="real-brand-titles">
              <span class="real-brand-name">{{ draft.branding.applicationName || draft.branding.appName || draft.branding.appTitle || 'News Radar' }}</span>
              <span class="real-brand-sub">{{ draft.branding.appSubtitle || 'IMGC Reviewer Portal' }}</span>
            </div>
          </div>

          <!-- Real Nav Links -->
          <nav class="real-nav-list" aria-label="Application preview navigation">
            <div class="real-nav-item active" 
                 [style.background]="primaryColor">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
              <span>{{ t.dashboard }}</span>
            </div>

            <div class="real-nav-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              <span>{{ t.newsFeed }}</span>
            </div>

            <ng-container *ngIf="isAdmin">
              <div class="real-nav-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
                <span>{{ t.lenders }}</span>
              </div>

              <div class="real-nav-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span>{{ t.recipients }}</span>
              </div>

              <div class="real-nav-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                <span>{{ t.runs }}</span>
              </div>

              <div class="real-nav-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                <span>{{ t.settings }}</span>
              </div>
            </ng-container>
          </nav>

          <!-- Sidebar Footer Status Dot -->
          <div class="real-sidebar-footer">
            <span class="status-dot-green"></span>
            <span>{{ t.connected }}</span>
          </div>
        </aside>

        <!-- Main Real Application Area -->
        <main class="real-main-wrap" [style.background]="previewAppBg">
          
          <!-- Real Application Header Bar -->
          <header class="real-app-header" 
                  [style.background]="isDark ? '#0b1220' : '#ffffff'"
                  [style.border-bottom-color]="isDark ? '#243247' : '#e2e8f0'">
            <div class="real-header-left">
              <h2 class="real-page-title" [style.color]="isDark ? '#f8fafc' : '#0f172a'">
                Claim Dashboard
              </h2>
            </div>

            <div class="real-header-right">
              <!-- Real Header Studio Star Button (Preview Representation) -->
              <div class="real-btn-star" [style.color]="primaryColor">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <circle cx="12" cy="12" r="4.5"/>
                  <line x1="12" y1="2" x2="12" y2="4.5"/>
                  <line x1="12" y1="19.5" x2="12" y2="22"/>
                  <line x1="2" y1="12" x2="4.5" y2="12"/>
                  <line x1="19.5" y1="12" x2="22" y2="12"/>
                </svg>
              </div>

              <!-- Real User Profile Display -->
              <div class="real-user-profile-box">
                <div class="real-avatar" [style.background]="primaryColor">{{ userProfile.avatar }}</div>
                <div class="real-user-text">
                  <span class="real-user-name" [style.color]="isDark ? '#f8fafc' : '#0f172a'">{{ userProfile.name }}</span>
                  <span class="real-user-role" [style.color]="isDark ? '#94a3b8' : '#64748b'">{{ userProfile.role }}</span>
                </div>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
          </header>

          <!-- Real Dashboard Content Area -->
          <div class="real-content-scroll" [class.density-compact]="draft.display.density === 'compact'" [class.density-spacious]="draft.display.density === 'spacious'">
            
            <!-- Real Chocolate Banner -->
            <div class="banner-chocolate real-chocolate" [style.border-radius]="radiusPx" [style.background]="previewBannerBg">
              <div class="banner-top-row">
                <h3 class="chocolate-title">{{ t.everyLender }}</h3>
                <div class="pill-filter-mock">
                  <span>{{ t.everyLender }}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>

              <!-- Real 4 Stat Cards in Banner -->
              <div class="real-stat-grid">
                
                <!-- Card 1: Total Articles -->
                <div class="real-stat-card" [style.border-radius]="radiusPx" [style.background]="previewSurface">
                  <div class="stat-card-top">
                    <span class="stat-value" [style.color]="primaryColor">99</span>
                    <div class="stat-icon-wrap icon-blue">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                  </div>
                  <span class="stat-lbl">{{ t.totalArticles }}</span>
                  <span class="stat-sub">{{ t.allActivity }}</span>
                </div>

                <!-- Card 2: Critical Impact -->
                <div class="real-stat-card" [style.border-radius]="radiusPx" [style.background]="previewSurface">
                  <div class="stat-card-top">
                    <span class="stat-value" style="color: #ef4444;">0</span>
                    <div class="stat-icon-wrap icon-red">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                  </div>
                  <span class="stat-lbl">{{ t.criticalImpact }}</span>
                  <span class="stat-sub">{{ t.immediateAction }}</span>
                </div>

                <!-- Card 3: High Impact -->
                <div class="real-stat-card" [style.border-radius]="radiusPx" [style.background]="previewSurface">
                  <div class="stat-card-top">
                    <span class="stat-value" style="color: #f37819;">16</span>
                    <div class="stat-icon-wrap icon-orange">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                  </div>
                  <span class="stat-lbl">{{ t.highImpact }}</span>
                  <span class="stat-sub">{{ t.majorDevelopments }}</span>
                </div>

                <!-- Card 4: Lenders Tracked -->
                <div class="real-stat-card" [style.border-radius]="radiusPx" [style.background]="previewSurface">
                  <div class="stat-card-top">
                    <span class="stat-value" style="color: #06b6d4;">7</span>
                    <div class="stat-icon-wrap icon-cyan">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    </div>
                  </div>
                  <span class="stat-lbl">{{ t.lendersTracked }}</span>
                  <span class="stat-sub">{{ t.activePortfolios }}</span>
                </div>

              </div>
            </div>

            <!-- Real Charts Section (Exact 3 Cards) -->
            <div class="real-charts-grid">
              
              <!-- 1. Top mentioned lenders (Span 2) -->
              <div class="real-chart-card span-2" 
                   [class.card-shadow]="draft.display.cardStyle === 'shadow'"
                   [class.card-border]="draft.display.cardStyle === 'border'"
                   [style.background]="previewSurface"
                   [style.border-color]="isDark ? '#243247' : '#e2e8f0'"
                   [style.border-radius]="radiusPx">
                <div class="chart-card-header">
                  <h4 class="chart-card-title">{{ t.topMentioned }}</h4>
                  <div class="chart-header-actions">
                    <span class="mini-pill-btn">All Lenders</span>
                  </div>
                </div>

                <div class="real-lender-bars-wrap">
                  <div class="lender-bar-row" *ngFor="let item of previewTopLenders">
                    <span class="lender-name">{{ item.name }}</span>
                    <div class="bar-track">
                      <div class="bar-fill" 
                           [style.width.%]="item.pct" 
                           [style.background]="primaryColor"></div>
                    </div>
                    <span class="bar-num">{{ item.count }}</span>
                  </div>
                </div>
              </div>

              <!-- 2. Impact distribution -->
              <div class="real-chart-card" 
                   [class.card-shadow]="draft.display.cardStyle === 'shadow'"
                   [class.card-border]="draft.display.cardStyle === 'border'"
                   [style.background]="previewSurface"
                   [style.border-color]="isDark ? '#243247' : '#e2e8f0'"
                   [style.border-radius]="radiusPx">
                <div class="chart-card-header">
                  <h4 class="chart-card-title">{{ t.impactDistribution }}</h4>
                  <div class="chart-header-actions">
                    <span class="mini-pill-btn active">Articles</span>
                    <span class="mini-pill-btn">Share %</span>
                  </div>
                </div>

                <div class="real-impact-chart-box">
                  <svg viewBox="0 0 280 85" style="width: 100%; height: 64px; display: block;">
                    <!-- Baseline -->
                    <line x1="20" y1="65" x2="260" y2="65" [attr.stroke]="isDark ? '#243247' : '#e2e8f0'" stroke-width="1.2" />

                    <!-- Vertical bars for Low, Med, High, Critical -->
                    <g *ngFor="let d of previewImpactData; let i = index">
                      <rect [attr.x]="30 + i * 60"
                            [attr.y]="65 - d.h"
                            width="28"
                            [attr.height]="d.h"
                            rx="3"
                            [attr.fill]="i === 3 ? '#ef4444' : (i === 2 ? '#f37819' : primaryColor)" />
                      <text [attr.x]="44 + i * 60"
                            [attr.y]="60 - d.h"
                            text-anchor="middle"
                            [attr.fill]="isDark ? '#f8fafc' : '#0f172a'"
                            font-size="8.5"
                            font-weight="700">
                        {{ d.count }}
                      </text>
                      <text [attr.x]="44 + i * 60"
                            y="77"
                            text-anchor="middle"
                            [attr.fill]="isDark ? '#94a3b8' : '#64748b'"
                            font-size="8"
                            font-weight="600">
                        {{ d.label }}
                      </text>
                    </g>

                    <!-- Green trendline -->
                    <polyline points="44,38 104,46 164,54 224,65" 
                              fill="none" 
                              stroke="#10b981" 
                              stroke-width="2" 
                              stroke-linecap="round" />
                    <circle cx="44" cy="38" r="2.5" fill="#ffffff" stroke="#10b981" stroke-width="2" />
                    <circle cx="104" cy="46" r="2.5" fill="#ffffff" stroke="#10b981" stroke-width="2" />
                    <circle cx="164" cy="54" r="2.5" fill="#ffffff" stroke="#10b981" stroke-width="2" />
                    <circle cx="224" cy="65" r="2.5" fill="#ffffff" stroke="#10b981" stroke-width="2" />
                  </svg>
                </div>
              </div>

              <!-- 3. Risk Types -->
              <div class="real-chart-card" 
                   [class.card-shadow]="draft.display.cardStyle === 'shadow'"
                   [class.card-border]="draft.display.cardStyle === 'border'"
                   [style.background]="previewSurface"
                   [style.border-color]="isDark ? '#243247' : '#e2e8f0'"
                   [style.border-radius]="radiusPx">
                <div class="chart-card-header">
                  <h4 class="chart-card-title">{{ t.riskTypes }}</h4>
                </div>

                <div class="real-donut-wrap">
                  <svg viewBox="0 0 100 100" style="width: 54px; height: 54px; flex-shrink: 0;">
                    <!-- Segments -->
                    <circle cx="50" cy="50" r="32" fill="none" stroke="#2563eb" stroke-width="12" stroke-dasharray="80 200" stroke-dashoffset="0" />
                    <circle cx="50" cy="50" r="32" fill="none" stroke="#f37819" stroke-width="12" stroke-dasharray="56 200" stroke-dashoffset="-80" />
                    <circle cx="50" cy="50" r="32" fill="none" stroke="#10b981" stroke-width="12" stroke-dasharray="35 200" stroke-dashoffset="-136" />
                    <circle cx="50" cy="50" r="32" fill="none" stroke="#8b5cf6" stroke-width="12" stroke-dasharray="29 200" stroke-dashoffset="-171" />
                    <!-- Center count -->
                    <text x="50" y="54" text-anchor="middle" font-size="11" font-weight="800" [attr.fill]="isDark ? '#f8fafc' : '#0f172a'">99</text>
                  </svg>

                  <div class="donut-legend-col">
                    <div class="legend-row">
                      <span class="legend-dot" style="background: #2563eb;"></span>
                      <span class="leg-name">Credit Risk</span>
                      <span class="leg-val">40%</span>
                    </div>
                    <div class="legend-row">
                      <span class="legend-dot" style="background: #f37819;"></span>
                      <span class="leg-name">Regulatory</span>
                      <span class="leg-val">28%</span>
                    </div>
                    <div class="legend-row">
                      <span class="legend-dot" style="background: #10b981;"></span>
                      <span class="leg-name">Liquidity</span>
                      <span class="leg-val">18%</span>
                    </div>
                    <div class="legend-row">
                      <span class="legend-dot" style="background: #8b5cf6;"></span>
                      <span class="leg-name">Fraud</span>
                      <span class="leg-val">14%</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>

    </div>
  `,
  styles: [`
    .live-preview-wrapper {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      overflow: hidden;
      box-sizing: border-box;
    }

    .preview-meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      flex-shrink: 0;
    }

    .preview-tag-title {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.01em;
    }

    .preview-tag-sub {
      font-size: 10.5px;
      color: #64748b;
      margin-top: 1px;
    }

    .preview-mode-tag {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      padding: 2px 7px;
      border-radius: 12px;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.3px;
    }

    .pulse-indicator {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #2563eb;
    }

    /* ----------------------------------------------------
       Real Shell & Outer Container
       ---------------------------------------------------- */
    .real-app-shell {
      flex: 1;
      display: flex;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      background: #f8fafc;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
      min-height: 0;
      max-height: 100%;
      transition: all 0.2s ease;
      --preview-scale: 1;
    }

    .real-app-shell.preview-isolated {
      user-select: none;
    }

    /* ----------------------------------------------------
       Real Sidebar
       ---------------------------------------------------- */
    .real-sidebar {
      width: 155px;
      min-width: 155px;
      background: #1e293b;
      color: #ffffff;
      padding: 10px 8px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex-shrink: 0;
      overflow: hidden;
      transition: background 0.2s ease;
    }

    .real-brand-header {
      display: flex;
      align-items: center;
      gap: 7px;
      padding-bottom: 5px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      flex-shrink: 0;
    }

    .real-brand-logo {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      object-fit: contain;
      background: #ffffff;
      padding: 2px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      flex-shrink: 0;
    }

    .real-brand-titles {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .real-brand-name {
      font-size: calc(11.5px * var(--preview-scale, 1));
      font-weight: 800;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.2;
    }

    .real-brand-sub {
      font-size: calc(8.5px * var(--preview-scale, 1));
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 1px;
    }

    .real-nav-list {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1;
      overflow: hidden;
    }

    .real-nav-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px;
      border-radius: 6px;
      font-size: calc(10px * var(--preview-scale, 1));
      font-weight: 600;
      color: #94a3b8;
      cursor: default;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .real-nav-item.active {
      color: #ffffff;
      font-weight: 700;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }

    .real-sidebar-footer {
      margin-top: auto;
      font-size: calc(9px * var(--preview-scale, 1));
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 4px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      flex-shrink: 0;
    }

    .status-dot-green {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
    }

    /* ----------------------------------------------------
       Real Main Area
       ---------------------------------------------------- */
    .real-main-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #f8fafc;
    }

    .real-app-header {
      height: 40px;
      padding: 0 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
      background: #ffffff;
      flex-shrink: 0;
    }

    .real-page-title {
      font-size: calc(12.5px * var(--preview-scale, 1));
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.01em;
    }

    .real-header-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .real-btn-star {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(37, 99, 235, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: default;
    }

    .real-user-profile-box {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 2px 7px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
    }

    .real-avatar {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      color: #ffffff;
      font-size: 8.5px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .real-user-text {
      display: flex;
      flex-direction: column;
    }

    .real-user-name {
      font-size: 9.5px;
      font-weight: 700;
      line-height: 1.1;
    }

    .real-user-role {
      font-size: 8px;
    }

    .real-content-scroll {
      flex: 1;
      overflow: hidden;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      scrollbar-width: none;
      -ms-overflow-style: none;
      box-sizing: border-box;
    }

    .real-content-scroll::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
    }

    .real-content-scroll.density-compact {
      padding: 6px 8px;
      gap: 5px;
    }

    .real-content-scroll.density-spacious {
      padding: 12px 14px;
      gap: 8px;
    }

    /* ----------------------------------------------------
       Chocolate Banner & Real Stat Cards
       ---------------------------------------------------- */
    .real-chocolate {
      background: linear-gradient(135deg, #492812 0%, #2e1709 100%);
      color: #ffffff;
      padding: 8px 10px;
      border-radius: 8px;
      box-shadow: 0 3px 10px rgba(46, 23, 9, 0.25);
      flex-shrink: 0;
    }

    .banner-top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .chocolate-title {
      font-size: calc(11px * var(--preview-scale, 1));
      font-weight: 800;
      color: #ffffff;
      margin: 0;
    }

    .pill-filter-mock {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      padding: 2px 7px;
      border-radius: 12px;
      font-size: calc(8.5px * var(--preview-scale, 1));
      font-weight: 600;
      color: #ffffff;
    }

    .real-stat-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }

    .real-stat-card {
      background: #ffffff;
      border-radius: 6px;
      padding: 5px 7px;
      display: flex;
      flex-direction: column;
      color: #0f172a;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    }

    .stat-card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .stat-value {
      font-size: calc(14px * var(--preview-scale, 1));
      font-weight: 800;
      line-height: 1.1;
    }

    .stat-icon-wrap {
      width: 18px;
      height: 18px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-blue { background: #eff6ff; color: #2563eb; }
    .icon-red { background: #fef2f2; color: #ef4444; }
    .icon-orange { background: #fff7ed; color: #ea580c; }
    .icon-cyan { background: #ecfeff; color: #0891b2; }

    .stat-lbl {
      font-size: calc(8px * var(--preview-scale, 1));
      font-weight: 700;
      color: #475569;
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .stat-sub {
      font-size: calc(6.8px * var(--preview-scale, 1));
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ----------------------------------------------------
       Real Charts Section
       ---------------------------------------------------- */
    .real-charts-grid {
      display: grid;
      grid-template-columns: 1.3fr 1fr 1fr;
      gap: 6px;
      flex: 1;
      min-height: 0;
    }

    .real-chart-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 6px 8px;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }

    .chart-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
      flex-shrink: 0;
    }

    .chart-card-title {
      font-size: calc(9.5px * var(--preview-scale, 1));
      font-weight: 800;
      color: inherit;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .chart-header-actions {
      display: flex;
      gap: 3px;
    }

    .mini-pill-btn {
      font-size: 7.5px;
      font-weight: 600;
      padding: 1px 5px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      color: #64748b;
    }

    .mini-pill-btn.active {
      background: #eff6ff;
      border-color: #93c5fd;
      color: #2563eb;
      font-weight: 700;
    }

    /* Bars */
    .real-lender-bars-wrap {
      display: flex;
      flex-direction: column;
      gap: 3px;
      justify-content: space-around;
      flex: 1;
    }

    .lender-bar-row {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .lender-name {
      width: 58px;
      font-size: calc(7.8px * var(--preview-scale, 1));
      font-weight: 600;
      color: inherit;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bar-track {
      flex: 1;
      height: 4px;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 2px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    .bar-num {
      font-size: 8px;
      font-weight: 700;
      color: inherit;
      width: 14px;
      text-align: right;
    }

    /* Donut */
    .real-donut-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
    }

    .donut-legend-col {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }

    .legend-row {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 7.5px;
    }

    .legend-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .leg-name {
      color: inherit;
      font-weight: 500;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .leg-val {
      font-weight: 700;
      color: inherit;
    }

    /* Dark Mode overrides for preview */
    .real-app-shell.dark-mode {
      background: #050b18;
      color: #f8fafc;
      border-color: #243247;
    }

    .real-app-shell.dark-mode .real-app-header {
      background: #0b1220;
      border-color: #243247;
    }

    .real-app-shell.dark-mode .real-user-profile-box {
      background: #111827;
      border-color: #243247;
    }

    .real-app-shell.dark-mode .real-chart-card {
      background: #0b1220;
      border-color: #243247;
      color: #f8fafc;
    }

    .real-app-shell.dark-mode .bar-track {
      background: rgba(255, 255, 255, 0.1);
    }

    .real-app-shell.dark-mode .mini-pill-btn {
      border-color: #243247;
      color: #94a3b8;
    }

    .real-app-shell.dark-mode .mini-pill-btn.active {
      background: rgba(59, 130, 246, 0.2);
      border-color: #3b82f6;
      color: #60a5fa;
    }
  `]
})
export class LivePreviewComponent {
  get loginLogoUrl(): string {
    const url = this.draft?.branding?.loginLogo || this.draft?.branding?.logoUrl;
    if (!url || url.length === 9122 || (url.startsWith('data:image/jpeg;base64,') && url.length < 12000)) {
      return DEFAULT_AUTH_LOGO;
    }
    return url;
  }

  onLoginLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== DEFAULT_AUTH_LOGO) {
      img.src = DEFAULT_AUTH_LOGO;
    }
  }

  @Input() activeTab: string = 'branding';
  previewTarget: 'app' | 'login' = 'app';
  get previewLogoUrl(): string {
    const url = this.draft?.branding?.sidebarLogo || this.draft?.branding?.logoUrl;
    if (!url || url.length === 9122 || (url.startsWith('data:image/jpeg;base64,') && url.length < 12000)) {
      return DEFAULT_AUTH_LOGO;
    }
    return url;
  }

  onPreviewLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== DEFAULT_AUTH_LOGO) {
      img.src = DEFAULT_AUTH_LOGO;
    }
  }

  @Input() previewMode: boolean = true;

  private appearanceService = inject(AppearanceService);
  private authService = inject(AuthService);

  previewTopLenders = [
    { name: 'HDFC Bank', count: 32, pct: 100 },
    { name: 'State Bank of India', count: 24, pct: 75 },
    { name: 'ICICI Bank', count: 19, pct: 60 },
    { name: 'Axis Bank', count: 14, pct: 44 },
    { name: 'Punjab National Bank', count: 10, pct: 31 }
  ];

  previewImpactData = [
    { label: 'Low', count: 52, h: 45 },
    { label: 'Medium', count: 31, h: 32 },
    { label: 'High', count: 16, h: 22 },
    { label: 'Critical', count: 0, h: 4 }
  ];

  get draft() {
    return this.appearanceService.draft;
  }

  get isDark(): boolean {
    return this.draft.theme.mode === 'dark';
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get userProfile() {
    return this.authService.getUserProfile();
  }

  get primaryColor(): string {
    return this.draft.colors.primary || (this.isDark ? '#3b82f6' : '#2563eb');
  }

  /** Workspace background as the BG tab defines it: solid colour, gradient or uploaded image. */
  get previewAppBg(): string {
    if (this.isDark) return '#050b18';
    const bg = this.draft.bg;
    if (bg.style === 'gradient' && bg.gradientPreset) return bg.gradientPreset;
    if (bg.style === 'image' && bg.customImageUrl) {
      return `url("${bg.customImageUrl.replace(/"/g, '%22')}") center / cover no-repeat`;
    }
    return bg.appBg || '#f8fafc';
  }

  get previewSurface(): string {
    return this.isDark ? '#0b1220' : (this.draft.bg.surfaceBg || '#ffffff');
  }

  /** Same derivation as the app banner: a dark shade of the primary colour. */
  get previewBannerBg(): string {
    return this.isDark ? '#0b1220' : `color-mix(in srgb, ${this.primaryColor} 35%, #1a0d05)`;
  }

  get secondaryColor(): string {
    return this.draft.colors.secondary || '#475569';
  }

  get fontScale(): number {
    const scaleMap: Record<string, number> = {
      small: 0.9,
      medium: 1.0,
      large: 1.1
    };
    return scaleMap[this.draft.display.typographyScale] || 1.0;
  }

  get radiusPx(): string {
    const radiusMap: Record<string, string> = {
      small: '4px',
      medium: '8px',
      large: '14px',
      sharp: '4px',
      balanced: '8px',
      rounded: '14px',
      soft: '20px'
    };
    return radiusMap[this.draft.display.borderRadius] || '8px';
  }

  get isArabic(): boolean {
    return this.draft.display.language === 'ar';
  }

  get t(): PortalTranslationMap {
    const code = this.draft.display.language || 'en';
    return PORTAL_TRANSLATIONS[code] || PORTAL_TRANSLATIONS.en;
  }
}
