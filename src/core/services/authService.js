import axiosInstance from '../api/axiosInstance';

export const loginReal = async (credentials) => {
  try {
    // Axios formatea automáticamente el body a JSON y maneja la URL base
    const response = await axiosInstance.post('/auth/login', credentials);
    
    // El backend debe devolver el token dentro del objeto de respuesta
    const data = response.data;
    
    // Guardamos el JWT
    localStorage.setItem('smartlogix_jwt', data.token);
    
    return data;
  } catch (error) {
    console.error("Error en loginReal:", error);
    // Extraemos el mensaje real del backend si existe, de lo contrario usamos un fallback
    const errorMessage = error.response?.data?.message || 'Credenciales inválidas o error en el servidor';
    throw new Error(errorMessage, { cause: error });
  }
};

export const logoutReal = () => {
  localStorage.removeItem('smartlogix_jwt');
};