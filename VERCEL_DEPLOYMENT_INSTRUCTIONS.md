# Návod na nasadenie pizzeria-web na Vercel

Tento dokument obsahuje podrobný návod na nasadenie aplikácie Pizzerie na platformu [Vercel](https://vercel.com). Opisuje všetky potrebné kroky od prípravy kódu až po finálne nasadenie.

## Príprava projektu

Pred nasadením na Vercel je potrebné pripraviť projekt, aby používal relatívne API cesty a serverless funkcie:

1. **Spustite skript pre prípravu projektu**:
   ```bash
   chmod +x prepare-vercel.sh
   ./prepare-vercel.sh
   ```

   Tento skript vykoná nasledujúce akcie:
   - Skopíruje `pizzas-new.json` do `pizzas.json` (zdrojové dáta pre pizze)
   - Nahradí `main.tsx` verziou optimalizovanou pre Vercel
   - Vytvorí/aktualizuje `vercel.json` s potrebnými nastaveniami
   - Vytvorí `package.json.vercel` pre použitie s Vercel (zjednodušený bez servera)
   - Skontroluje existenciu potrebných súborov

2. **Nahraďte package.json pred nasadením na Vercel**:
   ```bash
   cp package.json.vercel package.json
   ```
   
   Toto je dôležitý krok, pretože originálny package.json obsahuje inštrukcie na budovanie backendu, ktorý na Vercel nebudeme potrebovať (použijeme serverless funkcie).

3. **Skontrolujte obsah priečinka `/api`**:
   Uistite sa, že máte nasledujúce súbory:
   - `pizzas-vercel.js` - endpoint pre načítanie pizz
   - `extras-vercel.js` - endpoint pre načítanie príloh
   - `orders-vercel.js` - endpoint pre spracovanie objednávok
   - `package.json` - so závislosťami pre serverless funkcie

## Nasadenie na Vercel

### Metóda 1: Nasadenie cez Vercel CLI

1. **Nainštalujte Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Prihláste sa do vášho Vercel účtu**:
   ```bash
   vercel login
   ```

3. **Nasaďte aplikáciu**:
   ```bash
   vercel --prod
   ```

4. **Nastavte potrebné environment premenné**:
   Po prvom nasadení môžete nastaviť premenné prostredia v Dashboarde Vercel:
   - Prejdite na `https://vercel.com/[vas-username]/[nazov-projektu]/settings/environment-variables`
   - Pridajte nasledujúce premenné:
     - `EMAIL_PASS`: heslo pre emailovú adresu `pizza.objednavka@gmail.com`

### Metóda 2: Nasadenie cez GitHub

1. **Nahrať kód na GitHub**:
   Vytvorte si repozitár na GitHub a nahrajte tam váš kód:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/[vas-username]/pizzeria-web.git
   git push -u origin main
   ```

2. **Prepojiť s Vercel**:
   - Prihláste sa do Vercel: `https://vercel.com`
   - Kliknite na "New Project" a vyberte repozitár GitHub
   - Sledujte inštrukcie pre nasadenie

3. **Nastavte environment premenné**:
   - V nastaveniach projektu pridajte nasledujúce premenné prostredia:
     - `EMAIL_PASS`: heslo pre emailovú adresu `pizza.objednavka@gmail.com`

## Konfigurácia emailových notifikácií

Aplikácia je nakonfigurovaná na posielanie emailov cez Gmail SMTP server. V `vercel.json` sú už prednastavené tieto hodnoty:

```json
"env": {
  "EMAIL_HOST": "smtp.gmail.com",
  "EMAIL_PORT": "465",
  "EMAIL_SECURE": "true",
  "EMAIL_USER": "pizza.objednavka@gmail.com",
  "EMAIL_FROM": "Pizzeria Janíček <pizza.objednavka@gmail.com>",
  "RESTAURANT_EMAIL": "vlastnawebstranka@gmail.com"
}
```

Je potrebné ešte nastaviť premennú `EMAIL_PASS` s heslom k emailu `pizza.objednavka@gmail.com`.

> **Poznámka**: Pre Gmail môže byť potrebné povoliť "Less secure apps" alebo vytvoriť "App Password" v nastaveniach Google účtu, aby SMTP server fungoval správne.

## Testovanie nasadenej aplikácie

Po úspešnom nasadení by aplikácia mala byť dostupná na:
```
https://[vas-projekt].vercel.app
```

Otestujte nasledujúce funkcie:
1. Načítanie zoznamu pizz na hlavnej stránke
2. Pridanie pizzy do košíka
3. Dokončenie objednávky s vyplnením formulára
4. Odoslanie objednávky a prijatie emailovej notifikácie

## Riešenie problémov

### 1. Neprídu emailové notifikácie
- Skontrolujte, či je správne nastavená premenná `EMAIL_PASS` v nastaveniach projektu na Vercel
- Skontrolujte, či emailový účet `pizza.objednavka@gmail.com` povolil prístup menej bezpečným aplikáciám alebo má vytvorené heslo pre aplikácie

### 2. Nenačítajú sa pizze alebo prílohy
- Skontrolujte, či existujú súbory `pizzas.json` a `extras.json` v koreňovom adresári projektu
- Skontrolujte, či serverless funkcie v `/api` majú správne relatívne cesty k JSON súborom

### 3. Nefungujú API volania
- Skontrolujte konfiguráciu v `vercel.json` a uistite sa, že smerovania API sú správne
- Skontrolujte zdroj dát v serverless funkciách, či používajú správne cesty k súborom

### 4. Chyba "Failed to load module script"
Tento problém sa týka nesprávnych MIME typov pre JavaScript moduly. Ak sa objaví, skontrolujte:
- Či `vercel.json` obsahuje sekciu "headers" s nastavením MIME typov pre `.js`, `.mjs` a `.css` súbory
- Príklad správnej konfigurácie:
  ```json
  "headers": [
    {
      "source": "/(.*).js",
      "headers": [
        { "key": "Content-Type", "value": "application/javascript" }
      ]
    }
  ]
  ```
- Po úprave `vercel.json` bude potrebné nasadiť aplikáciu znova

## Kontakt pre podporu

V prípade problémov s nasadením kontaktujte:
- Email: [vlastnawebstranka@gmail.com](mailto:vlastnawebstranka@gmail.com)