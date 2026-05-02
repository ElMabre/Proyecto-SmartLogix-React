// src/modules/orders/OrderView.jsx
import React, { useEffect, useCallback, useMemo } from 'react';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import { useMockApi } from '../../core/hooks/useMockApi';

const OrderView = () => {
  const { data: orders, loading, error, fetchData, createData } = useMockApi('orders');

  // Cargar pedidos al montar el componente
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memorizamos la función de creación para no re-instanciarla en cada render
  const handleCreateMockOrder = useCallback(async () => {
    const newOrder = {
      customer: 'Cliente de Prueba PYME',
      total: 15500,
      status: 'Procesando',
      date: new Date().toISOString().split('T')[0], // Fecha en formato YYYY-MM-DD
    };
    await createData(newOrder);
  }, [createData]);

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
        <Button onClick={handleCreateMockOrder} disabled={loading}>
          {loading ? 'Creando...' : 'Crear Pedido de Prueba'}
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