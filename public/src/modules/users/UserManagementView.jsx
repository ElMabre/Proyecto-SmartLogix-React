// src/modules/users/UserManagementView.jsx
import React, { useState, useEffect } from 'react';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';

// In test environment, ensure scrollTo is a no-op to avoid jsdom errors
try {
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
    window.scrollTo = () => {}
  }
} catch (e) {}

const UserManagementView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Usamos pymeId (camelCase) para coincidir con el backend
  const [formData, setFormData] = useState({
    email: '', 
    nombre: '', 
    role: 'USER', 
    pymeId: '', 
    isActive: true,
    password: '' 
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('smartlogix_jwt');
      const response = await fetch('http://localhost:8080/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'pyme_id': '50' // Requerido por tu UserController
        }
      });
      
      if (response.status === 401 || response.status === 403) {
        throw new Error('Sesión expirada. Por favor, cierra sesión y vuelve a ingresar.');
      }
      if (!response.ok) throw new Error('Error al cargar los usuarios desde el servidor');
      
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleToggleStatus = async (user) => {
    try {
      const token = localStorage.getItem('smartlogix_jwt');
      const newStatus = !user.isActive;
      
      const response = await fetch(`http://localhost:8080/users/${user.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: newStatus })
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Sesión expirada. Por favor, cierra sesión y vuelve a ingresar.');
      }
      if (!response.ok) throw new Error('Error al cambiar el estado del usuario');
      
      await fetchUsers(); 
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (user) => {
    // Evitamos el error "uncontrolled input" asegurando que nunca sean undefined
    setFormData({
      email: user.email || '',
      nombre: user.nombre || '',
      role: user.role || 'USER',
      pymeId: user.pymeId || user.pyme_id || '', 
      isActive: user.isActive !== undefined ? user.isActive : true,
      password: '' 
    });
    setEditingId(user.id);
    setShowForm(true);
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      // jsdom may not implement scrollTo; ignore in tests
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('smartlogix_jwt');
      const url = editingId ? `http://localhost:8080/users/${editingId}` : 'http://localhost:8080/users';
      const method = editingId ? 'PUT' : 'POST';

      const payload = {
        email: formData.email,
        nombre: formData.nombre,
        role: formData.role,
        pymeId: parseInt(formData.pymeId),
        password: formData.password,
        isActive: formData.isActive
      };

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'pyme_id': formData.pymeId.toString() // Requerido por el @RequestHeader del backend
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Sesión expirada. Por favor, cierra sesión y vuelve a ingresar.');
      }
      if (!response.ok) throw new Error('Error al guardar el usuario en el servidor');

      setFormData({ email: '', nombre: '', role: 'USER', pymeId: '', isActive: true, password: '' });
      setShowForm(false);
      setEditingId(null);
      
      await fetchUsers(); 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ email: '', nombre: '', role: 'USER', pymeId: '', isActive: true, password: '' });
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold text-gray-800">Gestión de Usuarios</h1>
        <Button onClick={() => showForm ? handleCancel() : setShowForm(true)} disabled={loading}>
          {showForm ? 'Cancelar' : 'Nuevo Usuario'}
        </Button>
      </div>

      {error && <div className="p-3 bg-red-100 text-red-700 rounded font-sans text-sm">{error}</div>}

      {showForm && (
        <Card title={editingId ? `Editar Usuario #${editingId}` : "Crear Nuevo Usuario"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1 font-sans">Nombre Completo</label>
                <input id="nombre" type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 outline-none font-sans" required />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 font-sans">Correo Electrónico</label>
                <input id="email" type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 outline-none font-sans" required disabled={!!editingId} />
              </div>
              {!editingId && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 font-sans">Contraseña</label>
                  <input id="password" type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 outline-none font-sans" required={!editingId} />
                </div>
              )}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1 font-sans">Rol del Usuario</label>
                <select id="role" name="role" value={formData.role} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 outline-none font-sans bg-white">
                  <option value="USER">Usuario (Lectura/Escritura Pyme)</option>
                  <option value="ADMIN">Administrador Global</option>
                </select>
              </div>
              <div>
                <label htmlFor="pymeId" className="block text-sm font-medium text-gray-700 mb-1 font-sans">ID de Pyme Asignada</label>
                <input id="pymeId" type="number" name="pymeId" value={formData.pymeId} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 outline-none font-sans" required />
              </div>
            </div>
            
            <div className="pt-4 flex justify-end gap-2">
              <button type="button" onClick={handleCancel} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 font-sans font-medium">Cancelar</button>
              <Button type="submit">{editingId ? 'Actualizar Usuario' : 'Crear Usuario'}</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {loading && users.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500 font-sans">No hay usuarios registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm font-sans uppercase tracking-wider">
                  <th className="p-3 font-semibold">Usuario</th>
                  <th className="p-3 font-semibold">Rol</th>
                  <th className="p-3 font-semibold">PYME ID</th>
                  <th className="p-3 font-semibold">Estado</th>
                  <th className="p-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm font-sans divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      <div className="font-medium text-gray-800">{user.nombre}</div>
                      <div className="text-gray-500 text-xs">{user.email}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-gray-700">{user.pymeId || user.pyme_id}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${user.isActive === false ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {user.isActive === false ? 'INACTIVO' : 'ACTIVO'}
                      </span>
                    </td>
                    <td className="p-3 flex justify-end gap-2">
                      <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-800 px-2 py-1 border border-transparent hover:border-blue-200 rounded transition-colors">Editar</button>
                      <button onClick={() => handleToggleStatus(user)} className={`${user.isActive === false ? 'text-green-600 hover:text-green-800 hover:bg-green-50' : 'text-red-600 hover:text-red-800 hover:bg-red-50'} px-2 py-1 rounded transition-colors`}>
                        {user.isActive === false ? 'Habilitar' : 'Bloquear'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default React.memo(UserManagementView);