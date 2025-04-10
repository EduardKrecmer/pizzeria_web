import nodemailer from 'nodemailer';
import { Order } from '../shared/schema';
import { CartItem, Extra } from '../client/src/types';

// Konfigurácia emailového transportu
// Pre produkciu by bolo potrebné nastaviť skutočný SMTP server
// Pre vývoj môžeme použiť Ethereal - https://ethereal.email/
let transporter: nodemailer.Transporter | null = null;
let lastTransporterInitTime = 0;

export async function initializeEmailTransporter() {
  const currentTime = Date.now();
  
  // V Vercel serverless prostredí potrebujeme spoľahlivé spracovanie transportera
  // Ak nemáme transporter alebo od poslednej inicializácie prešlo viac ako 5 minút, znovu inicializujeme
  if (!transporter || (currentTime - lastTransporterInitTime > 5 * 60 * 1000)) {
    console.log('[EMAIL] Transporter je neplatný alebo potrebuje reinicializáciu...');
    // Nepotrebujeme explicit nullovať, stačí že vytvoríme nový
  } else {
    // Ak už máme platný transporter, vrátime ho
    console.log('[EMAIL] Používam existujúci email transporter');
    lastTransporterInitTime = currentTime; // Aktualizujeme čas použitia
    return transporter;
  }
  
  // Najprv skúsime použiť produkčné nastavenia, ak existujú
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      console.log('[EMAIL] Inicializujem produkčný email transporter...');
      
      // Odstránime medzery na začiatku a konci
      const emailHost = process.env.EMAIL_HOST.trim();
      const emailUser = process.env.EMAIL_USER.trim();
      const emailPass = process.env.EMAIL_PASS.trim();
      
      // Zistíme, či ide o Gmail
      const isGmail = emailHost.includes('gmail');
      
      // Logujeme konfiguráciu (bez hesla)
      console.log(`[EMAIL] Konfigurácia - host: "${emailHost}", user: "${emailUser}", isGmail: ${isGmail}`);
      
      // Vytvoriť transporter s reálnymi údajmi pre autoscale prostredie
      const transportConfig: any = {
        host: emailHost,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
        // Lepšie nastavenie pre Replit autoscale
        pool: false, // Pre autoscale je lepšie nepoužívať pool
        maxConnections: 1,
        maxMessages: 5,
        socketTimeout: 30000, // 30 sekúnd timeout pre socket operácie
        connectionTimeout: 30000, // 30 sekúnd timeout pre pripojenie
        greetingTimeout: 15000 // 15 sekúnd timeout pre SMTP greeting
      };
    
      // Pre Gmail potrebujeme dodatočné nastavenia
      if (isGmail) {
        console.log('[EMAIL] Používam Gmail SMTP server s dodatočnými nastaveniami');
        
        // Upresnené nastavenia pre Gmail
        transportConfig.service = 'gmail';
        transportConfig.host = 'smtp.gmail.com';
        transportConfig.port = 465; // Force port 465 for Gmail SSL
        transportConfig.secure = true; // Force SSL for Gmail
        
        // Zvláštne nastavenia pre Gmail
        transportConfig.tls = {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        };
        
        transportConfig.debug = true; // Zapneme debug mód pre sledovanie problémov
        
        // Ďalšie nastavenia pre stabilitu pod Replitom
        transportConfig.pool = true;
        transportConfig.maxConnections = 1;
        transportConfig.maxMessages = 5;
        
        // Logovanie pred odoslaním
        console.log('Gmail transport config:', {
          host: transportConfig.host,
          port: transportConfig.port,
          secure: transportConfig.secure,
          service: transportConfig.service,
          auth: { user: transportConfig.auth.user, pass: '***' }
        });
      }
      
      transporter = nodemailer.createTransport(transportConfig);
      console.log('Produkčný email transporter inicializovaný úspešne');
      
      // Otestujme transporter
      try {
        await transporter.verify();
        console.log('SMTP server je pripravený na prijímanie e-mailov');
        return transporter;
      } catch (verifyError) {
        console.error('Nepodarilo sa overiť SMTP spojenie:', verifyError);
        throw new Error('SMTP spojenie neúspešné');
      }
    } catch (error) {
      console.error('Nepodarilo sa vytvoriť produkčný email transporter:', error);
      // Pokračujeme k záložnému riešeniu
    }
  } else {
    console.log('Produkčné email nastavenia chýbajú, použijem záložné riešenie');
  }
  
  // Ako záložné riešenie skúsime vytvoriť testovacie Ethereal konto
  console.log('Vytváram testovacie Ethereal konto ako záložné riešenie...');
  try {
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('Testovacie emailové konto vytvorené:', testAccount.user);
    console.log('Pre zobrazenie testovacích emailov navštívte: https://ethereal.email');
    console.log('Prihlasovacie údaje: ', testAccount.user, testAccount.pass);
    
    // Vytvoriť transporter s testovacími údajmi
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    console.log('SMTP transporter inicializovaný s testovacím Ethereal účtom');
    return transporter;
  } catch (etherealError) {
    console.error('Nepodarilo sa vytvoriť Ethereal účet:', etherealError);
  }
  
  // Ak všetko zlyhá, vrátime null
  console.error('Nepodarilo sa vytvoriť žiadny emailový transporter');
  return null;
}

