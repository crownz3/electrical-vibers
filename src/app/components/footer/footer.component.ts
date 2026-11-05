import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConfigService, AppConfig } from '../../services/config.service';
import { LanguageService } from '../../services/language.service';
import { AuthService } from '../../services/auth.service';
import { QuickEditService } from '../../services/quick-edit.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  configService = inject(ConfigService);
  langService = inject(LanguageService);
  authService = inject(AuthService);
  quickEditService = inject(QuickEditService);
  config: AppConfig = this.configService.getConfig();

  ngOnInit(): void {
    this.configService.config$.subscribe(cfg => {
      this.config = cfg;
    });
  }
}
