export type ColorMode = 'light' | 'dark' | 'system';
export type TypographyScale = 'small' | 'medium' | 'large';
export type LanguageCode =
  | 'en'
  | 'hi'
  | 'ta'
  | 'te'
  | 'ml'
  | 'fr'
  | 'es'
  | 'de'
  | 'ja'
  | 'zh'
  | 'ar';

export interface DisplayLanguageOption {
  code: LanguageCode;
  label: string;
}

export const DISPLAY_LANGUAGES: DisplayLanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' },
  { code: 'fr', label: 'Français (French)' },
  { code: 'es', label: 'Español (Spanish)' },
  { code: 'de', label: 'Deutsch (German)' },
  { code: 'ja', label: '日本語 (Japanese)' },
  { code: 'zh', label: '中文 (Chinese)' },
  { code: 'ar', label: 'العربية (Arabic)' }
];

export const DISPLAY_CONFIG = {
  typographyScale: {
    small: { scale: 0.9, label: 'Small' },
    medium: { scale: 1.0, label: 'Medium' },
    large: { scale: 1.1, label: 'Large' }
  },
  languages: DISPLAY_LANGUAGES
};

export type DisplayDensity = 'compact' | 'comfortable' | 'spacious';
export type BorderRadiusSize = 'small' | 'medium' | 'large';
export type CardStyle = 'flat' | 'border' | 'shadow';
export type BgStyle = 'solid' | 'gradient' | 'image';

export interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
  sidebarBg: string;
  headerBg: string;
  isDark?: boolean;
  primaryHover?: string;
}

export interface ColorsConfig {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  // Compatibility getters/properties
  low?: string;
  medium?: string;
  high?: string;
  critical?: string;
  primaryHover?: string;
}

export interface BgConfig {
  style: BgStyle;
  appBg: string;
  surfaceBg: string;
  sidebarBg: string;
  customImageUrl?: string;
  gradientPreset?: string;
  // Compatibility fields
  bgColor?: string;
  surfaceColor?: string;
  surface2Color?: string;
  borderColor?: string;
  bgOpacity?: number;
  bgBlur?: number;
}

export interface DisplayConfig {
  typographyScale: TypographyScale;
  language: LanguageCode;
  density: DisplayDensity;
  borderRadius: BorderRadiusSize;
  cardStyle: CardStyle;
  headerHeight: 'compact' | 'standard' | 'tall';
  sidebarWidth: 'narrow' | 'standard' | 'wide';
  // Compatibility fields
  fontFamily?: string;
  showStatusBadges?: boolean;
  enableAnimations?: boolean;
}

export interface BrandingConfig {
  applicationName: string;
  appName: string;
  logoUrl: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  // Compatibility fields
  appTitle?: string;
  appSubtitle?: string;
  logoBorderRadius?: number;
  version?: string | number;
}

