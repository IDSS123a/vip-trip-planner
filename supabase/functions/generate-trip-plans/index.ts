import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TripRequest {
  departureCity: string;
  destinations: string[];
  tripType: string;
  gradeLevel: string;
  studentCount: number;
  chaperones: string[];
  transport: string;
  departureDate: string;
  returnDate: string;
  budget?: number;
  educationalFocus: string;
  specialNeeds: string;
  mealPlan?: string;
  accommodationType?: string;
  medicalInfo?: string;
}

interface POI {
  name: string;
  kind: string;
  lat: number;
  lng: number;
  address?: string;
  website?: string;
  phone?: string;
  openingHours?: string;
}

interface CityPOIs {
  city: string;
  lat: number;
  lng: number;
  museums: POI[];
  monuments: POI[];
  restaurants: POI[];
  hotels: POI[];
  parks: POI[];
  educational: POI[];
}

// Geocode city using Nominatim (completely free, no API key needed)
async function geocodeCity(cityName: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  try {
    const url = "https://nominatim.openstreetmap.org/search?q=" + encodeURIComponent(cityName) + "&format=json&limit=1&addressdetails=1";
    const response = await fetch(url, {
      headers: { 'User-Agent': 'IDSS-Trip-Planner/1.0 (info@idss.ba)' }
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), displayName: data[0].display_name };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error for " + cityName + ":", error);
    return null;
  }
}

// Fetch POIs using Overpass API (completely free, no API key needed)
async function fetchPOIsOverpass(lat: number, lng: number, poiType: string, limit: number = 15): Promise<POI[]> {
  try {
    let query = '';
    const radius = 3000;
    switch (poiType) {
      case 'museums':
        query = '[out:json][timeout:10];(node["tourism"="museum"](around:' + radius + ',' + lat + ',' + lng + ');way["tourism"="museum"](around:' + radius + ',' + lat + ',' + lng + '););out body ' + limit + ';';
        break;
      case 'monuments':
        query = '[out:json][timeout:10];(node["historic"](around:' + radius + ',' + lat + ',' + lng + ');node["tourism"="attraction"](around:' + radius + ',' + lat + ',' + lng + ');node["memorial"](around:' + radius + ',' + lat + ',' + lng + '););out body ' + limit + ';';
        break;
      case 'restaurants':
        query = '[out:json][timeout:10];(node["amenity"="restaurant"](around:' + radius + ',' + lat + ',' + lng + ');node["amenity"="cafe"](around:' + radius + ',' + lat + ',' + lng + ');node["amenity"="fast_food"](around:' + radius + ',' + lat + ',' + lng + '););out body ' + limit + ';';
        break;
      case 'hotels':
        query = '[out:json][timeout:10];(node["tourism"="hotel"](around:' + radius + ',' + lat + ',' + lng + ');node["tourism"="hostel"](around:' + radius + ',' + lat + ',' + lng + ');node["tourism"="guest_house"](around:' + radius + ',' + lat + ',' + lng + '););out body ' + limit + ';';
        break;
      case 'parks':
        query = '[out:json][timeout:10];(node["leisure"="park"](around:' + radius + ',' + lat + ',' + lng + ');way["leisure"="park"](around:' + radius + ',' + lat + ',' + lng + '););out body ' + limit + ';';
        break;
      case 'educational':
        query = '[out:json][timeout:10];(node["tourism"="gallery"](around:' + radius + ',' + lat + ',' + lng + ');node["amenity"="theatre"](around:' + radius + ',' + lat + ',' + lng + ');node["amenity"="library"](around:' + radius + ',' + lat + ',' + lng + ');node["historic"="castle"](around:' + radius + ',' + lat + ',' + lng + ');node["historic"="monument"](around:' + radius + ',' + lat + ',' + lng + '););out body ' + limit + ';';
        break;
      default:
        return [];
    }
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query)
    });
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.elements || !Array.isArray(data.elements)) return [];
    return data.elements
      .filter((item: any) => item.tags && item.tags.name)
      .map((item: any) => ({
        name: item.tags.name,
        kind: poiType,
        lat: item.lat || (item.center ? item.center.lat : lat),
        lng: item.lon || (item.center ? item.center.lon : lng),
        address: item.tags['addr:street'] ? (item.tags['addr:street'] + ' ' + (item.tags['addr:housenumber'] || '') + ', ' + (item.tags['addr:city'] || '')).trim() : undefined,
        website: item.tags.website || item.tags.url,
        phone: item.tags.phone || item.tags['contact:phone'],
        openingHours: item.tags.opening_hours
      }));
  } catch (error) {
    console.error("Overpass API error for " + poiType + ":", error);
    return [];
  }
}

async function fetchCityPOIs(cityName: string): Promise<CityPOIs | null> {
  let geoData = await geocodeCity(cityName);
  if (!geoData) {
    const fallbackCoords = getFallbackCoordinates(cityName);
    if (fallbackCoords) {
      geoData = { ...fallbackCoords, displayName: cityName };
    } else {
      return null;
    }
  }
  const [museums, monuments, restaurants, hotels, parks, educational] = await Promise.all([
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'museums', 12),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'monuments', 15),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'restaurants', 20),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'hotels', 10),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'parks', 8),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'educational', 12)
  ]);
  return { city: cityName, lat: geoData.lat, lng: geoData.lng, museums, monuments, restaurants, hotels, parks, educational };
}

