import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { usePizzaStore } from '../store/pizzaStore';

const SearchBox = () => {
  const { setSearchTerm, searchTerm } = usePizzaStore();
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  
  // Aktualizujeme lokálny stav keď sa zmení globálny
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);
  
  // Použijeme debouncing na vyhľadávanie, aby sme nezaťažovali aplikáciu pri rýchlom písaní
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(localSearchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [localSearchTerm, setSearchTerm]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value);
  };
  
  const clearSearch = () => {
    setLocalSearchTerm('');
    setSearchTerm('');
  };
  
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          placeholder="Vyhľadať pizzu..."
          value={localSearchTerm}
          onChange={handleInputChange}
          className="w-full pl-10 pr-10 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all duration-200"
          aria-label="Vyhľadať pizzu"
        />
        {localSearchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600"
            aria-label="Vymazať vyhľadávanie"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBox;