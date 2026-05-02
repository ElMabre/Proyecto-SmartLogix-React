// src/core/storage/mockDatabase.js

// Semilla inicial de datos para simular los dominios de SmartLogix
const initialData = {
  users: [
    { id: 1, email: 'admin@smartlogix.com', password: 'password123', name: 'Admin', role: 'admin' }
  ],
  inventory: [
    { id: 1, name: 'Caja Embalaje Pequeña', sku: 'CAJ-P', stock: 150, price: 500 },
    { id: 2, name: 'Cinta Adhesiva Industrial', sku: 'CIN-IND', stock: 300, price: 1200 },
    { id: 3, name: 'Plástico Burbuja (Rollo)', sku: 'PLAS-BUR', stock: 45, price: 8500 }
  ],
  orders: []
};

// Función para inicializar la base de datos en localStorage si no existe
export const initMockDB = () => {
  if (!localStorage.getItem('smartlogix_db')) {
    localStorage.setItem('smartlogix_db', JSON.stringify(initialData));
  }
};

// Función para obtener datos simulando la consulta a una base de datos específica
export const getCollection = (collection) => {
  const db = JSON.parse(localStorage.getItem('smartlogix_db'));
  return db[collection] || [];
};

// Función para guardar datos simulando persistencia
export const saveToCollection = (collection, data) => {
  const db = JSON.parse(localStorage.getItem('smartlogix_db'));
  db[collection] = data;
  localStorage.setItem('smartlogix_db', JSON.stringify(db));
};