async function calculateRouteDistance(coordinates: Array<{lat: number; lng: number}>): Promise<{distance_km: number; duration_hours: number}> {
  if (coordinates.length < 2) return { distance_km: 0, duration_hours: 0 };
  try {
    const coordString = coordinates.map(c => c.lng + ',' + c.lat).join(';');
    const url = "https://router.project-osrm.org/route/v1/driving/" + coordString + "?overview=false";
    const response = await fetch(url);
    if (!response.ok) return estimateDistance(coordinates);
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      return {
        distance_km: Math.round(data.routes[0].distance / 1000),
        duration_hours: Math.round(data.routes[0].duration / 3600 * 10) / 10
      };
    }
    return estimateDistance(coordinates);
  } catch {
    return estimateDistance(coordinates);
  }
}

function estimateDistance(coordinates: Array<{lat: number; lng: number}>): {distance_km: number; duration_hours: number} {
  let totalDistance = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const R = 6371;
    const dLat = (coordinates[i + 1].lat - coordinates[i].lat) * Math.PI / 180;
    const dLon = (coordinates[i + 1].lng - coordinates[i].lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(coordinates[i].lat * Math.PI / 180) * Math.cos(coordinates[i + 1].lat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalDistance += R * c * 1.3;
  }
  return { distance_km: Math.round(totalDistance), duration_hours: Math.round(totalDistance / 70 * 10) / 10 };
}

function getFallbackCoordinates(cityName: string): { lat: number; lng: number } | null {
  const normalizedName = cityName.toLowerCase().replace(/,.*$/, '').replace(/\s+/g, ' ').trim();
  const cityCoords: Record<string, { lat: number; lng: number }> = {
    'sarajevo': { lat: 43.8563, lng: 18.4131 }, 'beograd': { lat: 44.7866, lng: 20.4489 },
    'belgrade': { lat: 44.7866, lng: 20.4489 }, 'budimpesta': { lat: 47.4979, lng: 19.0402 },
    'budapest': { lat: 47.4979, lng: 19.0402 }, 'zagreb': { lat: 45.8150, lng: 15.9819 },
    'ljubljana': { lat: 46.0569, lng: 14.5058 }, 'bec': { lat: 48.2082, lng: 16.3738 },
    'vienna': { lat: 48.2082, lng: 16.3738 }, 'wien': { lat: 48.2082, lng: 16.3738 },
    'prag': { lat: 50.0755, lng: 14.4378 }, 'prague': { lat: 50.0755, lng: 14.4378 },
    'praha': { lat: 50.0755, lng: 14.4378 }, 'rim': { lat: 41.9028, lng: 12.4964 },
    'rome': { lat: 41.9028, lng: 12.4964 }, 'roma': { lat: 41.9028, lng: 12.4964 },
    'bologna': { lat: 44.4949, lng: 11.3426 }, 'padova': { lat: 45.4064, lng: 11.8768 },
    'venecija': { lat: 45.4408, lng: 12.3155 }, 'venice': { lat: 45.4408, lng: 12.3155 },
    'venezia': { lat: 45.4408, lng: 12.3155 }, 'firenca': { lat: 43.7696, lng: 11.2558 },
    'florence': { lat: 43.7696, lng: 11.2558 }, 'firenze': { lat: 43.7696, lng: 11.2558 },
    'mostar': { lat: 43.3438, lng: 17.8078 }, 'dubrovnik': { lat: 42.6507, lng: 18.0944 },
    'split': { lat: 43.5081, lng: 16.4402 }, 'munchen': { lat: 48.1351, lng: 11.5820 },
    'munich': { lat: 48.1351, lng: 11.5820 }, 'berlin': { lat: 52.5200, lng: 13.4050 },
    'pariz': { lat: 48.8566, lng: 2.3522 }, 'paris': { lat: 48.8566, lng: 2.3522 },
    'amsterdam': { lat: 52.3676, lng: 4.9041 }, 'barcelona': { lat: 41.3851, lng: 2.1734 },
    'madrid': { lat: 40.4168, lng: -3.7038 }, 'london': { lat: 51.5074, lng: -0.1278 },
    'atena': { lat: 37.9838, lng: 23.7275 }, 'athens': { lat: 37.9838, lng: 23.7275 },
    'skopje': { lat: 41.9981, lng: 21.4254 }, 'podgorica': { lat: 42.4304, lng: 19.2594 },
    'tirana': { lat: 41.3275, lng: 19.8187 }, 'bratislava': { lat: 48.1486, lng: 17.1077 },
    'krakow': { lat: 50.0647, lng: 19.9450 }, 'varsava': { lat: 52.2297, lng: 21.0122 },
    'warsaw': { lat: 52.2297, lng: 21.0122 }, 'warszawa': { lat: 52.2297, lng: 21.0122 },
    'banja luka': { lat: 44.7722, lng: 17.1910 }, 'tuzla': { lat: 44.5384, lng: 18.6763 },
    'zenica': { lat: 44.2017, lng: 17.9078 }, 'trebinje': { lat: 42.7119, lng: 18.3464 },
    'neum': { lat: 42.9231, lng: 17.6156 }, 'jajce': { lat: 44.3392, lng: 17.2700 },
    'travnik': { lat: 44.2264, lng: 17.6653 }, 'konjic': { lat: 43.6519, lng: 17.9619 },
    'visoko': { lat: 43.9889, lng: 18.1781 },
  };
  if (cityCoords[normalizedName]) return cityCoords[normalizedName];
  for (const [key, coords] of Object.entries(cityCoords)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) return coords;
  }
  return null;
}

async function findRestStops(fromCoords: {lat: number; lng: number}, toCoords: {lat: number; lng: number}): Promise<POI[]> {
  const midLat = (fromCoords.lat + toCoords.lat) / 2;
  const midLng = (fromCoords.lng + toCoords.lng) / 2;
  try {
    const query = '[out:json][timeout:10];(node["amenity"="fuel"](around:15000,' + midLat + ',' + midLng + ');node["highway"="services"](around:15000,' + midLat + ',' + midLng + ');node["highway"="rest_area"](around:15000,' + midLat + ',' + midLng + '););out body 5;';
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query)
    });
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.elements || !Array.isArray(data.elements)) return [];
    return data.elements
      .filter((item: any) => item.tags)
      .map((item: any) => ({
        name: item.tags.name || 'Odmoriste',
        kind: 'rest_stop',
        lat: item.lat,
        lng: item.lon,
      }));
  } catch {
    return [];
  }
}

