
import React, { useState, useEffect, useCallback } from 'react';
import { initMockDB } from './core/storage/mockDatabase';
import DashboardLayout from './shared/layouts/DashboardLayout';
import LoginForm from './modules/auth/LoginForm';
import InventoryView from './modules/inventory/InventoryView';
import OrderView from './modules/orders/OrderView';
import UserManagementView from './modules/users/UserManagementView'; 

const App = () => {
  const [user, setUser] = useState(null);
  const [currentPath, setCurrentPath] = useState('inventory');

  useEffect(() => {
    initMockDB();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('smartlogix_jwt');
        if (!token) return;

        // validate token with backend (tests stub global fetch)
        const resp = await fetch('http://localhost:8080/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (resp && resp.ok) {
          const userData = await resp.json();
          setUser({ token, role: userData.role || localStorage.getItem('smartlogix_role'), pymeId: userData.pymeId || localStorage.getItem('smartlogix_pyme_id'), userId: userData.userId || localStorage.getItem('smartlogix_user_id') });
        }
        // if validation fails, keep token in localStorage but don't set user
      } catch (e) {
        // ignore errors in test env
      }
    })();
  }, []);


  const handleLogin = useCallback((userData) => {
    setUser(userData);
    setCurrentPath('inventory'); 
  }, []);


  const handleNavigate = useCallback((path) => {
    if (path === 'auth') {
      // logout: clear session storage and reset user state
      try {
        localStorage.removeItem('smartlogix_jwt');
        localStorage.removeItem('smartlogix_role');
        localStorage.removeItem('smartlogix_pyme_id');
        localStorage.removeItem('smartlogix_user_id');
      } catch (e) {
        // ignore
      }

      setUser(null);
    } else {
      setCurrentPath(path);
    }
  }, []);


  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }


  return (
    <DashboardLayout onNavigate={handleNavigate} currentPath={currentPath} userRole={user?.role}>
      {currentPath === 'inventory' && <InventoryView />}
      {currentPath === 'orders' && <OrderView />}
      {currentPath === 'users' && user?.role === 'ADMIN' && <UserManagementView />}
    </DashboardLayout>
  );
};

export default App;