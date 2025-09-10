import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom icons for different marker types
const createCustomIcon = (color = 'blue', type = 'default') => {
  const iconMap = {
    sos: '🚨',
    responder: '🚑',
    hospital: '🏥',
    citizen: '👤',
    incident: '⚠️',
    default: '📍'
  };

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        font-size: 16px;
      ">
        ${iconMap[type] || iconMap.default}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

// Component to update map center
const MapCenter = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  return null;
};

// Component to handle map click events
const MapClickHandler = ({ onMapClick }) => {
  const map = useMap();
  
  useEffect(() => {
    if (onMapClick) {
      map.on('click', onMapClick);
      return () => map.off('click', onMapClick);
    }
  }, [map, onMapClick]);

  return null;
};

const MapView = ({
  center = [40.7128, -74.0060], // Default to New York City
  zoom = 13,
  markers = [],
  height = '400px',
  width = '100%',
  onMapClick = null,
  showCurrentLocation = false,
  currentLocation = null,
  className = '',
  style = {},
  children
}) => {
  const mapRef = useRef();
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);

  // Update center when props change
  useEffect(() => {
    setMapCenter(center);
  }, [center]);

  useEffect(() => {
    setMapZoom(zoom);
  }, [zoom]);

  // Handle marker click
  const handleMarkerClick = (marker) => {
    if (marker.onClick) {
      marker.onClick(marker);
    }
  };

  return (
    <div className={`map-container ${className}`} style={{ height, width, ...style }}>
      <MapContainer
        ref={mapRef}
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapCenter center={mapCenter} zoom={mapZoom} />
        <MapClickHandler onMapClick={onMapClick} />

        {/* Current location marker */}
        {showCurrentLocation && currentLocation && (
          <Marker
            position={[currentLocation.latitude, currentLocation.longitude]}
            icon={createCustomIcon('#00ff00', 'citizen')}
          >
            <Popup>
              <div>
                <strong>Your Location</strong>
                <br />
                Accuracy: ±{currentLocation.accuracy}m
              </div>
            </Popup>
          </Marker>
        )}

        {/* Custom markers */}
        {markers.map((marker, index) => (
          <Marker
            key={marker.id || index}
            position={[marker.lat, marker.lng]}
            icon={createCustomIcon(marker.color || '#3b82f6', marker.type || 'default')}
            eventHandlers={{
              click: () => handleMarkerClick(marker)
            }}
          >
            {marker.popup && (
              <Popup>
                <div>
                  {marker.popup.title && (
                    <strong>{marker.popup.title}</strong>
                  )}
                  {marker.popup.description && (
                    <>
                      <br />
                      <span>{marker.popup.description}</span>
                    </>
                  )}
                  {marker.popup.content && (
                    <div>{marker.popup.content}</div>
                  )}
                </div>
              </Popup>
            )}
          </Marker>
        ))}

        {children}
      </MapContainer>
    </div>
  );
};

// Predefined map configurations
export const SOSMap = ({ sosLocation, responders = [], ...props }) => {
  const markers = [
    ...(sosLocation ? [{
      id: 'sos',
      lat: sosLocation.lat,
      lng: sosLocation.lng,
      type: 'sos',
      color: '#ef4444',
      popup: {
        title: 'SOS Alert',
        description: 'Emergency reported at this location'
      }
    }] : []),
    ...responders.map((responder, index) => ({
      id: `responder-${index}`,
      lat: responder.lat,
      lng: responder.lng,
      type: 'responder',
      color: '#10b981',
      popup: {
        title: 'Emergency Responder',
        description: `${responder.name || 'Responder'} - ETA: ${responder.eta || 'Calculating...'}`
      }
    }))
  ];

  return <MapView markers={markers} {...props} />;
};

export const ResponderMap = ({ incidents = [], hospitals = [], ...props }) => {
  const markers = [
    ...incidents.map((incident, index) => ({
      id: `incident-${index}`,
      lat: incident.lat,
      lng: incident.lng,
      type: 'incident',
      color: incident.priority === 'high' ? '#ef4444' : '#f59e0b',
      popup: {
        title: `Incident #${incident.id || index + 1}`,
        description: incident.description || 'Emergency incident'
      }
    })),
    ...hospitals.map((hospital, index) => ({
      id: `hospital-${index}`,
      lat: hospital.lat,
      lng: hospital.lng,
      type: 'hospital',
      color: '#3b82f6',
      popup: {
        title: hospital.name || 'Hospital',
        description: `Available beds: ${hospital.availableBeds || 'Unknown'}`
      }
    }))
  ];

  return <MapView markers={markers} {...props} />;
};

export const HospitalMap = ({ ambulances = [], ...props }) => {
  const markers = ambulances.map((ambulance, index) => ({
    id: `ambulance-${index}`,
    lat: ambulance.lat,
    lng: ambulance.lng,
    type: 'responder',
    color: '#10b981',
    popup: {
      title: `Ambulance ${ambulance.id || index + 1}`,
      description: `ETA: ${ambulance.eta || 'Calculating...'}`
    }
  }));

  return <MapView markers={markers} {...props} />;
};

export default MapView;
