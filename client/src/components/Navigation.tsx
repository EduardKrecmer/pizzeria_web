import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Pizza, ShoppingCart, X, Menu } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const cartItems = useCartStore(state => state.items);
  const navigate = useNavigate();

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Sledovanie scrollovania pre efekt na navigácii
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Zavrieť mobilné menu po zmene lokácie
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white shadow-md backdrop-blur-sm bg-opacity-90' 
          : 'bg-white shadow-sm'
      }`} 
      aria-label="Hlavná navigácia"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2" aria-label="Domovská stránka Pizzeria Janíček">
              <Pizza className="w-8 h-8 text-primary" aria-hidden="true" />
              <h1 className="font-accent text-xl sm:text-2xl font-bold text-primary">Pizzeria Janíček</h1>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-5" role="navigation" aria-label="Hlavné menu">
            <Link 
              to="/" 
              className={`px-3 py-2 font-medium transition duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md ${location.pathname === '/' ? 'text-primary' : 'text-neutral-600 hover:text-primary'}`}
              aria-current={location.pathname === '/' ? 'page' : undefined}
            >
              Domov
            </Link>
            <Link 
              to="/menu" 
              className={`px-3 py-2 font-medium transition duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md ${location.pathname === '/menu' ? 'text-primary' : 'text-neutral-600 hover:text-primary'}`}
              aria-current={location.pathname === '/menu' ? 'page' : undefined}
            >
              Menu
            </Link>
            <button 
              onClick={() => {
                if (location.pathname === '/checkout') {
                  navigate('/');
                } else {
                  navigate('/checkout');
                }
              }}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-lg font-semibold shadow-sm hover:shadow-md hover:bg-primary-dark transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={`Košík s ${cartItemCount} položkami`}
              aria-current={location.pathname === '/checkout' ? 'page' : undefined}
            >
              <ShoppingCart className="w-5 h-5 mr-2" aria-hidden="true" />
              <span className="bg-white text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold" aria-hidden="true">
                {cartItemCount}
              </span>
            </button>
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => {
                if (location.pathname === '/checkout') {
                  navigate('/');
                } else {
                  navigate('/checkout');
                }
              }}
              className="mr-2 flex items-center p-2 text-primary relative focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
              aria-label={`Košík s ${cartItemCount} položkami`}
              aria-current={location.pathname === '/checkout' ? 'page' : undefined}
            >
              <ShoppingCart className="w-6 h-6" aria-hidden="true" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold" aria-hidden="true">
                  {cartItemCount}
                </span>
              )}
            </button>
            <button 
              onClick={toggleMobileMenu}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Zavrieť menu" : "Otvoriť menu"}
              aria-controls="mobile-menu"
              className="p-2 rounded-md text-neutral-600 hover:text-primary hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div 
        id="mobile-menu" 
        className={`${mobileMenuOpen ? 'max-h-60' : 'max-h-0'} md:hidden overflow-hidden transition-all duration-300 ease-in-out`}
        role="navigation" 
        aria-label="Mobilné menu"
      >
        <div className="px-2 py-3 space-y-2">
          <Link 
            to="/" 
            className={`block px-3 py-2 rounded-md text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              location.pathname === '/' 
                ? 'text-primary bg-neutral-50' 
                : 'text-neutral-600 hover:text-primary hover:bg-neutral-50'
            }`}
            onClick={() => setMobileMenuOpen(false)}
            aria-current={location.pathname === '/' ? 'page' : undefined}
          >
            Domov
          </Link>
          <Link 
            to="/menu" 
            className={`block px-3 py-2 rounded-md text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              location.pathname === '/menu' 
                ? 'text-primary bg-neutral-50' 
                : 'text-neutral-600 hover:text-primary hover:bg-neutral-50'
            }`}
            onClick={() => setMobileMenuOpen(false)}
            aria-current={location.pathname === '/menu' ? 'page' : undefined}
          >
            Menu
          </Link>
          <button 
            onClick={() => {
              // Naviguj a zatvor mobilné menu
              if (location.pathname === '/checkout') {
                navigate('/');
              } else {
                navigate('/checkout');
              }
              setMobileMenuOpen(false);
            }}
            className="flex items-center justify-between px-3 py-2 rounded-md text-base font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
            aria-label={`Košík s ${cartItemCount} položkami`}
            aria-current={location.pathname === '/checkout' ? 'page' : undefined}
          >
            <div className="flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" aria-hidden="true" />
              Košík
            </div>
            {cartItemCount > 0 && (
              <span className="bg-white text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold" aria-hidden="true">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;