// =====================================================================
// FALLBACK PLAN GENERATOR - Creates detailed plans from real POI data
// Used when AI Gateway is unavailable (402, 429, or other errors)
// =====================================================================

function generateFallbackPlans(
  tripData: TripRequest,
  cityPOIs: CityPOIs[],
  routeInfo: { distance_km: number; duration_hours: number },
  routeCoordinates: Array<{ city: string; lat: number; lng: number; order: number }>,
  restStops: POI[],
  tripDays: number,
  fullRoute: string
): any {
  const meetingPoint = {
    name: "Internationale Deutsche Schule Sarajevo",
    address: "Buka 13, 71000 Sarajevo",
    lat: 43.8612, lng: 18.4028, phone: "+38733560520"
  };

  const budgetPerStudent = tripData.budget || 300;
  const studentCount = tripData.studentCount || 14;

  // Cost multipliers for each tier
  const tiers = [
    { id: 1, type: "Budget" as const, label: "Ekonomična", mult: 0.6, accomType: "Hostel / 2* hotel", mealType: "Jednostavni obroci", reliability: 85 },
    { id: 2, type: "Balanced" as const, label: "Uravnotežena", mult: 1.0, accomType: "3* hotel", mealType: "Lokalni restorani", reliability: 90 },
    { id: 3, type: "Premium" as const, label: "VIP", mult: 1.5, accomType: "4-5* hotel", mealType: "Kvalitetni restorani", reliability: 95 },
  ];

  // Calculate base costs
  const baseTransport = tripData.transport === 'bus' 
    ? Math.round(routeInfo.distance_km * 1.2) 
    : Math.round(routeInfo.distance_km * 0.15 * studentCount);
  
  const plans = tiers.map(tier => {
    const transportCost = Math.round(baseTransport * (tier.mult < 1 ? 1 : tier.mult * 0.8));
    const accomPerNight = tier.id === 1 ? 15 : tier.id === 2 ? 35 : 65;
    const accommodationCost = accomPerNight * (tripDays - 1) * studentCount;
    const mealPerDay = tier.id === 1 ? 12 : tier.id === 2 ? 22 : 40;
    const mealsCost = mealPerDay * tripDays * studentCount;
    const entryFees = Math.round((tier.id === 1 ? 5 : tier.id === 2 ? 12 : 25) * tripDays * studentCount);
    const activityFees = Math.round((tier.id === 1 ? 2 : tier.id === 2 ? 8 : 18) * tripDays * studentCount);
    const localTransport = Math.round((tier.id === 1 ? 3 : tier.id === 2 ? 6 : 12) * tripDays * studentCount);
    const subtotal = transportCost + accommodationCost + mealsCost + entryFees + activityFees + localTransport;
    const contingency = Math.round(subtotal * 0.05);
    const totalCost = subtotal + contingency;
    const costPerStudent = Math.round(totalCost / studentCount);

    // Build itinerary day by day
    const itinerary = buildDetailedItinerary(
      tripData, cityPOIs, routeInfo, restStops, tripDays, tier, meetingPoint
    );

    // Pick accommodation info from POIs
    const accomCity = cityPOIs.length > 1 ? cityPOIs[1] : cityPOIs[0];
    const hotelOptions = accomCity ? accomCity.hotels.slice(0, 3) : [];
    const accomInfo = hotelOptions.length > 0
      ? tier.accomType + " — Preporučeno: " + hotelOptions.map(h => h.name + (h.address ? " (" + h.address + ")" : "")).join("; ")
      : tier.accomType + " u centru grada, blizu glavnih atrakcija";

    const whyFits = tier.id === 1
      ? "Ekonomična opcija koja pokriva sve ključne atrakcije uz optimalne troškove. Hosteli i jednostavni obroci omogućavaju maksimalan broj posjeta."
      : tier.id === 2
      ? "Uravnotežen odnos cijene i kvaliteta. 3* smještaj osigurava udobnost, lokalni restorani autentično iskustvo, a obuhvaćene su sve glavne atrakcije."
      : "Premium iskustvo sa vrhunskim smještajem i ishranom. VIP pristup svim atrakcijama, privatni vodiči i maksimalna udobnost za učenike.";

    return {
      id: tier.id,
      type: tier.type,
      route: fullRoute,
      reliability: tier.reliability,
      days: tripDays,
      distance_km: routeInfo.distance_km,
      travel_hours: routeInfo.duration_hours,
      cost_per_student: costPerStudent,
      costs: {
        transport: transportCost,
        accommodation: accommodationCost,
        meals: mealsCost,
        entry_fees: entryFees,
        activity_fees: activityFees,
        local_transport: localTransport,
        contingency: contingency,
        total: totalCost
      },
      why_this_fits: whyFits,
      accommodation_info: accomInfo,
      meeting_point: {
        name: meetingPoint.name,
        address: meetingPoint.address,
        lat: meetingPoint.lat,
        lng: meetingPoint.lng,
        time: "07:00"
      },
      itinerary
    };
  });

  return { plans };
}

