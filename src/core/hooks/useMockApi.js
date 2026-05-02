// src/core/hooks/useMockApi.js
import { useState, useCallback } from 'react';
import { getCollection, saveToCollection } from '../storage/mockDatabase';

export const useMockApi = (collectionName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Simulamos un GET hacia nuestro "API Gateway" con latencia
  // useCallback asegura que la función no se re-cree en cada render
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Retardo de 800ms para simular latencia de red
      await new Promise(resolve => setTimeout(resolve, 800));
      const result = getCollection(collectionName);
      setData(result);
    } catch (err) {
      setError('Error al comunicarse con el microservicio de ' + collectionName);
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  // Simulamos un POST hacia el microservicio correspondiente
  const createData = useCallback(async (newItem) => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const currentData = getCollection(collectionName);
      
      // Asignamos un ID único simulado
      const dataToSave = [...currentData, { ...newItem, id: Date.now() }];
      
      saveToCollection(collectionName, dataToSave);
      setData(dataToSave);
      return true;
    } catch (err) {
      setError('Error al registrar en el microservicio de ' + collectionName);
      return false;
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  return { data, loading, error, fetchData, createData };
};