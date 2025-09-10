import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('guardiannet_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('guardiannet_token');
      localStorage.removeItem('guardiannet_user');
      localStorage.removeItem('guardiannet_role');
      window.location.href = '/login';
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject(new Error('Network error: Please check your connection'));
    }
    
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  login: async (email, password, role) => {
    try {
      const response = await api.post('/auth/login', { email, password, role });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout request failed:', error);
      // Continue with local logout even if server request fails
    }
  },
  
  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh');
      return response.data;
    } catch (error) {
      throw new Error('Token refresh failed');
    }
  },
  
  validateToken: async () => {
    try {
      const response = await api.get('/auth/validate');
      return response.data;
    } catch (error) {
      throw new Error('Token validation failed');
    }
  }
};

// Citizen API calls
export const citizenAPI = {
  reportSOS: async (locationData, isWitness = false, description = '') => {
    try {
      const response = await api.post('/citizen/sos', {
        location: locationData,
        isWitness,
        description,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'SOS report failed');
    }
  },
  
  getIncidentStatus: async (incidentId) => {
    try {
      const response = await api.get(`/citizen/incident/${incidentId}/status`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to get incident status');
    }
  },
  
  cancelSOS: async (incidentId) => {
    try {
      const response = await api.post(`/citizen/sos/${incidentId}/cancel`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to cancel SOS');
    }
  }
};

// Responder API calls
export const responderAPI = {
  getAssignedIncidents: async () => {
    try {
      const response = await api.get('/responder/incidents');
      return response.data;
    } catch (error) {
      throw new Error('Failed to get assigned incidents');
    }
  },
  
  updateIncidentStatus: async (incidentId, status, notes = '') => {
    try {
      const response = await api.put(`/responder/incident/${incidentId}/status`, {
        status,
        notes,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to update incident status');
    }
  },
  
  updateLocation: async (locationData) => {
    try {
      const response = await api.post('/responder/location', {
        location: locationData,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to update location');
    }
  },
  
  getIncidentDetails: async (incidentId) => {
    try {
      const response = await api.get(`/responder/incident/${incidentId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to get incident details');
    }
  },
  
  acceptIncident: async (incidentId) => {
    try {
      const response = await api.post(`/responder/incident/${incidentId}/accept`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to accept incident');
    }
  }
};

// Hospital API calls
export const hospitalAPI = {
  getIncomingAmbulances: async () => {
    try {
      const response = await api.get('/hospital/ambulances');
      return response.data;
    } catch (error) {
      throw new Error('Failed to get incoming ambulances');
    }
  },
  
  updateBedAvailability: async (bedData) => {
    try {
      const response = await api.put('/hospital/beds', bedData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update bed availability');
    }
  },
  
  getBedAvailability: async () => {
    try {
      const response = await api.get('/hospital/beds');
      return response.data;
    } catch (error) {
      throw new Error('Failed to get bed availability');
    }
  },
  
  updatePatientStatus: async (patientId, status) => {
    try {
      const response = await api.put(`/hospital/patient/${patientId}/status`, {
        status,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to update patient status');
    }
  },
  
  getHospitalStats: async () => {
    try {
      const response = await api.get('/hospital/stats');
      return response.data;
    } catch (error) {
      throw new Error('Failed to get hospital statistics');
    }
  }
};

// General utility API calls
export const utilityAPI = {
  getNearbyHospitals: async (latitude, longitude, radius = 10) => {
    try {
      const response = await api.get('/utility/hospitals/nearby', {
        params: { lat: latitude, lng: longitude, radius }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to get nearby hospitals');
    }
  },
  
  calculateRoute: async (origin, destination) => {
    try {
      const response = await api.post('/utility/route', {
        origin,
        destination
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to calculate route');
    }
  },
  
  getWeatherInfo: async (latitude, longitude) => {
    try {
      const response = await api.get('/utility/weather', {
        params: { lat: latitude, lng: longitude }
      });
      return response.data;
    } catch (error) {
      console.warn('Failed to get weather info:', error);
      return null; // Weather is not critical, return null on failure
    }
  }
};

// File upload utility
export const uploadAPI = {
  uploadFile: async (file, type = 'general') => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error('File upload failed');
    }
  }
};

// Export the main api instance for custom calls
export default api;
