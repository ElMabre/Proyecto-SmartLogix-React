import axios from "axios";
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("smartlogix_jwt");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      console.error(
        "Acceso denegado o token expirado. Redirigiendo al login...",
      );
      localStorage.removeItem("smartlogix_jwt");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
