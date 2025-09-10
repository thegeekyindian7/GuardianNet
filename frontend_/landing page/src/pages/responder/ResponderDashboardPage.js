import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { responderAPI } from '../../services/api';
import { responderWebSocket, commonWebSocket } from '../../services/websocket';
import { ResponderMap } from '../../components/MapView';
import Spinner, { InlineSpinner } from '../../components/Spinner';

const ResponderDashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout, token, role } = useAuth();

  // State
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(false);
  const [responderStatus, setResponderStatus] = useState('available');
  const [newAlerts, setNewAlerts] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Initialize WebSocket connection and load data
  useEffect(() => {
    if (token && role === 'responder') {
      responderWebSocket.connect(token, role);
      loadIncidents();
      
      // Listen for connection status
      const unsubscribeConnection = commonWebSocket.on('connection_status', (status) => {
        setConnectionStatus(status.connected);
      });
      
      // Listen for new alerts
      const unsubscribeNewAlert = responderWebSocket.onNewAlert((alert) => {
        console.log('New alert received:', alert);
        setNewAlerts(prev => [alert, ...prev]);
        
        // Show browser notification if permission is granted
        if (Notification.permission === 'granted') {
          new Notification('New Emergency Alert', {
            body: `${alert.type || 'Emergency'} - ${alert.location?.address || 'Location unavailable'}`,
            icon: '/favicon.ico',
            tag: alert.id
          });
        }
        
        // Play alert sound (optional)
        try {
          const audio = new Audio('/alert-sound.mp3');
          audio.play().catch(() => {
            console.log('Could not play alert sound');
          });
        } catch (error) {
          console.log('Alert sound not available');
        }
      });
      
      // Listen for incident assignments
      const unsubscribeIncidentAssignment = responderWebSocket.onIncidentAssignment((assignment) => {
        console.log('Incident assignment received:', assignment);
        setIncidents(prev => [assignment.incident, ...prev]);
      });
      
      // Listen for incident updates
      const unsubscribeIncidentUpdate = responderWebSocket.onIncidentUpdate((update) => {
        console.log('Incident update received:', update);
        setIncidents(prev => prev.map(incident => 
          incident.id === update.incidentId 
            ? { ...incident, ...update }
            : incident
        ));
      });
      
      return () => {
        unsubscribeConnection();
        unsubscribeNewAlert();
        unsubscribeIncidentAssignment();
        unsubscribeIncidentUpdate();
      };
    }
  }, [token, role]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Load incidents
  const loadIncidents = async () => {
    try {
      setIsLoading(true);
      const incidentData = await responderAPI.getAssignedIncidents();
      setIncidents(incidentData.incidents || []);
    } catch (error) {
      console.error('Failed to load incidents:', error);
      alert('Failed to load incidents. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update responder status
  const updateStatus = async (status) => {
    try {
      setResponderStatus(status);
      responderWebSocket.updateStatus(status);
      // TODO: Also update via API if needed
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  // Accept incident
  const acceptIncident = async (incident) => {
    try {
      await responderAPI.acceptIncident(incident.id);
      responderWebSocket.acceptIncident(incident.id);
      
      // Update incident status locally
      setIncidents(prev => prev.map(i => 
        i.id === incident.id 
          ? { ...i, status: 'accepted', assignedTo: user.id }
          : i
      ));
      
      // Navigate to incident details
      navigate(`/responder/incident/${incident.id}`);
      
    } catch (error) {
      console.error('Failed to accept incident:', error);
      alert('Failed to accept incident. Please try again.');
    }
  };

  // Dismiss alert
  const dismissAlert = (alertId) => {
    setNewAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  // Handle logout
  const handleLogout = () => {
    commonWebSocket.disconnect();
    logout();
  };

  // Get incident priority color
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'new':
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'accepted':
      case 'en_route':
        return 'bg-blue-100 text-blue-800';
      case 'on_scene':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl text-blue-600">🚑</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">GuardianNet</h1>
                <p className="text-sm text-gray-500">Emergency Responder Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Status Selector */}
              <select
                value={responderStatus}
                onChange={(e) => updateStatus(e.target.value)}
                className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="off_duty">Off Duty</option>
              </select>
              
              {/* Connection Status */}
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${connectionStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {connectionStatus ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="flex items-center">
                <span className="text-sm text-gray-700 mr-3">
                  {user?.name || user?.email}
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

      {/* New Alerts Banner */}
      {newAlerts.length > 0 && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-red-600 text-lg mr-2">🚨</span>
                <span className="text-red-800 font-medium">
                  {newAlerts.length} New Emergency Alert{newAlerts.length > 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={() => setNewAlerts([])}
                className="text-red-600 hover:text-red-500 text-sm"
              >
                Dismiss All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Incidents List */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* New Alerts */}
            {newAlerts.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">New Alerts</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {newAlerts.map((alert) => (
                    <div key={alert.id} className="p-6 bg-red-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="text-red-600 text-xl mr-3">🚨</span>
                            <div>
                              <h3 className="text-lg font-medium text-red-900">
                                {alert.type || 'Emergency Alert'}
                              </h3>
                              <p className="text-sm text-red-700">
                                {alert.description || 'No description provided'}
                              </p>
                              <p className="text-xs text-red-600 mt-1">
                                {alert.location?.address || 'Location unavailable'} • {formatTime(alert.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => acceptIncident(alert)}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => dismissAlert(alert.id)}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assigned Incidents */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Assigned Incidents</h2>
                  <button
                    onClick={loadIncidents}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              
              {isLoading ? (
                <div className="p-6">
                  <InlineSpinner text="Loading incidents..." />
                </div>
              ) : incidents.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {incidents.map((incident) => (
                    <div key={incident.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              Incident #{incident.id}
                            </h3>
                            <span className={`ml-3 px-2 py-1 rounded text-xs font-medium ${getPriorityColor(incident.priority)}`}>
                              {incident.priority || 'Medium'} Priority
                            </span>
                            <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(incident.status)}`}>
                              {incident.status || 'Pending'}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {incident.description || 'No description provided'}
                          </p>
                          
                          <div className="text-xs text-gray-500 space-y-1">
                            <p>📍 {incident.location?.address || 'Location unavailable'}</p>
                            <p>⏰ Reported: {formatTime(incident.createdAt)}</p>
                            {incident.eta && <p>🕐 ETA: {incident.eta}</p>}
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => navigate(`/responder/incident/${incident.id}`)}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            View Details
                          </button>
                          
                          {incident.status === 'pending' && (
                            <button
                              onClick={() => acceptIncident(incident)}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                              Accept
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="text-4xl text-gray-400 mb-4">📋</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No incidents assigned</h3>
                  <p className="text-gray-600">
                    You'll see new emergency incidents here when they're assigned to you.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Map and Stats */}
          <div className="space-y-6">
            
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Incidents</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {incidents.filter(i => ['accepted', 'en_route', 'on_scene'].includes(i.status)).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="text-lg font-semibold text-green-600">
                    {incidents.filter(i => i.status === 'completed').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Response Time</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {/* TODO: Calculate from backend */}
                    8.5 min
                  </span>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Incident Map</h3>
              <ResponderMap
                incidents={incidents.map(incident => ({
                  id: incident.id,
                  lat: incident.location?.latitude || 40.7128,
                  lng: incident.location?.longitude || -74.0060,
                  priority: incident.priority,
                  description: incident.description,
                  status: incident.status
                }))}
                height="300px"
                className="rounded-lg overflow-hidden"
              />
            </div>

            {/* Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    responderStatus === 'available' ? 'bg-green-100 text-green-800' :
                    responderStatus === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {responderStatus.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Connection</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    connectionStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {connectionStatus ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResponderDashboardPage;
