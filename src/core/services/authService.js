// src/core/services/authService.js

const API_URL = import.meta.env.VITE_API_GATEWAY_URL;

export const loginReal = async (credentials) => {
  try {
    // Hacemos la petición POST al API Gateway, apuntando a la ruta del Auth Service
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error('Credenciales inválidas o error en el servidor');
    }

    // El backend (Auth Service) debería devolvernos un token JWT y datos del usuario
    const data = await response.json();
    
    // Guardamos el JWT en el localStorage para usarlo en futuras peticiones
    localStorage.setItem('smartlogix_jwt', data.token);
    
    return data;
  } catch (error) {
    console.error("Error en loginReal:", error);
    throw error;
  }
};

export const logoutReal = () => {
  localStorage.removeItem('smartlogix_jwt');
};