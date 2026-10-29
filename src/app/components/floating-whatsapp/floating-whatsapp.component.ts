import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigService, AppConfig } from '../../services/config.service';

@Component({
  selector: 'app-floating-whatsapp',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './floating-whatsapp.component.html',
  styleUrls: ['./floating-whatsapp.component.scss']
})
export class FloatingWhatsappComponent {
  configService = inject(ConfigService);
  config: AppConfig = this.configService.getConfig();

  isOpen = false;

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
        `Hello Electrical Vibers!\nI want to inquire about tool prices, bulk contractor discounts, and stock availability.`
      );
    } else if (topic === 'emergency') {
      text = encodeURIComponent(
        `*EMERGENCY ELECTRICAL ASSISTANCE NEEDED*\nPlease dispatch an on-call licensed electrician to my location.`
      );
    } else {
      text = encodeURIComponent(
        `Hello Electrical Vibers! I have a question regarding electrical materials and services.`
      );
    }

    this.closeMenu();
    window.open(`https://wa.me/${this.config.whatsappNumber}?text=${text}`, '_blank');
  }
}
