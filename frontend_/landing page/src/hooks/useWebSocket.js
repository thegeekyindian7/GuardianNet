import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const useWebSocket = (namespace = '') => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);
  const { token, role, isAuthenticated } = useAuth();

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!isAuthenticated || !token) {
      console.log('Cannot connect to WebSocket: User not authenticated');
      return;
    }

    try {
      // TODO: Replace with actual backend WebSocket URL
      const socketUrl = process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:5000';
      const fullNamespace = namespace ? `/${namespace}` : '';
      
      socketRef.current = io(`${socketUrl}${fullNamespace}`, {
        auth: {
          token,
          role
        },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      // Connection event handlers
      socketRef.current.on('connect', () => {
        console.log(`Connected to WebSocket${fullNamespace}`);
        setIsConnected(true);
        setError(null);
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('Disconnected from WebSocket:', reason);
        setIsConnected(false);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setError(error.message);
        setIsConnected(false);
      });

      socketRef.current.on('error', (error) => {
        console.error('WebSocket error:', error);
        setError(error.message);
      });

      // Generic message handler
      socketRef.current.onAny((eventName, data) => {
        console.log(`WebSocket event received: ${eventName}`, data);
        setMessages(prev => [...prev, { eventName, data, timestamp: new Date() }]);
      });

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setError(error.message);
    }
  }, [token, role, isAuthenticated, namespace]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setMessages([]);
      setError(null);
    }
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
      return true;
    } else {
      console.warn('Cannot send message: WebSocket not connected');
      return false;
    }
  }, [isConnected]);

  // Subscribe to specific events
  const subscribe = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      return () => socketRef.current?.off(event, callback);
    }
    return () => {};
  }, []);

  // Unsubscribe from events
  const unsubscribe = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Connect on mount and disconnect on unmount
  useEffect(() => {
    if (isAuthenticated && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, token, connect, disconnect]);

  // Disconnect when auth changes
  useEffect(() => {
    if (!isAuthenticated && socketRef.current) {
      disconnect();
    }
  }, [isAuthenticated, disconnect]);

  return {
    isConnected,
    error,
    messages,
    connect,
    disconnect,
    sendMessage,
    subscribe,
    unsubscribe,
    clearMessages,
    socket: socketRef.current
  };
};

export default useWebSocket;
