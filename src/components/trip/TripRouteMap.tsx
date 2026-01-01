import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TripRouteMapProps {
  departureCity: string;
  destinationCity: string;
  departureLat?: number;
  departureLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}

// City coordinates database
const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  'sarajevo': { lat: 43.8563, lng: 18.4131 },
  'budapest': { lat: 47.4979, lng: 19.0402 },
  'zagreb': { lat: 45.8150, lng: 15.9819 },
  'belgrade': { lat: 44.7866, lng: 20.4489 },
  'vienna': { lat: 48.2082, lng: 16.3738 },
  'prague': { lat: 50.0755, lng: 14.4378 },
  'munich': { lat: 48.1351, lng: 11.5820 },
  'rome': { lat: 41.9028, lng: 12.4964 },
  'paris': { lat: 48.8566, lng: 2.3522 },
  'berlin': { lat: 52.5200, lng: 13.4050 },
  'mostar': { lat: 43.3438, lng: 17.8078 },
  'banja luka': { lat: 44.7722, lng: 17.1910 },
  'tuzla': { lat: 44.5384, lng: 18.6763 },
  'zenica': { lat: 44.2017, lng: 17.9078 },
  'dubrovnik': { lat: 42.6507, lng: 18.0944 },
  'split': { lat: 43.5081, lng: 16.4402 },
  'ljubljana': { lat: 46.0569, lng: 14.5058 },
  'skopje': { lat: 41.9981, lng: 21.4254 },
  'podgorica': { lat: 42.4304, lng: 19.2594 },
  'tirana': { lat: 41.3275, lng: 19.8187 },
  'athens': { lat: 37.9838, lng: 23.7275 },
  'venice': { lat: 45.4408, lng: 12.3155 },
  'florence': { lat: 43.7696, lng: 11.2558 },
  'amsterdam': { lat: 52.3676, lng: 4.9041 },
  'barcelona': { lat: 41.3851, lng: 2.1734 },
  'madrid': { lat: 40.4168, lng: -3.7038 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'krakow': { lat: 50.0647, lng: 19.9450 },
  'warsaw': { lat: 52.2297, lng: 21.0122 },
  'bratislava': { lat: 48.1486, lng: 17.1077 },
};

const getCoordinates = (city: string): { lat: number; lng: number } | null => {
  const normalizedCity = city.toLowerCase().trim();
  return cityCoordinates[normalizedCity] || null;
};

const TripRouteMap = ({ 
  departureCity, 
  destinationCity,
  departureLat,
  departureLng,
  destinationLat,
  destinationLng 
}: TripRouteMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Clean up previous map instance
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    // Get coordinates
    let depCoords = departureLat && departureLng 
      ? { lat: departureLat, lng: departureLng }
      : getCoordinates(departureCity);
    
    let destCoords = destinationLat && destinationLng
      ? { lat: destinationLat, lng: destinationLng }
      : getCoordinates(destinationCity);

    // Default to Sarajevo if no departure found
    if (!depCoords) {
      depCoords = { lat: 43.8563, lng: 18.4131 };
    }

    // Default to Budapest if no destination found
    if (!destCoords) {
      destCoords = { lat: 47.4979, lng: 19.0402 };
    }

    // Calculate center point
    const centerLat = (depCoords.lat + destCoords.lat) / 2;
    const centerLng = (depCoords.lng + destCoords.lng) / 2;

    // Create map
    mapInstance.current = L.map(mapContainer.current, {
      center: [centerLat, centerLng],
      zoom: 6,
      scrollWheelZoom: false,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance.current);

    // Custom icons
    const departureIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background: hsl(142, 76%, 36%); width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="4"/></svg>
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const destinationIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background: hsl(25, 95%, 53%); width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="hsl(25, 95%, 53%)"/></svg>
      </div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    // Add markers
    L.marker([depCoords.lat, depCoords.lng], { icon: departureIcon })
      .addTo(mapInstance.current)
      .bindPopup(`<strong>Polazište:</strong><br/>${departureCity || 'Sarajevo'}`);

    L.marker([destCoords.lat, destCoords.lng], { icon: destinationIcon })
      .addTo(mapInstance.current)
      .bindPopup(`<strong>Odredište:</strong><br/>${destinationCity || 'Budapest'}`);

    // Draw route line
    const routeLine = L.polyline(
      [[depCoords.lat, depCoords.lng], [destCoords.lat, destCoords.lng]],
      { 
        color: 'hsl(25, 95%, 53%)', 
        weight: 3, 
        opacity: 0.8,
        dashArray: '10, 10'
      }
    ).addTo(mapInstance.current);

    // Fit bounds to show both markers
    mapInstance.current.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [departureCity, destinationCity, departureLat, departureLng, destinationLat, destinationLng]);

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden border border-border">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm border border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-muted-foreground">Polazište</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="text-muted-foreground">Odredište</span>
        </div>
      </div>
    </div>
  );
};

export default TripRouteMap;