function buildDetailedItinerary(
  tripData: TripRequest,
  cityPOIs: CityPOIs[],
  routeInfo: { distance_km: number; duration_hours: number },
  restStops: POI[],
  tripDays: number,
  tier: { id: number; type: string; label: string; mult: number },
  meetingPoint: { name: string; address: string; lat: number; lng: number }
): any[] {
  const startDate = new Date(tripData.departureDate);
  const destinations = tripData.destinations;
  const itinerary: any[] = [];

  // Determine which cities to visit on which days
  // Day 1 = travel from departure to first destination
  // Middle days = explore destinations
  // Last day = return
  const destinationCities = cityPOIs.filter(c => 
    c.city.toLowerCase() !== tripData.departureCity.toLowerCase()
  );
  const departureData = cityPOIs.find(c => 
    c.city.toLowerCase() === tripData.departureCity.toLowerCase()
  );

  for (let day = 1; day <= tripDays; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day - 1);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const activities: any[] = [];

    if (day === 1) {
      // TRAVEL DAY - Departure
      const firstDest = destinationCities[0] || cityPOIs[0];
      const travelHours = Math.min(routeInfo.duration_hours / 2, 8);
      
      activities.push({
        time: "06:30-07:00",
        description: "Okupljanje učenika i roditelja. Provjera prisutnosti, podjela identifikacijskih kartica.",
        type: "meeting" as const,
        location: meetingPoint.name + ", " + meetingPoint.address,
        lat: meetingPoint.lat,
        lng: meetingPoint.lng,
        notes: "Obavezno ponijeti osobnu iskaznicu/pasoš i potvrdu roditelja"
      });

      activities.push({
        time: "07:00-07:15",
        description: "Ukrcavanje u autobus. Sigurnosne upute i raspored sjedenja.",
        type: "travel" as const,
        location: meetingPoint.name,
        lat: meetingPoint.lat,
        lng: meetingPoint.lng,
        notes: "Pratitelji sjede na početku i kraju autobusa"
      });

      activities.push({
        time: "07:15",
        description: "Polazak prema " + (firstDest?.city || destinations[0]) + ". Procijenjeno vrijeme vožnje: " + travelHours.toFixed(1) + "h.",
        type: "travel" as const,
        location: tripData.departureCity,
        notes: "Pauza svakih 2 sata vožnje"
      });

      // Add rest stop
      const restStopTime = "09:15-09:45";
      if (restStops.length > 0) {
        activities.push({
          time: restStopTime,
          description: "Pauza na odmorištu: " + restStops[0].name + ". Toalet, osvježenje.",
          type: "free_time" as const,
          location: restStops[0].name,
          lat: restStops[0].lat,
          lng: restStops[0].lng,
          notes: "Učenici ne smiju napuštati odmorište bez pratitelja"
        });
      } else {
        activities.push({
          time: restStopTime,
          description: "Pauza na autoputu. Toalet, osvježenje.",
          type: "free_time" as const,
          location: "Odmorište na autoputu",
          notes: "Pauza od 30 minuta"
        });
      }

      // Arrival
      const arrivalHour = 7 + Math.ceil(travelHours) + 1; // +1 for stops
      const arrivalTime = String(Math.min(arrivalHour, 14)).padStart(2, '0') + ":00";
      
      activities.push({
        time: arrivalTime + "-" + String(Math.min(arrivalHour, 14)).padStart(2, '0') + ":30",
        description: "Dolazak u " + (firstDest?.city || destinations[0]) + ". Smještaj u " + (tier.id === 1 ? "hostel" : tier.id === 2 ? "hotel" : "premium hotel") + ".",
        type: "accommodation" as const,
        location: firstDest?.city || destinations[0],
        lat: firstDest?.lat,
        lng: firstDest?.lng,
        notes: "Raspodjela soba: dječaci i djevojčice odvojeno, pratitelji u susjednim sobama"
      });

      // Lunch
      const lunchTime = String(Math.min(arrivalHour + 1, 14)).padStart(2, '0') + ":00";
      const lunchRestaurant = firstDest?.restaurants?.[tier.id - 1] || firstDest?.restaurants?.[0];
      activities.push({
        time: lunchTime + "-" + String(Math.min(arrivalHour + 2, 15)).padStart(2, '0') + ":00",
        description: "Ručak" + (lunchRestaurant ? " u restoranu " + lunchRestaurant.name : " u lokalnom restoranu") + ".",
        type: "meal" as const,
        location: lunchRestaurant?.name || "Lokalni restoran",
        lat: lunchRestaurant?.lat || firstDest?.lat,
        lng: lunchRestaurant?.lng || firstDest?.lng
      });

      // Afternoon activity - first visit
      const firstMuseum = firstDest?.museums?.[0] || firstDest?.monuments?.[0];
      if (firstMuseum) {
        activities.push({
          time: "15:30-17:30",
          description: "Posjeta: " + firstMuseum.name + ". " + (firstMuseum.openingHours ? "Radno vrijeme: " + firstMuseum.openingHours : "Vođena tura za grupu."),
          type: "activity" as const,
          location: firstMuseum.name,
          lat: firstMuseum.lat,
          lng: firstMuseum.lng,
          notes: firstMuseum.address || undefined
        });
      }

      // Dinner
      const dinnerRestaurant = firstDest?.restaurants?.[tier.id] || firstDest?.restaurants?.[1];
      activities.push({
        time: "18:30-19:30",
        description: "Večera" + (dinnerRestaurant ? " u restoranu " + dinnerRestaurant.name : " u hotelu/restoranu") + ".",
        type: "meal" as const,
        location: dinnerRestaurant?.name || "Hotel/Restoran",
        lat: dinnerRestaurant?.lat,
        lng: dinnerRestaurant?.lng
      });

      // Evening
      activities.push({
        time: "19:30-21:00",
        description: "Slobodno vrijeme. Šetnja centrom grada" + (firstDest?.parks?.[0] ? ", park " + firstDest.parks[0].name : "") + ".",
        type: "free_time" as const,
        location: (firstDest?.city || destinations[0]) + " centar",
        lat: firstDest?.lat,
        lng: firstDest?.lng,
        notes: "Učenici se kreću u grupama od min. 3 osobe. Povratak u hotel do 21:00."
      });

      itinerary.push({
        day,
        date: dateStr,
        title: "Putovanje i dolazak u " + (firstDest?.city || destinations[0]),
        summary: "Polazak iz " + tripData.departureCity + ", dolazak u " + (firstDest?.city || destinations[0]) + " i prva razgledanja.",
        activities
      });

    } else if (day === tripDays) {
      // LAST DAY - Return
      const lastDest = destinationCities[destinationCities.length - 1] || cityPOIs[cityPOIs.length - 1];

      activities.push({
        time: "07:00-08:00",
        description: "Buđenje i doručak u " + (tier.id === 1 ? "hostelu" : "hotelu") + ".",
        type: "meal" as const,
        location: (lastDest?.city || "Hotel"),
        lat: lastDest?.lat,
        lng: lastDest?.lng
      });

      activities.push({
        time: "08:00-09:00",
        description: "Pakovanje i odjava iz smještaja (check-out). Kontrola soba.",
        type: "accommodation" as const,
        location: lastDest?.city || "Hotel",
        lat: lastDest?.lat,
        lng: lastDest?.lng,
        notes: "Provjeriti da ništa nije zaboravljeno"
      });

      // Optional morning activity
      const morningMonument = lastDest?.monuments?.[2] || lastDest?.educational?.[1];
      if (morningMonument && tripDays > 2) {
        activities.push({
          time: "09:00-10:30",
          description: "Kratka posjeta: " + morningMonument.name + " — posljednji utisci iz grada.",
          type: "activity" as const,
          location: morningMonument.name,
          lat: morningMonument.lat,
          lng: morningMonument.lng
        });
      }

      // Shopping time
      activities.push({
        time: tripDays > 2 ? "10:30-11:30" : "09:00-10:00",
        description: "Slobodno vrijeme za kupovinu suvenira i fotografisanje.",
        type: "free_time" as const,
        location: (lastDest?.city || "") + " centar",
        lat: lastDest?.lat,
        lng: lastDest?.lng,
        notes: "Učenici u grupama, dogovoriti tačku okupljanja"
      });

      const departureHour = tripDays > 2 ? 12 : 10;
      activities.push({
        time: String(departureHour).padStart(2, '0') + ":00",
        description: "Polazak nazad prema " + tripData.departureCity + ". Procijenjeno vrijeme: " + (routeInfo.duration_hours / 2).toFixed(1) + "h.",
        type: "travel" as const,
        location: lastDest?.city || "",
        lat: lastDest?.lat,
        lng: lastDest?.lng,
        notes: "Pauze na svakih 2 sata vožnje"
      });

      // Rest stop on return
      if (restStops.length > 1) {
        activities.push({
          time: String(departureHour + 2).padStart(2, '0') + ":00-" + String(departureHour + 2).padStart(2, '0') + ":30",
          description: "Pauza na odmorištu: " + restStops[restStops.length - 1].name,
          type: "free_time" as const,
          location: restStops[restStops.length - 1].name,
          lat: restStops[restStops.length - 1].lat,
          lng: restStops[restStops.length - 1].lng
        });
      }

      // Arrival home
      const homeArrival = departureHour + Math.ceil(routeInfo.duration_hours / 2) + 1;
      activities.push({
        time: String(Math.min(homeArrival, 20)).padStart(2, '0') + ":00",
        description: "Dolazak u " + tripData.departureCity + ". Roditelji preuzimaju učenike na mjestu polaska.",
        type: "travel" as const,
        location: meetingPoint.name + ", " + meetingPoint.address,
        lat: meetingPoint.lat,
        lng: meetingPoint.lng,
        notes: "Roditelji trebaju biti na mjestu okupljanja 15 min prije procijenjenog dolaska"
      });

      itinerary.push({
        day,
        date: dateStr,
        title: "Povratak u " + tripData.departureCity,
        summary: "Odjava, posljednja razgledanja i putovanje kući.",
        activities
      });

    } else {
      // EXPLORATION DAYS
      const cityIndex = Math.min(Math.floor((day - 1) * destinationCities.length / Math.max(tripDays - 1, 1)), destinationCities.length - 1);
      const currentCity = destinationCities[cityIndex] || cityPOIs[0];
      const isTransitDay = day > 1 && cityIndex > 0 && 
        cityIndex !== Math.min(Math.floor((day - 2) * destinationCities.length / Math.max(tripDays - 1, 1)), destinationCities.length - 1);

      // Breakfast
      activities.push({
        time: "07:00-08:00",
        description: "Doručak u " + (tier.id === 1 ? "hostelu" : "hotelu") + ".",
        type: "meal" as const,
        location: currentCity.city,
        lat: currentCity.lat,
        lng: currentCity.lng
      });

      if (isTransitDay) {
        // Transit to next city
        const prevCity = destinationCities[cityIndex - 1];
        activities.push({
          time: "08:30-10:30",
          description: "Putovanje iz " + (prevCity?.city || "") + " u " + currentCity.city + ".",
          type: "travel" as const,
          location: currentCity.city,
          lat: currentCity.lat,
          lng: currentCity.lng
        });
        activities.push({
          time: "10:30-11:00",
          description: "Check-in u " + (tier.id === 1 ? "hostel" : "hotel") + " u " + currentCity.city + ".",
          type: "accommodation" as const,
          location: currentCity.city,
          lat: currentCity.lat,
          lng: currentCity.lng
        });
      }

      // Morning activities - Museums and cultural sites
      const morningStartTime = isTransitDay ? "11:00" : "08:30";
      const morningMuseum = currentCity.museums[day % currentCity.museums.length] || currentCity.museums[0];
      const morningMonument = currentCity.monuments[day % Math.max(currentCity.monuments.length, 1)] || currentCity.monuments[0];

      if (morningMuseum) {
        activities.push({
          time: morningStartTime + "-" + (isTransitDay ? "12:30" : "10:30"),
          description: "Posjeta muzeju: " + morningMuseum.name + ". Vođena tura s edukativnim programom." + 
            (morningMuseum.openingHours ? " Radno vrijeme: " + morningMuseum.openingHours : ""),
          type: "activity" as const,
          location: morningMuseum.name,
          lat: morningMuseum.lat,
          lng: morningMuseum.lng,
          notes: morningMuseum.address || (tier.id >= 2 ? "Grupna ulaznica po povlaštenoj cijeni" : undefined)
        });
      }

      if (morningMonument && !isTransitDay) {
        activities.push({
          time: "10:45-12:00",
          description: "Razgledanje: " + morningMonument.name + ". Historijski značaj i foto pauza.",
          type: "activity" as const,
          location: morningMonument.name,
          lat: morningMonument.lat,
          lng: morningMonument.lng,
          notes: morningMonument.address || undefined
        });
      }

      // Lunch
      const lunchIdx = (day + tier.id) % Math.max(currentCity.restaurants.length, 1);
      const lunchSpot = currentCity.restaurants[lunchIdx] || currentCity.restaurants[0];
      activities.push({
        time: "12:30-13:30",
        description: "Ručak" + (lunchSpot ? " — " + lunchSpot.name : " u lokalnom restoranu") + ".",
        type: "meal" as const,
        location: lunchSpot?.name || "Lokalni restoran",
        lat: lunchSpot?.lat || currentCity.lat,
        lng: lunchSpot?.lng || currentCity.lng,
        notes: lunchSpot?.phone ? "Tel: " + lunchSpot.phone : undefined
      });

      // Afternoon activities
      const eduSite = currentCity.educational[day % Math.max(currentCity.educational.length, 1)] || currentCity.educational[0];
      if (eduSite) {
        activities.push({
          time: "14:00-15:30",
          description: "Edukativna posjeta: " + eduSite.name + "." + 
            (tripData.educationalFocus ? " Fokus: " + tripData.educationalFocus + "." : " Kulturno-historijski program."),
          type: "activity" as const,
          location: eduSite.name,
          lat: eduSite.lat,
          lng: eduSite.lng,
          notes: eduSite.address || undefined
        });
      }

      // Afternoon monument/gallery
      const afternoonPOI = currentCity.monuments[(day + 1) % Math.max(currentCity.monuments.length, 1)] || 
        currentCity.educational[(day + 1) % Math.max(currentCity.educational.length, 1)];
      if (afternoonPOI) {
        activities.push({
          time: "15:45-17:00",
          description: "Posjeta: " + afternoonPOI.name + ". Grupno fotografisanje i bilješke za školski projekt.",
          type: "activity" as const,
          location: afternoonPOI.name,
          lat: afternoonPOI.lat,
          lng: afternoonPOI.lng
        });
      }

      // Park/free time
      const park = currentCity.parks[day % Math.max(currentCity.parks.length, 1)] || currentCity.parks[0];
      activities.push({
        time: "17:00-18:00",
        description: "Slobodno vrijeme" + (park ? " — šetnja parkom " + park.name : " — šetnja i razgledanje centra grada") + ".",
        type: "free_time" as const,
        location: park?.name || currentCity.city + " centar",
        lat: park?.lat || currentCity.lat,
        lng: park?.lng || currentCity.lng,
        notes: "Učenici se kreću u grupama od min. 3 osobe"
      });

      // Dinner
      const dinnerIdx = (day + tier.id + 2) % Math.max(currentCity.restaurants.length, 1);
      const dinnerSpot = currentCity.restaurants[dinnerIdx] || currentCity.restaurants[0];
      activities.push({
        time: "18:30-19:30",
        description: "Večera" + (dinnerSpot ? " — " + dinnerSpot.name : " u hotelu/restoranu") + ".",
        type: "meal" as const,
        location: dinnerSpot?.name || "Hotel/Restoran",
        lat: dinnerSpot?.lat || currentCity.lat,
        lng: dinnerSpot?.lng || currentCity.lng
      });

      // Evening
      activities.push({
        time: "19:30-21:00",
        description: "Večernji program: " + (tier.id >= 2 
          ? "organizirana šetnja centrom uz vodiča" 
          : "slobodna šetnja u grupama uz pratitelje") + ".",
        type: "free_time" as const,
        location: currentCity.city + " centar",
        lat: currentCity.lat,
        lng: currentCity.lng,
        notes: parseInt(tripData.gradeLevel) <= 6 
          ? "Povratak u smještaj najkasnije do 20:30" 
          : "Povratak u smještaj najkasnije do 21:00"
      });

      const dayTitle = isTransitDay 
        ? "Transfer i istraživanje — " + currentCity.city
        : "Istraživanje — " + currentCity.city;

      const visitedPlaces = [morningMuseum, morningMonument, eduSite, afternoonPOI, park]
        .filter(Boolean)
        .map(p => p!.name)
        .slice(0, 4);

      itinerary.push({
        day,
        date: dateStr,
        title: dayTitle,
        summary: "Posjete: " + (visitedPlaces.length > 0 ? visitedPlaces.join(", ") : "kulturne i historijske znamenitosti " + currentCity.city) + ".",
        activities
      });
    }
  }

  return itinerary;
}

