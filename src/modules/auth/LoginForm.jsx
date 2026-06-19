import React, { useState, useCallback } from "react";
import Card from "../../shared/components/Card";
import Button from "../../shared/components/Button";

const API_BASE = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8080";

const LoginForm = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");

      if (!credentials.email.trim() || !credentials.password.trim()) {
        setError("Por favor, ingresa tu correo y contraseña.");
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(credentials),
        });

        const isOk = response.ok === undefined ? true : response.ok;
        let userData;

        if (typeof response.json === "function") {
          try {
            userData = await response.json();
          } catch (err) {
            if (isOk) throw new Error("JSON malformado");
            userData = {};
          }
        } else {
          userData = response.data !== undefined ? response.data : response;
        }

        if (!isOk || userData?.error) {
          throw new Error(userData?.message || `Error ${response.status || 500}`);
        }

        if (userData && userData.token) {
          localStorage.setItem("smartlogix_jwt", userData.token);
          localStorage.setItem("smartlogix_pyme_id", userData.pymeId);
          localStorage.setItem("smartlogix_role", userData.role);
          localStorage.setItem("smartlogix_user_id", userData.userId);
        }
        onLogin(userData);
      } catch (err) {
        let msg = err.message || "";
        const msgLower = msg.toLowerCase();
        
        if (msg === "JSON malformado") {
          setError("Error al conectar con el servidor");
          return;
        }

        const isGeneric =
          msgLower.includes("timeout") ||
          msgLower.includes("network") ||
          msgLower.includes("abort") ||
          msgLower.includes("failed to fetch") ||
          err.name === "TypeError" ||
          err.name === "SyntaxError" ||
          msg.includes("is not a function");

        if (isGeneric) {
          setError("Error al conectar con el servidor");
        } else {
          setError("Credenciales inválidas o error de conexión con SmartLogix.");
        }
      } finally {
        setLoading(false);
      }
    },
    [credentials, onLogin],
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <Card title="Ingreso a SmartLogix">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded text-sm font-sans">
                {error}
              </div>
            )}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1 font-sans"
              >
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 outline-none font-sans"
                required
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1 font-sans"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 outline-none font-sans"
                required
              />
            </div>
            <div className="pt-4 flex justify-center">
              <Button type="submit" disabled={loading}>
                {loading ? "Conectando..." : "Iniciar Sesión"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default React.memo(LoginForm);