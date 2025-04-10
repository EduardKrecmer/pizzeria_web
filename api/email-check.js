// Samostatný endpoint pre emailovú diagnostiku
import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

// CORS pre všetky požiadavky
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Kontrola emailovej konfigurácie
app.get('/email-check', async (req, res) => {
  const results = {
    environmentCheck: {},
    transporterTest: null,
    verificationTest: null,
    recommendations: []
  };

  // Kontrola premenných prostredia
  const requiredVars = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_PORT', 'EMAIL_SECURE', 'EMAIL_FROM'];
  const envStatus = {};
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    envStatus[varName] = {
      exists: !!value,
      // Pre bezpečnosť zobrazíme len prvé 3 znaky + dĺžku pre heslo
      value: varName === 'EMAIL_PASS' 
        ? (value ? `${value.substring(0, 3)}...${value.length} chars` : 'missing') 
        : (value || 'missing')
    };
  });
  
  results.environmentCheck = envStatus;
  
  // Kontrola, či môžeme vytvoriť transporter
  try {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      results.transporterTest = {
        success: false,
        error: 'Chýbajú povinné premenné prostredia pre email'
      };
      results.recommendations.push(
        'Skontrolujte, či sú v produkčnom prostredí nastavené premenné EMAIL_HOST, EMAIL_USER a EMAIL_PASS'
      );
    } else {
      // Základná konfigurácia transportera
      const transportConfig = {
        host: process.env.EMAIL_HOST.trim(),
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER.trim(),
          pass: process.env.EMAIL_PASS.trim(),
        },
        connectionTimeout: 10000, // 10s timeout
        socketTimeout: 10000     // 10s timeout
      };

      // Pre Gmail špecifické nastavenia
      if (process.env.EMAIL_HOST.includes('gmail')) {
        transportConfig.service = 'gmail';
        transportConfig.secure = true;
        transportConfig.port = 465;
        transportConfig.tls = {
          rejectUnauthorized: false
        };
        results.recommendations.push(
          'Gmail môže blokovať prístup z produkčného prostredia. Zvážte použitie aplikačného hesla alebo povolenie "Menej bezpečných aplikácií".'
        );
      }

      results.transporterTest = {
        success: true,
        config: { ...transportConfig, auth: { user: transportConfig.auth.user, pass: "***" } }
      };

      // Skúsime verifikovať spojenie
      const transporter = nodemailer.createTransport(transportConfig);
      
      try {
        const verifyResult = await transporter.verify();
        results.verificationTest = {
          success: true,
          message: 'SMTP spojenie bolo úspešne overené'
        };
      } catch (verifyError) {
        results.verificationTest = {
          success: false,
          error: String(verifyError),
          message: 'Nepodarilo sa overiť SMTP spojenie'
        };
        
        results.recommendations.push(
          'Replit môže blokovať SMTP porty v produkčnom prostredí. Zvážte použitie API-based služby ako SendGrid alebo Mailgun.'
        );
      }
    }
  } catch (error) {
    results.transporterTest = {
      success: false,
      error: String(error),
      message: 'Nepodarilo sa vytvoriť transporter'
    };
  }
  
  // Systémové informácie
  results.systemInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  };

  res.json(results);
});

// Odoslanie testovacieho emailu
app.get('/send-test-email', async (req, res) => {
  try {
    const email = req.query.email || process.env.EMAIL_USER;
    console.log(`Testovanie odosielania emailu na ${email}`);
    
    // Vytvorenie transportera
    const transportConfig = {
      host: process.env.EMAIL_HOST.trim(),
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER.trim(),
        pass: process.env.EMAIL_PASS.trim(),
      },
      connectionTimeout: 10000,
      socketTimeout: 10000
    };

    // Pre Gmail špecifické nastavenia
    if (process.env.EMAIL_HOST.includes('gmail')) {
      transportConfig.service = 'gmail';
      transportConfig.secure = true;
      transportConfig.port = 465;
      transportConfig.tls = {
        rejectUnauthorized: false
      };
    }
    
    const transporter = nodemailer.createTransport(transportConfig);
    
    // Vytvorenie HTML pre testovací email
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #4a5d23; padding: 15px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">TEST - Overenie SMTP konfigurácie</h1>
          <p style="color: #f0f0f0; margin: 5px 0 0 0; font-size: 16px;">Tento email bol odoslaný z Replit diagnostického nástroja</p>
        </div>
        
        <div style="padding: 25px; background-color: #fcfcfc; border-left: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">
          <p style="margin-bottom: 20px;">Ahoj, toto je testovacia správa odoslaná cez SMTP.</p>
          
          <p>Tento email potvrdzuje, že:</p>
          <ul>
            <li>Vaša SMTP konfigurácia funguje správne</li>
            <li>Odosielanie emailov je možné</li>
            <li>Všetky emailové premenné prostredia sú správne nastavené</li>
          </ul>
          
          <p style="background-color: #f8f8f8; padding: 15px; border-left: 4px solid #4a5d23;">
            <strong>Čas testu:</strong> ${new Date().toLocaleString('sk-SK')}<br>
            <strong>Testovací server:</strong> Replit<br>
            <strong>Email odosielateľa:</strong> ${process.env.EMAIL_USER || 'pizza.objednavka@gmail.com'}
          </p>
        </div>
        
        <div style="background-color: #4a5d23; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
          <p style="margin: 0; font-size: 16px;">Pizzeria Janíček - Testovanie SMTP</p>
          <p style="margin: 10px 0 0 0; font-size: 14px;">© ${new Date().getFullYear()} Pizzeria Janíček, Púchov</p>
        </div>
      </div>
    `;
    
    // Odoslanie testovacieho emailu
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Pizzeria Janíček" <${process.env.EMAIL_USER || 'pizza.objednavka@gmail.com'}>`,
      to: email,
      subject: "TEST - Pizzeria Janíček SMTP",
      html: htmlContent
    });
    
    res.json({ 
      success: true, 
      message: `Email bol úspešne odoslaný na adresu ${email}`,
      messageId: info.messageId,
      response: info.response
    });
  } catch (error) {
    console.error('Chyba pri odosielaní testovacieho emailu:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Nepodarilo sa odoslať testovací email',
      error: error.message,
      stack: error.stack
    });
  }
});

// Prehľad API
app.get('/', (req, res) => {
  res.json({
    name: "Email Diagnostic API",
    version: "1.0",
    endpoints: [
      {
        path: "/email-check",
        description: "Kontrola emailovej konfigurácie a SMTP spojenia"
      },
      {
        path: "/send-test-email",
        description: "Odoslanie testovacieho emailu",
        query: { email: "voliteľná emailová adresa príjemcu" }
      }
    ]
  });
});

// Spustenie servera
const PORT = process.env.PORT || 3456;
app.listen(PORT, () => {
  console.log(`Email Diagnostic API beží na porte ${PORT}`);
});

// Export pre použitie s ES modules
export default app;