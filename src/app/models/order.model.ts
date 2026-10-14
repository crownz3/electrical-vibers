import { CartItem } from './product.model';

export type OrderStatus = 'placed' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';
export type PaymentMethod = 'razorpay' | 'cod' | 'upi';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface Order {
  id: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: {
    street: string;
    city: string;
    pincode: string;
    landmark?: string;
  };
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayPaymentId?: string;
  orderStatus: OrderStatus;
  orderDate: string;
  notes?: string;
}
