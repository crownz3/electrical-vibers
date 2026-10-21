import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { CustomerService } from '../../services/customer.service';
import { CartItem } from '../../models/product.model';
import { Order, PaymentMethod } from '../../models/order.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss']
})
export class CartPage implements OnInit {
  cartService = inject(CartService);
  orderService = inject(OrderService);
  customerService = inject(CustomerService);
  router = inject(Router);

  customerName = '';
  customerPhone = '';
  streetAddress = '';
  city = 'Chennai';
  pincode = '';
  landmark = '';

  selectedPaymentMethod: PaymentMethod = 'razorpay';
  isProcessing = false;
  lastPlacedOrder: Order | null = null;

  ngOnInit(): void {
    const profile = this.customerService.getProfile();
    if (profile) {
      this.customerName = profile.name || '';
      this.customerPhone = profile.phone || '';
      this.streetAddress = profile.street || '';
      this.city = profile.city || 'Chennai';
      this.pincode = profile.pincode || '';
      this.landmark = profile.landmark || '';
    }
  }

  get cartItems(): CartItem[] {
    return this.cartService.getItems();
  }

  get totalCount(): number {
    return this.cartService.getTotalCount();
  }

  processCheckout(): void {
    if (!this.customerName.trim() || !this.customerPhone.trim() || !this.streetAddress.trim()) {
      alert('Please fill in your Name, Phone Number, and Delivery Street Address.');
      return;
    }

    this.isProcessing = true;

    // Simulate payment flow (Razorpay or COD)
    setTimeout(() => {
      const order = this.orderService.createOrder({
        customerName: this.customerName,
        customerPhone: this.customerPhone,
        deliveryAddress: {
          street: this.streetAddress,
          city: this.city,
          pincode: this.pincode,
          landmark: this.landmark
        },
        items: [...this.cartItems],
        subtotal: this.cartService.getSubtotal(),
        deliveryCharge: 0,
        discount: this.cartService.getTotalSavings(),
        totalAmount: this.cartService.getSubtotal(),
        paymentMethod: this.selectedPaymentMethod,
        paymentStatus: this.selectedPaymentMethod === 'razorpay' ? 'paid' : 'pending',
        razorpayPaymentId: this.selectedPaymentMethod === 'razorpay' ? ('pay_rzp_' + Math.random().toString(36).substring(2, 10)) : undefined
      });

      this.cartService.clearCart();
      this.isProcessing = false;
      this.lastPlacedOrder = order;
    }, 1000);
  }
}
