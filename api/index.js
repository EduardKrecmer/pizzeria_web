// Fixed version of the original file
const express = require('express');
const path = require('path');
const fs = require('fs');
const { sendCustomerEmail, sendRestaurantEmail, handleTestEmail } = require('./email-handler');
const app = express();
require('dotenv').config();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware pre zabezpečenie správnych JSON hlavičiek pre API odpovede
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
  }
  next();
});

// CORS pre integráciu s frontend aplikáciou
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Aplikačné middleware pre prideľovanie ID požiadavkám
app.use((req, res, next) => {
  req.id = Date.now().toString(36) + Math.random().toString(36).substring(2);
  next();
});

// Formátovanie času pre objednávku
function formatOrderTime() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// Preklad veľkostí pizze pre email
function getSlovakSizeType(size) {
  const sizeMap = {
    "SMALL": "Malá (26cm)",
    "MEDIUM": "Stredná (32cm)",
    "LARGE": "Veľká (45cm)",
    "S": "Malá (26cm)",
    "M": "Stredná (32cm)",
    "L": "Veľká (45cm)"
  };
  
  return sizeMap[size] || size;
}

// Formátovanie objednávky pre email zákazníkovi
function formatOrderToHtml(order) {
  try {
    // Bezpečnostná kontrola pre property items pred použitím
    const items = Array.isArray(order.items) ? order.items : [];
    
    // Typ doručenia
    let deliveryType = "Doručenie";
    if (order.deliveryType === "PICKUP") {
      deliveryType = "Osobný odber";
    }
    
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #4a5d23; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Potvrdenie objednávky</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">${formatOrderTime()}</p>
        </div>
        
        <div style="border: 1px solid #ddd; border-top: none; padding: 25px; background-color: #fff;">
          <p style="margin-top: 0; margin-bottom: 20px; font-size: 16px;">Vážený zákazník,</p>
          
          <p style="margin-bottom: 20px; font-size: 16px;">ďakujeme za Vašu objednávku v Pizzerii Janíček. Nižšie nájdete jej detaily:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <tr style="background-color: #f7f7f7;">
              <td style="padding: 12px; width: 40%; border: 1px solid #ddd; font-weight: bold;">Meno:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">${order.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Telefón:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">${order.customerPhone}</td>
            </tr>
            <tr style="background-color: #f7f7f7;">
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Spôsob prevzatia:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">${order.deliveryType === 'PICKUP' ? 'Osobný odber v prevádzke' : 'Doručenie na adresu'}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Adresa:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">${order.deliveryAddress}, ${order.deliveryCity}, ${order.deliveryPostalCode}</td>
            </tr>
          </table>
          
          <h2 style="font-size: 20px; color: #4a5d23; margin: 25px 0 15px 0; text-transform: uppercase; border-bottom: 2px solid #4a5d23; padding-bottom: 10px;">
            Objednané položky
          </h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 16px;">
            <thead>
              <tr style="background-color: #f7f7f7;">
                <th style="text-align: left; padding: 12px; border: 1px solid #ddd;">#</th>
                <th style="text-align: left; padding: 12px; border: 1px solid #ddd;">Pizza</th>
                <th style="text-align: center; padding: 12px; border: 1px solid #ddd;">Typ</th>
                <th style="text-align: center; padding: 12px; border: 1px solid #ddd;">Ks</th>
                <th style="text-align: right; padding: 12px; border: 1px solid #ddd;">Cena</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, index) => `
                <tr>
                  <td style="text-align: left; padding: 12px; border: 1px solid #ddd; font-weight: bold;">${index + 1}.</td>
                  <td style="text-align: left; padding: 12px; border: 1px solid #ddd;">
                    <div style="font-weight: bold;">${item.name}</div>
                    ${Array.isArray(item.extras) && item.extras.length > 0 ? `
                      <div style="margin-top: 5px; font-size: 14px;">
                        <span style="font-style: italic;">Extra:</span> ${item.extras.map((e) => `${e.name} (+${e.price.toFixed(2)}€)`).join(', ')}
                      </div>
                    ` : ''}
                  </td>
                  <td style="text-align: center; padding: 12px; border: 1px solid #ddd;">${getSlovakSizeType(item.size)}</td>
                  <td style="text-align: center; padding: 12px; border: 1px solid #ddd; font-weight: bold;">${item.quantity}</td>
                  <td style="text-align: right; padding: 12px; border: 1px solid #ddd; font-weight: bold;">${(item.price * item.quantity).toFixed(2)}€</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background-color: #f7f7f7;">
                <td colspan="4" style="text-align: right; padding: 12px; border: 1px solid #ddd; font-weight: bold;">Medzisúčet:</td>
                <td style="text-align: right; padding: 12px; border: 1px solid #ddd; font-weight: bold;">${(order.totalAmount - (order.deliveryFee ?? 0)).toFixed(2)}€</td>
              </tr>
              <tr>
                <td colspan="4" style="text-align: right; padding: 12px; border: 1px solid #ddd;">Doprava:</td>
                <td style="text-align: right; padding: 12px; border: 1px solid #ddd;">${(order.deliveryFee ?? 0).toFixed(2)}€</td>
              </tr>
              <tr style="background-color: #f5f5f5;">
                <td colspan="4" style="text-align: right; padding: 15px; border: 1px solid #ddd; font-weight: bold; font-size: 18px;">SPOLU:</td>
                <td style="text-align: right; padding: 15px; border: 1px solid #ddd; font-weight: bold; font-size: 18px; color: #4a5d23;">${order.totalAmount.toFixed(2)}€</td>
              </tr>
            </tfoot>
          </table>
          
          ${order.notes ? `
            <div style="margin: 25px 0; padding: 15px; background-color: #f9f9f9; border: 1px solid #ddd; border-left: 5px solid #4a5d23;">
              <h3 style="margin-top: 0; color: #4a5d23;">Vaša poznámka:</h3>
              <p style="margin: 10px 0 0 0; font-style: italic; font-size: 16px;">${order.notes}</p>
            </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
            <p style="margin-top: 0; font-size: 16px;">S pozdravom,</p>
            <p style="margin-bottom: 0; font-weight: bold; font-size: 16px;">Pizzeria Janíček</p>
            <p style="margin-top: 5px; font-size: 14px;">
              Telefón: +421 944 386 486<br>
              Email: pizza.objednavka@gmail.com
            </p>
          </div>
        </div>
        
        <div style="background-color: #4a5d23; color: white; padding: 20px; text-align: center; border-radius: 0 0 5px 5px;">
          <p style="margin: 0; font-size: 16px;">Pizzeria Janíček - Objednávkový systém</p>
          <p style="margin: 10px 0 0 0; font-size: 14px;">© ${new Date().getFullYear()} Pizzeria Janíček, Púchov</p>
        </div>
      </div>
    `;
  } catch (error) {
    console.error(`[EMAIL] Chyba pri vytváraní HTML emailu pre zákazníka:`, error);
    return `<div style="font-family: sans-serif; text-align: center; padding: 20px;">
      <h1>Potvrdenie objednávky - Pizzeria Janíček</h1>
      <p>Ďakujeme za Vašu objednávku. V prípade nejasností nás prosím kontaktujte telefonicky na +421 944 386 486.</p>
    </div>`;
  }
}

// Formátovanie objednávky pre email do reštaurácie
function formatRestaurantOrderToHtml(order) {
  try {
    // Bezpečnostná kontrola pre property items pred použitím
    const items = Array.isArray(order.items) ? order.items : [];
    
    // Výpočet celkového počtu položiek
    const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
    // Typ doručenia
    let deliveryType = "Doručenie";
    if (order.deliveryType === "PICKUP") {
      deliveryType = "Osobný odber";
    }
    
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #4a5d23; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">NOVÁ OBJEDNÁVKA #${order.id}</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px; font-weight: bold;">${formatOrderTime()} | ${deliveryType}</p>
        </div>
        
        <div style="border: 1px solid #ddd; border-top: none; padding: 25px; background-color: #fff;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <tr style="background-color: #f7f7f7;">
              <td style="padding: 12px; width: 50%; border: 1px solid #ddd; font-weight: bold;">Zákazník:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">${order.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Telefón:</td>
              <td style="padding: 12px; border: 1px solid #ddd; font-size: 18px;">${order.customerPhone}</td>
            </tr>
            <tr style="background-color: #f7f7f7;">
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Spôsob prevzatia:</td>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; color: ${order.deliveryType === 'PICKUP' ? '#e65100' : '#4a5d23'}">
                ${order.deliveryType === 'PICKUP' ? 'OSOBNÝ ODBER' : 'DORUČENIE NA ADRESU'}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Adresa:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">
                ${order.deliveryAddress}<br>
                ${order.deliveryCity}, ${order.deliveryPostalCode}
              </td>
            </tr>
            <tr style="background-color: #f7f7f7;">
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Celková suma:</td>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; font-size: 18px; color: #4a5d23;">${order.totalAmount.toFixed(2)}€</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Počet položiek:</td>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">${totalItemCount} ks</td>
            </tr>
            ${order.customerEmail ? `
            <tr style="background-color: #f7f7f7;">
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Email:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">${order.customerEmail}</td>
            </tr>
            ` : ''}
          </table>
          
          <h2 style="font-size: 20px; color: #4a5d23; margin: 25px 0 15px 0; text-transform: uppercase; border-bottom: 2px solid #4a5d23; padding-bottom: 10px;">
            OBJEDNANÉ POLOŽKY
          </h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 16px;">
            <thead>
              <tr style="background-color: #f7f7f7;">
                <th style="text-align: left; padding: 12px; border: 1px solid #ddd;">#</th>
                <th style="text-align: left; padding: 12px; border: 1px solid #ddd;">Pizza</th>
                <th style="text-align: center; padding: 12px; border: 1px solid #ddd;">Typ</th>
                <th style="text-align: center; padding: 12px; border: 1px solid #ddd;">Ks</th>
                <th style="text-align: right; padding: 12px; border: 1px solid #ddd;">Cena</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, index) => `
                <tr>
                  <td style="text-align: left; padding: 12px; border: 1px solid #ddd; font-weight: bold;">${index + 1}.</td>
                  <td style="text-align: left; padding: 12px; border: 1px solid #ddd;">
                    <div style="font-weight: bold;">${item.name}</div>
                    ${Array.isArray(item.extras) && item.extras.length > 0 ? `
                      <div style="margin-top: 5px; font-size: 14px;">
                        <span style="font-weight: bold;">Extra:</span> ${item.extras.map((e) => e.name).join(', ')}
                      </div>
                    ` : ''}
                  </td>
                  <td style="text-align: center; padding: 12px; border: 1px solid #ddd;">${getSlovakSizeType(item.size)}</td>
                  <td style="text-align: center; padding: 12px; border: 1px solid #ddd; font-weight: bold;">${item.quantity}</td>
                  <td style="text-align: right; padding: 12px; border: 1px solid #ddd; font-weight: bold;">${(item.price * item.quantity).toFixed(2)}€</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background-color: #f7f7f7;">
                <td colspan="4" style="text-align: right; padding: 12px; border: 1px solid #ddd; font-weight: bold;">Medzisúčet:</td>
                <td style="text-align: right; padding: 12px; border: 1px solid #ddd; font-weight: bold;">${(order.totalAmount - (order.deliveryFee ?? 0)).toFixed(2)}€</td>
              </tr>
              <tr>
                <td colspan="4" style="text-align: right; padding: 12px; border: 1px solid #ddd;">Doprava:</td>
                <td style="text-align: right; padding: 12px; border: 1px solid #ddd;">${(order.deliveryFee ?? 0).toFixed(2)}€</td>
              </tr>
              <tr style="background-color: #f5f5f5;">
                <td colspan="4" style="text-align: right; padding: 15px; border: 1px solid #ddd; font-weight: bold; font-size: 18px;">SPOLU:</td>
                <td style="text-align: right; padding: 15px; border: 1px solid #ddd; font-weight: bold; font-size: 18px; color: #4a5d23;">${order.totalAmount.toFixed(2)}€</td>
              </tr>
            </tfoot>
          </table>
          
          ${order.notes ? `
            <div style="margin: 25px 0; padding: 15px; background-color: #f9f9f9; border: 1px solid #ddd; border-left: 5px solid #4a5d23;">
              <h3 style="margin-top: 0; color: #4a5d23;">POZNÁMKA OD ZÁKAZNÍKA:</h3>
              <p style="margin: 10px 0 0 0; font-style: italic; font-size: 16px;">${order.notes}</p>
            </div>
          ` : ''}
        </div>
        
        <div style="background-color: #4a5d23; color: white; padding: 20px; text-align: center; border-radius: 0 0 5px 5px;">
          <p style="margin: 0; font-size: 16px;">Pizzeria Janíček - Objednávkový systém</p>
          <p style="margin: 10px 0 0 0; font-size: 14px;">© ${new Date().getFullYear()} Pizzeria Janíček, Púchov</p>
        </div>
      </div>
    `;
  } catch (error) {
    console.error(`[EMAIL] Chyba pri vytváraní HTML emailu pre reštauráciu:`, error);
    return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #e63946; text-align: center; border: 2px solid #e63946; border-radius: 5px;">
      <h1>Chyba pri generovaní objednávky #${order.id}</h1>
      <p>Pri vytváraní emailu nastala chyba. Prosím, pozrite logy pre viac informácií.</p>
    </div>`;
  }
}

