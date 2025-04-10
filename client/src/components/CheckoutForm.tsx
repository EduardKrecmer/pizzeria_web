import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Loader2, Phone, MapPin, Home, FileText, Truck, Euro, Store, Building, Hash, Map as MapIcon, AlertCircle } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { Link } from 'react-router-dom';
import { CustomerInfo, DeliveryType } from '../types';
import { obce, potrebujeUlicu, getPSCByObec } from '../data/obce';
import FormField from './NewFormField';

const CheckoutForm = () => {
  const [formData, setFormData] = useState<CustomerInfo>({
    firstName: '',
    lastName: '', // Ponecháme v objekte, ale nebudeme používať
    email: '', // Budeme používať pre zasielanie potvrdení
    phone: '',
    street: '',
    city: '',
    cityPart: '',
    postalCode: '',
    notes: '',
    deliveryType: 'DELIVERY'
  });
  
  const [showDeliveryAddress, setShowDeliveryAddress] = useState(true);
  // Rozšírený typ na zahrnutie vlastných chybových správ
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerInfo | 'minimumOrder', string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streetLabel, setStreetLabel] = useState('Číslo domu');
  const [cityParts, setCityParts] = useState<string[]>([]);
  
  const { setCustomerInfo, placeOrder, getTotal } = useCartStore();
  
  // Minimálna hodnota objednávky pre Púchov a špeciálne časti
  const getMinimumOrderValue = useMemo(() => {
    // Pre časť obce Čertov (aj v Púchove, aj v Lazy pod Makytou) a Hoštiná je minimálna hodnota 20€
    if ((formData.city === 'Púchov' && formData.cityPart === 'Čertov') ||
        (formData.city === 'Lazy pod Makytou' && formData.cityPart === 'Čertov') ||
        formData.cityPart === 'Hoštiná') {
      return 20;
    }
    // Pre Púchov je minimálna hodnota 15€
    else if (formData.city === 'Púchov') {
      return 15;
    }
    return 0;
  }, [formData.city, formData.cityPart]);
  
  // Získanie aktuálneho stavu košíka pre aktualizáciu pri zmene v košíku
  const { items } = useCartStore();
  
  // Kontrola, či objednávka spĺňa minimálnu hodnotu
  const isBelowMinimumOrderValue = useMemo(() => {
    const minValue = getMinimumOrderValue;
    return minValue > 0 && getTotal() < minValue;
  // Závislosti zahŕňajú aj items, aby sa hodnota prepočítala pri každej zmene košíka
  }, [getMinimumOrderValue, getTotal, items]);
  
  useEffect(() => {
    // Aktualizujeme label pre ulicu podľa vybranej obce
    if (formData.city) {
      const isPuchov = potrebujeUlicu(formData.city);
      setStreetLabel(isPuchov ? 'Ulica a číslo' : 'Číslo domu');
      
      // Nastavíme PSČ podľa obce
      const psc = getPSCByObec(formData.city);
      if (psc && formData.postalCode !== psc) {
        setFormData(prev => ({ ...prev, postalCode: psc }));
      }
      
      // Aktualizujeme časti obce
      const selectedObec = obce.find(o => o.obec === formData.city);
      if (selectedObec && selectedObec.casti.length > 1) {
        setCityParts(selectedObec.casti);
        // Resetujeme vybratú časť obce
        setFormData(prev => ({ ...prev, cityPart: '' }));
      } else {
        setCityParts([]);
        setFormData(prev => ({ ...prev, cityPart: '' }));
      }
    } else {
      setCityParts([]);
    }
  }, [formData.city]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name as keyof CustomerInfo]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleCitySelect = (selectedObec: string) => {
    setFormData(prev => ({ ...prev, city: selectedObec, cityPart: '' }));
    if (errors.city) {
      setErrors(prev => ({ ...prev, city: '' }));
    }
  };
  
  const handleCityPartSelect = (selectedPart: string) => {
    setFormData(prev => ({ ...prev, cityPart: selectedPart }));
  };
  
  // Format phone number as user types
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    
    // Umožní čísla, medzery a pomlčky vo vstupe
    let cleanValue = value.replace(/[^\d\s-]/g, '');
    
    // Odstránime všetky nečíselné znaky pre prepočet
    const numericValue = cleanValue.replace(/\D/g, '');
    
    // Formátujeme telefónne číslo podľa slovenského formátu
    let formattedValue = cleanValue;
    
    // Ak používateľ zadáva číslice, automaticky formátujeme
    if (cleanValue !== value) {
      if (numericValue.length > 4 && numericValue.length <= 7) {
        // Formát 0915 452 XXX
        formattedValue = `${numericValue.slice(0, 4)} ${numericValue.slice(4)}`;
      } else if (numericValue.length > 7) {
        // Formát 0915 452 635
        formattedValue = `${numericValue.slice(0, 4)} ${numericValue.slice(4, 7)} ${numericValue.slice(7, 10)}`;
      }
    }
    
    // Obmedzíme na maximálne 13 znakov (vrátane medzier)
    formattedValue = formattedValue.slice(0, 13);
    
    setFormData(prev => ({ ...prev, phone: formattedValue }));
    
    // Vyčistíme chybu keď používateľ píše
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  };
  
  const handleDeliveryTypeChange = (type: DeliveryType) => {
    const updatedFormData = { ...formData, deliveryType: type };
    setFormData(updatedFormData);
    setShowDeliveryAddress(type === 'DELIVERY');
    
    // Okamžite aktualizujeme informácie o zákazníkovi v cartStore
    // Toto zabezpečí, že sa prepočíta cena dopravy
    setCustomerInfo({
      ...updatedFormData,
      lastName: '',
    });
    
    // Ak sa zmení typ doručenia na vyzdvihnutie, vymažeme chyby pre adresu
    if (type === 'PICKUP') {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.street;
        delete newErrors.city;
        delete newErrors.postalCode;
        return newErrors;
      });
    }
  };
  
  const validateForm = () => {
    const newErrors: Partial<Record<keyof CustomerInfo | 'minimumOrder', string>> = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'Meno je povinné';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefón je povinný';
    } else if (!/^[0-9\s-]{9,14}$/.test(formData.phone)) {
      newErrors.phone = 'Neplatný formát telefónu';
    } else if (formData.phone.replace(/[\s-]/g, '').length < 9) {
      newErrors.phone = 'Telefónne číslo musí mať aspoň 9 číslic';
    }
    
    // Validácia emailu - pokiaľ je prázdny, dáme upozornenie, že nebude zaslaná notifikácia
    if (!formData.email.trim()) {
      console.warn('Email nie je vyplnený, nebude možné poslať potvrdenie objednávky.');
      // Neblokujeme odoslanie formulára, iba zobrazíme vizuálny indikátor
    } 
    // Ak je vyplnený, musí byť platný
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Neplatný formát e-mailu';
    }
    
    // Validácia adresy len ak je zvolené doručenie
    if (formData.deliveryType === 'DELIVERY') {
      if (!formData.street.trim()) {
        const isPuchov = formData.city && potrebujeUlicu(formData.city);
        newErrors.street = isPuchov ? 'Ulica a číslo sú povinné' : 'Číslo domu je povinné';
      }
      if (!formData.city.trim()) newErrors.city = 'Obec/Mesto je povinné';
    }
    
    // Kontrola minimálnej hodnoty objednávky pre Púchov a špeciálne časti
    if (isBelowMinimumOrderValue) {
      const minValue = getMinimumOrderValue;
      let locationText = '';
      
      if ((formData.city === 'Púchov' && formData.cityPart === 'Čertov') || formData.cityPart === 'Hoštiná') {
        locationText = `časť obce ${formData.cityPart}`;
      } else if (formData.city === 'Lazy pod Makytou' && formData.cityPart === 'Čertov') {
        locationText = 'oblasť Čertov (obec Lazy pod Makytou)';
      } else if (formData.city === 'Púchov') {
        locationText = 'obec Púchov';
      }
      
      newErrors.minimumOrder = `Pre ${locationText} je minimálna hodnota objednávky ${minValue}€`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      // Výrazné upozornenie, ak chýba email
      if (!formData.email.trim()) {
        console.warn('Objednávka sa odošle bez emailu - používateľ nedostane potvrdenie emailom');
      }
      
      // Nastavíme zákaznícke údaje, ponecháme email pre zaslanie potvrdenia
      const customerInfo = {
        ...formData,
        lastName: '',
      };
      setCustomerInfo(customerInfo);
      await placeOrder();
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-neutral-100">
      <div className="p-6">
        <h3 className="text-xl font-heading font-bold mb-6 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
          Kontaktné údaje a doručenie
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal info section */}
          <div className="bg-neutral-50 p-4 rounded-lg mb-6">
            <h4 className="text-md font-medium text-neutral-800 mb-4 flex items-center">
              <Phone className="w-4 h-4 mr-2 text-primary" aria-hidden="true" />
              Kontaktné údaje
            </h4>
            <div className="space-y-4">
              <FormField 
                label="Meno"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                icon={<span className="text-sm font-medium">Aa</span>}
                error={errors.firstName}
                placeholder="Vaše meno"
              />
              
              <FormField 
                label="Telefón"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                icon={<Phone className="w-4 h-4" />}
                error={errors.phone}
                placeholder="0915 452 635"
              />
              
              <FormField 
                label="E-mail (pre zaslanie potvrdenia objednávky)"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                icon={<span className="text-sm font-medium">@</span>}
                error={errors.email}
                placeholder="email@example.com"
              />
            </div>
          </div>
          
          {/* Delivery type selection */}
          <div className="bg-neutral-50 p-4 rounded-lg mb-6">
            <h4 className="text-md font-medium text-neutral-800 mb-4 flex items-center">
              <Truck className="w-4 h-4 mr-2 text-primary" aria-hidden="true" />
              Spôsob doručenia
            </h4>
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <button
                type="button"
                onClick={() => handleDeliveryTypeChange('DELIVERY')}
                className={`flex items-center p-4 rounded-md border ${
                  formData.deliveryType === 'DELIVERY'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-neutral-300 hover:border-neutral-400'
                } transition-all duration-200 flex-1`}
              >
                <Truck className={`w-5 h-5 mr-3 ${formData.deliveryType === 'DELIVERY' ? 'text-primary' : 'text-neutral-500'}`} />
                <div className="text-left">
                  <p className="font-medium">Doručenie na adresu</p>
                  <p className="text-sm text-neutral-500">Doručíme až k vašim dverám</p>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handleDeliveryTypeChange('PICKUP')}
                className={`flex items-center p-4 rounded-md border ${
                  formData.deliveryType === 'PICKUP'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-neutral-300 hover:border-neutral-400'
                } transition-all duration-200 flex-1`}
              >
                <Store className={`w-5 h-5 mr-3 ${formData.deliveryType === 'PICKUP' ? 'text-primary' : 'text-neutral-500'}`} />
                <div className="text-left">
                  <p className="font-medium">Vyzdvihnutie na mieste</p>
                  <p className="text-sm text-neutral-500">Pripravíme na vyzdvihnutie v našej pizzerii</p>
                </div>
              </button>
            </div>
            
            {/* Minimálna hodnota objednávky upozornenie - zobrazí sa iba ak nie je splnená podmienka */}
            {formData.deliveryType === 'DELIVERY' && isBelowMinimumOrderValue && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Nedostatočná hodnota objednávky:</p>
                    <p className="text-sm text-amber-700">
                      {(() => {
                        if ((formData.city === 'Púchov' && formData.cityPart === 'Čertov') || formData.cityPart === 'Hoštiná') {
                          return `Pre časť obce ${formData.cityPart} je minimálna hodnota objednávky 20€`;
                        } else if (formData.city === 'Lazy pod Makytou' && formData.cityPart === 'Čertov') {
                          return 'Pre oblasť Čertov (obec Lazy pod Makytou) je minimálna hodnota objednávky 20€';
                        } else if (formData.city === 'Púchov') {
                          return 'Pre obec Púchov je minimálna hodnota objednávky 15€';
                        }
                        return '';
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Delivery address section - shown only for delivery */}
          {showDeliveryAddress && (
            <div className="bg-neutral-50 p-4 rounded-lg mb-6">
              <h4 className="text-md font-medium text-neutral-800 mb-4 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-primary" aria-hidden="true" />
                Adresa doručenia
              </h4>
              <div className="space-y-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-neutral-700 mb-1">Obec / Mesto</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-primary transition-colors">
                      <Building className="w-4 h-4" />
                    </div>
                    <select
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={(e) => handleCitySelect(e.target.value)}
                      className={`w-full pl-10 px-4 py-3 border appearance-none bg-white ${
                        errors.city ? 'border-red-500 ring-1 ring-red-500' : 'border-neutral-300'
                      } rounded-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all duration-200`}
                      style={{ caretColor: '#4a5d23' }}
                    >
                      <option value="">Vyberte obec/mesto</option>
                      {obce.map(obec => (
                        <option key={obec.obec} value={obec.obec}>{obec.obec}</option>
                      ))}
                    </select>
                  </div>
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>
                
                {formData.city && cityParts.length > 1 && (
                  <div>
                    <label htmlFor="cityPart" className="block text-sm font-medium text-neutral-700 mb-1">Časť obce</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-primary transition-colors">
                        <MapIcon className="w-4 h-4" />
                      </div>
                      <select
                        id="cityPart"
                        name="cityPart"
                        value={formData.cityPart}
                        onChange={(e) => handleCityPartSelect(e.target.value)}
                        className="w-full pl-10 px-4 py-3 border appearance-none bg-white border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all duration-200"
                        style={{ caretColor: '#4a5d23' }}
                      >
                        <option value="">Vyberte časť obce</option>
                        {cityParts.map(part => (
                          <option key={part} value={part}>{part}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                
                <FormField 
                  label={streetLabel}
                  id="street"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  icon={formData.city && potrebujeUlicu(formData.city) ? <Home className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                  error={errors.street}
                  placeholder={formData.city && potrebujeUlicu(formData.city) ? "Názov ulice a číslo domu" : "Číslo domu/popisné číslo"}
                />
                
                {formData.city && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="postalCode" className="block text-sm font-medium text-neutral-700 mb-1">PSČ</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-primary transition-colors">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          id="postalCode"
                          name="postalCode"
                          value={formData.postalCode}
                          readOnly
                          className="w-full pl-10 px-4 py-3 border border-neutral-300 bg-neutral-50 text-neutral-500 rounded-lg focus:outline-none transition-all duration-200"
                        />
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">PSČ je automaticky vyplnené podľa obce</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Notes section */}
          <div className="bg-neutral-50 p-4 rounded-lg mb-6">
            <h4 className="text-md font-medium text-neutral-800 mb-4 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-primary" aria-hidden="true" />
              Poznámka k objednávke
            </h4>
            <div>
              <div className="relative">
                <textarea 
                  id="notes" 
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Špeciálne požiadavky k objednávke..."
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all duration-200"
                ></textarea>
              </div>
            </div>
          </div>
        
          {/* Payment section */}
          <div className="border border-neutral-200 p-4 rounded-lg bg-neutral-50 mb-6">
            <div className="flex items-center mb-2">
              <Euro className="w-5 h-5 text-primary mr-2" aria-hidden="true" />
              <p className="font-medium">Platba pri prevzatí</p>
            </div>
            <p className="text-sm text-neutral-600 ml-7">
              {formData.deliveryType === 'DELIVERY' 
                ? 'Platba v hotovosti kuriérovi pri doručení objednávky.' 
                : 'Platba v hotovosti pri vyzdvihnutí v našej pizzerii.'}
            </p>
          </div>

          {/* Navigation buttons */}
          <div className="flex flex-col gap-3">
            {/* Error message for minimum order value */}
            {errors.minimumOrder && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-2">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{errors.minimumOrder}</p>
                </div>
              </div>
            )}
          
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <Link 
                to="/"
                className="w-full sm:w-auto px-6 py-3 bg-white border border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-all duration-200 flex items-center justify-center shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Späť na naše menu
              </Link>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                    Spracovanie...
                  </>
                ) : (
                  <>Dokončiť objednávku</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutForm;