import { DEFAULT_AUTH_LOGO } from '../auth-logo';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { applyThemeTokensToElement, removeThemeTokensFromElement } from '../theme';
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

export const DEFAULT_LOGO = DEFAULT_AUTH_LOGO;

function isCorruptedLogo(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  if (url.length === 9122) return true;
  if (url.startsWith('data:image/jpeg;base64,') && url.length < 12000) return true;
  return false;
}


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
    this.cleanupCorruptedLocalStorage();
    this.initSyncChannel();
    if (this.authService.isAuthenticated() && !this.isAuthRoute()) {
      this.applyToDOM(this.savedStateSubject.value);
    } else {
      this.clearFromDOM();
    }
  }

  get themeMode(): string {
    return this.savedStateSubject.value.theme.mode || 'light';
  }

  get isDark(): boolean {
    return this.themeMode === 'dark';
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
    const b = this.savedStateSubject.value.branding;
    if (b && isCorruptedLogo(b.logoUrl)) {
      b.logoUrl = DEFAULT_LOGO;
    }
    return b;
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
  
  private cleanupCorruptedLocalStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('lender_news_tenant_') && key.endsWith('_branding')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && isCorruptedLogo(parsed.logoUrl)) {
              parsed.logoUrl = DEFAULT_LOGO;
              localStorage.setItem(key, JSON.stringify(parsed));
            }
          }
        }
      }
    } catch (_) {}
  }

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
      const safeLogo = isCorruptedLogo(incomingBranding.logoUrl) ? DEFAULT_LOGO : incomingBranding.logoUrl;
      freshState.branding = {
        ...freshState.branding,
        ...incomingBranding,
        logoUrl: safeLogo,
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

    const effective = resolveEffectiveAppearance(DEFAULT_APPEARANCE_STATE, tenantConfig, userPrefs);
    if (isCorruptedLogo(effective.branding.logoUrl)) {
      effective.branding.logoUrl = DEFAULT_LOGO;
    }
    return effective;
  }

  private getTenantConfig(tenantId: string): TenantAppearanceConfig | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const stored = localStorage.getItem(`lender_news_tenant_${tenantId}_branding`);
      if (stored) {
        const branding = JSON.parse(stored);
        if (branding && isCorruptedLogo(branding.logoUrl)) {
          branding.logoUrl = DEFAULT_LOGO;
          try {
            localStorage.setItem(`lender_news_tenant_${tenantId}_branding`, JSON.stringify(branding));
          } catch (_) {}
        }
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

  public isAuthRoute(): boolean {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname || '';
    return path === '/login' || path.endsWith('/login') || path.includes('/logout') || path.includes('/session-expired');
  }

  public applyCurrentToDOM(): void {
    if (this.authService.isAuthenticated() && !this.isAuthRoute()) {
      this.applyToDOM(this.savedStateSubject.value);
    } else {
      this.clearFromDOM();
    }
  }

  public clearFromDOM(): void {
    if (typeof document === 'undefined') return;

    // 1. Remove theme tokens & classes from document root, body, and app container
    removeThemeTokensFromElement(document.documentElement);
    if (document.body) {
      removeThemeTokensFromElement(document.body);
    }
    const appEl = document.querySelector('.authenticated-app') as HTMLElement;
    if (appEl) {
      removeThemeTokensFromElement(appEl);
    }

    // 2. Clear dynamic injected styles so no font scaling or element styles leak
    const styleTag = document.getElementById('appearance-studio-dynamic-styles');
    if (styleTag) {
      styleTag.textContent = '';
    }

    // 3. Reset document title to base unchanged auth title
    document.title = 'IMGC Lender News Portal';

    // 4. Reset root lang & dir
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
  }

  private applyToDOM(state: AppearanceState): void {
    if (typeof document === 'undefined') return;

    // Strict Authentication Guard:
    // Appearance Studio customization must NEVER affect the Logout/Login/Authentication page!
    if (!this.authService.isAuthenticated() || this.isAuthRoute()) {
      this.clearFromDOM();
      return;
    }

    const isDark = state.theme.mode === 'dark';
    const primary = state.colors.primary || (isDark ? '#3b82f6' : '#2563eb');
    const accent = state.colors.accent || (isDark ? '#60a5fa' : '#3b82f6');

    // Centralized theme tokens application strictly scoped to the authenticated app container
    const appElement = (document.querySelector('.authenticated-app') ||
                        document.querySelector('.app-layout') ||
                        document.querySelector('.app-shell')) as HTMLElement;

    if (appElement) {
      applyThemeTokensToElement(appElement, state.theme.mode as 'light' | 'dark', primary, accent);
    } else {
      // Container not yet mounted in DOM; schedule for next frame
      setTimeout(() => {
        const el = document.querySelector('.authenticated-app') as HTMLElement;
        if (el && this.authService.isAuthenticated() && !this.isAuthRoute()) {
          applyThemeTokensToElement(el, state.theme.mode as 'light' | 'dark', primary, accent);
        }
      }, 50);
    }

    // Dynamic browser title with centralized app branding (ONLY for authenticated app)
    const title = state.branding.applicationName || state.branding.appName || 'Lender News';
    if (document.title && !document.title.includes(title)) {
      document.title = `${title} | Risk & News Portal`;
    }

    // Dynamic browser favicon update (ONLY for authenticated app)
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

    if (appElement) {
      appElement.style.setProperty('--font-scale', scale.toString());
      appElement.style.setProperty('--font-size-body', `calc(14px * var(--font-scale))`);
      appElement.style.setProperty('--font-size-label', `calc(12px * var(--font-scale))`);
      appElement.style.setProperty('--font-size-heading', `calc(24px * var(--font-scale))`);
      appElement.style.setProperty('--border-radius', rad);
      appElement.style.setProperty('--card-radius', rad);
    }

    const lang = state.display.language || 'en';
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // Injected dynamic styles: STRICTLY SCOPED to .authenticated-app
    let styleTag = document.getElementById('appearance-studio-dynamic-styles') as HTMLStyleElement;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'appearance-studio-dynamic-styles';
      document.head.appendChild(styleTag);
    }

    let css = `
      .authenticated-app {
        --font-scale: ${scale};
        --card-radius: ${rad};
        --border-radius: ${rad};
      }
      .authenticated-app .card, 
      .authenticated-app .banner-chocolate, 
      .authenticated-app .dash-chart-card, 
      .authenticated-app .table-wrap, 
      .authenticated-app .stat-card {
        border-radius: var(--card-radius) !important;
      }
      .authenticated-app {
        font-size: calc(14px * var(--font-scale)) !important;
      }
      .authenticated-app h1, 
      .authenticated-app .dash-main-title {
        font-size: calc(22px * var(--font-scale)) !important;
      }
      .authenticated-app h2, 
      .authenticated-app h3, 
      .authenticated-app .section-title {
        font-size: calc(16px * var(--font-scale)) !important;
      }
      .authenticated-app button, 
      .authenticated-app input, 
      .authenticated-app select, 
      .authenticated-app textarea, 
      .authenticated-app label {
        font-size: calc(13px * var(--font-scale)) !important;
      }
      .authenticated-app td, 
      .authenticated-app th {
        font-size: calc(13px * var(--font-scale)) !important;
      }
    `;

    if (state.display.density === 'compact') {
      css += `
        .authenticated-app .content { padding: 12px 18px !important; }
        .authenticated-app .card { padding: 10px !important; }
        .authenticated-app td, .authenticated-app th { padding: 6px 10px !important; font-size: 12px !important; }
      `;
    } else if (state.display.density === 'spacious') {
      css += `
        .authenticated-app .content { padding: 28px 34px !important; }
        .authenticated-app .card { padding: 22px !important; }
        .authenticated-app td, .authenticated-app th { padding: 12px 16px !important; }
      `;
    }

    styleTag.textContent = css;
  }
}

