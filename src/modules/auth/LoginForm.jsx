// src/modules/auth/LoginForm.jsx
import React, { useState, useCallback } from 'react';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import { getCollection } from '../../core/storage/mockDatabase';

const LoginForm = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  // useCallback memoriza la función manejadora de cambios de los inputs
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  }, []);

  // useCallback memoriza la función de envío del formulario
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setError('');
    
    // Simulamos la validación contra la base de datos del microservicio Auth
    const users = getCollection('users');
    const validUser = users.find(
      u => u.email === credentials.email && u.password === credentials.password
    );

    if (validUser) {
      onLogin(validUser);
    } else {
      setError('Credenciales inválidas. Usa admin@smartlogix.com / password123');
    }
  }, [credentials, onLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <Card title="Ingreso a SmartLogix">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded text-sm font-sans">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 outline-none font-sans"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 outline-none font-sans"
                required
              />
            </div>
            <div className="pt-4 flex justify-center">
              <Button type="submit">
                Iniciar Sesión
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

// Memorizamos el componente completo
export default React.memo(LoginForm);