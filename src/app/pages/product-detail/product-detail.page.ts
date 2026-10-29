import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { ConfigService, AppConfig } from '../../services/config.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-detail.page.html',
  styleUrls: ['./product-detail.page.scss']
})
export class ProductDetailPage implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  productService = inject(ProductService);
  cartService = inject(CartService);
  configService = inject(ConfigService);

  config: AppConfig = this.configService.getConfig();
  product?: Product;
  selectedImage = '';
  quantity = 1;
  linkCopied = false;

  ngOnInit(): void {
    this.configService.config$.subscribe(c => this.config = c);
    this.route.params.subscribe(params => {
      const id = params['id'];
      this.product = this.productService.getProductById(id);
      if (this.product && this.product.images.length > 0) {
        this.selectedImage = this.product.images[0];
      }
    });
  }

  increaseQty(): void {
    this.quantity++;
  }

  decreaseQty(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (this.product) {
      this.cartService.addToCart(this.product, this.quantity, true);
    }
  }

  buyNow(): void {
    if (this.product) {
      this.cartService.addToCart(this.product, this.quantity, false);
      this.router.navigate(['/cart']);
    }
  }

  hasSpecs(): boolean {
    return !!this.product?.specs && Object.keys(this.product.specs).length > 0;
  }

  copyShareLink(): void {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      this.linkCopied = true;
      setTimeout(() => this.linkCopied = false, 3000);
    });
  }

  shareOnWhatsApp(): void {
    if (!this.product) return;
    const url = window.location.href;
    const text = encodeURIComponent(
      `*${this.product.name}*\n` +
      `Special Price: ₹${this.product.price} (${this.product.discountPercentage || 0}% OFF)\n` +
      `Order genuine electrical materials from Electrical Vibers:\n${url}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  shareOnFacebook(): void {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  }

  getWhatsAppDirectLink(): string {
    if (!this.product) return '';
    const text = encodeURIComponent(
      `Hello Electrical Vibers! I'm interested in ordering *${this.product.name}* (Price: ₹${this.product.price}). Please share delivery and availability details.`
    );
    return `https://wa.me/${this.config.whatsappNumber}?text=${text}`;
  }
}
