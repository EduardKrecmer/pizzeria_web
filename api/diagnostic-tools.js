// Diagnostické nástroje pre riešenie problémov s emailmi v produkčnom prostredí
const nodemailer = require('nodemailer');
require('dotenv').config();

// Funkcia pre detailnú kontrolu konfigurácie emailu
async function checkEmailConfiguration(req, res) {
  // Explicitne nastavíme hlavičku na JSON, aby Vite neprevzalo kontrolu
  res.setHeader('Content-Type', 'application/json');
  
  const results = {
    environmentCheck: {},
    transporterTest: null,
    verificationTest: null,
    sendTestResult: null,
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

      // Skúsme odoslať testovací email, ak bola verifikácia úspešná
      if (results.verificationTest && results.verificationTest.success) {
        const testEmailTo = req.query.email || process.env.EMAIL_USER;
        
        try {
          const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: testEmailTo,
            subject: "Diagnostický test emailu z aplikácie",
            text: `Toto je testovací email z diagnostického nástroja.
            
Detaily testu:
- Časová pečiatka: ${new Date().toISOString()}
- ID požiadavky: ${req.id || 'unknown'}
- Prostredie: ${process.env.NODE_ENV || 'development'}
- Hostname: ${req.hostname || 'unknown'}

Ak vidíte tento email, konfigurácia SMTP je funkčná.`,
            html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4a5d23;">Diagnostický test emailu</h2>
              <p>Toto je testovací email z diagnostického nástroja.</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #4a5d23;">
                <h3>Detaily testu:</h3>
                <ul>
                  <li><strong>Časová pečiatka:</strong> ${new Date().toISOString()}</li>
                  <li><strong>ID požiadavky:</strong> ${req.id || 'unknown'}</li>
                  <li><strong>Prostredie:</strong> ${process.env.NODE_ENV || 'development'}</li>
                  <li><strong>Hostname:</strong> ${req.hostname || 'unknown'}</li>
                </ul>
              </div>
              <p style="color: #4a5d23; font-weight: bold;">Ak vidíte tento email, konfigurácia SMTP je funkčná.</p>
            </div>`
          });
          
          results.sendTestResult = {
            success: true,
            messageId: info.messageId,
            recipient: testEmailTo,
            response: info.response,
            accepted: info.accepted,
            rejected: info.rejected
          };
        } catch (sendError) {
          results.sendTestResult = {
            success: false,
            error: String(sendError),
            message: 'Nepodarilo sa odoslať testovací email'
          };
          
          if (sendError.message.includes('authenticate')) {
            results.recommendations.push(
              'Chyba autentifikácie. Skontrolujte, či sú prihlasovacie údaje správne. Pre Gmail použite aplikačné heslo.'
            );
          } else if (sendError.message.includes('timeout')) {
            results.recommendations.push(
              'Spojenie vypršalo. Je možné, že Replit blokuje výstupný SMTP port.'
            );
          }
        }
      }
    }
  } catch (error) {
    results.transporterTest = {
      success: false,
      error: String(error),
      message: 'Nepodarilo sa vytvoriť transporter'
    };
  }
  
  // Celkové odporúčania
  if (results.recommendations.length === 0) {
    if (results.sendTestResult && results.sendTestResult.success) {
      results.recommendations.push('Všetko vyzerá v poriadku. Email funguje správne.');
    } else {
      results.recommendations.push(
        'Zvážte použitie API-based emailovej služby namiesto priameho SMTP pripojenia.'
      );
    }
  }

  // Systémové informácie
  results.systemInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    hostname: req.hostname || 'unknown',
    headers: {
      host: req.get('host') || 'unknown',
      origin: req.get('origin') || 'unknown',
      userAgent: req.get('user-agent') || 'unknown'
    }
  };

  res.json(results);
}

// Otestuje použitie serverless-friendly REST API emailovej služby
function testHttpEmailService(req, res) {
  // Explicitne nastavíme hlavičku na JSON, aby Vite neprevzalo kontrolu
  res.setHeader('Content-Type', 'application/json');
  
  res.json({
    message: 'Funkcia pre testovanie HTTP email služby nie je implementovaná',
    recommendation: 'Implementujte integráciu so SendGrid, Mailgun, alebo AWS SES'
  });
}

// Náhľad API pre konfiguráciu
function getAPIConfig(req, res) {
  // Explicitne nastavíme hlavičku na JSON, aby Vite neprevzalo kontrolu
  res.setHeader('Content-Type', 'application/json');
  
  const apiEndpoints = [
    {
      path: '/api/diagnostic/email-config',
      method: 'GET',
      description: 'Kontrola konfigurácie emailu a testovanie spojenia',
      query: { email: 'voliteľná testovacia emailová adresa' }
    },
    {
      path: '/api/diagnostic/test-http-email',
      method: 'GET',
      description: 'Test pre HTTP-based email služby (SendGrid, Mailgun, atď.)'
    },
    {
      path: '/api/orders',
      method: 'POST',
      description: 'Hlavný endpoint pre vytvorenie objednávky s odoslaním emailov',
      body: 'Údaje objednávky (pozri dokumentáciu)'
    }
  ];
  
  res.json({
    version: '1.0',
    description: 'Diagnostické API pre riešenie problémov s emailmi',
    endpoints: apiEndpoints,
    deployment: {
      email_suggestion: 'Pre produkčné prostredie odporúčame použiť HTTP-based emailovú službu',
      documentation_link: 'https://docs.sendgrid.com/for-developers/sending-email/quickstart-nodejs'
    }
  });
}

// Exportované funkcie
module.exports = {
  checkEmailConfiguration,
  testHttpEmailService,
  getAPIConfig
};