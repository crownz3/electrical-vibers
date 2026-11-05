import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PwaInstallService {
  private deferredPrompt: any = null;
  private canInstallSubject = new BehaviorSubject<boolean>(false);
  public canInstall$: Observable<boolean> = this.canInstallSubject.asObservable();

  private isStandaloneSubject = new BehaviorSubject<boolean>(false);
  public isStandalone$: Observable<boolean> = this.isStandaloneSubject.asObservable();

  constructor() {
    this.checkIfStandalone();
    this.initInstallPromptListener();
  }

  private checkIfStandalone(): void {
    if (typeof window !== 'undefined') {
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      this.isStandaloneSubject.next(isStandalone);
    }
  }

  private initInstallPromptListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (e: Event) => {
        // Prevent default browser mini-infobar from appearing on mobile
        e.preventDefault();
        this.deferredPrompt = e;
        this.canInstallSubject.next(true);
      });

      window.addEventListener('appinstalled', () => {
        this.deferredPrompt = null;
        this.canInstallSubject.next(false);
        this.isStandaloneSubject.next(true);
      });
    }
  }

  get canInstall(): boolean {
    return this.canInstallSubject.getValue();
  }

  get isStandalone(): boolean {
    return this.isStandaloneSubject.getValue();
  }

  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      this.canInstallSubject.next(false);
      return choiceResult.outcome === 'accepted';
    } catch (err) {
      console.warn('PWA install prompt error:', err);
      return false;
    }
  }
}

