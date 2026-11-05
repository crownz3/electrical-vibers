import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { SideCartComponent } from './components/side-cart/side-cart.component';
import { FloatingWhatsappComponent } from './components/floating-whatsapp/floating-whatsapp.component';
import { AdminBarComponent } from './components/admin-bar/admin-bar.component';
import { AdminEditModalComponent } from './components/admin-edit-modal/admin-edit-modal.component';
import { ThemeService } from './services/theme.service';
import { CartService } from './services/cart.service';
import { LoadingService } from './services/loading.service';
import { AuthService } from './services/auth.service';
import { QuickEditService } from './services/quick-edit.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [
    CommonModule, 
    RouterOutlet, 
    HeaderComponent, 
    FooterComponent, 
    SideCartComponent, 
    FloatingWhatsappComponent,
    AdminBarComponent,
    AdminEditModalComponent
  ],
})
export class AppComponent {
  themeService = inject(ThemeService);
  cartService = inject(CartService);
  loadingService = inject(LoadingService);
  authService = inject(AuthService);
  quickEditService = inject(QuickEditService);
  router = inject(Router);
  isAdminRoute = false;

  constructor() {
    this.checkAdminRoute(this.router.url);
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkAdminRoute(event.urlAfterRedirects || event.url);
    });

    this.initMobileHardwareBackButton();
  }

  private checkAdminRoute(url: string): void {
    this.isAdminRoute = !!url && (url.startsWith('/admin') || url.includes('/admin'));
  }

  private initMobileHardwareBackButton(): void {
    if (Capacitor.isNativePlatform()) {
      App.addListener('backButton', ({ canGoBack }) => {
        // 1. If shopping cart drawer is open on mobile, close it first
        if (this.cartService.isDrawerOpen()) {
          this.cartService.closeDrawer();
          return;
        }

        // 2. If at home or root, exit application
        const currentUrl = this.router.url.split('?')[0];
        if (currentUrl === '/home' || currentUrl === '/') {
          App.exitApp();
        } else if (canGoBack) {
          window.history.back();
        } else {
          this.router.navigate(['/home']);
        }
      });
    }
  }
}
