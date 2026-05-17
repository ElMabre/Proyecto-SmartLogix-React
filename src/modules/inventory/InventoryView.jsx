// src/modules/inventory/InventoryView.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Card from '../../shared/components/Card';

const InventoryView = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const token = localStorage.getItem('smartlogix_jwt');
        
        const headers = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('http://localhost:8080/products', {
          method: 'GET',
          headers: headers,
        });

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('No tienes autorización para acceder al inventario (403 Forbidden).');
          }
          throw new Error('Error al obtener el inventario de SmartLogix');
        }
        
        const data = await response.json();
        setInventory(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []); 

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

    return inventory.map((product) => {
      // Extraemos los datos reales que envía Spring Boot y damos valores por defecto por seguridad
      const stock = product.availableQuantity || 0;
      const price = product.price || 0;
      const sku = product.sku || `PRD-${product.id}`;

      return (
        <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
          <td className="px-4 py-3 font-sans text-sm text-gray-600">{sku}</td>
          <td className="px-4 py-3 font-sans text-sm text-gray-800 font-medium">{product.name}</td>
          <td className="px-4 py-3 font-sans text-sm text-gray-600 text-right">{stock} und.</td>
          <td className="px-4 py-3 font-sans text-sm text-gray-600 text-right">
            ${price.toLocaleString('es-CL')}
          </td>
          <td className="px-4 py-3 font-sans text-sm text-center">
            <span className={`px-2 py-1 rounded text-xs font-medium ${stock > 50 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
              {stock > 50 ? 'Óptimo' : 'Bajo Stock'}
            </span>
          </td>
        </tr>
      );
    });
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

export default React.memo(InventoryView);