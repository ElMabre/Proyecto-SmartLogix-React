// src/modules/orders/OrderView.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';

const OrderView = () => {
  // 1. Definimos los tres estados clave
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función encapsulada para obtener los pedidos, así podemos reutilizarla
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/v1/orders');
      if (!response.ok) throw new Error('Error al obtener los pedidos');
      
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Cargar pedidos al montar el componente
  useEffect(() => {
    fetchOrders();
  }, []); // Dependencias vacías para que se ejecute solo al montar

  // 3. Modificamos la creación para que haga un POST real al Gateway
  const handleCreateOrder = useCallback(async () => {
    const newOrder = {
      // Nota: Asegúrate de que estos campos coincidan con tu OrderRequest de Spring Boot
      customer: 'Cliente de Prueba PYME',
      total: 15500,
      status: 'Procesando',
      date: new Date().toISOString().split('T')[0],
    };

    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOrder),
      });

      if (!response.ok) throw new Error('Error al registrar el pedido en el backend');
      
      // Si se crea correctamente, recargamos la lista desde el servidor
      await fetchOrders();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  // Memorizamos el renderizado de la lista de pedidos
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
              <span className="font-heading font-semibold text-gray-800">#{order.id}</span>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium font-sans">
                {order.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 font-sans mb-1">
              <span className="font-medium">Cliente:</span> {order.customer}
            </p>
            <p className="text-sm text-gray-600 font-sans mb-1">
              <span className="font-medium">Fecha:</span> {order.date}
            </p>
            <p className="text-lg font-heading font-bold text-gray-900 mt-2">
              ${order.total.toLocaleString('es-CL')}
            </p>
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