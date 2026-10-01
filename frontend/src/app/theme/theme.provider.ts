import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ColorMode, ThemeConfig, DEFAULT_THEME_CONFIG } from './theme.config';
import { applyThemeTokensToElement } from './theme.utils';

@Injectable({ providedIn: 'root' })
export class ThemeProvider {
  private configSubject = new BehaviorSubject<ThemeConfig>(DEFAULT_THEME_CONFIG);
  public config$: Observable<ThemeConfig> = this.configSubject.asObservable();

  get currentConfig(): ThemeConfig {
    return this.configSubject.value;
  }

  get isDarkMode(): boolean {
    return this.configSubject.value.mode === 'dark';
  }

  apply(config: ThemeConfig, primary?: string, accent?: string): void {
    this.configSubject.next(config);
    if (typeof document !== 'undefined') {
      applyThemeTokensToElement(document.documentElement, config.mode, primary, accent);
    }
  }
}
