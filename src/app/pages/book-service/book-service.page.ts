import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../services/booking.service';
import { ConfigService, AppConfig } from '../../services/config.service';
import { CustomerService } from '../../services/customer.service';
import { Booking, ServiceCategory } from '../../models/booking.model';

@Component({
  selector: 'app-book-service',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './book-service.page.html',
  styleUrls: ['./book-service.page.scss']
})
export class BookServicePage implements OnInit {
  bookingService = inject(BookingService);
  configService = inject(ConfigService);
  customerService = inject(CustomerService);
  route = inject(ActivatedRoute);

  config: AppConfig = this.configService.getConfig();
  services: ServiceCategory[] = [];
  minDate = new Date().toISOString().split('T')[0];

  selectedCategory: ServiceCategory | null = null;
  preferredDate = new Date().toISOString().split('T')[0];
  preferredTimeSlot = 'Morning 09:00 AM - 12:00 PM';
  problemDescription = '';

  customerName = '';
  customerPhone = '';
  customerAddress = '';
  city = 'Chennai';
  landmark = '';

  isSubmitting = false;
  lastBooking: Booking | null = null;

  ngOnInit(): void {
    const profile = this.customerService.getProfile();
    if (profile) {
      this.customerName = profile.name || '';
      this.customerPhone = profile.phone || '';
      this.customerAddress = profile.street || '';
      this.city = profile.city || 'Chennai';
      this.landmark = profile.landmark || '';
    }

    this.configService.config$.subscribe(cfg => this.config = cfg);
    this.bookingService.services$.subscribe(srvs => {
      this.services = srvs;
      if (!this.selectedCategory && srvs.length > 0) {
        this.selectedCategory = srvs[0];
      }

      this.route.queryParams.subscribe(params => {
        if (params['serviceId']) {
          const found = srvs.find(s => s.id === params['serviceId']);
          if (found) {
            this.selectedCategory = found;
          }
        }
      });
    });
  }

  submitBooking(): void {
    if (!this.customerName.trim() || !this.customerPhone.trim() || !this.customerAddress.trim()) {
      alert('Please fill in your Name, Phone Number, and Address.');
      return;
    }

    if (!this.selectedCategory) {
      alert('Please select a service.');
      return;
    }

    this.isSubmitting = true;

    this.customerService.updateProfile({
      name: this.customerName,
      phone: this.customerPhone,
      street: this.customerAddress,
      city: this.city,
      landmark: this.landmark
    });

    setTimeout(() => {
      const booking = this.bookingService.createBooking({
        customerId: 'cust-' + Date.now(),
        customerName: this.customerName,
        customerPhone: this.customerPhone,
        customerAddress: this.customerAddress,
        city: this.city,
        landmark: this.landmark,
        serviceCategory: this.selectedCategory!.id,
        serviceTitle: this.selectedCategory!.title,
        problemDescription: this.problemDescription || 'General inspection and repair requested.',
        preferredDate: this.preferredDate,
        preferredTimeSlot: this.preferredTimeSlot,
        estimatedCost: this.selectedCategory!.startingPrice
      });

      this.isSubmitting = false;
      this.lastBooking = booking;
    }, 600);
  }

  getWhatsAppBookingLink(booking: Booking): string {
    const text = encodeURIComponent(
      `⚡ *New Service Booking [${booking.id}]*\n\n` +
      `*Service:* ${booking.serviceTitle}\n` +
      `*Customer:* ${booking.customerName} (${booking.customerPhone})\n` +
      `*Address:* ${booking.customerAddress}, ${booking.city}\n` +
      `*Date/Time:* ${booking.preferredDate} (${booking.preferredTimeSlot})\n` +
      `*Problem:* ${booking.problemDescription}\n\n` +
      `Please confirm technician arrival schedule!`
    );
    return `https://wa.me/${this.config.whatsappNumber}?text=${text}`;
  }
}
