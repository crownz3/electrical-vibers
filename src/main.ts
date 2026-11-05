import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideIonicAngular } from '@ionic/angular';
import { ErrorHandler, Injectable } from '@angular/core';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { loadingInterceptor } from './app/interceptors/loading.interceptor';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    const errorStr = error?.message || error?.toString() || '';
    const chunkFailed = /Loading chunk [\d]+ failed|Failed to fetch dynamically imported module/i.test(errorStr);
    if (chunkFailed) {
      console.warn('New application bundle detected on server. Reloading latest chunks...');
      const lastReload = sessionStorage.getItem('last_chunk_reload_ts');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem('last_chunk_reload_ts', now.toString());
        window.location.reload();
        return;
      }
    }
    console.error(error);
  }
}

bootstrapApplication(AppComponent, {
  providers: [
    provideIonicAngular(),
    provideHttpClient(withInterceptors([loadingInterceptor])),
    provideAnimationsAsync(),
    provideRouter(routes, withComponentInputBinding()),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
});
