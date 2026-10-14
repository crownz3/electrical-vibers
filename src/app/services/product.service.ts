import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly PRODUCTS_KEY = 'voltmaster_products_v1';
  private readonly CATEGORIES_KEY = 'voltmaster_categories_v1';

  private defaultCategories: string[] = [
    'Wires & Cables',
    'Switches & Sockets',
    'MCB & Distribution',
    'LED & Lighting',
    'Fans & Ventilation',
    'Conduits & Fittings',
    'Pumps & Inverters',
    'Electrician Tools'
  ];

  private initialProducts: Product[] = [
    {
      id: 'prod-1',
      name: 'Finolex FR 2.5 sq mm Single Core PVC Insulated Copper Wire',
      tamilName: 'ஃபினோலெக்ஸ் 2.5 ச.மி.மீ இன்சுலேட்டட் செம்பு ஒயர் (90மீ)',
      category: 'Wires & Cables',
      brand: 'Finolex',
      price: 2450,
      mrp: 2890,
      discountPercentage: 15,
      rating: 4.8,
      ratingCount: 142,
      images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'],
      description: 'Finolex 100% pure electrolytic grade copper conductor wire. 1100V grade PVC insulated, Flame Retardant (FR). Ideal for house wiring power sockets and air conditioner points.',
      specs: {
        'Conductor Material': 'Electrolytic Bare Copper',
        'Length': '90 Meters Coil',
        'Voltage Grade': 'Up to 1100V',
        'Standard': 'IS: 694 Certified',
        'Flame Retardant': 'Yes (Oxygen Index > 29%)'
      },
      stock: 35,
      inStock: true,
      unit: 'Coil (90m)',
      isFeatured: true,
      warranty: 'Manufacturer Warranty'
    },
    {
      id: 'prod-2',
      name: 'Havells LifeLine Plus 1.5 sq mm S3 Cable',
      tamilName: 'ஹேவெல்ஸ் 1.5 ச.மி.மீ லைஃப்லைன் பிளஸ் ஒயர்',
      category: 'Wires & Cables',
      brand: 'Havells',
      price: 1680,
      mrp: 1990,
      discountPercentage: 16,
      rating: 4.7,
      ratingCount: 98,
      images: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80'],
      description: 'Premium S3 HR-FR cable with 101% conductivity. Superior heat resistance up to 85°C. Best suited for residential lighting and fan circuits.',
      specs: {
        'Conductor': 'High Purity Annealed Copper',
        'Length': '90 Meters',
        'Insulation': 'Heat Resistant Flame Retardant PVC',
        'Certifications': 'ISI Mark'
      },
      stock: 48,
      inStock: true,
      unit: 'Coil (90m)',
      isFeatured: true,
      warranty: 'Havells Assurance'
    },
    {
      id: 'prod-3',
      name: 'Anchor Roma Classic 16A 3-Pin Modular Switch & Socket Combo',
      tamilName: 'ஆங்கர் ரோமா 16A சுவிட்ச் & சாக்கெட் காம்போ',
      category: 'Switches & Sockets',
      brand: 'Anchor by Panasonic',
      price: 380,
      mrp: 490,
      discountPercentage: 22,
      rating: 4.9,
      ratingCount: 230,
      images: ['https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=600&q=80'],
      description: 'Heavy duty modular power switch & socket for geyser, refrigerator, and microwave points. Includes safety shutter to protect children.',
      specs: {
        'Rating': '16 Ampere, 240V AC',
        'Material': 'Flame Retardant Polycarbonate',
        'Safety': 'Child Safety Shutters',
        'Color': 'Glossy Arctic White'
      },
      stock: 85,
      inStock: true,
      unit: 'Combo Set',
      isFeatured: true,
      warranty: '5 Years Replacement Warranty'
    },
    {
      id: 'prod-4',
      name: 'Schneider Electric Acti9 32A DP (Double Pole) MCB',
      tamilName: 'ஸ்னைடர் எலக்ட்ரிக் 32A டபுள் போல் MCB',
      category: 'MCB & Distribution',
      brand: 'Schneider Electric',
      price: 720,
      mrp: 890,
      discountPercentage: 19,
      rating: 4.9,
      ratingCount: 88,
      images: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80'],
      description: 'Top-tier C-Curve Double Pole miniature circuit breaker. High breaking capacity (10kA). Guarantees overload and short circuit safety for main lines.',
      specs: {
        'Current Rating': '32A',
        'Poles': '2 Pole (DP)',
        'Breaking Capacity': '10kA IEC/EN 60898-1',
        'Tripping Curve': 'C-Curve'
      },
      stock: 22,
      inStock: true,
      unit: 'Piece',
      isFeatured: true,
      warranty: '2 Years Manufacturer Warranty'
    },
    {
      id: 'prod-5',
      name: 'Philips Stellar Bright 15W Round LED Recessed Panel Light',
      tamilName: 'பிலிப்ஸ் 15W வட்ட வடிவ எல்இடி பேனல் லைட்',
      category: 'LED & Lighting',
      brand: 'Philips',
      price: 499,
      mrp: 750,
      discountPercentage: 33,
      rating: 4.6,
      ratingCount: 310,
      images: ['https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=80'],
      description: 'Ultra slim aluminum die-cast LED panel light. Glare-free diffuser with EyeComfort technology. 1500 lumens brightness in Warm / Natural White.',
      specs: {
        'Wattage': '15 Watts',
        'Color Temp': '4000K Natural White / 6500K Cool Day',
        'Luminous Flux': '1500 lm',
        'Cutout Size': '6 Inch (150mm)',
        'Lifespan': '25,000 Hours'
      },
      stock: 60,
      inStock: true,
      unit: 'Piece',
      isFeatured: true,
      warranty: '2 Years Philips Warranty'
    },
    {
      id: 'prod-6',
      name: 'Atomberg Renesa 1200mm BLDC Smart Motor Ceiling Fan',
      tamilName: 'ஆட்டோம்பர்க் ரெனெசா BLDC ஸ்மார்ட் சீலிங் ஃபேன்',
      category: 'Fans & Ventilation',
      brand: 'Atomberg',
      price: 3690,
      mrp: 4790,
      discountPercentage: 23,
      rating: 4.8,
      ratingCount: 520,
      images: ['https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80'],
      description: 'Saves up to 65% electricity using BLDC motor technology. Consumes only 28W at top speed. Comes with smart remote control with Timer & Sleep modes.',
      specs: {
        'Sweep': '1200 mm',
        'Power Consumption': '28 Watts at Speed 5',
        'Control': 'Infrared Smart Remote Included',
        'Air Delivery': '235 CMM',
        'Speed': '360 RPM'
      },
      stock: 14,
      inStock: true,
      unit: 'Piece',
      isFeatured: true,
      warranty: '2 + 1 Year Extended Warranty'
    }
  ];

  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$: Observable<Product[]> = this.productsSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<string[]>([]);
  public categories$: Observable<string[]> = this.categoriesSubject.asObservable();

  constructor() {
    this.loadProducts();
    this.loadCategories();
  }

  // --- Dynamic Categories ---
  private loadCategories(): void {
    const saved = localStorage.getItem(this.CATEGORIES_KEY);
    if (saved) {
      try {
        this.categoriesSubject.next(JSON.parse(saved));
        return;
      } catch (e) {
        console.error('Failed to load categories:', e);
      }
    }
    this.saveCategories(this.defaultCategories);
  }

  private saveCategories(categories: string[]): void {
    localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(categories));
    this.categoriesSubject.next(categories);
  }

  getCategories(): string[] {
    return this.categoriesSubject.getValue();
  }

  addCategory(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    const current = this.categoriesSubject.getValue();
    if (!current.includes(trimmed)) {
      this.saveCategories([...current, trimmed]);
    }
  }

  updateCategory(oldName: string, newName: string): void {
    const trimmed = newName.trim();
    if (!trimmed || oldName === trimmed) return;
    const current = this.categoriesSubject.getValue();
    const updated = current.map(c => c === oldName ? trimmed : c);
    this.saveCategories(updated);

    // Also update any products using this category
    const prods = this.productsSubject.getValue().map(p => {
      if (p.category === oldName) {
        return { ...p, category: trimmed };
      }
      return p;
    });
    this.saveProducts(prods);
  }

  deleteCategory(name: string): void {
    const current = this.categoriesSubject.getValue();
    this.saveCategories(current.filter(c => c !== name));
  }

  // --- Products CRUD ---
  private loadProducts(): void {
    const saved = localStorage.getItem(this.PRODUCTS_KEY);
    if (saved) {
      try {
        this.productsSubject.next(JSON.parse(saved));
        return;
      } catch (e) {
        console.error('Failed to parse saved products:', e);
      }
    }
    this.saveProducts(this.initialProducts);
  }

  private saveProducts(products: Product[]): void {
    localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(products));
    this.productsSubject.next(products);
  }

  getProducts(): Product[] {
    return this.productsSubject.getValue();
  }

  getProductById(id: string): Product | undefined {
    return this.productsSubject.getValue().find(p => p.id === id);
  }

  addProduct(product: Omit<Product, 'id'>): Product {
    const newProduct: Product = {
      ...product,
      id: 'prod-' + Date.now()
    };
    const updated = [newProduct, ...this.productsSubject.getValue()];
    this.saveProducts(updated);
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): void {
    const updated = this.productsSubject.getValue().map(p => {
      if (p.id === id) {
        const merged = { ...p, ...updates };
        // Auto-recalculate discount % if price or mrp changes
        if (merged.mrp && merged.price && merged.mrp > merged.price) {
          merged.discountPercentage = Math.round(((merged.mrp - merged.price) / merged.mrp) * 100);
        }
        return merged;
      }
      return p;
    });
    this.saveProducts(updated);
  }

  deleteProduct(id: string): void {
    const updated = this.productsSubject.getValue().filter(p => p.id !== id);
    this.saveProducts(updated);
  }
}
