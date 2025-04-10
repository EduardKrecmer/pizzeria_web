// Jednoduchá API funkcia pre pizzeria web
const express = require('express');
const cors = require('cors');

// Vytvorenie Express aplikácie
const app = express();

// Nastavenie CORS
app.use(cors({ origin: '*' }));
app.use(express.json());

// Zjednodušené dáta pre testovanie
const pizzas = [
  { id: 1, name: "Margherita", description: "Paradajková drť, mozzarella, bazalka", price: 6.50, category: "klasické" },
  { id: 2, name: "Šunková", description: "Paradajková drť, mozzarella, šunka", price: 7.50, category: "klasické" },
  { id: 3, name: "Quattro Formaggi", description: "Paradajková drť, štyri druhy syra", price: 8.50, category: "syrové" }
];

const extras = [
  { id: 1, name: "Mozzarella", price: 1.20 },
  { id: 2, name: "Šunka", price: 1.50 },
  { id: 3, name: "Olivy", price: 1.00 }
];

// API routes
app.get('/api/pizzas', (req, res) => {
  try {
    res.header('Content-Type', 'application/json');
    res.json(pizzas);
  } catch (error) {
    console.error('Chyba pri získavaní zoznamu pizz:', error);
    res.status(500).json({ error: 'Chyba servera pri získavaní zoznamu pizz' });
  }
});

app.get('/api/extras', (req, res) => {
  try {
    res.header('Content-Type', 'application/json');
    res.json(extras);
  } catch (error) {
    console.error('Chyba pri získavaní zoznamu príloh:', error);
    res.status(500).json({ error: 'Chyba servera pri získavaní zoznamu príloh' });
  }
});

// Diagnostický endpoint
app.get('/api', (req, res) => {
  res.header('Content-Type', 'application/json');
  res.json({
    status: 'API funguje',
    dostupnéEndpointy: [
      '/api/pizzas - zoznam všetkých pizz',
      '/api/extras - zoznam všetkých extra ingrediencií'
    ]
  });
});

// Test email konfigurácie
app.get('/api/test-email-direct', (req, res) => {
  // Len vrátime úspech pre testovanie
  res.json({ 
    status: 'success', 
    message: 'Email v tejto verzii nie je implementovaný. Toto je len test API.' 
  });
});

// Chyba 404 pre neznáme endpointy
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint nenájdený' });
});

// Ošetrenie chýb
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ error: 'Serverová chyba', details: err.message });
});

// Export pre Vercel
module.exports = app;