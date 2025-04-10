# Nastavenie emailovej komunikácie pre Pizzeria Web

Tento dokument popisuje potrebné nastavenia pre správne fungovanie emailovej komunikácie v aplikácii Pizzeria Web.

## Konfigurácia Gmail účtu

Aplikácia je nakonfigurovaná na posielanie emailov pomocou SMTP servera Gmailu. Pre správne fungovanie je potrebné nastaviť:

### 1. Povolenie prístupu pre menej bezpečné aplikácie

Pre Gmail účet `pizza.objednavka@gmail.com` je potrebné:

1. Prihlásiť sa do Gmail účtu
2. Otvoriť [nastavenia Google účtu](https://myaccount.google.com/)
3. Ísť do sekcie "Security" (Zabezpečenie)
4. Zapnúť "Less secure app access" (Prístup menej zabezpečených aplikácií)

**Alternatívne (odporúčané):**

Vytvorte heslo pre aplikáciu:
1. Zapnite dvojfaktorovú autentifikáciu
2. Navštívte [App passwords](https://myaccount.google.com/apppasswords)
3. Vyberte "Mail" a "Other" (zadajte meno "Pizzeria Web")
4. Skopírujte vygenerované heslo - toto použijete ako `EMAIL_PASS` v nastaveniach Vercel

### 2. Nastavenie hesla v Vercel

1. V Vercel dashboarde prejdite na nastavenia projektu
2. Vyberte záložku "Environment Variables"
3. Pridajte novú premennú:
   - **Názov**: `EMAIL_PASS`
   - **Hodnota**: heslo k účtu alebo vygenerované heslo pre aplikáciu

## Testovanie emailovej komunikácie

Pre otestovanie emailovej komunikácie:

1. Nasaďte aplikáciu na Vercel
2. Vytvorte testovaciu objednávku
3. Pri objednávke zadajte vašu emailovú adresu
4. Skontrolujte, či vám prišiel potvrdzovací email
5. Skontrolujte, či prišlo oznámenie reštaurácii na adresu `vlastnawebstranka@gmail.com`

## Diagnostika problémov

Ak emaily neprichádzajú:

1. Skontrolujte hodnotu premennej `EMAIL_PASS` v Vercel nastaveniach
2. Overte, či účet `pizza.objednavka@gmail.com` má správne nastavenia zabezpečenia
3. Skontrolujte, či objednávka bola správne spracovaná (mala by sa objaviť potvrdzovacia obrazovka)
4. Skontrolujte, či zadaný email v objednávke je správny

## Alternatívni poskytovatelia emailových služieb

V prípade problémov s Gmailom je možné zmeniť nastavenia na iného poskytovateľa:

### SendGrid

1. Vytvorte si účet na [SendGrid](https://sendgrid.com/)
2. Získajte API kľúč
3. Upravte `vercel.json`:
   ```json
   "env": {
     "EMAIL_HOST": "smtp.sendgrid.net",
     "EMAIL_PORT": "587",
     "EMAIL_SECURE": "false",
     "EMAIL_USER": "apikey",
     "EMAIL_PASS": "VAS_SENDGRID_API_KLUC",
     "EMAIL_FROM": "Pizzeria Janíček <pizza.objednavka@gmail.com>",
     "RESTAURANT_EMAIL": "vlastnawebstranka@gmail.com"
   }
   ```

### SMTP.js (alternatíva pre serverless prostredie)

Pre prípad, že máte problémy s SMTP v serverless prostredí, je možné zvážiť použitie SMTP.js:

1. Upraviť frontend na odosielanie emailov priamo cez SMTP.js
2. Pre tento prístup by bolo potrebné upraviť kód v `orders-vercel.js`