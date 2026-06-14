import { useState, useCallback } from 'react';
import { getCollection, saveToCollection } from '../storage/mockDatabase';

export const useMockApi = (collectionName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = getCollection(collectionName);
      setData(result);
    } catch (err) {
      setError('Error al comunicarse con el microservicio de ' + collectionName);
    } finally {
      setLoading(false);
    }
  }, [collectionName]);
  const createData = useCallback(async (newItem) => {
    setLoading(true);
    setError(null);
    try {
      const currentData = getCollection(collectionName);
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