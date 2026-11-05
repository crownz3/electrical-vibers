import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type AppLanguage = 'en' | 'ta';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly STORAGE_KEY = 'electrical_vibers_lang_pref';

  // Signals for reactive Angular templates
  private langSignal = signal<AppLanguage>(this.getStoredLanguage());
  public currentLang = this.langSignal.asReadonly();
  public isTamil = computed(() => this.langSignal() === 'ta');
  public isEnglish = computed(() => this.langSignal() === 'en');

  // RxJS Observable for interoperability
  private langSubject = new BehaviorSubject<AppLanguage>(this.getStoredLanguage());
  public currentLang$: Observable<AppLanguage> = this.langSubject.asObservable();

  // Common UI Localization Dictionary
  private readonly dictionary: Record<string, { en: string; ta: string }> = {
    // Navigation & General
    'nav.home': { en: 'Home', ta: 'முகப்பு' },
    'home': { en: 'Home', ta: 'முகப்பு' },
    'nav.store': { en: 'Store', ta: 'மின்பொருட்கள் அங்காடி' },
    'store': { en: 'Store', ta: 'அங்காடி' },
    'nav.bookService': { en: 'Book Service', ta: 'சேவை முன்பதிவு' },
    'bookService': { en: 'Book Service', ta: 'சேவை முன்பதிவு' },
    'services': { en: 'Services', ta: 'சேவைகள்' },
    'nav.staffPortal': { en: 'Staff Portal', ta: 'பணியாளர் தளம்' },
    'staffPortal': { en: 'Staff Portal', ta: 'பணியாளர் தளம்' },
    'nav.adminPortal': { en: 'Admin Portal', ta: 'நிர்வாக தளம்' },
    'adminPortal': { en: 'Admin Portal', ta: 'நிர்வாக தளம்' },
    'nav.trackOrder': { en: 'Track Order', ta: 'ஆர்டரை கண்காணி' },
    'trackOrder': { en: 'Track Order', ta: 'ஆர்டரை கண்காணி' },
    'nav.cart': { en: 'Shopping Cart', ta: 'ஷாப்பிங் கார்ட்' },
    'cart': { en: 'Shopping Cart', ta: 'ஷாப்பிங் கார்ட்' },
    'nav.profile': { en: 'Profile', ta: 'சுயவிவரம்' },
    'specialOffers': { en: 'Special Offers', ta: 'சிறப்பு சலுகைகள்' },
    'viewAll': { en: 'View All', ta: 'அனைத்தும் பார்' },

    // Search & Store
    'store.searchPlaceholder': { en: 'Search materials, cables, switches, tools...', ta: 'ஒயர், சுவிட்ச், கருவிகள் தேடுக...' },
    'store.allCategories': { en: 'All Categories', ta: 'அனைத்து பிரிவுகள்' },
    'store.filter': { en: 'Filter Products', ta: 'பொருட்களை வடிகட்டு' },
    'store.inStock': { en: 'In Stock', ta: 'கையிருப்பில் உள்ளது' },
    'store.outOfStock': { en: 'Out of Stock', ta: 'கையிருப்பில் இல்லை' },
    'store.addToCart': { en: 'Add to Cart', ta: 'கார்ட்டில் சேர்' },
    'addToCart': { en: 'Add to Cart', ta: 'கார்ட்டில் சேர்' },
    'store.buyNow': { en: 'Buy Now', ta: 'உடனே வாங்கு' },
    'buyNow': { en: 'Buy Now', ta: 'உடனே வாங்கு' },
    'store.viewDetails': { en: 'View Details', ta: 'விவரம் பார்' },
    'store.noProducts': { en: 'No products available currently in this category.', ta: 'இப்பிரிவில் தற்போது பொருட்கள் எதுவும் இல்லை.' },
    'store.emptyNotice': { en: 'Store catalog is being updated by the administrator.', ta: 'நிர்வாகியால் பொருட்கள் புதுப்பிக்கப்பட்டு வருகின்றன.' },

    // Book Service
    'service.title': { en: 'Book Licensed Electrician Service', ta: 'அங்கீகரிக்கப்பட்ட எலக்ட்ரீஷியன் முன்பதிவு' },
    'service.subtitle': { en: 'Transparent labor rates, background-verified technicians, and genuine electrical components.', ta: 'வெளிப்படையான கட்டணம், அனுபவமிக்க எலக்ட்ரீஷியன்கள் மற்றும் நம்பகமான உதிரிபாகங்கள்.' },
    'service.startingFrom': { en: 'Starting from', ta: 'ஆரம்ப விலை' },
    'startingFrom': { en: 'Starting from', ta: 'ஆரம்ப விலை' },
    'service.bookNow': { en: 'Book This Service', ta: 'இப்போதே முன்பதிவு செய்க' },
    'bookNow': { en: 'Book Now', ta: 'முன்பதிவு செய்' },
    'service.customService': { en: 'Need Custom Wiring / Industrial Requirement?', ta: 'தனிப்பயன் வயரிங் தேவைப்படுகிறதா?' },

    // Common Actions
    'action.save': { en: 'Save', ta: 'சேமி' },
    'action.cancel': { en: 'Cancel', ta: 'ரத்து செய்' },
    'action.delete': { en: 'Delete', ta: 'நீக்கு' },
    'action.edit': { en: 'Edit', ta: 'திருத்து' },
    'action.close': { en: 'Close', ta: 'மூடு' },
    'action.confirm': { en: 'Confirm', ta: 'உறுதி செய்' },
    'action.submit': { en: 'Submit', ta: 'சமர்ப்பி' },
    'action.checkout': { en: 'Proceed to Checkout', ta: 'செக்அவுட் தொடரவும்' },

    // Status
    'status.pending': { en: 'Pending', ta: 'நிலுவையில்' },
    'status.confirmed': { en: 'Confirmed', ta: 'உறுதியானது' },
    'status.inProgress': { en: 'In Progress', ta: 'நடைபெறுகிறது' },
    'status.completed': { en: 'Completed', ta: 'முடிக்கப்பட்டது' },
    'status.cancelled': { en: 'Cancelled', ta: 'ரத்து செய்யப்பட்டது' }
  };

  constructor() {
    // Listen to storage events across tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === this.STORAGE_KEY && e.newValue) {
          const lang = e.newValue as AppLanguage;
          this.langSignal.set(lang);
          this.langSubject.next(lang);
        }
      });
    }
  }

  private getStoredLanguage(): AppLanguage {
    if (typeof localStorage === 'undefined') return 'en';
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved === 'ta' ? 'ta' : 'en';
  }

  /**
   * Set application language ('en' | 'ta')
   */
  setLanguage(lang: AppLanguage): void {
    if (lang !== 'en' && lang !== 'ta') return;
    this.langSignal.set(lang);
    this.langSubject.next(lang);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, lang);
    }
  }

  /**
   * Toggle between English and Tamil
   */
  toggleLanguage(): void {
    const nextLang: AppLanguage = this.langSignal() === 'en' ? 'ta' : 'en';
    this.setLanguage(nextLang);
  }

  /**
   * Get static dictionary translated phrase
   */
  t(key: string): string {
    const entry = this.dictionary[key];
    if (!entry) return key;
    return this.langSignal() === 'ta' ? (entry.ta || entry.en) : (entry.en || entry.ta);
  }

  /**
   * Helper to pick localized field from a dynamic item
   * Example: get(product, 'name', 'tamilName')
   */
  get<T>(item: T | null | undefined, enKey: keyof T, taKey: keyof T): string {
    if (!item) return '';
    const isTa = this.langSignal() === 'ta';
    if (isTa) {
      const taVal = item[taKey];
      if (taVal && typeof taVal === 'string' && taVal.trim().length > 0) {
        return taVal;
      }
    }
    const enVal = item[enKey];
    return enVal ? String(enVal) : '';
  }

  /**
   * Returns localized text choosing between two provided strings
   */
  pick(enText: string | undefined | null, taText: string | undefined | null): string {
    const isTa = this.langSignal() === 'ta';
    if (isTa && taText && taText.trim().length > 0) {
      return taText;
    }
    return enText || taText || '';
  }
}
