import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { BookingService } from '../../services/booking.service';
import { CartService } from '../../services/cart.service';
import { ConfigService, AppConfig, StoreOffer } from '../../services/config.service';
import { LanguageService } from '../../services/language.service';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { QuickEditService } from '../../services/quick-edit.service';
import { DialogService } from '../../services/dialog.service';
import { FirebaseService } from '../../services/firebase.service';
import { Product } from '../../models/product.model';
import { ServiceCategory } from '../../models/booking.model';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';
import { InlineEditDirective } from '../../directives/inline-edit.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ScrollAnimateDirective, InlineEditDirective],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit, OnDestroy {
  productService = inject(ProductService);
  bookingService = inject(BookingService);
  cartService = inject(CartService);
  configService = inject(ConfigService);
  langService = inject(LanguageService);
  themeService = inject(ThemeService);
  authService = inject(AuthService);
  quickEditService = inject(QuickEditService);
  dialogService = inject(DialogService);
  firebaseService = inject(FirebaseService);
  router = inject(Router);

  config: AppConfig = this.configService.getConfig();
  services: ServiceCategory[] = [];
  offers: StoreOffer[] = [];
  featuredProducts: Product[] = [];
  dealProduct?: Product;

  get heroImage(): string {
    return this.config.heroBannerImageUrl || 'assets/images/hero-elegant-showcase.jpg';
  }

  onHeroImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && !target.src.includes('hero-elegant-showcase.jpg')) {
      target.src = 'assets/images/hero-elegant-showcase.jpg';
    }
  }

  // Countdown timer for Deal of the Day
  countdownHours = 11;
  countdownMinutes = 48;
  countdownSeconds = 25;
  private timerInterval?: any;

  ngOnInit(): void {
    this.configService.config$.subscribe(cfg => {
      this.config = cfg;
      this.resolveDealProduct();
    });

    this.configService.offers$.subscribe(offs => this.offers = offs.filter(o => o.active));
    this.bookingService.services$.subscribe(s => this.services = s);

    this.productService.products$.subscribe(prods => {
      this.featuredProducts = prods.slice(0, 4);
      this.resolveDealProduct();
    });

    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private resolveDealProduct(): void {
    const id = this.config.dealOfTheDayProductId || 'prod-7';
    this.dealProduct = this.productService.getProductById(id) || this.featuredProducts[0];
  }

  private startCountdown(): void {
    this.timerInterval = setInterval(() => {
      if (this.countdownSeconds > 0) {
        this.countdownSeconds--;
      } else {
        this.countdownSeconds = 59;
        if (this.countdownMinutes > 0) {
          this.countdownMinutes--;
        } else {
          this.countdownMinutes = 59;
          if (this.countdownHours > 0) {
            this.countdownHours--;
          } else {
            this.countdownHours = 23;
          }
        }
      }
    }, 1000);
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product, 1);
  }

  buyNow(product: Product): void {
    this.cartService.addToCart(product, 1, false);
    this.router.navigate(['/cart']);
  }

  async deleteProduct(id: string, name: string): Promise<void> {
    const ok = await this.dialogService.confirm(`Are you sure you want to delete product "${name}"?`, 'Delete Product', 'danger');
    if (ok) {
      this.productService.deleteProduct(id);
    }
  }

  async deleteService(id: string, title: string): Promise<void> {
    const ok = await this.dialogService.confirm(`Are you sure you want to delete service "${title}"?`, 'Delete Service', 'danger');
    if (ok) {
      this.bookingService.deleteService(id);
    }
  }

  async onDirectHeroImageUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    try {
      const file = input.files[0];
      const url = await this.firebaseService.uploadFile('hero_banners', file);
      if (url) {
        this.configService.updateConfig({ heroBannerImageUrl: url });
        this.quickEditService.notifySaved('Hero showcase image updated!');
      }
    } catch (err) {
      console.error('Failed to update hero image:', err);
    } finally {
      input.value = '';
    }
  }

  async onDirectProductImageUpload(event: Event, product: Product): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    try {
      const file = input.files[0];
      const url = await this.firebaseService.uploadFile('products', file);
      if (url) {
        this.productService.updateProduct(product.id, { images: [url] });
        this.quickEditService.notifySaved(`Image updated for "${product.name}"!`);
      }
    } catch (err) {
      console.error('Failed to update product image:', err);
    } finally {
      input.value = '';
    }
  }

  async deleteOffer(id: string, title: string): Promise<void> {
    const ok = await this.dialogService.confirm(`Are you sure you want to delete offer "${title}"?`, 'Delete Offer', 'danger');
    if (ok) {
      this.configService.deleteOffer(id);
    }
  }
}
