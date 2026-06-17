import axios from 'axios';

// Instancia global apuntando al API Gateway
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de peticiones para inyectar el JWT
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smartlogix_jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuestas para manejo de errores globales (ej. token expirado)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error("Acceso denegado o token expirado. Redirigiendo al login...");
      localStorage.removeItem('smartlogix_jwt');
      // Aquí más adelante podemos forzar un logout en la UI o recargar la página
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;