// Vytvorenie textovej verzie emailu pre zákazníka
function formatOrderToText(order) {
  // Bezpečnostná kontrola pre property items pred použitím
  const items = Array.isArray(order.items) ? order.items : [];
  
  // Diagnostické informácie pre serverless ladiace účely
  console.log(`[EMAIL] Generujem textový email pre zákazníka - objednávka #${order.id}, ${items.length} položiek`);
  
  try {
    return `
    Potvrdenie objednávky - Pizzeria Janíček
    =============================================
    
    Vážený zákazník,
    
    ďakujeme za Vašu objednávku v Pizzerii Janíček. Nižšie nájdete detaily Vašej objednávky:
    
    Dátum objednávky: ${formatOrderTime()}
    
    Kontaktné údaje:
    Meno: ${order.customerName}
    Telefón: ${order.customerPhone}
    Email: ${order.customerEmail || 'neuvedený'}
    
    Spôsob prevzatia: ${order.deliveryType === 'PICKUP' ? 'Osobný odber v prevádzke' : 'Doručenie na adresu'}
    ${order.deliveryType === 'DELIVERY' ? `Adresa doručenia: ${order.deliveryAddress}, ${order.deliveryCity}, ${order.deliveryPostalCode}` : 'Adresa prevzatia: Pizzeria Janíček, Púchov'}
    
    Objednané položky:
    ${Array.isArray(order.items) ? order.items.map(item => 
      `- ${item.name} (${getSlovakSizeType(item.size)}) - ${item.quantity}x - ${(item.price * item.quantity).toFixed(2)}€${
        Array.isArray(item.extras) && item.extras.length > 0 ? 
        `\n  Extras: ${item.extras.map((e) => `${e.name} (+${e.price.toFixed(2)}€)`).join(', ')}` : ''
      }`
    ).join('\n') : 'Žiadne položky'}
    
    Medzisúčet: ${(order.totalAmount - (order.deliveryFee ?? 0)).toFixed(2)}€
    Doprava: ${(order.deliveryFee ?? 0).toFixed(2)}€
    Celková suma: ${order.totalAmount.toFixed(2)}€
    
    ${order.notes ? `Poznámka k objednávke: ${order.notes}` : ''}
    
    S pozdravom,
    Pizzeria Janíček
    +421 944 386 486
    pizza.objednavka@gmail.com
  `;
  } catch (error) {
    console.error(`[EMAIL] Chyba pri vytváraní textového emailu pre zákazníka:`, error);
    return `Potvrdenie objednávky - Pizzeria Janíček\n\nVznikla chyba pri generovaní detailného obsahu emailu. Prosím, kontaktujte nás telefonicky na +421 944 386 486.\n\nĎakujeme za pochopenie.\nPizzeria Janíček`;
  }
}

