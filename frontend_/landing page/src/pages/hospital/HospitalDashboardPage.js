import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hospitalAPI } from '../../services/api';
import { hospitalWebSocket, commonWebSocket } from '../../services/websocket';
import { HospitalMap } from '../../components/MapView';
import { InlineSpinner } from '../../components/Spinner';

const HospitalDashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout, token, role } = useAuth();

  // State
  const [ambulances, setAmbulances] = useState([]);
  const [bedAvailability, setBedAvailability] = useState({
    emergency: 0,
    icu: 0,
    general: 0
  });
  const [stats, setStats] = useState({
    totalPatients: 0,
    incomingAmbulances: 0,
    availableBeds: 0,
    averageWaitTime: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(false);

  // Initialize WebSocket and load data
  useEffect(() => {
    if (token && role === 'hospital') {
      hospitalWebSocket.connect(token, role);
      loadHospitalData();
      
      // WebSocket listeners
      const unsubscribeConnection = commonWebSocket.on('connection_status', (status) => {
        setConnectionStatus(status.connected);
      });
      
      const unsubscribeAmbulanceUpdate = hospitalWebSocket.onAmbulanceUpdate((update) => {
        console.log('Ambulance update:', update);
        setAmbulances(prev => {
          const existingIndex = prev.findIndex(a => a.id === update.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], ...update };
            return updated;
          } else {
            return [...prev, update];
          }
        });
      });
      
      const unsubscribePatientIncoming = hospitalWebSocket.onPatientIncoming((patient) => {
        console.log('Patient incoming:', patient);
        // Show notification
        if (Notification.permission === 'granted') {
          new Notification('Patient Incoming', {
            body: `ETA: ${patient.eta} - ${patient.condition || 'Unknown condition'}`,
            icon: '/favicon.ico'
          });
        }
      });
      
      const unsubscribeEmergencyAlert = hospitalWebSocket.onEmergencyAlert((alert) => {
        console.log('Emergency alert:', alert);
        // Handle emergency alert
      });
      
      return () => {
        unsubscribeConnection();
        unsubscribeAmbulanceUpdate();
        unsubscribePatientIncoming();
        unsubscribeEmergencyAlert();
      };
    }
  }, [token, role]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Load hospital data
  const loadHospitalData = async () => {
    try {
      setIsLoading(true);
      
      const [ambulanceData, bedData, statsData] = await Promise.all([
        hospitalAPI.getIncomingAmbulances(),
        hospitalAPI.getBedAvailability(),
        hospitalAPI.getHospitalStats()
      ]);
      
      setAmbulances(ambulanceData.ambulances || []);
      setBedAvailability(bedData);
      setStats(statsData);
      
    } catch (error) {
      console.error('Failed to load hospital data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    commonWebSocket.disconnect();
    logout();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.ceil((date - now) / (1000 * 60));
    return diffMinutes > 0 ? `${diffMinutes} min` : 'Arriving now';
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl text-green-600">🏥</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">GuardianNet</h1>
                <p className="text-sm text-gray-500">Hospital Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/hospital/resources')}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Manage Resources
              </button>
              
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
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl text-blue-600">🚑</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Incoming</p>
                <p className="text-2xl font-semibold text-gray-900">{ambulances.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl text-green-600">🛏️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Beds</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {bedAvailability.emergency + bedAvailability.icu + bedAvailability.general}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl text-purple-600">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalPatients}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl text-orange-600">⏱️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Wait Time</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.averageWaitTime}min</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Incoming Ambulances */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Incoming Ambulances</h2>
                <button onClick={loadHospitalData} className="text-sm text-blue-600 hover:text-blue-500">
                  Refresh
                </button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="p-6">
                <InlineSpinner text="Loading ambulances..." />
              </div>
            ) : ambulances.length > 0 ? (
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {ambulances.map((ambulance) => (
                  <div key={ambulance.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            Ambulance {ambulance.id}
                          </h3>
                          <span className={`ml-3 px-2 py-1 rounded border text-xs font-medium ${getPriorityColor(ambulance.priority)}`}>
                            {ambulance.priority || 'Medium'} Priority
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>🕐 ETA: {formatTime(ambulance.eta)}</p>
                          <p>📍 Distance: {ambulance.distance || 'Calculating...'}</p>
                          <p>🩺 Condition: {ambulance.patientCondition || 'Unknown'}</p>
                          {ambulance.notes && <p>📝 Notes: {ambulance.notes}</p>}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          ambulance.status === 'en_route' ? 'bg-blue-100 text-blue-800' :
                          ambulance.status === 'arriving' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {ambulance.status?.replace('_', ' ').toUpperCase() || 'EN ROUTE'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="text-4xl text-gray-400 mb-4">🚑</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No incoming ambulances</h3>
                <p className="text-gray-600">All clear! No ambulances currently en route.</p>
              </div>
            )}
          </div>

          {/* Bed Availability & Map */}
          <div className="space-y-6">
            
            {/* Bed Availability */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Bed Availability</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Emergency</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    bedAvailability.emergency > 5 ? 'bg-green-100 text-green-800' :
                    bedAvailability.emergency > 2 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {bedAvailability.emergency} available
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">ICU</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    bedAvailability.icu > 3 ? 'bg-green-100 text-green-800' :
                    bedAvailability.icu > 1 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {bedAvailability.icu} available
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">General</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    bedAvailability.general > 10 ? 'bg-green-100 text-green-800' :
                    bedAvailability.general > 5 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {bedAvailability.general} available
                  </span>
                </div>
              </div>
            </div>

            {/* Ambulance Map */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ambulance Locations</h3>
              <HospitalMap
                ambulances={ambulances.map(ambulance => ({
                  id: ambulance.id,
                  lat: ambulance.currentLocation?.latitude || 40.7128,
                  lng: ambulance.currentLocation?.longitude || -74.0060,
                  eta: formatTime(ambulance.eta)
                }))}
                height="250px"
                className="rounded-lg overflow-hidden"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HospitalDashboardPage;
