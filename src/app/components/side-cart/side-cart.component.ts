import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { ConfigService, AppConfig } from '../../services/config.service';
import { CartItem } from '../../models/product.model';

@Component({
  selector: 'app-side-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './side-cart.component.html',
  styleUrls: ['./side-cart.component.scss']
})
export class SideCartComponent {
  cartService = inject(CartService);
  configService = inject(ConfigService);
  router = inject(Router);

  config: AppConfig = this.configService.getConfig();
  freeShippingThreshold = 1000;

  get subtotal(): number {
    return this.cartService.getSubtotal();
  }

  get totalSavings(): number {
    return this.cartService.getTotalSavings();
  }

  get totalCount(): number {
    return this.cartService.getTotalCount();
  }

  get freeShippingProgress(): number {
    if (this.subtotal >= this.freeShippingThreshold) return 100;
    return Math.min(100, Math.round((this.subtotal / this.freeShippingThreshold) * 100));
  }

  get remainingForFreeShipping(): number {
    return Math.max(0, this.freeShippingThreshold - this.subtotal);
  }

  close(): void {
    this.cartService.closeDrawer();
  }

  goToCheckout(): void {
    this.cartService.closeDrawer();
    this.router.navigate(['/cart']);
  }

  orderOnWhatsApp(): void {
    const items = this.cartService.getItems();
    if (items.length === 0) return;

    const itemsSummary = items
      .map(i => `• ${i.product.name} (x${i.quantity}) - ₹${i.product.price * i.quantity}`)
      .join('\n');

    const message = encodeURIComponent(
      `*Quick Order from Electrical Vibers Website*\n\n` +
      `*Items in Cart:*\n${itemsSummary}\n\n` +
      `*Total Amount:* ₹${this.subtotal} (incl. GST)\n` +
      `*Estimated Savings:* ₹${this.totalSavings}\n\n` +
      `Please confirm stock availability and delivery timeline.`
    );

    this.cartService.closeDrawer();
    window.open(`https://wa.me/${this.config.whatsappNumber}?text=${message}`, '_blank');
  }
}
