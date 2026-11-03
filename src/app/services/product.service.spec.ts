import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ProductService } from './product.service';
import { FirebaseService } from './firebase.service';
import { CartItem, Product } from '../models/product.model';

describe('ProductService Inventory Operations', () => {
  let service: ProductService;
  let mockFirebaseService: any;

  const mockProduct: Product = {
    id: 'test-prod-1',
    name: 'Havells 2.5sqmm Wire 90m',
    brand: 'Havells',
    category: 'Wires & Cables',
    price: 1850,
    mrp: 2300,
    rating: 4.8,
    ratingCount: 120,
    inStock: true,
    stock: 10,
    unit: 'Coil (90m)',
    specs: {},
    images: ['assets/images/placeholder.png'],
    description: 'Flame retardant wire'
  };

  beforeEach(() => {
    localStorage.clear();
    mockFirebaseService = {
      listenToCollection: (_col: string, callback: any) => {
        callback([mockProduct]);
      },
      listenToDocument: vi.fn(),
      setDocument: vi.fn().mockResolvedValue(true),
      updateDocument: vi.fn().mockResolvedValue(true),
      deleteDocument: vi.fn().mockResolvedValue(true)
    };

    TestBed.configureTestingModule({
      providers: [
        ProductService,
        { provide: FirebaseService, useValue: mockFirebaseService }
      ]
    });

    service = TestBed.inject(ProductService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize and report correct stock availability', () => {
    const check1 = service.checkStockAvailability([{ product: mockProduct, quantity: 5 }]);
    expect(check1.valid).toBe(true);

    const check2 = service.checkStockAvailability([{ product: mockProduct, quantity: 15 }]);
    expect(check2.valid).toBe(false);
    expect(check2.outOfStockItem).toContain('Only 10 left in stock');
  });

  it('should deduct inventory upon purchase', () => {
    const cartItems: CartItem[] = [
      { product: mockProduct, quantity: 4 }
    ];

    const success = service.deductInventory(cartItems);
    expect(success).toBe(true);

    const updated = service.getProductById('test-prod-1');
    expect(updated?.stock).toBe(6);
    expect(updated?.inStock).toBe(true);
  });

  it('should mark inStock as false when all units are depleted', () => {
    const cartItems: CartItem[] = [
      { product: mockProduct, quantity: 10 }
    ];

    const success = service.deductInventory(cartItems);
    expect(success).toBe(true);

    const updated = service.getProductById('test-prod-1');
    expect(updated?.stock).toBe(0);
    expect(updated?.inStock).toBe(false);
  });

  it('should restock inventory when an order is cancelled', () => {
    // First deduct
    service.deductInventory([{ product: mockProduct, quantity: 5 }]);
    expect(service.getProductById('test-prod-1')?.stock).toBe(5);

    // Restock
    service.restockInventory([{ product: mockProduct, quantity: 3 }]);
    const restocked = service.getProductById('test-prod-1');
    expect(restocked?.stock).toBe(8);
    expect(restocked?.inStock).toBe(true);
  });
});
