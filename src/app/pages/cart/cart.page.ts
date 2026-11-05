import { Capacitor } from '@capacitor/core';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { ProductService } from '../../services/product.service';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { CustomerService } from '../../services/customer.service';
import { RazorpayService } from '../../services/razorpay.service';
import { DialogService } from '../../services/dialog.service';
import { CartItem } from '../../models/product.model';
import { Order, PaymentMethod } from '../../models/order.model';
import { environment } from '../../../environments/environment';

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
  productService = inject(ProductService);
  razorpayService = inject(RazorpayService);
  dialogService = inject(DialogService);
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

    this.loadRazorpayScript();
  }

  private loadRazorpayScript(): void {
    this.razorpayService.loadScript();
  }

  get cartItems(): CartItem[] {
    return this.cartService.getItems();
  }

  get totalCount(): number {
    return this.cartService.getTotalCount();
  }

  async processCheckout(): Promise<void> {
    if (!this.customerName.trim() || !this.customerPhone.trim() || !this.streetAddress.trim()) {
      await this.dialogService.alert({
        title: 'Missing Delivery Information',
        message: 'Please fill in your Name, Phone Number, and Delivery Street Address.',
        type: 'warning'
      });
      return;
    }

    // Automatic Real-time Stock Availability Verification
    const stockVerification = this.productService.checkStockAvailability(this.cartItems);
    if (!stockVerification.valid) {
      await this.dialogService.alert({
        title: 'Stock Unavailable',
        message: `Cannot complete order: ${stockVerification.outOfStockItem}. Please adjust your cart.`,
        type: 'danger'
      });
      return;
    }

    this.isProcessing = true;

    // Auto-update customer profile with latest delivery details
    this.customerService.updateProfile({
      name: this.customerName,
      phone: this.customerPhone,
      street: this.streetAddress,
      city: this.city,
      pincode: this.pincode,
      landmark: this.landmark
    });

    if (this.selectedPaymentMethod === 'razorpay') {
      await this.launchRazorpayCheckout();
    } else {
      // Cash on Delivery
      setTimeout(() => {
        this.createFinalOrder(undefined, 'pending');
      }, 600);
    }
  }

  private async launchRazorpayCheckout(): Promise<void> {
    const totalRupees = this.cartService.getSubtotal();

    try {
      const paymentResponse = await this.razorpayService.openPayment({
        amount: totalRupees,
        currency: 'INR',
        name: environment.appName || 'Electrical Vibers',
        description: 'Genuine Electrical Materials & Contracting',
        prefill: {
          name: this.customerName,
          contact: this.customerPhone
        },
        notes: {
          address: `${this.streetAddress}, ${this.city} ${this.pincode}`
        },
        theme: {
          color: '#0284c7'
        }
      });

      const paymentId = paymentResponse.razorpay_payment_id || ('pay_rzp_' + Math.random().toString(36).substring(2, 10));
      this.createFinalOrder(paymentId, 'paid');
    } catch (err: any) {
      console.warn('Razorpay checkout interrupted or fallback needed:', err?.message);
      if (err?.message?.includes('closed') || err?.message?.includes('cancelled')) {
        this.isProcessing = false;
        return;
      }

      // If test credentials or gateway fallback
      const useSim = await this.dialogService.confirm({
        title: 'Payment Gateway Notice',
        message: `${err?.message || 'Could not connect to live gateway.'}\n\nWould you like to complete this order using Test Gateway Sandbox?`,
        confirmText: 'Complete via Test Mode',
        cancelText: 'Cancel',
        type: 'info'
      });

      if (useSim) {
        const mockPayId = 'pay_sim_' + Math.random().toString(36).substring(2, 10);
        this.createFinalOrder(mockPayId, 'paid');
      } else {
        this.isProcessing = false;
      }
    }
  }

  private createFinalOrder(paymentId?: string, paymentStatus: 'paid' | 'pending' = 'paid'): void {
    // 1. Automatically Deduct Inventory
    this.productService.deductInventory(this.cartItems);

    // 2. Trigger native mobile success haptic feedback
    if (Capacitor.isPluginAvailable('Haptics')) {
      try {
        Haptics.notification({ type: NotificationType.Success }).catch(() => {});
      } catch (_) {}
    }

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
      paymentStatus: paymentStatus,
      razorpayPaymentId: paymentId
    });

    this.cartService.clearCart();
    this.isProcessing = false;
    this.lastPlacedOrder = order;
  }
}
