import { Extra } from '../types';

// Kategorizované prísady
export interface ExtraCategory {
  id: string;
  name: string;
  items: Extra[];
}

// Definícia kategórií podľa aktualizovaného dokumentu
export const extraCategories: ExtraCategory[] = [
  {
    id: 'cheese',
    name: 'Syry',
    items: [
      { id: 1, name: 'Gorgonzola', price: 1.2, amount: '50g' },
      { id: 2, name: 'Parmezán', price: 1.2, amount: '50g' },
      { id: 3, name: 'Bryndza', price: 1.2, amount: '50g' },
      { id: 4, name: 'Mozzarella', price: 0.6, amount: '50g' },
      { id: 5, name: 'Byvolia mozzarella', price: 2.0, amount: '50g' },
      { id: 6, name: 'Niva', price: 0.7, amount: '50g' },
      { id: 7, name: 'Encián', price: 0.7, amount: '50g' },
    ]
  },
  {
    id: 'meat',
    name: 'Mäso',
    items: [
      { id: 8, name: 'Šunka', price: 1.6, amount: '50g' },
      { id: 9, name: 'Saláma', price: 1.6, amount: '50g' },
      { id: 10, name: 'Štipľavá saláma', price: 1.6, amount: '50g' },
      { id: 11, name: 'Slanina', price: 1.6, amount: '50g' },
      { id: 12, name: 'Klobása', price: 1.6, amount: '50g' },
      { id: 13, name: 'Tirolská slanina', price: 1.6, amount: '50g' },
      { id: 14, name: 'Pancetta', price: 1.6, amount: '50g' },
      { id: 15, name: 'Kuracie mäso', price: 1.6, amount: '80g' },
      { id: 16, name: 'Hovädzia sviečková', price: 2.5, amount: '50g' },
      { id: 17, name: 'Tuniak', price: 1.0, amount: '50g' },
      { id: 18, name: 'Losos', price: 1.7, amount: '50g' },
      { id: 19, name: 'Krevety', price: 2.0, amount: '50g' },
    ]
  },
  {
    id: 'vegetables',
    name: 'Zelenina',
    items: [
      { id: 20, name: 'Cibuľa', price: 0.3, amount: '15g' },
      { id: 21, name: 'Kapusta', price: 0.3, amount: '30g' },
      { id: 22, name: 'Šampiňóny', price: 0.5, amount: '50g' },
      { id: 23, name: 'Kukurica', price: 0.5, amount: '50g' },
      { id: 24, name: 'Cherry paradajky', price: 0.5, amount: '50g' },
      { id: 25, name: 'Artičoky', price: 0.4, amount: '30g' },
      { id: 26, name: 'Špargľa', price: 0.4, amount: '30g' },
      { id: 27, name: 'Špenát', price: 0.4, amount: '30g' },
      { id: 28, name: 'Rukola', price: 0.4, amount: '30g' },
      { id: 29, name: 'Brokolica', price: 0.6, amount: '50g' },
      { id: 30, name: 'Fazuľa', price: 0.6, amount: '50g' },
    ]
  },
  {
    id: 'other',
    name: 'Iné',
    items: [
      { id: 31, name: 'Cesnak', price: 0.2, amount: '5g' },
      { id: 32, name: 'Chilli', price: 0.2, amount: '5g' },
      { id: 33, name: 'Sladké chilli', price: 0.2, amount: '5g' },
      { id: 34, name: 'Olivy', price: 0.5, amount: '30g' },
      { id: 35, name: 'Kapary', price: 0.7, amount: '30g' },
      { id: 36, name: 'Pínové oriešky', price: 0.8, amount: '10g' },
      { id: 37, name: 'Vajíčko', price: 0.5, amount: '1 ks' },
      { id: 38, name: 'Baranie rohy', price: 0.5, amount: '50g' },
      { id: 39, name: 'Jalapeño', price: 0.5, amount: '50g' },
      { id: 40, name: 'Ananás', price: 0.6, amount: '50g' },
    ]
  }
];

// Helper funkcia na získanie všetkých extra prísad ako plochého zoznamu
export const getAllExtras = (): Extra[] => {
  return extraCategories.flatMap(category => category.items);
};

// Helper funkcia na získanie extra prísady podľa ID
export const getExtraById = (id: number): Extra | undefined => {
  return getAllExtras().find(extra => extra.id === id);
};

// Helper funkcia na získanie kategórie podľa ID
export const getCategoryById = (id: string): ExtraCategory | undefined => {
  return extraCategories.find(category => category.id === id);
};