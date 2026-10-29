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

  // Custom Service & Filter controls
  isCustomService = false;
  customServiceTitle = '';
  customServiceTamil = '';
  customServiceBudget: number | null = null;
  customServiceNotes = '';
  searchQuery = '';
  activeFilter: 'all' | 'popular' | 'custom' = 'all';

  customPresets: string[] = [
    '3-Phase Commercial Panel & DB Dressing',
    'False Ceiling Profile LED & Chandelier Wiring',
    'EV Car Charger 16A/32A Dedicated Point',
    'Garden Waterproof Pathway Spike Lighting',
    'Solar Water Heater & Geyser Separate Line',
    'Heavy Machinery Motor Starter Troubleshooting'
  ];

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
      if (!this.selectedCategory && srvs.length > 0 && !this.isCustomService) {
        this.selectedCategory = srvs[0];
      }

      this.route.queryParams.subscribe(params => {
        if (params['custom'] === 'true') {
          this.selectCustomService();
        } else if (params['serviceId']) {
          const found = srvs.find(s => s.id === params['serviceId']);
          if (found) {
            this.selectStandardService(found);
          }
        }
      });
    });
  }

  get filteredServices(): ServiceCategory[] {
    let list = this.services;
    if (this.activeFilter === 'popular') {
      list = list.filter(s => s.popular);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(s => 
        s.title.toLowerCase().includes(q) || 
        (s.tamilTitle && s.tamilTitle.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
    }
    return list;
  }

  setFilter(filter: 'all' | 'popular'): void {
    this.activeFilter = filter;
    this.isCustomService = false;
    if (!this.selectedCategory && this.filteredServices.length > 0) {
      this.selectedCategory = this.filteredServices[0];
    }
  }

  selectStandardService(s: ServiceCategory): void {
    this.isCustomService = false;
    this.selectedCategory = s;
  }

  selectCustomService(): void {
    this.isCustomService = true;
    this.selectedCategory = null;
    this.activeFilter = 'custom';
  }

  resetToStandard(): void {
    this.isCustomService = false;
    this.activeFilter = 'all';
    if (!this.selectedCategory && this.services.length > 0) {
      this.selectedCategory = this.services[0];
    }
  }

  applyPreset(preset: string): void {
    this.customServiceTitle = preset;
    if (!this.customServiceNotes) {
      this.customServiceNotes = `Requested: ${preset}. Please bring appropriate heavy-gauge wiring, MCB connectors and safety testing meters.`;
    }
  }

  submitBooking(): void {
    if (!this.customerName.trim() || !this.customerPhone.trim() || !this.customerAddress.trim()) {
      alert('Please fill in your Name, Phone Number, and Address.');
      return;
    }

    if (this.isCustomService) {
      if (!this.customServiceTitle.trim()) {
        alert('Please enter a brief name for your custom service requirement.');
        return;
      }
    } else if (!this.selectedCategory) {
      alert('Please select a service from the list or choose Custom Service.');
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

    const serviceTitle = this.isCustomService ? this.customServiceTitle.trim() : this.selectedCategory!.title;
    const serviceCategory = this.isCustomService ? 'custom' : this.selectedCategory!.id;
    const estCost = this.isCustomService 
      ? (this.customServiceBudget || this.config.baseInspectionFee) 
      : this.selectedCategory!.startingPrice;

    let fullProblemDesc = '';
    if (this.isCustomService) {
      fullProblemDesc = `[Custom Service]: ${serviceTitle}`;
      if (this.customServiceNotes) fullProblemDesc += `\nRequirements: ${this.customServiceNotes}`;
      if (this.problemDescription) fullProblemDesc += `\nAdditional Notes: ${this.problemDescription}`;
    } else {
      fullProblemDesc = this.problemDescription || 'General inspection and repair requested.';
    }

    setTimeout(() => {
      const booking = this.bookingService.createBooking({
        customerId: 'cust-' + Date.now(),
        customerName: this.customerName,
        customerPhone: this.customerPhone,
        customerAddress: this.customerAddress,
        city: this.city,
        landmark: this.landmark,
        serviceCategory,
        serviceTitle,
        problemDescription: fullProblemDesc,
        preferredDate: this.preferredDate,
        preferredTimeSlot: this.preferredTimeSlot,
        estimatedCost: estCost,
        isCustomService: this.isCustomService
      });

      this.isSubmitting = false;
      this.lastBooking = booking;
    }, 600);
  }

  getWhatsAppBookingLink(booking: Booking): string {
    const isCustom = booking.isCustomService || booking.serviceCategory === 'custom';
    const tag = isCustom ? '*Custom Service Booking*' : '*Service Booking*';
    const text = encodeURIComponent(
      `${tag} [${booking.id}]\n\n` +
      `*Service:* ${booking.serviceTitle}${isCustom ? ' (Custom Request)' : ''}\n` +
      `*Customer:* ${booking.customerName} (${booking.customerPhone})\n` +
      `*Address:* ${booking.customerAddress}, ${booking.city}\n` +
      `*Schedule:* ${booking.preferredDate} (${booking.preferredTimeSlot})\n` +
      `*Details:* ${booking.problemDescription}\n` +
      `*Estimated Rate:* ₹${booking.estimatedCost || this.config.baseInspectionFee}\n\n` +
      `Please confirm technician dispatch schedule!`
    );
    return `https://wa.me/${this.config.whatsappNumber}?text=${text}`;
  }
}
