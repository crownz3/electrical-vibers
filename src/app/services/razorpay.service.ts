import { Injectable, inject } from '@angular/core';
import { ConfigService } from './config.service';

export interface RazorpayPrefill {
  name?: string;
  email?: string;
  contact?: string;
}

export interface RazorpayTheme {
  color?: string;
  backdrop_color?: string;
  hide_topbar?: boolean;
}

export interface RazorpayPaymentSuccess {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export interface RazorpayCheckoutOptions {
  key?: string;
  amount: number; // in INR rupees or paise (auto-converted to paise if < 100000 and not already in paise)
  currency?: string; // default: 'INR'
  name: string;
  description?: string;
  image?: string;
  order_id?: string;
  prefill?: RazorpayPrefill;
  notes?: { [key: string]: string };
  theme?: RazorpayTheme;
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

declare let Razorpay: any;

@Injectable({
  providedIn: 'root'
})
export class RazorpayService {
  private configService = inject(ConfigService);
  private scriptLoaded = false;
  private scriptLoadingPromise: Promise<boolean> | null = null;

  // Default Razorpay Test Key (Can be overridden by AppConfig or environment)
  private readonly DEFAULT_KEY_ID = 'rzp_test_51K3nZ9aB2C7xY';

  getKeyId(): string {
    const config = this.configService.getConfig();
    return (config as any).razorpayKeyId || this.DEFAULT_KEY_ID;
  }

  isConfigured(): boolean {
    const key = this.getKeyId();
    return !!key && key.startsWith('rzp_');
  }

  /**
   * Dynamically loads the official Razorpay checkout SDK script.
   */
  loadScript(): Promise<boolean> {
    if (this.scriptLoaded && typeof (window as any).Razorpay !== 'undefined') {
      return Promise.resolve(true);
    }

    if (this.scriptLoadingPromise) {
      return this.scriptLoadingPromise;
    }

    this.scriptLoadingPromise = new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(false);
        return;
      }

      const existingScript = document.getElementById('razorpay-checkout-js');
      if (existingScript && typeof (window as any).Razorpay !== 'undefined') {
        this.scriptLoaded = true;
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.id = 'razorpay-checkout-js';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;

      script.onload = () => {
        this.scriptLoaded = true;
        resolve(true);
      };

      script.onerror = (err) => {
        console.error('Failed to load Razorpay SDK checkout script:', err);
        this.scriptLoadingPromise = null;
        resolve(false);
      };

      document.body.appendChild(script);
    });

    return this.scriptLoadingPromise;
  }

  /**
   * Opens the Razorpay payment gateway modal.
   * Returns a promise that resolves with the payment details on success,
   * or rejects with an error message on cancellation or failure.
   */
  async openPayment(options: RazorpayCheckoutOptions): Promise<RazorpayPaymentSuccess> {
    const isReady = await this.loadScript();
    if (!isReady || typeof (window as any).Razorpay === 'undefined') {
      throw new Error('Could not connect to Razorpay payment gateway. Please check your internet connection.');
    }

    const key = options.key || this.getKeyId();
    const config = this.configService.getConfig();

    // Razorpay requires amount in Paise (1 INR = 100 Paise)
    // If the caller passes amount in Rupees (e.g. 1500), convert to 150000 paise.
    const amountInPaise = Math.round(options.amount * 100);

    return new Promise((resolve, reject) => {
      let paymentCompleted = false;

      const rzpOptions: any = {
        key,
        amount: amountInPaise,
        currency: options.currency || 'INR',
        name: options.name || config.businessName || 'Electrical Vibers',
        description: options.description || 'Electrical Materials & Contracting Services',
        image: options.image || '/assets/icons/icon-192x192.png',
        order_id: options.order_id,
        prefill: {
          name: options.prefill?.name || '',
          email: options.prefill?.email || '',
          contact: options.prefill?.contact || ''
        },
        notes: {
          merchant: 'Electrical Vibers Chennai',
          platform: 'Electrical Vibers Mobile & Web PWA',
          ...options.notes
        },
        theme: {
          color: options.theme?.color || '#0284c7',
          ...options.theme
        },
        handler: (response: RazorpayPaymentSuccess) => {
          paymentCompleted = true;
          resolve(response);
        },
        modal: {
          ondismiss: () => {
            if (!paymentCompleted) {
              reject(new Error('Payment window was closed by the user.'));
            }
          },
          escape: true,
          backdropclose: false
        }
      };

      try {
        const rzp = new (window as any).Razorpay(rzpOptions);
        rzp.on('payment.failed', (response: any) => {
          paymentCompleted = true;
          const reason = response.error?.description || response.error?.reason || 'Transaction could not be completed.';
          reject(new Error(`Payment failed: ${reason}`));
        });
        rzp.open();
      } catch (err: any) {
        reject(new Error(err?.message || 'Error initializing Razorpay checkout modal.'));
      }
    });
  }
}

