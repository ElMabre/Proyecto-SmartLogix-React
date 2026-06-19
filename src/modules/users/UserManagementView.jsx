import React, { useState, useEffect, useCallback } from "react";
import Card from "../../shared/components/Card";
import Button from "../../shared/components/Button";

const API_BASE = import.meta.env.VITE_API_GATEWAY_URL || "";

const getAuthHeaders = (extraHeaders = {}) => {
  const token = localStorage.getItem("smartlogix_jwt");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
};

const UserManagementView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    email: "",
    nombre: "",
    role: "USER",
    pymeId: "",
    isActive: true,
    password: "",
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/users`, {
        headers: getAuthHeaders({ pyme_id: "50" }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Sesión expirada");
        }
        let errMsg = "Error al cargar los usuarios desde el servidor";
        if (typeof response.json === "function") {
          try {
            const errData = await response.json();
            if (errData?.message) errMsg = errData.message;
          } catch (e) {}
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchUsers();
    };
    loadData();
  }, [fetchUsers]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = !user.isActive;
      
      const response = await fetch(`${API_BASE}/users/${user.id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Error al cambiar el estado del usuario");
      }

      await fetchUsers();
    } catch (err) {
      setError("Error al cambiar el estado del usuario");
    }
  };

  const handleEdit = (user) => {
    setFormData({
      email: user.email || "",
      nombre: user.nombre || "",
      role: user.role || "USER",
      pymeId: user.pymeId || user.pyme_id || "",
      isActive: user.isActive !== undefined ? user.isActive : true,
      password: "",
    });
    setEditingId(user.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const pymeIdNum = parseInt(formData.pymeId);
      if (isNaN(pymeIdNum) || pymeIdNum <= 0) {
        setError("El ID de Pyme debe ser un número positivo.");
        setSaving(false);
        return;
      }

      const payload = {
        email: formData.email,
        nombre: formData.nombre,
        role: formData.role,
        pymeId: pymeIdNum,
        password: formData.password,
        isActive: formData.isActive,
      };

      const url = editingId ? `${API_BASE}/users/${editingId}` : `${API_BASE}/users`;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders({ pyme_id: formData.pymeId.toString() }),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Error al guardar el usuario en el servidor");
      }

      setFormData({
        email: "",
        nombre: "",
        role: "USER",
        pymeId: "",
        isActive: true,
        password: "",
      });
      setShowForm(false);
      setEditingId(null);

      await fetchUsers();
    } catch (err) {
      setError("Error al guardar el usuario en el servidor");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      email: "",
      nombre: "",
      role: "USER",
      pymeId: "",
      isActive: true,
      password: "",
    });
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold text-gray-800">
          Gestión de Usuarios
        </h1>
        <Button
          onClick={() => (showForm ? handleCancel() : setShowForm(true))}
          disabled={saving || loading}
        >
          {showForm ? "Cancelar" : "Nuevo Usuario"}
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded font-sans text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <Card
          title={
            editingId ? `Editar Usuario #${editingId}` : "Crear Nuevo Usuario"
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="user-nombre"
                  className="block text-sm font-medium text-gray-700 mb-1 font-sans"
                >
                  Nombre Completo
                </label>
                <input
                  id="user-nombre"
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 outline-none font-sans"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="user-email"
                  className="block text-sm font-medium text-gray-700 mb-1 font-sans"
                >
                  Correo Electrónico
                </label>
                <input
                  id="user-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 outline-none font-sans"
                  required
                  disabled={!!editingId}
                />
              </div>
              {!editingId && (
                <div>
                  <label
                    htmlFor="user-password"
                    className="block text-sm font-medium text-gray-700 mb-1 font-sans"
                  >
                    Contraseña
                  </label>
                  <input
                    id="user-password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 outline-none font-sans"
                    required={!editingId}
                  />
                </div>
              )}
              <div>
                <label
                  htmlFor="user-role"
                  className="block text-sm font-medium text-gray-700 mb-1 font-sans"
                >
                  Rol del Usuario
                </label>
                <select
                  id="user-role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 outline-none font-sans bg-white"
                >
                  <option value="USER">Usuario (Lectura/Escritura Pyme)</option>
                  <option value="ADMIN">Administrador Global</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="user-pymeId"
                  className="block text-sm font-medium text-gray-700 mb-1 font-sans"
                >
                  ID de Pyme Asignada
                </label>
                <input
                  id="user-pymeId"
                  type="number"
                  name="pymeId"
                  value={formData.pymeId}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 outline-none font-sans"
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 font-sans font-medium"
              >
                Cancelar
              </button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Guardando..."
                  : editingId
                    ? "Actualizar Usuario"
                    : "Crear Usuario"}
              </Button>
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
          <div className="text-center py-8 text-gray-500 font-sans">
            No hay usuarios registrados.
          </div>
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
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-3">
                      <div className="font-medium text-gray-800">
                        {user.nombre}
                      </div>
                      <div className="text-gray-500 text-xs">{user.email}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${user.role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}
                      >
                        {user.role === "ADMIN" ? "Administrador" : user.role}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-gray-700">
                      {user.pymeId || user.pyme_id}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${user.isActive === false ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                      >
                        {user.isActive === false ? "INACTIVO" : "ACTIVO"}
                      </span>
                    </td>
                    <td className="p-3 flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-800 px-2 py-1 border border-transparent hover:border-blue-200 rounded transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`${user.isActive === false ? "text-green-600 hover:text-green-800 hover:bg-green-50" : "text-red-600 hover:text-red-800 hover:bg-red-50"} px-2 py-1 rounded transition-colors`}
                      >
                        {user.isActive === false ? "Habilitar" : "Bloquear"}
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