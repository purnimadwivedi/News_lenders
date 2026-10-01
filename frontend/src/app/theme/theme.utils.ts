import { ThemeTokens, LIGHT_THEME_TOKENS, DARK_THEME_TOKENS } from './theme.tokens';
import { ColorMode } from './theme.config';

export function applyThemeTokensToElement(
  element: HTMLElement,
  mode: ColorMode,
  customPrimary?: string,
  customAccent?: string
): void {
  const tokens = mode === 'dark' ? DARK_THEME_TOKENS : LIGHT_THEME_TOKENS;
  const primary = customPrimary || tokens.primary;
  const primaryHover = mode === 'dark' ? (customAccent || tokens.primaryHover) : (customPrimary || tokens.primaryHover);

  // 1. Direct centralized tokens
  element.style.setProperty('--color-bg-primary', tokens.bgPrimary);
  element.style.setProperty('--color-bg-secondary', tokens.bgSecondary);
  element.style.setProperty('--color-bg-tertiary', tokens.bgTertiary);
  element.style.setProperty('--color-surface', tokens.surface);
  element.style.setProperty('--color-surface-elevated', tokens.surfaceElevated);
  element.style.setProperty('--color-text-primary', tokens.textPrimary);
  element.style.setProperty('--color-text-secondary', tokens.textSecondary);
  element.style.setProperty('--color-text-muted', tokens.textMuted);
  element.style.setProperty('--color-border', tokens.border);
  element.style.setProperty('--color-border-subtle', tokens.borderSubtle);
  element.style.setProperty('--color-primary', primary);
  element.style.setProperty('--color-primary-hover', primaryHover);
  element.style.setProperty('--color-success', tokens.success);
  element.style.setProperty('--color-warning', tokens.warning);
  element.style.setProperty('--color-danger', tokens.danger);

  element.style.setProperty('--chart-primary', customAccent || tokens.chartPrimary);
  element.style.setProperty('--chart-grid', tokens.chartGrid);
  element.style.setProperty('--chart-label', tokens.chartLabel);

  // 2. Existing application compatibility mappings
  element.style.setProperty('--bg', tokens.bgSecondary);
  element.style.setProperty('--background-color', tokens.bgSecondary);
  element.style.setProperty('--surface', tokens.surface);
  element.style.setProperty('--surface-color', tokens.surface);
  element.style.setProperty('--surface-2', tokens.bgTertiary);
  element.style.setProperty('--text', tokens.textPrimary);
  element.style.setProperty('--text-color', tokens.textPrimary);
  element.style.setProperty('--muted', tokens.textSecondary);
  element.style.setProperty('--muted-text-color', tokens.textSecondary);
  element.style.setProperty('--border', tokens.border);
  element.style.setProperty('--border-color', tokens.border);
  element.style.setProperty('--primary', primary);
  element.style.setProperty('--primary-color', primary);
  element.style.setProperty('--primary-hover', primaryHover);
  element.style.setProperty('--accent', customAccent || primary);
  element.style.setProperty('--accent-color', customAccent || primary);
  element.style.setProperty('--sidebar-background', tokens.surfaceElevated);
  element.style.setProperty('--header-background', tokens.surface);

  // 3. HTML attributes & element theme classes (strictly scoped to the element)
  element.setAttribute('data-theme', mode);
  if (mode === 'dark') {
    element.classList.add('dark-theme');
    element.classList.remove('light-theme');
  } else {
    element.classList.remove('dark-theme');
    element.classList.add('light-theme');
  }

  // Ensure root/body NEVER retain data-theme or dark classes if applied to a scoped element
  if (typeof document !== 'undefined' && element !== document.documentElement) {
    document.documentElement.removeAttribute('data-theme');
    if (document.body) {
      document.body.removeAttribute('data-theme');
      document.body.classList.remove('dark-theme', 'light-theme');
    }
  }
}

export function removeThemeTokensFromElement(element: HTMLElement): void {
  if (!element) return;
  element.removeAttribute('data-theme');
  element.classList.remove('dark-theme', 'light-theme');
  if (element.style) {
    for (let i = element.style.length - 1; i >= 0; i--) {
      const prop = element.style[i];
      if (prop && prop.startsWith('--')) {
        element.style.removeProperty(prop);
      }
    }
  }
  if (typeof document !== 'undefined') {
    if (document.body) {
      document.body.classList.remove('dark-theme', 'light-theme');
      document.body.removeAttribute('data-theme');
      if (document.body.style) {
        for (let i = document.body.style.length - 1; i >= 0; i--) {
          const prop = document.body.style[i];
          if (prop && prop.startsWith('--')) {
            document.body.style.removeProperty(prop);
          }
        }
      }
    }
    if (document.documentElement) {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('dark-theme', 'light-theme');
      if (document.documentElement.style) {
        for (let i = document.documentElement.style.length - 1; i >= 0; i--) {
          const prop = document.documentElement.style[i];
          if (prop && prop.startsWith('--')) {
            document.documentElement.style.removeProperty(prop);
          }
        }
      }
    }
  }
}
