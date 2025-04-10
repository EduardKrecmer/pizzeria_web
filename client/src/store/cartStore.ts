import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Pizza, Extra, PizzaSize, CustomerInfo, Order, DeliveryType } from '../types';

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

const SIZES: Record<PizzaSize, number> = {
  'REGULAR': 0,
  'CREAM': 0,
  'GLUTEN_FREE': 1.50,
  'VEGAN': 2.00,
  'THICK': 1.00
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      delivery: 1.50, // Základná cena dopravy
      customerInfo: null,
      orderCompleted: false,
      orderError: null,

      addToCart: (pizza, size, quantity, selectedIngredients, selectedExtras) => {
        const { items } = get();
        // Ensure that pizza.price is a number and is not undefined/null
        const basePrice = typeof pizza.price === 'number' ? pizza.price : 0;
        
        // Calculate price with size adjustment 
        const sizeAdjustment = SIZES[size] || 0;
        const adjustedPrice = basePrice + sizeAdjustment;
        
        // Calculate extras price - ensure price property exists and is a number
        const extrasPrice = selectedExtras.reduce((sum, extra) => {
          const extraPrice = typeof extra.price === 'number' ? extra.price : 0;
          return sum + extraPrice;
        }, 0);
        
        // Final item price
        const itemPrice = adjustedPrice + extrasPrice;
        
        const newItem: CartItem = {
          id: pizza.id,
          name: pizza.name,
          price: itemPrice,
          size,
          quantity,
          ingredients: selectedIngredients,
          extras: selectedExtras,
          image: pizza.image
        };
        
        // Vždy resetujeme orderCompleted pri pridaní novej položky do košíka
        set({ 
          items: [...items, newItem],
          orderCompleted: false,
          orderError: null
        });
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
        const totalPizzaCount = items.reduce((sum, item) => sum + item.quantity, 0);
        
        // Doprava zdarma pri 2+ pizzách, 1.50€ pri jednej pizze (len pre doručenie)
        return totalPizzaCount >= 2 ? 0 : 1.50;
      },
      
      getTotal: () => {
        const subtotal = get().getSubtotal();
        const deliveryFee = get().getDeliveryFee();
        return subtotal + deliveryFee;
      },
      
      setCustomerInfo: (info) => {
        set({ 
          customerInfo: info,
          // Resetujeme orderCompleted pri zmene údajov zákazníka
          orderCompleted: false 
        });
      },
      
      placeOrder: async () => {
        const { items, customerInfo, getTotal } = get();
        
        if (!customerInfo || items.length === 0) {
          set({ orderError: 'Chýbajú údaje potrebné pre dokončenie objednávky' });
          return;
        }
        
        try {
          // Vytvorenie adresy vrátane časti obce, ak bola vybraná
          const fullAddress = customerInfo.cityPart 
            ? `${customerInfo.street} (${customerInfo.cityPart})` 
            : customerInfo.street;

          // Logovanie informácií o vytváranej objednávke
          console.log('Odosielam objednávku do systému:', {
            meno: customerInfo.firstName,
            email: customerInfo.email || 'nezadaný',
            telefon: customerInfo.phone,
            adresa: fullAddress,
            mesto: customerInfo.city,
            pocet_poloziek: items.length,
            typ_dorucenia: customerInfo.deliveryType,
            celkova_suma: getTotal().toFixed(2)
          });

          const order: Order = {
            customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
            customerEmail: customerInfo.email,
            customerPhone: customerInfo.phone,
            deliveryAddress: fullAddress,
            deliveryCity: customerInfo.city,
            deliveryPostalCode: customerInfo.postalCode,
            deliveryType: customerInfo.deliveryType,
            deliveryFee: get().getDeliveryFee(),
            notes: customerInfo.notes,
            items: items,
            totalAmount: getTotal()
          };
          
          console.log('Odosielam objednávku na API endpoint /api/orders...');
          
          // Určíme API endpoint - preferujeme hlavný API server, ale máme záložné riešenie
          const apiEndpoint = 
            window.location.hostname === 'localhost' || window.location.hostname.includes('replit') 
              ? '/api/orders' // pre lokálny vývoj a Replit autoscale
              : 'https://pizza-order-pro-krecmereduard.replit.app/api/orders'; // fallback pre prípad problémov
          
          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(order),
            // Pre cross-origin requesty
            mode: 'cors',
            credentials: 'omit'
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('API vrátilo chybu:', errorData);
            throw new Error(errorData.message || 'Failed to place order');
          }
          
          const responseData = await response.json();
          console.log('Objednávka úspešne vytvorená:', {
            order_id: responseData.id,
            status: responseData.status,
            created: responseData.createdAt
          });
          
          // Nastavíme orderCompleted až po vyčistení košíka aby sme predišli stavu, keď by sa košík upravil so stavom orderCompleted=true
          get().clearCart();
          set({ orderCompleted: true, orderError: null });
        } catch (error) {
          console.error('Chyba pri odosielaní objednávky:', error);
          set({ 
            orderError: error instanceof Error ? error.message : 'Nastala chyba pri spracovaní objednávky' 
          });
        }
      },
      
      resetOrder: () => {
        set({ orderCompleted: false, orderError: null });
      }
    }),
    {
      name: 'pizza-cart'
    }
  )
);
