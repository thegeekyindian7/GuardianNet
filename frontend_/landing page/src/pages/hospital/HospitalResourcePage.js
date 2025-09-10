import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hospitalAPI } from '../../services/api';
import { hospitalWebSocket } from '../../services/websocket';
import Spinner from '../../components/Spinner';

const HospitalResourcePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // State
  const [bedData, setBedData] = useState({
    emergency: { available: 0, total: 0 },
    icu: { available: 0, total: 0 },
    general: { available: 0, total: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load bed availability data
  useEffect(() => {
    loadBedData();
  }, []);

  const loadBedData = async () => {
    try {
      setIsLoading(true);
      const data = await hospitalAPI.getBedAvailability();
      setBedData(data);
    } catch (error) {
      console.error('Failed to load bed data:', error);
      alert('Failed to load bed availability data.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update bed availability
  const updateBedAvailability = async () => {
    if (isSaving) return;
    
    try {
      setIsSaving(true);
      setSuccessMessage('');
      
      await hospitalAPI.updateBedAvailability(bedData);
      hospitalWebSocket.updateBedAvailability(bedData);
      
      setSuccessMessage('Bed availability updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Failed to update bed availability:', error);
      alert('Failed to update bed availability. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle bed count changes
  const handleBedChange = (type, field, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    
    setBedData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: numValue
      }
    }));
  };

  const handleLogout = () => {
    logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="large" text="Loading bed availability..." />
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
                onClick={() => navigate('/hospital/dashboard')}
                className="mr-4 text-gray-400 hover:text-gray-600"
              >
                ← Back
              </button>
              <div className="flex-shrink-0">
                <span className="text-2xl text-green-600">🏥</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">Resource Management</h1>
                <p className="text-sm text-gray-500">Update bed availability and hospital resources</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 mr-3">{user?.name || user?.email}</span>
              <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-500">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-green-400">✓</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Bed Availability Management */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Bed Availability</h2>
            <p className="mt-1 text-sm text-gray-600">
              Update the current bed availability for different departments
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Emergency Beds */}
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl text-red-600 mb-2">🚑</div>
                  <h3 className="text-lg font-medium text-gray-900">Emergency</h3>
                  <p className="text-sm text-gray-600">Critical care beds</p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Available Beds
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={bedData.emergency.total}
                      value={bedData.emergency.available}
                      onChange={(e) => handleBedChange('emergency', 'available', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Beds
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={bedData.emergency.total}
                      onChange={(e) => handleBedChange('emergency', 'total', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="text-center">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      bedData.emergency.available > 5 ? 'bg-green-100 text-green-800' :
                      bedData.emergency.available > 2 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {bedData.emergency.available}/{bedData.emergency.total} Available
                    </span>
                  </div>
                </div>
              </div>

              {/* ICU Beds */}
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl text-purple-600 mb-2">🏥</div>
                  <h3 className="text-lg font-medium text-gray-900">ICU</h3>
                  <p className="text-sm text-gray-600">Intensive care units</p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Available Beds
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={bedData.icu.total}
                      value={bedData.icu.available}
                      onChange={(e) => handleBedChange('icu', 'available', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Beds
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={bedData.icu.total}
                      onChange={(e) => handleBedChange('icu', 'total', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="text-center">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      bedData.icu.available > 3 ? 'bg-green-100 text-green-800' :
                      bedData.icu.available > 1 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {bedData.icu.available}/{bedData.icu.total} Available
                    </span>
                  </div>
                </div>
              </div>

              {/* General Beds */}
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl text-blue-600 mb-2">🛏️</div>
                  <h3 className="text-lg font-medium text-gray-900">General</h3>
                  <p className="text-sm text-gray-600">General ward beds</p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Available Beds
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={bedData.general.total}
                      value={bedData.general.available}
                      onChange={(e) => handleBedChange('general', 'available', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Beds
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={bedData.general.total}
                      onChange={(e) => handleBedChange('general', 'total', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="text-center">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      bedData.general.available > 10 ? 'bg-green-100 text-green-800' :
                      bedData.general.available > 5 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {bedData.general.available}/{bedData.general.total} Available
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Update Button */}
            <div className="mt-8 text-center">
              <button
                onClick={updateBedAvailability}
                disabled={isSaving}
                className={`px-8 py-3 rounded-md font-medium text-white ${
                  isSaving 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                }`}
              >
                {isSaving ? (
                  <div className="flex items-center">
                    <Spinner color="white" size="small" />
                    <span className="ml-2">Updating...</span>
                  </div>
                ) : (
                  'Update Bed Availability'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {bedData.emergency.available + bedData.icu.available + bedData.general.available}
              </div>
              <div className="text-sm text-gray-600">Total Available Beds</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {bedData.emergency.total + bedData.icu.total + bedData.general.total}
              </div>
              <div className="text-sm text-gray-600">Total Hospital Capacity</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {Math.round(
                  ((bedData.emergency.available + bedData.icu.available + bedData.general.available) / 
                   (bedData.emergency.total + bedData.icu.total + bedData.general.total)) * 100
                ) || 0}%
              </div>
              <div className="text-sm text-gray-600">Availability Rate</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HospitalResourcePage;
