import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { RazorpayService } from './razorpay.service';
import { ConfigService } from './config.service';

describe('RazorpayService', () => {
  let service: RazorpayService;
  let mockConfigService: any;

  beforeEach(() => {
    mockConfigService = {
      getConfig: () => ({
        businessName: 'Electrical Vibers Chennai',
        razorpayKeyId: 'rzp_test_testkey123'
      })
    };

    TestBed.configureTestingModule({
      providers: [
        RazorpayService,
        { provide: ConfigService, useValue: mockConfigService }
      ]
    });
    service = TestBed.inject(RazorpayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should retrieve configured key id', () => {
    expect(service.getKeyId()).toBe('rzp_test_testkey123');
  });

  it('should identify valid rzp key as configured', () => {
    expect(service.isConfigured()).toBe(true);
  });

  it('should throw an error if script fails to load when opening payment', async () => {
    vi.spyOn(service, 'loadScript').mockResolvedValue(false);

    await expect(service.openPayment({
      amount: 1500,
      name: 'Electrical Vibers Store'
    })).rejects.toThrow('Could not connect to Razorpay payment gateway');
  });

  it('should initialize Razorpay instance when script is ready', async () => {
    vi.spyOn(service, 'loadScript').mockResolvedValue(true);

    let capturedOptions: any = null;
    const mockRazorpayInstance = {
      open: vi.fn(),
      on: vi.fn()
    };

    (window as any).Razorpay = class {
      constructor(options: any) {
        capturedOptions = options;
        return mockRazorpayInstance;
      }
    };

    const paymentPromise = service.openPayment({
      amount: 250,
      name: 'Site Wiring Service',
      description: 'Deposit payment'
    });

    await Promise.resolve();

    expect(capturedOptions).toBeTruthy();
    expect(capturedOptions.amount).toBe(25000); // 250 * 100 paise
    expect(capturedOptions.name).toBe('Site Wiring Service');
    expect(mockRazorpayInstance.open).toHaveBeenCalled();

    // Simulate successful payment callback
    capturedOptions.handler({
      razorpay_payment_id: 'pay_test_12345',
      razorpay_order_id: 'order_test_12345'
    });

    const result = await paymentPromise;
    expect(result.razorpay_payment_id).toBe('pay_test_12345');

    // Clean up window
    delete (window as any).Razorpay;
  });
});
