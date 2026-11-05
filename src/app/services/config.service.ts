import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FirebaseService } from './firebase.service';

export interface AppConfig {
  businessName: string;
  tamilBusinessName?: string;
  businessSubtitle: string;
  tamilBusinessSubtitle?: string;
  tamilQuote: string;
  contactPhone: string;
  whatsappNumber: string;
  contactEmail: string;
  address: string;
  baseInspectionFee: number;
  bannerOfferText: string;
  tamilBannerOfferText?: string;
  showBannerOffer: boolean;
  yearsExperience: number;
  completedSitesCount: number;
  emergencyResponseTime: string;

  // Social Media Handles
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  googleMapsUrl: string;
  twitterUrl: string;

  // Hero Section Copy
  heroBadgeText: string;
  tamilHeroBadgeText?: string;
  heroHeadline: string;
  tamilHeroHeadline?: string;
  heroSubheadline: string;
  tamilHeroSubheadline?: string;
  heroBookCtaText: string;
  tamilHeroBookCtaText?: string;
  heroStoreCtaText: string;
  tamilHeroStoreCtaText?: string;

  // Trust Statistics
  stat1Num: string;
  stat1Label: string;
  stat2Num: string;
  stat2Label: string;
  stat3Num: string;
  stat3Label: string;
  stat4Num: string;
  stat4Label: string;

  // Section Headers & Tamil Descriptions
  servicesSectionTitle: string;
  tamilServicesSectionTitle?: string;
  servicesSectionSubtitle: string;
  tamilServicesSectionSubtitle?: string;
  storeSectionTitle: string;
  tamilStoreSectionTitle?: string;
  storeSectionSubtitle: string;
  tamilStoreSectionSubtitle?: string;
  offersSectionTitle: string;
  tamilOffersSectionTitle?: string;

  // Why Choose Us / Values
  value1Title: string;
  value1Desc: string;
  value2Title: string;
  value2Desc: string;
  value3Title: string;
  value3Desc: string;
  value4Title: string;
  value4Desc: string;

  // Deal of the Day (inspired by tktools.in)
  showDealOfTheDay: boolean;
  dealOfTheDayProductId: string;
  dealOfTheDayTitle: string;
  dealOfTheDayTamilTitle?: string;
  dealOfTheDaySubtitle: string;
  dealOfTheDayTamilSubtitle?: string;
  dealOfTheDayEndHours: number;

  // Footer Copy
  footerAboutText: string;
  tamilFooterAboutText?: string;
  footerCopyrightText: string;
}

export interface StoreOffer {
  id: string;
  title: string;
  tamilTitle?: string;
  code: string;
  discountPercentage: number;
  description: string;
  tamilDescription?: string;
  validTill: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly CONFIG_KEY = 'electrical_vibers_config_v1';
  private readonly OFFERS_KEY = 'electrical_vibers_offers_v1';

