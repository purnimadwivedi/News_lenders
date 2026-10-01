export interface ThemeTokens {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  surface: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderSubtle: string;
  primary: string;
  primaryHover: string;
  success: string;
  warning: string;
  danger: string;
  chartPrimary: string;
  chartGrid: string;
  chartLabel: string;
}

export const LIGHT_THEME_TOKENS: ThemeTokens = {
  bgPrimary: '#ffffff',
  bgSecondary: '#f5f7fa',
  bgTertiary: '#eef2f7',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  textPrimary: '#111827',
  textSecondary: '#667085',
  textMuted: '#98a2b3',
  border: '#d9e1ec',
  borderSubtle: '#e7ecf2',
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  chartPrimary: '#3b82f6',
  chartGrid: '#e2e8f0',
  chartLabel: '#64748b'
};

export const DARK_THEME_TOKENS: ThemeTokens = {
  bgPrimary: '#050b18',
  bgSecondary: '#0b1220',
  bgTertiary: '#111827',
  surface: '#0b1220',
  surfaceElevated: '#111827',
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  border: '#243247',
  borderSubtle: '#1b283a',
  primary: '#3b82f6',
  primaryHover: '#60a5fa',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#f97316',
  chartPrimary: '#60a5fa',
  chartGrid: '#243247',
  chartLabel: '#94a3b8'
};
