// src/modules/inventory/InventoryView.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Card from '../../shared/components/Card';

const InventoryView = () => {
  // 1. Definimos los tres estados clave para manejar la llamada a la API
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. useEffect para conectar con el API Gateway (BFF) al montar el componente
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        // Asegúrate de que este endpoint coincida con las rutas expuestas por tu API Gateway
        const response = await fetch('http://localhost:8080/api/v1/inventory');
        if (!response.ok) throw new Error('Error al obtener el inventario de SmartLogix');
        
        const data = await response.json();
        setInventory(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []); // El arreglo vacío asegura que la petición se hace solo una vez al cargar la vista

  // Memorizamos el renderizado de las filas de la tabla para optimizar el rendimiento
  // Esto evita procesar el map() de nuevo si el estado 'inventory' no ha cambiado
  const tableRows = useMemo(() => {
    if (!inventory || inventory.length === 0) {
      return (
        <tr>
          <td colSpan="5" className="px-4 py-4 text-center text-gray-500 font-sans">
            No hay productos en el inventario.
          </td>
        </tr>
      );
    }

    return inventory.map((product) => (
      <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3 font-sans text-sm text-gray-600">{product.sku}</td>
        <td className="px-4 py-3 font-sans text-sm text-gray-800 font-medium">{product.name}</td>
        <td className="px-4 py-3 font-sans text-sm text-gray-600 text-right">{product.stock} und.</td>
        {/* Formateamos el precio como CLP (Pesos Chilenos) */}
        <td className="px-4 py-3 font-sans text-sm text-gray-600 text-right">
          ${product.price.toLocaleString('es-CL')}
        </td>
        <td className="px-4 py-3 font-sans text-sm text-center">
          <span className={`px-2 py-1 rounded text-xs font-medium ${product.stock > 50 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
            {product.stock > 50 ? 'Óptimo' : 'Bajo Stock'}
          </span>
        </td>
      </tr>
    ));
  }, [inventory]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold text-gray-800">
          Catálogo de Inventario
        </h1>
      </div>

      <Card>
        {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded font-sans text-sm">{error}</div>}
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 font-heading font-semibold text-sm text-gray-700">SKU</th>
                  <th className="px-4 py-3 font-heading font-semibold text-sm text-gray-700">Producto</th>
                  <th className="px-4 py-3 font-heading font-semibold text-sm text-gray-700 text-right">Stock</th>
                  <th className="px-4 py-3 font-heading font-semibold text-sm text-gray-700 text-right">Precio</th>
                  <th className="px-4 py-3 font-heading font-semibold text-sm text-gray-700 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {tableRows}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

// Exportamos envuelto en React.memo
export default React.memo(InventoryView);