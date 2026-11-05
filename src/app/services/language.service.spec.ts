import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let service: LanguageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [LanguageService]
    });
    service = TestBed.inject(LanguageService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with default English or stored preference', () => {
    expect(service.currentLang()).toBe('en');
    expect(service.isTamil()).toBe(false);
  });

  it('should switch language to Tamil and toggle back', () => {
    service.setLanguage('ta');
    expect(service.currentLang()).toBe('ta');
    expect(service.isTamil()).toBe(true);
    expect(localStorage.getItem('electrical_vibers_lang_pref')).toBe('ta');

    service.toggleLanguage();
    expect(service.currentLang()).toBe('en');
    expect(service.isTamil()).toBe(false);
    expect(localStorage.getItem('electrical_vibers_lang_pref')).toBe('en');
  });

  it('should translate dictionary keys correctly', () => {
    service.setLanguage('en');
    expect(service.t('home')).toBe('Home');
    expect(service.t('store')).toBe('Store');

    service.setLanguage('ta');
    expect(service.t('home')).toBe('முகப்பு');
    expect(service.t('store')).toBe('அங்காடி');
  });

  it('should pick dynamic entity translations based on active language', () => {
    service.setLanguage('en');
    expect(service.pick('Copper Wire', 'தாமிர கம்பி')).toBe('Copper Wire');

    service.setLanguage('ta');
    expect(service.pick('Copper Wire', 'தாமிர கம்பி')).toBe('தாமிர கம்பி');
    // Fallback to English when Tamil value is absent
    expect(service.pick('Circuit Breaker', '')).toBe('Circuit Breaker');
  });

  it('should retrieve object property dynamically with get()', () => {
    const item = { title: 'Wiring', tamilTitle: 'வயரிங்' };
    service.setLanguage('en');
    expect(service.get(item, 'title', 'tamilTitle')).toBe('Wiring');

    service.setLanguage('ta');
    expect(service.get(item, 'title', 'tamilTitle')).toBe('வயரிங்');
  });
});