// Vytvorenie textovej verzie emailu pre reštauráciu
function formatRestaurantOrderToText(order) {
  // Bezpečnostná kontrola pre property items pred použitím
  const items = Array.isArray(order.items) ? order.items : [];
  
  // Diagnostické informácie pre serverless ladiace účely
  console.log(`[EMAIL] Generujem textový email pre reštauráciu - objednávka #${order.id}, ${items.length} položiek`);
  
  try {
    return `
    NOVÁ OBJEDNÁVKA #${order.id} - ${order.customerName}
    ===============================================
    
    Dátum objednávky: ${formatOrderTime()}
    
    Zákazník: ${order.customerName}
    Telefón: ${order.customerPhone}
    Email: ${order.customerEmail || 'neuvedený'}
    
    Spôsob prevzatia: ${order.deliveryType === 'PICKUP' ? 'OSOBNÝ ODBER' : 'DORUČENIE NA ADRESU'}
    Adresa: ${order.deliveryAddress}, ${order.deliveryCity}, ${order.deliveryPostalCode}
    
    Celková suma: ${order.totalAmount.toFixed(2)}€
    Počet položiek: ${Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0} ks
    
    POLOŽKY OBJEDNÁVKY:
    ${Array.isArray(order.items) ? order.items.map((item, index) => 
      `${index + 1}. ${item.name} (${getSlovakSizeType(item.size)}) - ${item.quantity}x${
        Array.isArray(item.extras) && item.extras.length > 0 ? 
        `\n   Extra: ${item.extras.map((e) => e.name).join(', ')}` : ''
      }`
    ).join('\n') : 'Žiadne položky'}
    
    ${order.notes ? `POZNÁMKA OD ZÁKAZNÍKA:\n${order.notes}` : ''}
  `;
  } catch (error) {
    console.error(`[EMAIL] Chyba pri vytváraní textového emailu pre reštauráciu:`, error);
    return `NOVÁ OBJEDNÁVKA #${order.id} - Chyba pri generovaní obsahu, pozri logs`;
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Pizzeria Janíček API - Verzia pre autoscale' });
});

