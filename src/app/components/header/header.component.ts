import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { CustomerService } from '../../services/customer.service';
import { ConfigService, AppConfig } from '../../services/config.service';
import { ProductService } from '../../services/product.service';
import { ThemeService, ThemePreference } from '../../services/theme.service';
import { PwaInstallService } from '../../services/pwa-install.service';
import { LanguageService } from '../../services/language.service';
import { Product } from '../../models/product.model';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  cartService = inject(CartService);
  authService = inject(AuthService);
  customerService = inject(CustomerService);
  configService = inject(ConfigService);
  productService = inject(ProductService);
  themeService = inject(ThemeService);
  pwaService = inject(PwaInstallService);
  langService = inject(LanguageService);
  router = inject(Router);

  config: AppConfig = this.configService.getConfig();
  allProducts: Product[] = [];
  searchQuery = '';
  searchResults: Product[] = [];
  isSearchOpen = false;
  canInstallPwa = false;

  // Theme Switcher State
  showThemeMenu = false;

  // Admin Account & Modal State
  showAdminLoginModal = false;
  showAdminMenu = false;
  adminLoginError = '';

  toggleThemeMenu(): void {
    this.showThemeMenu = !this.showThemeMenu;
  }

  selectTheme(pref: ThemePreference): void {
    this.themeService.setPreference(pref);
    this.showThemeMenu = false;
  }

  quickCycleTheme(): void {
    this.themeService.cyclePreference();
  }

  ngOnInit(): void {
    this.configService.config$.subscribe(cfg => {
      this.config = cfg;
    });

    this.productService.products$.subscribe(prods => {
      this.allProducts = prods;
    });

    this.pwaService.canInstall$.subscribe(can => {
      this.canInstallPwa = can;
    });
  }

  installApp(): void {
    this.pwaService.promptInstall();
  }

  get cartCount(): number {
    return this.cartService.getTotalCount();
  }

  get customerProfile() {
    return this.customerService.getProfile();
  }

  openCart(event?: Event): void {
    if (event) event.preventDefault();
    this.cartService.toggleDrawer();
  }

  onSearchInput(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.searchResults = [];
      return;
    }

    this.searchResults = this.allProducts
      .filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.tamilName && p.tamilName.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }

  selectProduct(product: Product): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.isSearchOpen = false;
    this.router.navigate(['/product', product.id]);
  }

  submitSearch(): void {
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim();
      this.searchResults = [];
      this.isSearchOpen = false;
      this.router.navigate(['/products'], { queryParams: { q } });
    }
  }

  closeSearch(): void {
    this.isSearchOpen = false;
    this.searchResults = [];
  }

  // --- Admin Account Button Click Handler ---
  onAdminAccountClick(): void {
    this.showAdminLoginModal = false;
    this.router.navigate(['/admin']);
  }

  goToAdminPortal(): void {
    this.showAdminMenu = false;
    this.showAdminLoginModal = false;
    this.router.navigate(['/admin']);
  }

  async handleGoogleSignIn(): Promise<void> {
    this.adminLoginError = '';
    try {
      const res = await this.authService.signInWithGoogle();
      if (res.success) {
        this.showAdminLoginModal = false;
        this.router.navigate(['/admin']);
      } else if (res.error) {
        this.adminLoginError = res.error;
      }
    } catch (err: any) {
      this.adminLoginError = err?.message || 'Authentication error. Please select authorized admin account.';
    }
  }

  

  logoutAdmin(): void {
    this.authService.logout();
    this.showAdminMenu = false;
    this.router.navigate(['/home']);
  }
}
