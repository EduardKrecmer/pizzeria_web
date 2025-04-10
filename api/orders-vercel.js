// API endpoint pre spracovanie objednávok
// Tento súbor bude nasadený ako serverless funkcia na Vercel

// Pre emailové notifikácie používame nodemailer
const nodemailer = require('nodemailer');

let transporter = null;

// Funkcia pre inicializáciu transportera pre emaily
async function createEmailTransporter() {
  // V produkčnom prostredí by sme mali konfigurovať skutočný SMTP server
  // Pre testovacie účely používame Ethereal
  let testAccount = await nodemailer.createTestAccount();
  
  // Pre Vercel nasadenie môžeme využiť environment premenné
  // alebo použiť testovací účet
  const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || testAccount.user,
      pass: process.env.EMAIL_PASS || testAccount.pass
    }
  };

  // Ak používame Gmail
  if (emailConfig.host === 'smtp.gmail.com') {
    emailConfig.port = 465;
    emailConfig.secure = true;
    emailConfig.service = 'gmail';
  }

  // Vytvoríme transporter
  return nodemailer.createTransport(emailConfig);
}

// Funkcie pre formátovanie emailu
function formatOrderTime() {
  const now = new Date();
  return now.toLocaleString('sk-SK', { 
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getSlovakSizeType(size) {
  const sizeTypes = {
    'REGULAR': 'Klasická',
    'CREAM': 'Smotanový základ',
    'GLUTEN_FREE': 'Bezlepková',
    'VEGAN': 'Vegánska',
    'THICK': 'Hrubé cesto'
  };
  return sizeTypes[size] || 'Klasická';
}

// Formátovanie HTML pre zákaznícky email
function formatOrderToHtml(order) {
  const { items, customerName, deliveryAddress, deliveryCity, deliveryPostalCode, deliveryFee } = order;
  const deliveryType = order.deliveryType === 'PICKUP' ? 'Vyzdvihnutie v reštaurácii' : 'Donáška na adresu';
  
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background-color: #4a5d23; padding: 15px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Vaša objednávka bola prijatá</h1>
        <p style="color: #f0f0f0; margin: 5px 0 0 0; font-size: 16px;">Ďakujeme za vašu objednávku z Pizzerie Janíček</p>
      </div>
      
      <div style="padding: 25px; background-color: #fcfcfc; border-left: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">
        <p style="margin-bottom: 20px;">Ahoj <strong>${customerName}</strong>, prijali sme tvoju objednávku pizze.</p>
        
        <h2 style="color: #4a5d23; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px; margin-top: 30px;">Detaily objednávky</h2>
        <p><strong>Dátum a čas:</strong> ${formatOrderTime()}</p>
        <p><strong>Spôsob doručenia:</strong> ${deliveryType}</p>
        ${order.deliveryType === 'DELIVERY' ? `
          <p><strong>Adresa doručenia:</strong> ${deliveryAddress}, ${deliveryCity} ${deliveryPostalCode}</p>
        ` : ''}
        
        <h3 style="color: #4a5d23; margin-top: 30px;">Objednané položky</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr style="background-color: #f5f5f5;">
            <th style="text-align: left; padding: 10px; border-bottom: 1px solid #e0e0e0;">Položka</th>
            <th style="text-align: right; padding: 10px; border-bottom: 1px solid #e0e0e0;">Množstvo</th>
            <th style="text-align: right; padding: 10px; border-bottom: 1px solid #e0e0e0;">Cena</th>
          </tr>
          ${items.map(item => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">
                <div style="font-weight: bold;">${item.name} (${getSlovakSizeType(item.size)})</div>
                ${item.ingredients && item.ingredients.length > 0 ? 
                  `<div style="font-size: 14px; color: #666;">${item.ingredients.join(', ')}</div>` : ''}
                ${item.extras && item.extras.length > 0 ? 
                  `<div style="font-size: 14px; color: #666;">
                    <span style="font-style: italic;">Extra:</span> ${item.extras.map(e => `${e.name} (+${e.price.toFixed(2)}€)`).join(', ')}
                  </div>` : ''}
              </td>
              <td style="text-align: right; padding: 10px; border-bottom: 1px solid #e0e0e0;">${item.quantity}x</td>
              <td style="text-align: right; padding: 10px; border-bottom: 1px solid #e0e0e0;">${(item.price * item.quantity).toFixed(2)} €</td>
            </tr>
          `).join('')}
          ${deliveryFee > 0 ? `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">Poplatok za doručenie</td>
              <td style="text-align: right; padding: 10px; border-bottom: 1px solid #e0e0e0;">1x</td>
              <td style="text-align: right; padding: 10px; border-bottom: 1px solid #e0e0e0;">${deliveryFee.toFixed(2)} €</td>
            </tr>
          ` : ''}
          <tr>
            <td colspan="2" style="text-align: right; padding: 10px; font-weight: bold; border-bottom: 1px solid #e0e0e0;">Celková suma:</td>
            <td style="text-align: right; padding: 10px; font-weight: bold; border-bottom: 1px solid #e0e0e0;">${order.totalAmount.toFixed(2)} €</td>
          </tr>
        </table>
        
        <p style="background-color: #f8f8f8; padding: 15px; margin-top: 30px; border-left: 4px solid #4a5d23;">
          Vaša pizza bude pripravená na vyzdvihnutie alebo doručená v čo najkratšom čase. Bežná doba doručenia je 30-50 minút v závislosti od vyťaženosti reštaurácie.
        </p>
        
        <p style="margin-top: 30px;">Prajeme dobrú chuť!</p>
        <p style="margin: 0;">S pozdravom,<br>Team Pizzeria Janíček</p>
      </div>
      
      <div style="background-color: #4a5d23; color: white; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px;">
        <p style="margin: 0 0 10px 0;">© ${new Date().getFullYear()} Pizzeria Janíček, Púchov</p>
        <p style="margin: 0;">Tel: +421 915 837 713 | Email: pizza.objednavka@gmail.com</p>
      </div>
    </div>
  `;
}

// Formátovanie HTML pre email reštaurácii
function formatRestaurantOrderToHtml(order) {
  const { items, customerName, customerPhone, customerEmail, deliveryAddress, deliveryCity, deliveryPostalCode, deliveryType, notes, id } = order;
  
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background-color: #4a5d23; padding: 15px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Nová objednávka #${id || ''}</h1>
        <p style="color: #f0f0f0; margin: 5px 0 0 0; font-size: 16px;">${formatOrderTime()}</p>
      </div>
      
      <div style="padding: 25px; background-color: #fcfcfc; border-left: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">
        <h2 style="color: #4a5d23; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">Informácie o zákazníkovi</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; width: 150px;"><strong>Zákazník:</strong></td>
            <td style="padding: 8px 0;">${customerName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Telefón:</strong></td>
            <td style="padding: 8px 0;">${customerPhone}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Email:</strong></td>
            <td style="padding: 8px 0;">${customerEmail || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Typ doručenia:</strong></td>
            <td style="padding: 8px 0; font-weight: bold; color: #4a5d23;">
              ${deliveryType === 'PICKUP' ? 'OSOBNÝ ODBER' : 'DONÁŠKA'}
            </td>
          </tr>
          ${deliveryType !== 'PICKUP' ? `
            <tr>
              <td style="padding: 8px 0;"><strong>Adresa:</strong></td>
              <td style="padding: 8px 0;">${deliveryAddress}, ${deliveryCity} ${deliveryPostalCode}</td>
            </tr>
          ` : ''}
          ${notes ? `
            <tr>
              <td style="padding: 8px 0;"><strong>Poznámka:</strong></td>
              <td style="padding: 8px 0;">${notes}</td>
            </tr>
          ` : ''}
        </table>
        
        <h2 style="color: #4a5d23; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px; margin-top: 30px;">Objednávka</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr style="background-color: #f5f5f5;">
            <th style="text-align: left; padding: 10px; border-bottom: 1px solid #e0e0e0;">Položka</th>
            <th style="text-align: right; padding: 10px; border-bottom: 1px solid #e0e0e0;">Počet</th>
            <th style="text-align: right; padding: 10px; border-bottom: 1px solid #e0e0e0;">Cena</th>
          </tr>
          ${items.map((item, index) => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">
                <div style="font-weight: bold;">${index + 1}. ${item.name} - ${getSlovakSizeType(item.size)}</div>
                <div style="font-size: 14px; color: #666;">${item.ingredients ? item.ingredients.join(', ') : '-'}</div>
                ${item.extras && item.extras.length > 0 ? `
                  <div style="font-size: 14px; color: #666; font-weight: bold;">
                    <span style="font-weight: bold;">Extra:</span> ${item.extras.map(e => e.name).join(', ')}
                  </div>
                ` : ''}
              </td>
              <td style="text-align: right; padding: 10px; border-bottom: 1px solid #e0e0e0;">${item.quantity}x</td>
              <td style="text-align: right; padding: 10px; border-bottom: 1px solid #e0e0e0;">${(item.price * item.quantity).toFixed(2)} €</td>
            </tr>
          `).join('')}
          ${order.deliveryFee > 0 ? `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">Poplatok za doručenie</td>
              <td style="text-align: right; padding: 10px; border-bottom: 1px solid #e0e0e0;">1x</td>
              <td style="text-align: right; padding: 10px; border-bottom: 1px solid #e0e0e0;">${order.deliveryFee.toFixed(2)} €</td>
            </tr>
          ` : ''}
          <tr>
            <td colspan="2" style="text-align: right; padding: 10px; font-weight: bold; border-bottom: 1px solid #e0e0e0;">Celková suma:</td>
            <td style="text-align: right; padding: 10px; font-weight: bold; border-bottom: 1px solid #e0e0e0;">${order.totalAmount.toFixed(2)} €</td>
          </tr>
        </table>
        
        <p style="background-color: #f8f8f8; padding: 15px; margin-top: 30px; border-left: 4px solid #ff4d4d; font-weight: bold;">
          Platba: V HOTOVOSTI PRI DORUČENÍ alebo VYZDVIHNUTÍ
        </p>
      </div>
      
      <div style="background-color: #4a5d23; color: white; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px;">
        <p style="margin: 0;">Táto notifikácia bola odoslaná z online systému pre Pizzeria Janíček</p>
      </div>
    </div>
  `;
}

// API handler pre serverless funkciu
module.exports = async (req, res) => {
  // Nastavenia CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Pre OPTIONS žiadosti okamžite vrátime úspešnú odpoveď
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Len spracovanie POST požiadaviek
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Vytvorenie fiktívneho ID objednávky pre testovacie účely
    // V produkcii by sme toto nahradili skutočným ID z databázy
    const orderId = Date.now().toString().slice(-6);
    
    // Pridanie ID k objednávke
    const order = {
      ...req.body,
      id: orderId
    };

    // V produkčnom prostredí by sme uložili objednávku do databázy

    // Inicializácia email transportera
    if (!transporter) {
      transporter = await createEmailTransporter();
    }

    // Odosielanie emailu zákazníkovi
    if (order.customerEmail) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || '"Pizzeria Janíček" <pizza.objednavka@gmail.com>',
          to: order.customerEmail,
          subject: 'Potvrdenie objednávky - Pizzeria Janíček',
          html: formatOrderToHtml(order)
        });
        console.log(`Potvrdenie objednávky odoslané zákazníkovi ${order.customerEmail}`);
      } catch (emailError) {
        console.error('Chyba pri odosielaní emailu zákazníkovi:', emailError);
        // Nezastavujeme spracovanie objednávky
      }
    }

    // Odosielanie emailu reštaurácii
    try {
      const restaurantEmail = process.env.RESTAURANT_EMAIL || 'vlastnawebstranka@gmail.com';
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Online Objednávka" <pizza.objednavka@gmail.com>',
        to: restaurantEmail,
        subject: `Nová objednávka #${orderId} - ${order.customerName}`,
        html: formatRestaurantOrderToHtml(order)
      });
      console.log(`Notifikácia o objednávke odoslaná reštaurácii na ${restaurantEmail}`);
    } catch (restaurantEmailError) {
      console.error('Chyba pri odosielaní notifikácie reštaurácii:', restaurantEmailError);
      // Nezastavujeme spracovanie objednávky
    }

    // Odpoveď klientovi s potvrdením objednávky
    res.status(201).json({
      ...order,
      message: 'Objednávka bola úspešne odoslaná',
      email_status: order.customerEmail ? 'odosielané' : 'email nezadaný'
    });
  } catch (error) {
    console.error('Chyba pri spracovaní objednávky:', error);
    res.status(500).json({ 
      message: 'Nepodarilo sa spracovať objednávku', 
      error: String(error)
    });
  }
};