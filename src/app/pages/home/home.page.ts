import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { BookingService } from '../../services/booking.service';
import { CartService } from '../../services/cart.service';
import { ConfigService, AppConfig, StoreOffer } from '../../services/config.service';
import { ThemeService } from '../../services/theme.service';
import { Product } from '../../models/product.model';
import { ServiceCategory } from '../../models/booking.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit, OnDestroy {
  productService = inject(ProductService);
  bookingService = inject(BookingService);
  cartService = inject(CartService);
  configService = inject(ConfigService);
  themeService = inject(ThemeService);
  router = inject(Router);

  config: AppConfig = this.configService.getConfig();
  services: ServiceCategory[] = [];
  offers: StoreOffer[] = [];
  featuredProducts: Product[] = [];
  dealProduct?: Product;

  get heroImage(): string {
    return this.themeService.activeTheme() === 'dark'
      ? 'assets/images/hero-showcase.jpg'
      : 'assets/images/hero-light-showcase.jpg';
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
}
