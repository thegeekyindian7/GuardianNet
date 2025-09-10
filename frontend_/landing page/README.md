# GuardianNet Frontend

A comprehensive React.js frontend for the GuardianNet - Unified Emergency Response System. This web application provides three distinct user portals for Citizens, Emergency Responders, and Hospital Staff through a single unified interface.

## 🚨 Features

### Unified Authentication
- Single login page with role-based authentication
- Role selection: Citizen, Emergency Responder, Hospital Staff
- Secure JWT token management with localStorage persistence
- Protected routes based on user roles

### Citizen Portal
- **SOS Reporting**: Location-based emergency alert system
- **Real-time Tracking**: Live tracking of assigned responders with ETA
- **Incident Management**: Report as witness or direct emergency
- **Interactive Maps**: Location visualization with responder positions

### Emergency Responder Portal
- **Live Dashboard**: Real-time incident alerts and assignments
- **WebSocket Notifications**: Instant new emergency notifications
- **Incident Management**: Status updates (En Route, On Scene, Completed)
- **Navigation Integration**: Direct Google Maps integration for routing
- **Location Tracking**: Automatic location sharing while on duty

### Hospital Portal
- **Ambulance Tracking**: Real-time incoming ambulance monitoring
- **Resource Management**: Bed availability management (Emergency, ICU, General)
- **Patient Information**: ETA and condition details for incoming patients
- **Real-time Updates**: Live ambulance and patient status updates

## 🛠 Technology Stack

- **Framework**: React.js 18.2.0
- **Routing**: React Router DOM 6.8.1
- **Styling**: Tailwind CSS 3.2.7 with custom emergency-themed design
- **HTTP Client**: Axios 1.3.4 for REST API communication
- **Real-time**: Socket.IO Client 4.6.1 for WebSocket connections
- **Maps**: React-Leaflet 4.2.1 with OpenStreetMap integration
- **State Management**: React Context API with custom hooks
- **Geolocation**: Custom geolocation hook with permission handling

## 📁 Project Structure

