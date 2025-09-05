import React, { useEffect, useRef, useState, useCallback } from 'react';
import { mapService, BusinessLocation, Location } from '../services/mapService';

interface InteractiveMapProps {
  businesses: BusinessLocation[];
  center?: Location;
  zoom?: number;
  onBusinessSelect?: (businessId: string) => void;
  onMapMove?: (center: Location, bounds: { ne: Location; sw: Location }) => void;
  className?: string;
  provider?: 'google' | 'mapbox' | 'auto';
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  businesses,
  center = { lat: 40.7128, lng: -74.0060 }, // Default to NYC
  zoom = 12,
  onBusinessSelect,
  onMapMove,
  className = '',
  provider = 'auto'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<'google' | 'mapbox' | null>(null);

  // Initialize map
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return;

      try {
        setError(null);
        setIsLoaded(false);

        if (provider === 'google') {
          await mapService.initializeGoogleMaps(mapRef.current, center, zoom);
        } else if (provider === 'mapbox') {
          await mapService.initializeMapbox(mapRef.current, center, zoom);
        } else {
          await mapService.initializeBestAvailable(mapRef.current, center, zoom);
        }

        setCurrentProvider(mapService.getCurrentProvider());
        setIsLoaded(true);
      } catch (err) {
        console.error('Map initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize map');
      }
    };

    initializeMap();

    // Cleanup on unmount
    return () => {
      mapService.destroy();
    };
  }, [center.lat, center.lng, zoom, provider]);

  // Add markers when businesses change
  useEffect(() => {
    if (isLoaded && businesses.length > 0) {
      mapService.addMarkers(businesses);
      
      // Fit bounds to show all markers
      if (businesses.length > 1) {
        mapService.fitBounds(businesses);
      }
    }
  }, [businesses, isLoaded]);

  // Handle business selection events
  useEffect(() => {
    const handleBusinessSelection = (event: CustomEvent) => {
      const businessId = event.detail;
      if (onBusinessSelect) {
        onBusinessSelect(businessId);
      }
    };

    window.addEventListener('business-selected', handleBusinessSelection as EventListener);
    
    return () => {
      window.removeEventListener('business-selected', handleBusinessSelection as EventListener);
    };
  }, [onBusinessSelect]);

  // Handle map movement
  useEffect(() => {
    if (!isLoaded || !onMapMove) return;

    const handleMapMove = () => {
      const center = mapService.getCenter();
      const bounds = mapService.getBounds();
      
      if (bounds) {
        onMapMove(center, bounds);
      }
    };

    // Set up map move listeners based on provider
    let cleanup: (() => void) | null = null;

    if (currentProvider === 'google') {
      // Google Maps event listener would be set up here
      // This would require accessing the underlying Google Maps instance
      console.log('Google Maps move listeners not implemented in this demo');
    } else if (currentProvider === 'mapbox') {
      // Mapbox event listener would be set up here
      console.log('Mapbox move listeners not implemented in this demo');
    }

    return cleanup || (() => {});
  }, [isLoaded, currentProvider, onMapMove]);

  const recenterMap = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          mapService.setCenter(userLocation);
          mapService.setZoom(15);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const zoomIn = useCallback(() => {
    const currentZoom = 12; // Would get from map service
    mapService.setZoom(currentZoom + 1);
  }, []);

  const zoomOut = useCallback(() => {
    const currentZoom = 12; // Would get from map service
    mapService.setZoom(currentZoom - 1);
  }, []);

  const fitAllMarkers = useCallback(() => {
    if (businesses.length > 0) {
      mapService.fitBounds(businesses);
    }
  }, [businesses]);

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Map Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
              <p className="mt-2">Please check your API keys and try again.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map container */}
      <div ref={mapRef} className="w-full h-full min-h-[400px]" />

      {/* Map controls */}
      {isLoaded && (
        <div className="absolute top-4 left-4 space-y-2 z-20">
          <button
            onClick={recenterMap}
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded-md p-2 shadow-sm text-gray-700 transition-colors"
            title="Go to my location"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          <button
            onClick={fitAllMarkers}
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded-md p-2 shadow-sm text-gray-700 transition-colors"
            title="Show all businesses"
            disabled={businesses.length === 0}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      )}

      {/* Map info */}
      {isLoaded && (
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-md px-3 py-1 text-xs text-gray-600 z-20">
          {currentProvider === 'google' ? 'Google Maps' : 'Mapbox'} • {businesses.length} locations
        </div>
      )}

      {/* Zoom controls */}
      {isLoaded && (
        <div className="absolute top-4 right-4 flex flex-col space-y-1 z-20">
          <button
            onClick={zoomIn}
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded-t-md px-3 py-2 shadow-sm text-gray-700 transition-colors font-bold"
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={zoomOut}
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded-b-md px-3 py-2 shadow-sm text-gray-700 transition-colors font-bold"
            title="Zoom out"
          >
            −
          </button>
        </div>
      )}
    </div>
  );
};

// Hook for easier integration
export const useMap = () => {
  const [mapInstance, setMapInstance] = useState(mapService);

  const addMarkers = useCallback((locations: BusinessLocation[]) => {
    mapInstance.addMarkers(locations);
  }, [mapInstance]);

  const setCenter = useCallback((location: Location) => {
    mapInstance.setCenter(location);
  }, [mapInstance]);

  const setZoom = useCallback((zoom: number) => {
    mapInstance.setZoom(zoom);
  }, [mapInstance]);

  return {
    mapInstance,
    addMarkers,
    setCenter,
    setZoom,
    isInitialized: mapInstance.isInitialized(),
    currentProvider: mapInstance.getCurrentProvider()
  };
};