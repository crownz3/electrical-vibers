import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product, ProductCategoryItem, CartItem } from '../models/product.model';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly PRODUCTS_KEY = 'electrical_vibers_products_v2';
  private readonly CATEGORIES_KEY = 'electrical_vibers_categories_v2';
  private readonly CATEGORY_ITEMS_KEY = 'electrical_vibers_category_items_v2';

  private defaultCategoryItems: ProductCategoryItem[] = [
    { id: 'cat-1', name: 'Wires & Cables', tamilName: 'ஒயர்கள் & கேபிள்கள்', icon: 'cable' },
    { id: 'cat-2', name: 'Electrician Tools', tamilName: 'எலக்ட்ரீஷியன் கருவிகள்', icon: 'handyman' },
    { id: 'cat-3', name: 'Cordless Battery Tools', tamilName: 'பேட்டரி பவர் டூல்ஸ்', icon: 'battery_charging_full' },
    { id: 'cat-4', name: 'Switches & Sockets', tamilName: 'சுவிட்சுகள் & சாக்கெட்டுகள்', icon: 'toggle_on' },
    { id: 'cat-5', name: 'MCB & Distribution', tamilName: 'MCB & விநியோக பெட்டிகள்', icon: 'power_settings_new' },
    { id: 'cat-6', name: 'LED & Lighting', tamilName: 'எல்இடி & விளக்குகள்', icon: 'lightbulb' },
    { id: 'cat-7', name: 'Fans & Ventilation', tamilName: 'ஃபேன்கள் & காற்றோட்டம்', icon: 'mode_fan' },
    { id: 'cat-8', name: 'Conduits & Fittings', tamilName: 'கான்ட்யூட் குழாய்கள் & பிட்டிங்ஸ்', icon: 'plumbing' },
    { id: 'cat-9', name: 'Pumps & Inverters', tamilName: 'மோட்டார் & இன்வெர்ட்டர்கள்', icon: 'solar_power' }
  ];

  private categoryItemsSubject = new BehaviorSubject<ProductCategoryItem[]>([]);
  public categoryItems$: Observable<ProductCategoryItem[]> = this.categoryItemsSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<string[]>([]);
  public categories$: Observable<string[]> = this.categoriesSubject.asObservable();

  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$: Observable<Product[]> = this.productsSubject.asObservable();

  constructor(private firebaseService: FirebaseService) {
    this.purgeLegacyDummyData();
    this.loadCategories();
    this.loadProducts();
    this.initCloudSync();
  }

  private purgeLegacyDummyData(): void {
    try {
      localStorage.removeItem('voltmaster_products_v1');
    } catch (_) {}
  }

  private initCloudSync(): void {
    // 1. Listen to Real-time Firestore Products Collection
    this.firebaseService.listenToCollection<Product>('products', (remoteProducts) => {
      if (remoteProducts) {
        this.saveProducts(remoteProducts, false);
      }
    });

    // 2. Listen to Firestore Categories
    this.firebaseService.listenToDocument<{ list?: string[]; items?: ProductCategoryItem[] }>(
      'app_metadata', 
      'categories', 
      (doc) => {
        if (doc?.items && Array.isArray(doc.items) && doc.items.length > 0) {
          this.saveCategoryItems(doc.items, false);
        } else if (doc?.list && Array.isArray(doc.list) && doc.list.length > 0) {
          this.saveCategories(doc.list, false);
        }
      }
    );
  }

  // --- Bilingual Category Management ---
  private loadCategories(): void {
    const savedItems = localStorage.getItem(this.CATEGORY_ITEMS_KEY);
    if (savedItems) {
      try {
        const parsed: ProductCategoryItem[] = JSON.parse(savedItems);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.categoryItemsSubject.next(parsed);
          this.categoriesSubject.next(parsed.map(c => c.name));
          return;
        }
      } catch (e) {
        console.error('Failed to parse saved category items:', e);
      }
    }

    const savedLegacy = localStorage.getItem(this.CATEGORIES_KEY);
    if (savedLegacy) {
      try {
        const parsed: string[] = JSON.parse(savedLegacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const items: ProductCategoryItem[] = parsed.map((name, idx) => {
            const def = this.defaultCategoryItems.find(d => d.name === name);
            return {
              id: 'cat-' + (idx + 1),
              name,
              tamilName: def?.tamilName || name,
              icon: def?.icon || 'category'
            };
          });
          this.saveCategoryItems(items);
          return;
        }
      } catch (e) {
        console.error('Failed to parse legacy categories:', e);
      }
    }

    this.saveCategoryItems(this.defaultCategoryItems);
  }

  private saveCategoryItems(items: ProductCategoryItem[], syncToCloud = true): void {
    localStorage.setItem(this.CATEGORY_ITEMS_KEY, JSON.stringify(items));
    localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(items.map(i => i.name)));
    this.categoryItemsSubject.next(items);
    this.categoriesSubject.next(items.map(i => i.name));

    if (syncToCloud) {
      this.firebaseService.setDocument('app_metadata', 'categories', { 
        items,
        list: items.map(i => i.name) 
      }).catch(err => {
        console.warn('Could not persist categories to Firestore:', err);
      });
    }
  }

  private saveCategories(categories: string[], syncToCloud = true): void {
    const items: ProductCategoryItem[] = categories.map((name, idx) => {
      const def = this.defaultCategoryItems.find(d => d.name === name);
      return {
        id: 'cat-' + (idx + 1),
        name,
        tamilName: def?.tamilName || name,
        icon: def?.icon || 'category'
      };
    });
    this.saveCategoryItems(items, syncToCloud);
  }

  getCategories(): string[] {
    return this.categoriesSubject.getValue();
  }

  getCategoryItems(): ProductCategoryItem[] {
    return this.categoryItemsSubject.getValue();
  }

  getCategoryTamil(categoryName: string): string {
    const found = this.categoryItemsSubject.getValue().find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    return found?.tamilName || categoryName;
  }

  addCategory(name: string, tamilName?: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    const current = this.categoryItemsSubject.getValue();
    if (!current.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      const newItem: ProductCategoryItem = {
        id: 'cat-' + Date.now(),
        name: trimmed,
        tamilName: (tamilName && tamilName.trim()) || trimmed,
        icon: 'category'
      };
      this.saveCategoryItems([...current, newItem]);
    }
  }

  updateCategory(oldName: string, newName: string, newTamilName?: string): void {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const current = this.categoryItemsSubject.getValue();
    const updated = current.map(c => {
      if (c.name === oldName) {
        return {
          ...c,
          name: trimmed,
          tamilName: (newTamilName && newTamilName.trim()) || c.tamilName || trimmed
        };
      }
      return c;
    });
    this.saveCategoryItems(updated);

    // Also update any products using this category
    const prods = this.productsSubject.getValue().map(p => {
      if (p.category === oldName) {
        return { 
          ...p, 
          category: trimmed,
          tamilCategory: (newTamilName && newTamilName.trim()) || p.tamilCategory || trimmed
        };
      }
      return p;
    });
    this.saveProducts(prods);
  }

  deleteCategory(name: string): void {
    const current = this.categoryItemsSubject.getValue();
    this.saveCategoryItems(current.filter(c => c.name !== name));
  }

  // --- Products Management (Clean / No Hardcoded Dummy Data) ---
  private loadProducts(): void {
    const saved = localStorage.getItem(this.PRODUCTS_KEY);
    if (saved) {
      try {
        const parsed: Product[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.productsSubject.next(parsed);
          return;
        }
      } catch (e) {
        console.error('Failed to parse saved products:', e);
      }
    }
    // Starts completely clean (0 dummy products)
    this.productsSubject.next([]);
  }

  private saveProducts(products: Product[], syncCloud = true): void {
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
    this.firebaseService.setDocument('products', newProduct.id, newProduct).catch(err => {
      console.warn('Could not save product to Firestore:', err);
    });
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): void {
    let modifiedProduct: Product | undefined;
    const updated = this.productsSubject.getValue().map(p => {
      if (p.id === id) {
        const merged = { ...p, ...updates };
        if (merged.mrp && merged.price && merged.mrp > merged.price) {
          merged.discountPercentage = Math.round(((merged.mrp - merged.price) / merged.mrp) * 100);
        }
        modifiedProduct = merged;
        return merged;
      }
      return p;
    });
    this.saveProducts(updated);

    if (modifiedProduct) {
      this.firebaseService.setDocument('products', id, modifiedProduct).catch(err => {
        console.warn('Could not update product in Firestore:', err);
      });
    }
  }

  deleteProduct(id: string): void {
    const updated = this.productsSubject.getValue().filter(p => p.id !== id);
    this.saveProducts(updated);
    this.firebaseService.deleteDocument('products', id).catch(err => {
      console.warn('Could not delete product from Firestore:', err);
    });
  }

  /**
   * Clears all products from inventory
   */
  clearAllProducts(): void {
    this.saveProducts([]);
  }

  /**
   * Pre-check stock availability before completing order checkout.
   */
  checkStockAvailability(items: { product: Product; quantity: number }[]): { valid: boolean; outOfStockItem?: string } {
    const prods = this.productsSubject.getValue();
    for (const item of items) {
      const prod = prods.find(p => p.id === item.product.id);
      if (!prod) {
        return { valid: false, outOfStockItem: `${item.product.name} (Not found in catalog)` };
      }
      if (!prod.inStock || (prod.stock !== undefined && prod.stock < item.quantity)) {
        return {
          valid: false,
          outOfStockItem: prod.stock !== undefined && prod.stock > 0 
            ? `${prod.name} (Only ${prod.stock} left in stock)` 
            : `${prod.name} is Out of Stock`
        };
      }
    }
    return { valid: true };
  }

  /**
   * Deducts purchased quantities from product stock, updates inStock flags,
   * and synchronizes changes to localStorage and Firestore.
   */
  deductInventory(items: { product: Product; quantity: number }[]): boolean {
    const currentProds = this.productsSubject.getValue();
    const updatedProds = [...currentProds];
    const modifiedList: Product[] = [];

    for (const item of items) {
      const idx = updatedProds.findIndex(p => p.id === item.product.id);
      if (idx > -1) {
        const prod = { ...updatedProds[idx] };
        const newStock = Math.max(0, (prod.stock || 0) - item.quantity);
        prod.stock = newStock;
        prod.inStock = newStock > 0;
        updatedProds[idx] = prod;
        modifiedList.push(prod);
      }
    }

    this.saveProducts(updatedProds);

    // Sync updated stock to Firestore
    modifiedList.forEach(p => {
      this.firebaseService.updateDocument('products', p.id, {
        stock: p.stock,
        inStock: p.inStock
      }).catch(err => {
        console.warn(`Could not sync stock for product ${p.id}:`, err);
      });
    });

    return true;
  }

  /**
   * Restores items back into inventory (e.g. on order cancellation).
   */
  restockInventory(items: { product: Product; quantity: number }[]): boolean {
    const currentProds = this.productsSubject.getValue();
    const updatedProds = [...currentProds];
    const modifiedList: Product[] = [];

    for (const item of items) {
      const idx = updatedProds.findIndex(p => p.id === item.product.id);
      if (idx > -1) {
        const prod = { ...updatedProds[idx] };
        const newStock = (prod.stock || 0) + item.quantity;
        prod.stock = newStock;
        prod.inStock = newStock > 0;
        updatedProds[idx] = prod;
        modifiedList.push(prod);
      }
    }

    this.saveProducts(updatedProds);

    modifiedList.forEach(p => {
      this.firebaseService.updateDocument('products', p.id, {
        stock: p.stock,
        inStock: p.inStock
      }).catch(err => {
        console.warn(`Could not restock product ${p.id}:`, err);
      });
    });

    return true;
  }
}
