import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { ConfigService, AppConfig } from '../../services/config.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  cartService = inject(CartService);
  authService = inject(AuthService);
  configService = inject(ConfigService);
  router = inject(Router);

  config: AppConfig = this.configService.getConfig();

  ngOnInit(): void {
    this.configService.config$.subscribe(cfg => {
      this.config = cfg;
    });
  }

  get cartCount(): number {
    return this.cartService.getTotalCount();
  }

  toggleAdminRole(): void {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/admin']);
    }
  }
}
