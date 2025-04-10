import { useEffect, useState } from 'react';
import { ChevronDown, ArrowRight, Clock } from 'lucide-react';
import PizzaCard from '../components/PizzaCard';
import CategoryFilter from '../components/CategoryFilter';
import SearchBox from '../components/SearchBox';
import { usePizzaStore } from '../store/pizzaStore';
import ErrorNotification from '../components/ErrorNotification';
import OpeningHours from '../components/OpeningHours';
import { Link } from 'wouter';

const Home = () => {
  const { fetchPizzas, fetchExtras, filteredPizzas, isLoading, error } = usePizzaStore();
  const [showError, setShowError] = useState(false);
  const [visiblePizzas, setVisiblePizzas] = useState(6);

  useEffect(() => {
    fetchPizzas();
    fetchExtras();
  }, [fetchPizzas, fetchExtras]);

  useEffect(() => {
    if (error) {
      setShowError(true);
    }
  }, [error]);
  
  // Počúvame na event pre resetovanie viditeľných pizz
  useEffect(() => {
    const resetHandler = () => {
      setVisiblePizzas(6); // Resetujeme na pôvodný počet
    };
    
    document.addEventListener('resetVisiblePizzas', resetHandler);
    
    return () => {
      document.removeEventListener('resetVisiblePizzas', resetHandler);
    };
  }, []);

  const loadMorePizzas = () => {
    setVisiblePizzas(prev => Math.min(prev + 6, filteredPizzas.length));
  };

  return (
    <div>
      {/* Hero section - vylepšená verzia */}
      <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-800 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 bg-repeat" 
             style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iI2ZmZiIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIGN4PSIxIiBjeT0iMSIgcj0iMSIvPjwvZz48L3N2Zz4=')" }}>
        </div>
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 py-12 sm:py-16 md:py-24 lg:py-32 lg:w-3/5">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="text-center lg:text-left px-4 sm:px-0">
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl leading-tight font-serif">
                  <span className="block mb-2 text-shadow-lg">Pravá pizza</span>
                  <span className="block italic text-white text-shadow-lg relative z-10">
                    <span className="bg-[#4a5d23] px-2 py-1 rounded-md">z kvalitných surovín</span>
                  </span>
                </h1>
                <p className="mt-6 text-base text-neutral-200 sm:text-lg sm:max-w-xl md:text-xl font-medium leading-relaxed">
                  Vychutnajte si pravú taliansku pizzu priamo u Vás doma. Používame iba kvalitné suroviny od overených dodávateľov.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center sm:items-start justify-center lg:justify-start gap-4">
                  <div className="flex flex-col items-center gap-4">
                    <a href="#menu-section" 
                       className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark transition-all duration-300 shadow-lg hover:shadow-xl md:py-4 md:text-lg md:px-10"
                    >
                      Objednať teraz
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </a>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <OpeningHours />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero image */}
        <div className="absolute right-0 top-0 w-full h-full lg:w-2/5 overflow-hidden">
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-l from-transparent to-neutral-900 z-10"></div>
          <img 
            className="h-full w-full object-cover hidden lg:block" 
            src="https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1350&q=80" 
            alt="Čerstvá pizza z pece"
            loading="eager"
          />

          {/* Mobilný obrázok na pozadí */}
          <div className="absolute inset-0 bg-black bg-opacity-40 lg:hidden"></div>
          <img 
            className="h-full w-full object-cover opacity-60 lg:hidden" 
            src="https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1350&q=80" 
            alt=""
            loading="eager"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Menu section */}
      <div id="menu-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center mb-8">
          <h2 className="text-3xl font-heading font-bold text-neutral-800 mb-6 relative">
            Naše menu
            <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-primary rounded-full"></span>
          </h2>
          <div className="mt-4 mb-6">
            <CategoryFilter />
          </div>
          
          {/* Vyhľadávacie pole */}
          <div className="mb-8">
            <SearchBox />
          </div>
        </div>

        {/* Počet výsledkov vyhľadávania */}
        {!isLoading && (
          <div className="mb-4 text-neutral-600 text-center text-sm">
            {filteredPizzas.length === 0 ? (
              <p>Žiadne výsledky neboli nájdené. Skúste upraviť vyhľadávanie.</p>
            ) : (
              <p>Nájdených {filteredPizzas.length} {filteredPizzas.length === 1 ? 'pizza' : 
                filteredPizzas.length > 1 && filteredPizzas.length < 5 ? 'pizze' : 'pizz'}</p>
            )}
          </div>
        )}

        {/* Pizza menu grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {isLoading ? (
            // Placeholder skeleton loaders
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            ))
          ) : (
            // Actual pizza cards
            filteredPizzas.slice(0, visiblePizzas).map((pizza) => (
              <PizzaCard key={pizza.id} pizza={pizza} />
            ))
          )}
        </div>

        {/* Load more button */}
        {!isLoading && visiblePizzas < filteredPizzas.length && (
          <div className="flex justify-center mt-10">
            <button 
              onClick={loadMorePizzas}
              className="px-6 py-3 bg-white border border-neutral-200 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 hover:shadow-sm transition-all duration-200 flex items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Načítať viac
              <ChevronDown className="ml-2 w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {showError && <ErrorNotification message={error || 'Nastala chyba pri načítaní dát'} onClose={() => setShowError(false)} />}
    </div>
  );
};

export default Home;