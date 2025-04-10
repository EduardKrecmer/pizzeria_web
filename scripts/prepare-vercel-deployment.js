// Skript na prípravu projektu na nasadenie na Vercel
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Funkcia na kopírovanie súboru
const copyFile = (source, target) => {
  try {
    console.log(`Kopírujem ${source} do ${target}`);
    fs.copyFileSync(source, target);
    return true;
  } catch (err) {
    console.error(`Chyba pri kopírovaní ${source}: ${err.message}`);
    return false;
  }
};

// Funkcia na kontrolu existencie priečinka a vytvorenie, ak neexistuje
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    console.log(`Vytváram priečinok ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Skontroluj a vytvor api priečinok, ak neexistuje
ensureDir(path.join(rootDir, 'api'));

// Kopíruj aktuálny zoznam pizz do api/pizzas.json
copyFile(
  path.join(rootDir, 'pizzas-new.json'),
  path.join(rootDir, 'api', 'pizzas.json')
);

// Kopíruj aktuálny zoznam extra ingrediencií do api/extras.json
if (fs.existsSync(path.join(rootDir, 'extras.json'))) {
  console.log('Kopírujem extras.json do api/extras.json');
  copyFile(
    path.join(rootDir, 'extras.json'),
    path.join(rootDir, 'api', 'extras.json')
  );
}

// Vytvor šablónu .env.production ak neexistuje
const envProductionPath = path.join(rootDir, '.env.production');
if (!fs.existsSync(envProductionPath)) {
  console.log('Vytváram .env.production šablónu');
  const envContent = `# Produkčné nastavenia pre nasadenie na Vercel
# Tieto premenné je potrebné nastaviť v Vercel Dashboard

# Databázové pripojenie
DATABASE_URL=

# Nastavenia emailov - Gmail nastavenia
RESTAURANT_EMAIL=vlastnawebstranka@gmail.com
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=pizza.objednavka@gmail.com
EMAIL_PASS=         # Toto je potrebné vyplniť v Vercel Environment Variables
EMAIL_FROM="Pizzeria Janíček <pizza.objednavka@gmail.com>"
EMAIL_PORT=465
EMAIL_SECURE=true
`;
  fs.writeFileSync(envProductionPath, envContent);
}

// Kontrola a kopírovanie API súborov
const requiredApiFiles = [
  { name: 'index.js', message: 'Hlavný API súbor', source: path.join(rootDir, 'api', 'fixed-index.js') },
  { name: 'email-handler.js', message: 'Handler pre odosielanie emailov', source: path.join(rootDir, 'api', 'email-handler.js') },
  { name: 'diagnostic-tools.js', message: 'Diagnostické nástroje', source: path.join(rootDir, 'api', 'diagnostic-tools.js') }
];

console.log('\nKontrola a príprava API súborov:');
let allFilesReady = true;

for (const file of requiredApiFiles) {
  const targetPath = path.join(rootDir, 'api', file.name);
  const exists = fs.existsSync(targetPath);
  
  // Ak súbor neexistuje a existuje zdroj, skopírujeme ho
  if (!exists && fs.existsSync(file.source)) {
    try {
      fs.copyFileSync(file.source, targetPath);
      console.log(`✓ ${file.name} - Skopírovaný z ${path.basename(file.source)}`);
    } catch (err) {
      console.error(`✗ ${file.name} - Chyba pri kopírovaní: ${err.message}`);
      allFilesReady = false;
    }
  } else if (exists) {
    console.log(`✓ ${file.name} - ${file.message} (už existuje)`);
  } else {
    console.log(`✗ ${file.name} - CHÝBA! - ${file.message}`);
    allFilesReady = false;
  }
}

if (!allFilesReady) {
  console.warn('\n⚠️ UPOZORNENIE: Niektoré API súbory chýbajú alebo nie sú pripravené, čo spôsobí problémy pri nasadení!');
} else {
  console.log('\n✅ Všetky potrebné API súbory sú pripravené pre nasadenie.');
}

console.log('\nPríprava na nasadenie na Vercel dokončená!');
console.log('');
console.log('DÔLEŽITÉ KROKY PRE NASADENIE:');
console.log('1. Nahrajte repozitár na GitHub, GitLab alebo Bitbucket');
console.log('2. Na Vercel Dashboard importujte repozitár');
console.log('3. Nastavte Environment Variables vo Vercel Dashboard:');
console.log('   - DATABASE_URL: URL pripojenia k PostgreSQL databáze');
console.log('   - EMAIL_HOST: smtp.gmail.com');
console.log('   - EMAIL_USER: pizza.objednavka@gmail.com');
console.log('   - EMAIL_PASS: [vaše aplikačné heslo pre Gmail]');
console.log('   - EMAIL_PORT: 465');
console.log('   - EMAIL_SECURE: true');
console.log('   - RESTAURANT_EMAIL: vlastnawebstranka@gmail.com');
console.log('4. Nasaďte aplikáciu');