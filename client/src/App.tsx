import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import PizzaDetail from './pages/PizzaDetail';
import Checkout from './pages/Checkout';
import NotFound from './pages/not-found';
import ErrorPage from './pages/ErrorPage';
import { usePizzaStore } from './store/pizzaStore';
import LoadingOverlay from './components/LoadingOverlay';

function App() {
  const { fetchPizzas, fetchExtras, error, isLoading } = usePizzaStore();
  const [appError, setAppError] = useState<Error | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Zachytenie globálnych chýb v aplikácii
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      console.error('Globálna chyba v aplikácii:', event.error);
      setAppError(event.error || new Error('Neznáma chyba v aplikácii'));
      event.preventDefault();
    };
    
    window.addEventListener('error', handleGlobalError);
    return () => window.removeEventListener('error', handleGlobalError);
  }, []);
  
  // Fetch initial data on app load
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchPizzas(),
          fetchExtras()
        ]);
        setIsDataLoaded(true);
      } catch (err) {
        console.error('Chyba pri načítaní dát:', err);
        setAppError(err instanceof Error ? err : new Error('Chyba pri načítaní dát'));
      }
    };
    
    loadData();
  }, [fetchPizzas, fetchExtras]);
  
  // Zobrazenie chybovej stránky ak nastane chyba
  if (appError) {
    return (
      <ErrorPage 
        message="Nastala neočakávaná chyba v aplikácii. Skúste obnoviť stránku alebo navštívte našu pizzeriu osobne." 
        error={appError} 
      />
    );
  }
  
  if (error) {
    return (
      <ErrorPage 
        message="Nepodarilo sa načítať menu pizze. Prosím, skúste to neskôr alebo nás kontaktujte telefonicky." 
        error={new Error(error)} 
      />
    );
  }
  
  // Zobrazenie načítavacej obrazovky kým sa načítavajú dáta
  if (isLoading && !isDataLoaded) {
    return <LoadingOverlay message="Načítavam menu pizze..." />;
  }
  
  return (
    <BrowserRouter>
      <Navigation />
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Home />} />
          <Route path="/pizza/:id" element={<PizzaDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<Checkout />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