// Zistenie slovenského názvu pre typ veľkosti pizze
function getSlovakSizeType(size: string): string {
  const sizeMap: Record<string, string> = {
    'REGULAR': 'Klasická',
    'CREAM': 'Smotanový základ',
    'GLUTEN_FREE': 'Bezlepková',
    'VEGAN': 'Vegánska',
    'THICK': 'Hrubé cesto'
  };
  return sizeMap[size] || size;
}

// Formátovanie času objednávky
function formatOrderTime(): string {
  const now = new Date();
  return now.toLocaleString('sk-SK', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
}

// Formátovanie objednávky na čitateľný HTML string pre zákazníka
function formatOrderToHtml(order: Order): string {
  // Bezpečnostná kontrola pre property items pred použitím
  const items = Array.isArray(order.items) ? order.items : [];
  
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background-color: #4a5d23; padding: 15px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Potvrdenie objednávky</h1>
        <p style="color: #f0f0f0; margin: 5px 0 0 0; font-size: 16px;">Objednávka prijatá ${formatOrderTime()}</p>
      </div>
      
      <div style="padding: 25px; background-color: #fcfcfc; border-left: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">
        <table style="width: 100%; background-color: #f5f7f0; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <tr>
            <td style="padding: 5px; font-weight: bold;">Stav:</td>
            <td style="padding: 5px;"><span style="background-color: #4a5d23; color: white; padding: 3px 7px; border-radius: 12px; font-size: 12px; text-transform: uppercase;">Prijatá</span></td>
          </tr>
        </table>
        
        <div style="margin: 20px 0; padding-bottom: 15px; border-bottom: 1px solid #e0e0e0;">
          <h2 style="font-size: 18px; color: #4a5d23; margin-bottom: 10px;">Kontaktné údaje</h2>
          <div style="display: flex; flex-wrap: wrap;">
            <div style="width: 100%; margin-bottom: 10px;">
              <p style="margin: 0; font-weight: bold;">Meno a priezvisko:</p>
              <p style="margin: 5px 0 0 0;">${order.customerName}</p>
            </div>
            <div style="width: 100%; margin-bottom: 10px;">
              <p style="margin: 0; font-weight: bold;">Telefón:</p>
              <p style="margin: 5px 0 0 0;">${order.customerPhone}</p>
            </div>
            ${order.customerEmail ? `
            <div style="width: 100%; margin-bottom: 10px;">
              <p style="margin: 0; font-weight: bold;">Email:</p>
              <p style="margin: 5px 0 0 0;">${order.customerEmail}</p>
            </div>
            ` : ''}
          </div>
        </div>
        
        <div style="margin: 20px 0; padding-bottom: 15px; border-bottom: 1px solid #e0e0e0;">
          <h2 style="font-size: 18px; color: #4a5d23; margin-bottom: 10px;">Spôsob prevzatia</h2>
          <div style="background-color: #f5f7f0; padding: 15px; border-radius: 8px;">
            <p style="margin: 0; font-weight: bold; font-size: 16px; color: ${order.deliveryType === 'PICKUP' ? '#e65100' : '#4a5d23'}">
              ${order.deliveryType === 'PICKUP' ? 'Osobný odber v prevádzke' : 'Doručenie na adresu'}
            </p>
            ${order.deliveryType === 'DELIVERY' ? 
              `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #ccc;">
                <p style="margin: 0; font-weight: bold; font-size: 15px;">Adresa doručenia:</p>
                <p style="margin: 5px 0 0 0; font-weight: bold;">${order.deliveryAddress}</p>
                <p style="margin: 5px 0 0 0;">${order.deliveryCity}, ${order.deliveryPostalCode}</p>
               </div>` 
            : `<p style="margin: 5px 0 0 0; font-style: italic;">Vašu objednávku si môžete vyzdvihnúť na adrese Pizzerie Janíček.</p>`}
          </div>
        </div>
        
        <div style="margin: 20px 0;">
          <h2 style="font-size: 18px; color: #4a5d23; margin-bottom: 15px;">Objednané položky</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f7f0;">
                <th style="text-align: left; padding: 10px; border-bottom: 2px solid #4a5d23; font-weight: 600; font-size: 14px;">Položka</th>
                <th style="text-align: center; padding: 10px; border-bottom: 2px solid #4a5d23; font-weight: 600; font-size: 14px;">Variant</th>
                <th style="text-align: center; padding: 10px; border-bottom: 2px solid #4a5d23; font-weight: 600; font-size: 14px;">Počet</th>
                <th style="text-align: right; padding: 10px; border-bottom: 2px solid #4a5d23; font-weight: 600; font-size: 14px;">Cena</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item: CartItem) => `
                <tr>
                  <td style="text-align: left; padding: 12px 10px; border-bottom: 1px solid #eee;">
                    <div style="font-weight: bold; font-size: 16px;">${item.name}</div>
                    ${Array.isArray(item.extras) && item.extras.length > 0 ? `
                      <div style="font-size: 13px; color: #666; margin-top: 5px;">
                        <span style="font-style: italic;">Extra:</span> ${item.extras.map((e: Extra) => `${e.name} (+${e.price.toFixed(2)}€)`).join(', ')}
                      </div>
                    ` : ''}
                  </td>
                  <td style="text-align: center; padding: 12px 10px; border-bottom: 1px solid #eee; font-size: 14px; color: #555;">${getSlovakSizeType(item.size)}</td>
                  <td style="text-align: center; padding: 12px 10px; border-bottom: 1px solid #eee; font-weight: bold;">${item.quantity}×</td>
                  <td style="text-align: right; padding: 12px 10px; border-bottom: 1px solid #eee; font-weight: bold;">${(item.price * item.quantity).toFixed(2)}€</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="text-align: right; padding: 15px 10px; font-weight: bold; font-size: 16px;">Medzisúčet:</td>
                <td style="text-align: right; padding: 15px 10px; font-weight: bold; font-size: 16px;">${(order.totalAmount - (order.deliveryFee ?? 0)).toFixed(2)}€</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align: right; padding: 5px 10px; font-size: 15px;">Doprava:</td>
                <td style="text-align: right; padding: 5px 10px; font-size: 15px;">${(order.deliveryFee ?? 0).toFixed(2)}€</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align: right; padding: 15px 10px; font-weight: bold; font-size: 18px; color: #4a5d23;">Celková suma:</td>
                <td style="text-align: right; padding: 15px 10px; font-weight: bold; font-size: 18px; color: #4a5d23;">${order.totalAmount.toFixed(2)}€</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        ${order.notes ? `
          <div style="margin: 20px 0;">
            <h2 style="font-size: 18px; color: #4a5d23; margin-bottom: 10px;">Poznámka k objednávke</h2>
            <div style="background-color: #f5f7f0; padding: 15px; border-radius: 8px; color: #555; font-style: italic;">
              ${order.notes}
            </div>
          </div>
        ` : ''}
      </div>
      
      <div style="background-color: #4a5d23; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
        <p style="margin: 0; font-size: 16px;">Ďakujeme za Vašu objednávku!</p>
        <p style="margin: 10px 0 0 0; font-size: 14px;">V prípade otázok nás kontaktujte telefonicky na čísle +421 944 386 486</p>
        <p style="margin: 10px 0 0 0; font-size: 14px;">alebo emailom na pizza.objednavka@gmail.com</p>
      </div>
      
      <div style="padding-top: 15px; font-size: 12px; color: #777; text-align: center;">
        <p>© ${new Date().getFullYear()} Pizzeria Janíček, Púchov. Všetky práva vyhradené.</p>
      </div>
    </div>
  `;
}

