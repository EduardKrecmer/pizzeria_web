import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  onChange: (quantity: number) => void;
  minQuantity?: number;
  maxQuantity?: number;
}

const QuantitySelector = ({
  quantity,
  onChange,
  minQuantity = 1,
  maxQuantity = 10
}: QuantitySelectorProps) => {
  const handleDecrease = () => {
    if (quantity > minQuantity) {
      onChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < maxQuantity) {
      onChange(quantity + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= minQuantity && value <= maxQuantity) {
      onChange(value);
    }
  };

  return (
    <div 
      className="flex items-center border border-[#a2b969] rounded-lg overflow-hidden shadow-sm"
      role="group"
      aria-labelledby="quantity-selector-label"
    >
      <div id="quantity-selector-label" className="sr-only">Výber množstva</div>
      <button 
        onClick={handleDecrease}
        className="px-3 py-2 bg-[#f5f9ee] text-[#4a5d23] hover:bg-[#e8f0d9] transition duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#4a5d23] focus:ring-inset"
        disabled={quantity <= minQuantity}
        aria-label="Znížiť množstvo"
        aria-controls="quantity-input"
      >
        <Minus className="w-5 h-5" aria-hidden="true" />
      </button>
      <input 
        id="quantity-input"
        type="number" 
        min={minQuantity} 
        max={maxQuantity} 
        value={quantity} 
        onChange={handleInputChange}
        className="w-12 py-2 text-center border-x border-[#a2b969] focus:outline-none focus:ring-2 focus:ring-[#4a5d23] bg-white"
        aria-label="Množstvo"
        aria-valuemin={minQuantity}
        aria-valuemax={maxQuantity}
        aria-valuenow={quantity}
      />
      <button 
        onClick={handleIncrease}
        className="px-3 py-2 bg-[#f5f9ee] text-[#4a5d23] hover:bg-[#e8f0d9] transition duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#4a5d23] focus:ring-inset"
        disabled={quantity >= maxQuantity}
        aria-label="Zvýšiť množstvo"
        aria-controls="quantity-input"
      >
        <Plus className="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
  );
};

export default QuantitySelector;
