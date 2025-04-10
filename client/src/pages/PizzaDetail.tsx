import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Home, ChevronRight } from 'lucide-react';
import { usePizzaStore } from '../store/pizzaStore';
import { useCartStore } from '../store/cartStore';
import PizzaCustomization from '../components/PizzaCustomization';
import QuantitySelector from '../components/QuantitySelector';
import LoadingOverlay from '../components/LoadingOverlay';
import ErrorNotification from '../components/ErrorNotification';
import SearchBox from '../components/SearchBox';
import CategoryFilter from '../components/CategoryFilter';
import { PizzaSize, Extra } from '../types';

const PizzaDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { pizzas, getPizzaById, fetchPizzas, isLoading, error } = usePizzaStore();
  const addToCart = useCartStore(state => state.addToCart);

  const [pizza, setPizza] = useState(getPizzaById(Number(id)));
  const [selectedSize, setSelectedSize] = useState<PizzaSize>('REGULAR');
  const [quantity, setQuantity] = useState(1);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);
  const [adding, setAdding] = useState(false);
  const [showError, setShowError] = useState(false);

  // Cenové modifikátory pre rôzne varianty pizze
  const SIZES: Record<PizzaSize, number> = {
    'REGULAR': 0,
    'CREAM': 0,
    'GLUTEN_FREE': 1.50,
    'VEGAN': 2.00,
    'THICK': 1.00
  };

  useEffect(() => {
    if (pizzas.length === 0) {
      fetchPizzas();
    }
  }, [pizzas, fetchPizzas]);

  useEffect(() => {
    // Posunúť stránku na začiatok pri otvorení detailu pizze
    window.scrollTo(0, 0);

    const currentPizza = getPizzaById(Number(id));
    setPizza(currentPizza);

    if (currentPizza) {
      setSelectedIngredients([...currentPizza.ingredients]);
    }
  }, [id, pizzas, getPizzaById]);

  useEffect(() => {
    if (error) {
      setShowError(true);
    }
  }, [error]);

  if (!pizza && !isLoading) {
    return (
      <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Pizza nebola nájdená</h2>
        <p className="mb-6">Ľutujeme, požadovaná pizza nie je dostupná.</p>
        <Link 
          to="/menu"
          className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition duration-200"
        >
          Späť na menu
        </Link>
      </div>
    );
  }

  const handleSizeChange = (size: PizzaSize) => {
    setSelectedSize(size);
  };

  const handleIngredientToggle = (ingredient: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedIngredients(prev => [...prev, ingredient]);
    } else {
      setSelectedIngredients(prev => prev.filter(item => item !== ingredient));
    }
  };

  const handleExtraToggle = (extra: Extra, isSelected: boolean) => {
    if (isSelected) {
      setSelectedExtras(prev => [...prev, extra]);
    } else {
      setSelectedExtras(prev => prev.filter(item => item.id !== extra.id));
    }
  };

  const handleAddToCart = () => {
    if (pizza) {
      setAdding(true);
      setTimeout(() => {
        addToCart(
          pizza,
          selectedSize,
          quantity,
          selectedIngredients,
          selectedExtras
        );
        setAdding(false);
        navigate('/checkout');
      }, 500);
    }
  };

  // Calculate current price with all extras and size modifiers
  const calculateCurrentPrice = () => {
    if (!pizza) return 0;

    // Ensure pizza.price is a number and not undefined/null
    const pizzaPrice = typeof pizza.price === 'number' ? pizza.price : 0;

    // Ensure size adjustment is a number
    const sizeAdjustment = SIZES[selectedSize] || 0;

    // Base price with size adjustment
    const basePrice = pizzaPrice + sizeAdjustment;

    // Add extra toppings price - ensure each extra.price is a number
    const extrasPrice = selectedExtras.reduce((sum, extra) => {
      const extraPrice = typeof extra.price === 'number' ? extra.price : 0;
      return sum + extraPrice;
    }, 0);

    return basePrice + extrasPrice;
  };

  // Generate recommended pizzas (3 random pizzas excluding current one)
  const getRecommendedPizzas = () => {
    if (pizzas.length <= 1) return [];

    const otherPizzas = pizzas.filter(p => p.id !== Number(id));
    const shuffled = [...otherPizzas].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  const recommendedPizzas = getRecommendedPizzas();
  const currentPrice = calculateCurrentPrice();

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Back to menu button */}
      <Link 
        to="/menu"
        className="inline-flex items-center mb-4 px-4 py-2 bg-[#4a5d23] text-white rounded-lg hover:bg-[#3d4d1c] transition-colors"
      >
        <ChevronRight className="w-5 h-5 rotate-180 mr-1" />
        Späť na menu
      </Link>

      {/* Breadcrumb */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link to="/" className="text-[#4a5d23] hover:text-[#5c7328] font-medium">
              <Home className="w-4 h-4 mr-1" />
              Domov
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-[#a2b969]" />
              <Link to="/menu" className="ml-1 text-[#4a5d23] hover:text-[#5c7328] md:ml-2 font-medium">Menu</Link>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-[#a2b969]" />
              <span className="ml-1 text-[#5a6d33] md:ml-2 truncate max-w-[150px] sm:max-w-xs font-medium">{pizza?.name}</span>
            </div>
          </li>
        </ol>
      </nav>

      {pizza && (
        <>
          <div className="nature-box bg-white bg-opacity-95 overflow-hidden border-2">
            <div className="flex flex-col md:flex-row">
              {/* Obrázok pizze */}
              <div className="md:w-2/5 relative">
                <div className="aspect-video md:aspect-auto md:h-full">
                  <img 
                    className="w-full h-full object-cover" 
                    src={pizza.image} 
                    alt={pizza.name}
                    loading="eager"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent md:hidden">
                  <div className="flex flex-wrap gap-1 justify-start">
                    {pizza.tags.filter(tag => tag !== 'Vegetariánska').map((tag, index) => (
                      <span key={index} className="inline-block bg-[#f2f5e9] text-[#4a5d23] text-xs px-2 py-1 rounded-full border border-[#e0e8c9]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price tag na obrázku */}
                <div className="absolute top-2 right-2 z-10">
                  <span className="bg-[#4a5d23] text-white font-bold px-3 py-1.5 rounded-full shadow-sm text-lg">
                    {(isNaN(currentPrice) ? 0 : currentPrice).toFixed(2)}€
                  </span>
                </div>

                {/* Veggie badge */}
                {pizza.tags.includes('Vegetariánska') && (
                  <div className="absolute top-2 left-2 z-10">
                    <span className="eco-badge">
                      Vegetariánska
                    </span>
                  </div>
                )}
              </div>

              {/* Detail pizze */}
              <div className="p-6 md:w-3/5 md:px-8 flex flex-col">
                <div className="flex justify-between items-start border-b border-[#e0e8c9] pb-4 mb-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-heading font-bold text-[#4a5d23]">{pizza.name}</h2>
                    <div className="hidden md:flex flex-wrap gap-1 mt-2">
                      {pizza.tags.filter(tag => tag !== 'Vegetariánska').map((tag, index) => (
                        <span key={index} className="inline-block bg-[#f2f5e9] text-[#5a6d33] text-xs px-2 py-0.5 rounded-full border border-[#e0e8c9]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right hidden md:block">
                    {currentPrice !== (typeof pizza.price === 'number' ? pizza.price : 0) && (
                      <div className="text-sm text-[#5a6d33]">
                        Základná cena: {(typeof pizza.price === 'number' ? pizza.price : 0).toFixed(2)}€
                      </div>
                    )}
                  </div>
                </div>

                {/* Popis pizze */}
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2 text-[#4a5d23]">Popis</h3>
                  <p className="text-neutral-700">{pizza.description}</p>

                  {/* Info o gramáži a alergénoch */}
                  <div className="mt-4 p-3 bg-[#f5f9ee] rounded-lg border border-[#e0e8c9]">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#5a6d33]">
                      {pizza.weight && (
                        <div className="flex items-center bg-white px-3 py-1.5 rounded-md border border-[#e0e8c9]">
                          <span className="font-medium mr-1">Gramáž:</span> {pizza.weight}
                        </div>
                      )}
                      {pizza.allergens && (
                        <div className="flex items-center bg-white px-3 py-1.5 rounded-md border border-[#e0e8c9]">
                          <span className="font-medium mr-1">Alergény:</span> {pizza.allergens}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Prispôsobenie */}
                <div className="flex-grow">
                  <PizzaCustomization 
                    pizza={pizza}
                    onSelectSize={handleSizeChange}
                    onToggleIngredient={handleIngredientToggle}
                    onToggleExtra={handleExtraToggle}
                    selectedSize={selectedSize}
                    selectedIngredients={selectedIngredients}
                    selectedExtras={selectedExtras}
                  />
                </div>

                {/* Quantity and add to cart */}
                <div className="mt-6 border-t border-[#e0e8c9] pt-4">
                  <div className="flex items-center gap-4">
                    <QuantitySelector quantity={quantity} onChange={setQuantity} />
                    <button 
                      onClick={handleAddToCart}
                      disabled={adding}
                      className="flex-1 px-6 py-3 bg-[#4a5d23] text-white rounded-lg font-medium hover:bg-[#3d4d1c] transition duration-200 flex items-center justify-center shadow-sm"
                    >
                      {adding ? (
                        <div className="loading-spinner"></div>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          Pridať do košíka
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended pizzas */}
          {recommendedPizzas.length > 0 && (
            <div className="mt-8 pt-6 border-t border-[#e0e8c9]">
              <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                <div>
                  <h3 className="text-xl font-heading text-[#4a5d23] font-semibold mb-2">Mohlo by ti chutiť aj</h3>
                  <CategoryFilter />
                </div>

                <div className="w-full md:w-1/3">
                  <SearchBox />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedPizzas.map((recPizza) => (
                  <div key={recPizza.id} className="nature-box bg-white bg-opacity-95 overflow-hidden border hover:border-[#7d9940] transition-all">
                    <Link to={`/pizza/${recPizza.id}`} className="block">
                      <div className="flex md:flex-row flex-col h-full">
                        <div className="md:w-1/3 w-full relative">
                          <img 
                            className="h-24 md:h-full w-full object-cover" 
                            src={recPizza.image} 
                            alt={recPizza.name}
                            loading="lazy" 
                          />
                          <div className="absolute top-1 right-1">
                            <span className="bg-[#4a5d23] text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                              {(typeof recPizza.price === 'number' ? recPizza.price : 0).toFixed(2)}€
                            </span>
                          </div>
                        </div>
                        <div className="p-3 md:w-2/3 w-full">
                          <h3 className="text-base font-heading font-medium text-[#4a5d23]">{recPizza.name}</h3>
                          <p className="text-neutral-700 mt-1 text-xs line-clamp-2">{recPizza.description}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {recPizza.tags.filter((tag, idx) => idx < 2 && tag !== 'Vegetariánska').map((tag, index) => (
                              <span key={index} className="inline-block bg-[#f2f5e9] text-[#5a6d33] text-xs px-1.5 py-0.5 rounded-full border border-[#e0e8c9]">
                                {tag}
                              </span>
                            ))}
                            {recPizza.tags.includes('Vegetariánska') && (
                              <span className="eco-badge text-xs">Vegetariánska</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {isLoading && <LoadingOverlay />}
      {showError && <ErrorNotification message={error || 'Nastala chyba pri načítaní dát'} onClose={() => setShowError(false)} />}
    </div>
  );
};

export default PizzaDetail;