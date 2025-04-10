export type PizzaSize = 'REGULAR' | 'CREAM' | 'GLUTEN_FREE' | 'VEGAN' | 'THICK';

export interface SizeOption {
  size: PizzaSize;
  label: string;
  priceModifier: number;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  size: PizzaSize;
  quantity: number;
  ingredients: string[];
  extras: Extra[];
  image: string;
}

export interface Pizza {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  tags: string[];
  ingredients: string[];
  weight?: string | null;
  allergens?: string | null;
}

export interface Extra {
  id: number;
  name: string;
  price: number;
  amount?: string; // gramáž, počet kusov atď.
}

export type DeliveryType = 'DELIVERY' | 'PICKUP';

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  cityPart?: string;
  postalCode: string;
  notes: string;
  deliveryType: DeliveryType;
}

export interface OrderSummary {
  subtotal: number;
  delivery: number;
  discount: number;
  total: number;
}

export interface Order {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryPostalCode: string;
  deliveryType: DeliveryType;
  deliveryFee: number;
  notes?: string;
  items: CartItem[];
  totalAmount: number;
}
