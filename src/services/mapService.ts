import { Loader } from '@googlemaps/js-api-loader';
import mapboxgl from 'mapbox-gl';

export interface Location {
  lat: number;
  lng: number;
}

export interface BusinessLocation extends Location {
  id: string;
  name: string;
  address: string;
  rating: number;
  priceRange: string;
  imageUrl?: string;
  distance?: number;
}

export interface MapProvider {
  name: 'google' | 'mapbox';
  initialize(element: HTMLElement, center: Location, zoom?: number): Promise<void>;
  addMarkers(locations: BusinessLocation[]): void;
  setCenter(location: Location): void;
  setZoom(zoom: number): void;
  getCenter(): Location;
  getBounds(): { ne: Location; sw: Location } | null;
  fitBounds(locations: Location[]): void;
  destroy(): void;
}

class GoogleMapsProvider implements MapProvider {
  name: 'google' = 'google';
  private map: google.maps.Map | null = null;
  private markers: google.maps.Marker[] = [];
  private infoWindows: google.maps.InfoWindow[] = [];
  private loader: Loader;

  constructor(apiKey: string) {
    this.loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry']
    });
  }

  async initialize(element: HTMLElement, center: Location, zoom: number = 12): Promise<void> {
    try {
      await this.loader.load();
      
      this.map = new google.maps.Map(element, {
        center,
        zoom,
        styles: [
          {
            featureType: 'poi.business',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'poi.medical',
            stylers: [{ visibility: 'off' }]
          }
        ],
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM
        }
      });

      // Add custom control buttons
      this.addCustomControls();
    } catch (error) {
      console.error('Failed to initialize Google Maps:', error);
      throw error;
    }
  }

  addMarkers(locations: BusinessLocation[]): void {
    if (!this.map) return;

    // Clear existing markers
    this.clearMarkers();

    locations.forEach((location) => {
      if (!this.map) return;

      // Create custom marker icon
      const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: this.map,
        title: location.name,
        icon: {
          url: this.createMarkerIcon(location.rating, location.priceRange),
          scaledSize: new google.maps.Size(40, 50),
          anchor: new google.maps.Point(20, 50)
        },
        animation: google.maps.Animation.DROP
      });

      // Create info window
      const infoWindow = new google.maps.InfoWindow({
        content: this.createInfoWindowContent(location)
      });

      marker.addListener('click', () => {
        // Close all other info windows
        this.infoWindows.forEach(iw => iw.close());
        infoWindow.open(this.map!, marker);
      });

      this.markers.push(marker);
      this.infoWindows.push(infoWindow);
    });
  }

  setCenter(location: Location): void {
    if (this.map) {
      this.map.setCenter(location);
    }
  }

  setZoom(zoom: number): void {
    if (this.map) {
      this.map.setZoom(zoom);
    }
  }

  getCenter(): Location {
    if (this.map) {
      const center = this.map.getCenter();
      return {
        lat: center?.lat() || 0,
        lng: center?.lng() || 0
      };
    }
    return { lat: 0, lng: 0 };
  }

  getBounds(): { ne: Location; sw: Location } | null {
    if (this.map) {
      const bounds = this.map.getBounds();
      if (bounds) {
        return {
          ne: {
            lat: bounds.getNorthEast().lat(),
            lng: bounds.getNorthEast().lng()
          },
          sw: {
            lat: bounds.getSouthWest().lat(),
            lng: bounds.getSouthWest().lng()
          }
        };
      }
    }
    return null;
  }

  fitBounds(locations: Location[]): void {
    if (!this.map || locations.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    locations.forEach(location => {
      bounds.extend(location);
    });
    
    this.map.fitBounds(bounds, { padding: 50 });
  }

  private clearMarkers(): void {
    this.markers.forEach(marker => marker.setMap(null));
    this.infoWindows.forEach(infoWindow => infoWindow.close());
    this.markers = [];
    this.infoWindows = [];
  }

  private createMarkerIcon(rating: number, priceRange: string): string {
    // Create SVG marker with rating and price info
    const color = rating >= 4.5 ? '#16a34a' : rating >= 4.0 ? '#eab308' : '#dc2626';
    
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 0C9 0 0 9 0 20s20 30 20 30 20-19 20-30S31 0 20 0z" fill="${color}"/>
        <circle cx="20" cy="18" r="12" fill="white"/>
        <text x="20" y="22" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="${color}">
          ${rating.toFixed(1)}
        </text>
        <text x="20" y="32" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="white">
          ${priceRange}
        </text>
      </svg>
    `)}`;
  }

  private createInfoWindowContent(location: BusinessLocation): string {
    return `
      <div class="p-3 max-w-xs">
        <div class="flex items-start space-x-3">
          ${location.imageUrl ? 
            `<img src="${location.imageUrl}" alt="${location.name}" class="w-16 h-16 rounded-lg object-cover">` : 
            `<div class="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
              <span class="text-gray-400 text-xs">No Image</span>
            </div>`
          }
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900 mb-1">${location.name}</h3>
            <p class="text-sm text-gray-600 mb-2">${location.address}</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <span class="text-yellow-500">⭐</span>
                <span class="text-sm font-medium ml-1">${location.rating}</span>
                <span class="text-sm text-gray-500 ml-2">${location.priceRange}</span>
              </div>
              ${location.distance ? 
                `<span class="text-xs text-gray-500">${location.distance.toFixed(1)} mi</span>` : 
                ''
              }
            </div>
            <button 
              onclick="window.dispatchEvent(new CustomEvent('business-selected', { detail: '${location.id}' }))"
              class="mt-2 w-full px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private addCustomControls(): void {
    if (!this.map) return;

    // Add current location button
    const locationButton = document.createElement('button');
    locationButton.textContent = '📍';
    locationButton.className = 'bg-white border border-gray-300 rounded-md p-2 shadow-sm hover:bg-gray-50 m-2';
    locationButton.title = 'Go to current location';

    locationButton.addEventListener('click', () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            this.setCenter(location);
            this.setZoom(15);
          },
          (error) => {
            console.error('Error getting location:', error);
          }
        );
      }
    });

    this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(locationButton);
  }

  destroy(): void {
    this.clearMarkers();
    this.map = null;
  }
}

class MapboxProvider implements MapProvider {
  name: 'mapbox' = 'mapbox';
  private map: mapboxgl.Map | null = null;
  private markers: mapboxgl.Marker[] = [];

  constructor(accessToken: string) {
    mapboxgl.accessToken = accessToken;
  }

  async initialize(element: HTMLElement, center: Location, zoom: number = 12): Promise<void> {
    try {
      this.map = new mapboxgl.Map({
        container: element,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [center.lng, center.lat],
        zoom,
        attributionControl: false
      });

      // Add navigation controls
      this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

      // Add current location control
      this.map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true
        }),
        'bottom-right'
      );

      await new Promise<void>((resolve) => {
        this.map!.on('load', () => resolve());
      });

    } catch (error) {
      console.error('Failed to initialize Mapbox:', error);
      throw error;
    }
  }

  addMarkers(locations: BusinessLocation[]): void {
    if (!this.map) return;

    // Clear existing markers
    this.clearMarkers();

    locations.forEach((location) => {
      if (!this.map) return;

      // Create custom marker element
      const el = document.createElement('div');
      el.innerHTML = this.createMarkerHTML(location.rating, location.priceRange);
      el.className = 'custom-marker';
      el.style.cursor = 'pointer';

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(this.createPopupContent(location));

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([location.lng, location.lat])
        .setPopup(popup)
        .addTo(this.map);

      this.markers.push(marker);
    });
  }

  setCenter(location: Location): void {
    if (this.map) {
      this.map.setCenter([location.lng, location.lat]);
    }
  }

  setZoom(zoom: number): void {
    if (this.map) {
      this.map.setZoom(zoom);
    }
  }

  getCenter(): Location {
    if (this.map) {
      const center = this.map.getCenter();
      return {
        lat: center.lat,
        lng: center.lng
      };
    }
    return { lat: 0, lng: 0 };
  }

  getBounds(): { ne: Location; sw: Location } | null {
    if (this.map) {
      const bounds = this.map.getBounds();
      return {
        ne: {
          lat: bounds.getNorthEast().lat,
          lng: bounds.getNorthEast().lng
        },
        sw: {
          lat: bounds.getSouthWest().lat,
          lng: bounds.getSouthWest().lng
        }
      };
    }
    return null;
  }

  fitBounds(locations: Location[]): void {
    if (!this.map || locations.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    locations.forEach(location => {
      bounds.extend([location.lng, location.lat]);
    });
    
    this.map.fitBounds(bounds, { padding: 50 });
  }

  private clearMarkers(): void {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
  }

  private createMarkerHTML(rating: number, priceRange: string): string {
    const color = rating >= 4.5 ? '#16a34a' : rating >= 4.0 ? '#eab308' : '#dc2626';
    
    return `
      <div class="relative">
        <svg width="40" height="50" viewBox="0 0 40 50">
          <path d="M20 0C9 0 0 9 0 20s20 30 20 30 20-19 20-30S31 0 20 0z" fill="${color}"/>
          <circle cx="20" cy="18" r="12" fill="white"/>
          <text x="20" y="22" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="${color}">
            ${rating.toFixed(1)}
          </text>
          <text x="20" y="32" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="white">
            ${priceRange}
          </text>
        </svg>
      </div>
    `;
  }

  private createPopupContent(location: BusinessLocation): string {
    return `
      <div class="p-3 max-w-xs">
        <div class="flex items-start space-x-3">
          ${location.imageUrl ? 
            `<img src="${location.imageUrl}" alt="${location.name}" class="w-16 h-16 rounded-lg object-cover">` : 
            `<div class="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
              <span class="text-gray-400 text-xs">No Image</span>
            </div>`
          }
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900 mb-1">${location.name}</h3>
            <p class="text-sm text-gray-600 mb-2">${location.address}</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <span class="text-yellow-500">⭐</span>
                <span class="text-sm font-medium ml-1">${location.rating}</span>
                <span class="text-sm text-gray-500 ml-2">${location.priceRange}</span>
              </div>
              ${location.distance ? 
                `<span class="text-xs text-gray-500">${location.distance.toFixed(1)} mi</span>` : 
                ''
              }
            </div>
            <button 
              onclick="window.dispatchEvent(new CustomEvent('business-selected', { detail: '${location.id}' }))"
              class="mt-2 w-full px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    `;
  }

  destroy(): void {
    this.clearMarkers();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}

export class MapService {
  private provider: MapProvider | null = null;
  private currentProvider: 'google' | 'mapbox' | null = null;

  constructor(
    private googleMapsApiKey?: string,
    private mapboxAccessToken?: string
  ) {}

  async initializeGoogleMaps(element: HTMLElement, center: Location, zoom?: number): Promise<void> {
    if (!this.googleMapsApiKey) {
      throw new Error('Google Maps API key is required');
    }

    this.destroyCurrentProvider();
    this.provider = new GoogleMapsProvider(this.googleMapsApiKey);
    this.currentProvider = 'google';
    
    await this.provider.initialize(element, center, zoom);
  }

  async initializeMapbox(element: HTMLElement, center: Location, zoom?: number): Promise<void> {
    if (!this.mapboxAccessToken) {
      throw new Error('Mapbox access token is required');
    }

    this.destroyCurrentProvider();
    this.provider = new MapboxProvider(this.mapboxAccessToken);
    this.currentProvider = 'mapbox';
    
    await this.provider.initialize(element, center, zoom);
  }

  async initializeBestAvailable(element: HTMLElement, center: Location, zoom?: number): Promise<void> {
    // Try Google Maps first, fall back to Mapbox
    if (this.googleMapsApiKey) {
      try {
        await this.initializeGoogleMaps(element, center, zoom);
        return;
      } catch (error) {
        console.warn('Google Maps initialization failed, trying Mapbox:', error);
      }
    }

    if (this.mapboxAccessToken) {
      await this.initializeMapbox(element, center, zoom);
      return;
    }

    throw new Error('No map providers are available. Please provide API keys.');
  }

  addMarkers(locations: BusinessLocation[]): void {
    if (this.provider) {
      this.provider.addMarkers(locations);
    }
  }

  setCenter(location: Location): void {
    if (this.provider) {
      this.provider.setCenter(location);
    }
  }

  setZoom(zoom: number): void {
    if (this.provider) {
      this.provider.setZoom(zoom);
    }
  }

  getCenter(): Location {
    return this.provider ? this.provider.getCenter() : { lat: 0, lng: 0 };
  }

  getBounds(): { ne: Location; sw: Location } | null {
    return this.provider ? this.provider.getBounds() : null;
  }

  fitBounds(locations: Location[]): void {
    if (this.provider) {
      this.provider.fitBounds(locations);
    }
  }

  getCurrentProvider(): 'google' | 'mapbox' | null {
    return this.currentProvider;
  }

  isInitialized(): boolean {
    return this.provider !== null;
  }

  private destroyCurrentProvider(): void {
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
      this.currentProvider = null;
    }
  }

  destroy(): void {
    this.destroyCurrentProvider();
  }

  // Utility methods
  static calculateDistance(point1: Location, point2: Location): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static async geocodeAddress(address: string): Promise<Location | null> {
    // This would typically use the Google Geocoding API or Mapbox Geocoding API
    // For now, return a mock implementation
    console.warn('Geocoding not implemented. Use Google Geocoding API or Mapbox Geocoding API');
    return null;
  }

  static async reverseGeocode(location: Location): Promise<string | null> {
    // This would typically use reverse geocoding APIs
    console.warn('Reverse geocoding not implemented');
    return null;
  }
}

// Export singleton instance
export const mapService = new MapService(
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
);