  private defaultConfig: AppConfig = {
    businessName: 'Electrical Vibers',
    tamilBusinessName: 'எலக்ட்ரிகல் வைபர்ஸ்',
    businessSubtitle: 'Electricals & Contracting',
    tamilBusinessSubtitle: 'மின்சாதனங்கள் & ஒப்பந்த பணிகள்',
    tamilQuote: 'தரமான பொருட்கள் • நம்பகமான வயரிங் பணிகள் • நியாயமான கட்டணம்',
    contactPhone: '+91 98765 43210',
    whatsappNumber: '919876543210',
    contactEmail: 'contact@electricalvibers.com',
    address: '124, Power Station Road, Anna Nagar, Chennai - 600040',
    baseInspectionFee: 149,
    bannerOfferText: 'Special Offer: Flat 15% OFF on Havells & Finolex Wire Coils + Free Delivery across Chennai!',
    tamilBannerOfferText: 'சிறப்பு சலுகை: ஹேவல்ஸ் மற்றும் ஃபினோலெக்ஸ் ஒயர்களுக்கு 15% தள்ளுபடி + சென்னை முழுவதும் இலவச டெலிவரி!',
    showBannerOffer: true,
    yearsExperience: 14,
    completedSitesCount: 580,
    emergencyResponseTime: '30 Min',

    // Social Media Handles
    instagramUrl: 'https://instagram.com/electricalvibers',
    facebookUrl: 'https://facebook.com/electricalvibers',
    youtubeUrl: 'https://youtube.com/@electricalvibers',
    googleMapsUrl: 'https://maps.google.com/?q=Anna+Nagar+Chennai',
    twitterUrl: 'https://x.com/electricalvibers',

    // Hero Copy
    heroBadgeText: "Government Licensed 'A' Grade Electrical Contractor",
    tamilHeroBadgeText: "அரசு அங்கீகாரம் பெற்ற 'A' கிரேடு எலக்ட்ரிக்கல் ஒப்பந்ததாரர்",
    heroHeadline: 'Smart Electrical Solutions & Premium Supplies in One Place',
    tamilHeroHeadline: 'பாதுகாப்பான மின்சார தீர்வுகள் & பிரீமியம் பொருட்கள் ஒரே இடத்தில்',
    heroSubheadline: 'End-to-end residential & commercial electrical wiring, rapid emergency breakdown dispatch, and genuine ISI-certified materials delivered across Chennai.',
    tamilHeroSubheadline: 'வீடு மற்றும் வணிக வளாகங்களுக்கான முழுமையான வயரிங் பணிகள், அவசர பழுதுநீக்கம் & தரமான பிராண்டட் மின்சாதனங்கள் உங்கள் விரல் நுனியில்.',
    heroBookCtaText: 'Book Electrician Service',
    tamilHeroBookCtaText: 'எலக்ட்ரீஷியன் முன்பதிவு',
    heroStoreCtaText: 'Browse Electrical Store',
    tamilHeroStoreCtaText: 'மின்பொருட்கள் அங்காடி',

    // Trust Stats
    stat1Num: '14+',
    stat1Label: 'Years Industry Experience',
    stat2Num: '580+',
    stat2Label: 'Completed Building Sites',
    stat3Num: '100%',
    stat3Label: 'Genuine ISI/ISO Materials',
    stat4Num: '30 Min',
    stat4Label: 'Emergency Response Time',

    // Section Titles
    servicesSectionTitle: 'Professional Electrician Services',
    tamilServicesSectionTitle: 'தொழில்முறை எலக்ட்ரீஷியன் சேவைகள்',
    servicesSectionSubtitle: 'Certified licensed technicians for residential installations, maintenance, and emergency electrical troubleshooting.',
    tamilServicesSectionSubtitle: 'அனுபவம் வாய்ந்த எலக்ட்ரீஷியன்கள் மூலம் பாதுகாப்பான தரமான பணிகள்',
    storeSectionTitle: 'Best-Selling Electrical Supplies',
    tamilStoreSectionTitle: 'முன்னணி எலக்ட்ரிக்கல் தயாரிப்புகள்',
    storeSectionSubtitle: 'ISI-certified genuine copper cables, modular switches, MCBs, and lighting delivered to your doorstep.',
    tamilStoreSectionSubtitle: 'பிராண்டட் ஒயர்கள், சுவிட்சுகள் & தரமான எலக்ட்ரிக்கல் பொருட்கள்',
    offersSectionTitle: 'Active Special Offers & Packages',
    tamilOffersSectionTitle: 'நடப்பு சிறப்பு சலுகைகள்',

    // Values
    value1Title: 'Safety & Compliance First',
    value1Desc: 'All wiring strictly adheres to National Electrical Code (NEC) and IS-732 safety specifications.',
    value2Title: 'Transparent Billing',
    value2Desc: 'Clear upfront quotes without hidden fees. Track every expense and pending balance easily.',
    value3Title: 'Same-Day Site Visits',
    value3Desc: 'Quick dispatched certified technicians equipped with multimeters, thermal sensors, and safety tools.',
    value4Title: 'Direct Contractor Support',
    value4Desc: 'Speak directly to our master licensed electrician anytime via WhatsApp or phone call.',

    // Deal of the Day
    showDealOfTheDay: true,
    dealOfTheDayProductId: 'prod-7',
    dealOfTheDayTitle: 'Deal of the Day - Limited-Time Flash Tool',
    dealOfTheDayTamilTitle: 'இன்றைய சிறப்பு தள்ளுபடி சலுகை',
    dealOfTheDaySubtitle: 'சிறப்பு சலுகை: பிரீமியம் கார்ட்லெஸ் பவர் டூல்ஸ் நேரடி தள்ளுபடி விலையில்',
    dealOfTheDayTamilSubtitle: 'சிறப்பு சலுகை: பிரீமியம் கார்ட்லெஸ் பவர் டூல்ஸ் நேரடி தள்ளுபடி விலையில்',
    dealOfTheDayEndHours: 12,

    // Footer
    footerAboutText: 'Professional Licensed Electrical Contractors & Retail Store in Chennai. Delivering safe wiring, smart switchgears, and dependable daily electrical work since 2012.',
    tamilFooterAboutText: 'சென்னையில் அரசு உரிமம் பெற்ற எலக்ட்ரிக்கல் ஒப்பந்ததாரர்கள் & சில்லறை அங்காடி. 2012 முதல் பாதுகாப்பான வயரிங் மற்றும் உயர்தர சேவை.',
    footerCopyrightText: '© 2026 Electrical Vibers. All rights reserved.'
  };

  private initialOffers: StoreOffer[] = [
    {
      id: 'off-1',
      title: 'Monsoon Wiring Safety Package',
      code: 'MONSOON15',
      discountPercentage: 15,
      description: 'Get 15% discount on whole house rewiring and MCB tripping checkup.',
      validTill: '2026-11-30',
      active: true
    },
    {
      id: 'off-2',
      title: 'Modular Switch Upgrade Fest',
      code: 'ROMA20',
      discountPercentage: 20,
      description: 'Flat 20% off when replacing 10 or more switches with Anchor Roma/Legrand.',
      validTill: '2026-10-31',
      active: true
    }
  ];

  private configSubject = new BehaviorSubject<AppConfig>(this.defaultConfig);
  public config$: Observable<AppConfig> = this.configSubject.asObservable();

