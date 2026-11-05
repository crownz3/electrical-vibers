import { Component, inject, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuickEditService } from '../../services/quick-edit.service';
import { ConfigService, AppConfig, StoreOffer } from '../../services/config.service';
import { ProductService } from '../../services/product.service';
import { BookingService } from '../../services/booking.service';
import { ThemeService } from '../../services/theme.service';
import { FirebaseService } from '../../services/firebase.service';
import { Product } from '../../models/product.model';
import { ServiceCategory } from '../../models/booking.model';

@Component({
  selector: 'app-admin-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-edit-modal.component.html',
  styleUrls: ['./admin-edit-modal.component.scss']
})
export class AdminEditModalComponent implements OnDestroy {
  quickEditService = inject(QuickEditService);
  configService = inject(ConfigService);
  productService = inject(ProductService);
  bookingService = inject(BookingService);
  themeService = inject(ThemeService);
  firebaseService = inject(FirebaseService);

  get isOpen(): boolean {
    return this.quickEditService.isOpen();
  }

  get activeType() {
    return this.quickEditService.activeType();
  }

  get editData() {
    return this.quickEditService.editData();
  }

  // Active editable form models
  configForm: AppConfig = this.configService.getConfig();
  productForm: Partial<Product> = {};
  serviceForm: Partial<ServiceCategory> = {};
  offerForm: Partial<StoreOffer> = {};

  productImageInput = '';
  productSpecsInput = '';
  isUploading = false;
  uploadStatusMsg = '';

  constructor() {
    // When modal opens or data changes, lock background scroll & reinitialize the appropriate form
    effect(() => {
      if (this.quickEditService.isOpen()) {
        document.body.style.overflow = 'hidden';
        this.onModalInit();
      } else {
        document.body.style.overflow = '';
      }
    });

    this.configService.config$.subscribe(c => {
      this.configForm = { ...c };
    });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  getModalTitle(): string {
    switch (this.activeType) {
      case 'hero': return 'Edit Homepage Hero & Call to Actions (இருமொழி முகப்பு தலைப்புகள்)';
      case 'banner': return 'Edit Top Announcement Banner (இருமொழி அறிவிப்பு பேனர்)';
      case 'services_header': return 'Edit Services Section Title & Subtitle (சேவைகள் பிரிவு தலைப்பு)';
      case 'store_header': return 'Edit Store Section Title & Subtitle (அங்காடி பிரிவு தலைப்பு)';
      case 'contact': return 'Edit Contact & Emergency Dispatch Details (தொடர்பு & அவசர விவரங்கள்)';
      case 'deal': return 'Edit Deal of the Day Settings (இன்றைய சிறப்பு சலுகை)';
      case 'product': return this.editData?.id ? 'Edit Product (தயாரிப்பு திருத்து)' : 'Add New Product (புதிய தயாரிப்பு சேர்)';
      case 'service': return this.editData?.id ? 'Edit Electrician Service (மின்சார சேவை திருத்து)' : 'Add New Service (புதிய சேவை சேர்)';
      case 'offer': return this.editData?.id ? 'Edit Special Offer (சிறப்பு சலுகை திருத்து)' : 'Add New Offer (புதிய சலுகை சேர்)';
      case 'stats': return 'Edit Trust Counters & Experience (நம்பகத்தன்மை புள்ளிவிவரங்கள்)';
      case 'values': return 'Edit "Why Choose Us" Value Pillars (முக்கிய சிறப்பம்சங்கள்)';
      case 'footer': return 'Edit Business Identity & Footer (வணிக அடையாளம் & அடிக்குறிப்பு)';
      default: return 'Quick Live Edit';
    }
  }

  close(): void {
    this.quickEditService.close();
  }

  // Populate data when modal opens
  onModalInit(): void {
    const data = this.editData;
    if (this.activeType === 'product') {
      if (data) {
        this.productForm = { ...data };
        this.productImageInput = (data.images || []).join('\n');
        this.productSpecsInput = data.specs ? Object.entries(data.specs).map(([k, v]) => `${k}: ${v}`).join('\n') : '';
      } else {
        this.productForm = {
          name: '',
          tamilName: '',
          brand: 'Havells',
          category: 'House Wiring Cables',
          tamilCategory: 'வீட்டு வயரிங் கேபிள்கள்',
          price: 999,
          mrp: 1299,
          unit: 'Coil (90m)',
          tamilUnit: 'சுருள் (90மீ)',
          inStock: true,
          stock: 25,
          rating: 4.8,
          description: '',
          tamilDescription: '',
          images: ['assets/images/hero-showcase.jpg']
        };
        this.productImageInput = 'assets/images/hero-showcase.jpg';
        this.productSpecsInput = 'Standard: ISI Marked\nLength: 90 Meters';
      }
    } else if (this.activeType === 'service') {
      if (data) {
        this.serviceForm = { ...data };
      } else {
        this.serviceForm = {
          title: '',
          tamilTitle: '',
          description: '',
          tamilDescription: '',
          startingPrice: 299,
          icon: 'bolt',
          popular: false
        };
      }
    } else if (this.activeType === 'offer') {
      if (data) {
        this.offerForm = { ...data };
      } else {
        this.offerForm = {
          title: '',
          tamilTitle: '',
          code: 'SPECIAL15',
          discountPercentage: 15,
          description: '',
          tamilDescription: '',
          validTill: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          active: true
        };
      }
    } else {
      this.configForm = { ...this.configService.getConfig() };
    }
  }

  // Image Upload Handlers
  async onProductFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    this.isUploading = true;
    this.uploadStatusMsg = 'Uploading image...';

    try {
      const files = Array.from(input.files);
      const currentImages = this.productForm.images ? [...this.productForm.images] : [];

      for (const file of files) {
        const url = await this.firebaseService.uploadFile('products', file);
        if (url) {
          currentImages.push(url);
        }
      }

      this.productForm.images = currentImages;
      this.productImageInput = currentImages.join('\n');
      this.uploadStatusMsg = 'Upload complete!';
      setTimeout(() => this.uploadStatusMsg = '', 2500);
    } catch (err: any) {
      console.error('Product image upload failed:', err);
      this.uploadStatusMsg = 'Upload failed. Please try again.';
    } finally {
      this.isUploading = false;
      input.value = '';
    }
  }

