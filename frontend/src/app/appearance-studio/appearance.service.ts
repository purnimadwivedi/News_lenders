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
  UserAppearance,
  THEME_PRESETS,
  resolveEffectiveAppearance
} from './appearance.models';

export const DEFAULT_LOGO = DEFAULT_AUTH_LOGO;

export const DEFAULT_APP_NAME = 'News Radar';
const LEGACY_APP_NAME = 'Lender News';

// Branding saved before the rename still carries the old default name; treat it as the default.
// Likewise, never-customised branding (version 1) still carries the old Enterprise Blue default colour.
function upgradeLegacyAppName(branding: any): boolean {
  if (!branding || typeof branding !== 'object') return false;
  let changed = false;
  if (branding.version === 1 && typeof branding.primaryColor === 'string' && branding.primaryColor.toUpperCase() === '#2563EB') {
    branding.primaryColor = '#F37819';
    changed = true;
  }
  for (const key of ['applicationName', 'appName', 'appTitle']) {
    if (branding[key] === LEGACY_APP_NAME) {
      branding[key] = DEFAULT_APP_NAME;
      changed = true;
    }
  }
  return changed;
}

function isCorruptedLogo(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  if (url.length === 9122) return true;
  if (url.startsWith('data:image/jpeg;base64,') && url.length < 12000) return true;
  return false;
}


