import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { BookingService } from '../../services/booking.service';
import { CartService } from '../../services/cart.service';
import { ConfigService, AppConfig, StoreOffer } from '../../services/config.service';
import { Product } from '../../models/product.model';
import { ServiceCategory } from '../../models/booking.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit {
  productService = inject(ProductService);
  bookingService = inject(BookingService);
  cartService = inject(CartService);
  configService = inject(ConfigService);

  config: AppConfig = this.configService.getConfig();
  services: ServiceCategory[] = [];
  offers: StoreOffer[] = [];
  featuredProducts: Product[] = [];

  ngOnInit(): void {
    this.configService.config$.subscribe(cfg => this.config = cfg);
    this.configService.offers$.subscribe(offs => this.offers = offs.filter(o => o.active));
    this.bookingService.services$.subscribe(s => this.services = s);
    this.productService.products$.subscribe(prods => this.featuredProducts = prods.slice(0, 4));
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product, 1);
  }
}
