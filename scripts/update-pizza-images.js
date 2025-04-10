import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Získanie aktuálneho adresára
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Načítanie pizze a obrazov
const pizzasPath = path.join(projectRoot, 'pizzas-new.json');
const uniformImagesPath = path.join(projectRoot, 'pizza-images-uniform.json');

const pizzas = JSON.parse(fs.readFileSync(pizzasPath, 'utf-8'));
const uniformImages = JSON.parse(fs.readFileSync(uniformImagesPath, 'utf-8'));

// Funkcia na získanie vhodného obrázka podľa tagov
function getImageForPizza(tags) {
  // Prioritné kategórie
  if (tags.includes('Pikantné')) {
    return uniformImages.spicy;
  }
  if (tags.includes('Fitness')) {
    return uniformImages.fitness;
  }
  if (tags.includes('Prémiové')) {
    return uniformImages.premium;
  }
  if (tags.includes('Sladké')) {
    return uniformImages.sweet;
  }
  if (tags.includes('Vegetariánske')) {
    return uniformImages.vegetarian;
  }
  if (tags.includes('Ryby')) {
    return uniformImages.seafood;
  }
  if (tags.includes('Špeciality')) {
    return uniformImages.specialty;
  }
  // Štandardná kategória
  return uniformImages.classic;
}

// Aktualizácia obrázkov pre všetky pizze
const updatedPizzas = pizzas.map(pizza => {
  return {
    ...pizza,
    image: getImageForPizza(pizza.tags)
  };
});

// Uloženie aktualizovaných dát
fs.writeFileSync(
  path.join(projectRoot, 'pizzas-updated.json'),
  JSON.stringify(updatedPizzas, null, 2)
);

console.log('Obrázky pizze boli aktualizované v súbore pizzas-updated.json');