import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartItem, Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly CART_KEY = 'electrical_vibers_cart_v1';
  private itemsSubject = new BehaviorSubject<CartItem[]>([]);
  public items$: Observable<CartItem[]> = this.itemsSubject.asObservable();

  private isDrawerOpenSubject = new BehaviorSubject<boolean>(false);
  public isDrawerOpen$: Observable<boolean> = this.isDrawerOpenSubject.asObservable();

  constructor() {
    this.loadCart();
  }

  openDrawer(): void {
    this.isDrawerOpenSubject.next(true);
  }

  closeDrawer(): void {
    this.isDrawerOpenSubject.next(false);
  }

  toggleDrawer(): void {
    this.isDrawerOpenSubject.next(!this.isDrawerOpenSubject.getValue());
  }

  isDrawerOpen(): boolean {
    return this.isDrawerOpenSubject.getValue();
  }

  private triggerHapticFeedback(style: ImpactStyle = ImpactStyle.Light): void {
    if (Capacitor.isPluginAvailable('Haptics')) {
      try {
        Haptics.impact({ style }).catch(() => {});
      } catch (_) {}
    }
  }


  private loadCart(): void {
    let saved = localStorage.getItem(this.CART_KEY);
    if (!saved) {
      saved = localStorage.getItem('voltmaster_cart_v1');
    }
    if (saved) {
      try {
        this.itemsSubject.next(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse cart items:', e);
      }
    }
  }

  private saveCart(items: CartItem[]): void {
    localStorage.setItem(this.CART_KEY, JSON.stringify(items));
    this.itemsSubject.next(items);
  }

  getItems(): CartItem[] {
    return this.itemsSubject.getValue();
  }

    addToCart(product: Product, quantity = 1, openDrawer = true): { success: boolean; message?: string } {
    if (!product.inStock || (product.stock !== undefined && product.stock <= 0)) {
      return { success: false, message: `${product.name} is currently out of stock.` };
    }

    const current = this.itemsSubject.getValue();
    const existingIndex = current.findIndex(i => i.product.id === product.id);

    let updated: CartItem[];
    if (existingIndex > -1) {
      const currentQty = current[existingIndex].quantity;
      const targetQty = currentQty + quantity;
      if (product.stock !== undefined && targetQty > product.stock) {
        return { success: false, message: `Only ${product.stock} units available in stock.` };
      }
      updated = current.map((item, idx) => {
        if (idx === existingIndex) {
          return { ...item, quantity: targetQty };
        }
        return item;
      });
    } else {
      if (product.stock !== undefined && quantity > product.stock) {
        return { success: false, message: `Only ${product.stock} units available in stock.` };
      }
      updated = [...current, { product, quantity }];
    }

    this.saveCart(updated);
    this.triggerHapticFeedback(ImpactStyle.Medium);

    if (openDrawer) {
      this.openDrawer();
    }
    return { success: true };
  }

    updateQuantity(productId: string, quantity: number): { success: boolean; message?: string } {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return { success: true };
    }

    const currentItem = this.itemsSubject.getValue().find(i => i.product.id === productId);
    if (currentItem && currentItem.product.stock !== undefined && quantity > currentItem.product.stock) {
      return { success: false, message: `Only ${currentItem.product.stock} units available in stock.` };
    }

    const updated = this.itemsSubject.getValue().map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity };
      }
      return item;
    });

    this.saveCart(updated);
    this.triggerHapticFeedback(ImpactStyle.Light);
    return { success: true };
  }

  removeFromCart(productId: string): void {
    const updated = this.itemsSubject.getValue().filter(item => item.product.id !== productId);
    this.saveCart(updated);
  }

  clearCart(): void {
    this.saveCart([]);
  }

  getTotalCount(): number {
    return this.itemsSubject.getValue().reduce((sum, item) => sum + item.quantity, 0);
  }

  getSubtotal(): number {
    return this.itemsSubject.getValue().reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }

  getMrpTotal(): number {
    return this.itemsSubject.getValue().reduce((sum, item) => sum + (item.product.mrp * item.quantity), 0);
  }

  getTotalSavings(): number {
    return Math.max(0, this.getMrpTotal() - this.getSubtotal());
  }
}