```
guardiannet-frontend/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/          # Shared components
│   │   ├── AuthInput.js     # Form input with validation
│   │   ├── MapView.js       # Interactive map component
│   │   ├── ProtectedRoute.js # Role-based route protection
│   │   └── Spinner.js       # Loading indicators
│   ├── context/
│   │   └── AuthContext.js   # Global authentication state
│   ├── hooks/
│   │   ├── useGeolocation.js # Location services hook
│   │   └── useWebSocket.js   # WebSocket connection hook
│   ├── pages/
│   │   ├── LoginPage.js     # Unified login page
│   │   ├── citizen/         # Citizen portal pages
│   │   ├── responder/       # Responder portal pages
│   │   └── hospital/        # Hospital portal pages
│   ├── services/
│   │   ├── api.js          # REST API service layer
│   │   └── websocket.js    # WebSocket service layer
│   ├── App.js              # Main application router
│   ├── index.js            # Application entry point
│   └── index.css           # Global styles with Tailwind
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

## 🚀 Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager
- Modern web browser with geolocation support

### Installation

1. **Clone or extract the project**
   ```bash
   cd guardiannet-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables** (optional)
   Create a `.env` file in the root directory:
   ```
   REACT_APP_API_BASE_URL=http://localhost:5000/api
   REACT_APP_WEBSOCKET_URL=http://localhost:5000
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔧 Available Scripts

- `npm start` - Run the app in development mode
- `npm build` - Build the app for production
- `npm test` - Run the test suite
- `npm run eject` - Eject from Create React App (not recommended)

## 🌐 User Guide

### Demo Credentials (Development)

For testing purposes, you can use these demo credentials:

- **Citizen**: `citizen@demo.com` / `password123`
- **Responder**: `responder@demo.com` / `password123`
- **Hospital**: `hospital@demo.com` / `password123`

### Citizen Usage

1. **Login** with citizen credentials
2. **Allow location access** when prompted
3. **Report Emergency** using the large SOS button
4. **Track Response** in real-time on the tracking page
5. **Cancel SOS** if needed through the tracking interface

### Responder Usage

1. **Login** with responder credentials
2. **Set status** (Available, Busy, Off Duty)
3. **Receive alerts** for new emergencies
4. **Accept incidents** from the dashboard
5. **Update status** (En Route, On Scene, Completed)
6. **Use navigation** links for Google Maps routing

### Hospital Usage

1. **Login** with hospital credentials
2. **Monitor incoming ambulances** on the dashboard
3. **Update bed availability** using the resource management page
4. **Track patient ETAs** and conditions
5. **Manage resources** across Emergency, ICU, and General wards

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Protected routes based on user roles
- **Auto-logout**: Session management with token expiration
- **Input Validation**: Client-side form validation
- **HTTPS Ready**: Production-ready security headers

## 🗺 Maps & Geolocation

- **Location Services**: Automatic location detection with user consent
- **Interactive Maps**: Real-time positioning and marker updates
- **Navigation Integration**: Direct links to Google Maps for routing
- **Responsive Design**: Mobile-optimized map interfaces

## ⚡ Real-time Features

- **WebSocket Connections**: Live updates for all user types
- **Push Notifications**: Browser notifications for critical alerts
- **Live Tracking**: Real-time responder and ambulance positioning
- **Status Updates**: Instant incident and resource status changes

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Accessibility**: WCAG compliant with keyboard navigation
- **Dark Mode Ready**: Prepared for future dark theme implementation
- **Emergency Theming**: Red-based color scheme for emergency contexts
- **Loading States**: Comprehensive loading and error states

## 🔧 Backend Integration

This frontend expects a REST API backend with the following endpoints:

- `POST /api/auth/login` - User authentication
- `GET /api/citizen/incident/:id/status` - Incident status
- `POST /api/citizen/sos` - SOS reporting
- `GET /api/responder/incidents` - Assigned incidents
- `PUT /api/responder/incident/:id/status` - Update incident status
- `GET /api/hospital/ambulances` - Incoming ambulances
- `PUT /api/hospital/beds` - Update bed availability

WebSocket events:
- `new_alert` - New emergency alerts
- `incident_update` - Incident status changes
- `ambulance_update` - Ambulance location updates
- `responder_update` - Responder status changes

## 🐛 Troubleshooting

### Common Issues

1. **Location not working**
   - Ensure HTTPS is enabled (required for geolocation)
   - Check browser permissions for location access
   - Verify geolocation API support in browser

2. **WebSocket connection fails**
   - Check REACT_APP_WEBSOCKET_URL environment variable
   - Verify backend WebSocket server is running
   - Check for CORS configuration on backend

3. **Maps not loading**
   - Verify internet connection for OpenStreetMap tiles
   - Check browser console for Leaflet errors
   - Ensure react-leaflet dependencies are installed

4. **Authentication issues**
   - Clear localStorage to reset auth state
   - Verify backend API endpoint configuration
   - Check JWT token expiration handling

## 📱 Mobile Compatibility

- **Responsive Design**: Optimized for all screen sizes
- **Touch Interfaces**: Mobile-friendly touch controls
- **PWA Ready**: Progressive Web App manifest included
- **Offline Capabilities**: Ready for service worker integration

## 🔮 Future Enhancements

- **Push Notifications**: Service worker integration for background notifications
- **Offline Support**: Cached emergency contacts and offline incident reporting
- **Multi-language**: Internationalization support
- **Dark Mode**: Complete dark theme implementation
- **Advanced Analytics**: Incident response time analytics
- **Video Calls**: WebRTC integration for emergency communication

## 📄 License

This project is designed for emergency response systems and should be used in accordance with local emergency services regulations.

## 🤝 Contributing

This is a complete frontend implementation for the GuardianNet Emergency Response System. For modifications or enhancements, ensure all three user portals remain functional and maintain security standards.

---

**Emergency Contact**: This is a development system. In real emergencies, please contact your local emergency services (911, 112, etc.).