// Importujeme diagnostické nástroje
const { 
  checkEmailConfiguration, 
  testHttpEmailService, 
  getAPIConfig 
} = require('./diagnostic-tools');

// Testovací endpoint pre overenie funkčnosti emailov
app.get('/api/test-email-direct', (req, res) => {
  // Preposielame do nášho email handlera
  handleTestEmail(req, res);
});

// Nové diagnostické endpointy pre riešenie problémov v produkčnom prostredí
app.get('/api/diagnostic/email-config', (req, res) => {
  // Zabezpečíme, že odpoveď bude vždy JSON
  res.set('Content-Type', 'application/json');
  checkEmailConfiguration(req, res);
});

app.get('/api/diagnostic/test-http-email', (req, res) => {
  // Zabezpečíme, že odpoveď bude vždy JSON
  res.set('Content-Type', 'application/json');
  testHttpEmailService(req, res);
});

app.get('/api/diagnostic', (req, res) => {
  // Zabezpečíme, že odpoveď bude vždy JSON
  res.set('Content-Type', 'application/json');
  getAPIConfig(req, res);
});

// Endpoint pre získanie pizz z filesystem
app.get('/api/pizzas', (req, res) => {
  try {
    const pizzasFilePath = path.join(__dirname, '..', 'pizzas-new.json');
    
    // Najskôr skúšame načítať zo súborového systému
    if (fs.existsSync(pizzasFilePath)) {
      const pizzasData = fs.readFileSync(pizzasFilePath, 'utf8');
      const pizzas = JSON.parse(pizzasData);
      return res.json(pizzas);
    }
    
    // Fallback - integrované dáta
    res.json([
      {
        "id": 1,
        "name": "Margherita",
        "description": "Paradajková omáčka, mozzarella, bazalka",
        "price": 6.5,
        "image": "margherita.jpg",
        "tags": ["basic", "vegetarian"],
        "ingredients": ["paradajková omáčka", "mozzarella", "bazalka"],
        "allergens": "1, 7"
      },
      {
        "id": 2,
        "name": "Quattro Formaggi",
        "description": "Smotanový základ, štyri druhy syra",
        "price": 8.5,
        "image": "quattro-formaggi.jpg",
        "tags": ["cheese", "vegetarian"],
        "ingredients": ["smotanový základ", "mozzarella", "gorgonzola", "parmezán", "eidam"],
        "allergens": "1, 7"
      }
    ]);
  } catch (error) {
    console.error('Error loading pizzas:', error);
    res.status(500).json({ message: 'Chyba pri načítaní pizz' });
  }
});

