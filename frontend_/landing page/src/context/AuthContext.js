import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        role: action.payload.role,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from localStorage on app start
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('guardiannet_token');
        const user = localStorage.getItem('guardiannet_user');
        const role = localStorage.getItem('guardiannet_role');

        if (token && user && role) {
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              token,
              user: JSON.parse(user),
              role
            }
          });
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Auth actions
  const login = async (email, password, role) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      // DEMO MODE - Simulate successful login for any credentials
      const mockResponse = {
        success: true,
        token: `demo_token_${role}_${Date.now()}`,
        user: {
          id: `demo_${role}_user`,
          name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)} User`,
          email: email || `${role}@demo.com`
        },
        role: role
      };

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Store in localStorage
      localStorage.setItem('guardiannet_token', mockResponse.token);
      localStorage.setItem('guardiannet_user', JSON.stringify(mockResponse.user));
      localStorage.setItem('guardiannet_role', mockResponse.role);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          token: mockResponse.token,
          user: mockResponse.user,
          role: mockResponse.role
        }
      });

      return { success: true };
      
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: error.message }
      });
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('guardiannet_token');
    localStorage.removeItem('guardiannet_user');
    localStorage.removeItem('guardiannet_role');
    
    // Dispatch logout action
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    
    // Force a page refresh to clear any cached state
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    login,
    logout,
    clearError,
    AUTH_ACTIONS
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
