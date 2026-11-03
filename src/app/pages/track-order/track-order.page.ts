import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { BookingService } from '../../services/booking.service';
import { ConfigService, AppConfig } from '../../services/config.service';
import { FirebaseService } from '../../services/firebase.service';
import { Order } from '../../models/order.model';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './track-order.page.html',
  styleUrls: ['./track-order.page.scss']
})
export class TrackOrderPage implements OnInit {
  orderService = inject(OrderService);
  bookingService = inject(BookingService);
  configService = inject(ConfigService);
  firebaseService = inject(FirebaseService);
  route = inject(ActivatedRoute);

  config: AppConfig = this.configService.getConfig();
  searchQuery = '';
  hasSearched = false;
  isSearchingCloud = false;

  matchedOrder?: Order;
  matchedBooking?: Booking;

  ngOnInit(): void {
    this.configService.config$.subscribe(c => this.config = c);

    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.searchQuery = params['id'];
        this.track();
      }
    });
  }

  async track(): Promise<void> {
    const rawQuery = this.searchQuery.trim();
    if (!rawQuery) return;

    const q = rawQuery.toLowerCase();
    this.hasSearched = true;
    this.matchedOrder = undefined;
    this.matchedBooking = undefined;

    // 1. Check local in-memory / cached orders first
    const orders = this.orderService.getOrders();
    const foundOrder = orders.find(o => 
      o.id.toLowerCase() === q ||
      o.customerPhone.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
    );

    if (foundOrder) {
      this.matchedOrder = foundOrder;
      return;
    }

    // 2. Check local in-memory bookings
    const bookings = this.bookingService.getBookings();
    const foundBooking = bookings.find(b => 
      b.id.toLowerCase() === q ||
      b.customerPhone.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
    );

    if (foundBooking) {
      this.matchedBooking = foundBooking;
      return;
    }

    // 3. Fallback: Direct Firestore Real-time Cloud Query
    this.isSearchingCloud = true;
    try {
      const normalizedId = rawQuery.toUpperCase();

      // Check Firestore directly for exact Order ID (e.g. ORD-1001, EV-ORD-1001)
      const cloudOrder = await this.firebaseService.getDocument<Order>('orders', normalizedId);
      if (cloudOrder) {
        this.matchedOrder = cloudOrder;
        this.isSearchingCloud = false;
        return;
      }

      // Check Firestore directly for exact Booking ID (e.g. BK-1001)
      const cloudBooking = await this.firebaseService.getDocument<Booking>('bookings', normalizedId);
      if (cloudBooking) {
        this.matchedBooking = cloudBooking;
        this.isSearchingCloud = false;
        return;
      }

      // If query is numeric (phone number), query cloud collection
      const cleanDigits = rawQuery.replace(/\D/g, '');
      if (cleanDigits.length >= 7) {
        const allOrders = await this.firebaseService.getCollectionDocs<Order>('orders');
        if (allOrders) {
          const matchPhoneOrder = allOrders.find(o => o.customerPhone && o.customerPhone.replace(/\D/g, '').includes(cleanDigits));
          if (matchPhoneOrder) {
            this.matchedOrder = matchPhoneOrder;
            this.isSearchingCloud = false;
            return;
          }
        }

        const allBookings = await this.firebaseService.getCollectionDocs<Booking>('bookings');
        if (allBookings) {
          const matchPhoneBooking = allBookings.find(b => b.customerPhone && b.customerPhone.replace(/\D/g, '').includes(cleanDigits));
          if (matchPhoneBooking) {
            this.matchedBooking = matchPhoneBooking;
            this.isSearchingCloud = false;
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Error querying Firestore for order tracking:', err);
    } finally {
      this.isSearchingCloud = false;
    }
  }

  fillDemo(): void {
    const orders = this.orderService.getOrders();
    if (orders.length > 0) {
      this.searchQuery = orders[0].id;
      this.track();
    } else {
      const bookings = this.bookingService.getBookings();
      if (bookings.length > 0) {
        this.searchQuery = bookings[0].id;
        this.track();
      }
    }
  }

  getOrderProgressStep(status: string): number {
    switch (status) {
      case 'placed': return 1;
      case 'pending': return 1;
      case 'confirmed': return 2;
      case 'dispatched': return 3;
      case 'delivered': return 4;
      case 'cancelled': return 0;
      default: return 2;
    }
  }

  getBookingProgressStep(status: string): number {
    switch (status) {
      case 'pending': return 1;
      case 'confirmed': return 2;
      case 'assigned': return 3;
      case 'completed': return 4;
      case 'cancelled': return 0;
      default: return 2;
    }
  }
}
