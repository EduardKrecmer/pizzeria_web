// API endpoint pre získanie extra ingrediencií
// Tento súbor bude nasadený ako serverless funkcia na Vercel

// Načítame dáta z lokálneho JSON súboru
const extrasData = require('../extras.json');

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

  // Normalizácia extra položiek
  const normalizedExtras = extrasData.map(extra => ({
    id: extra.id || 0,
    name: extra.name || 'Neznáma príloha',
    price: typeof extra.price === 'number' ? extra.price : 0,
    amount: extra.amount || ''
  }));

  // Odošleme všetky extra ingrediencie ako odpoveď
  res.status(200).json(normalizedExtras);
};