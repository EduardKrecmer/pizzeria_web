# Checklist nasadenia aplikácie na Vercel

## Nová metóda (Odporúčané)

- [ ] Spustený automatizačný skript `vercel-deploy.sh`
  ```
  chmod +x vercel-deploy.sh
  ./vercel-deploy.sh
  ```
- [ ] Overená existencia vytvoreného adresára `vercel-deployment`
- [ ] Nasadenie z adresára `vercel-deployment`:
  ```
  cd vercel-deployment
  vercel --prod
  ```
- [ ] Alternatívne: Nahratie adresára `vercel-deployment` na GitHub a import do Vercel.com

## Starší prístup 

- [ ] Spustený automatizačný skript `deploy-to-vercel.sh` (obsahuje všetky potrebné kroky)
- [ ] **ALEBO** postupujte manuálne podľa krokov nižšie:
  - [ ] Spustený skript `prepare-vercel.sh`
  - [ ] Overená existencia súboru `vercel.json` so správnou konfiguráciou (vrátane sekcií "headers", "routes", "functions")
  - [ ] Nahradený `package.json` verziou optimalizovanou pre Vercel
    ```
    cp package.json.vercel package.json
    ```
  - [ ] Overená správnosť `vercel-build` skriptu v package.json:
    ```json
    "vercel-build": "tsc && cp -r api dist/ && vite build"
    ```
- [ ] Overená existencia serverless funkcií v `/api`:
  - [ ] `pizzas-vercel.js` - načítava pizzas.json
  - [ ] `extras-vercel.js` - načítava extras.json
  - [ ] `orders-vercel.js` - spracováva objednávky a odosiela emaily
- [ ] Overená existencia Vercel-kompatibilných verzií store súborov:
  - [ ] `client/src/store/pizzaStore.vercel.ts` - používa relatívne cesty pre API
  - [ ] `client/src/store/cartStore.vercel.ts` - používa relatívne cesty pre API
- [ ] Overená konfigurácia hlavného súboru
  - [ ] `client/src/main.vercel.tsx` - importuje Vercel-kompatibilné store-y
- [ ] Overená existencia JSON dát v koreňovom adresári:
  - [ ] `pizzas.json` - dáta o pizzách
  - [ ] `extras.json` - dáta o prísadách a extrách

## Nasadenie na Vercel 

### Metóda 1: Vercel CLI

- [ ] Nainštalovaný Vercel CLI (`npm install -g vercel`)
- [ ] Prihlásený na Vercel účet (`vercel login`)
- [ ] Vykonané nasadenie (`vercel --prod`)
- [ ] Nastavené environment premenné:
  - [ ] `EMAIL_PASS`

### Metóda 2: GitHub + Vercel

- [ ] Kód nahraný na GitHub
- [ ] Vytvorený projekt na Vercel z GitHub repozitára
- [ ] Nastavené environment premenné:
  - [ ] `EMAIL_PASS`

## Testovanie nasadenej aplikácie

- [ ] Funguje načítanie zoznamu pizz
- [ ] Funguje pridanie pizzy do košíka
- [ ] Funguje objednávkový proces
- [ ] Prichádzajú email notifikácie:
  - [ ] Zákazníkovi na zadaný email
  - [ ] Reštaurácii na `vlastnawebstranka@gmail.com`

## Poznámky

- Pre podrobnejšie inštrukcie pozrite `VERCEL_DEPLOYMENT_INSTRUCTIONS.md`
- V prípade problémov s nasadením kontaktujte `vlastnawebstranka@gmail.com`