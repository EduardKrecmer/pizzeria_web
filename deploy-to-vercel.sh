#!/bin/bash

# Tento skript pripraví kód pre nasadenie na Vercel z GitHub
# Vykonáva všetky potrebné kroky v správnom poradí

echo "Začínam prípravu projektu pre nasadenie na Vercel cez GitHub..."

# 1. Kontrola prítomnosti potrebných súborov
if [ ! -f "vercel.json" ]; then
  echo "⚠️ Chýba súbor vercel.json! Nasadenie na Vercel pravdepodobne zlyhá."
  exit 1
fi

if [ ! -f "package.json.vercel" ]; then
  echo "⚠️ Chýba súbor package.json.vercel! Nasadenie na Vercel pravdepodobne zlyhá."
  exit 1
fi

if [ ! -d "api" ]; then
  echo "⚠️ Chýba adresár api! Serverless funkcie nebudú fungovať na Vercel."
  exit 1
fi

# 2. Spustíme prípravu súborov
if [ ! -x "./prepare-vercel.sh" ]; then
  chmod +x "./prepare-vercel.sh"
  echo "✓ Nastavené oprávnenie pre spustenie prepare-vercel.sh"
fi

./prepare-vercel.sh

# 3. Nahradíme package.json verziou pre Vercel
cp package.json.vercel package.json
echo "✓ Nahradený package.json špeciálnou Vercel verziou"

# 4. Skontrolujeme, či JSON súbory existujú v koreňovom adresári
for json_file in "pizzas.json" "extras.json"; do
  if [ ! -f "$json_file" ]; then
    echo "⚠️ Chýba $json_file v koreňovom adresári! Serverless funkcie ho nebudú môcť načítať."
    exit 1
  fi
done

# 5. Zobrazíme posledné informácie
echo ""
echo "================================================="
echo "Projekt je KOMPLETNE pripravený na nasadenie!"
echo "================================================="
echo ""
echo "Teraz môžete:"
echo "1. Vytvoriť/inicializovať Git repozitár, ak ešte neexistuje:"
echo "   git init"
echo ""
echo "2. Pridať všetky súbory do Git:"
echo "   git add ."
echo ""
echo "3. Commnitnúť zmeny:"
echo "   git commit -m \"Príprava pre Vercel nasadenie\""
echo ""
echo "4. Pridať GitHub remote a pushnúť kód:"
echo "   git remote add origin https://github.com/[vas-username]/pizzeria-web.git"
echo "   git push -u origin main"
echo ""
echo "5. Na Vercel.com:"
echo "   - Importovať repozitár"
echo "   - V nastaveniach projektu pridať premenné prostredia:"
echo "     EMAIL_PASS = heslo pre pizza.objednavka@gmail.com"
echo ""
echo "⚠️ DÔLEŽITÉ: Po nasadení sa uistite, že serverless funkcie fungujú správne"
echo "   testovaním API endpoints: /api/pizzas, /api/extras, /api/orders"

# Nastavíme skript ako spustiteľný
chmod +x "$0"

exit 0