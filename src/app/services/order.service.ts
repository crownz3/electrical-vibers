import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Order, OrderStatus } from '../models/order.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly STORAGE_KEY = 'voltmaster_orders_v1';

  private initialOrders: Order[] = [
    {
      id: 'ORD-9042',
      customerName: 'Karthik Subramanian',
      customerPhone: '+91 98401 23456',
      deliveryAddress: {
        street: 'Plot No. 42, 3rd Main Road, Anna Nagar West',
        city: 'Chennai',
        pincode: '600040',
        landmark: 'Near Tower Park Roundabout'
      },
      items: [
        {
          product: {
            id: 'prod-1',
            name: 'Finolex FR 2.5 sq mm Single Core PVC Insulated Copper Wire',
            category: 'Wires & Cables',
            brand: 'Finolex',
            price: 2450,
            mrp: 2890,
            images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'],
            description: '',
            specs: {},
            stock: 35,
            inStock: true,
            unit: 'Coil (90m)'
          },
          quantity: 2
        },
        {
          product: {
            id: 'prod-2',
            name: 'Havells LifeLine Plus 1.5 sq mm Flame Retardant Wire',
            category: 'Wires & Cables',
            brand: 'Havells',
            price: 1680,
            mrp: 1950,
            images: ['https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=600&q=80'],
            description: '',
            specs: {},
            stock: 40,
            inStock: true,
            unit: 'Coil (90m)'
          },
          quantity: 3
        }
      ],
      subtotal: 9940,
      deliveryCharge: 0,
      discount: 450,
      totalAmount: 9490,
      paymentMethod: 'razorpay',
      paymentStatus: 'paid',
      razorpayPaymentId: 'pay_Kth98x01239a',
      orderStatus: 'dispatched',
      orderDate: '2026-10-20T10:15:00Z',
      notes: 'Please dispatch before 2 PM. Call security on arrival.'
    },
    {
      id: 'ORD-8910',
      customerName: 'Karthik Subramanian',
      customerPhone: '+91 98401 23456',
      deliveryAddress: {
        street: 'Site #18, OMR IT Expressway, Sholinganallur',
        city: 'Chennai',
        pincode: '600119',
        landmark: 'Near ELCOT SEZ Main Gate'
      },
      items: [
        {
          product: {
            id: 'prod-4',
            name: 'Schneider Electric Acti9 32A DP MCB',
            category: 'MCB & Distribution',
            brand: 'Schneider Electric',
            price: 720,
            mrp: 890,
            images: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80'],
            description: '',
            specs: {},
            stock: 22,
            inStock: true,
            unit: 'Piece'
          },
          quantity: 4
        },
        {
          product: {
            id: 'prod-3',
            name: 'Legrand Arteor 16A 3-Pin Smart Shuttered Socket',
            category: 'Switches & Sockets',
            brand: 'Legrand',
            price: 385,
            mrp: 450,
            images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80'],
            description: '',
            specs: {},
            stock: 50,
            inStock: true,
            unit: 'Piece'
          },
          quantity: 6
        }
      ],
      subtotal: 5190,
      deliveryCharge: 0,
      discount: 250,
      totalAmount: 4940,
      paymentMethod: 'cod',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      orderDate: '2026-10-14T16:45:00Z',
      notes: 'Delivered at site office.'
    },
    {
      id: 'ORD-8821',
      customerName: 'Anand Natarajan',
      customerPhone: '+91 98411 99887',
      deliveryAddress: {
        street: '12, Sarojini Street, T. Nagar',
        city: 'Chennai',
        pincode: '600017',
        landmark: 'Near Panagal Park'
      },
      items: [
        {
          product: {
            id: 'prod-1',
            name: 'Finolex FR 2.5 sq mm Single Core PVC Insulated Copper Wire',
            category: 'Wires & Cables',
            brand: 'Finolex',
            price: 2450,
            mrp: 2890,
            images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'],
            description: '',
            specs: {},
            stock: 35,
            inStock: true,
            unit: 'Coil (90m)'
          },
          quantity: 2
        }
      ],
      subtotal: 4900,
      deliveryCharge: 0,
      discount: 0,
      totalAmount: 4900,
      paymentMethod: 'razorpay',
      paymentStatus: 'paid',
      razorpayPaymentId: 'pay_NmB99x81726a',
      orderStatus: 'confirmed',
      orderDate: '2026-10-11T14:20:00Z'
    }
  ];

  private ordersSubject = new BehaviorSubject<Order[]>([]);
  public orders$: Observable<Order[]> = this.ordersSubject.asObservable();

  constructor() {
    this.loadOrders();
  }

  private loadOrders(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasKarthik = parsed.some((o: Order) => o.customerPhone === '+91 98401 23456');
          const merged = hasKarthik ? parsed : [...this.initialOrders, ...parsed];
          this.ordersSubject.next(merged);
          return;
        }
      } catch (e) {
        console.error('Failed to parse saved orders:', e);
      }
    }
    this.saveOrders(this.initialOrders);
  }

  private saveOrders(orders: Order[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders));
    this.ordersSubject.next(orders);
  }

  getOrders(): Order[] {
    return this.ordersSubject.getValue();
  }

  getOrderById(id: string): Order | undefined {
    return this.ordersSubject.getValue().find(o => o.id === id);
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
  }

  generateWhatsAppOrderLink(order: Order): string {
    const itemsText = order.items.map(i => `• ${i.product.name} (x${i.quantity}) - ₹${i.product.price * i.quantity}`).join('\n');
    const message = encodeURIComponent(
      `⚡ *Electrical Vibers Order Confirmation*\n\n` +
      `*Order ID:* ${order.id}\n` +
      `*Customer:* ${order.customerName} (${order.customerPhone})\n` +
      `*Address:* ${order.deliveryAddress.street}, ${order.deliveryAddress.city} - ${order.deliveryAddress.pincode}\n\n` +
      `*Items:*\n${itemsText}\n\n` +
      `*Total Amount:* ₹${order.totalAmount}\n` +
      `*Payment:* ${order.paymentMethod.toUpperCase()} (${order.paymentStatus.toUpperCase()})\n\n` +
      `Thank you for choosing Electrical Vibers!`
    );
    return `https://wa.me/${environment.whatsappNumber}?text=${message}`;
  }
}
