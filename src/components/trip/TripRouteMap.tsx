import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RouteCoordinate {
  city: string;
  lat: number;
  lng: number;
  order: number;
}

interface TripRouteMapProps {
  departureCity: string;
  destinationCity: string;
  departureLat?: number;
  departureLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  routeCoordinates?: RouteCoordinate[];
}

// Extensive city coordinates database
const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  'sarajevo': { lat: 43.8563, lng: 18.4131 },
  'budapest': { lat: 47.4979, lng: 19.0402 },
  'budimpešta': { lat: 47.4979, lng: 19.0402 },
  'zagreb': { lat: 45.8150, lng: 15.9819 },
  'belgrade': { lat: 44.7866, lng: 20.4489 },
  'beograd': { lat: 44.7866, lng: 20.4489 },
  'vienna': { lat: 48.2082, lng: 16.3738 },
  'beč': { lat: 48.2082, lng: 16.3738 },
  'prague': { lat: 50.0755, lng: 14.4378 },
  'prag': { lat: 50.0755, lng: 14.4378 },
  'munich': { lat: 48.1351, lng: 11.5820 },
  'münchen': { lat: 48.1351, lng: 11.5820 },
  'rome': { lat: 41.9028, lng: 12.4964 },
  'rim': { lat: 41.9028, lng: 12.4964 },
  'paris': { lat: 48.8566, lng: 2.3522 },
  'pariz': { lat: 48.8566, lng: 2.3522 },
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
  'atena': { lat: 37.9838, lng: 23.7275 },
  'venice': { lat: 45.4408, lng: 12.3155 },
  'venecija': { lat: 45.4408, lng: 12.3155 },
  'florence': { lat: 43.7696, lng: 11.2558 },
  'firenca': { lat: 43.7696, lng: 11.2558 },
  'bologna': { lat: 44.4949, lng: 11.3426 },
  'padova': { lat: 45.4064, lng: 11.8768 },
  'amsterdam': { lat: 52.3676, lng: 4.9041 },
  'barcelona': { lat: 41.3851, lng: 2.1734 },
  'madrid': { lat: 40.4168, lng: -3.7038 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'krakow': { lat: 50.0647, lng: 19.9450 },
  'krakiv': { lat: 50.0647, lng: 19.9450 },
  'warsaw': { lat: 52.2297, lng: 21.0122 },
  'varšava': { lat: 52.2297, lng: 21.0122 },
  'bratislava': { lat: 48.1486, lng: 17.1077 },
  'salzburg': { lat: 47.8095, lng: 13.0550 },
  'innsbruck': { lat: 47.2692, lng: 11.4041 },
  'graz': { lat: 47.0707, lng: 15.4395 },
  'milan': { lat: 45.4642, lng: 9.1900 },
  'milano': { lat: 45.4642, lng: 9.1900 },
  'napoli': { lat: 40.8518, lng: 14.2681 },
  'naples': { lat: 40.8518, lng: 14.2681 },
  'pisa': { lat: 43.7228, lng: 10.4017 },
  'verona': { lat: 45.4384, lng: 10.9916 },
  'trieste': { lat: 45.6495, lng: 13.7768 },
  'trst': { lat: 45.6495, lng: 13.7768 },
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
  destinationLng,
  routeCoordinates
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

    // Build array of all route points
    let allPoints: { city: string; lat: number; lng: number; order: number }[] = [];

    if (routeCoordinates && routeCoordinates.length > 0) {
      // Use provided route coordinates
      allPoints = routeCoordinates.sort((a, b) => a.order - b.order);
    } else {
      // Fallback to departure/destination
      let depCoords = departureLat && departureLng 
        ? { lat: departureLat, lng: departureLng }
        : getCoordinates(departureCity);
      
      let destCoords = destinationLat && destinationLng
        ? { lat: destinationLat, lng: destinationLng }
        : getCoordinates(destinationCity);

      if (!depCoords) depCoords = { lat: 43.8563, lng: 18.4131 };
      if (!destCoords) destCoords = { lat: 47.4979, lng: 19.0402 };

      allPoints = [
        { city: departureCity || 'Sarajevo', lat: depCoords.lat, lng: depCoords.lng, order: 1 },
        { city: destinationCity || 'Budapest', lat: destCoords.lat, lng: destCoords.lng, order: 2 }
      ];
    }

    if (allPoints.length === 0) return;

    // Calculate center point
    const avgLat = allPoints.reduce((sum, p) => sum + p.lat, 0) / allPoints.length;
    const avgLng = allPoints.reduce((sum, p) => sum + p.lng, 0) / allPoints.length;

    // Create map
    mapInstance.current = L.map(mapContainer.current, {
      center: [avgLat, avgLng],
      zoom: 6,
      scrollWheelZoom: false,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance.current);

    // Create markers and polyline points
    const polylinePoints: [number, number][] = [];

    allPoints.forEach((point, index) => {
      const isFirst = index === 0;
      const isLast = index === allPoints.length - 1;
      const isIntermediate = !isFirst && !isLast;

      // Custom icon based on position
      let icon: L.DivIcon;
      
      if (isFirst) {
        icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background: hsl(142, 76%, 36%); width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
            ${index + 1}
          </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
      } else if (isLast) {
        icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background: hsl(25, 95%, 53%); width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">
            ★
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
      } else {
        icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background: hsl(221, 83%, 53%); width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px;">
            ${index + 1}
          </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
      }

      // Add marker
      const markerLabel = isFirst ? 'Polazište' : isLast ? 'Povratak' : `Stop ${index}`;
      L.marker([point.lat, point.lng], { icon })
        .addTo(mapInstance.current!)
        .bindPopup(`<strong>${markerLabel}:</strong><br/>${point.city}`);

      polylinePoints.push([point.lat, point.lng]);
    });

    // Draw route line
    if (polylinePoints.length > 1) {
      const routeLine = L.polyline(polylinePoints, { 
        color: 'hsl(25, 95%, 53%)', 
        weight: 4, 
        opacity: 0.8,
        dashArray: '12, 8'
      }).addTo(mapInstance.current);

      // Fit bounds to show all markers
      mapInstance.current.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [departureCity, destinationCity, departureLat, departureLng, destinationLat, destinationLng, routeCoordinates]);

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden border border-border">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm border border-border">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px] font-bold">1</div>
          <span className="text-muted-foreground">Polazište</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">2</div>
          <span className="text-muted-foreground">Međustanice</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">★</div>
          <span className="text-muted-foreground">Povratak</span>
        </div>
      </div>
    </div>
  );
};

export default TripRouteMap;
