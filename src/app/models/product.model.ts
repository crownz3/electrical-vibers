export interface Product {
  id: string;
  name: string;
  tamilName?: string;
  category: string;
  tamilCategory?: string;
  brand: string;
  price: number;
  mrp: number;
  discountPercentage?: number;
  rating?: number;
  ratingCount?: number;
  images: string[];
  description: string;
  tamilDescription?: string;
  specs: { [key: string]: string };
  stock: number;
  inStock: boolean;
  unit: string; // 'Piece', 'Coil (90m)', 'Box', 'Meter', 'Set'
  tamilUnit?: string; // 'எண்ணிக்கை', 'சுருள் (90மீ)', 'பெட்டி', 'மீட்டர்', 'தொகுப்பு'
  isFeatured?: boolean;
  warranty?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ProductCategoryItem {
  id: string;
  name: string;
  tamilName?: string;
  icon?: string;
}

export type ProductCategory = 
  | 'Wires & Cables'
  | 'Electrician Tools'
  | 'Cordless Battery Tools'
  | 'Switches & Sockets'
  | 'MCB & Distribution'
  | 'LED & Lighting'
  | 'Fans & Ventilation'
  | 'Conduits & Fittings'
  | 'Pumps & Inverters';
