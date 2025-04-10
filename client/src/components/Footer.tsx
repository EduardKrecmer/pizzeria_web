import { Pizza, Facebook, Instagram, Phone, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className="bg-neutral-50 border-t border-neutral-100 py-6 text-neutral-600" 
      role="contentinfo" 
      aria-label="Päta stránky"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Logo a kontakt */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
            <div className="flex items-center">
              <Pizza className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
              <h3 className="font-accent text-base font-medium">Pizzeria Janíček</h3>
            </div>
            
            <div className="flex items-center text-sm text-neutral-500 space-x-4">
              <a 
                href="tel:+421944386486" 
                className="flex items-center hover:text-primary transition-colors duration-200 focus:outline-none focus:text-primary"
                aria-label="Zavolajte nám: +421 944 386 486"
              >
                <Phone className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                <span className="hidden sm:inline">+421 944 386 486</span>
              </a>
              
              <a 
                href="mailto:tancujucapizza@gmail.com"
                className="flex items-center hover:text-primary transition-colors duration-200 focus:outline-none focus:text-primary"
                aria-label="Napíšte nám email"
              >
                <Mail className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
          
          {/* Sociálne siete a odkazy */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-3 text-sm" aria-label="Dôležité odkazy">
              <Link 
                to="/" 
                className="text-neutral-500 hover:text-primary transition-colors duration-200 focus:outline-none focus:text-primary"
              >
                Podmienky
              </Link>
              <Link 
                to="/" 
                className="text-neutral-500 hover:text-primary transition-colors duration-200 focus:outline-none focus:text-primary"
              >
                Súkromie
              </Link>
              <a
                href="https://maps.app.goo.gl/..."
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-500 hover:text-primary transition-colors duration-200 focus:outline-none focus:text-primary"
              >
                Mapa
              </a>
            </div>
            
            <div className="flex ml-4 space-x-2" aria-label="Sociálne siete">
              <a 
                href="https://www.facebook.com/tancujucapizza" 
                className="text-neutral-400 hover:text-primary transition-colors duration-200 focus:outline-none focus:text-primary" 
                aria-label="Facebook profil Pizzeria Janíček"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook className="w-4 h-4" aria-hidden="true" />
              </a>
              <a 
                href="https://instagram.com" 
                className="text-neutral-400 hover:text-primary transition-colors duration-200 focus:outline-none focus:text-primary" 
                aria-label="Instagram profil Pizzeria Janíček"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 text-neutral-400 text-xs border-t border-neutral-100 text-center md:text-left">
          <p>© {currentYear} Pizzeria Janíček. Všetky práva vyhradené.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
