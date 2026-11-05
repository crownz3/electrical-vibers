import { 
  Directive, 
  ElementRef, 
  Input, 
  OnInit, 
  OnDestroy, 
  inject, 
  effect,
  HostListener,
  Renderer2
} from '@angular/core';
import { AuthService } from '../services/auth.service';
import { QuickEditService } from '../services/quick-edit.service';
import { ConfigService } from '../services/config.service';
import { ProductService } from '../services/product.service';
import { BookingService } from '../services/booking.service';
import { LanguageService } from '../services/language.service';
import { Product } from '../models/product.model';
import { ServiceCategory } from '../models/booking.model';

const TAMIL_CONFIG_MAP: Record<string, string> = {
  heroHeadline: 'tamilHeroHeadline',
  heroSubheadline: 'tamilHeroSubheadline',
  heroBadgeText: 'tamilHeroBadgeText',
  heroBookCtaText: 'tamilHeroBookCtaText',
  heroStoreCtaText: 'tamilHeroStoreCtaText',
  bannerOfferText: 'tamilBannerOfferText',
  servicesSectionTitle: 'tamilServicesSectionTitle',
  servicesSectionSubtitle: 'tamilServicesSectionSubtitle',
  storeSectionTitle: 'tamilStoreSectionTitle',
  storeSectionSubtitle: 'tamilStoreSectionSubtitle',
  offersSectionTitle: 'tamilOffersSectionTitle',
  footerAboutText: 'tamilFooterAboutText',
  businessName: 'tamilBusinessName',
  businessSubtitle: 'tamilBusinessSubtitle',
  tamilQuote: 'tamilQuote'
};

@Directive({
  selector: '[appInlineEdit]',
  standalone: true
})
export class InlineEditDirective implements OnInit, OnDestroy {
  @Input('appInlineEdit') fieldKey!: string; // e.g. 'heroHeadline', 'stat1Num', 'product.price', 'service.startingPrice'
  @Input() editTarget?: Product | ServiceCategory | any;
  @Input() multiline: boolean = false;

  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private authService = inject(AuthService);
  private quickEditService = inject(QuickEditService);
  private configService = inject(ConfigService);
  private productService = inject(ProductService);
  private bookingService = inject(BookingService);
  private langService = inject(LanguageService);

  private originalValue = '';
  private isEditable = false;

  constructor() {
    effect(() => {
      const canEdit = this.authService.isAdmin() && this.quickEditService.showEditMarkers();
      this.updateEditableState(canEdit);
    });
  }

  ngOnInit(): void {
    this.updateEditableState(this.authService.isAdmin() && this.quickEditService.showEditMarkers());
  }

  ngOnDestroy(): void {
    this.updateEditableState(false);
  }

  private updateEditableState(canEdit: boolean): void {
    this.isEditable = canEdit;
    const elem = this.el.nativeElement;

    if (canEdit) {
      this.renderer.setAttribute(elem, 'contenteditable', 'true');
      this.renderer.setAttribute(elem, 'spellcheck', 'false');
      this.renderer.addClass(elem, 'live-inline-editable');
      this.renderer.setAttribute(elem, 'title', '⚡ Click to edit live on page (Auto-saved on click outside)');
    } else {
      this.renderer.removeAttribute(elem, 'contenteditable');
      this.renderer.removeAttribute(elem, 'spellcheck');
      this.renderer.removeClass(elem, 'live-inline-editable');
      this.renderer.removeAttribute(elem, 'title');
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (this.isEditable) {
      event.stopPropagation();
    }
  }

  @HostListener('focus')
  onFocus(): void {
    if (!this.isEditable) return;
    this.originalValue = this.el.nativeElement.innerText.trim();
    this.renderer.addClass(this.el.nativeElement, 'live-inline-editing');
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.isEditable) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.el.nativeElement.innerText = this.originalValue;
      this.el.nativeElement.blur();
      return;
    }

    if (!this.multiline && event.key === 'Enter') {
      event.preventDefault();
      this.el.nativeElement.blur();
    }
  }

  @HostListener('blur')
  onBlur(): void {
    if (!this.isEditable) return;
    this.renderer.removeClass(this.el.nativeElement, 'live-inline-editing');

    const raw = this.el.nativeElement.innerText.trim();
    if (raw === this.originalValue) return;

    // 1. Service Item In-Place Edit
    if (this.fieldKey.startsWith('service.')) {
      const prop = this.fieldKey.replace('service.', '');
      if (this.editTarget?.id) {
        const s = this.editTarget as ServiceCategory;
        if (prop === 'startingPrice') {
          const num = parseInt(raw.replace(/\D/g, ''), 10) || s.startingPrice;
          this.bookingService.updateService(s.id, { startingPrice: num });
          this.el.nativeElement.innerText = `₹${num}`;
        } else if (prop === 'title') {
          if (this.langService.isTamil()) {
            this.bookingService.updateService(s.id, { tamilTitle: raw });
          } else {
            this.bookingService.updateService(s.id, { title: raw });
          }
        } else if (prop === 'description') {
          if (this.langService.isTamil()) {
            this.bookingService.updateService(s.id, { tamilDescription: raw });
          } else {
            this.bookingService.updateService(s.id, { description: raw });
          }
        }
        this.quickEditService.notifySaved(`Service "${s.title}" updated & saved to Cloud!`);
      }
      return;
    }

    // 2. Product Item In-Place Edit
    if (this.fieldKey.startsWith('product.')) {
      const prop = this.fieldKey.replace('product.', '');
      if (this.editTarget?.id) {
        const p = this.editTarget as Product;
        if (prop === 'price') {
          const num = parseInt(raw.replace(/\D/g, ''), 10) || p.price;
          this.productService.updateProduct(p.id, { price: num });
          this.el.nativeElement.innerText = `₹${num}`;
        } else if (prop === 'brand') {
          this.productService.updateProduct(p.id, { brand: raw });
        } else if (prop === 'name') {
          if (this.langService.isTamil()) {
            this.productService.updateProduct(p.id, { tamilName: raw });
          } else {
            this.productService.updateProduct(p.id, { name: raw });
          }
        } else if (prop === 'description') {
          if (this.langService.isTamil()) {
            this.productService.updateProduct(p.id, { tamilDescription: raw });
          } else {
            this.productService.updateProduct(p.id, { description: raw });
          }
        }
        this.quickEditService.notifySaved(`Product "${p.name}" updated & saved to Cloud!`);
      }
      return;
    }

    // 3. Global Config / Homepage In-Place Edit
    let targetKey = this.fieldKey;
    if (this.langService.isTamil() && TAMIL_CONFIG_MAP[this.fieldKey]) {
      targetKey = TAMIL_CONFIG_MAP[this.fieldKey];
    }

    this.configService.updateConfig({ [targetKey]: raw });
    this.quickEditService.notifySaved(`Live saved to Cloud: "${raw.slice(0, 25)}${raw.length > 25 ? '...' : ''}"`);
  }
}
