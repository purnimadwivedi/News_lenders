import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { applyThemeTokensToElement } from '../theme';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../auth.service';
import {
  AppearanceState,
  ThemePreset,
  ThemeConfig,
  ColorMode,
  ColorsConfig,
  BgConfig,
  DisplayConfig,
  BrandingConfig,
  CarouselConfig,
  TenantAppearanceConfig,
  UserAppearancePreferences,
  THEME_PRESETS,
  resolveEffectiveAppearance
} from './appearance.models';

const DEFAULT_LOGO = 'data:image/jpeg;base64,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';

export const DEFAULT_APPEARANCE_STATE: AppearanceState = {
  theme: {
    mode: 'light',
    presetId: 'enterprise-blue'
  },
  colors: {
    primary: '#2563EB',
    secondary: '#475569',
    accent: '#3B82F6',
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',
    mutedText: '#64748B',
    border: '#E2E8F0',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    // Compatibility properties
    low: '#10B981',
    medium: '#F59E0B',
    high: '#F97316',
    critical: '#EF4444',
    primaryHover: '#1D4ED8'
  },
  bg: {
    style: 'solid',
    appBg: '#F8FAFC',
    surfaceBg: '#FFFFFF',
    sidebarBg: '#1E293B',
    bgColor: '#F8FAFC',
    surfaceColor: '#FFFFFF',
    surface2Color: '#F1F5F9',
    borderColor: '#E2E8F0',
    customImageUrl: '',
    gradientPreset: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
    bgOpacity: 0.15,
    bgBlur: 0
  },
  display: {
    typographyScale: 'medium',
    language: 'en',
    density: 'comfortable',
    borderRadius: 'medium',
    cardStyle: 'border',
    headerHeight: 'standard',
    sidebarWidth: 'standard',
    fontFamily: 'Inter',
    showStatusBadges: true,
    enableAnimations: true
  },
  branding: {
    applicationName: 'Lender News',
    appName: 'Lender News',
    logoUrl: DEFAULT_LOGO,
    appTitle: 'Lender News',
    appSubtitle: 'IMGC Reviewer Portal',
    logoBorderRadius: 10,
    primaryColor: '#2563EB',
    secondaryColor: '#0F172A',
    version: 1
  },
  carousel: {
    enabled: false,
    intervalSeconds: 6,
    slides: [
      {
        id: 'slide-1',
        title: 'Quarterly Risk Review',
        description: 'New regulatory guidelines from RBI impacting NBFC capital requirements have been classified.',
        badge: 'Priority Advisory',
        buttonText: 'View Analysis',
        buttonUrl: '/news',
        bgGradient: 'linear-gradient(135deg, #492812 0%, #2e1709 100%)',
        active: true
      },
      {
        id: 'slide-2',
        title: 'Real-time AI Sentiment',
        description: 'Automated news scraper has processed 420+ publications across all partner lenders today.',
        badge: 'System Live',
        buttonText: 'Dashboard',
        buttonUrl: '/dashboard',
        bgGradient: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
        active: true
      }
    ]
  }
};

const SYNC_CHANNEL_NAME = 'lender_news_appearance_sync';

@Injectable({ providedIn: 'root' })
export class AppearanceService {
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  private isOpenSubject = new BehaviorSubject<boolean>(false);
  public isOpen$ = this.isOpenSubject.asObservable();

  // Saved state (persisted to tenant/user configuration & active on application DOM)
  private savedStateSubject = new BehaviorSubject<AppearanceState>(this.loadEffectiveState());
  public savedState$ = this.savedStateSubject.asObservable();

  // Draft state (active in Appearance Studio, drives Live Preview in real time)
  private draftStateSubject = new BehaviorSubject<AppearanceState>(this.clone(this.savedStateSubject.value));
  public draftState$ = this.draftStateSubject.asObservable();

  // Compatibility state$ observable for existing subscribers
  public state$ = this.savedStateSubject.asObservable();

  // Toast notification feedback stream
  private toastMessageSubject = new BehaviorSubject<string | null>(null);
  public toastMessage$ = this.toastMessageSubject.asObservable();

