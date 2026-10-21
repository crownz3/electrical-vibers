import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { BookingService } from '../../services/booking.service';
import { ConfigService, AppConfig } from '../../services/config.service';
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
  route = inject(ActivatedRoute);

  config: AppConfig = this.configService.getConfig();
  searchQuery = '';
  hasSearched = false;

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

  track(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return;

    this.hasSearched = true;
    this.matchedOrder = undefined;
    this.matchedBooking = undefined;

    // Search orders
    const orders = this.orderService.getOrders();
    const foundOrder = orders.find(o => 
      o.id.toLowerCase() === q ||
      o.customerPhone.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
    );

    if (foundOrder) {
      this.matchedOrder = foundOrder;
      return;
    }

    // Search bookings
    const bookings = this.bookingService.getBookings();
    const foundBooking = bookings.find(b => 
      b.id.toLowerCase() === q ||
      b.customerPhone.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
    );

    if (foundBooking) {
      this.matchedBooking = foundBooking;
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
