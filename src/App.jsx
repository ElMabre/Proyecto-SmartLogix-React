// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { initMockDB } from './core/storage/mockDatabase';
import DashboardLayout from './shared/layouts/DashboardLayout';
import LoginForm from './modules/auth/LoginForm';
import InventoryView from './modules/inventory/InventoryView';
import OrderView from './modules/orders/OrderView';

const App = () => {
  // Estado global para manejar la sesión y la navegación
  const [user, setUser] = useState(null);
  const [currentPath, setCurrentPath] = useState('inventory');

  // Inicializamos la base de datos de los microservicios en localStorage al montar la app
  useEffect(() => {
    initMockDB();
  }, []);

  // Función memorizada para manejar el login exitoso
  const handleLogin = useCallback((userData) => {
    setUser(userData);
    setCurrentPath('inventory'); // Redirigimos al inventario por defecto
  }, []);

  // Función memorizada para manejar la navegación del Sidebar
  const handleNavigate = useCallback((path) => {
    if (path === 'auth') {
      // Si el path es auth desde el dashboard, significa "Cerrar Sesión"
      setUser(null);
    } else {
      setCurrentPath(path);
    }
  }, []);

  // Routing básico: Si no hay usuario autenticado, renderizamos el Bounded Context de Auth
  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Si hay usuario, renderizamos el Layout principal inyectando el Bounded Context correspondiente
  return (
    <DashboardLayout onNavigate={handleNavigate} currentPath={currentPath}>
      {currentPath === 'inventory' && <InventoryView />}
      {currentPath === 'orders' && <OrderView />}
    </DashboardLayout>
  );
};

export default App;