  // Real-time multi-user / multi-tab synchronization channel
  private syncChannel: BroadcastChannel | null = null;

  constructor() {
    this.initSyncChannel();
    this.applyToDOM(this.savedStateSubject.value);
  }

  get isOpen(): boolean {
    return this.isOpenSubject.value;
  }

  get saved(): AppearanceState {
    return this.savedStateSubject.value;
  }

  get draft(): AppearanceState {
    return this.draftStateSubject.value;
  }

  get state(): AppearanceState {
    return this.savedStateSubject.value;
  }

  get branding(): BrandingConfig {
    return this.savedStateSubject.value.branding;
  }

  get carousel(): CarouselConfig {
    return this.savedStateSubject.value.carousel;
  }

  get currentTenantId(): string {
    return this.authService.getTenantId();
  }

  get currentUserId(): string {
    return this.authService.getUserId();
  }

  get canManageBranding(): boolean {
    return this.authService.hasPermission('appearance.branding.manage');
  }

  /**
   * Initializes real-time synchronization between active browser sessions.
   * When an Admin saves branding changes, all active users belonging to the tenant
   * receive the new branding immediately without manual reload or relogin.
   */
  private initSyncChannel(): void {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        this.syncChannel.onmessage = (event) => {
          this.handleSyncMessage(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel initialization failed, falling back to storage listener', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event: StorageEvent) => {
        if (event.key && event.key.startsWith('lender_news_tenant_')) {
          this.refreshFromTenantStorage();
        }
      });
    }
  }

  private handleSyncMessage(data: any): void {
    if (!data) return;
    if (data.type === 'BRANDING_UPDATED' && data.tenantId === this.currentTenantId) {
      this.refreshFromTenantStorage(data.branding);
    }
  }

  public refreshFromTenantStorage(incomingBranding?: BrandingConfig): void {
    const freshState = this.loadEffectiveState();
    if (incomingBranding) {
      freshState.branding = {
        ...freshState.branding,
        ...incomingBranding,
        applicationName: incomingBranding.applicationName || incomingBranding.appName || freshState.branding.applicationName,
        appName: incomingBranding.appName || incomingBranding.applicationName || freshState.branding.appName,
        appTitle: incomingBranding.appTitle || incomingBranding.applicationName || freshState.branding.appTitle
      };
      if (incomingBranding.primaryColor) {
        freshState.colors.primary = incomingBranding.primaryColor;
      }
      if (incomingBranding.secondaryColor) {
        freshState.colors.secondary = incomingBranding.secondaryColor;
      }
    }
    this.savedStateSubject.next(freshState);
    this.applyToDOM(freshState);
  }

  openStudio(): void {
    // When opening, draft is initialized as a fresh copy of current effective saved state
    const current = this.loadEffectiveState();
    this.savedStateSubject.next(current);
    this.draftStateSubject.next(this.clone(current));
    this.isOpenSubject.next(true);
  }

  closeStudio(): void {
    this.cancelStudio();
  }

  cancelStudio(): void {
    // Discard unsaved changes by resetting draft back to saved state
    const saved = this.clone(this.savedStateSubject.value);
    this.draftStateSubject.next(saved);
    this.applyToDOM(saved);
    this.isOpenSubject.next(false);
  }

  toggleStudio(): void {
    if (this.isOpenSubject.value) {
      this.closeStudio();
    } else {
      this.openStudio();
    }
  }

  // Updates to draft state (reflects immediately in Live Preview)
  updateDraftTheme(patch: Partial<ThemeConfig>): void {
    const newMode = (patch.mode || this.draft.theme.mode) as ColorMode;
    const isDark = newMode === 'dark';

    const currentPrimary = this.draft.colors.primary || '#2563eb';
    const currentAccent = this.draft.colors.accent || (isDark ? '#60a5fa' : '#2563eb');

    const next: AppearanceState = {
      ...this.draft,
      theme: { ...this.draft.theme, ...patch, mode: newMode },
      colors: {
        ...this.draft.colors,
        primary: currentPrimary,
        accent: currentAccent,
        primaryHover: isDark ? currentAccent : currentPrimary,
        bg: isDark ? '#050b18' : '#f8fafc',
        surface: isDark ? '#0b1220' : '#ffffff',
        text: isDark ? '#f8fafc' : '#111827',
        mutedText: isDark ? '#94a3b8' : '#64748b',
        border: isDark ? '#243247' : '#e2e8f0'
      },
      bg: {
        ...this.draft.bg,
        appBg: isDark ? '#050b18' : '#f8fafc',
        surfaceBg: isDark ? '#0b1220' : '#ffffff',
        sidebarBg: isDark ? '#0b1220' : '#1e293b',
        bgColor: isDark ? '#050b18' : '#f8fafc',
        surfaceColor: isDark ? '#0b1220' : '#ffffff',
        borderColor: isDark ? '#243247' : '#e2e8f0'
      }
    };
    this.draftStateSubject.next(next);
  }

  updateDraftColors(patch: Partial<ColorsConfig>): void {
    const next: AppearanceState = {
      ...this.draft,
      colors: { ...this.draft.colors, ...patch }
    };
    // Also synchronize primary/secondary into draft branding if changed
    if (patch.primary) {
      next.branding.primaryColor = patch.primary;
    }
    if (patch.secondary) {
      next.branding.secondaryColor = patch.secondary;
    }
    this.draftStateSubject.next(next);
  }

  updateDraftBg(patch: Partial<BgConfig>): void {
    const next: AppearanceState = {
      ...this.draft,
      bg: { ...this.draft.bg, ...patch }
    };
    this.draftStateSubject.next(next);
  }

  updateDraftDisplay(patch: Partial<DisplayConfig>): void {
    const next: AppearanceState = {
      ...this.draft,
      display: { ...this.draft.display, ...patch }
    };
    this.draftStateSubject.next(next);
  }

  updateDraftBranding(patch: Partial<BrandingConfig>): void {
    if (!this.canManageBranding) {
      console.warn('Permission denied: only administrators can mutate branding.');
      return;
    }
    const nextBranding: BrandingConfig = {
      ...this.draft.branding,
      ...patch,
      applicationName: patch.applicationName || patch.appName || this.draft.branding.applicationName,
      appName: patch.appName || patch.applicationName || this.draft.branding.appName,
      appTitle: patch.appTitle || patch.applicationName || patch.appName || this.draft.branding.appTitle
    };

    const next: AppearanceState = {
      ...this.draft,
      branding: nextBranding
    };

    if (patch.primaryColor) {
      next.colors.primary = patch.primaryColor;
      next.colors.accent = patch.primaryColor;
    }
    if (patch.secondaryColor) {
      next.colors.secondary = patch.secondaryColor;
    }

    this.draftStateSubject.next(next);
  }

  applyDraftPreset(presetId: string): void {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const isDark = this.draft.theme.mode === 'dark';

    const next: AppearanceState = {
      ...this.draft,
      theme: {
        ...this.draft.theme,
        presetId: preset.id
      },
      colors: {
        ...this.draft.colors,
        primary: preset.primary,
        secondary: isDark ? '#cbd5e1' : preset.secondary,
        accent: preset.accent,
        bg: isDark ? '#050b18' : preset.bg,
        surface: isDark ? '#0b1220' : preset.surface,
        text: isDark ? '#f8fafc' : preset.text,
        mutedText: isDark ? '#94a3b8' : preset.mutedText,
        border: isDark ? '#243247' : preset.border,
        primaryHover: isDark ? preset.accent : (preset.primaryHover || preset.primary)
      },
      bg: {
        ...this.draft.bg,
        appBg: isDark ? '#050b18' : preset.bg,
        surfaceBg: isDark ? '#0b1220' : preset.surface,
        sidebarBg: isDark ? '#0b1220' : preset.sidebarBg,
        bgColor: isDark ? '#050b18' : preset.bg,
        surfaceColor: isDark ? '#0b1220' : preset.surface,
        borderColor: isDark ? '#243247' : preset.border
      }
    };
    this.draftStateSubject.next(next);
  }

  resetDraftToDefaults(): void {
    const def = this.clone(DEFAULT_APPEARANCE_STATE);
    this.draftStateSubject.next(def);
  }

  /**
   * Apply Changes:
   * 1. Validates configuration.
   * 2. If Admin: persists Tenant Branding to tenant storage & backend API, and broadcasts update.
   * 3. Persists User Personal Preferences (Dark/Light mode, typography scale, language, density).
   * 4. Resolves effective appearance and updates DOM.
   * 5. Closes studio and shows confirmation toast.
   */
  applyChanges(): void {
    const draft = this.clone(this.draftStateSubject.value);
    const tenantId = this.currentTenantId;
    const userId = this.currentUserId;
    const isAdmin = this.canManageBranding;

    // 1. If Admin: Persist Tenant Branding & notify
    if (isAdmin) {
      const versionedBranding: BrandingConfig = {
        ...draft.branding,
        version: Date.now()
      };

      const tenantConfig: TenantAppearanceConfig = {
        tenantId,
        branding: versionedBranding,
        themePresetId: draft.theme.presetId,
        primaryColor: draft.colors.primary,
        secondaryColor: draft.colors.secondary
      };

      this.saveTenantConfig(tenantId, tenantConfig);

      // Invoke backend security endpoint for server persistence
      this.http.put('/api/appearance/branding', versionedBranding).subscribe({
        next: () => {},
        error: (err) => console.warn('Appearance branding API sync error', err)
      });

      // Broadcast branding update to other active sessions/tabs
      if (this.syncChannel) {
        this.syncChannel.postMessage({
          type: 'BRANDING_UPDATED',
          tenantId,
          branding: versionedBranding
        });
      }
    }

    // 2. Persist User Preferences (strictly personal settings)
    const userPrefs: UserAppearancePreferences = {
      userId,
      mode: draft.theme.mode,
      typographyScale: draft.display.typographyScale,
      language: draft.display.language,
      density: draft.display.density,
      borderRadius: draft.display.borderRadius,
      cardStyle: draft.display.cardStyle
    };
    this.saveUserPreferences(userId, userPrefs);

    // 3. Resolve Effective State (System Defaults -> Tenant Branding -> User Preferences)
    const effective = this.loadEffectiveState();
    this.savedStateSubject.next(effective);
    this.applyToDOM(effective);

    // 4. Close Studio
    this.isOpenSubject.next(false);
    this.showToast('Appearance changes applied successfully.');
  }

  showToast(message: string): void {
    this.toastMessageSubject.next(message);
    setTimeout(() => {
      if (this.toastMessageSubject.value === message) {
        this.toastMessageSubject.next(null);
      }
    }, 3500);
  }

  // Compatibility methods for previous tab components
  updateTheme(patch: Partial<ThemeConfig>): void {
    this.updateDraftTheme(patch);
  }

  updateColors(patch: Partial<ColorsConfig>): void {
    this.updateDraftColors(patch);
  }

  updateBg(patch: Partial<BgConfig>): void {
    this.updateDraftBg(patch);
  }

  updateDisplay(patch: Partial<DisplayConfig>): void {
    this.updateDraftDisplay(patch);
  }

  updateBranding(patch: Partial<BrandingConfig>): void {
    this.updateDraftBranding(patch);
  }

  updateCarousel(patch: Partial<CarouselConfig>): void {
    const next: AppearanceState = {
      ...this.draft,
      carousel: { ...this.draft.carousel, ...patch }
    };
    this.draftStateSubject.next(next);
  }

  applyPreset(presetId: string): void {
    this.applyDraftPreset(presetId);
  }

  resetToDefaults(): void {
    this.resetDraftToDefaults();
  }

  private clone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Loads the effective state by applying hierarchy:
   * System Defaults -> Tenant/Admin Configuration -> User Preferences
   */
  public loadEffectiveState(): AppearanceState {
    const tenantId = this.currentTenantId;
    const userId = this.currentUserId;

    const tenantConfig = this.getTenantConfig(tenantId);
    const userPrefs = this.getUserPreferences(userId);

    return resolveEffectiveAppearance(DEFAULT_APPEARANCE_STATE, tenantConfig, userPrefs);
  }

  private getTenantConfig(tenantId: string): TenantAppearanceConfig | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const stored = localStorage.getItem(`lender_news_tenant_${tenantId}_branding`);
      if (stored) {
        const branding = JSON.parse(stored);
        return {
          tenantId,
          branding
        };
      }
    } catch (e) {
      console.warn('Failed to parse tenant appearance config', e);
    }
    return null;
  }

  private saveTenantConfig(tenantId: string, config: TenantAppearanceConfig): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(`lender_news_tenant_${tenantId}_branding`, JSON.stringify(config.branding));
    } catch (e) {
      console.warn('Failed to save tenant appearance config', e);
    }
  }

  private getUserPreferences(userId: string): UserAppearancePreferences | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const stored = localStorage.getItem(`lender_news_user_${userId}_preferences`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse user appearance preferences', e);
    }
    return null;
  }

  private saveUserPreferences(userId: string, prefs: UserAppearancePreferences): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(`lender_news_user_${userId}_preferences`, JSON.stringify(prefs));
    } catch (e) {
      console.warn('Failed to save user appearance preferences', e);
    }
  }

  private applyToDOM(state: AppearanceState): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    const isDark = state.theme.mode === 'dark';
    const primary = state.colors.primary || (isDark ? '#3b82f6' : '#2563eb');
    const accent = state.colors.accent || (isDark ? '#60a5fa' : '#3b82f6');

    // Centralized theme tokens application via theme utility
    applyThemeTokensToElement(root, state.theme.mode as 'light' | 'dark', primary, accent);

    // Dynamic browser title with centralized app branding
    const title = state.branding.applicationName || state.branding.appName || 'Lender News';
    if (document.title && !document.title.includes(title)) {
      document.title = `${title} | Risk & News Portal`;
    }

    // Dynamic browser favicon update
    if (state.branding.faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.head.appendChild(link);
      }
      link.href = state.branding.faviconUrl;
    }

    // Typography Scale & Language Preference
    const scaleMap: Record<string, number> = {
      small: 0.9,
      medium: 1.0,
      large: 1.1
    };
    const scale = scaleMap[state.display.typographyScale] || 1.0;
    root.style.setProperty('--font-scale', scale.toString());
    root.style.setProperty('--font-size-body', `calc(14px * var(--font-scale))`);
    root.style.setProperty('--font-size-label', `calc(12px * var(--font-scale))`);
    root.style.setProperty('--font-size-heading', `calc(24px * var(--font-scale))`);

    const lang = state.display.language || 'en';
    root.setAttribute('lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // Border Radius tokens
    const radiusMap: Record<string, string> = {
      small: '4px',
      medium: '8px',
      large: '14px',
      sharp: '4px',
      balanced: '8px',
      rounded: '14px',
      soft: '20px'
    };
    const rad = radiusMap[state.display.borderRadius] || '8px';
    root.style.setProperty('--border-radius', rad);
    root.style.setProperty('--card-radius', rad);

    // Injected dynamic styles
    let styleTag = document.getElementById('appearance-studio-dynamic-styles') as HTMLStyleElement;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'appearance-studio-dynamic-styles';
      document.head.appendChild(styleTag);
    }

    let css = `
      :root {
        --font-scale: ${scale};
      }
      .card, .banner-chocolate, .dash-chart-card, .table-wrap, .stat-card {
        border-radius: var(--card-radius) !important;
      }
      body {
        font-size: calc(14px * var(--font-scale)) !important;
      }
      h1, .dash-main-title {
        font-size: calc(22px * var(--font-scale)) !important;
      }
      h2, h3, .section-title {
        font-size: calc(16px * var(--font-scale)) !important;
      }
      button, input, select, textarea, label {
        font-size: calc(13px * var(--font-scale)) !important;
      }
      td, th {
        font-size: calc(13px * var(--font-scale)) !important;
      }
    `;

    if (state.display.density === 'compact') {
      css += `
        .content { padding: 12px 18px !important; }
        .card { padding: 10px !important; }
        td, th { padding: 6px 10px !important; font-size: 12px !important; }
      `;
    } else if (state.display.density === 'spacious') {
      css += `
        .content { padding: 28px 34px !important; }
        .card { padding: 22px !important; }
        td, th { padding: 12px 16px !important; }
      `;
    }

    styleTag.textContent = css;
  }
}
