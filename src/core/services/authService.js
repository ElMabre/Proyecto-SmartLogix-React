export const loginReal = async (credentials) => {
  try {
    const API_BASE = import.meta.env.VITE_API_GATEWAY_URL || "";
    
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      let errorMessage = "Credenciales inválidas o error en el servidor";
    
      if (typeof response.json === "function") {
        try {
          const errorData = await response.json();
          if (errorData?.message) errorMessage = errorData.message;
        } catch (e) {
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    localStorage.setItem("smartlogix_jwt", data.token);

    return data;
    
  } catch (error) {
    console.error("Error en loginReal:", error);
    const finalMessage = error.message || "Credenciales inválidas o error en el servidor";
    throw new Error(finalMessage, { cause: error });
  }
};

export const logoutReal = () => {
  localStorage.removeItem("smartlogix_jwt");
};