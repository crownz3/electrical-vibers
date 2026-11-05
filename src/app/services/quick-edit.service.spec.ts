import { TestBed } from '@angular/core/testing';
import { QuickEditService } from './quick-edit.service';

describe('QuickEditService', () => {
  let service: QuickEditService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [QuickEditService]
    });
    service = TestBed.inject(QuickEditService);
  });

  it('should initialize with closed state and visible edit markers', () => {
    expect(service.isOpen()).toBe(false);
    expect(service.activeType()).toBeNull();
    expect(service.editData()).toBeNull();
    expect(service.showEditMarkers()).toBe(true);
  });

  it('should open edit modal for hero type', () => {
    service.open('hero');
    expect(service.isOpen()).toBe(true);
    expect(service.activeType()).toBe('hero');
    expect(service.editData()).toBeNull();
  });

  it('should open edit modal with cloned item data for product', () => {
    const mockProduct = { id: 'p-1', name: 'Anchor Switch' };
    service.open('product', mockProduct);
    expect(service.isOpen()).toBe(true);
    expect(service.activeType()).toBe('product');
    expect(service.editData()).toEqual(mockProduct);
  });

  it('should close modal and reset active type and data', () => {
    service.open('banner');
    expect(service.isOpen()).toBe(true);

    service.close();
    expect(service.isOpen()).toBe(false);
    expect(service.activeType()).toBeNull();
    expect(service.editData()).toBeNull();
  });

  it('should toggle edit markers on/off', () => {
    expect(service.showEditMarkers()).toBe(true);
    service.toggleEditMarkers();
    expect(service.showEditMarkers()).toBe(false);
    service.toggleEditMarkers();
    expect(service.showEditMarkers()).toBe(true);
  });
});
