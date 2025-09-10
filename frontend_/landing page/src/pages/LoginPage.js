import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthInput from '../components/AuthInput';
import Spinner, { ButtonSpinner } from '../components/Spinner';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'citizen'
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const from = location.state?.from?.pathname;
      const role = localStorage.getItem('guardiannet_role');
      
      // Redirect based on role
      if (from) {
        navigate(from);
      } else {
        switch (role) {
          case 'citizen':
            navigate('/citizen/sos');
            break;
          case 'responder':
            navigate('/responder/dashboard');
            break;
          case 'hospital':
            navigate('/hospital/dashboard');
            break;
          default:
            navigate('/');
        }
      }
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field-specific error
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear general error
    if (error) {
      clearError();
    }
  };

  // Handle role selection
  const handleRoleChange = (role) => {
    setFormData(prev => ({
      ...prev,
      role
    }));
    clearError();
  };

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!formData.role) {
      errors.role = 'Please select a role';
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const result = await login(formData.email, formData.password, formData.role);
      
      if (result.success) {
        // Navigation will be handled by the useEffect hook
        console.log('Login successful');
      }
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Role options
  const roleOptions = [
    { value: 'citizen', label: 'Citizen', description: 'Report emergencies and track response' },
    { value: 'responder', label: 'Emergency Responder', description: 'Receive and respond to emergency alerts' },
    { value: 'hospital', label: 'Hospital Staff', description: 'Manage resources and incoming patients' }
  ];

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="large" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-red-600 rounded-full flex items-center justify-center mb-6">
            <span className="text-3xl text-white">🚨</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            GuardianNet
          </h2>
          <p className="text-lg text-gray-600">
            Unified Emergency Response System
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Sign in to access your portal
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white shadow-xl rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select your role <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {roleOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`
                      relative rounded-lg border-2 p-4 cursor-pointer transition-all
                      ${formData.role === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                    onClick={() => handleRoleChange(option.value)}
                  >
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="radio"
                          name="role"
                          value={option.value}
                          checked={formData.role === option.value}
                          onChange={() => handleRoleChange(option.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                      </div>
                      <div className="ml-3">
                        <label className="text-sm font-medium text-gray-900 cursor-pointer">
                          {option.label}
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {formErrors.role && (
                <p className="mt-1 text-sm text-red-600">{formErrors.role}</p>
              )}
            </div>

            {/* Email Input */}
            <AuthInput
              label="Email Address"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              error={formErrors.email}
              required
              disabled={isSubmitting}
            />

            {/* Password Input */}
            <AuthInput
              label="Password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              error={formErrors.password}
              required
              disabled={isSubmitting}
            />

            {/* Global Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-red-400">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Login Failed
                    </h3>
                    <p className="text-sm text-red-700 mt-1">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                w-full flex justify-center items-center py-3 px-4 border border-transparent 
                rounded-md shadow-sm text-sm font-medium text-white 
                transition-colors duration-200
                ${isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <ButtonSpinner />
                  <span className="ml-2">Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Additional Links */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Need help?
                </span>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-500"
                onClick={() => {
                  // TODO: Implement forgot password functionality
                  alert('Forgot password functionality will be implemented by the backend team.');
                }}
              >
                Forgot your password?
              </button>
            </div>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-3">
            Demo Credentials (Development Only)
          </h3>
          <div className="text-xs text-yellow-700 space-y-1 mb-4">
            <p><strong>Citizen:</strong> citizen@demo.com / password123</p>
            <p><strong>Responder:</strong> responder@demo.com / password123</p>
            <p><strong>Hospital:</strong> hospital@demo.com / password123</p>
          </div>
          
          {/* Quick Access Buttons */}
          <div className="border-t border-yellow-200 pt-3">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Quick Demo Access:</h4>
            <div className="space-y-2">
              <button
                onClick={() => {
                  // Clear any existing auth data first
                  localStorage.clear();
                  setFormData({ email: 'citizen@demo.com', password: 'password123', role: 'citizen' });
                  setTimeout(() => {
                    handleSubmit({ preventDefault: () => {} });
                  }, 100);
                }}
                className="w-full px-3 py-2 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                🧑‍💼 Access Citizen Portal
              </button>
              <button
                onClick={() => {
                  // Clear any existing auth data first
                  localStorage.clear();
                  setFormData({ email: 'responder@demo.com', password: 'password123', role: 'responder' });
                  setTimeout(() => {
                    handleSubmit({ preventDefault: () => {} });
                  }, 100);
                }}
                className="w-full px-3 py-2 bg-green-500 text-white text-xs rounded hover:bg-green-600"
              >
                🚑 Access Responder Portal
              </button>
              <button
                onClick={() => {
                  // Clear any existing auth data first
                  localStorage.clear();
                  setFormData({ email: 'hospital@demo.com', password: 'password123', role: 'hospital' });
                  setTimeout(() => {
                    handleSubmit({ preventDefault: () => {} });
                  }, 100);
                }}
                className="w-full px-3 py-2 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
              >
                🏥 Access Hospital Portal
              </button>
              
              {/* Debug: Clear Storage Button */}
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="w-full px-3 py-2 bg-red-400 text-white text-xs rounded hover:bg-red-500 mt-2"
              >
                🔄 Clear All Data & Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
