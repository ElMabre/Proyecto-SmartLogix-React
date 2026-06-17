import React, { useState, useEffect, useMemo } from "react";
import Card from "../../shared/components/Card";
import Button from "../../shared/components/Button";
import axiosInstance from "../../core/api/axiosInstance";

const getShippingStatusColor = (status) => {
  switch (status) {
    case "Pendiente":
      return "bg-yellow-100 text-yellow-800";
    case "Confirmado":
      return "bg-green-100 text-green-800";
    case "Enviado":
      return "bg-purple-100 text-purple-800";
    case "Entregado":
      return "bg-blue-100 text-blue-800";
    case "Cancelado por falta de stock":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const shortTrackingId = (id) => {
  if (!id) return "N/A";
  return id.length > 13 ? `${id.slice(0, 8)}…` : id;
};

const copyToClipboard = (text) => {
  if (text) navigator.clipboard.writeText(text);
};

const ShippingView = () => {
  const [shipments, setShipments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedShipment, setSelectedShipment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [trackingQuery, setTrackingQuery] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState(null);

  const fetchData = async () => {
    try {
      const [shipmentsRes, ordersRes] = await Promise.all([
        axiosInstance.get("/shipping"),
        axiosInstance.get("/orders"),
      ]);
      setShipments(shipmentsRes.data);
      setOrders(ordersRes.data);
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Error al obtener los envíos del servidor",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch de datos al montar, patrón estándar de React
    fetchData();
  }, []);

  const ordersById = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      map[o.id] = o;
    });
    return map;
  }, [orders]);

  const openDetailsModal = (shipment) => {
    setSelectedShipment(shipment);
    setIsModalOpen(true);
  };

  const formatCurrency = (amount) => {
    if (amount == null) return "$0";
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(amount);
  };

  const formatDate = (value) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleString("es-CL", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const handleTrackingSearch = async (e) => {
    e.preventDefault();
    if (!trackingQuery.trim()) return;

    try {
      setTrackingLoading(true);
      setTrackingError(null);
      const res = await axiosInstance.get(
        `/shipping/tracking/${trackingQuery.trim()}`,
      );
      openDetailsModal(res.data);
    } catch (err) {
      setTrackingError(
        err.response?.data?.message ||
          "No se encontró un envío con ese código de seguimiento",
      );
    } finally {
      setTrackingLoading(false);
    }
  };

  const shipmentsList = useMemo(() => {
    if (!shipments || shipments.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 font-sans border-2 border-dashed border-gray-200 rounded-lg">
          No hay envíos registrados actualmente.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shipments.map((shipment) => {
          const relatedOrder = ordersById[shipment.orderId];
          return (
            <div
              key={shipment.id}
              className="border border-gray-200 rounded p-4 shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col"
            >
              <div className="flex justify-between mb-2">
                <span className="font-heading font-semibold text-gray-800">
                  Envío #{shipment.id}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded font-medium font-sans ${getShippingStatusColor(relatedOrder?.status)}`}
                >
                  {relatedOrder?.status || shipment.status || "Sin estado"}
                </span>
              </div>
              <p className="text-sm text-gray-600 font-sans mb-1 truncate">
                <span className="font-medium">Pedido:</span> #{shipment.orderId}
              </p>
              <p className="text-sm text-gray-600 font-sans mb-1 truncate">
                <span className="font-medium">Cliente:</span>{" "}
                {relatedOrder?.customerName || "N/A"}
              </p>
              <p className="text-sm text-gray-600 font-sans mb-1 truncate">
                <span className="font-medium">Tracking:</span>{" "}
                {shortTrackingId(shipment.trackingId)}
              </p>
              <p className="text-sm text-gray-600 font-sans mb-3">
                <span className="font-medium">Estimado:</span>{" "}
                {shipment.estimatedDays != null
                  ? `${shipment.estimatedDays} días`
                  : "N/A"}
              </p>

              <div className="mt-auto pt-3 border-t border-gray-100">
                <button
                  onClick={() => openDetailsModal(shipment)}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Ver Detalles del Envío
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [shipments, ordersById]);

  const modalOrder = selectedShipment
    ? ordersById[selectedShipment.orderId]
    : null;

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold text-gray-800">
          Gestión de Envíos
        </h1>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded font-sans text-sm">
          {error}
        </div>
      )}

      <Card title="Buscar por Código de Seguimiento">
        <form onSubmit={handleTrackingSearch} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">
              Tracking ID
            </label>
            <input
              type="text"
              value={trackingQuery}
              onChange={(e) => setTrackingQuery(e.target.value)}
              placeholder="Pega aquí el Tracking ID completo"
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 outline-none font-sans"
            />
          </div>
          <Button type="submit" disabled={trackingLoading}>
            {trackingLoading ? "Buscando..." : "Buscar"}
          </Button>
        </form>
        {trackingError && (
          <p className="text-sm text-red-600 font-sans mt-2">{trackingError}</p>
        )}
      </Card>

      <Card>
        {loading && shipments.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          shipmentsList
        )}
      </Card>

      {isModalOpen && selectedShipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-lg font-heading font-bold text-gray-800">
                Detalles del Envío #{selectedShipment.id}
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
                  ESTADO
                </h4>
                <span
                  className={`text-xs px-2 py-1 rounded font-medium ${getShippingStatusColor(modalOrder?.status)}`}
                >
                  {modalOrder?.status ||
                    selectedShipment.status ||
                    "Sin estado"}
                </span>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                  Datos del Envío
                </h4>
                <div className="bg-gray-50 p-3 rounded border text-sm text-gray-700 space-y-1">
                  <p>
                    <span className="font-medium">Pedido asociado:</span> #
                    {selectedShipment.orderId}
                  </p>
                  <p className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">Tracking ID:</span>
                    <span className="font-mono text-xs break-all">
                      {selectedShipment.trackingId}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(selectedShipment.trackingId)
                      }
                      className="text-blue-600 hover:text-blue-800 text-xs underline"
                    >
                      Copiar
                    </button>
                  </p>
                  <p>
                    <span className="font-medium">Tipo de envío:</span>{" "}
                    {selectedShipment.shippingType || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Días estimados:</span>{" "}
                    {selectedShipment.estimatedDays != null
                      ? `${selectedShipment.estimatedDays} días`
                      : "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Costo:</span>{" "}
                    {formatCurrency(selectedShipment.cost)}
                  </p>
                  <p>
                    <span className="font-medium">Creado:</span>{" "}
                    {formatDate(selectedShipment.createdAt)}
                  </p>
                </div>
              </div>

              {modalOrder && (
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                    Datos del Cliente
                  </h4>
                  <div className="bg-gray-50 p-3 rounded border text-sm text-gray-700 space-y-1">
                    <p>
                      <span className="font-medium">Nombre:</span>{" "}
                      {modalOrder.customerName || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Dirección:</span>{" "}
                      {modalOrder.shippingAddress || "N/A"}
                    </p>
                  </div>
                </div>
              )}
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

export default React.memo(ShippingView);
