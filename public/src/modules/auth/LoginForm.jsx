import React, { useState, useCallback } from 'react';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';

const LoginForm = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Credenciales inválidas o error de conexión con SmartLogix.');
      }
      const userData = await response.json();
      
      if (userData && userData.token) {
        localStorage.setItem('smartlogix_jwt', userData.token);
        localStorage.setItem('smartlogix_pyme_id', userData.pymeId); 
        localStorage.setItem('smartlogix_role', userData.role);      
        localStorage.setItem('smartlogix_user_id', userData.userId); 
      }
      onLogin(userData);
    } catch (err) {
      if (err && err.message && err.message.includes('Credenciales inválidas')) {
        setError(err.message);
      } else {
        setError('Error al conectar con el servidor.');
      }
    } finally {
      setLoading(false);
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
              <label htmlFor="loginEmail" className="block text-sm font-medium text-gray-700 mb-1 font-sans">
                Correo Electrónico
              </label>
              <input
                id="loginEmail"
                type="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 outline-none font-sans"
                required
              />
            </div>
            <div>
              <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-700 mb-1 font-sans">
                Contraseña
              </label>
              <input
                id="loginPassword"
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 outline-none font-sans"
                required
              />
            </div>
            <div className="pt-4 flex justify-center">
              <Button type="submit" disabled={loading}>
                {loading ? 'Conectando...' : 'Iniciar Sesión'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default React.memo(LoginForm);