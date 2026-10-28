import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { SideCartComponent } from './components/side-cart/side-cart.component';
import { FloatingWhatsappComponent } from './components/floating-whatsapp/floating-whatsapp.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, SideCartComponent, FloatingWhatsappComponent],
})
export class AppComponent {
  themeService = inject(ThemeService);
  router = inject(Router);
  isAdminRoute = false;

  constructor() {
    this.checkAdminRoute(this.router.url);
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkAdminRoute(event.urlAfterRedirects || event.url);
    });
  }

  private checkAdminRoute(url: string): void {
    this.isAdminRoute = !!url && (url.startsWith('/admin') || url.includes('/admin'));
  }
}
