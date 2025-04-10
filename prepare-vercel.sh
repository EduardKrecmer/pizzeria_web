#!/bin/bash

# Skript pre prípravu projektu na nasadenie na Vercel
# Tento skript pripraví súbory potrebné pre Vercel nasadenie

echo "Začínam prípravu projektu pre Vercel nasadenie..."

# 1. Uistíme sa, že máme API JSON súbory v koreňovom adresári
echo "Kontrolujem prítomnosť JSON súborov v koreňovom adresári..."

# Pizzas.json
if [ -f "pizzas-new.json" ]; then
  cp pizzas-new.json pizzas.json
  echo "✓ Skopírovaný pizzas-new.json do pizzas.json"
elif [ ! -f "pizzas.json" ]; then
  echo "⚠️ Chýba súbor pizzas.json v koreňovom adresári!"
  exit 1
else
  echo "✓ Súbor pizzas.json už existuje v koreňovom adresári"
fi

# Extras.json
if [ ! -f "extras.json" ]; then
  echo "⚠️ Chýba súbor extras.json v koreňovom adresári!"
  exit 1
else
  echo "✓ Súbor extras.json už existuje v koreňovom adresári"
fi

# 2. Kopírujeme Vercel verzie súborov
echo "Kopírujem Vercel-kompatibilné súbory..."

# Nahradenie main.tsx
if [ -f "client/src/main.vercel.tsx" ]; then
  cp client/src/main.vercel.tsx client/src/main.tsx
  echo "✓ Nahradený main.tsx s Vercel verziou"
else
  echo "⚠️ Chýba client/src/main.vercel.tsx!"
fi

# Nahradenie vite.config.ts
if [ -f "vite.config.vercel.ts" ]; then
  cp vite.config.vercel.ts vite.config.ts
  echo "✓ Nahradený vite.config.ts s Vercel verziou (bez Replit pluginov)"
else
  echo "⚠️ Chýba vite.config.vercel.ts! Vytváram ho..."
  
  # Vytvorenie Vercel verzie vite.config.ts bez Replit pluginov
  cat > vite.config.ts << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
EOF
  echo "✓ Vytvorený vite.config.ts pre Vercel bez Replit pluginov"
fi

# 3. Vytvoríme package.json pre API priečinok, ak neexistuje
if [ ! -f "api/package.json" ]; then
  echo '{
  "name": "pizzeria-api",
  "version": "1.0.0",
  "description": "Serverless API endpoints for Pizzeria Web",
  "main": "index.js",
  "dependencies": {
    "nodemailer": "^6.9.9"
  }
}' > api/package.json
  echo "✓ Vytvorený api/package.json"
fi

# 4. Skontrolujeme vercel.json
if [ -f "vercel.json" ]; then
  echo "✓ vercel.json existuje"
else
  echo '{
  "version": 2,
  "buildCommand": "npm run vercel-build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "functions": {
    "api/*.js": {
      "memory": 512,
      "maxDuration": 10
    }
  },
  "routes": [
    { "src": "/api/pizzas", "dest": "/api/pizzas-vercel.js" },
    { "src": "/api/extras", "dest": "/api/extras-vercel.js" },
    { "src": "/api/orders", "dest": "/api/orders-vercel.js" },
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*).js",
      "headers": [
        { "key": "Content-Type", "value": "application/javascript" }
      ]
    },
    {
      "source": "/(.*).mjs",
      "headers": [
        { "key": "Content-Type", "value": "application/javascript" }
      ]
    },
    {
      "source": "/(.*).css",
      "headers": [
        { "key": "Content-Type", "value": "text/css" }
      ]
    }
  ],
  "env": {
    "EMAIL_HOST": "smtp.gmail.com",
    "EMAIL_PORT": "465",
    "EMAIL_SECURE": "true",
    "EMAIL_USER": "pizza.objednavka@gmail.com",
    "EMAIL_FROM": "Pizzeria Janíček <pizza.objednavka@gmail.com>",
    "RESTAURANT_EMAIL": "vlastnawebstranka@gmail.com"
  }
}' > vercel.json
  echo "✓ Vytvorený vercel.json"
