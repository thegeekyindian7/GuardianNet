import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { responderAPI } from '../../services/api';
import { responderWebSocket, commonWebSocket } from '../../services/websocket';
import useGeolocation from '../../hooks/useGeolocation';
import { ResponderMap } from '../../components/MapView';
import Spinner, { InlineSpinner } from '../../components/Spinner';

const ResponderIncidentPage = () => {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const { user, logout, token, role } = useAuth();
  
  // Location tracking
  const { location, watchPosition, clearWatch } = useGeolocation();

  // State
  const [incident, setIncident] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('en_route');
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Load incident data
  useEffect(() => {
    if (token && role === 'responder' && incidentId) {
      responderWebSocket.connect(token, role);
      loadIncidentDetails();
      
      // Start location tracking
      watchPosition();
      
      // WebSocket listeners
      const unsubscribeConnection = commonWebSocket.on('connection_status', (status) => {
        setConnectionStatus(status.connected);
      });
      
      const unsubscribeIncidentUpdate = responderWebSocket.onIncidentUpdate((update) => {
        if (update.incidentId === incidentId) {
          setIncident(prev => ({ ...prev, ...update }));
        }
      });
      
      return () => {
        unsubscribeConnection();
        unsubscribeIncidentUpdate();
        clearWatch();
      };
    }
  }, [token, role, incidentId, watchPosition, clearWatch]);

  // Send location updates
  useEffect(() => {
    if (location.latitude && location.longitude && connectionStatus) {
      commonWebSocket.updateLocation(location);
    }
  }, [location, connectionStatus]);

  // Load incident details
  const loadIncidentDetails = async () => {
    try {
      setIsLoading(true);
      const incidentData = await responderAPI.getIncidentDetails(incidentId);
      setIncident(incidentData);
      setCurrentStatus(incidentData.status || 'en_route');
    } catch (error) {
      console.error('Failed to load incident:', error);
      alert('Failed to load incident details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update incident status
  const updateIncidentStatus = async (status) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      await responderAPI.updateIncidentStatus(incidentId, status, notes);
      responderWebSocket.updateIncidentStatus(incidentId, status, notes);
      
      setCurrentStatus(status);
      setIncident(prev => ({ ...prev, status }));
      setNotes('');
      
      if (status === 'completed') {
        alert('Incident marked as completed!');
        navigate('/responder/dashboard');
      }
      
    } catch (error) {
      console.error('Failed to update incident status:', error);
      alert('Failed to update incident status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    commonWebSocket.disconnect();
    logout();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <InlineSpinner text="Loading incident details..." size="large" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Incident not found</p>
          <button
            onClick={() => navigate('/responder/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/responder/dashboard')}
                className="mr-4 text-gray-400 hover:text-gray-600"
              >
                ← Back
              </button>
              <div className="flex-shrink-0">
                <span className="text-2xl text-blue-600">🚑</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">Incident #{incident.id}</h1>
                <p className="text-sm text-gray-500">Emergency Response</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${connectionStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {connectionStatus ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <span className="text-sm text-gray-700 mr-3">{user?.name || user?.email}</span>
              <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-500">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Incident Details */}
          <div className="space-y-6">
            
            {/* Incident Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Incident Details</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Priority: </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    incident.priority === 'high' ? 'bg-red-100 text-red-800' :
                    incident.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {incident.priority || 'Medium'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Status: </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    currentStatus === 'en_route' ? 'bg-blue-100 text-blue-800' :
                    currentStatus === 'on_scene' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {currentStatus.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Reported: </span>
                  <span className="text-sm text-gray-600">{formatTime(incident.createdAt)}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Location: </span>
                  <span className="text-sm text-gray-600">{incident.location?.address || 'Address unavailable'}</span>
                </div>
                {incident.description && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 block mb-1">Description:</span>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{incident.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Status Update */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Update Status</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Status
                  </label>
                  <select
                    value={currentStatus}
                    onChange={(e) => setCurrentStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en_route">En Route</option>
                    <option value="on_scene">On Scene</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Add any notes about the incident..."
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <button
                  onClick={() => updateIncidentStatus(currentStatus)}
                  disabled={isUpdating}
                  className={`w-full py-2 px-4 rounded font-medium ${
                    isUpdating 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  {isUpdating ? <Spinner color="white" size="small" /> : 'Update Status'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Map */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Location & Navigation</h2>
              
              <ResponderMap
                incidents={[{
                  id: incident.id,
                  lat: incident.location?.latitude || 40.7128,
                  lng: incident.location?.longitude || -74.0060,
                  priority: incident.priority,
                  description: incident.description
                }]}
                center={[
                  incident.location?.latitude || 40.7128,
                  incident.location?.longitude || -74.0060
                ]}
                zoom={15}
                height="400px"
                showCurrentLocation={true}
                currentLocation={location}
                className="rounded-lg overflow-hidden"
              />
              
              {incident.location?.latitude && incident.location?.longitude && (
                <div className="mt-4 pt-4 border-t">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${incident.location.latitude},${incident.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex justify-center items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    🗺️ Open in Google Maps
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResponderIncidentPage;
