import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useGeolocation from '../../hooks/useGeolocation';
import { citizenAPI } from '../../services/api';
import { citizenWebSocket, commonWebSocket } from '../../services/websocket';
import { SOSMap } from '../../components/MapView';
import Spinner, { InlineSpinner } from '../../components/Spinner';

const CitizenSOSPage = () => {
  const navigate = useNavigate();
  const { user, logout, token, role } = useAuth();
  
  // Location hook
  const {
    location,
    error: locationError,
    isLoading: locationLoading,
    getCurrentPosition,
    requestPermission
  } = useGeolocation();

  // State
  const [isWitness, setIsWitness] = useState(false);
  const [description, setDescription] = useState('');
  const [isSendingSOS, setIsSendingSOS] = useState(false);
  const [activeIncident, setActiveIncident] = useState(null);
  const [responders, setResponders] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    if (token && role === 'citizen') {
      citizenWebSocket.connect(token, role);
      
      // Listen for connection status
      const unsubscribeConnection = commonWebSocket.on('connection_status', (status) => {
        setConnectionStatus(status.connected);
      });
      
      // Listen for SOS responses
      const unsubscribeSOSResponse = citizenWebSocket.onSOSResponse((response) => {
        console.log('SOS Response received:', response);
        if (response.success) {
          setActiveIncident(response.incident);
          navigate('/citizen/tracking');
        }
      });
      
      // Listen for responder updates
      const unsubscribeResponderUpdate = citizenWebSocket.onResponderUpdate((update) => {
        console.log('Responder update:', update);
        setResponders(prev => {
          const existingIndex = prev.findIndex(r => r.id === update.responderId);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], ...update };
            return updated;
          } else {
            return [...prev, update];
          }
        });
      });
      
      return () => {
        unsubscribeConnection();
        unsubscribeSOSResponse();
        unsubscribeResponderUpdate();
      };
    }
  }, [token, role, navigate]);

  // Request location permission on mount
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // Handle SOS button click
  const handleSOSClick = async () => {
    if (!location.latitude || !location.longitude) {
      alert('Location is required to send SOS. Please allow location access and try again.');
      return;
    }

    setIsSendingSOS(true);

    try {
      // Prepare SOS data
      const sosData = {
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: new Date().toISOString()
        },
        isWitness,
        description: description.trim(),
        userId: user.id,
        priority: 'high'
      };

      // Send SOS via API
      const response = await citizenAPI.reportSOS(
        sosData.location,
        sosData.isWitness,
        sosData.description
      );

      // Also send via WebSocket for real-time processing
      citizenWebSocket.reportSOS(sosData);

      // Set active incident and navigate to tracking page
      setActiveIncident(response.incident);
      navigate('/citizen/tracking');

    } catch (error) {
      console.error('Failed to send SOS:', error);
      alert('Failed to send SOS alert. Please try again.');
    } finally {
      setIsSendingSOS(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    commonWebSocket.disconnect();
    logout();
  };

  // Get current location
  const handleGetLocation = () => {
    getCurrentPosition();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl text-red-600">🚨</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">GuardianNet</h1>
                <p className="text-sm text-gray-500">Citizen Portal</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${connectionStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {connectionStatus ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="flex items-center">
                <span className="text-sm text-gray-700 mr-3">
                  Welcome, {user?.name || user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-500"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - SOS Controls */}
          <div className="space-y-6">
            
            {/* Location Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Location Status</h2>
              
              {locationLoading ? (
                <InlineSpinner text="Getting your location..." />
              ) : locationError ? (
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <p className="text-red-800 text-sm mb-2">Location Error:</p>
                  <p className="text-red-600 text-sm mb-3">{locationError}</p>
                  <button
                    onClick={handleGetLocation}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Retry Location
                  </button>
                </div>
              ) : location.latitude && location.longitude ? (
                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <p className="text-green-800 text-sm mb-2">✅ Location acquired</p>
                  <p className="text-green-600 text-sm">
                    Accuracy: ±{location.accuracy}m
                  </p>
                  <p className="text-xs text-green-500 mt-1">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                  <p className="text-yellow-800 text-sm mb-2">Location not available</p>
                  <button
                    onClick={handleGetLocation}
                    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                  >
                    Get Location
                  </button>
                </div>
              )}
            </div>

            {/* SOS Controls */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Emergency Alert</h2>
              
              {/* Witness Toggle */}
              <div className="mb-6">
                <div className="flex items-center">
                  <input
                    id="witness-toggle"
                    type="checkbox"
                    checked={isWitness}
                    onChange={(e) => setIsWitness(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="witness-toggle" className="ml-3 block text-sm font-medium text-gray-700">
                    I am reporting an incident I am witnessing
                  </label>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Check this if you're reporting an emergency happening to someone else
                </p>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Briefly describe the emergency..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {description.length}/200 characters
                </p>
              </div>

              {/* SOS Button */}
              <button
                onClick={handleSOSClick}
                disabled={isSendingSOS || !location.latitude}
                className={`
                  w-full h-32 rounded-xl text-white text-2xl font-bold 
                  transition-all duration-200 transform active:scale-95
                  ${isSendingSOS || !location.latitude
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl'
                  }
                `}
              >
                {isSendingSOS ? (
                  <div className="flex items-center justify-center">
                    <Spinner color="white" size="large" />
                    <span className="ml-4">Sending SOS...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-4xl mb-2">🚨</div>
                    <div>SEND SOS</div>
                    <div className="text-sm font-normal mt-1">Emergency Alert</div>
                  </>
                )}
              </button>
              
              <p className="text-xs text-gray-500 text-center mt-3">
                This will immediately alert emergency responders to your location
              </p>
            </div>
          </div>

          {/* Right Column - Map */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Your Location</h2>
              
              {location.latitude && location.longitude ? (
                <SOSMap
                  center={[location.latitude, location.longitude]}
                  zoom={15}
                  height="400px"
                  showCurrentLocation={true}
                  currentLocation={location}
                  responders={responders}
                  className="rounded-lg overflow-hidden"
                />
              ) : (
                <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl text-gray-400 mb-4">🗺️</div>
                    <p className="text-gray-500">Location access required to show map</p>
                    <button
                      onClick={handleGetLocation}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Enable Location
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Active Incidents */}
            {activeIncident && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 mb-2">Active Emergency</h3>
                <p className="text-sm text-yellow-700">
                  Incident #{activeIncident.id} - Status: {activeIncident.status}
                </p>
                <button
                  onClick={() => navigate('/citizen/tracking')}
                  className="mt-3 text-sm bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                >
                  Track Response
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CitizenSOSPage;
