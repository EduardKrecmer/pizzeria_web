import { useState, useEffect } from 'react';
import { Pizza, Extra, PizzaSize } from '../types';
import { usePizzaStore } from '../store/pizzaStore';
import { extraCategories, getAllExtras } from '../data/pizzaextras';

interface PizzaCustomizationProps {
  pizza: Pizza;
  onSelectSize: (size: PizzaSize) => void;
  onToggleIngredient: (ingredient: string, isSelected: boolean) => void;
  onToggleExtra: (extra: Extra, isSelected: boolean) => void;
  selectedSize: PizzaSize;
  selectedIngredients: string[];
  selectedExtras: Extra[];
}

const PizzaCustomization = ({
  pizza,
  onSelectSize,
  onToggleIngredient,
  onToggleExtra,
  selectedSize,
  selectedIngredients,
  selectedExtras
}: PizzaCustomizationProps) => {
  const { extras } = usePizzaStore();
  const [activeCategory, setActiveCategory] = useState<string | null>(extraCategories[0]?.id || null);
  
  const handleSizeClick = (size: PizzaSize) => {
    onSelectSize(size);
  };

  const handleIngredientToggle = (ingredient: string) => {
    const isCurrentlySelected = selectedIngredients.includes(ingredient);
    onToggleIngredient(ingredient, !isCurrentlySelected);
  };

  const handleExtraToggle = (extra: Extra) => {
    const isSelected = selectedExtras.some(item => item.id === extra.id);
    onToggleExtra(extra, !isSelected);
  };

  const isExtraSelected = (extra: Extra) => {
    return selectedExtras.some(item => item.id === extra.id);
  };
  
  return (
    <div>
      <div className="flex items-center mb-4">
        <h3 className="text-lg font-semibold text-[#4a5d23]" id="customization-heading">Prispôsob si svoju pizzu</h3>
      </div>
      
      {/* Varianty pizze */}
      <div className="mb-6" role="radiogroup" aria-labelledby="variant-heading">
        <h4 className="text-sm font-medium text-[#5a6d33] mb-2" id="variant-heading">Variant pizze</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button 
            onClick={() => handleSizeClick('REGULAR')}
            className={`px-3 py-2 rounded-md border text-center text-sm font-medium transition-colors ${
              selectedSize === 'REGULAR' 
                ? 'bg-[#4a5d23] text-white border-[#4a5d23] shadow-sm' 
                : 'border-[#c9d6a3] text-[#5a6d33] hover:bg-[#f5f9ee]'
            }`}
            role="radio"
            aria-checked={selectedSize === 'REGULAR'}
            aria-label="Klasická pizza"
            tabIndex={selectedSize === 'REGULAR' ? 0 : -1}
          >
            Klasická pizza
          </button>
          <button 
            onClick={() => handleSizeClick('CREAM')}
            className={`px-3 py-2 rounded-md border text-center text-sm font-medium transition-colors ${
              selectedSize === 'CREAM' 
                ? 'bg-[#4a5d23] text-white border-[#4a5d23] shadow-sm' 
                : 'border-[#c9d6a3] text-[#5a6d33] hover:bg-[#f5f9ee]'
            }`}
            role="radio"
            aria-checked={selectedSize === 'CREAM'}
            aria-label="Pizza so smotanovým základom"
            tabIndex={selectedSize === 'CREAM' ? 0 : -1}
          >
            So smotanovým základom
          </button>
          <button 
            onClick={() => handleSizeClick('GLUTEN_FREE')}
            className={`px-3 py-2 rounded-md border text-center text-sm font-medium transition-colors ${
              selectedSize === 'GLUTEN_FREE' 
                ? 'bg-[#4a5d23] text-white border-[#4a5d23] shadow-sm' 
                : 'border-[#c9d6a3] text-[#5a6d33] hover:bg-[#f5f9ee]'
            }`}
            role="radio"
            aria-checked={selectedSize === 'GLUTEN_FREE'}
            aria-label="Pizza z bezlepkovej múky (+1,50€)"
            tabIndex={selectedSize === 'GLUTEN_FREE' ? 0 : -1}
          >
            Z bezlepkovej múky (+1,50€) *
          </button>
          <button 
            onClick={() => handleSizeClick('VEGAN')}
            className={`px-3 py-2 rounded-md border text-center text-sm font-medium transition-colors ${
              selectedSize === 'VEGAN' 
                ? 'bg-[#4a5d23] text-white border-[#4a5d23] shadow-sm' 
                : 'border-[#c9d6a3] text-[#5a6d33] hover:bg-[#f5f9ee]'
            }`}
            role="radio"
            aria-checked={selectedSize === 'VEGAN'}
            aria-label="Pizza so 100% rastlinnou náhradou za mozzarelu (+2,00€)"
            tabIndex={selectedSize === 'VEGAN' ? 0 : -1}
          >
            S rastlinnou mozzarellou (+2,00€)
          </button>
          <button 
            onClick={() => handleSizeClick('THICK')}
            className={`px-3 py-2 rounded-md border text-center text-sm font-medium transition-colors ${
              selectedSize === 'THICK' 
                ? 'bg-[#4a5d23] text-white border-[#4a5d23] shadow-sm' 
                : 'border-[#c9d6a3] text-[#5a6d33] hover:bg-[#f5f9ee]'
            }`}
            role="radio"
            aria-checked={selectedSize === 'THICK'}
            aria-label="Pizza z hrubého cesta (+1,00€)"
            tabIndex={selectedSize === 'THICK' ? 0 : -1}
          >
            Z hrubého cesta (+1,00€)
          </button>
        </div>
        <p className="text-xs text-[#5a6d33] mt-2">* Objednávka minimálne 1 hod. vopred</p>
      </div>
      
      {/* Ingredients toggle */}
      <div className="mb-6 border border-[#c9d6a3] rounded-lg p-4 bg-[#f5f9ee]/80">
        <h4 className="text-sm font-medium text-[#4a5d23] mb-3" id="ingredients-heading">Ingrediencie</h4>
        <fieldset aria-labelledby="ingredients-heading" className="border-0 p-0 m-0">
          <legend className="sr-only">Vyberte si ingrediencie pre vašu pizzu</legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {pizza.ingredients.map((ingredient, index) => (
              <div key={index} className="flex items-center">
                <input 
                  id={`ingredient-${index}`} 
                  type="checkbox" 
                  checked={selectedIngredients.includes(ingredient)} 
                  onChange={() => handleIngredientToggle(ingredient)} 
                  className="w-4 h-4 text-[#4a5d23] focus:ring-2 focus:ring-[#4a5d23] focus:ring-offset-2"
                  aria-label={`Ingrediencia: ${ingredient}`}
                />
                <label htmlFor={`ingredient-${index}`} className="ml-2 text-sm text-[#5a6d33]">
                  {ingredient}
                </label>
              </div>
            ))}
          </div>
        </fieldset>
      </div>
      
      {/* Extra toppings */}
      <div>
        <h4 className="text-sm font-medium text-[#4a5d23] mb-3" id="extras-heading">Extra prísady</h4>
        
        {/* Kategórie extra prísad */}
        <div className="flex flex-wrap mb-3 border-b border-[#e0e8c9]">
          {extraCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-3 py-2 text-sm font-medium transition-all ${
                activeCategory === category.id 
                  ? 'text-[#4a5d23] border-b-2 border-[#4a5d23]' 
                  : 'text-[#5a6d33]/70 hover:text-[#5a6d33]'
              }`}
              aria-selected={activeCategory === category.id}
            >
              {category.name}
            </button>
          ))}
        </div>
        
        {/* Zobrazenie prísad podľa kategórie */}
        <div 
          className="flex flex-wrap gap-2 mb-2" 
          role="group" 
          aria-labelledby="extras-heading"
        >
          {extraCategories
            .find(category => category.id === activeCategory)?.items
            .map((extra) => (
              <button 
                key={extra.id}
                onClick={() => handleExtraToggle(extra)}
                className={`ingredient-tag px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  isExtraSelected(extra) 
                    ? 'bg-[#4a5d23]/10 text-[#4a5d23] border-[#4a5d23]/30 font-medium' 
                    : 'bg-white text-[#5a6d33] border-[#c9d6a3] hover:bg-[#f5f9ee]'
                }`}
                aria-pressed={isExtraSelected(extra)}
                aria-label={`Extra prísada: ${extra.name}, ${extra.amount}, cena: ${extra.price.toFixed(2)}€${isExtraSelected(extra) ? ', vybraté' : ''}`}
              >
                {extra.name} {extra.amount && <span className="text-xs text-neutral-500">({extra.amount})</span>} <span className="text-[#4a5d23] font-medium">+{extra.price.toFixed(2)}€</span>
              </button>
            ))}
        </div>
        
        {/* Vybrané prísady */}
        {selectedExtras.length > 0 && (
          <div className="mt-4 p-3 bg-[#f5f9ee] rounded-md border border-[#c9d6a3]">
            <h5 className="text-xs font-medium text-[#4a5d23] mb-2">Vybrané prísady:</h5>
            <div className="flex flex-wrap gap-1">
              {selectedExtras.map(extra => (
                <div key={extra.id} 
                  className="px-2 py-1 text-xs rounded bg-white border border-[#c9d6a3] flex items-center gap-1"
                >
                  <span className="text-[#5a6d33]">{extra.name} {extra.amount && <span className="text-neutral-500">({extra.amount})</span>}</span>
                  <button 
                    onClick={() => handleExtraToggle(extra)}
                    className="text-[#4a5d23]/50 hover:text-[#4a5d23] font-bold"
                    aria-label={`Odstrániť prísadu ${extra.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PizzaCustomization;
