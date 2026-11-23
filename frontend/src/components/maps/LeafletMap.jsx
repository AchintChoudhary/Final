import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// SVG Icon Helpers
const createBusIcon = (isActive = true) => {
  return L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: 0; background-color: #1769F4; opacity: 0.25; border-radius: 9999px; ${
          isActive ? 'animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;' : ''
        }"></div>
        <div style="width: 32px; height: 32px; background-color: #1769F4; border: 2.5px solid #FFFFFF; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 6v6"/>
            <path d="M15 6v6"/>
            <path d="M2 12h19.6"/>
            <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.6-.4-1-1-1H3c-.6 0-1 .4-1 1 0 .4.1.8.2 1.2l.8 2.8h3"/>
            <circle cx="7" cy="18" r="2"/>
            <path d="M9 18h5"/>
            <circle cx="16" cy="18" r="2"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

const createPinIcon = (color = '#16A34A', label = '') => {
  return L.divIcon({
    className: 'custom-pin-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center;">
        ${label ? `<span style="background: #0F172A; color: #FFFFFF; font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 4px; margin-bottom: 2px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${label}</span>` : ''}
        <div style="width: 22px; height: 22px; background: ${color}; border: 2.5px solid #FFFFFF; border-radius: 9999px; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <div style="width: 6px; height: 6px; background: #FFFFFF; border-radius: 9999px;"></div>
        </div>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, label ? 38 : 11],
    popupAnchor: [0, -25],
  });
};

export const LeafletMap = ({
  center = [22.7196, 75.8577], // Default Indore
  zoom = 12,
  routeCoordinates = null, // GeoJSON LineString coordinates [[lng, lat], ...]
  origin = null, // { name, coordinates: [lng, lat] }
  destination = null, // { name, coordinates: [lng, lat] }
  busLocation = null, // [lng, lat]
  stops = [], // array of { name, coordinates: [lng, lat], order }
  pickupLocation = null, // [lng, lat]
  height = '400px',
  className = '',
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const polylineLayerRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
      }).setView(center, zoom);

      // Clean, light, modern transport tiles (CartoDB Positron / OSM)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      polylineLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Route Polyline & Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current || !polylineLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    polylineLayerRef.current.clearLayers();

    const bounds = [];

    // 1. Draw Route Polyline
    if (routeCoordinates && routeCoordinates.length > 1) {
      // Leaflet expects [lat, lng]
      const latLngs = routeCoordinates.map((c) => [c[1], c[0]]);
      const polyline = L.polyline(latLngs, {
        color: '#1769F4',
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(polylineLayerRef.current);

      latLngs.forEach((pt) => bounds.push(pt));
    }

    // 2. Origin Marker (Green)
    if (origin && origin.coordinates) {
      const latLng = [origin.coordinates[1], origin.coordinates[0]];
      L.marker(latLng, { icon: createPinIcon('#16A34A', origin.name || 'Start') })
        .bindPopup(`<b>Start Location:</b><br/>${origin.name || 'Origin'}`)
        .addTo(markersLayerRef.current);
      bounds.push(latLng);
    }

    // 3. Destination Marker (Red)
    if (destination && destination.coordinates) {
      const latLng = [destination.coordinates[1], destination.coordinates[0]];
      L.marker(latLng, { icon: createPinIcon('#EF4444', destination.name || 'Destination') })
        .bindPopup(`<b>Destination:</b><br/>${destination.name || 'Destination'}`)
        .addTo(markersLayerRef.current);
      bounds.push(latLng);
    }

    // 4. Passenger Pickup Marker (Green with pulse)
    if (pickupLocation) {
      const latLng = [pickupLocation[1], pickupLocation[0]];
      L.marker(latLng, { icon: createPinIcon('#16A34A', 'Your Pickup') })
        .bindPopup('<b>Your Pickup Point</b>')
        .addTo(markersLayerRef.current);
      bounds.push(latLng);
    }

    // 5. Intermediate Stops
    if (stops && stops.length > 0) {
      stops.forEach((stop) => {
        if (stop.coordinates) {
          const latLng = [stop.coordinates[1], stop.coordinates[0]];
          L.marker(latLng, { icon: createPinIcon('#64748B', stop.name) })
            .bindPopup(`<b>Stop:</b> ${stop.name}`)
            .addTo(markersLayerRef.current);
          bounds.push(latLng);
        }
      });
    }

    // 6. Live Bus Marker
    if (busLocation && busLocation.length === 2) {
      const latLng = [busLocation[1], busLocation[0]];
      L.marker(latLng, { icon: createBusIcon(true) })
        .bindPopup('<b>Active Bus Location</b>')
        .addTo(markersLayerRef.current);
      bounds.push(latLng);
    }

    // Fit map bounds to view all elements
    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    }
  }, [routeCoordinates, origin, destination, busLocation, stops, pickupLocation]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: '100%' }}
      className={`rounded-xl overflow-hidden border border-[#E2E8F0] shadow-xs z-10 ${className}`}
    />
  );
};