export interface TenantAppearanceConfig {
  tenantId: string;
  branding: BrandingConfig;
  themePresetId?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface UserAppearancePreferences {
  userId: string;
  mode?: ColorMode;
  typographyScale?: TypographyScale;
  language?: LanguageCode;
  density?: DisplayDensity;
  borderRadius?: BorderRadiusSize;
  cardStyle?: CardStyle;
}

export interface CarouselSlide {
  id: string;
  title: string;
  description: string;
  badge: string;
  buttonText?: string;
  buttonUrl?: string;
  bgGradient: string;
  active: boolean;
}

export interface CarouselConfig {
  enabled: boolean;
  intervalSeconds: number;
  slides: CarouselSlide[];
}

export interface ThemeConfig {
  mode: ColorMode;
  presetId: string;
}

export interface AppearanceState {
  theme: ThemeConfig;
  colors: ColorsConfig;
  bg: BgConfig;
  display: DisplayConfig;
  branding: BrandingConfig;
  carousel: CarouselConfig;
}

/**
 * Resolves effective appearance using strict configuration hierarchy:
 * System Defaults -> Tenant/Admin Configuration -> User Preferences -> Runtime Theme
 *
 * User cannot override: Logo, Application Name, Brand Identity (Tenant controlled).
 * User can override: Dark/Light Mode, Typography scale, Language, Display density (User controlled).
 */
export function resolveEffectiveAppearance(
  systemDefaults: AppearanceState,
  tenantConfig?: TenantAppearanceConfig | null,
  userPrefs?: UserAppearancePreferences | null
): AppearanceState {
  // 1. Start from deep clone of system defaults
  const resolved: AppearanceState = JSON.parse(JSON.stringify(systemDefaults));

  // 2. Overlay Tenant/Admin Configuration
  if (tenantConfig) {
    if (tenantConfig.branding) {
      resolved.branding = {
        ...resolved.branding,
        ...tenantConfig.branding,
        applicationName: tenantConfig.branding.applicationName || tenantConfig.branding.appName || resolved.branding.applicationName,
        appName: tenantConfig.branding.appName || tenantConfig.branding.applicationName || resolved.branding.appName,
        appTitle: tenantConfig.branding.appTitle || tenantConfig.branding.applicationName || tenantConfig.branding.appName || resolved.branding.appTitle
      };

      if (tenantConfig.branding.primaryColor) {
        resolved.colors.primary = tenantConfig.branding.primaryColor;
      }
      if (tenantConfig.branding.secondaryColor) {
        resolved.colors.secondary = tenantConfig.branding.secondaryColor;
      }
    }

    if (tenantConfig.themePresetId) {
      const preset = THEME_PRESETS.find(p => p.id === tenantConfig.themePresetId);
      if (preset) {
        resolved.theme.presetId = preset.id;
        resolved.colors.primary = preset.primary;
        resolved.colors.accent = preset.accent;
      }
    }
  }

  // 3. Overlay User Preferences (Personal settings only — strictly CANNOT override tenant branding)
  if (userPrefs) {
    if (userPrefs.mode) {
      resolved.theme.mode = userPrefs.mode;
    }
    if (userPrefs.typographyScale) {
      resolved.display.typographyScale = userPrefs.typographyScale;
    }
    if (userPrefs.language) {
      resolved.display.language = userPrefs.language;
    }
    if (userPrefs.density) {
      resolved.display.density = userPrefs.density;
    }
    if (userPrefs.borderRadius) {
      resolved.display.borderRadius = userPrefs.borderRadius;
    }
    if (userPrefs.cardStyle) {
      resolved.display.cardStyle = userPrefs.cardStyle;
    }
  }

  return resolved;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'enterprise-blue',
    name: 'Enterprise Blue',
    primary: '#2563EB',
    secondary: '#475569',
    accent: '#3B82F6',
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',
    mutedText: '#64748B',
    border: '#E2E8F0',
    sidebarBg: '#1E293B',
    headerBg: '#FFFFFF'
  },
  {
    id: 'navy-professional',
    name: 'Navy Professional',
    primary: '#1E40AF',
    secondary: '#334155',
    accent: '#60A5FA',
    bg: '#F1F5F9',
    surface: '#FFFFFF',
    text: '#0F172A',
    mutedText: '#64748B',
    border: '#CBD5E1',
    sidebarBg: '#0F172A',
    headerBg: '#FFFFFF'
  },
  {
    id: 'modern-purple',
    name: 'Modern Purple',
    primary: '#7C3AED',
    secondary: '#6B7280',
    accent: '#A78BFA',
    bg: '#FAF5FF',
    surface: '#FFFFFF',
    text: '#3B0764',
    mutedText: '#7E22CE',
    border: '#E9D5FF',
    sidebarBg: '#2E1065',
    headerBg: '#FFFFFF'
  },
  {
    id: 'emerald-green',
    name: 'Emerald Green',
    primary: '#059669',
    secondary: '#4B5563',
    accent: '#34D399',
    bg: '#F0FDF4',
    surface: '#FFFFFF',
    text: '#064E3B',
    mutedText: '#047857',
    border: '#BBF7D0',
    sidebarBg: '#064E3B',
    headerBg: '#FFFFFF'
  },
  {
    id: 'minimal-gray',
    name: 'Minimal Gray',
    primary: '#374151',
    secondary: '#6B7280',
    accent: '#9CA3AF',
    bg: '#F9FAFB',
    surface: '#FFFFFF',
    text: '#111827',
    mutedText: '#6B7280',
    border: '#E5E7EB',
    sidebarBg: '#1F2937',
    headerBg: '#FFFFFF'
  },
  {
    id: 'soft-coaching',
    name: 'Soft Coaching',
    primary: '#0D9488',
    secondary: '#64748B',
    accent: '#2DD4BF',
    bg: '#F0FDFA',
    surface: '#FFFFFF',
    text: '#134E4A',
    mutedText: '#0F766E',
    border: '#CCFBF1',
    sidebarBg: '#115E59',
    headerBg: '#FFFFFF'
  },
  {
    id: 'warm-orange',
    name: 'Warm Orange',
    primary: '#EA580C',
    secondary: '#78716C',
    accent: '#FB923C',
    bg: '#FFF7ED',
    surface: '#FFFFFF',
    text: '#7C2D12',
    mutedText: '#C2410C',
    border: '#FED7AA',
    sidebarBg: '#431407',
    headerBg: '#FFFFFF'
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    primary: '#E11D48',
    secondary: '#71717A',
    accent: '#FB7185',
    bg: '#FFF1F2',
    surface: '#FFFFFF',
    text: '#881337',
    mutedText: '#BE123C',
    border: '#FECDD3',
    sidebarBg: '#4C0519',
    headerBg: '#FFFFFF'
  },
  {
    id: 'glass-enterprise',
    name: 'Glass Enterprise',
    primary: '#0284C7',
    secondary: '#64748B',
    accent: '#38BDF8',
    bg: '#F0F9FF',
    surface: '#FFFFFF',
    text: '#0C4A6E',
    mutedText: '#0369A1',
    border: '#BAE6FD',
    sidebarBg: '#082F49',
    headerBg: '#FFFFFF'
  },
  {
    id: 'slate-corporate',
    name: 'Slate Corporate',
    primary: '#475569',
    secondary: '#64748B',
    accent: '#94A3B8',
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',
    mutedText: '#475569',
    border: '#E2E8F0',
    sidebarBg: '#334155',
    headerBg: '#FFFFFF'
  },
  {
    id: 'indigo-classic',
    name: 'Indigo Classic',
    primary: '#4F46E5',
    secondary: '#64748B',
    accent: '#818CF8',
    bg: '#EEF2FF',
    surface: '#FFFFFF',
    text: '#312E81',
    mutedText: '#4338CA',
    border: '#C7D2FE',
    sidebarBg: '#1E1B4B',
    headerBg: '#FFFFFF'
  },
  {
    id: 'ocean-cyan',
    name: 'Ocean Cyan',
    primary: '#0891B2',
    secondary: '#52525B',
    accent: '#22D3EE',
    bg: '#ECFEFF',
    surface: '#FFFFFF',
    text: '#164E63',
    mutedText: '#0E7490',
    border: '#A5F3FC',
    sidebarBg: '#155E75',
    headerBg: '#FFFFFF'
  },
  {
    id: 'crimson-pro',
    name: 'Crimson Pro',
    primary: '#DC2626',
    secondary: '#525252',
    accent: '#F87171',
    bg: '#FEF2F2',
    surface: '#FFFFFF',
    text: '#7F1D1D',
    mutedText: '#B91C1C',
    border: '#FECACA',
    sidebarBg: '#450A0A',
    headerBg: '#FFFFFF'
  },
  {
    id: 'teal-modern',
    name: 'Teal Modern',
    primary: '#0F766E',
    secondary: '#52525B',
    accent: '#14B8A6',
    bg: '#F0FDFA',
    surface: '#FFFFFF',
    text: '#134E4A',
    mutedText: '#0D9488',
    border: '#99F6E4',
    sidebarBg: '#134E4A',
    headerBg: '#FFFFFF'
  },
  {
    id: 'sunset-amber',
    name: 'Sunset Amber',
    primary: '#D97706',
    secondary: '#78716C',
    accent: '#FBBF24',
    bg: '#FFFBEB',
    surface: '#FFFFFF',
    text: '#78350F',
    mutedText: '#B45309',
    border: '#FDE68A',
    sidebarBg: '#451A03',
    headerBg: '#FFFFFF'
  }
];
