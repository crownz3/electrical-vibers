import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigService, AppConfig } from '../../services/config.service';
import { AuthService } from '../../services/auth.service';
import { QuickEditService } from '../../services/quick-edit.service';

@Component({
  selector: 'app-floating-whatsapp',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './floating-whatsapp.component.html',
  styleUrls: ['./floating-whatsapp.component.scss']
})
export class FloatingWhatsappComponent implements OnInit {
  configService = inject(ConfigService);
  authService = inject(AuthService);
  quickEditService = inject(QuickEditService);
  config: AppConfig = this.configService.getConfig();

  isOpen = false;

  ngOnInit(): void {
    this.configService.config$.subscribe(cfg => {
      this.config = cfg;
    });
  }

  editWhatsApp(event: Event): void {
    event.stopPropagation();
    this.quickEditService.open('contact');
  }

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
  }

  closeMenu(): void {
    this.isOpen = false;
  }

  openWhatsApp(topic: 'general' | 'tools' | 'emergency'): void {
    let text = '';
    if (topic === 'tools') {
      text = encodeURIComponent(
        `Hello ${this.config.businessName || 'Electrical Vibers'}!\nI want to inquire about tool prices, bulk contractor discounts, and stock availability.`
      );
    } else if (topic === 'emergency') {
      text = encodeURIComponent(
        `*EMERGENCY ELECTRICAL ASSISTANCE NEEDED*\nPlease dispatch an on-call licensed electrician to my location.`
      );
    } else {
      text = encodeURIComponent(
        `Hello ${this.config.businessName || 'Electrical Vibers'}! I have a question regarding electrical materials and services.`
      );
    }

    this.closeMenu();
    // Normalize phone number (digits only, e.g. 919876543210)
    const rawPhone = this.config.whatsappNumber || '919876543210';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  }
}
