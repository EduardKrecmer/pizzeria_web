// API endpoint pre získanie všetkých pizz
// Tento súbor bude nasadený ako serverless funkcia na Vercel

// Načítame dáta z lokálneho JSON súboru
const pizzasData = require('../pizzas.json');

module.exports = (req, res) => {
  // Nastavenia CORS pre povolenenie prístupu z rôznych domén
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Pre OPTIONS žiadosti okamžite vrátime úspešnú odpoveď
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Normalizácia a oprava dát pred odoslaním
  const normalizedPizzas = pizzasData.map(pizza => ({
    id: pizza.id || 0,
    name: pizza.name || 'Neznáma pizza',
    description: pizza.description || '',
    price: typeof pizza.price === 'number' ? pizza.price : 0,
    image: pizza.image && pizza.image.includes('placeholder.com') 
           ? 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/3/33/Pizza_%28block%29_JE1_BE1.png' 
           : (pizza.image || 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/3/33/Pizza_%28block%29_JE1_BE1.png'),
    tags: Array.isArray(pizza.tags) ? pizza.tags : [],
    ingredients: Array.isArray(pizza.ingredients) ? pizza.ingredients : [],
    weight: pizza.weight || null,
    allergens: pizza.allergens || null
  }));

  // Odošleme všetky pizze ako odpoveď
  res.status(200).json(normalizedPizzas);
};