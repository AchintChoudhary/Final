import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (character) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]
  );

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
  const safeLabel = escapeHtml(label);
  return L.divIcon({
    className: 'custom-pin-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center;">
        ${
          safeLabel
            ? `<span style="background: #0F172A; color: #FFFFFF; font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 4px; margin-bottom: 2px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.25);">${safeLabel}</span>`
            : ''
        }
        <div style="width: 22px; height: 22px; background: ${color}; border: 2.5px solid #FFFFFF; border-radius: 9999px; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <div style="width: 6px; height: 6px; background: #FFFFFF; border-radius: 9999px;"></div>
        </div>
      </div>
    `,
    iconSize: [32, 44],
    iconAnchor: [16, label ? 40 : 11],
    popupAnchor: [0, -25],
  });
};

export const LeafletMap = ({
  center = [0, 0],
  zoom = 2,
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
  const staticLayerRef = useRef(null);
  const busMarkerRef = useRef(null);

  // Initialize Map and TileLayer
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
      }).setView(center, zoom);

      // Backend tile proxy using existing Geoapify key with fallback
      const tileProxyUrl = '/api/tiles/{z}/{x}/{y}.png';

      const tileLayer = L.tileLayer(tileProxyUrl, {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://www.geoapify.com/">Geoapify</a>',
        maxZoom: 19,
        minZoom: 2,
      });

      // Handle tile error gracefully
      tileLayer.on('tileerror', (e) => {
        console.warn('[LeafletMap] Tile load error:', e.coords);
      });

      tileLayer.addTo(map);

      staticLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Invalidate size on initial mount for responsive flex containers
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        busMarkerRef.current = null;
        staticLayerRef.current = null;
      }
    };
  }, []);

  // Update Route Polyline & Static Markers (Fits bounds ONLY when route/stops change)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !staticLayerRef.current) return;

    staticLayerRef.current.clearLayers();
    const bounds = [];

    // 1. Process & Draw Route Polyline
    let rawCoords = routeCoordinates;
    if (rawCoords && typeof rawCoords === 'object' && rawCoords.coordinates) {
      rawCoords = rawCoords.coordinates;
    }

    let flatGeoJsonCoords = [];
    if (Array.isArray(rawCoords) && rawCoords.length > 0) {
      if (Array.isArray(rawCoords[0]) && Array.isArray(rawCoords[0][0])) {
        flatGeoJsonCoords = rawCoords.flat(1);
      } else {
        flatGeoJsonCoords = rawCoords;
      }
    }

    // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
    const validLatLngs = flatGeoJsonCoords
      .filter((pt) => Array.isArray(pt) && pt.length >= 2 && !isNaN(pt[0]) && !isNaN(pt[1]))
      .map((pt) => [Number(pt[1]), Number(pt[0])]);

    if (validLatLngs.length > 1) {
      L.polyline(validLatLngs, {
        color: '#1769F4',
        weight: 5,
        opacity: 0.88,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(staticLayerRef.current);

      validLatLngs.forEach((pt) => bounds.push(pt));
    }

    // 2. Origin Marker (Green)
    if (origin && origin.coordinates && origin.coordinates.length >= 2) {
      const latLng = [Number(origin.coordinates[1]), Number(origin.coordinates[0])];
      L.marker(latLng, { icon: createPinIcon('#16A34A', origin.name || 'Start') })
        .bindPopup(`<b>Start Location:</b><br/>${escapeHtml(origin.name || 'Origin')}`)
        .addTo(staticLayerRef.current);
      bounds.push(latLng);
    }

    // 3. Destination Marker (Red)
    if (destination && destination.coordinates && destination.coordinates.length >= 2) {
      const latLng = [Number(destination.coordinates[1]), Number(destination.coordinates[0])];
      L.marker(latLng, { icon: createPinIcon('#EF4444', destination.name || 'Destination') })
        .bindPopup(`<b>Destination:</b><br/>${escapeHtml(destination.name || 'Destination')}`)
        .addTo(staticLayerRef.current);
      bounds.push(latLng);
    }

    // 4. Passenger Pickup Marker (Green)
    if (pickupLocation && pickupLocation.length >= 2) {
      const latLng = [Number(pickupLocation[1]), Number(pickupLocation[0])];
      L.marker(latLng, { icon: createPinIcon('#16A34A', 'Your Pickup') })
        .bindPopup('<b>Your Pickup Point</b>')
        .addTo(staticLayerRef.current);
      bounds.push(latLng);
    }

    // 5. Intermediate Stops
    if (stops && stops.length > 0) {
      stops.forEach((stop) => {
        if (stop.coordinates && stop.coordinates.length >= 2) {
          const latLng = [Number(stop.coordinates[1]), Number(stop.coordinates[0])];
          L.marker(latLng, { icon: createPinIcon('#64748B', stop.name) })
            .bindPopup(`<b>Stop:</b> ${escapeHtml(stop.name || 'Confirmed stop')}`)
            .addTo(staticLayerRef.current);
          bounds.push(latLng);
        }
      });
    }

    // Fit bounds only when route or static stops load
    if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), {
        padding: [40, 40],
        maxZoom: 15,
        animate: true,
      });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    }

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);
  }, [routeCoordinates, origin, destination, stops, pickupLocation]);

  // Update Live Bus Marker smoothly WITHOUT resetting zoom or re-fitting bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (busLocation && Array.isArray(busLocation) && busLocation.length >= 2) {
      const latLng = [Number(busLocation[1]), Number(busLocation[0])];

      if (busMarkerRef.current) {
        busMarkerRef.current.setLatLng(latLng);
      } else {
        busMarkerRef.current = L.marker(latLng, { icon: createBusIcon(true) })
          .bindPopup('<b>Active Bus Location</b>')
          .addTo(map);
      }
    } else if (busMarkerRef.current) {
      busMarkerRef.current.remove();
      busMarkerRef.current = null;
    }
  }, [busLocation]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: '100%' }}
      className={`rounded-xl overflow-hidden border border-[#E2E8F0] shadow-xs z-10 ${className}`}
    />
  );
};