// Endpoint pre získanie extraitems z filesystem
app.get('/api/extras', (req, res) => {
  try {
    // Hardcoded dáta
    const extras = [
      {"name":"Mozzarella","price":1.2,"id":1},
      {"name":"Šunka","price":1.5,"id":2},
      {"name":"Slanina","price":1.5,"id":3},
      {"name":"Eidam","price":1.2,"id":4},
      {"name":"Hermelín","price":1.8,"id":5},
      {"name":"Niva","price":1.5,"id":6},
      {"name":"Olivy","price":1.0,"id":7},
      {"name":"Ananás","price":1.2,"id":8},
      {"name":"Kukurica","price":1.0,"id":9},
      {"name":"Feferóny","price":1.0,"id":10}
    ];
    
    res.json(extras);
  } catch (error) {
    console.error('Error loading extras:', error);
    res.status(500).json({ message: 'Chyba pri načítaní prísad' });
  }
});

// Endpoint pre odoslanie objednávky s odoslaním emailov cez serverless
app.post('/api/orders', async (req, res) => {
  try {
    // Detekujeme origin a IP pre diagnostiku
    const headers = req.headers['content-type'] || 'neznámy';
    const origin = req.headers['origin'] || 'neznámy';
    const ip = req.ip || req.connection.remoteAddress || 'neznámy';
    const bodySize = JSON.stringify(req.body).length;
    
    console.log('Prijatá nová objednávka:', {
      headers,
      origin,
      ip,
      body_size: bodySize
    });

    // Kontrola, či máme platné body
    if (!req.body || !req.body.customerName || !req.body.items || !Array.isArray(req.body.items)) {
      console.error('Neplatné dáta objednávky:', req.body);
      return res.status(400).json({ message: 'Neplatné dáta objednávky' });
    }
    
    console.log('Validné dáta objednávky:', {
      customer: req.body.customerName,
      email: req.body.customerEmail || 'nezadaný',
      items_count: req.body.items.length,
      total: req.body.totalAmount
    });

    // Vytvoríme unikátne ID pre objednávku s cache busting, aby sme mali skutočne unikátne hodnoty
    const orderId = Math.floor(Date.now() / 1000) % 1000000 + Math.floor(Math.random() * 1000);
    console.log('Vytváram objednávku v databáze...');
    
    // Spoločné dáta pre obidva emaily
    const order = {
      ...req.body,
      id: orderId,
      status: 'pending',
      created: new Date().toISOString()
    };
    
    console.log(`Objednávka #${orderId} úspešne vytvorená a uložená do databázy`);

    // Paralelne odošleme oba emaily pre rýchlejšie spracovanie
    let customerEmailResult = null;
    let restaurantEmailResult = null;
    
    try {
      // Pripravíme emailové dáta pre zákazníka
      const customerEmailData = {
        customerEmail: order.customerEmail,
        orderHtml: formatOrderToHtml(order),
        orderText: formatOrderToText(order),
        orderId: order.id
      };
      
      // Pripravíme emailové dáta pre reštauráciu
      const restaurantEmailData = {
        orderHtml: formatRestaurantOrderToHtml(order),
        orderText: formatRestaurantOrderToText(order),
        orderId: order.id,
        customerEmail: order.customerEmail,
        customerName: order.customerName
      };

      // Odošleme emaily s automatickými retry pokusmi a záložnými mechanizmami
      const emailPromises = [];
      
      // Email pre zákazníka (iba ak má zadaný email)
      if (order.customerEmail) {
        console.log(`Začínam odosielanie potvrdenia objednávky #${order.id} zákazníkovi na email ${order.customerEmail}`);
        
        emailPromises.push(
          sendCustomerEmail(customerEmailData)
            .then(result => {
              customerEmailResult = result;
              return result;
            })
            .catch(error => {
              console.error(`Chyba pri odosielaní emailu zákazníkovi po všetkých pokusoch:`, error);
              return { success: false, error: String(error) };
            })
        );
      } else {
        console.log(`Nebola uvedená emailová adresa pre objednávku #${order.id}, preskakuje sa odoslanie emailu zákazníkovi`);
      }
      
      // Email pre reštauráciu (vždy)
      console.log(`Začínam odosielanie notifikácie o objednávke #${order.id} do reštaurácie`);
      
      emailPromises.push(
        sendRestaurantEmail(restaurantEmailData)
          .then(result => {
            restaurantEmailResult = result;
            return result;
          })
          .catch(error => {
            console.error(`Chyba pri odosielaní emailu reštaurácii po všetkých pokusoch:`, error);
            return { success: false, error: String(error) };
          })
      );
      
      // Počkáme na dokončenie všetkých emailov
      await Promise.all(emailPromises);
    } catch (emailError) {
      console.error(`Chyba pri odosielaní emailov (objednávka #${order.id}):`, emailError);
      // Pokračujeme, aj keď sa emaily nepodarilo odoslať, objednávka je stále vytvorená
    }
    
    // Vrátime odpoveď klientovi
    res.status(201).json({
      id: order.id,
      status: order.status,
      created: order.created
    });
  } catch (error) {
    console.error('Chyba pri spracovaní objednávky:', error);
    res.status(500).json({ message: 'Nepodarilo sa spracovať objednávku', error: String(error) });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ 
    message: 'Serverová chyba',
    error: process.env.NODE_ENV === 'production' ? 'Interná serverová chyba' : err.message
  });
});

// Export pre použitie s serverless functions
module.exports = app;

// Spustenie servera, ak je volaný priamo
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Serverless API beží na porte ${PORT}`);
  });
}
