import { useState, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';

export const useApi = (endpoint) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // axiosInstance ya tiene configurada la baseURL (http://localhost:8080/api)
      // y también inyecta automáticamente el JWT si existe.
      const response = await axiosInstance.get(endpoint);
      setData(response.data);
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      setError(err.response?.data?.message || `Error al obtener datos de ${endpoint}`);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  const createData = useCallback(async (newItem) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post(endpoint, newItem);
      // Asumimos que el backend devuelve el objeto creado con su ID real generado por PostgreSQL
      setData((prevData) => [...prevData, response.data]);
      return true;
    } catch (err) {
      console.error(`Error posting to ${endpoint}:`, err);
      setError(err.response?.data?.message || 'Error al registrar el dato en el servidor');
      return false;
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  return { data, loading, error, fetchData, createData };
};