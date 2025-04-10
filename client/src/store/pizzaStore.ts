import { create } from 'zustand';
import { Pizza, Extra } from '../types';

interface PizzaStore {
  pizzas: Pizza[];
  filteredPizzas: Pizza[];
  isLoading: boolean;
  error: string | null;
  extras: Extra[];
  activeCategory: string;
  searchTerm: string;
  
  fetchPizzas: () => Promise<void>;
  fetchExtras: () => Promise<void>;
  getPizzaById: (id: number) => Pizza | undefined;
  setActiveCategory: (category: string) => void;
  setSearchTerm: (term: string) => void;
  filterPizzas: () => void;
}

export const usePizzaStore = create<PizzaStore>((set, get) => ({
  pizzas: [],
  filteredPizzas: [],
  isLoading: false,
  error: null,
  extras: [],
  activeCategory: 'Všetky',
  searchTerm: '',
  
  fetchPizzas: async () => {
    set({ isLoading: true, error: null });
    try {
      // Vždy používame relatívnu cestu - každé nasadenie má používať svoje vlastné API
      const apiEndpoint = '/api/pizzas';
      
      console.log('Načítavam pizze z relatívnej cesty:', apiEndpoint);
      const response = await fetch(apiEndpoint, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch pizzas: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('API returned invalid data format: expected an array of pizzas');
      }
      
      // Normalizujeme dáta - zabezpečíme, že každá pizza má všetky potrebné vlastnosti
      const normalizedData = data.map(pizza => ({
        id: pizza.id || 0,
        name: pizza.name || 'Neznáma pizza',
        description: pizza.description || '',
        price: typeof pizza.price === 'number' ? pizza.price : 0,
        image: pizza.image || '/placeholder-pizza.jpg',
        tags: Array.isArray(pizza.tags) ? pizza.tags : [],
        ingredients: Array.isArray(pizza.ingredients) ? pizza.ingredients : [],
        weight: pizza.weight || null,
        allergens: pizza.allergens || null
      }));
      
      set({ 
        pizzas: normalizedData,
        isLoading: false 
      });
      
      // Po načítaní pizze aplikujeme filtre
      get().filterPizzas();
    } catch (error) {
      console.error('Error fetching pizzas:', error);
      set({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred', 
        isLoading: false,
        pizzas: [] // Nastavíme prázdne pole, aby sme predišli chybám pri filtrovaní
      });
    }
  },
  
  fetchExtras: async () => {
    try {
      // Vždy používame relatívnu cestu - každé nasadenie má používať svoje vlastné API
      const apiEndpoint = '/api/extras';
      
      console.log('Načítavam extra položky z relatívnej cesty:', apiEndpoint);
      const response = await fetch(apiEndpoint, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch extras: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('API returned invalid data format for extras: expected an array');
      }
      
      // Normalizujeme dáta extras
      const normalizedExtras = data.map(extra => ({
        id: extra.id || 0,
        name: extra.name || 'Neznáma príloha',
        price: typeof extra.price === 'number' ? extra.price : 0,
        amount: extra.amount || ''
      }));
      
      set({ extras: normalizedExtras });
    } catch (error) {
      console.error('Error fetching extras:', error);
      set({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        extras: [] // Nastavíme prázdne pole, aby sme predišli chybám
      });
    }
  },
  
  getPizzaById: (id: number) => {
    return get().pizzas.find(pizza => pizza.id === id);
  },
  
  setActiveCategory: (category: string) => {
    set({ activeCategory: category });
    get().filterPizzas();
    // Po zmene kategórie môžeme resetovať počet viditeľných pizz v Home.tsx pomocou eventu
    document.dispatchEvent(new CustomEvent('resetVisiblePizzas'));
  },
  
  setSearchTerm: (term: string) => {
    set({ searchTerm: term });
    get().filterPizzas();
    // Po zmene vyhľadávania môžeme resetovať počet viditeľných pizz v Home.tsx pomocou eventu
    document.dispatchEvent(new CustomEvent('resetVisiblePizzas'));
  },
  
  filterPizzas: () => {
    const { pizzas, activeCategory, searchTerm } = get();
    let filtered = [...pizzas];
    
    // Najprv filtrujeme podľa kategórie
    if (activeCategory !== 'Všetky') {
      if (activeCategory === 'Obľúbené') {
        // ID pizz, ktoré sú označené ako obľúbené
        const favoriteIds = [1, 2, 4, 7]; // Margherita, Diavola, Capricciosa a Hawai
        filtered = filtered.filter(pizza => favoriteIds.includes(pizza.id));
      } else {
        filtered = filtered.filter(pizza => 
          pizza.tags && Array.isArray(pizza.tags) && pizza.tags.includes(activeCategory)
        );
      }
    }
    
    // Potom filtrujeme podľa vyhľadávania, ak je zadané
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(pizza => {
        const nameMatch = pizza.name && pizza.name.toLowerCase().includes(term);
        const descMatch = pizza.description && pizza.description.toLowerCase().includes(term);
        const ingMatch = pizza.ingredients && Array.isArray(pizza.ingredients) && 
          pizza.ingredients.some(ing => ing && ing.toLowerCase().includes(term));
        
        return nameMatch || descMatch || ingMatch;
      });
    }
    
    set({ filteredPizzas: filtered });
  }
}));
