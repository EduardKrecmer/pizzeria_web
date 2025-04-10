// Špeciálny serverless handler pre odosielanie emailov v režime Replit autoscale
const nodemailer = require('nodemailer');
require('dotenv').config();

async function createEmailTransporter() {
  // Logging pre diagnostiku
  console.log('SERVERLESS: Inicializujem email transporter...');
  
  try {
    // Odstránime medzery na začiatku a konci
    const emailHost = process.env.EMAIL_HOST ? process.env.EMAIL_HOST.trim() : null;
    const emailUser = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : null;
    const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : null;
    
    if (!emailHost || !emailUser || !emailPass) {
      console.error('SERVERLESS: Chýbajú emailové údaje (host, user, alebo pass)');
      return null;
    }
    
    // Zistíme, či ide o Gmail
    const isGmail = emailHost.includes('gmail');
    
    // Logujeme konfiguráciu (bez hesla)
    console.log(`SERVERLESS: Email config - host: "${emailHost}", user: "${emailUser}", isGmail: ${isGmail}`);
    
    // Vytvoriť transporter s reálnymi údajmi pre serverless prostredie
    const transportConfig = {
      host: emailHost,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      // Optimalizácia pre serverless prostredie
      pool: false,         // Vypneme pooling, ktorý nie je vhodný pre serverless
      maxConnections: 1,   // Obmedzíme na jedno pripojenie
      socketTimeout: 10000, // 10s timeout pre socket operácie - znížený pre rýchlejšie zlyhanie
      connectionTimeout: 10000, // 10s timeout pre pripojenie - znížený pre rýchlejšie zlyhanie
      // Lepšia odolnosť voči výpadkom
      tls: {
        rejectUnauthorized: false,  // Nebude zlyhávať pri problémoch s certifikátom
        minVersion: 'TLSv1.2'       // Minimálne TLS 1.2 pre vyššiu bezpečnosť
      },
      logger: false,                // V produkčnom prostredí vypneme debug logy
      debug: false                  // V produkčnom prostredí vypneme debug logy
    };
  
    // Pre Gmail potrebujeme dodatočné nastavenia
    if (isGmail) {
      console.log('SERVERLESS: Používam Gmail SMTP server s dodatočnými nastaveniami');
      
      // Upresnené nastavenia pre Gmail
      transportConfig.service = 'gmail';
      transportConfig.host = 'smtp.gmail.com';
      transportConfig.port = 465; // Force port 465 for Gmail SSL
      transportConfig.secure = true; // Force SSL for Gmail
      
      // Pre Gmail dodatočne nastavíme XOAuth2 flag pre lepšiu podporu
      transportConfig.authMethod = 'LOGIN';
    }
    
    // Pridáme detailný JSON-friendly výpis konfigurácie pre diagnostiku (bez hesla)
    console.log(`Gmail transport config:`, {
      ...transportConfig,
      auth: { user: transportConfig.auth.user, pass: '***' }
    });
    
    // Vytvorenie transportera
    const transporter = nodemailer.createTransport(transportConfig);
    console.log('SERVERLESS: Email transporter vytvorený');
    
    // Overenie transportera s timeoutom pre prípad, že by verify trvalo pridlho
    try {
      const verifyPromise = transporter.verify();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('SMTP verification timeout')), 5000)
      );
      
      await Promise.race([verifyPromise, timeoutPromise]);
      console.log('SERVERLESS: Email transporter overený úspešne');
    } catch (verifyError) {
      console.error('SERVERLESS: Varovanie - Nepodarilo sa overiť transporter, ale pokračujem:', verifyError.message);
      // Pokračujeme aj keď sa verify nepodarí - môže to byť dočasný problém
    }
    
    return transporter;
  } catch (error) {
    console.error('SERVERLESS: Kritická chyba pri vytváraní email transportera:', error);
    return null;
  }
}