// Formátovanie objednávky na čitateľný HTML string pre reštauráciu (administrátorská verzia)
function formatRestaurantOrderToHtml(order: Order): string {
  // Bezpečnostná kontrola pre property items pred použitím
  const items = Array.isArray(order.items) ? order.items : [];
  
  // Výpočet celkového počtu položiek
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Typ doručenia
  let deliveryType = "Doručenie";
  if (order.deliveryAddress.toLowerCase().includes("vyzdvihnutie") || 
      order.deliveryAddress.toLowerCase().includes("osobný odber")) {
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
              <strong>${order.deliveryAddress}</strong><br>
              ${order.deliveryCity}, ${order.deliveryPostalCode}
            </td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Celková suma:</td>
            <td style="padding: 12px; border: 1px solid #ddd; font-size: 22px; font-weight: bold; color: #4a5d23;">${order.totalAmount.toFixed(2)}€</td>
          </tr>
          <tr style="background-color: #f7f7f7;">
            <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Počet položiek:</td>
            <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">${totalItemCount} ks</td>
          </tr>
        </table>
        
        <div style="margin-bottom: 25px;">
          <h2 style="color: #4a5d23; padding-bottom: 10px; border-bottom: 2px solid #4a5d23; margin-bottom: 15px;">POLOŽKY OBJEDNÁVKY</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f7f7f7;">
                <th style="text-align: left; padding: 10px; border: 1px solid #ddd; font-size: 15px;">Položka</th>
                <th style="text-align: center; padding: 10px; border: 1px solid #ddd; font-size: 15px;">Variant</th>
                <th style="text-align: center; padding: 10px; border: 1px solid #ddd; font-size: 15px;">Počet</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item: CartItem, index: number) => `
                <tr style="background-color: ${index % 2 === 0 ? '#fff' : '#f9f9f9'}">
                  <td style="padding: 12px; border: 1px solid #ddd;">
                    <div style="font-weight: bold; font-size: 16px;">${item.name}</div>
                    ${Array.isArray(item.extras) && item.extras.length > 0 ? `
                      <div style="font-size: 14px; color: #666; margin-top: 8px; padding: 5px; background-color: #f0f0f0; border-radius: 4px;">
                        <span style="font-weight: bold;">Extra:</span> ${item.extras.map((e: Extra) => e.name).join(', ')}
                      </div>
                    ` : ''}
                  </td>
                  <td style="text-align: center; padding: 12px; border: 1px solid #ddd; font-size: 14px;">${getSlovakSizeType(item.size)}</td>
                  <td style="text-align: center; padding: 12px; border: 1px solid #ddd; font-size: 18px; font-weight: bold;">${item.quantity}×</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        ${order.notes ? `
          <div style="margin: 25px 0; padding: 15px; background-color: #fff4e5; border: 1px solid #ffe0b2; border-radius: 5px;">
            <h3 style="color: #e65100; margin-top: 0; margin-bottom: 10px; font-size: 16px;">POZNÁMKA OD ZÁKAZNÍKA:</h3>
            <p style="margin: 0; font-size: 15px;">${order.notes}</p>
          </div>
        ` : ''}
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <p style="margin: 0; font-size: 14px;">Objednávka bola prijatá systémom dňa ${formatOrderTime()}</p>
        </div>
      </div>
      
      <div style="background-color: #4a5d23; color: white; padding: 15px; text-align: center; font-size: 14px; border-radius: 0 0 5px 5px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} Pizzeria Janíček - Interný systém pre správu objednávok</p>
      </div>
    </div>
  `;
}

