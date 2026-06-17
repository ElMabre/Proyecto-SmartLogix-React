import axiosInstance from "../api/axiosInstance";

export const loginReal = async (credentials) => {
  try {
    const response = await axiosInstance.post("/auth/login", credentials);
    const data = response.data;
    localStorage.setItem("smartlogix_jwt", data.token);

    return data;
  } catch (error) {
    console.error("Error en loginReal:", error);
    const errorMessage =
      error.response?.data?.message ||
      "Credenciales inválidas o error en el servidor";
    throw new Error(errorMessage, { cause: error });
  }
};

export const logoutReal = () => {
  localStorage.removeItem("smartlogix_jwt");
};