// Pomocná funkcia pre odoslanie emailu s viacerými pokusmi
async function sendEmailWithRetry(options, transporterFactory, maxRetries = 3) {
  let lastError = null;
  let attempt = 0;
  
  // Generovanie unikátneho identifikátora tejto try-retry sekvencie pre lepšie logovanie
  const retryId = Math.random().toString(36).substring(2, 8);
  console.log(`SERVERLESS-RETRY-${retryId}: Začínam odosielanie emailu s ${maxRetries} pokusmi`);
  
  while (attempt < maxRetries) {
    try {
      attempt++;
      console.log(`SERVERLESS-RETRY-${retryId}: Pokus #${attempt} o odoslanie emailu`);
      
      // Pre každý pokus vytvoríme nový transporter
      const transporter = await transporterFactory();
      
      if (!transporter) {
        console.error(`SERVERLESS-RETRY-${retryId}: Nepodarilo sa vytvoriť transporter pri pokuse #${attempt}`);
        // Čakáme dlhšie pred ďalším pokusom, lebo vytvorenie transportera zlyhalo
        lastError = new Error('Failed to create email transporter');
        
        if (attempt < maxRetries) {
          // Exponenciálne čakanie: 2s, 4s, 8s...
          const delayMs = Math.pow(2, attempt) * 1000; 
          console.log(`SERVERLESS-RETRY-${retryId}: Čakám ${delayMs}ms pred pokusom #${attempt + 1}`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
        throw lastError;
      }
      
      // Zabalíme odoslanie emailu v Promise.race s timeoutom
      const sendPromise = transporter.sendMail(options);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email sending timeout')), 15000) // 15s timeout
      );
      
      const info = await Promise.race([sendPromise, timeoutPromise]);
      
      console.log(`SERVERLESS-RETRY-${retryId}: Email úspešne odoslaný pri pokuse #${attempt}: ${info.messageId}`);
      return { 
        success: true, 
        messageId: info.messageId, 
        info: {
          accepted: info.accepted,
          rejected: info.rejected || [],
          attempts: attempt
        }
      };
    } catch (error) {
      lastError = error;
      console.error(`SERVERLESS-RETRY-${retryId}: Pokus #${attempt} zlyhal:`, error.message);
      
      if (attempt < maxRetries) {
        // Exponenciálne čakanie so šumom (jitter) pre zníženie zaťaženia pri zlyhaniach
        const baseDelay = Math.pow(2, attempt) * 1000; 
        const jitter = Math.random() * 1000;
        const delayMs = baseDelay + jitter;
        
        console.log(`SERVERLESS-RETRY-${retryId}: Čakám ${delayMs}ms pred pokusom #${attempt + 1}`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  // Ak sme sa dostali sem, všetky pokusy zlyhali
  console.error(`SERVERLESS-RETRY-${retryId}: Všetky ${maxRetries} pokusy zlyhali, vzdávam to.`);
  return { 
    success: false, 
    message: lastError ? lastError.message : 'Unknown error during email sending',
    attempts: attempt
  };
}

// Funkcia pre odoslanie emailu zákazníkovi
async function sendCustomerEmail(emailData) {
  const { customerEmail, orderHtml, orderText, orderId } = emailData;
  
  try {
    if (!customerEmail) {
      console.log('SERVERLESS: Email zákazníka nie je k dispozícii, preskakujem odoslanie');
      return { success: false, message: 'Customer email missing' };
    }
    
    console.log(`SERVERLESS: Odosielam zákaznícky email pre objednávku ${orderId} na adresu ${customerEmail}`);
    
    // Nastavenie emailových údajov
    const emailOptions = {
      from: `"Pizzeria Janíček" <${process.env.EMAIL_USER || 'pizza.objednavka@gmail.com'}>`,
      to: customerEmail.trim(),
      replyTo: 'pizza.objednavka@gmail.com',
      subject: `Potvrdenie objednávky - Pizzeria Janíček`,
      text: orderText,
      html: orderHtml,
      priority: "high",
      headers: {
        'X-Entity-Ref-ID': `order-${orderId}`,
        'X-Mailer': 'Pizzeria Janicek Serverless',
        'X-Priority': '1',
        'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply',
        'Precedence': 'bulk',
        'Feedback-ID': `order-${orderId}:pizzeria-janicek:serverless:objednavka`
      }
    };
    
    // Odoslanie emailu s automatickými retry pokusmi
    return await sendEmailWithRetry(
      emailOptions, 
      createEmailTransporter,
      3 // max 3 pokusy
    );
  } catch (error) {
    console.error(`SERVERLESS: Kritická chyba pri odosielaní emailu zákazníkovi:`, error);
    return { success: false, message: error.message };
  }
}

// Funkcia pre odoslanie emailu reštaurácii
async function sendRestaurantEmail(emailData) {
  const { orderHtml, orderText, orderId, customerEmail, customerName } = emailData;
  
  try {
    const restaurantEmail = process.env.RESTAURANT_EMAIL || 'vlastnawebstranka@gmail.com';
    console.log(`SERVERLESS: Odosielam email reštaurácii (${restaurantEmail}) pre objednávku ${orderId}`);
    
    // Nastavenie emailových údajov
    const emailOptions = {
      from: `"Pizzeria Janíček" <${process.env.EMAIL_USER || 'pizza.objednavka@gmail.com'}>`,
      to: restaurantEmail,
      replyTo: customerEmail || 'pizza.objednavka@gmail.com',
      subject: `⭐ NOVÁ OBJEDNÁVKA #${orderId} - ${customerName}`,
      text: orderText,
      html: orderHtml,
      priority: "high",
      headers: {
        'X-Entity-Ref-ID': `order-restaurant-${orderId}`,
        'X-Mailer': 'Pizzeria Janicek Serverless',
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply',
        'Precedence': 'urgent'
      }
    };
    
    // Odoslanie emailu s automatickými retry pokusmi
    // U reštaurácie skúšame viac pokusov (5), pretože tieto emaily sú pre prevádzku kritické
    return await sendEmailWithRetry(
      emailOptions, 
      createEmailTransporter,
      5 // max 5 pokusov pre reštauračný email
    );
  } catch (error) {
    console.error(`SERVERLESS: Kritická chyba pri odosielaní emailu reštaurácii:`, error);
    return { success: false, message: error.message };
  }
}

// Handler pre testovacie emaily - už využíva retry mechanizmus
async function handleTestEmail(req, res) {
  try {
    const email = req.query.email || process.env.EMAIL_USER;
    console.log(`SERVERLESS: Testovanie odosielania emailu na ${email}`);
    
    // Diagnostické údaje pre lepšie pochopenie problémov
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      hostname: req.hostname || 'unknown',
      headers: {
        host: req.get('host') || 'unknown',
        origin: req.get('origin') || 'unknown',
        userAgent: req.get('user-agent') || 'unknown'
      },
      emailConfig: {
        host: process.env.EMAIL_HOST ? `${process.env.EMAIL_HOST.substring(0, 3)}...` : 'missing',
        user: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}...` : 'missing',
        hasPassword: !!process.env.EMAIL_PASS,
        port: process.env.EMAIL_PORT || '587',
        secure: process.env.EMAIL_SECURE || 'false'
      }
    };
    
    // Vytvorenie HTML pre testovacie emaily s rozšírenými údajmi
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #4a5d23; padding: 15px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">SERVERLESS TEST - Overenie SMTP konfigurácie</h1>
          <p style="color: #f0f0f0; margin: 5px 0 0 0; font-size: 16px;">Tento email bol odoslaný zo serverless funkcie Replit</p>
        </div>
        
        <div style="padding: 25px; background-color: #fcfcfc; border-left: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">
          <p style="margin-bottom: 20px;">Ahoj, toto je testovacia správa odoslaná cez serverless funkcionalitu.</p>
          
          <p>Tento email potvrdzuje, že:</p>
          <ul>
            <li>Vaša SMTP konfigurácia funguje správne v serverless režime</li>
            <li>Odosielanie emailov je možné zo serverless API funkcie</li>
            <li>Vaše prostredie (${diagnostics.environment}) je správne nastavené</li>
            <li>Gmail prijíma emaily z Replit servera</li>
          </ul>
          
          <p style="background-color: #f8f8f8; padding: 15px; border-left: 4px solid #4a5d23;">
            <strong>Čas testu:</strong> ${new Date().toLocaleString('sk-SK')}<br>
            <strong>Hostname:</strong> ${diagnostics.hostname}<br>
            <strong>Origin:</strong> ${diagnostics.headers.origin}<br>
            <strong>Email odosielateľa:</strong> ${process.env.EMAIL_USER || 'pizza.objednavka@gmail.com'}<br>
            <strong>Režim:</strong> ${diagnostics.environment}
          </p>
        </div>
        
        <div style="background-color: #4a5d23; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
          <p style="margin: 0; font-size: 16px;">Pizzeria Janíček - Testovanie SMTP</p>
          <p style="margin: 10px 0 0 0; font-size: 14px;">© ${new Date().getFullYear()} Pizzeria Janíček, Púchov</p>
        </div>
      </div>
    `;
    
    // Použitie našej vylepšenej funkcie s retry a timeout ochranou
    const emailOptions = {
      from: `"Pizzeria Janíček" <${process.env.EMAIL_USER || 'pizza.objednavka@gmail.com'}>`,
      to: email,
      subject: `SERVERLESS TEST - Pizzeria Janíček [${diagnostics.environment}]`,
      html: htmlContent,
      headers: {
        'X-Entity-Ref-ID': `test-email-${Date.now()}`,
        'X-Mailer': 'Pizzeria Janicek Serverless Test',
        'X-Priority': '1',
        'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply'
      }
    };
    
    const result = await sendEmailWithRetry(
      emailOptions,
      createEmailTransporter,
      3 // max 3 pokusy pre testovací email
    );
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: `Email bol úspešne odoslaný na adresu ${email} z serverless funkcie`,
        messageId: result.messageId,
        attempts: result.info.attempts,
        diagnostics: diagnostics
      });
    } else {
      // Aj pri neúspechu vrátime HTTP 200, ale s flag-om success: false
      // To nám umožní lepšie testovanie v produkčnom prostredí
      res.json({ 
        success: false, 
        message: `Nepodarilo sa odoslať email na adresu ${email}`,
        error: result.message,
        attempts: result.attempts,
        diagnostics: diagnostics
      });
    }
  } catch (error) {
    console.error('SERVERLESS: Kritická chyba pri odosielaní testovacieho emailu:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Kritická chyba pri odosielaní testovacieho emailu',
      error: error.message
    });
  }
}

// Export funkcií
module.exports = {
  sendCustomerEmail,
  sendRestaurantEmail,
  handleTestEmail
};