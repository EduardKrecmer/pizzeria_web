import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Načítanie súborov
const pizzasData = JSON.parse(fs.readFileSync(path.join(__dirname, '../attached_assets/pizza_menu_spravne_ceny.json')));
const pizzaImages = JSON.parse(fs.readFileSync(path.join(__dirname, '../pizza-images.json')));
const pizzaCategories = JSON.parse(fs.readFileSync(path.join(__dirname, '../pizza-categories.json')));

// Transformácia dát
const transformedPizzas = pizzasData.map(pizza => {
  // Extrakcia ceny a konverzia na číslo
  const priceString = pizza.price.replace('€', '').trim();
  const price = parseFloat(priceString.replace(',', '.'));
  
  // Rozdelenie ingrediencií do poľa
  let ingredients = [];
  
  // Skontroluj, či máme platný reťazec ingrediencií
  if (pizza.ingredients && typeof pizza.ingredients === 'string') {
    ingredients = pizza.ingredients
      .split(',')
      .map(item => item.trim())
      .filter(ingredient => 
        // Odstránenie všetkých textov, ktoré nereprezentujú ingrediencie
        !ingredient.includes("TUNIAKOVA") && 
        !ingredient.includes("g /") &&
        ingredient !== '')
      .map(ingredient => {
        // Oprava začiatočných písmen
        return ingredient.charAt(0).toUpperCase() + ingredient.slice(1).toLowerCase();
      });
  }
  
  // Uistíme sa, že paradajková drť je v ingredienciách, ak tam už nie je
  if (!ingredients.some(ingredient => 
      ingredient.toLowerCase().includes('paradaj') ||
      ingredient.toLowerCase().includes('parada'))) {
    // Pridáme paradajkovú drť na začiatok ingrediencií pre väčšinu pizz (okrem špeciálnych)
    if (pizza.name !== "Posúch" && pizza.name !== "Slaninový posúch" && 
        !pizza.ingredients.includes('ricotta') && !pizza.ingredients.includes('olivovy ole') &&
        !pizza.ingredients.includes('smotanový základ')) {
      ingredients.unshift('Paradajková drť');
    }
  }
  
  // Odstránime duplicitu "paradajková drť" a opravíme "parada" na "Paradajková drť"
  ingredients = ingredients.map(ingredient => {
    if (ingredient.toLowerCase().includes('parada')) {
      return 'Paradajková drť';
    }
    return ingredient;
  });
  
  // Odstránime duplicity v ingredienciách
  ingredients = [...new Set(ingredients)];
  
  // Vytvorenie popisu pizze
  const description = ingredients.join(', ');
  
  // Získanie obrázku
  const image = pizzaImages[pizza.id] || "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&q=80";
  
  // Získanie kategórií
  const tags = pizzaCategories[pizza.id] || ["Klasické"];
  
  return {
    id: pizza.id,
    name: pizza.name,
    description: description,
    price: price,
    image: image,
    tags: tags,
    ingredients: ingredients,
    weight: pizza.weight,
    allergens: pizza.allergens
  };
});

// Uloženie výsledného súboru
fs.writeFileSync(path.join(__dirname, '../pizzas-new.json'), JSON.stringify(transformedPizzas, null, 2));

console.log('Transformácia dokončená. Výsledok uložený do pizzas-new.json');