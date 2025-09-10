import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { citizenAPI } from '../../services/api';
import { citizenWebSocket, commonWebSocket } from '../../services/websocket';
import { SOSMap } from '../../components/MapView';
import Spinner, { InlineSpinner } from '../../components/Spinner';

const CitizenTrackingPage = () => {
  const navigate = useNavigate();
  const { user, logout, token, role } = useAuth();

  // State
  const [incident, setIncident] = useState(null);
  const [responders, setResponders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Initialize WebSocket connection and load incident data
  useEffect(() => {
    if (token && role === 'citizen') {
      citizenWebSocket.connect(token, role);
      loadIncidentData();
      
      // Listen for connection status
      const unsubscribeConnection = commonWebSocket.on('connection_status', (status) => {
        setConnectionStatus(status.connected);
      });
      
      // Listen for incident updates
      const unsubscribeIncidentUpdate = citizenWebSocket.onIncidentUpdate((update) => {
        console.log('Incident update received:', update);
        setIncident(prev => ({ ...prev, ...update }));
        setLastUpdate(new Date());
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
        setLastUpdate(new Date());
      });
      
      return () => {
        unsubscribeConnection();
        unsubscribeIncidentUpdate();
        unsubscribeResponderUpdate();
      };
    }
  }, [token, role]);

  // Load incident data
  const loadIncidentData = async () => {
    try {
      setIsLoading(true);
      
      // TODO: Get active incident ID from localStorage or context
      const activeIncidentId = localStorage.getItem('active_incident_id');
      
      if (!activeIncidentId) {
        // No active incident, redirect to SOS page
        navigate('/citizen/sos');
        return;
      }

      // Fetch incident details
      const incidentData = await citizenAPI.getIncidentStatus(activeIncidentId);
      setIncident(incidentData);
      
      // Extract responder information from incident data
      if (incidentData.assignedResponders) {
        setResponders(incidentData.assignedResponders);
      }
      
    } catch (error) {
      console.error('Failed to load incident data:', error);
      // Handle case where incident might not exist anymore
      navigate('/citizen/sos');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel SOS
  const handleCancelSOS = async () => {
    if (!incident) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to cancel this SOS alert? Emergency responders will be notified.'
    );
    
    if (confirmed) {
      try {
        await citizenAPI.cancelSOS(incident.id);
        citizenWebSocket.cancelSOS(incident.id);
        
        // Clear active incident
        localStorage.removeItem('active_incident_id');
        
        // Navigate back to SOS page
        navigate('/citizen/sos');
        
      } catch (error) {
        console.error('Failed to cancel SOS:', error);
        alert('Failed to cancel SOS. Please try again.');
      }
    }
  };

  // Handle logout
  const handleLogout = () => {
    commonWebSocket.disconnect();
    logout();
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'dispatched':
      case 'en_route':
        return 'text-yellow-600 bg-yellow-100';
      case 'on_scene':
        return 'text-blue-600 bg-blue-100';
      case 'resolved':
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-orange-600 bg-orange-100';
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Calculate ETA
  const calculateETA = (responder) => {
    if (responder.eta) return responder.eta;
    if (responder.estimatedArrival) {
      const eta = new Date(responder.estimatedArrival);
      const now = new Date();
      const diffMinutes = Math.ceil((eta - now) / (1000 * 60));
      return diffMinutes > 0 ? `${diffMinutes} min` : 'Arriving now';
    }
    return 'Calculating...';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <InlineSpinner text="Loading incident data..." size="large" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No active incident found</p>
          <button
            onClick={() => navigate('/citizen/sos')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to SOS Page
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
                onClick={() => navigate('/citizen/sos')}
                className="mr-4 text-gray-400 hover:text-gray-600"
              >
                ← Back
              </button>
              <div className="flex-shrink-0">
                <span className="text-2xl text-red-600">🚨</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">Emergency Tracking</h1>
                <p className="text-sm text-gray-500">Incident #{incident.id}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${connectionStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {connectionStatus ? 'Live Updates' : 'Disconnected'}
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
          
          {/* Left Column - Incident Details */}
          <div className="space-y-6">
            
            {/* Incident Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Incident Status</h2>
                {lastUpdate && (
                  <p className="text-xs text-gray-500">
                    Last updated: {formatTime(lastUpdate)}
                  </p>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                    {incident.status || 'Processing'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Reported:</span>
                  <span className="text-sm text-gray-600">
                    {formatTime(incident.createdAt)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Priority:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    incident.priority === 'high' ? 'bg-red-100 text-red-800' : 
                    incident.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-green-100 text-green-800'
                  }`}>
                    {incident.priority || 'Medium'}
                  </span>
                </div>
                
                {incident.description && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 block mb-1">Description:</span>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {incident.description}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Cancel Button */}
              {['processing', 'dispatched', 'en_route'].includes(incident.status?.toLowerCase()) && (
                <div className="mt-6 pt-4 border-t">
                  <button
                    onClick={handleCancelSOS}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Cancel SOS Alert
                  </button>
                </div>
              )}
            </div>

            {/* Responder Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Emergency Responders</h2>
              
              {responders.length > 0 ? (
                <div className="space-y-4">
                  {responders.map((responder, index) => (
                    <div key={responder.id || index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {responder.name || `Responder ${index + 1}`}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {responder.type || 'Emergency Medical Services'}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(responder.status)}`}>
                          {responder.status || 'Dispatched'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">ETA:</span>
                          <span className="ml-2 text-gray-600">{calculateETA(responder)}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Distance:</span>
                          <span className="ml-2 text-gray-600">
                            {responder.distance || 'Calculating...'}
                          </span>
                        </div>
                      </div>
                      
                      {responder.notes && (
                        <p className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          {responder.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl text-gray-400 mb-4">👥</div>
                  <p className="text-gray-600 mb-2">No responders assigned yet</p>
                  <p className="text-sm text-gray-500">
                    Emergency services are processing your request
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Map */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Live Tracking</h2>
              
              {incident.location ? (
                <SOSMap
                  center={[incident.location.latitude, incident.location.longitude]}
                  zoom={14}
                  height="500px"
                  sosLocation={{
                    lat: incident.location.latitude,
                    lng: incident.location.longitude
                  }}
                  responders={responders.map(r => ({
                    lat: r.currentLocation?.latitude || r.lat,
                    lng: r.currentLocation?.longitude || r.lng,
                    name: r.name,
                    eta: calculateETA(r),
                    status: r.status
                  }))}
                  className="rounded-lg overflow-hidden"
                />
              ) : (
                <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl text-gray-400 mb-4">🗺️</div>
                    <p className="text-gray-500">Loading incident location...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Timeline</h2>
              
              <div className="flow-root">
                <ul className="-mb-8">
                  {incident.timeline?.map((event, index) => (
                    <li key={index}>
                      <div className="relative pb-8">
                        {index !== incident.timeline.length - 1 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></span>
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                              event.type === 'created' ? 'bg-red-500' :
                              event.type === 'dispatched' ? 'bg-yellow-500' :
                              event.type === 'en_route' ? 'bg-blue-500' :
                              event.type === 'on_scene' ? 'bg-green-500' :
                              'bg-gray-500'
                            }`}>
                              <span className="text-white text-xs">
                                {event.type === 'created' ? '🚨' :
                                 event.type === 'dispatched' ? '📡' :
                                 event.type === 'en_route' ? '🚑' :
                                 event.type === 'on_scene' ? '📍' :
                                 '✓'}
                              </span>
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-900 font-medium">{event.message}</p>
                              {event.details && (
                                <p className="text-xs text-gray-500 mt-1">{event.details}</p>
                              )}
                            </div>
                            <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                              {formatTime(event.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  )) || (
                    <li className="text-center text-gray-500 py-4">
                      No timeline events available
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CitizenTrackingPage;
