export interface Product {
  id: string;
  name: string;
  tamilName?: string;
  category: string;
  brand: string;
  price: number;
  mrp: number;
  discountPercentage?: number;
  rating?: number;
  ratingCount?: number;
  images: string[];
  description: string;
  specs: { [key: string]: string };
  stock: number;
  inStock: boolean;
  unit: string; // 'Piece', 'Coil (90m)', 'Box', 'Meter', 'Set'
  isFeatured?: boolean;
  warranty?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type ProductCategory = 
  | 'Wires & Cables'
  | 'Switches & Sockets'
  | 'MCB & Distribution'
  | 'LED & Lighting'
  | 'Fans & Ventilation'
  | 'Conduits & Fittings'
  | 'Pumps & Inverters'
  | 'Electrician Tools';
