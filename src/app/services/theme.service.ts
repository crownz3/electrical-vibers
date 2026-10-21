import { Injectable, signal } from '@angular/core';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ActiveTheme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'electrical_vibers_theme_pref_v1';
  
  // Current user preference: 'system' | 'light' | 'dark'
  public preference = signal<ThemePreference>('system');
  
  // Computed active theme: 'light' | 'dark'
  public activeTheme = signal<ActiveTheme>('dark');

  private mediaQueryListener?: (e: MediaQueryListEvent) => void;

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY) as ThemePreference | null;
    const initialPref: ThemePreference = (saved === 'light' || saved === 'dark' || saved === 'system') 
      ? saved 
      : 'system'; // default is system theme as requested

    this.preference.set(initialPref);
    this.applyTheme(initialPref);

    // Watch for OS system theme changes
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQueryListener = (e: MediaQueryListEvent) => {
      if (this.preference() === 'system') {
        const newTheme: ActiveTheme = e.matches ? 'dark' : 'light';
        this.activeTheme.set(newTheme);
        this.updateDom(newTheme);
      }
    };
    
    if (media.addEventListener) {
      media.addEventListener('change', this.mediaQueryListener);
    } else if ((media as any).addListener) {
      (media as any).addListener(this.mediaQueryListener);
    }
  }

  public setPreference(pref: ThemePreference): void {
    this.preference.set(pref);
    localStorage.setItem(this.STORAGE_KEY, pref);
    this.applyTheme(pref);
  }

  public toggleTheme(): void {
    const current = this.activeTheme();
    const nextPref: ThemePreference = current === 'dark' ? 'light' : 'dark';
    this.setPreference(nextPref);
  }

  public cyclePreference(): void {
    const current = this.preference();
    let next: ThemePreference = 'system';
    if (current === 'system') next = 'light';
    else if (current === 'light') next = 'dark';
    else next = 'system';
    this.setPreference(next);
  }

  private applyTheme(pref: ThemePreference): void {
    let effectiveTheme: ActiveTheme = 'dark';

    if (pref === 'system') {
      const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = isSystemDark ? 'dark' : 'light';
    } else {
      effectiveTheme = pref;
    }

    this.activeTheme.set(effectiveTheme);
    this.updateDom(effectiveTheme);
  }

  private updateDom(theme: ActiveTheme): void {
    const root = document.documentElement;
    const body = document.body;

    root.setAttribute('data-theme', theme);
    root.setAttribute('data-color-scheme', theme);

    if (theme === 'dark') {
      root.classList.add('theme-dark');
      root.classList.remove('theme-light');
      body.classList.add('theme-dark');
      body.classList.remove('theme-light');
    } else {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
      body.classList.add('theme-light');
      body.classList.remove('theme-dark');
    }
  }

  public getPreferenceLabel(pref: ThemePreference): string {
    switch (pref) {
      case 'system': return 'System Default';
      case 'light': return 'Light Theme';
      case 'dark': return 'Dark Theme';
    }
  }

  public getPreferenceIcon(pref: ThemePreference): string {
    switch (pref) {
      case 'system': return 'brightness_auto';
      case 'light': return 'light_mode';
      case 'dark': return 'dark_mode';
    }
  }
}
