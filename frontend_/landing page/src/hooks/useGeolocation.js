import { useState, useEffect, useCallback } from 'react';

const useGeolocation = (options = {}) => {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [watchId, setWatchId] = useState(null);

  // Default options
  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
    ...options
  };

  // Handle successful position retrieval
  const handleSuccess = useCallback((position) => {
    const { latitude, longitude, accuracy } = position.coords;
    setLocation({
      latitude,
      longitude,
      accuracy,
      timestamp: position.timestamp
    });
    setError(null);
    setIsLoading(false);
  }, []);

  // Handle geolocation errors
  const handleError = useCallback((error) => {
    let errorMessage = 'An unknown error occurred';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied by user';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out';
        break;
      default:
        errorMessage = error.message || 'Failed to get location';
    }

    setError(errorMessage);
    setIsLoading(false);
    console.error('Geolocation error:', error);
  }, []);

  // Get current position once
  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      defaultOptions
    );
  }, [handleSuccess, handleError, defaultOptions]);

  // Start watching position
  const watchPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    if (isWatching) {
      console.log('Already watching position');
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsWatching(true);

    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      defaultOptions
    );

    setWatchId(id);
  }, [handleSuccess, handleError, defaultOptions, isWatching]);

  // Stop watching position
  const clearWatch = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsWatching(false);
      setIsLoading(false);
    }
  }, [watchId]);

  // Check if geolocation is supported
  const isSupported = 'geolocation' in navigator;

  // Check permission status (modern browsers)
  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) {
      return 'unknown';
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state;
    } catch (error) {
      console.warn('Unable to check geolocation permission:', error);
      return 'unknown';
    }
  }, []);

  // Request permission
  const requestPermission = useCallback(async () => {
    const permission = await checkPermission();
    
    if (permission === 'denied') {
      setError('Location permission denied. Please enable location access in browser settings.');
      return false;
    }

    if (permission === 'prompt' || permission === 'unknown') {
      // Try to get position to trigger permission prompt
      getCurrentPosition();
      return true;
    }

    return permission === 'granted';
  }, [checkPermission, getCurrentPosition]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }, []);

  // Clear watch on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    location,
    error,
    isLoading,
    isWatching,
    isSupported,
    getCurrentPosition,
    watchPosition,
    clearWatch,
    checkPermission,
    requestPermission,
    calculateDistance
  };
};

export default useGeolocation;
