import React, { useState, useEffect, useRef } from 'react';

// Declare global Google Maps object for TypeScript
declare const google: any;
declare global {
  interface Window {
    google: any;
  }
}
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { ClinicBranch } from '../../types/clinicBranch';

interface ClinicMapViewProps {
  branches: ClinicBranch[];
  selectedBranchId?: string;
  onBranchSelect?: (branchId: string) => void;
  className?: string;
  height?: string;
  showControls?: boolean;
  apiKey?: string;
}

interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  title: string;
  branch: ClinicBranch;
}

const ClinicMapView: React.FC<ClinicMapViewProps> = ({
  branches,
  selectedBranchId,
  onBranchSelect,
  className = '',
  height = '400px',
  showControls = true,
  apiKey
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [infoWindow, setInfoWindow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Default coordinates for Egypt (center of the country)
  const defaultCenter = { lat: 26.8206, lng: 30.8025 };

  // Prepare markers data
  const mapMarkers: MapMarker[] = branches
    .filter(branch => branch.address.coordinates)
    .map(branch => ({
      id: branch.id,
      position: {
        lat: branch.address.coordinates!.latitude,
        lng: branch.address.coordinates!.longitude
      },
      title: branch.displayName,
      branch
    }));

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        // Check if Google Maps is already loaded
        if (window.google && window.google.maps) {
          initializeMap();
          return;
        }

        // Use provided API key or fallback to embedded maps
        if (!apiKey) {
          setError('Google Maps API key not provided. Using fallback map view.');
          setLoading(false);
          return;
        }

        // Load Google Maps API
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = initializeMap;
        script.onerror = () => {
          setError('Failed to load Google Maps API');
          setLoading(false);
        };

        document.head.appendChild(script);

        return () => {
          document.head.removeChild(script);
        };
      } catch (_err) {
        setError('Error loading Google Maps');
        setLoading(false);
      }
    };

    loadGoogleMaps();
  }, [apiKey]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Could not get user location:', error);
        },
        { timeout: 10000 }
      );
    }
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    try {
      // Calculate center point from all markers or use default
      const center = mapMarkers.length > 0
        ? calculateCenter(mapMarkers.map(m => m.position))
        : defaultCenter;

      // Create map
      const mapInstance = new google.maps.Map(mapRef.current, {
        center,
        zoom: mapMarkers.length > 1 ? 8 : 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi.business',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'poi.medical',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });

      setMap(mapInstance);

      // Create info window
      const infoWindowInstance = new google.maps.InfoWindow();
      setInfoWindow(infoWindowInstance);

      // Add markers
      const markerInstances = mapMarkers.map(markerData => {
        const marker = new google.maps.Marker({
          position: markerData.position,
          map: mapInstance,
          title: markerData.title,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="#2563eb" stroke="#ffffff" stroke-width="2"/>
                <path d="M16 8l-3 8h2v4h2v-4h2l-3-8z" fill="#ffffff"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16)
          }
        });

        // Add click listener
        marker.addListener('click', () => {
          // Update info window content
          const content = createInfoWindowContent(markerData.branch);
          infoWindowInstance.setContent(content);
          infoWindowInstance.open(mapInstance, marker);

          // Notify parent component
          if (onBranchSelect) {
            onBranchSelect(markerData.id);
          }
        });

        return marker;
      });

      setMarkers(markerInstances);

      // Add user location marker if available
      if (userLocation) {
        new google.maps.Marker({
          position: userLocation,
          map: mapInstance,
          title: 'Your Location',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="#10b981" stroke="#ffffff" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" fill="#ffffff"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12)
          }
        });
      }

      // Fit bounds to show all markers
      if (mapMarkers.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        mapMarkers.forEach(marker => bounds.extend(marker.position));
        if (userLocation) bounds.extend(userLocation);
        mapInstance.fitBounds(bounds);
      }

      setLoading(false);
    } catch (_err) {
      setError('Error initializing map');
      setLoading(false);
    }
  };

  const calculateCenter = (positions: { lat: number; lng: number }[]) => {
    const lat = positions.reduce((sum, pos) => sum + pos.lat, 0) / positions.length;
    const lng = positions.reduce((sum, pos) => sum + pos.lng, 0) / positions.length;
    return { lat, lng };
  };

  const createInfoWindowContent = (branch: ClinicBranch) => {
    return `
      <div style="max-width: 300px; padding: 12px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
          ${branch.displayName}
        </h3>
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
          ${branch.address.street}<br>
          ${branch.address.city}, ${branch.address.state}
        </p>
        <div style="margin: 8px 0; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; display: inline-block; ${
          branch.currentStatus.isOpen 
            ? 'background-color: #dcfce7; color: #166534;' 
            : 'background-color: #fef2f2; color: #991b1b;'
        }">
          ${branch.currentStatus.statusText}
        </div>
        <div style="margin-top: 12px; display: flex; gap: 8px;">
          <a href="tel:${branch.phone}" 
             style="padding: 6px 12px; background-color: #2563eb; color: white; text-decoration: none; 
                    border-radius: 4px; font-size: 12px; font-weight: 500;">
            Call Now
          </a>
          <a href="${branch.directionsUrl || branch.mapUrl}" target="_blank"
             style="padding: 6px 12px; background-color: #f3f4f6; color: #374151; text-decoration: none; 
                    border-radius: 4px; font-size: 12px; font-weight: 500; border: 1px solid #d1d5db;">
            Directions
          </a>
        </div>
      </div>
    `;
  };

  const handleBranchSelect = (branchId: string) => {
    const marker = markers.find((_, index) => mapMarkers[index]?.id === branchId);
    const markerData = mapMarkers.find(m => m.id === branchId);
    
    if (marker && markerData && map && infoWindow) {
      map.setCenter(markerData.position);
      map.setZoom(14);
      
      const content = createInfoWindowContent(markerData.branch);
      infoWindow.setContent(content);
      infoWindow.open(map, marker);
    }
  };

  // Update selected marker when prop changes
  useEffect(() => {
    if (selectedBranchId) {
      handleBranchSelect(selectedBranchId);
    }
  }, [selectedBranchId, markers, map, infoWindow]);

  const handleGetDirections = (branch: ClinicBranch) => {
    if (userLocation) {
      const directionsUrl = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${encodeURIComponent(
        `${branch.address.street}, ${branch.address.city}, ${branch.address.country}`
      )}`;
      window.open(directionsUrl, '_blank');
    } else {
      window.open(branch.directionsUrl || branch.mapUrl, '_blank');
    }
  };

  // Fallback view when Google Maps is not available
  if (error && !apiKey) {
    return (
      <div className={`${className}`} style={{ height }}>
        <div className="h-full bg-gray-100 rounded-lg overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Static Map Header */}
            <div className="bg-white p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Clinic Locations</h3>
              <p className="text-sm text-gray-600">
                Interactive map requires Google Maps API. View individual locations below.
              </p>
            </div>

            {/* Branch List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className={`
                    p-4 bg-white rounded-lg border-2 transition-colors duration-200 cursor-pointer
                    ${selectedBranchId === branch.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                  onClick={() => onBranchSelect?.(branch.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{branch.displayName}</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {branch.address.street}<br />
                        {branch.address.city}, {branch.address.state}
                      </p>
                      <div className={`
                        inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${branch.currentStatus.isOpen 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                        }
                      `}>
                        {branch.currentStatus.statusText}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2 ml-4">
                      <a
                        href={`tel:${branch.phone}`}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 
                                 transition-colors duration-200 text-center"
                      >
                        Call
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGetDirections(branch);
                        }}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 
                                 transition-colors duration-200"
                      >
                        Directions
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {loading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {error && apiKey && (
        <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-10">
          <div className="text-center p-6">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">Map Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      <div ref={mapRef} className="w-full h-full rounded-lg" />

      {/* Map Controls */}
      {showControls && map && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 space-y-2">
          <button
            onClick={() => {
              if (userLocation && map) {
                map.setCenter(userLocation);
                map.setZoom(12);
              }
            }}
            disabled={!userLocation}
            className="block w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            title="Center on your location"
          >
            My Location
          </button>
          
          <button
            onClick={() => {
              if (map && mapMarkers.length > 0) {
                const bounds = new google.maps.LatLngBounds();
                mapMarkers.forEach(marker => bounds.extend(marker.position));
                map.fitBounds(bounds);
              }
            }}
            className="block w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded 
                     transition-colors duration-200"
            title="Show all clinics"
          >
            Show All
          </button>
        </div>
      )}
    </div>
  );
};

export default ClinicMapView;