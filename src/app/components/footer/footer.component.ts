import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConfigService, AppConfig } from '../../services/config.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  configService = inject(ConfigService);
  config: AppConfig = this.configService.getConfig();

  ngOnInit(): void {
    this.configService.config$.subscribe(cfg => {
      this.config = cfg;
    });
  }
}