// =====================================================================
// MAIN SERVER
// =====================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const tripData: TripRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    console.log("============================================================");
    console.log("IDSS TRIP PLANNER - Generating verified trip plans");
    console.log("============================================================");

    const startDate = new Date(tripData.departureDate);
    const endDate = new Date(tripData.returnDate);
    const tripDays = Math.max(Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1, 1);

    const allCities = [tripData.departureCity, ...tripData.destinations, tripData.departureCity];
    const fullRoute = allCities.join(' → ');

    console.log("Step 1: Fetching real POI data from Overpass/Nominatim APIs...");

    const uniqueCities = [...new Set([tripData.departureCity, ...tripData.destinations])];
    const cityPOIsResults = await Promise.all(uniqueCities.map(city => fetchCityPOIs(city)));
    const cityPOIs = cityPOIsResults.filter((result): result is CityPOIs => result !== null);

    const totalPOIs = cityPOIs.reduce((sum, c) =>
      sum + c.museums.length + c.monuments.length + c.restaurants.length +
      c.hotels.length + c.parks.length + c.educational.length, 0
    );
    console.log("Step 2: Fetched POIs for " + cityPOIs.length + "/" + uniqueCities.length + " cities (" + totalPOIs + " total POIs)");

    const routeCoordinates = cityPOIs.map((city, index) => ({
      city: city.city, lat: city.lat, lng: city.lng, order: index + 1
    }));
    if (cityPOIs.length > 0) {
      routeCoordinates.push({
        city: tripData.departureCity + ' (povratak)',
        lat: cityPOIs[0].lat, lng: cityPOIs[0].lng,
        order: routeCoordinates.length + 1
      });
    }

    const routeInfo = await calculateRouteDistance(routeCoordinates.map(c => ({ lat: c.lat, lng: c.lng })));
    console.log("Step 3: Route calculated - " + routeInfo.distance_km + "km, " + routeInfo.duration_hours + "h");

    const restStops: POI[] = [];
    for (let i = 0; i < Math.min(routeCoordinates.length - 1, 3); i++) {
      const stops = await findRestStops(routeCoordinates[i], routeCoordinates[i + 1]);
      restStops.push(...stops.slice(0, 2));
    }
    console.log("Found " + restStops.length + " rest stops along route");

    // =====================================================================
    // Step 4: Try AI Gateway first, fallback to local generation
    // =====================================================================
    let plans: any = null;
    let usedFallback = false;

    if (LOVABLE_API_KEY) {
      try {
        console.log("Step 4a: Attempting AI Gateway for itinerary generation...");
        
        // Build POI data for AI prompt
        const poisByCity = cityPOIs.map(city => {
          const formatPOIs = (pois: POI[], label: string) => {
            if (pois.length === 0) return "**" + label + ":** Nema pronadjenih lokacija";
            const poiList = pois.slice(0, 8).map((p, i) => {
              let line = (i + 1) + ". " + p.name + " (" + p.lat.toFixed(5) + ", " + p.lng.toFixed(5) + ")";
              if (p.address) line += " - " + p.address;
              return line;
            }).join('\n');
            return "**" + label + " (" + pois.length + "):**\n" + poiList;
          };
          return "\n### " + city.city.toUpperCase() + "\n\n" +
            formatPOIs(city.museums, 'MUZEJI') + "\n\n" +
            formatPOIs(city.monuments, 'SPOMENICI') + "\n\n" +
            formatPOIs(city.restaurants, 'RESTORANI') + "\n\n" +
            formatPOIs(city.hotels, 'HOTELI') + "\n\n" +
            formatPOIs(city.educational, 'EDUKATIVNE LOKACIJE');
        }).join('\n');

        const meetingPoint = {
          name: "Internationale Deutsche Schule Sarajevo",
          address: "Buka 13, 71000 Sarajevo",
          lat: 43.8612, lng: 18.4028, phone: "+38733560520"
        };

        const chaperonesToShow = tripData.chaperones.length > 0 ? tripData.chaperones.join(', ') : Math.ceil(tripData.studentCount / 15) + ' pratitelja';

        const systemPrompt = "Ti si PREMIUM strucni planer skolskih ekskurzija.\n\n" +
          "# VERIFICIRANI PODACI:\n" + poisByCity + "\n\n" +
          "# RUTA: " + routeInfo.distance_km + "km, " + routeInfo.duration_hours + "h\n" +
          "# POLAZISTE: " + meetingPoint.name + ", " + meetingPoint.address + "\n\n" +
          "Generiraj 3 varijante (Budget, Balanced, Premium) sa detaljnim itinerarom.\n" +
          "Koristi SAMO lokacije iz gornje baze.\n" +
          "Odgovori ISKLJUCIVO validnim JSON objektom bez markdown oznaka.\n\n" +
          '{"plans":[{"id":1,"type":"Budget","route":"...","reliability":85,"days":' + tripDays + 
          ',"distance_km":' + routeInfo.distance_km + ',"travel_hours":' + routeInfo.duration_hours + 
          ',"cost_per_student":150,"costs":{"transport":0,"accommodation":0,"meals":0,"entry_fees":0,' +
          '"activity_fees":0,"local_transport":0,"contingency":0,"total":0},' +
          '"why_this_fits":"...","accommodation_info":"...",' +
          '"itinerary":[{"day":1,"title":"...","activities":[{"time":"HH:MM-HH:MM",' +
          '"description":"...","type":"travel|meal|activity|accommodation|free_time",' +
          '"location":"...","notes":"..."}]}]}]}';

        const userPrompt = "Ekskurzija: " + tripData.departureCity + " → " + tripData.destinations.join(' → ') +
          "\nRazred: " + tripData.gradeLevel + ", Učenika: " + tripData.studentCount +
          ", Pratitelji: " + chaperonesToShow +
          "\nPeriod: " + tripData.departureDate + " do " + tripData.returnDate + " (" + tripDays + " dana)" +
          "\nPrevoz: " + tripData.transport + ", Budget: " + (tripData.budget || 300) + " EUR/učenik" +
          (tripData.educationalFocus ? "\nFokus: " + tripData.educationalFocus : "") +
          "\n\nGeneriraj 3 DETALJNE varijante. Samo čisti JSON.";

        // Timeout AI call after 25 seconds to leave room for fallback
        const aiAbortController = new AbortController();
        const aiTimeout = setTimeout(() => aiAbortController.abort(), 25000);
        
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + LOVABLE_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.3,
          }),
          signal: aiAbortController.signal,
        });
        clearTimeout(aiTimeout);

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;
          if (content) {
            let jsonString = content.trim();
            const jsonStart = jsonString.indexOf("{");
            const jsonEnd = jsonString.lastIndexOf("}");
            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
              jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
            }
            plans = JSON.parse(jsonString);
            if (!plans.plans || !Array.isArray(plans.plans) || plans.plans.length === 0) {
              console.log("AI returned invalid structure, using fallback");
              plans = null;
            } else {
              console.log("AI Gateway succeeded: " + plans.plans.length + " plans generated");
            }
          }
        } else {
          console.log("AI Gateway returned status " + aiResponse.status + ", using fallback generator");
        }
      } catch (aiError) {
        console.log("AI Gateway error, using fallback generator:", aiError);
      }
    } else {
      console.log("No LOVABLE_API_KEY configured, using fallback generator");
    }

    // =====================================================================
    // Step 4b: Fallback - generate plans from real POI data
    // =====================================================================
    if (!plans) {
      console.log("Step 4b: Generating plans using FALLBACK engine with real POI data...");
      usedFallback = true;
      plans = generateFallbackPlans(
        tripData, cityPOIs, routeInfo, routeCoordinates, restStops, tripDays, fullRoute
      );
      console.log("Fallback generated " + plans.plans.length + " detailed plan variants");
    }

    // =====================================================================
    // Step 5: Enrich with route coordinates and educational resources
    // =====================================================================
    plans.route_coordinates = routeCoordinates;

    plans.verification = {
      data_source: "OpenStreetMap (Overpass API) + Nominatim + OSRM" + (usedFallback ? " + Local Fallback Engine" : " + AI Gateway"),
      last_verified: new Date().toISOString(),
      route_verified: true,
      distance_km: routeInfo.distance_km,
      travel_hours: routeInfo.duration_hours,
      pois_count: totalPOIs,
      used_fallback: usedFallback,
      cities_data: cityPOIs.map(c => ({
        city: c.city, lat: c.lat, lng: c.lng,
        museums: c.museums.length, monuments: c.monuments.length,
        restaurants: c.restaurants.length, hotels: c.hotels.length,
        parks: c.parks.length, educational: c.educational.length
      }))
    };

    if (!plans.educational_resources) {
      plans.educational_resources = cityPOIs.map(city => ({
        city: city.city,
        sites: [
          ...city.museums.slice(0, 3).map(m => m.name),
          ...city.monuments.slice(0, 3).map(m => m.name),
          ...city.educational.slice(0, 2).map(e => e.name)
        ].filter(Boolean),
        curriculum_links: tripData.educationalFocus ? [tripData.educationalFocus] : ["historija", "kultura", "geografija"]
      }));
    }

    // Ensure all 3 plans have proper costs structure for the UI
    plans.plans = plans.plans.map((p: any) => ({
      ...p,
      costs: {
        transport: p.costs?.transport || 0,
        accommodation: p.costs?.accommodation || 0,
        meals: p.costs?.meals || 0,
        entry_fees: p.costs?.entry_fees || 0,
        activity_fees: p.costs?.activity_fees || 0,
        local_transport: p.costs?.local_transport || 0,
        contingency: p.costs?.contingency || 0,
        total: p.costs?.total || 0,
      },
      distance_km: p.distance_km || routeInfo.distance_km,
      travel_hours: p.travel_hours || routeInfo.duration_hours,
      days: p.days || tripDays,
      route: p.route || fullRoute,
      reliability: p.reliability || 85,
      itinerary: (p.itinerary || []).map((d: any) => ({
        ...d,
        activities: (d.activities || []).map((a: any) => ({
          ...a,
          type: normalizeActivityType(a.type)
        }))
      }))
    }));

    console.log("============================================================");
    console.log("USPJESNO GENERIRANO" + (usedFallback ? " (FALLBACK ENGINE)" : " (AI GATEWAY)") + ":");
    console.log("   - " + plans.plans.length + " varijanti plana");
    console.log("   - " + cityPOIs.length + " gradova sa " + totalPOIs + " verificiranih POI-a");
    console.log("   - Ruta: " + routeInfo.distance_km + "km, " + routeInfo.duration_hours + "h");
    plans.plans.forEach((p: any) => {
      console.log("   - " + p.type + ": " + p.cost_per_student + " EUR po uceniku, " + (p.itinerary?.length || 0) + " dana itinerera");
    });
    console.log("============================================================");

    return new Response(JSON.stringify(plans), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-trip-plans:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Doslo je do neocekivane greske"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Normalize activity type to match UI expectations
function normalizeActivityType(type: string): string {
  const validTypes = ['travel', 'meal', 'activity', 'accommodation', 'free_time'];
  if (validTypes.includes(type)) return type;
  const mapping: Record<string, string> = {
    'meeting': 'activity', 'transport': 'travel', 'sightseeing': 'activity',
    'cultural': 'activity', 'educational': 'activity', 'shopping': 'free_time',
    'rest': 'free_time', 'breakfast': 'meal', 'lunch': 'meal', 'dinner': 'meal',
    'hotel': 'accommodation', 'checkin': 'accommodation', 'checkout': 'accommodation',
  };
  return mapping[type] || 'activity';
}
