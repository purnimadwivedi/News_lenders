export type ColorMode = 'light' | 'dark';

export interface ThemeConfig {
  mode: ColorMode;
  presetId: string;
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: 'light',
  presetId: 'imgc-orange'
};
