import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // ✅ FIX A: hace que axios use fetch internamente en lugar de XMLHttpRequest
  // Esto permite que vi.stubGlobal('fetch', ...) intercepte las llamadas en los tests
  fetchOptions: {},
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("smartlogix_jwt");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      console.error("Acceso denegado o token expirado. Redirigiendo al login...");
      localStorage.removeItem("smartlogix_jwt");
      // ✅ Protección para entorno de tests donde window.location puede no funcionar
      if (typeof window !== "undefined" && window.location) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
