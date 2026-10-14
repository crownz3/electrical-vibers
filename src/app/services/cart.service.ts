import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartItem, Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly CART_KEY = 'voltmaster_cart_v1';
  private itemsSubject = new BehaviorSubject<CartItem[]>([]);
  public items$: Observable<CartItem[]> = this.itemsSubject.asObservable();

  constructor() {
    this.loadCart();
  }

  private loadCart(): void {
    const saved = localStorage.getItem(this.CART_KEY);
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

  addToCart(product: Product, quantity = 1): void {
    const current = this.itemsSubject.getValue();
    const existingIndex = current.findIndex(i => i.product.id === product.id);

    let updated: CartItem[];
    if (existingIndex > -1) {
      updated = current.map((item, idx) => {
        if (idx === existingIndex) {
          return { ...item, quantity: item.quantity + quantity };
        }
        return item;
      });
    } else {
      updated = [...current, { product, quantity }];
    }

    this.saveCart(updated);
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const updated = this.itemsSubject.getValue().map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity };
      }
      return item;
    });

    this.saveCart(updated);
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
