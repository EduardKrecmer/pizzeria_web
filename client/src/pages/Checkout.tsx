import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import OrderSummary from '../components/OrderSummary';
import CheckoutForm from '../components/CheckoutForm';
import ErrorNotification from '../components/ErrorNotification';

const Checkout = () => {
  const { items, orderCompleted, orderError, resetOrder } = useCartStore();
  const navigate = useNavigate();
  
  // Redirect to home if cart is empty
  useEffect(() => {
    if (items.length === 0 && !orderCompleted) {
      navigate('/');
    }
  }, [items, navigate, orderCompleted]);
  
  if (orderCompleted) {
    return (
      <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-heading font-bold mb-4">Ďakujeme za vašu objednávku!</h2>
          <p className="mb-6 text-neutral-600">Vaša objednávka bola úspešne prijatá. Pred doručením Vás budeme kontaktovať telefonicky. Pre viac informácii náš môžete kontaktovať na tel. 0948 400 204.</p>
          <Link 
            to="/"
            onClick={resetOrder}
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition duration-200 inline-block"
          >
            Späť na domovskú stránku
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-heading font-bold text-neutral-800">Objednávka</h2>
        <Link 
          to="/" 
          className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors duration-200 flex items-center gap-2"
        >
          <span>← Späť na výber</span>
        </Link>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
        {/* Order summary (right column on desktop) */}
        <div className="lg:col-span-4 xl:col-span-5 lg:order-last mb-8 lg:mb-0">
          <OrderSummary />
        </div>

        {/* Checkout form (left column on desktop) */}
        <div className="lg:col-span-8 xl:col-span-7">
          <CheckoutForm />
        </div>
      </div>
      
      {orderError && (
        <ErrorNotification message={orderError} duration={8000} />
      )}
    </div>
  );
};

export default Checkout;