  private offersSubject = new BehaviorSubject<StoreOffer[]>(this.initialOffers);
  public offers$: Observable<StoreOffer[]> = this.offersSubject.asObservable();

  constructor(private firebaseService: FirebaseService) {
    this.loadConfig();
    this.loadOffers();
    this.initCloudSync();
  }

  private initCloudSync(): void {
    // Sync main config doc
    this.firebaseService.listenToDocument<AppConfig>('app_metadata', 'app_config', (remoteConfig) => {
      if (remoteConfig && remoteConfig.businessName) {
        this.saveConfig(remoteConfig, false);
      } else {
        // Seed initial config to Firestore
        this.firebaseService.setDocument('app_metadata', 'app_config', this.configSubject.getValue());
      }
    });

    // Sync offers list
    this.firebaseService.listenToDocument<{ list: StoreOffer[] }>('app_metadata', 'store_offers', (remoteOffers) => {
      if (remoteOffers && Array.isArray(remoteOffers.list) && remoteOffers.list.length > 0) {
        this.saveOffers(remoteOffers.list, false);
      } else {
        this.firebaseService.setDocument('app_metadata', 'store_offers', { list: this.offersSubject.getValue() });
      }
    });
  }

  private loadConfig(): void {
    let saved = localStorage.getItem(this.CONFIG_KEY);
    if (!saved) {
      // Check for legacy voltmaster key
      const legacySaved = localStorage.getItem('voltmaster_config_v2');
      if (legacySaved) {
        try {
          const parsed = JSON.parse(legacySaved);
          if (parsed.businessName === 'VoltMaster') {
            parsed.businessName = 'Electrical Vibers';
          }
          if (parsed.footerCopyrightText && parsed.footerCopyrightText.includes('VoltMaster')) {
            parsed.footerCopyrightText = '© 2026 Electrical Vibers. All rights reserved.';
          }
          this.saveConfig({ ...this.defaultConfig, ...parsed });
          return;
        } catch (e) {
          console.error('Failed to parse legacy config:', e);
        }
      }
    }

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.businessName === 'VoltMaster') {
          parsed.businessName = 'Electrical Vibers';
        }
        // Correct legacy corrupted English fields containing Tamil text
        if (parsed.heroSubheadline && parsed.heroSubheadline.startsWith('வீடு')) {
          parsed.heroSubheadline = this.defaultConfig.heroSubheadline;
        }
        if (parsed.servicesSectionSubtitle && parsed.servicesSectionSubtitle.startsWith('அனுபவம்')) {
          parsed.servicesSectionSubtitle = this.defaultConfig.servicesSectionSubtitle;
        }
        if (parsed.storeSectionSubtitle && parsed.storeSectionSubtitle.startsWith('பிராண்டட்')) {
          parsed.storeSectionSubtitle = this.defaultConfig.storeSectionSubtitle;
        }
        this.configSubject.next({ ...this.defaultConfig, ...parsed });
        return;
      } catch (e) {
        console.error('Failed to load config:', e);
      }
    }
    this.saveConfig(this.defaultConfig);
  }

  saveConfig(config: AppConfig, syncCloud = true): void {
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
    this.configSubject.next(config);
    if (syncCloud) {
      this.firebaseService.setDocument('app_metadata', 'app_config', config).catch(err => {
        console.warn('Could not save config to Firestore:', err);
      });
    }
  }

  getConfig(): AppConfig {
    return this.configSubject.getValue();
  }

  updateConfig(updates: Partial<AppConfig>): void {
    const updated = { ...this.configSubject.getValue(), ...updates };
    this.saveConfig(updated);
  }

  // --- Offers Management ---
  private loadOffers(): void {
    const saved = localStorage.getItem(this.OFFERS_KEY);
    if (saved) {
      try {
        this.offersSubject.next(JSON.parse(saved));
        return;
      } catch (e) {
        console.error('Failed to load offers:', e);
      }
    }
    this.saveOffers(this.initialOffers);
  }

  private saveOffers(offers: StoreOffer[], syncCloud = true): void {
    localStorage.setItem(this.OFFERS_KEY, JSON.stringify(offers));
    this.offersSubject.next(offers);
    if (syncCloud) {
      this.firebaseService.setDocument('app_metadata', 'store_offers', { list: offers }).catch(err => {
        console.warn('Could not save offers to Firestore:', err);
      });
    }
  }

  getOffers(): StoreOffer[] {
    return this.offersSubject.getValue();
  }

  addOffer(offer: Omit<StoreOffer, 'id'>): void {
    const newOffer: StoreOffer = {
      ...offer,
      id: 'off-' + Date.now()
    };
    const updated = [newOffer, ...this.offersSubject.getValue()];
    this.saveOffers(updated);
  }

  updateOffer(id: string, updates: Partial<StoreOffer>): void {
    const updated = this.offersSubject.getValue().map(o => o.id === id ? { ...o, ...updates } : o);
    this.saveOffers(updated);
  }

  deleteOffer(id: string): void {
    const updated = this.offersSubject.getValue().filter(o => o.id !== id);
    this.saveOffers(updated);
  }
}