  removeProductImage(index: number): void {
    if (this.productForm.images) {
      this.productForm.images.splice(index, 1);
      this.productImageInput = this.productForm.images.join('\n');
    }
  }

  async onHeroBannerFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    this.isUploading = true;
    this.uploadStatusMsg = 'Uploading hero banner...';

    try {
      const file = input.files[0];
      const url = await this.firebaseService.uploadFile('banners', file);
      if (url) {
        this.configForm.heroBannerImageUrl = url;
        this.uploadStatusMsg = 'Hero banner uploaded!';
        setTimeout(() => this.uploadStatusMsg = '', 2500);
      }
    } catch (err) {
      this.uploadStatusMsg = 'Banner upload failed.';
    } finally {
      this.isUploading = false;
      input.value = '';
    }
  }

  async onLogoFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    this.isUploading = true;
    this.uploadStatusMsg = 'Uploading brand logo...';

    try {
      const file = input.files[0];
      const url = await this.firebaseService.uploadFile('branding', file);
      if (url) {
        this.configForm.logoImageUrl = url;
        this.uploadStatusMsg = 'Logo uploaded!';
        setTimeout(() => this.uploadStatusMsg = '', 2500);
      }
    } catch (err) {
      this.uploadStatusMsg = 'Logo upload failed.';
    } finally {
      this.isUploading = false;
      input.value = '';
    }
  }

  save(): void {
    switch (this.activeType) {
      case 'hero':
      case 'banner':
      case 'stats':
      case 'values':
      case 'footer':
      case 'services_header':
      case 'store_header':
      case 'contact':
      case 'deal':
        this.configService.saveConfig(this.configForm);
        break;

      case 'product': {
        const imgs = this.productImageInput.split('\n').map(s => s.trim()).filter(Boolean);
        const specs: { [key: string]: string } = {};
        this.productSpecsInput.split('\n').forEach(line => {
          const parts = line.split(':');
          if (parts.length >= 2) {
            specs[parts[0].trim()] = parts.slice(1).join(':').trim();
          }
        });

        const pData: Product = {
          id: this.productForm.id || `prod-${Date.now()}`,
          name: this.productForm.name || 'Electrical Item',
          tamilName: this.productForm.tamilName,
          category: this.productForm.category || 'General Electricals',
          tamilCategory: this.productForm.tamilCategory,
          brand: this.productForm.brand || 'ISI Standard',
          price: Number(this.productForm.price) || 0,
          mrp: Number(this.productForm.mrp) || Number(this.productForm.price) || 0,
          discountPercentage: this.productForm.mrp && this.productForm.price && this.productForm.mrp > this.productForm.price
            ? Math.round(((this.productForm.mrp - this.productForm.price) / this.productForm.mrp) * 100)
            : 0,
          unit: this.productForm.unit || 'Piece',
          tamilUnit: this.productForm.tamilUnit,
          inStock: this.productForm.inStock ?? true,
          stock: Number(this.productForm.stock) || 10,
          rating: Number(this.productForm.rating) || 4.8,
          description: this.productForm.description || '',
          tamilDescription: this.productForm.tamilDescription,
          images: imgs.length ? imgs : ['assets/images/hero-showcase.jpg'],
          specs
        };

        if (this.editData?.id) {
          this.productService.updateProduct(this.editData.id, pData);
        } else {
          this.productService.addProduct(pData);
        }
        break;
      }

      case 'service': {
        const sData: ServiceCategory = {
          id: this.serviceForm.id || `srv-${Date.now()}`,
          title: this.serviceForm.title || 'Electrical Service',
          tamilTitle: this.serviceForm.tamilTitle || '',
          description: this.serviceForm.description || '',
          tamilDescription: this.serviceForm.tamilDescription,
          startingPrice: Number(this.serviceForm.startingPrice) || 199,
          icon: this.serviceForm.icon || 'bolt',
          popular: !!this.serviceForm.popular
        };

        if (this.editData?.id) {
          this.bookingService.updateService(this.editData.id, sData);
        } else {
          this.bookingService.addService(sData);
        }
        break;
      }

      case 'offer': {
        const oData: StoreOffer = {
          id: this.offerForm.id || `off-${Date.now()}`,
          title: this.offerForm.title || 'Discount Offer',
          tamilTitle: this.offerForm.tamilTitle,
          code: this.offerForm.code || 'DISCOUNT',
          discountPercentage: Number(this.offerForm.discountPercentage) || 10,
          description: this.offerForm.description || '',
          tamilDescription: this.offerForm.tamilDescription,
          validTill: this.offerForm.validTill || '2026-12-31',
          active: this.offerForm.active ?? true
        };

        if (this.editData?.id) {
          this.configService.updateOffer(this.editData.id, oData);
        } else {
          this.configService.addOffer(oData);
        }
        break;
      }
    }

    this.close();
  }
}

