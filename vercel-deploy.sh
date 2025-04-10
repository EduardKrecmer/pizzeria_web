#!/bin/bash

echo "=== ZAČÍNAM PRÍPRAVU PRE NASADENIE NA VERCEL ==="
echo "Tento skript vytvorí minimálnu čistú verziu projektu pre Vercel bez Replit závislostí"

# Overíme, či existujú potrebné súbory
if [ ! -f "api/pizzas-vercel.js" ]; then
  echo "❌ Chýba súbor api/pizzas-vercel.js!"
  exit 1
fi

if [ ! -f "api/extras-vercel.js" ]; then
  echo "❌ Chýba súbor api/extras-vercel.js!"
  exit 1
fi

if [ ! -f "api/orders-vercel.js" ]; then
  echo "❌ Chýba súbor api/orders-vercel.js!"
  exit 1
fi

if [ ! -f "pizzas.json" ]; then
  echo "❌ Chýba súbor pizzas.json!"
  exit 1
fi

if [ ! -f "extras.json" ]; then
  echo "❌ Chýba súbor extras.json!"
  exit 1
fi

# Vytvoríme nový adresár pre nasadenie
DEPLOY_DIR="vercel-deployment"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR
mkdir -p $DEPLOY_DIR/api
mkdir -p $DEPLOY_DIR/public
mkdir -p $DEPLOY_DIR/client/src

echo "✓ Vytvorený adresár $DEPLOY_DIR pre nasadenie"

# Kopírujeme API a dáta
cp api/pizzas-vercel.js $DEPLOY_DIR/api/
cp api/extras-vercel.js $DEPLOY_DIR/api/
cp api/orders-vercel.js $DEPLOY_DIR/api/
cp pizzas.json $DEPLOY_DIR/
cp extras.json $DEPLOY_DIR/

# Kopírujeme ďalšie JSON dáta
for jsonfile in *.json; do
  if [ "$jsonfile" != "package.json" ] && [ "$jsonfile" != "package-lock.json" ] && [ "$jsonfile" != "vercel.json" ]; then
    echo "  - Kopírujem $jsonfile"
    cp "$jsonfile" $DEPLOY_DIR/
  fi
done

# Skopírujeme aj všetky priložené JSON dáta z attached_assets
if [ -d "attached_assets" ]; then
  for jsonfile in attached_assets/*.json; do
    if [ -f "$jsonfile" ]; then
      filename=$(basename "$jsonfile")
      echo "  - Kopírujem $filename z attached_assets"
      cp "$jsonfile" $DEPLOY_DIR/
    fi
  done
fi

echo "✓ Skopírované API súbory a JSON dáta"

# Vytvoríme minimalistický package.json bez Replit závislostí
cat > $DEPLOY_DIR/package.json << 'EOF'
{
  "name": "pizzeria-web",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "build": "cd client && npm run build",
    "start": "node server.js"
  },
  "dependencies": {
    "nodemailer": "^6.10.0",
    "express": "^4.18.2"
  }
}
EOF

echo "✓ Vytvorený package.json bez Replit závislostí"

# Vytvoríme client/package.json pre frontend
cat > $DEPLOY_DIR/client/package.json << 'EOF'
{
  "name": "pizzeria-web-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "start": "vite preview"
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

# Vytvoríme vercel.json
cat > $DEPLOY_DIR/vercel.json << 'EOF'
{
  "version": 2,
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
}
EOF

# Vytvoríme čistý vite.config.js bez Replit závislostí
cat > $DEPLOY_DIR/client/vite.config.js << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react()
  ],
  build: {
    outDir: "../public",
    emptyOutDir: true
  }
});
EOF

# Skopírujme frontend kód
cp -r client/src/* $DEPLOY_DIR/client/src/
cp client/index.html $DEPLOY_DIR/client/

# Skopírujeme štýly a konfigurácie
if [ -f "postcss.config.js" ]; then
  cp postcss.config.js $DEPLOY_DIR/client/
fi
if [ -f "tailwind.config.ts" ]; then
  cp tailwind.config.ts $DEPLOY_DIR/client/
fi
if [ -f "theme.json" ]; then
  cp theme.json $DEPLOY_DIR/client/
fi

# Pripravíme súbor main.js bez Replit importov
cat > $DEPLOY_DIR/client/src/main.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

echo "✓ Pripravený frontend kód bez Replit závislostí"

# Vytvoríme jednoduchý server
cat > $DEPLOY_DIR/server.js << 'EOF'
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Statické súbory
app.use(express.static(path.join(__dirname, 'public')));

// Všetky požiadavky smerujú na index.html
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server beží na porte ${PORT}`);
});
EOF

echo "✓ Vytvorený jednoduchý Express server"

echo ""
echo "=== PRÍPRAVA DOKONČENÁ ==="
echo "Adresár '$DEPLOY_DIR' je pripravený na nasadenie na Vercel"
echo ""
echo "Ďaľšie kroky:"
echo "1. cd $DEPLOY_DIR"
echo "2. Použite Vercel CLI: vercel --prod"
echo "   alebo nahrajte adresár $DEPLOY_DIR na GitHub a importujte ho do Vercel"
echo ""
echo "⚠️ NEZABUDNITE: Na Vercel nastavte secret:"
echo "   EMAIL_PASS = heslo pre pizza.objednavka@gmail.com"

# Nastavíme súbor ako spustiteľný
chmod +x "$0"

exit 0