export const DEFAULT_APPEARANCE_STATE: AppearanceState = {
  theme: {
    mode: 'light',
    presetId: 'imgc-orange'
  },
  colors: {
    primary: '#F37819',
    secondary: '#475569',
    accent: '#EA580C',
    bg: '#F0F2F5',
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
    primaryHover: '#EA580C'
  },
  bg: {
    style: 'solid',
    appBg: '#F0F2F5',
    surfaceBg: '#FFFFFF',
    sidebarBg: '#404040',
    bgColor: '#F0F2F5',
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
    applicationName: DEFAULT_APP_NAME,
    appName: DEFAULT_APP_NAME,
    logoUrl: DEFAULT_LOGO,
    loginLogo: DEFAULT_LOGO,
    sidebarLogo: DEFAULT_LOGO,
    favicon: DEFAULT_LOGO,
    faviconUrl: DEFAULT_LOGO,
    termsPrivacyText: 'By signing in you agree to our Terms of Service and Privacy Policy.',
    appTitle: DEFAULT_APP_NAME,
    appSubtitle: 'IMGC Reviewer Portal',
    logoBorderRadius: 10,
    primaryColor: '#F37819',
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

    // User-aware theme state: load authenticated user's appearance or wipe on logout
    this.authService.userChanged$.subscribe((userId) => {
      if (userId) {
        this.loadUserAppearance(userId);
      } else {
        this.onLogout();
      }
    });

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
            let changed = upgradeLegacyAppName(parsed);
            if (parsed && isCorruptedLogo(parsed.logoUrl)) {
              parsed.logoUrl = DEFAULT_LOGO;
              changed = true;
            }
            if (changed) localStorage.setItem(key, JSON.stringify(parsed));
          }
        } else if (key && (key.startsWith('appearance:') || (key.startsWith('lender_news_user_') && key.endsWith('_appearance')))) {
          const raw = localStorage.getItem(key);
          const parsed = raw ? JSON.parse(raw) : null;
          if (parsed && upgradeLegacyAppName(parsed.branding)) {
            localStorage.setItem(key, JSON.stringify(parsed));
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
        if (event.key && (event.key === `appearance:${this.currentUserId}` || event.key === `lender_news_user_${this.currentUserId}_appearance`)) {
          this.loadUserAppearance(this.currentUserId);
        } else if (event.key && event.key.startsWith('lender_news_tenant_')) {
          this.refreshFromTenantStorage();
        }
      });
    }
  }

  private handleSyncMessage(data: any): void {
    if (!data) return;
    // Only synchronize appearance if the update belongs strictly to the CURRENT user
    if (data.type === 'USER_APPEARANCE_UPDATED' && data.userId === this.currentUserId) {
      const freshUserAppearance = this.mergeWithDefaults(data.state);
      this.savedStateSubject.next(freshUserAppearance);
      this.draftStateSubject.next(this.clone(freshUserAppearance));
      if (this.authService.isAuthenticated() && !this.isAuthRoute()) {
        this.applyToDOM(freshUserAppearance);
      }
    } else if (data.type === 'BRANDING_UPDATED' && data.tenantId === this.currentTenantId) {
      this.refreshFromTenantStorage(data.branding);
    }
  }

  public refreshFromTenantStorage(incomingBranding?: BrandingConfig): void {
    // When tenant branding updates, update organization branding assets only — NEVER overwrite personal theme colors
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
   * 1. Persists appearance strictly for CURRENT authenticated user ID (never shared/global).
   * 2. Namespaces localStorage key: appearance:${currentUser.id}
   * 3. Syncs with backend API PUT /api/appearance (authenticated session).
   * 4. Updates live DOM tokens and in-memory saved state for current user.
   * 5. Closes studio and shows confirmation toast.
   */
  applyChanges(): void {
    const draft = this.clone(this.draftStateSubject.value);
    const userId = this.currentUserId;
    const isAdmin = this.canManageBranding;

    // 1. Persist user-scoped configuration to namespaced localStorage: appearance:${userId}
    this.saveUserAppearance(userId, draft);

    // Also persist personal preferences for compatibility
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

    // 2. Invoke server /api/appearance endpoint (determined by authenticated session)
    this.http.put('/api/appearance', draft).subscribe({
      next: () => {},
      error: (err) => console.warn('User appearance API sync error', err)
    });

    // 3. If Admin updated branding properties, persist tenant branding
    if (isAdmin) {
      const versionedBranding: BrandingConfig = {
        ...draft.branding,
        version: Date.now()
      };
      this.saveTenantConfig(this.currentTenantId, {
        tenantId: this.currentTenantId,
        branding: versionedBranding
      });
      this.http.put('/api/appearance/branding', versionedBranding).subscribe({
        next: () => {},
        error: () => {}
      });
    }

    // 4. Update in-memory state & apply directly to DOM for current user
    this.savedStateSubject.next(draft);
    this.applyToDOM(draft);

    // 5. Broadcast appearance update only to tabs of the SAME user
    if (this.syncChannel) {
      this.syncChannel.postMessage({
        type: 'USER_APPEARANCE_UPDATED',
        userId,
        state: draft
      });
    }

    // 6. Close Studio & show confirmation toast
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
   * Loads the appearance configuration belonging to the currently authenticated user.
   */
  public loadEffectiveState(): AppearanceState {
    const userId = this.currentUserId;
    return this.withTenantBranding(this.getUserAppearance(userId));
  }

  /**
   * Branding belongs to the organisation, not the user: a user's saved appearance may hold an old
   * copy, so the organisation's saved branding always takes precedence when it exists.
   */
  private withTenantBranding(state: AppearanceState): AppearanceState {
    const tenant = this.getTenantConfig(this.currentTenantId);
    if (!tenant || !tenant.branding) return state;
    const b = tenant.branding;
    const logo = (url: string | undefined, fallback: string) => (isCorruptedLogo(url) ? fallback : (url as string));
    return {
      ...state,
      branding: {
        ...state.branding,
        ...b,
        applicationName: b.applicationName || b.appName || state.branding.applicationName,
        appName: b.appName || b.applicationName || state.branding.appName,
        logoUrl: logo(b.logoUrl, DEFAULT_LOGO),
        loginLogo: logo(b.loginLogo, logo(b.logoUrl, DEFAULT_LOGO)),
        sidebarLogo: logo(b.sidebarLogo, logo(b.logoUrl, DEFAULT_LOGO)),
        favicon: b.favicon || b.faviconUrl || DEFAULT_LOGO,
        faviconUrl: b.faviconUrl || b.favicon || DEFAULT_LOGO
      }
    };
  }

  /**
   * Loads appearance configuration for a specific user ID.
   * Priority: appearance:${userId} -> lender_news_user_${userId}_appearance -> defaults
   */
  public getUserAppearance(userId: string): AppearanceState {
    if (typeof localStorage !== 'undefined' && userId) {
      // 1. Primary namespaced key: appearance:${userId}
      const primaryKey = `appearance:${userId}`;
      const stored = localStorage.getItem(primaryKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return this.mergeWithDefaults(parsed);
        } catch (e) {
          console.warn('Failed to parse ' + primaryKey, e);
        }
      }

      // 2. Alternative user key: lender_news_user_${userId}_appearance
      const altKey = `lender_news_user_${userId}_appearance`;
      const storedAlt = localStorage.getItem(altKey);
      if (storedAlt) {
        try {
          const parsed = JSON.parse(storedAlt);
          return this.mergeWithDefaults(parsed);
        } catch (e) {}
      }

      // 3. User personal preferences
      const prefs = this.getUserPreferences(userId);
      if (prefs) {
        const tenantConfig = this.getTenantConfig(this.currentTenantId);
        return resolveEffectiveAppearance(DEFAULT_APPEARANCE_STATE, tenantConfig, prefs);
      }
    }

    // Default clean configuration (with organization branding logo/title if available)
    const tenantConfig = this.getTenantConfig(this.currentTenantId);
    if (tenantConfig && tenantConfig.branding) {
      const def = this.clone(DEFAULT_APPEARANCE_STATE);
      def.branding = {
        ...def.branding,
        ...tenantConfig.branding,
        applicationName: tenantConfig.branding.applicationName || tenantConfig.branding.appName || def.branding.applicationName,
        appName: tenantConfig.branding.appName || tenantConfig.branding.applicationName || def.branding.appName,
        logoUrl: isCorruptedLogo(tenantConfig.branding.logoUrl) ? DEFAULT_LOGO : (tenantConfig.branding.logoUrl || def.branding.logoUrl),
        loginLogo: isCorruptedLogo(tenantConfig.branding.loginLogo) ? DEFAULT_LOGO : (tenantConfig.branding.loginLogo || def.branding.loginLogo),
        sidebarLogo: isCorruptedLogo(tenantConfig.branding.sidebarLogo) ? DEFAULT_LOGO : (tenantConfig.branding.sidebarLogo || def.branding.sidebarLogo)
      };
      return def;
    }

    return this.clone(DEFAULT_APPEARANCE_STATE);
  }

  public saveUserAppearance(userId: string, state: AppearanceState): void {
    if (typeof localStorage === 'undefined' || !userId) return;
    try {
      const userAppearance: UserAppearance = {
        userId,
        theme: state.theme,
        colors: state.colors,
        bg: state.bg,
        display: state.display,
        branding: state.branding,
        carousel: state.carousel,
        updatedAt: Date.now()
      };
      localStorage.setItem(`appearance:${userId}`, JSON.stringify(userAppearance));
      localStorage.setItem(`lender_news_user_${userId}_appearance`, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save appearance for user ' + userId, e);
    }
  }

  public mergeWithDefaults(raw: any): AppearanceState {
    const def = this.clone(DEFAULT_APPEARANCE_STATE);
    if (!raw) return def;

    return {
      theme: { ...def.theme, ...(raw.theme || {}) },
      colors: { ...def.colors, ...(raw.colors || {}) },
      bg: { ...def.bg, ...(raw.bg || {}) },
      display: { ...def.display, ...(raw.display || {}) },
      branding: {
        ...def.branding,
        ...(raw.branding || {}),
        applicationName: raw.branding?.applicationName || raw.branding?.appName || def.branding.applicationName,
        appName: raw.branding?.appName || raw.branding?.applicationName || def.branding.appName,
        termsPrivacyText: raw.branding?.termsPrivacyText !== undefined ? raw.branding.termsPrivacyText : def.branding.termsPrivacyText,
        logoUrl: isCorruptedLogo(raw.branding?.logoUrl) ? DEFAULT_LOGO : (raw.branding?.logoUrl || def.branding.logoUrl),
        loginLogo: isCorruptedLogo(raw.branding?.loginLogo) ? DEFAULT_LOGO : (raw.branding?.loginLogo || def.branding.loginLogo),
        sidebarLogo: isCorruptedLogo(raw.branding?.sidebarLogo) ? DEFAULT_LOGO : (raw.branding?.sidebarLogo || def.branding.sidebarLogo),
        favicon: raw.branding?.favicon || raw.branding?.faviconUrl || def.branding.favicon,
        faviconUrl: raw.branding?.faviconUrl || raw.branding?.favicon || def.branding.faviconUrl
      },
      carousel: { ...def.carousel, ...(raw.carousel || {}) }
    };
  }

  public loadUserAppearance(userId: string): void {
    const userState = this.getUserAppearance(userId);
    this.savedStateSubject.next(userState);
    this.draftStateSubject.next(this.clone(userState));
    if (this.authService.isAuthenticated() && !this.isAuthRoute()) {
      this.applyToDOM(userState);
    } else {
      this.clearFromDOM();
    }

    // Server-side user appearance sync via GET /api/appearance
    this.http.get<any>('/api/appearance').subscribe({
      next: (res) => {
        if (res && (res.theme || res.colors)) {
          const merged = this.mergeWithDefaults(res);
          if (this.authService.getUserId() === userId) {
            this.savedStateSubject.next(merged);
            this.draftStateSubject.next(this.clone(merged));
            if (this.authService.isAuthenticated() && !this.isAuthRoute()) {
              this.applyToDOM(merged);
            }
          }
        }
      },
      error: () => {}
    });
  }

  public onLogout(): void {
    // Clear user state from active memory & draft (organisation branding stays for the login page)
    const def = this.withTenantBranding(this.clone(DEFAULT_APPEARANCE_STATE));
    this.savedStateSubject.next(def);
    this.draftStateSubject.next(def);
    this.isOpenSubject.next(false);
    this.clearFromDOM();
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
    const primary = state.colors.primary || (isDark ? '#3b82f6' : '#F37819');
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
    const title = state.branding.applicationName || state.branding.appName || DEFAULT_APP_NAME;
    if (document.title && !document.title.includes(title)) {
      document.title = `${title} | Risk & News Portal`;
    }

    // Dynamic browser favicon update (persisted across the entire application)
    const favicon = state.branding.favicon || state.branding.faviconUrl;
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (favicon) {
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = favicon;
    } else if (link) {
      link.href = DEFAULT_LOGO;
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
      appElement.style.setProperty('--font-size-body', '14px'); // scaling is done with zoom on the content
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

    const brandVars = this.brandCssVars(state);
    let css = `
      .authenticated-app {
        ${brandVars}
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
        font-size: 14px !important;
      }
      .authenticated-app h1, 
      .authenticated-app .dash-main-title {
        font-size: 20px !important;
        font-weight: 600 !important;
        letter-spacing: -0.01em !important;
      }
      .authenticated-app h2:not(.banner-title), 
      .authenticated-app h3:not(.dash-chart-title), 
      .authenticated-app .section-title {
        font-size: 16px !important;
      }
      .authenticated-app button, 
      .authenticated-app input, 
      .authenticated-app select, 
      .authenticated-app textarea, 
      .authenticated-app label {
        font-size: 12px !important;
      }
      /* Tables use the same 12px body size as the dashboard lists */
      .authenticated-app td, 
      .authenticated-app th {
        font-size: 12px !important;
      }
      /* Typography scale: zoom the page content so every element (cards, charts, tables) scales together.
         Applied to main's children (zoom on <main> itself is ignored here); the header keeps its fixed
         height so it stays aligned with the sidebar brand. */
      .authenticated-app main.content > *:not(.global-header) {
        zoom: ${scale};
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

  /**
   * CSS variables the app's own styles read (styles.css / app.component), so Theme, Colors and BG
   * changes show up across the workspace. Each style keeps the IMGC Orange value as its fallback.
   */
  private brandCssVars(state: AppearanceState): string {
    const safe = (v: string | undefined, fallback: string) =>
      v && /^#[0-9a-f]{3,8}$/i.test(v.trim()) ? v.trim() : fallback;
    const isDark = state.theme.mode === 'dark';
    const primary = safe(state.colors.primary, '#F37819');
    const accent = safe(state.colors.accent, primary);
    const sidebar = safe(state.bg.sidebarBg, '#404040');

    let contentBg = safe(state.bg.appBg || state.colors.bg, '#F0F2F5');
    if (state.bg.style === 'gradient' && state.bg.gradientPreset && !/[;{}]/.test(state.bg.gradientPreset)) {
      contentBg = state.bg.gradientPreset;
    } else if (state.bg.style === 'image' && state.bg.customImageUrl) {
      contentBg = `url("${state.bg.customImageUrl.replace(/"/g, '%22')}") center / cover no-repeat fixed`;
    }

    const vars: string[] = [
      `--app-primary: ${primary};`,
      `--app-accent: ${accent};`,
      `--app-primary-soft: color-mix(in srgb, ${primary} 10%, #ffffff);`,
      `--app-primary-soft-2: color-mix(in srgb, ${primary} 18%, #ffffff);`,
      `--app-primary-shadow: color-mix(in srgb, ${primary} 35%, transparent);`,
      `--app-banner-bg: color-mix(in srgb, ${primary} 35%, #1a0d05);`
    ];
    // Dark mode has its own sidebar/background rules; only drive them in light mode.
    if (!isDark) {
      vars.push(`--app-sidebar-bg: ${sidebar};`);
      vars.push(`--app-sidebar-fg: ${isLightColor(sidebar) ? '#334155' : '#9ca3af'};`);
      vars.push(`--app-sidebar-fg-strong: ${isLightColor(sidebar) ? '#0f172a' : '#ffffff'};`);
      vars.push(`--app-content-bg: ${contentBg};`);
    }
    return vars.join(' ');
  }
}

function isLightColor(hex: string): boolean {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.6;
}

