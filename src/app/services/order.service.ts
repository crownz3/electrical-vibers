import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Order, OrderStatus } from '../models/order.model';
import { environment } from '../../environments/environment';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly STORAGE_KEY = 'electrical_vibers_orders_v1';

  private ordersSubject = new BehaviorSubject<Order[]>([]);
  public orders$: Observable<Order[]> = this.ordersSubject.asObservable();

  constructor(private firebaseService: FirebaseService) {
    this.loadOrders();
    this.initCloudSync();
  }

  private initCloudSync(): void {
    // Real-time Firestore sync
    this.firebaseService.listenToCollection<Order>('orders', (remoteOrders) => {
      if (remoteOrders) {
        const sorted = [...remoteOrders].sort((a, b) => 
          new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
        );
        this.saveOrders(sorted, false);
      }
    });
  }

  private loadOrders(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const parsed: Order[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out any legacy dummy orders for Karthik Subramanian
          const realOrders = parsed.filter(o => o.customerName !== 'Karthik Subramanian' || o.customerPhone !== '+91 98401 23456');
          this.ordersSubject.next(realOrders);
          return;
        }
      } catch (e) {
        console.error('Failed to parse saved orders:', e);
      }
    }
    this.ordersSubject.next([]);
  }

  private saveOrders(orders: Order[], syncToCloud = true): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders));
    this.ordersSubject.next(orders);
  }

  getOrders(): Order[] {
    return this.ordersSubject.getValue();
  }

  getOrderById(id: string): Order | undefined {
    return this.ordersSubject.getValue().find(o => o.id === id);
  }

  getOrdersByPhone(phone: string): Order[] {
    const clean = phone.replace(/\D/g, '');
    return this.ordersSubject.getValue().filter(o => {
      const orderPhone = o.customerPhone.replace(/\D/g, '');
      return orderPhone.includes(clean) || clean.includes(orderPhone);
    });
  }

  createOrder(orderData: Omit<Order, 'id' | 'orderDate' | 'orderStatus'>): Order {
    const newOrder: Order = {
      ...orderData,
      id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
      orderDate: new Date().toISOString(),
      orderStatus: 'placed'
    };

    const updated = [newOrder, ...this.ordersSubject.getValue()];
    this.saveOrders(updated);

    // Persist to Cloud Firestore immediately
    this.firebaseService.setDocument('orders', newOrder.id, newOrder).catch(err => {
      console.warn('Could not persist new order to Firestore:', err);
    });

    return newOrder;
  }

  updateOrderStatus(id: string, status: OrderStatus): void {
    const updated = this.ordersSubject.getValue().map(o => {
      if (o.id === id) {
        return { ...o, orderStatus: status };
      }
      return o;
    });
    this.saveOrders(updated);

    // Persist status change to Firestore
    this.firebaseService.updateDocument('orders', id, { orderStatus: status }).catch(err => {
      console.warn('Could not update order status in Firestore:', err);
    });
  }

  generateWhatsAppOrderLink(order: Order): string {
    const itemsText = order.items.map(i => `- ${i.product.name} (x${i.quantity}) - Rs. ${i.product.price * i.quantity}`).join('\n');
    const message = encodeURIComponent(
      `*Electrical Vibers Order Confirmation*\n\n` +
      `*Order ID:* ${order.id}\n` +
      `*Customer:* ${order.customerName} (${order.customerPhone})\n` +
      `*Address:* ${order.deliveryAddress.street}, ${order.deliveryAddress.city} - ${order.deliveryAddress.pincode}\n\n` +
      `*Items:*\n${itemsText}\n\n` +
      `*Total Amount:* Rs. ${order.totalAmount}\n` +
      `*Payment:* ${order.paymentMethod.toUpperCase()} (${order.paymentStatus.toUpperCase()})\n\n` +
      `Thank you for choosing Electrical Vibers!`
    );
    return `https://wa.me/${environment.whatsappNumber}?text=${message}`;
  }
}
