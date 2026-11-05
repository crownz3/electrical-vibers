import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';
import { firstValueFrom } from 'rxjs';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoadingService]
    });
    service = TestBed.inject(LoadingService);
  });

  it('should initialize with isLoading false', async () => {
    const loading = await firstValueFrom(service.isLoading$);
    expect(loading).toBe(false);
  });

  it('should toggle isLoading to true when show() is called', async () => {
    service.show();
    const loading = await firstValueFrom(service.isLoading$);
    expect(loading).toBe(true);

    service.hide();
    const loadingAfter = await firstValueFrom(service.isLoading$);
    expect(loadingAfter).toBe(false);
  });

  it('should manage multiple concurrent show and hide calls correctly', async () => {
    service.show();
    service.show();
    expect(await firstValueFrom(service.isLoading$)).toBe(true);

    service.hide();
    expect(await firstValueFrom(service.isLoading$)).toBe(true);

    service.hide();
    expect(await firstValueFrom(service.isLoading$)).toBe(false);

    // Guard against negative counts
    service.hide();
    expect(await firstValueFrom(service.isLoading$)).toBe(false);
  });

  it('should wrap a promise with show and hide', async () => {
    const p = Promise.resolve('test-data');
    const val = await service.wrap(p);
    expect(val).toBe('test-data');
    expect(await firstValueFrom(service.isLoading$)).toBe(false);
  });

  it('should hide loading even when wrapped promise rejects', async () => {
    const err = Promise.reject(new Error('API failure'));
    try {
      await service.wrap(err);
    } catch {
      // Expected error
    }
    expect(await firstValueFrom(service.isLoading$)).toBe(false);
  });
});
