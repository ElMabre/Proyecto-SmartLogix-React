// src/shared/layouts/DashboardLayout.jsx
import React from 'react';

const DashboardLayout = ({ children, onNavigate, currentPath, userRole }) => {
  // Opciones del menú basadas en los Bounded Contexts de SmartLogix
  // Se agrega condicionalmente la pestaña de usuarios si el rol es ADMIN
  const menuItems = [
    { id: 'inventory', label: 'Inventario' },
    { id: 'orders', label: 'Pedidos' },
    ...(userRole === 'ADMIN' ? [{ id: 'users', label: 'Gestión de Usuarios' }] : []),
    { id: 'auth', label: 'Cerrar Sesión' }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-heading font-bold text-blue-400">
            SmartLogix
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-sans">Panel Administrativo</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full text-left px-4 py-3 rounded transition-colors duration-200 ${
                currentPath === item.id 
                  ? 'bg-blue-600 text-white font-medium' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Área Principal de Contenido */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 p-4 shadow-sm">
          <h2 className="text-lg font-heading text-gray-800 font-medium">
            Sistema de Gestión Logística
          </h2>
        </header>
        
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

// Memorizamos el layout completo
export default React.memo(DashboardLayout);