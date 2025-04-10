
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "@shared/schema";
import fetch from 'node-fetch';
import ws from 'ws';

// Nastavenie pre prostredie Replit
// Toto je potrebné pre funkčnosť @neondatabase/serverless v prostredí Replit
if (typeof global.WebSocket === 'undefined') {
  try {
    // @ts-ignore
    global.WebSocket = ws;
    // Toto je potrebné pre funkčnosť Neon WebSocket-ov v serverless prostredí
    if (!global.fetch) {
      // @ts-ignore
      global.fetch = fetch;
    }
    console.log('WebSocket a fetch nastavené pre @neondatabase/serverless');
  } catch (error) {
    console.error('Nepodarilo sa nastaviť WebSocket pre Neon:', error);
  }
}

// Zakomentujte alebo odkomentujte pre prepínanie medzi HTTP a WebSocket pripojením
// neonConfig.webSocketConstructor = undefined; // pre HTTP pripojenie
// neonConfig.useSecureWebSocket = false; // pre WebSocket pripojenie

// Funkcia, ktorá vráti databázové spojenie, ak je k dispozícii
// alebo vráti false, ak nie je
export function getDatabaseConnection() {
  // Pre nasadenie na Replit - kvôli kompatibilite s nasadením môžeme fungovať aj bez databázy
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL nie je nastavená. Databázové funkcie nebudú k dispozícii.");
    return false;
  }

  try {
    // Create connection pool with Neon's connection pooler
    const poolConfig = { 
      connectionString: process.env.DATABASE_URL,
      max: 5 
    };
    const pool = new Pool(poolConfig);
    const db = drizzle({ client: pool, schema });
    
    return { pool, db };
  } catch (error) {
    console.error("Chyba pri pripájaní k databáze:", error);
    return false;
  }
}

// Inicializácia databázového spojenia
const dbConnection = getDatabaseConnection();
export const pool = dbConnection ? dbConnection.pool : null;
export const db = dbConnection ? dbConnection.db : null;
