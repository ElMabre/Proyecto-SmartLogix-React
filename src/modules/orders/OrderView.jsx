// src/modules/orders/OrderView.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';

const OrderView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('smartlogix_jwt');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://localhost:8080/orders', {
        method: 'GET',
        headers: headers,
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('No tienes autorización para ver los pedidos (403 Forbidden).');
        }
        throw new Error('Error al obtener los pedidos');
      }
      
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCreateOrder = useCallback(async () => {
    // Ajustado exactamente a lo que espera OrderRequest.java
    const newOrder = {
      items: [
        {
          productId: 1, // ID de producto de prueba (asegúrate de que exista en tu DB)
          quantity: 2   // Cantidad que estamos solicitando
        }
      ]
    };

    try {
      setLoading(true);
      
      const token = localStorage.getItem('smartlogix_jwt');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://localhost:8080/orders', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(newOrder),
      });

      if (!response.ok) {
        throw new Error('Error al registrar el pedido en el backend');
      }
      
      // Recargamos la lista desde el servidor
      await fetchOrders();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  const ordersList = useMemo(() => {
    if (!orders || orders.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 font-sans border-2 border-dashed border-gray-200 rounded-lg">
          No hay pedidos registrados actualmente.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((order) => (
          <div key={order.id} className="border border-gray-200 rounded p-4 shadow-sm hover:shadow-md transition-shadow bg-white">
            <div className="flex justify-between mb-2">
              <span className="font-heading font-semibold text-gray-800">Pedido #{order.id}</span>
              <span className={`text-xs px-2 py-1 rounded font-medium font-sans ${order.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : order.status === 'CANCELLED_NO_STOCK' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                {order.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 font-sans mb-1">
              <span className="font-medium">Usuario ID:</span> {order.userId || 'N/A'}
            </p>
            <p className="text-sm text-gray-600 font-sans mb-1">
              <span className="font-medium">Fecha:</span> {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
            </p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-medium">Artículos: {order.items ? order.items.length : 0}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }, [orders]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold text-gray-800">
          Gestión de Pedidos
        </h1>
        <Button onClick={handleCreateOrder} disabled={loading}>
          {loading ? 'Procesando...' : 'Crear Pedido de Prueba'}
        </Button>
      </div>

      <Card>
        {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded font-sans text-sm">{error}</div>}
        
        {loading && orders.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          ordersList
        )}
      </Card>
    </div>
  );
};

export default React.memo(OrderView);