// Odosielanie emailu so súhrnom objednávky zákazníkovi
export async function sendOrderConfirmationEmail(order: Order): Promise<boolean> {
  try {
    console.log(`[EMAIL] Začínam odosielanie potvrdzovacieho e-mailu pre objednávku #${order.id}`);
    
    // Ak zákazník nemá email, nemôžeme mu poslať potvrdenie
    if (!order.customerEmail) {
      console.log('[EMAIL] Zákazník nemá uvedený email, potvrdenie nebude odoslané');
      return false;
    }
    
    // V Replit autoscale prostredí musíme vždy znovu inicializovať transporter
    // pretože spojenie môže byť prerušené pri prechode do spiaceho režimu
    transporter = null; // Vynútime reinicializáciu
    
    // Inicializácia transportera
    let emailTransporter = await initializeEmailTransporter();
    if (!emailTransporter) {
      console.error('[EMAIL] Nemožné odoslať email: emailový transporter nebol inicializovaný, skúšam znovu...');
      
      // Druhý pokus, často pomáha v autoscale prostredí
      try {
        emailTransporter = await initializeEmailTransporter();
      } catch (retryError) {
        console.error('[EMAIL] Ani druhý pokus o inicializáciu email transportera nebol úspešný:', retryError);
      }
      
      // Ak ani druhý pokus nevyšiel, vypíšeme aspoň HTML v development prostredí
      if (!emailTransporter) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[EMAIL] HTML obsah emailu pre zákazníka:');
          console.log(formatOrderToHtml(order));
        }
        return false;
      }
    }
    
    // Pevne nastavené e-mailové adresy podľa požiadavky klienta
    const emailFrom = `"Pizzeria Janíček" <pizza.objednavka@gmail.com>`;
    // Zaistíme, že e-mail zákazníka nemá medzery
    const customerEmail = order.customerEmail ? order.customerEmail.trim() : '';
    
    console.log(`[EMAIL] Odosielam potvrdzovací email na adresu: ${customerEmail} pre objednávku #${order.id}`);
    
    // Vytvorenie textovej verzie e-mailu (bez HTML formátovania a bez čísla objednávky)
    const plainText = `
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
        `\n  Extras: ${item.extras.map((e: Extra) => `${e.name} (+${e.price.toFixed(2)}€)`).join(', ')}` : ''
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
    
    // Nastavenie emailových údajov
    const emailOptions = {
      from: emailFrom,
      to: customerEmail,
      replyTo: 'pizza.objednavka@gmail.com',  // Adresa pre odpoveď
      subject: `Potvrdenie objednávky - Pizzeria Janíček`,
      text: plainText,  // Textová verzia emailu
      html: formatOrderToHtml(order),
      dsn: {
        id: `order-${order.id}`,
        return: 'headers',
        notify: ['failure', 'delay'],
        recipient: 'pizza.objednavka@gmail.com'
      },
      headers: {
        'X-Entity-Ref-ID': `order-${order.id}`, // Unikátny identifikátor
        'X-Mailer': 'Pizzeria Janicek Order System',
        'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply',
        'List-Unsubscribe': '<mailto:pizza.objednavka@gmail.com?subject=unsubscribe>', // Možnosť odhlásenia
        'Precedence': 'bulk',
        'Feedback-ID': `order-${order.id}:pizzeria-janicek:email:objednavka`
      }
    };
    
    // Premenná na uloženie výsledku odoslania
    let mailResult;
    
    try {
      // Odoslanie emailu
      console.log('[EMAIL] Pokúšam sa odoslať email zákazníkovi...', { subject: emailOptions.subject });
      mailResult = await emailTransporter.sendMail(emailOptions);
      console.log('[EMAIL] Email pre zákazníka úspešne odoslaný:', mailResult.messageId);
      console.log('[EMAIL] Detaily:', { envelope: mailResult.envelope, accepted: mailResult.accepted, rejected: mailResult.rejected || 'žiadne' });
      console.log('[EMAIL] Potvrdenie objednávky odoslané zákazníkovi', customerEmail, 'pre objednávku #' + order.id);
    } catch (sendError) {
      console.error('[EMAIL] Chyba pri odosielaní emailu zákazníkovi:', sendError);
      throw sendError; // preposielame chybu vyššie
    }
    
    // Pre testovacie Ethereal emaily vypíšeme URL pre zobrazenie
    if (mailResult && nodemailer.getTestMessageUrl && typeof nodemailer.getTestMessageUrl === 'function') {
      try {
        const messageUrl = nodemailer.getTestMessageUrl(mailResult);
        if (messageUrl) {
          console.log('[EMAIL] URL pre zobrazenie testovacieho emailu (zákazník):', messageUrl);
        }
      } catch (err) {
        console.log('[EMAIL] Chyba pri získavaní URL pre zobrazenie testovacieho emailu:', err);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Chyba pri odosielaní emailu zákazníkovi:', error);
    return false;
  }
}

// Odosielanie emailu reštaurácii s objednávkou
export async function sendOrderNotificationToRestaurant(order: Order): Promise<boolean> {
  try {
    console.log(`[EMAIL] Začínam odosielanie notifikácie o objednávke #${order.id} do reštaurácie`);
    
    // V Replit autoscale prostredí musíme vždy znovu inicializovať transporter
    // pretože spojenie môže byť prerušené pri prechode do spiaceho režimu
    transporter = null; // Vynútime reinicializáciu
    
    // Inicializácia transportera
    let emailTransporter = await initializeEmailTransporter();
    if (!emailTransporter) {
      console.error('[EMAIL] Nemožné odoslať email reštaurácii: emailový transporter nebol inicializovaný, skúšam znovu...');
      
      // Druhý pokus, často pomáha v autoscale prostredí
      try {
        emailTransporter = await initializeEmailTransporter();
      } catch (retryError) {
        console.error('[EMAIL] Ani druhý pokus o inicializáciu email transportera pre reštauráciu nebol úspešný:', retryError);
      }
      
      // Ak ani druhý pokus nevyšiel, vypíšeme aspoň HTML v development prostredí
      if (!emailTransporter) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[EMAIL] HTML obsah emailu pre reštauráciu:');
          console.log(formatRestaurantOrderToHtml(order));
        }
        return false;
      }
    }
    
    // Pevne nastavené e-mailové adresy podľa požiadavky klienta
    const emailFrom = `"Pizzeria Janíček" <pizza.objednavka@gmail.com>`;
    const restaurantEmail = 'vlastnawebstranka@gmail.com';
    
    console.log(`[EMAIL] Odosielam notifikáciu o objednávke #${order.id} na adresu reštaurácie: ${restaurantEmail}`);
    
    // Vytvorenie textovej verzie e-mailu (bez HTML formátovania)
    const plainText = `
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
        `\n   Extra: ${item.extras.map((e: Extra) => e.name).join(', ')}` : ''
      }`
    ).join('\n') : 'Žiadne položky'}
    
    ${order.notes ? `POZNÁMKA OD ZÁKAZNÍKA:\n${order.notes}` : ''}
    `;

    // Nastavenie emailových údajov
    const emailOptions = {
      from: emailFrom,
      to: restaurantEmail,
      replyTo: order.customerEmail || 'pizza.objednavka@gmail.com',  // Adresa pre odpoveď
      subject: `⭐ NOVÁ OBJEDNÁVKA #${order.id} - ${order.customerName}`,
      text: plainText,  // Textová verzia emailu
      html: formatRestaurantOrderToHtml(order),
      priority: "high" as "high",  // Nastavenie vysokej priority
      dsn: {
        id: `order-restaurant-${order.id}`,
        return: 'headers',
        notify: ['failure', 'delay'],
        recipient: 'pizza.objednavka@gmail.com'
      },
      headers: {
        'X-Entity-Ref-ID': `order-restaurant-${order.id}`, // Unikátny identifikátor
        'X-Priority': '1',  // Priorita (1=vysoká)
        'X-MSMail-Priority': 'High',
        'X-Mailer': 'Pizzeria Janicek Order System',
        'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply',
        'Importance': 'high',
        'Precedence': 'urgent',
        'Feedback-ID': `order-restaurant-${order.id}:pizzeria-janicek:email:objednavka`
      }
    };
    
    // Premenná na uloženie výsledku odoslania
    let mailResult;
    
    try {
      // Odoslanie emailu
      console.log('[EMAIL] Pokúšam sa odoslať email reštaurácii...', { subject: emailOptions.subject });
      mailResult = await emailTransporter.sendMail(emailOptions);
      console.log('[EMAIL] Email pre reštauráciu úspešne odoslaný:', mailResult.messageId);
      console.log('[EMAIL] Detaily:', { envelope: mailResult.envelope, accepted: mailResult.accepted, rejected: mailResult.rejected || 'žiadne' });
      console.log('[EMAIL] Notifikácia o objednávke #' + order.id + ' bola odoslaná reštaurácii na adresu ' + restaurantEmail);
    } catch (sendError) {
      console.error('[EMAIL] Chyba pri odosielaní emailu reštaurácii:', sendError);
      throw sendError; // preposielame chybu vyššie
    }
    
    // Pre testovacie Ethereal emaily vypíšeme URL pre zobrazenie
    if (mailResult && nodemailer.getTestMessageUrl && typeof nodemailer.getTestMessageUrl === 'function') {
      try {
        const messageUrl = nodemailer.getTestMessageUrl(mailResult);
        if (messageUrl) {
          console.log('[EMAIL] URL pre zobrazenie testovacieho emailu (reštaurácia):', messageUrl);
        }
      } catch (err) {
        console.log('[EMAIL] Chyba pri získavaní URL pre zobrazenie testovacieho emailu:', err);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Chyba pri odosielaní emailu reštaurácii:', error);
    return false;
  }
}