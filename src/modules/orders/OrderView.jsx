import React, { useState, useEffect, useMemo } from "react";
import Card from "../../shared/components/Card";
import Button from "../../shared/components/Button";
import axiosInstance from "../../core/api/axiosInstance";

const IVA_RATE = 0.19;

const getStatusColor = (status) => {
  switch (status) {
    case "Confirmado":
      return "bg-green-100 text-green-800";
    case "Cancelado por falta de stock":
      return "bg-red-100 text-red-800";
    case "Pendiente":
      return "bg-yellow-100 text-yellow-800";
    case "Enviado":
      return "bg-purple-100 text-purple-800";
    case "Entregado":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const ORDER_STATUSES = [
  { value: "PENDING", label: "Pendiente" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "SHIPPED", label: "Enviado" },
  { value: "DELIVERED", label: "Entregado" },
  { value: "CANCELLED_NO_STOCK", label: "Cancelado (Sin Stock)" },
];

const OrderView = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  const [formData, setFormData] = useState({
    productId: "",
    quantity: 1,
    customerName: "",
    customerRut: "",
    customerEmail: "",
    shippingAddress: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ordersRes, productsRes] = await Promise.all([
        axiosInstance.get("/orders"),
        axiosInstance.get("/products"),
      ]);
      setOrders(ordersRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Error al obtener los datos del servidor",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [ordersRes, productsRes] = await Promise.all([
          axiosInstance.get("/orders"),
          axiosInstance.get("/products"),
        ]);
        setOrders(ordersRes.data);
        setProducts(productsRes.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Error al obtener los datos del servidor",
        );
      } finally {
        setLoading(false);
      }
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch de datos al montar, patrón estándar de React
    loadData();
  }, []);

  // Precio del producto seleccionado, calculado en tiempo real
  const selectedProduct = useMemo(() => {
    if (!formData.productId) return null;
    return products.find((p) => p.id === parseInt(formData.productId)) || null;
  }, [formData.productId, products]);

  const subtotal = selectedProduct
    ? selectedProduct.price * parseInt(formData.quantity || 1)
    : 0;
  const iva = subtotal * IVA_RATE;
  const totalAmount = subtotal + iva;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!formData.productId || formData.quantity < 1) {
      setError("Por favor, selecciona un producto y una cantidad válida.");
      return;
    }
    if (!selectedProduct) {
      setError("Producto no encontrado.");
      return;
    }

    const newOrder = {
      customerName: formData.customerName,
      customerRut: formData.customerRut,
      customerEmail: formData.customerEmail,
      shippingAddress: formData.shippingAddress,
      totalAmount: totalAmount,
      items: [
        {
          productId: parseInt(formData.productId),
          quantity: parseInt(formData.quantity),
        },
      ],
    };

    try {
      setLoading(true);
      setError(null);
      await axiosInstance.post("/orders", newOrder);
      setFormData({
        productId: "",
        quantity: 1,
        customerName: "",
        customerRut: "",
        customerEmail: "",
        shippingAddress: "",
      });
      setShowForm(false);
      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Error al registrar el pedido en el backend",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setStatusUpdateLoading(true);
      await axiosInstance.patch(`/orders/${orderId}/status`, {
        status: newStatus,
      });

      const [ordersRes, productsRes] = await Promise.all([
        axiosInstance.get("/orders"),
        axiosInstance.get("/products"),
      ]);
      setOrders(ordersRes.data);
      setProducts(productsRes.data);

      const updatedOrder = ordersRes.data.find((o) => o.id === orderId);
      if (updatedOrder) setSelectedOrder(updatedOrder);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Error al actualizar el estado en el servidor",
      );
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const openDetailsModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const formatCurrency = (amount) => {
    if (amount == null) return "$0";
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(amount);
  };

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
          <div
            key={order.id}
            className="border border-gray-200 rounded p-4 shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col"
          >
            <div className="flex justify-between mb-2">
              <span className="font-heading font-semibold text-gray-800">
                Pedido #{order.id}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded font-medium font-sans ${getStatusColor(order.status)}`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 font-sans mb-1 truncate">
              <span className="font-medium">Cliente:</span>{" "}
              {order.customerName || "N/A"}
            </p>
            <p className="text-sm text-gray-600 font-sans mb-1 truncate">
              <span className="font-medium">Destino:</span>{" "}
              {order.shippingAddress || "N/A"}
            </p>
            <p className="text-sm text-gray-600 font-sans mb-3">
              <span className="font-medium">Total:</span>{" "}
              {formatCurrency(order.totalAmount)}
            </p>
            <div className="mt-auto pt-3 border-t border-gray-100">
              <button
                onClick={() => openDetailsModal(order)}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Ver Detalles / Gestionar Estado
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }, [orders]);

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold text-gray-800">
          Gestión de Pedidos
        </h1>
        <Button onClick={() => setShowForm(!showForm)} disabled={loading}>
          {showForm ? "Cancelar" : "Nuevo Pedido"}
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded font-sans text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <Card title="Crear Nuevo Pedido Logístico">
          <form onSubmit={handleSubmitOrder} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-100 pb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="Ej. Juan Pérez"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 outline-none font-sans"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">
                  RUT del Cliente
                </label>
                <input
                  type="text"
                  name="customerRut"
                  value={formData.customerRut}
                  onChange={handleInputChange}
                  placeholder="Ej. 12.345.678-9"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 outline-none font-sans"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  placeholder="juan@ejemplo.com"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 outline-none font-sans"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">
                  Dirección de Despacho
                </label>
                <input
                  type="text"
                  name="shippingAddress"
                  value={formData.shippingAddress}
                  onChange={handleInputChange}
                  placeholder="Av. Providencia 123, Santiago"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 outline-none font-sans"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">
                  Seleccionar Producto
                </label>
                <select
                  name="productId"
                  value={formData.productId}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 outline-none font-sans bg-white"
                  required
                >
                  <option value="" disabled>
                    -- Elige un producto --
                  </option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} —{" "}
                      {new Intl.NumberFormat("es-CL", {
                        style: "currency",
                        currency: "CLP",
                        maximumFractionDigits: 0,
                      }).format(p.price)}{" "}
                      (Stock: {p.availableQuantity})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">
                  Cantidad
                </label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 outline-none font-sans"
                  required
                />
              </div>
            </div>

            {/* Resumen de precio en tiempo real */}
            {selectedProduct && (
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm font-sans space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>
                    Subtotal ({formData.quantity} ×{" "}
                    {formatCurrency(selectedProduct.price)}):
                  </span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>IVA (19%):</span>
                  <span>{formatCurrency(iva)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 border-t pt-1 mt-1">
                  <span>Total a pagar:</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={loading || !formData.productId}>
                {loading ? "Procesando..." : "Confirmar Pedido"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {loading && orders.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          ordersList
        )}
      </Card>

      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-lg font-heading font-bold text-gray-800">
                Detalles del Pedido #{selectedOrder.id}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4 font-sans">
              <div className="bg-blue-50 p-3 rounded border border-blue-100">
                <h4 className="text-xs uppercase tracking-wider text-blue-800 font-semibold mb-2">
                  Gestionar Estado
                </h4>
                <div className="flex items-center gap-3">
                  <select
                    className="p-2 border border-gray-300 rounded w-full text-sm font-sans focus:ring-blue-500 outline-none disabled:bg-gray-100"
                    value={
                      selectedOrder.status === "Confirmado"
                        ? "CONFIRMED"
                        : selectedOrder.status === "Pendiente"
                          ? "PENDING"
                          : selectedOrder.status === "Enviado"
                            ? "SHIPPED"
                            : selectedOrder.status === "Entregado"
                              ? "DELIVERED"
                              : "CANCELLED_NO_STOCK"
                    }
                    onChange={(e) =>
                      handleStatusChange(selectedOrder.id, e.target.value)
                    }
                    disabled={statusUpdateLoading}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  {statusUpdateLoading && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                  Datos del Cliente
                </h4>
                <div className="bg-gray-50 p-3 rounded border text-sm text-gray-700 space-y-1">
                  <p>
                    <span className="font-medium">Nombre:</span>{" "}
                    {selectedOrder.customerName || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">RUT:</span>{" "}
                    {selectedOrder.customerRut || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Correo:</span>{" "}
                    {selectedOrder.customerEmail || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Dirección:</span>{" "}
                    {selectedOrder.shippingAddress || "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                  Artículos Solicitados
                </h4>
                <div className="bg-gray-50 p-3 rounded border text-sm text-gray-700">
                  <ul className="divide-y divide-gray-200">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item, idx) => {
                        const prod = products.find(
                          (p) => p.id === item.productId,
                        );
                        return (
                          <li key={idx} className="py-2 flex justify-between">
                            <span>
                              {prod
                                ? prod.name
                                : `Producto ID ${item.productId}`}{" "}
                              <span className="text-gray-500 font-semibold">
                                x{item.quantity}
                              </span>
                            </span>
                            {prod && (
                              <span className="text-gray-600">
                                {formatCurrency(prod.price * item.quantity)}
                              </span>
                            )}
                          </li>
                        );
                      })
                    ) : (
                      <li className="py-2 text-gray-500">
                        No hay artículos detallados.
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                  Resumen de Pago
                </h4>
                <div className="bg-gray-50 p-3 rounded border text-sm text-gray-700 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>
                      {formatCurrency(selectedOrder.totalAmount / 1.19)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>IVA (19%):</span>
                    <span>
                      {formatCurrency(
                        selectedOrder.totalAmount -
                          selectedOrder.totalAmount / 1.19,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 border-t pt-2 mt-2">
                    <span>Total Pagado:</span>
                    <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t p-4 flex justify-end">
              <Button onClick={() => setIsModalOpen(false)}>
                Cerrar Panel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(OrderView);
