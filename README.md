<<<<<<< HEAD
# Pizzeria Janíček - Online objednávková aplikácia
=======
# Pizzeria - Webová Aplikácia
>>>>>>> 473b9c6937b94de045de13ff857756db56f38d70

![Pizzeria logo](generated-icon.png)

Moderná webová aplikácia pre pizzeriu umožňujúca objednávanie jedál online. Táto aplikácia je navrhnutá pre miestnu pizzeriu so zameraním na jednoduchosť používania a plne responzívny dizajn. Aplikácia umožňuje zákazníkom prezerať menu, prispôsobovať si pizze, pridávať položky do košíka a odosielať objednávky.

## 🍕 Funkcie

- **Prezeranie menu** - kompletný zoznam pizz s obrázkami, popismi a cenami
- **Filtrovanie a vyhľadávanie** - možnosť filtrovať podľa kategórií a vyhľadávať pizze
- **Prispôsobenie pizze** - možnosť pridať/odobrať prísady a vybrať si veľkosť
- **Nákupný košík** - pridávanie, úprava množstva a odstraňovanie položiek
- **Objednávací formulár** - jednoduchý formulár pre odoslanie objednávky s kontrolou údajov
- **E-mailové notifikácie** - automatické potvrdenia objednávok pre zákazníkov a notifikácie pre reštauráciu
- **Responzívny dizajn** - optimalizované pre mobilné zariadenia, tablety aj desktopy

## 🛠️ Technologický stack

### Frontend
- **React** - s TypeScript pre typovú bezpečnosť
- **TailwindCSS** - pre moderný, responzívny vzhľad
- **Zustand** - pre stav aplikácie a manažment košíka
- **Wouter** - jednoduchá, ľahká knižnica pre routing
- **React Hook Form** - pre správu formulárov a validáciu
- **Framer Motion** - pre plynulé animácie a prechody

### Backend
- **Express.js** - pre API endpointy a serverovú logiku
- **Nodemailer** - pre odosielanie potvrdení a notifikácii emailom
- **PostgreSQL** - pre ukladanie objednávok (voliteľne)
- **Drizzle ORM** - pre typovo bezpečný prístup k databáze

### Nasadenie
- **Vercel** - pre serverless nasadenie produkčnej verzie
- **Replit** - pre vývoj a testovanie

## 🚀 Inštalácia a spustenie

### Predpoklady
- Node.js v18+ 
- npm alebo pnpm
- PostgreSQL databáza (voliteľné)

### Postup inštalácie

1. Klonovanie repozitára
   ```bash
   git clone https://github.com/vasusername/pizzeria-web.git
   cd pizzeria-web
   ```

2. Inštalácia závislostí
   ```bash
   npm install
   ```

3. Konfigurácia premenných prostredia
   Vytvorte `.env` súbor podľa vzoru `.env.example`:
   ```
   # Email
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=465
   EMAIL_SECURE=true
   EMAIL_USER=pizza.objednavka@gmail.com
   EMAIL_PASS=vaseheslo
   EMAIL_FROM="Pizzeria Janíček <pizza.objednavka@gmail.com>"
   
   # Databáza (voliteľné)
   DATABASE_URL=postgres://user:password@localhost:5432/pizzeria
   ```

4. Spustenie vývojového servera
   ```bash
   npm run dev
   ```
   Aplikácia bude dostupná na http://localhost:5173

## 🔧 Nasadenie

### Nasadenie na Vercel

Projekt je pripravený na nasadenie na platforme Vercel viacerými spôsobmi:

#### Nová metóda (Odporúčané): Pomocou vercel-deploy.sh

Tento prístup obchádza problémy s Replit závislosťami vytvorením čistého adresára pre nasadenie:

1. Spustite skript pre prípravu:
   ```bash
   chmod +x vercel-deploy.sh
   ./vercel-deploy.sh
   ```
   
   Skript vytvorí adresár `vercel-deployment` obsahujúci len potrebné súbory.

2. Nasaďte vytvorenú verziu:
   ```bash
   cd vercel-deployment
   vercel login
   vercel --prod
   ```

3. Alebo nahrajte adresár `vercel-deployment` na GitHub a importujte ho na Vercel.com

4. Na Vercel.com nastavte environment premennú:
   - `EMAIL_PASS` = heslo pre email pizza.objednavka@gmail.com

#### Metóda 1: Cez GitHub (Odporúčané)

1. Automatická príprava projektu jedným príkazom:
   ```bash
   ./deploy-to-vercel.sh
   ```
   Skript overí všetky potrebné súbory a pripraví projekt pre nasadenie.

2. Vytvorte GitHub repozitár a nahrajte kód:
   ```bash
   git init
   git add .
   git commit -m "Príprava pre Vercel nasadenie"
   git remote add origin https://github.com/vasusername/pizzeria-web.git
   git push -u origin main
   ```

3. Na Vercel.com:
   - Importujte repozitár (New Project → Import Git Repository)
   - V nastaveniach projektu pridajte environment premennú `EMAIL_PASS` s heslom pre email
   - Nasadenie sa spustí automaticky

#### Metóda 2: Cez Vercel CLI

1. Nainštalujte Vercel CLI globálne:
   ```bash
   npm install -g vercel
   ```

2. Pripravte projekt:
   ```bash
   ./deploy-to-vercel.sh
   ```

3. Nasaďte projekt:
   ```bash
   vercel login
   vercel --prod
   ```
   
4. Nastavte secrets po nasadení:
   ```bash
   vercel env add EMAIL_PASS
   ```

### Po nasadení

1. Overte, že API endpointy fungujú:
   - `https://vasa-domena.vercel.app/api/pizzas`
   - `https://vasa-domena.vercel.app/api/extras`
   - `https://vasa-domena.vercel.app/api/orders`

2. Otestujte celý objednávkový proces, vrátane odosielania emailov.

Podrobný návod s kontrolným zoznamom nájdete v súbore [VERCEL_DEPLOYMENT_CHECKLIST.md](VERCEL_DEPLOYMENT_CHECKLIST.md).

## 📧 E-mailové nastavenia

Aplikácia používa Nodemailer pre odosielanie e-mailov. Podpora pre:
- Gmail SMTP
- Ethereal (pre testovanie)
- Vlastný SMTP server

Detaily nastavenia e-mailov nájdete v [EMAIL_SETUP.md](EMAIL_SETUP.md).

## 👨‍💻 Vývoj

### Projektová štruktúra

```
/
├── api/ - Serverless funkcie pre Vercel
├── client/
│   ├── src/
│   │   ├── components/ - React komponenty
│   │   ├── data/ - Lokálne dátové zdroje
│   │   ├── hooks/ - Vlastné React hooks
│   │   ├── lib/ - Pomocné utility
│   │   ├── pages/ - Stránky aplikácie
│   │   ├── store/ - Zustand store-y pre stav
│   │   └── types/ - TypeScript definície
├── server/ - Express server
├── shared/ - Zdieľané typy a schémy
└── scripts/ - Pomocné skripty
```

## 📄 Licencia

Tento projekt je licencovaný pod licenciou MIT. Pozrite si súbor `LICENSE` pre viac informácií.

## ✨ Poďakovanie

- Ďakujeme všetkým prispievateľom a používateľom za podporu projektu
- Obrázky použité v aplikácii pochádzajú z [Unsplash](https://unsplash.com/)

---

Vytvorené s ❤️ pre Pizzeria Janíček