fi

# 5. Nastavíme package.json pre Vercel nasadenie
echo "Nastavujem špeciálny package.json pre Vercel nasadenie..."

if [ -f "package.json.vercel.new" ]; then
  cp package.json.vercel.new package.json.vercel
  echo "✓ Použitý nový package.json.vercel.new bez Replit závislostí"
elif [ -f "prepare-vercel-package.json" ]; then
  cp prepare-vercel-package.json package.json.vercel
  echo "✓ Vytvorený package.json.vercel z prepare-vercel-package.json"
else
  # Ak neexistuje ani jeden súbor, vytvoríme package.json.vercel bez Replit závislostí
  cat > package.json.vercel << 'EOF'
{
  "name": "pizzeria-web",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "dev": "vite",
    "build": "tsc && cp -r api dist/ && vite build",
    "start": "vite preview",
    "check": "tsc",
    "vercel-build": "tsc && cp -r api dist/ && vite build"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.1",
    "@radix-ui/react-accordion": "^1.2.1",
    "@radix-ui/react-alert-dialog": "^1.1.2",
    "@radix-ui/react-aspect-ratio": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.1",
    "@radix-ui/react-checkbox": "^1.1.2",
    "@radix-ui/react-collapsible": "^1.1.1",
    "@radix-ui/react-context-menu": "^2.2.2",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-hover-card": "^1.1.2",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-menubar": "^1.1.2",
    "@radix-ui/react-navigation-menu": "^1.2.1",
    "@radix-ui/react-popover": "^1.1.2",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-radio-group": "^1.2.1",
    "@radix-ui/react-scroll-area": "^1.2.0",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slider": "^1.2.1",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.1",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-toast": "^1.2.2",
    "@radix-ui/react-toggle": "^1.1.0",
    "@radix-ui/react-toggle-group": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.3",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.0",
    "date-fns": "^3.6.0",
    "embla-carousel-react": "^8.3.0",
    "framer-motion": "^11.18.2",
    "input-otp": "^1.2.4",
    "lucide-react": "^0.453.0",
    "nodemailer": "^6.10.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.1",
    "react-icons": "^5.4.0",
    "react-resizable-panels": "^2.1.4",
    "tailwind-merge": "^2.5.4",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^1.1.0",
    "wouter": "^3.3.5",
    "zod": "^3.23.8",
    "zustand": "^5.0.3"
  },
  "devDependencies": {
    "@tailwindcss/typography": "^0.5.15",
    "@types/node": "20.16.11",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "typescript": "5.6.3",
    "vite": "^5.4.14"
  }
}
EOF
  echo "✓ Vytvorený package.json.vercel bez Replit závislostí"
fi

# 6. Zobraziť záverečné informácie
echo ""
echo "=================================================="
echo "Príprava súborov pre Vercel nasadenie dokončená!"
echo "=================================================="
echo ""
echo "Ďalšie kroky:"
echo ""
echo "1. Nastavte package.json pre Vercel:"
echo "   cp package.json.vercel package.json"
echo ""
echo "2. Pre nasadenie máte dve možnosti:"
echo "   a) Vercel CLI:"
echo "      vercel login"
echo "      vercel --prod"
echo ""
echo "   b) GitHub + Vercel:"
echo "      - Nahrajte kód na GitHub"
echo "      - Importujte repozitár na Vercel.com"
echo ""
echo "3. ⚠️ DÔLEŽITÉ: Na Vercel nastavte secret:"
echo "   EMAIL_PASS = heslo pre pizza.objednavka@gmail.com"
echo ""
echo "Pre viac informácií si pozrite VERCEL_DEPLOYMENT_CHECKLIST.md"

# Nastavíme súbor ako spustiteľný
chmod +x "$0"

exit 0