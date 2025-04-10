/**
 * Alternatívna implementácia cartStore pre nasadenie na Vercel
 * Táto verzia volá na API endpointy vo Vercel namiesto Replit.app domény
 */

import { create } from 'zustand';
import { CartItem, CustomerInfo, Order, Pizza, PizzaSize, Extra } from '../types';

interface CartStore {
  items: CartItem[];
  delivery: number;
  customerInfo: CustomerInfo | null;
  orderCompleted: boolean;
  orderError: string | null;
  
  addToCart: (pizza: Pizza, size: PizzaSize, quantity: number, selectedIngredients: string[], selectedExtras: Extra[]) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getDeliveryFee: () => number;
  getTotal: () => number;
  setCustomerInfo: (info: CustomerInfo) => void;
  placeOrder: () => Promise<void>;
  resetOrder: () => void;
}

export const useCartStore = create<CartStore>()(
  (set, get) => ({
    items: [],
    delivery: 1.5, // Základný poplatok za donášku - 1,50€
    customerInfo: null,
    orderCompleted: false,
    orderError: null,
    
    addToCart: (pizza, size, quantity, selectedIngredients, selectedExtras) => {
      const newItem: CartItem = {
        id: pizza.id,
        name: pizza.name,
        price: pizza.price,
        size,
        quantity,
        ingredients: selectedIngredients,
        extras: selectedExtras,
        image: pizza.image
      };
      
      // Pripočítame cenu za extra ingrediencie
      if (selectedExtras.length > 0) {
        newItem.price += selectedExtras.reduce((total, extra) => total + extra.price, 0);
      }
      
      // Úprava ceny podľa typu pizze
      if (size === 'CREAM' || size === 'GLUTEN_FREE' || size === 'VEGAN' || size === 'THICK') {
        // Za netradičné typy pizze si účtujeme 1€ navyše
        newItem.price += 1;
      }
      
      set((state) => ({
        items: [...state.items, newItem],
        // Resetujeme orderCompleted pri pridaní novej položky
        orderCompleted: false
      }));
    },
    
    removeFromCart: (index) => {
      const { items } = get();
      set({ 
        items: items.filter((_, i) => i !== index),
        // Resetujeme orderCompleted pri odstránení položky
        orderCompleted: false 
      });
    },
    
    updateQuantity: (index, quantity) => {
      const { items } = get();
      const updatedItems = [...items];
      updatedItems[index].quantity = quantity;
      set({ 
        items: updatedItems,
        // Resetujeme orderCompleted pri zmene množstva
        orderCompleted: false 
      });
    },
    
    clearCart: () => {
      // Čistenie celého košíka a resetovanie stavových premenných
      set({ 
        items: [],
        orderCompleted: false,
        orderError: null
      });
    },
    
    getSubtotal: () => {
      const { items } = get();
      return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },
    
    getDeliveryFee: () => {
      const { items, customerInfo } = get();
      
      // Ak je vybraté vyzdvihnutie, vždy vrátime 0 bez ohľadu na počet pizz
      if (customerInfo && customerInfo.deliveryType === 'PICKUP') {
        return 0;
      }
      
      // Zrátame počet pizz v košíku (celkové množstvo)
      const totalPizzaCount = items.reduce((count, item) => count + item.quantity, 0);
      
      // Ak je objednávka na 2 a viac pizz, donáška je zadarmo
      if (totalPizzaCount >= 2) {
        return 0;
      }
      
      // Inak vrátime základný poplatok za donášku
      return get().delivery;
    },
    
    getTotal: () => {
      const subtotal = get().getSubtotal();
      const deliveryFee = get().getDeliveryFee();
      return subtotal + deliveryFee;
    },
    
    setCustomerInfo: (info) => {
      set({ 
        customerInfo: info,
        // Resetujeme orderCompleted pri zmene zákazníckych údajov
        orderCompleted: false
      });
    },
    
    placeOrder: async () => {
      const { items, customerInfo, getSubtotal, getDeliveryFee, getTotal } = get();
      
      if (!customerInfo) {
        set({ orderError: 'Neboli zadané údaje o zákazníkovi.' });
        return;
      }
      
      set({ orderError: null });
      
      try {
        console.log("Odosielam objednávku do systému:", customerInfo);
        
        // Vytvoríme objekt objednávky zo stavu košíka a údajov o zákazníkovi
        const order: Order = {
          customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          deliveryAddress: customerInfo.street,
          deliveryCity: customerInfo.city + (customerInfo.cityPart ? `, ${customerInfo.cityPart}` : ''),
          deliveryPostalCode: customerInfo.postalCode,
          deliveryType: customerInfo.deliveryType,
          deliveryFee: getDeliveryFee(),
          notes: customerInfo.notes,
          items: items,
          totalAmount: getTotal()
        };
        
        // DÔLEŽITÁ ZMENA: objednávky odosielame na API endpoint vo Vercel projekte
        console.log("Odosielam objednávku na API endpoint /api/orders...");
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(order)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Nepodarilo sa odoslať objednávku.');
        }
        
        // Úspešné odoslanie objednávky
        set({ orderCompleted: true });
        
        // Môžeme ponechať položky v košíku pre prípad, že by ich zákazník 
        // chcel znova objednať alebo pre prípad histórie objednávok
      } catch (error) {
        console.error("Chyba pri odosielaní objednávky:", error);
        set({ 
          orderError: error instanceof Error 
            ? error.message 
            : 'Nastala neočakávaná chyba pri odosielaní objednávky.'
        });
      }
    },
    
    resetOrder: () => {
      set({ 
        orderCompleted: false,
        orderError: null
      });
    }
  })
);