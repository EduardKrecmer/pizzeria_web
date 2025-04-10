# Návod na nahratie projektu na GitHub

Tento návod vás prevedie procesom nahratia čistého projektu na GitHub bez histórie commitov a chýb.

## Krok 1: Pripravte projekt pomocou skriptu

```bash
./prepare-for-github.sh
```

Skript:
- Vytvorí adresár `github-ready` s čistou kópiou projektu
- Inicializuje nový Git repozitár
- Vytvorí `.gitignore` s potrebnými výnimkami
- Vytvorí počiatočný commit

## Krok 2: Vytvorte nový repozitár na GitHub

1. Prihláste sa na svoj GitHub účet
2. Kliknite na tlačidlo "+ New repository" v pravom hornom rohu
3. Vyplňte:
   - Repository name: `pizzeria-web` (alebo iný názov)
   - Description: `Online objednávkový systém pre pizzeriu` (voliteľné)
   - Visibility: Vyberte Public alebo Private
   - **DÔLEŽITÉ: NEINICIALIZUJTE repozitár** (nevyberajte "Add a README file", "Add .gitignore", alebo "Choose a license")
4. Kliknite na "Create repository"

## Krok 3: Nahrajte projekt na GitHub

Po vytvorení repozitára GitHub zobrazí pokyny. Použite tieto príkazy (upravte URL podľa vášho repozitára):

```bash
cd github-ready
git remote add origin https://github.com/vas-username/pizzeria-web.git
git branch -M main
git push -u origin main
```

## Krok 4: Overte nahranie

1. Obnovte stránku vášho GitHub repozitára
2. Mali by ste vidieť váš projekt s jedným počiatočným commitom
3. Skontrolujte, či sú všetky súbory správne nahrané

## Dodatočné informácie

- Projekt bol pripravený s jedným čistým commitom, bez histórie
- Všetky Replit-specifické nastavenia boli odstránené
- Pre nasadenie na Vercel použite skript `vercel-deploy.sh` v repozitári

## Riešenie problémov

Ak narazíte na problémy s autentifikáciou:
- GitHub vyžaduje osobný prístupový token (PAT) namiesto hesla
- Token môžete vytvoriť v Settings -> Developer settings -> Personal access tokens
- Pri vytváraní tokenu vyberte oprávnenia "repo"

## Ďalšie kroky po nahratí

Po úspešnom nahratí môžete:
1. Upraviť README.md podľa potreby
2. Povoliť GitHub Pages pre hostovanie dokumentácie
3. Pridať ďalších spolupracovníkov
4. Nastaviť integráciu s Vercel pre automatické nasadenie