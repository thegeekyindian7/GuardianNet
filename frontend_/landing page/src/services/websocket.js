import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 1000;
    this.isConnected = false;
    this.listeners = new Map();
    this.messageQueue = [];
    this.token = null;
    this.role = null;
  }

  // Initialize connection
  connect(token, role, namespace = '') {
    this.token = token;
    this.role = role;
    
    const socketUrl = process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:5000';
    const fullNamespace = namespace ? `/${namespace}` : '';

    console.log(`Connecting to WebSocket: ${socketUrl}${fullNamespace}`);

    this.socket = io(`${socketUrl}${fullNamespace}`, {
      auth: {
        token,
        role
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectInterval,
      forceNew: true
    });

    this.setupEventListeners();
    return this.socket;
  }

  // Setup default event listeners
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.processMessageQueue();
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('connection_status', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      this.emit('connection_error', { error: error.message, attempts: this.reconnectAttempts });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.emit('reconnected', { attempts: attemptNumber });
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      this.emit('reconnect_failed', { maxAttempts: this.maxReconnectAttempts });
    });

    // Generic message handler
    this.socket.onAny((eventName, data) => {
      console.log(`WebSocket event received: ${eventName}`, data);
      this.emit(eventName, data);
    });
  }

  // Disconnect from WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
      this.messageQueue = [];
      console.log('WebSocket disconnected manually');
    }
  }

  // Send message
  send(event, data) {
    if (this.isConnected && this.socket) {
      this.socket.emit(event, data);
      console.log(`WebSocket message sent: ${event}`, data);
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push({ event, data });
      console.warn('WebSocket not connected, message queued:', { event, data });
    }
  }

  // Process queued messages
  processMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const { event, data } = this.messageQueue.shift();
      this.send(event, data);
    }
  }

  // Subscribe to events
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Also register with socket.io if connected
    if (this.socket) {
      this.socket.on(event, callback);
    }

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  // Unsubscribe from events
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
      if (this.listeners.get(event).size === 0) {
        this.listeners.delete(event);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Emit to local listeners
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socket: this.socket,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // Join a room
  joinRoom(roomId) {
    this.send('join_room', { roomId });
  }

  // Leave a room
  leaveRoom(roomId) {
    this.send('leave_room', { roomId });
  }

  // Update location (for tracking)
  updateLocation(location) {
    this.send('location_update', {
      location,
      timestamp: new Date().toISOString()
    });
  }
}

// Singleton instance
const webSocketService = new WebSocketService();

// Citizen-specific WebSocket methods
export const citizenWebSocket = {
  connect: (token, role) => webSocketService.connect(token, role, 'citizen'),
  
  reportSOS: (sosData) => {
    webSocketService.send('sos_report', sosData);
  },
  
  cancelSOS: (incidentId) => {
    webSocketService.send('sos_cancel', { incidentId });
  },
  
  onSOSResponse: (callback) => webSocketService.on('sos_response', callback),
  onResponderUpdate: (callback) => webSocketService.on('responder_update', callback),
  onIncidentUpdate: (callback) => webSocketService.on('incident_update', callback)
};

// Responder-specific WebSocket methods
export const responderWebSocket = {
  connect: (token, role) => webSocketService.connect(token, role, 'responder'),
  
  updateStatus: (status) => {
    webSocketService.send('responder_status', { status });
  },
  
  acceptIncident: (incidentId) => {
    webSocketService.send('incident_accept', { incidentId });
  },
  
  updateIncidentStatus: (incidentId, status, notes) => {
    webSocketService.send('incident_status_update', { incidentId, status, notes });
  },
  
  onNewAlert: (callback) => webSocketService.on('new_alert', callback),
  onIncidentAssignment: (callback) => webSocketService.on('incident_assignment', callback),
  onIncidentUpdate: (callback) => webSocketService.on('incident_update', callback)
};

// Hospital-specific WebSocket methods
export const hospitalWebSocket = {
  connect: (token, role) => webSocketService.connect(token, role, 'hospital'),
  
  updateBedAvailability: (bedData) => {
    webSocketService.send('bed_availability_update', bedData);
  },
  
  updatePatientStatus: (patientId, status) => {
    webSocketService.send('patient_status_update', { patientId, status });
  },
  
  onAmbulanceUpdate: (callback) => webSocketService.on('ambulance_update', callback),
  onPatientIncoming: (callback) => webSocketService.on('patient_incoming', callback),
  onEmergencyAlert: (callback) => webSocketService.on('emergency_alert', callback)
};

// Common WebSocket methods
export const commonWebSocket = {
  on: (event, callback) => webSocketService.on(event, callback),
  off: (event, callback) => webSocketService.off(event, callback),
  send: (event, data) => webSocketService.send(event, data),
  getConnectionStatus: () => webSocketService.getConnectionStatus(),
  disconnect: () => webSocketService.disconnect(),
  updateLocation: (location) => webSocketService.updateLocation(location)
};

export default webSocketService;
