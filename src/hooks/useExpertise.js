import { useState, useCallback } from 'react';
import { API_EXPERTISE } from '../config/api';

const useExpertise = () => {
  const [state, setState] = useState('idle'); // idle, loading, success, error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const submitExpertise = useCallback(async (images, notes = '') => {
    if (!images || images.length === 0) {
      setError('Veuillez sélectionner au moins une photo');
      setState('error');
      return;
    }

    if (images.length > 3) {
      setError('Veuillez sélectionner au maximum 3 photos');
      setState('error');
      return;
    }

    setState('loading');
    setError(null);

    try {
      const formData = new FormData();
      
      // Ajouter les images
      images.forEach((image) => {
        formData.append('images', image);
      });
      
      // Ajouter les notes
      formData.append('notes', notes || '');
      
      // Ajouter email vide (pas requis pour le hook gratuit)
      formData.append('email', '');

      const response = await fetch(API_EXPERTISE, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur lors de l\'analyse' }));
        throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
      setState('success');
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de l\'analyse');
      setState('error');
    }
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setResult(null);
    setError(null);
  }, []);

  const isLoading = state === 'loading';
  const isSuccess = state === 'success';
  const isError = state === 'error';
  const isIdle = state === 'idle';

  return {
    result,
    isLoading,
    isSuccess,
    isError,
    isIdle,
    error,
    submitExpertise,
    reset,
  };
};

export default useExpertise;
