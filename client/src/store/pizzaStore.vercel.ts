/**
 * Alternatívna implementácia pizzaStore pre nasadenie na Vercel
 * Táto verzia používa lokálne API endpointy a je upravená pre Vercel nasadenie
 */

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
      const response = await fetch('/api/pizzas', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Nepodarilo sa načítať menu: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Neplatný formát dát: očakáva sa pole pizz');
      }
      
      set({ 
        pizzas: data,
        isLoading: false 
      });
      
      // Po načítaní pizze aplikujeme filtre
      get().filterPizzas();
    } catch (error) {
      console.error('Chyba pri načítaní menu:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Neznáma chyba pri načítaní menu', 
        isLoading: false,
        pizzas: [] // Nastavíme prázdne pole, aby sme predišli chybám pri filtrovaní
      });
    }
  },
  
  fetchExtras: async () => {
    try {
      const response = await fetch('/api/extras', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Nepodarilo sa načítať prílohy: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Neplatný formát dát: očakáva sa pole príloh');
      }
      
      set({ extras: data });
    } catch (error) {
      console.error('Chyba pri načítaní príloh:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Neznáma chyba pri načítaní príloh',
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