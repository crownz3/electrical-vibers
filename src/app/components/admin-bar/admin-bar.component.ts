import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { QuickEditService } from '../../services/quick-edit.service';

@Component({
  selector: 'app-admin-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-bar.component.html',
  styleUrls: ['./admin-bar.component.scss']
})
export class AdminBarComponent {
  authService = inject(AuthService);
  quickEditService = inject(QuickEditService);
  router = inject(Router);

  get adminUser() {
    return this.authService.getCurrentUser();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}

