import { useState, useEffect, useMemo } from "react";
import axiosInstance from "../../core/api/axiosInstance";
import Card from "../../shared/components/Card";
import Button from "../../shared/components/Button";

const InventoryView = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    quantity: 1,
    price: "",
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get("/products");
      const sortedData = response.data.sort((a, b) => a.id - b.id);
      setProducts(sortedData);
    } catch (err) {
      setError(err.response?.data?.message || "Error al obtener el inventario");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.get("/products");
        const sortedData = response.data.sort((a, b) => a.id - b.id);
        setProducts(sortedData);
      } catch (err) {
        setError(
          err.response?.data?.message || "Error al obtener el inventario",
        );
      } finally {
        setLoading(false);
      }
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch de datos al montar, patrón estándar de React
    loadProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      quantity: product.totalQuantity,
      price: product.price,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleForm = () => {
    if (showForm) {
      setShowForm(false);
      setEditingProduct(null);
      setFormData({ name: "", quantity: 1, price: "" });
    } else {
      setShowForm(true);
    }
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    const price = parseFloat(formData.price);
    if (!formData.name.trim() || formData.quantity < 1) {
      setError("Por favor, ingresa un nombre válido y una cantidad mayor a 0.");
      return;
    }
    if (isNaN(price) || price <= 0) {
      setError("Por favor, ingresa un precio válido mayor a 0.");
      return;
    }

    const qty = parseInt(formData.quantity);
    const payload = {
      name: formData.name,
      totalQuantity: qty,
      price: price,
    };

    try {
      setLoading(true);
      setError(null);
      if (editingProduct) {
        await axiosInstance.put(`/products/${editingProduct.id}`, payload);
      } else {
        await axiosInstance.post("/products", payload);
      }
      setFormData({ name: "", quantity: 1, price: "" });
      setEditingProduct(null);
      setShowForm(false);
      await fetchProducts();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Error al ${editingProduct ? "actualizar" : "guardar"} el producto`,
      );
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return "-";
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const productsList = useMemo(() => {
    if (!products || products.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 font-sans border-2 border-dashed border-gray-200 rounded-lg">
          No hay productos en el inventario actualmente.
        </div>
      );
    }
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-sans">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-sans">
                Producto
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider font-sans">
                Precio
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider font-sans">
                Stock Disponible
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider font-sans">
                Stock Reservado
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider font-sans">
                Stock Total
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider font-sans">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr
                key={product.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-sans">
                  #{product.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-sans">
                  {product.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-700 font-sans">
                  {formatPrice(product.price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-sans">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${product.availableQuantity > 10 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {product.availableQuantity}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 font-sans">
                  {product.reservedQuantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-700 font-sans">
                  {product.totalQuantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-sans">
                  <button
                    onClick={() => handleEditClick(product)}
                    className="text-blue-600 hover:text-blue-900 font-medium transition-colors"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [products]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold text-gray-800">
          Catálogo de Inventario
        </h1>
        <Button onClick={handleToggleForm} disabled={loading}>
          {showForm ? "Cancelar" : "Nuevo Producto"}
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
            editingProduct
              ? `Editar Producto #${editingProduct.id}`
              : "Nuevo Producto"
          }
        >
          <form onSubmit={handleSubmitProduct} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ej. Silla Ergonomica"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 outline-none font-sans"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">
                  {editingProduct
                    ? "Modificar Cantidad Total"
                    : "Cantidad Inicial (Stock Total)"}
                </label>
                <input
                  type="number"
                  name="quantity"
                  min={editingProduct ? "0" : "1"}
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 outline-none font-sans"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">
                  Precio (CLP)
                </label>
                <input
                  type="number"
                  name="price"
                  min="1"
                  step="1"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="Ej. 15000"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 outline-none font-sans"
                  required
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-3">
              {editingProduct && (
                <button
                  type="button"
                  onClick={handleToggleForm}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 font-medium font-sans"
                >
                  Cancelar Edición
                </button>
              )}
              <Button type="submit" disabled={loading || !formData.name.trim()}>
                {loading
                  ? "Procesando..."
                  : editingProduct
                    ? "Actualizar Producto"
                    : "Guardar Producto"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {loading && products.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          productsList
        )}
      </Card>
    </div>
  );
};

export default InventoryView;
