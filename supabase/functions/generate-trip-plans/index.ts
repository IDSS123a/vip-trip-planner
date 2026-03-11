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

// =====================================================================
// GEOCODING & POI FETCHING
// =====================================================================

async function geocodeCity(cityName: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  try {
    const url = "https://nominatim.openstreetmap.org/search?q=" + encodeURIComponent(cityName) + "&format=json&limit=1&addressdetails=1";
    const response = await fetch(url, {
      headers: { 'User-Agent': 'IDSS-Trip-Planner/2.0 (info@idss.ba)' }
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

async function fetchPOIsOverpass(lat: number, lng: number, poiType: string, limit: number = 8): Promise<POI[]> {
  try {
    let query = '';
    const radius = 5000; // Increased radius for better coverage
    switch (poiType) {
      case 'museums':
        query = '[out:json][timeout:12];(node["tourism"="museum"](around:' + radius + ',' + lat + ',' + lng + ');way["tourism"="museum"](around:' + radius + ',' + lat + ',' + lng + '););out body ' + limit + ';';
        break;
      case 'monuments':
        query = '[out:json][timeout:12];(node["historic"](around:' + radius + ',' + lat + ',' + lng + ');node["tourism"="attraction"](around:' + radius + ',' + lat + ',' + lng + ');node["memorial"](around:' + radius + ',' + lat + ',' + lng + '););out body ' + limit + ';';
        break;
      case 'restaurants':
        query = '[out:json][timeout:12];(node["amenity"="restaurant"](around:' + radius + ',' + lat + ',' + lng + ');node["amenity"="cafe"](around:' + radius + ',' + lat + ',' + lng + ');node["amenity"="fast_food"](around:' + radius + ',' + lat + ',' + lng + '););out body ' + limit + ';';
        break;
      case 'hotels':
        query = '[out:json][timeout:12];(node["tourism"="hotel"](around:' + radius + ',' + lat + ',' + lng + ');node["tourism"="hostel"](around:' + radius + ',' + lat + ',' + lng + ');node["tourism"="guest_house"](around:' + radius + ',' + lat + ',' + lng + '););out body ' + limit + ';';
        break;
      case 'parks':
        query = '[out:json][timeout:12];(node["leisure"="park"](around:' + radius + ',' + lat + ',' + lng + ');way["leisure"="park"](around:' + radius + ',' + lat + ',' + lng + '););out body ' + limit + ';';
        break;
      case 'educational':
        query = '[out:json][timeout:12];(node["tourism"="gallery"](around:' + radius + ',' + lat + ',' + lng + ');node["amenity"="theatre"](around:' + radius + ',' + lat + ',' + lng + ');node["amenity"="library"](around:' + radius + ',' + lat + ',' + lng + ');node["historic"="castle"](around:' + radius + ',' + lat + ',' + lng + ');node["historic"="monument"](around:' + radius + ',' + lat + ',' + lng + '););out body ' + limit + ';';
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
    await new Promise(r => setTimeout(r, 500));
    geoData = await geocodeCity(cityName);
  }
  if (!geoData) {
    const fallbackCoords = getFallbackCoordinates(cityName);
    if (fallbackCoords) {
      geoData = { ...fallbackCoords, displayName: cityName };
    } else {
      console.error("No coordinates found for city: " + cityName);
      return null;
    }
  }
  const [museums, monuments, restaurants, hotels, parks, educational] = await Promise.all([
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'museums', 8),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'monuments', 10),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'restaurants', 10),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'hotels', 6),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'parks', 5),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'educational', 8)
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

// =====================================================================
// FALLBACK COORDINATES DATABASE
// =====================================================================

function getFallbackCoordinates(cityName: string): { lat: number; lng: number } | null {
  const normalizedName = cityName.toLowerCase().replace(/,.*$/, '').replace(/\s+/g, ' ').trim();
  const cityCoords: Record<string, { lat: number; lng: number }> = {
    'sarajevo': { lat: 43.8563, lng: 18.4131 }, 'beograd': { lat: 44.7866, lng: 20.4489 },
    'belgrade': { lat: 44.7866, lng: 20.4489 }, 'budimpesta': { lat: 47.4979, lng: 19.0402 },
    'budapest': { lat: 47.4979, lng: 19.0402 }, 'budimpešta': { lat: 47.4979, lng: 19.0402 },
    'zagreb': { lat: 45.8150, lng: 15.9819 },
    'ljubljana': { lat: 46.0569, lng: 14.5058 }, 'bec': { lat: 48.2082, lng: 16.3738 },
    'beč': { lat: 48.2082, lng: 16.3738 },
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
    'münchen': { lat: 48.1351, lng: 11.5820 },
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
    'salzburg': { lat: 47.8095, lng: 13.0550 }, 'innsbruck': { lat: 47.2692, lng: 11.4041 },
    'graz': { lat: 47.0707, lng: 15.4395 },
    'milan': { lat: 45.4642, lng: 9.1900 }, 'milano': { lat: 45.4642, lng: 9.1900 },
    'napoli': { lat: 40.8518, lng: 14.2681 }, 'naples': { lat: 40.8518, lng: 14.2681 },
    'pisa': { lat: 43.7228, lng: 10.4017 }, 'verona': { lat: 45.4384, lng: 10.9916 },
    'trieste': { lat: 45.6495, lng: 13.7768 }, 'trst': { lat: 45.6495, lng: 13.7768 },
    'plitvice': { lat: 44.8654, lng: 15.6220 }, 'plitvicka jezera': { lat: 44.8654, lng: 15.6220 },
    'plitvička jezera': { lat: 44.8654, lng: 15.6220 },
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
// BUILD ROUTE COORDINATES - NEVER DROPS CITIES
// =====================================================================

function buildRouteCoordinates(
  departureCity: string,
  destinations: string[],
  cityPOIs: CityPOIs[]
): Array<{ city: string; lat: number; lng: number; order: number }> {
  const allCityNames = [departureCity, ...destinations];
  const coords: Array<{ city: string; lat: number; lng: number; order: number }> = [];
  
  const poiLookup = new Map<string, CityPOIs>();
  for (const cp of cityPOIs) {
    poiLookup.set(cp.city.toLowerCase().trim(), cp);
  }
  
  for (let i = 0; i < allCityNames.length; i++) {
    const cityName = allCityNames[i];
    const key = cityName.toLowerCase().trim();
    const poiData = poiLookup.get(key);
    
    if (poiData) {
      coords.push({ city: cityName, lat: poiData.lat, lng: poiData.lng, order: i + 1 });
    } else {
      const fallback = getFallbackCoordinates(cityName);
      if (fallback) {
        coords.push({ city: cityName, lat: fallback.lat, lng: fallback.lng, order: i + 1 });
      } else {
        const prevCoord = coords.length > 0 ? coords[coords.length - 1] : null;
        const nextKnown = findNextKnownCoords(allCityNames, i + 1, poiLookup);
        if (prevCoord && nextKnown) {
          coords.push({ city: cityName, lat: (prevCoord.lat + nextKnown.lat) / 2, lng: (prevCoord.lng + nextKnown.lng) / 2, order: i + 1 });
        } else if (prevCoord) {
          coords.push({ city: cityName, lat: prevCoord.lat + 0.5, lng: prevCoord.lng + 0.5, order: i + 1 });
        } else {
          coords.push({ city: cityName, lat: 43.8563, lng: 18.4131, order: i + 1 });
        }
      }
    }
  }
  
  if (coords.length > 0) {
    coords.push({
      city: departureCity + ' (povratak)',
      lat: coords[0].lat,
      lng: coords[0].lng,
      order: coords.length + 1
    });
  }
  
  return coords;
}

function findNextKnownCoords(
  cityNames: string[],
  startIdx: number,
  poiLookup: Map<string, CityPOIs>
): { lat: number; lng: number } | null {
  for (let i = startIdx; i < cityNames.length; i++) {
    const key = cityNames[i].toLowerCase().trim();
    const data = poiLookup.get(key);
    if (data) return { lat: data.lat, lng: data.lng };
    const fb = getFallbackCoordinates(cityNames[i]);
    if (fb) return fb;
  }
  return null;
}

// =====================================================================
// REALISTIC COST CALCULATIONS
// Based on verified 2025/2026 prices for Central/SE European school trips
// =====================================================================

function calculateRealisticCosts(
  tripData: TripRequest,
  routeInfo: { distance_km: number; duration_hours: number },
  tripDays: number,
  tierType: 'Budget' | 'Balanced' | 'Premium'
): {
  transport: number;
  accommodation: number;
  meals: number;
  entry_fees: number;
  activity_fees: number;
  local_transport: number;
  contingency: number;
  total: number;
  cost_per_student: number;
  transport_detail: string;
  accommodation_detail: string;
  meals_detail: string;
} {
  const studentCount = tripData.studentCount || 14;
  const chaperoneCount = Math.max(tripData.chaperones?.length || 0, Math.ceil(studentCount / 15));
  const totalPersons = studentCount + chaperoneCount;
  const nights = Math.max(tripDays - 1, 1);

  // Transport: realistic EUR/km rates
  // Bus: ~1.10 EUR/km (includes driver, fuel, tolls, parking)
  // Private car: ~0.30 EUR/km
  // Train: estimated per person
  const roundTripKm = routeInfo.distance_km; // already includes return
  const localKm = tripDays * 30; // ~30km local transport per day
  const totalKm = roundTripKm + localKm;

  let transportCost: number;
  let transportDetail: string;
  if (tripData.transport === 'bus' || tripData.transport === 'Bus') {
    const busCount = Math.ceil(totalPersons / 50);
    const ratePerKm = tierType === 'Premium' ? 1.30 : 1.10;
    transportCost = Math.round(busCount * totalKm * ratePerKm);
    transportDetail = busCount + " bus(es) × ~" + totalKm + " km (round-trip + local) × " + ratePerKm.toFixed(2) + " EUR/km";
  } else if (tripData.transport === 'Private Car' || tripData.transport === 'private_car') {
    const carCount = Math.ceil(totalPersons / 4);
    transportCost = Math.round(totalKm * 0.30 * carCount);
    transportDetail = carCount + " private car(s) ~" + totalKm + " km (round-trip) @ 0.30 EUR/km";
  } else {
    // Train or other
    const perPersonRate = tierType === 'Budget' ? 35 : tierType === 'Balanced' ? 55 : 85;
    transportCost = Math.round(perPersonRate * totalPersons * 2); // round trip
    transportDetail = totalPersons + " persons × " + perPersonRate + " EUR × 2 (round-trip)";
  }

  // Accommodation: realistic per-person per-night rates
  // Budget: 25-30 EUR (hostels, 2* hotels)
  // Balanced: 40-50 EUR (3* hotels, well-located)
  // Premium: 70-100 EUR (4-5* hotels, central)
  const accomRate = tierType === 'Budget' ? 28 : tierType === 'Balanced' ? 48 : 85;
  const accommodationCost = Math.round(accomRate * totalPersons * nights);
  const accomLabel = tierType === 'Budget' ? 'hostel/2*' : tierType === 'Balanced' ? '3* hotel' : '4-5* hotel';
  const accommodationDetail = nights + " nights @ ~" + accomRate + " EUR/person (" + accomLabel + ")";

  // Meals: realistic daily per-person rates
  // Budget: 22-28 EUR/day (bakeries, street food, budget restaurants)
  // Balanced: 35-45 EUR/day (local restaurants, diverse cuisine)
  // Premium: 55-75 EUR/day (fine dining, signature restaurants)
  const mealRate = tierType === 'Budget' ? 25 : tierType === 'Balanced' ? 40 : 65;
  const mealsCost = Math.round(mealRate * totalPersons * tripDays);
  const mealsDetail = tripDays + " days × " + mealRate + " EUR/person/day (" + tierType.toLowerCase() + " dining)";

  // Entry fees: realistic per-person per-day
  // Budget: 5-8 EUR/day (free attractions, occasional entry)
  // Balanced: 12-18 EUR/day (museums, guided tours)
  // Premium: 22-35 EUR/day (VIP access, private guides, premium attractions)
  const entryRate = tierType === 'Budget' ? 7 : tierType === 'Balanced' ? 15 : 28;
  const entryFees = Math.round(entryRate * totalPersons * Math.max(tripDays - 1, 1));

  // Activity fees (workshops, boat rides, special events)
  const activityRate = tierType === 'Budget' ? 3 : tierType === 'Balanced' ? 10 : 22;
  const activityFees = Math.round(activityRate * totalPersons * Math.max(tripDays - 1, 1));

  // Local transport (city passes, metro, trams)
  const localTransportRate = tierType === 'Budget' ? 5 : tierType === 'Balanced' ? 8 : 15;
  const localTransport = Math.round(localTransportRate * totalPersons * tripDays);

  const subtotal = transportCost + accommodationCost + mealsCost + entryFees + activityFees + localTransport;
  const contingency = Math.round(subtotal * 0.05);
  const total = subtotal + contingency;
  const costPerStudent = Math.round(total / studentCount);

  return {
    transport: transportCost,
    accommodation: accommodationCost,
    meals: mealsCost,
    entry_fees: entryFees,
    activity_fees: activityFees,
    local_transport: localTransport,
    contingency,
    total,
    cost_per_student: costPerStudent,
    transport_detail: transportDetail,
    accommodation_detail: accommodationDetail,
    meals_detail: mealsDetail,
  };
}

// =====================================================================
// FALLBACK PLAN GENERATOR — WORLD-CLASS DETAIL
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

  const tiers: Array<{ id: number; type: 'Budget' | 'Balanced' | 'Premium'; label: string; reliability: number }> = [
    { id: 1, type: "Budget", label: "Ekonomična opcija", reliability: 85 },
    { id: 2, type: "Balanced", label: "Uravnotežena opcija", reliability: 90 },
    { id: 3, type: "Premium", label: "VIP Premium", reliability: 95 },
  ];

  const plans = tiers.map(tier => {
    const costs = calculateRealisticCosts(tripData, routeInfo, tripDays, tier.type);

    const itinerary = buildDetailedItinerary(
      tripData, cityPOIs, routeInfo, restStops, tripDays, tier, meetingPoint
    );

    // Build accommodation info with real hotel names
    const accomCity = cityPOIs.length > 1 ? cityPOIs[1] : cityPOIs[0];
    const hotelOptions = accomCity ? accomCity.hotels.slice(0, 3) : [];
    const accomTypeName = tier.type === 'Budget' ? 'Hostel / 2* hotel' : tier.type === 'Balanced' ? '3* hotel' : '4-5* hotel';
    const accomInfo = hotelOptions.length > 0
      ? accomTypeName + " — Preporučeno: " + hotelOptions.map(h => h.name + (h.address ? " (" + h.address + ")" : "")).join("; ")
      : accomTypeName + " u centru grada, blizu glavnih atrakcija";

    const whyFits = tier.type === 'Budget'
      ? "Ekonomična opcija koja pokriva sve ključne kulturne i historijske atrakcije uz optimalne troškove. Smještaj u hostelu/2* hotelu, ishrana u popularnim lokalnim pekarnama i street food restoranima. Idealna za škole s ograničenim budžetom — učenici dobivaju autentično iskustvo bez kompromisa na sigurnosti i edukativnom sadržaju."
      : tier.type === 'Balanced'
      ? "Uravnotežen odnos cijene i kvaliteta s 3* hotelskim smještajem u centru grada. Obroci u provjerenim lokalnim restoranima koji nude autentičnu kuhinju. Uključuje vođene ture, grupne ulaznice po povlaštenoj cijeni i organizirani večernji program. Najpopularnija opcija među školama — pruža udobnost i kompletno kulturno iskustvo."
      : "Premium VIP iskustvo s 4-5* hotelskim smještajem, vrhunskim restoranima i privatnim vodičima. Uključuje VIP pristup atrakcijama, posebne radionice, večernje krstarenje/kulturne događaje i premium autobus s Wi-Fi-jem. Maksimalna udobnost i ekskluzivni programi koji čine ovu ekskurziju nezaboravnom.";

    return {
      id: tier.id,
      type: tier.type,
      route: fullRoute,
      reliability: tier.reliability,
      days: tripDays,
      distance_km: routeInfo.distance_km,
      travel_hours: routeInfo.duration_hours,
      cost_per_student: costs.cost_per_student,
      costs: {
        transport: costs.transport,
        accommodation: costs.accommodation,
        meals: costs.meals,
        entry_fees: costs.entry_fees,
        activity_fees: costs.activity_fees,
        local_transport: costs.local_transport,
        contingency: costs.contingency,
        total: costs.total,
        transport_detail: costs.transport_detail,
        accommodation_detail: costs.accommodation_detail,
        meals_detail: costs.meals_detail,
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
      chaperones: tripData.chaperones.length > 0 ? tripData.chaperones.join(', ') : Math.ceil(tripData.studentCount / 15) + ' pratitelja',
      itinerary,
      packing_list: generatePackingList(tripDays, tier.type, tripData),
      rules: generateTripRules(tripData.gradeLevel, tier.type),
      emergency_contacts: {
        school: "+387 33 560 520",
        embassy_info: "Ambasada/konzulat BiH u destinacijskoj zemlji",
        local_emergency: "112 (EU standard)",
        medical_info: tripData.medicalInfo || "Nema posebnih medicinskih napomena"
      }
    };
  });

  return { plans };
}

// =====================================================================
// DETAILED ITINERARY BUILDER — RICH NARRATIVES
// =====================================================================

function buildDetailedItinerary(
  tripData: TripRequest,
  cityPOIs: CityPOIs[],
  routeInfo: { distance_km: number; duration_hours: number },
  restStops: POI[],
  tripDays: number,
  tier: { id: number; type: string; label: string },
  meetingPoint: { name: string; address: string; lat: number; lng: number }
): any[] {
  const startDate = new Date(tripData.departureDate);
  const itinerary: any[] = [];
  const educationalFocus = tripData.educationalFocus || "kulturno nasljeđe, obrazovanje, zabava";

  const destinationCities = cityPOIs.filter(c => 
    c.city.toLowerCase() !== tripData.departureCity.toLowerCase()
  );

  // Pre-compute how destinations map to days
  const middleDays = tripDays - 2;
  
  for (let day = 1; day <= tripDays; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day - 1);
    const dateStr = currentDate.toISOString().split('T')[0];
    const activities: any[] = [];

    if (day === 1) {
      // ====================== DAY 1: DEPARTURE & ARRIVAL ======================
      const firstDest = destinationCities[0] || cityPOIs[0];
      const destName = firstDest?.city || tripData.destinations[0];
      const segmentHours = Math.min(routeInfo.duration_hours / Math.max(destinationCities.length, 1), 8);
      const chaperoneNames = tripData.chaperones.length > 0 ? tripData.chaperones.join(' i ') : 'pratitelji';

      activities.push({
        time: "07:00 - 07:30",
        description: "Okupljanje učenika i roditelja na polazištu. Provjera prisutnosti svih " + tripData.studentCount + " učenika, podjela identifikacijskih kartica i putnih dokumenata. " + chaperoneNames + " obavljaju finalnu kontrolu opreme i prtljaga. Roditelji potpisuju evidenciju predaje djece.",
        type: "meeting",
        location: meetingPoint.name + ", " + meetingPoint.address,
        lat: meetingPoint.lat, lng: meetingPoint.lng,
        notes: "Obavezno ponijeti osobnu iskaznicu/pasoš, potvrdu roditelja, i zdravstvenu iskaznicu"
      });

      activities.push({
        time: "07:30 - 08:00",
        description: "Ukrcavanje u " + (tier.type === 'Premium' ? "premium autobus opremljen Wi-Fi-jem i USB punjačima" : "autobus") + ". Sigurnosne upute, raspored sjedenja i podjela rasporeda putovanja. " + chaperoneNames + " sjede na početku i kraju autobusa za nadzor.",
        type: "travel",
        location: meetingPoint.name,
        lat: meetingPoint.lat, lng: meetingPoint.lng,
        notes: "Pratitelji sjede na početku i kraju autobusa. Svaki učenik dobiva kopiju rasporeda."
      });

      activities.push({
        time: "08:00",
        description: "Polazak prema " + destName + ". Procijenjeno vrijeme vožnje: " + segmentHours.toFixed(1) + " sati (~" + Math.round(routeInfo.distance_km / Math.max(destinationCities.length, 1)) + " km). Tokom vožnje, " + chaperoneNames + " će održati kratko edukativno predavanje o historiji i geografiji regija kroz koje se prolazi, s fokusom na " + educationalFocus + ". Učenici mogu pratiti rutu na dijeljenim kartama.",
        type: "travel",
        location: tripData.departureCity,
        notes: "Pauza svakih 2 sata vožnje. Obavezno vezivanje pojaseva."
      });

      // Rest stop
      const restStop = restStops.length > 0 ? restStops[0] : null;
      activities.push({
        time: "10:00 - 10:30",
        description: "Pauza na " + (restStop ? "odmorištu " + restStop.name : "autoputnom odmorištu") + ". Toalet, osvježenje, lagana užina. Učenici ne smiju napuštati označeni prostor odmorišta bez pratitelja.",
        type: "free_time",
        location: restStop?.name || "Odmorište na autoputu",
        lat: restStop?.lat, lng: restStop?.lng,
        notes: "30 minuta pauze. Učenici se okupljaju kod autobusa 5 min prije polaska."
      });

      // Arrival
      const arrivalH = Math.min(8 + Math.ceil(segmentHours) + 1, 15);
      const hotel = firstDest?.hotels?.[tier.id - 1] || firstDest?.hotels?.[0];
      const hotelName = hotel?.name || (tier.type === 'Budget' ? 'hostel u centru grada' : tier.type === 'Balanced' ? 'hotel u centru grada' : 'premium hotel u centru grada');
      
      activities.push({
        time: pad(arrivalH) + ":00 - " + pad(arrivalH) + ":30",
        description: "Dolazak u " + destName + ". Check-in u " + hotelName + (hotel?.address ? " (" + hotel.address + ")" : "") + ". Raspodjela soba: dječaci i djevojčice u odvojenim sobama, pratitelji u susjednim sobama za nadzor. Učenici ostavljaju prtljag i dobivaju ključeve/kartice.",
        type: "accommodation",
        location: hotelName,
        lat: hotel?.lat || firstDest?.lat, lng: hotel?.lng || firstDest?.lng,
        notes: "Check-in za grupu. Dogovor o pravilima smještaja (noćni mir, okupljanje)."
      });

      // Lunch
      const lunchR = firstDest?.restaurants?.[tier.id - 1] || firstDest?.restaurants?.[0];
      const lunchName = lunchR?.name || 'lokalni restoran';
      activities.push({
        time: pad(arrivalH + 1) + ":00 - " + pad(arrivalH + 2) + ":00",
        description: "Ručak u " + (lunchR ? "restoranu " + lunchR.name + (lunchR.address ? " (" + lunchR.address + ")" : "") + ". " + getRestaurantDescription(lunchR, tier.type, destName) : "lokalnom restoranu u centru grada. Učenici biraju između raznovrsnih jela lokalne kuhinje."),
        type: "meal",
        location: lunchName,
        lat: lunchR?.lat || firstDest?.lat, lng: lunchR?.lng || firstDest?.lng,
        notes: lunchR?.phone ? "Rezervacija: " + lunchR.phone : "Grupna rezervacija unaprijed"
      });

      // Afternoon exploration
      const firstMonument = firstDest?.monuments?.[0];
      const firstMuseum = firstDest?.museums?.[0];
      if (firstMonument || firstMuseum) {
        const site = firstMuseum || firstMonument!;
        activities.push({
          time: pad(arrivalH + 2) + ":30 - " + pad(arrivalH + 4) + ":00",
          description: "Posjeta: " + site.name + (site.address ? " (" + site.address + ")" : "") + ". " + getAttractionDescription(site, educationalFocus, destName) + (site.openingHours ? " Radno vrijeme: " + site.openingHours + "." : ""),
          type: "activity",
          location: site.name,
          lat: site.lat, lng: site.lng,
          notes: tier.id >= 2 ? "Grupna ulaznica po povlaštenoj cijeni. Vođena tura na engleskom jeziku." : "Ulaz besplatan ili po grupnoj cijeni."
        });
      }

      // Orientation walk
      const park = firstDest?.parks?.[0];
      activities.push({
        time: pad(Math.min(arrivalH + 4, 17)) + ":00 - " + pad(Math.min(arrivalH + 5, 18)) + ":30",
        description: "Orijentacijska šetnja centrom " + destName + ". Upoznavanje s javnim prevozom, lokacijama ljekarna i ključnim oznakama." + (park ? " Kratka pauza u parku " + park.name + " gdje učenici mogu da se odmore i fotografišu." : " Učenici se upoznaju s gradskim ambijentom i ključnim lokacijama."),
        type: "free_time",
        location: destName + " centar",
        lat: firstDest?.lat, lng: firstDest?.lng,
        notes: "Učenici se kreću u grupama od min. 3 osobe."
      });

      // Dinner
      const dinnerR = firstDest?.restaurants?.[tier.id + 1] || firstDest?.restaurants?.[2];
      const dinnerName = dinnerR?.name || 'lokalni restoran';
      activities.push({
        time: "19:00 - 20:30",
        description: "Večera u " + (dinnerR ? "restoranu " + dinnerR.name + (dinnerR.address ? " (" + dinnerR.address + ")" : "") + ". " + getRestaurantDescription(dinnerR, tier.type, destName) : "lokalnom restoranu. Večernji obrok s fokusom na tradicionalnu kuhinju regije."),
        type: "meal",
        location: dinnerName,
        lat: dinnerR?.lat || firstDest?.lat, lng: dinnerR?.lng || firstDest?.lng,
      });

      // Evening
      activities.push({
        time: "20:30 - 21:30",
        description: "Večernja šetnja " + (tier.id >= 2 ? "uz vodiča" : "u grupama s pratiteljima") + " — razgledanje večernje panorame " + destName + ". " + getEveningDescription(destName, tier.type) + " Povratak u smještaj do " + (parseInt(tripData.gradeLevel) <= 6 ? "20:30" : "21:30") + ".",
        type: "free_time",
        location: destName + " centar",
        lat: firstDest?.lat, lng: firstDest?.lng,
        notes: parseInt(tripData.gradeLevel) <= 6 ? "Povratak u smještaj najkasnije do 20:30." : "Povratak u smještaj najkasnije do 21:30."
      });

      itinerary.push({
        day,
        date: dateStr,
        title: "Putovanje i dolazak u " + destName,
        summary: "Polazak iz " + tripData.departureCity + " u " + (segmentHours < 3 ? "jutarnjim" : "ranim jutarnjim") + " satima. Dolazak u " + destName + ", smještaj i prva razgledanja grada. Večera u " + dinnerName + ".",
        activities
      });

    } else if (day === tripDays) {
      // ====================== LAST DAY: RETURN ======================
      const lastDest = destinationCities[destinationCities.length - 1] || cityPOIs[cityPOIs.length - 1];
      const lastCity = lastDest?.city || tripData.destinations[tripData.destinations.length - 1];

      activities.push({
        time: "07:00 - 08:00",
        description: "Buđenje i doručak u " + (tier.type === 'Budget' ? "hostelu" : "hotelu") + ". Posljednji obrok u " + lastCity + " prije polaska kući.",
        type: "meal",
        location: lastCity,
        lat: lastDest?.lat, lng: lastDest?.lng
      });

      activities.push({
        time: "08:00 - 09:00",
        description: "Pakovanje i check-out iz smještaja. Kontrola soba — pratitelji provjeravaju da ništa nije zaboravljeno. Prtljag se utovara u autobus.",
        type: "accommodation",
        location: lastCity,
        lat: lastDest?.lat, lng: lastDest?.lng,
        notes: "Provjeriti sobe, kupatila i ormare prije predaje ključeva."
      });

      // Morning activity if time allows
      if (tripDays > 2) {
        const morningPOI = lastDest?.monuments?.[2] || lastDest?.educational?.[1] || lastDest?.monuments?.[0];
        if (morningPOI) {
          activities.push({
            time: "09:00 - 10:30",
            description: "Posljednja kratka posjeta: " + morningPOI.name + (morningPOI.address ? " (" + morningPOI.address + ")" : "") + ". Posljednji utisci iz " + lastCity + " — fotografisanje i bilješke za školski projekt. " + getAttractionDescription(morningPOI, educationalFocus, lastCity),
            type: "activity",
            location: morningPOI.name,
            lat: morningPOI.lat, lng: morningPOI.lng
          });
        }
      }

      // Souvenir shopping
      activities.push({
        time: tripDays > 2 ? "10:30 - 11:30" : "09:00 - 10:00",
        description: "Slobodno vrijeme za kupovinu suvenira i posljednje fotografije. Učenici se kreću u grupama uz dogovorenu tačku okupljanja. Mogućnost kupovine lokalnih specijaliteta za obitelji.",
        type: "free_time",
        location: lastCity + " centar",
        lat: lastDest?.lat, lng: lastDest?.lng,
        notes: "Tačka okupljanja: ispred smještaja/dogovorena lokacija."
      });

      // Light lunch before departure
      const departureH = tripDays > 2 ? 12 : 10;
      activities.push({
        time: pad(departureH) + ":00 - " + pad(departureH) + ":30",
        description: tier.type === 'Premium' 
          ? "Lagani pakirani ručak osiguran od hotela za konzumaciju tokom putovanja."
          : "Brza užina ili pakirani ručak u " + (lastDest?.restaurants?.[0]?.name || "obližnjem bistroju") + " prije polaska. Kupovina grickalica za put.",
        type: "meal",
        location: lastCity,
        lat: lastDest?.lat, lng: lastDest?.lng,
      });

      const returnHours = routeInfo.duration_hours / Math.max(destinationCities.length, 1);
      activities.push({
        time: pad(departureH + 1) + ":00",
        description: "Polazak iz " + lastCity + " nazad prema " + tripData.departureCity + ". Procijenjeno vrijeme vožnje: " + returnHours.toFixed(1) + " sati. Tokom povratka, učenici reflektiraju na stečena iskustva, razmjenjuju fotografije i " + (tier.id >= 2 ? "gledaju edukativni film vezan za posjećene lokacije" : "rade na putnim bilješkama za školski projekt") + ".",
        type: "travel",
        location: lastCity,
        lat: lastDest?.lat, lng: lastDest?.lng,
        notes: "Pauze na svakih 2 sata vožnje"
      });

      // Rest stop on return
      if (restStops.length > 1) {
        activities.push({
          time: pad(Math.min(departureH + 3, 17)) + ":00 - " + pad(Math.min(departureH + 3, 17)) + ":30",
          description: "Pauza na odmorištu: " + restStops[restStops.length - 1].name + ". Toalet, osvježenje i istezanje.",
          type: "free_time",
          location: restStops[restStops.length - 1].name,
          lat: restStops[restStops.length - 1].lat, lng: restStops[restStops.length - 1].lng
        });
      }

      const homeArrival = Math.min(departureH + 1 + Math.ceil(returnHours) + 1, 22);
      activities.push({
        time: pad(homeArrival) + ":00",
        description: "Dolazak na " + meetingPoint.name + ", " + meetingPoint.address + ". Roditelji/staratelji preuzimaju učenike. " + (tripData.chaperones.length > 0 ? tripData.chaperones.join(' i ') : 'Pratitelji') + " obavljaju finalnu provjeru prisutnosti i predaju djece roditeljima. Završetak ekskurzije.",
        type: "travel",
        location: meetingPoint.name,
        lat: meetingPoint.lat, lng: meetingPoint.lng,
        notes: "Roditelji trebaju biti na mjestu okupljanja 15 min prije procijenjenog dolaska."
      });

      itinerary.push({
        day,
        date: dateStr,
        title: "Povratak u " + tripData.departureCity,
        summary: "Check-out iz smještaja, posljednja razgledanja " + lastCity + " i povratak kući. Dolazak u " + tripData.departureCity + " u večernjim satima.",
        activities
      });

    } else {
      // ====================== EXPLORATION DAYS ======================
      const dayInMiddle = day - 2;
      const cityIndex = middleDays > 0 
        ? Math.min(Math.floor(dayInMiddle * destinationCities.length / middleDays), destinationCities.length - 1)
        : 0;
      const currentCity = destinationCities[Math.max(cityIndex, 0)] || cityPOIs[0];
      const cityName = currentCity?.city || tripData.destinations[0];
      
      const prevCityIndex = middleDays > 0 && dayInMiddle > 0
        ? Math.min(Math.floor((dayInMiddle - 1) * destinationCities.length / middleDays), destinationCities.length - 1)
        : 0;
      const isTransitDay = cityIndex !== prevCityIndex && day > 2;

      // Breakfast
      activities.push({
        time: "07:30 - 08:30",
        description: "Doručak u " + (tier.type === 'Budget' ? "hostelu" : "hotelu") + ". " + (tier.type === 'Premium' ? "Bogat švedski stol s lokalnim specijalitetima." : "Kontinentalni doručak s toplim i hladnim opcijama."),
        type: "meal",
        location: cityName,
        lat: currentCity?.lat, lng: currentCity?.lng
      });

      let morningStart = "09:00";

      if (isTransitDay) {
        const prevCity = destinationCities[prevCityIndex];
        const transitDist = estimateDistance([
          { lat: prevCity?.lat || 0, lng: prevCity?.lng || 0 },
          { lat: currentCity?.lat || 0, lng: currentCity?.lng || 0 }
        ]);
        activities.push({
          time: "08:30 - 09:00",
          description: "Check-out iz smještaja u " + (prevCity?.city || '') + ". Prtljag se utovara u autobus.",
          type: "accommodation",
          location: prevCity?.city || '',
          lat: prevCity?.lat, lng: prevCity?.lng
        });
        activities.push({
          time: "09:00 - " + pad(9 + Math.ceil(transitDist.duration_hours)) + ":00",
          description: "Putovanje iz " + (prevCity?.city || '') + " u " + cityName + " (~" + transitDist.distance_km + " km, " + transitDist.duration_hours.toFixed(1) + "h). " + (tier.id >= 2 ? "Tokom vožnje, edukativno predavanje o " + cityName + " — historija, kultura i znamenitosti koje će se posjetiti." : "Učenici koriste vrijeme za bilješke o prethodnim posjetama."),
          type: "travel",
          location: cityName,
          lat: currentCity?.lat, lng: currentCity?.lng
        });
        const checkInH = 9 + Math.ceil(transitDist.duration_hours);
        const newHotel = currentCity?.hotels?.[tier.id - 1] || currentCity?.hotels?.[0];
        activities.push({
          time: pad(checkInH) + ":00 - " + pad(checkInH) + ":30",
          description: "Check-in u " + (newHotel?.name || (tier.type === 'Budget' ? 'hostel' : 'hotel')) + (newHotel?.address ? " (" + newHotel.address + ")" : "") + " u " + cityName + ". Ostavljanje prtljaga i kratko osvježenje.",
          type: "accommodation",
          location: newHotel?.name || cityName,
          lat: newHotel?.lat || currentCity?.lat, lng: newHotel?.lng || currentCity?.lng
        });
        morningStart = pad(checkInH + 1) + ":00";
      }

      // Morning museum visit
      const usedPOIs = new Set<string>();
      const museumIdx = (day - 2) % Math.max(currentCity?.museums?.length || 1, 1);
      const museum = currentCity?.museums?.[museumIdx];
      if (museum) {
        usedPOIs.add(museum.name);
        const endTime = isTransitDay ? pad(parseInt(morningStart) + 1) + ":30" : "11:00";
        activities.push({
          time: morningStart + " - " + endTime,
          description: "Posjeta muzeju: " + museum.name + (museum.address ? " (" + museum.address + ")" : "") + ". " + getMuseumDescription(museum, educationalFocus, cityName, tier.type) + (museum.openingHours ? " Radno vrijeme: " + museum.openingHours + "." : ""),
          type: "activity",
          location: museum.name,
          lat: museum.lat, lng: museum.lng,
          notes: museum.website ? "Web: " + museum.website : (tier.id >= 2 ? "Grupna ulaznica po povlaštenoj cijeni. Vođena tura." : undefined)
        });
      }

      // Morning monument/attraction
      if (!isTransitDay) {
        const monIdx = (day - 1) % Math.max(currentCity?.monuments?.length || 1, 1);
        const monument = currentCity?.monuments?.[monIdx];
        if (monument && !usedPOIs.has(monument.name)) {
          usedPOIs.add(monument.name);
          activities.push({
            time: "11:00 - 12:15",
            description: "Razgledanje: " + monument.name + (monument.address ? " (" + monument.address + ")" : "") + ". " + getAttractionDescription(monument, educationalFocus, cityName) + " Foto pauza i bilješke za školski projekt.",
            type: "activity",
            location: monument.name,
            lat: monument.lat, lng: monument.lng,
            notes: monument.address || undefined
          });
        }
      }

      // Lunch
      const lunchIdx = (day + tier.id) % Math.max(currentCity?.restaurants?.length || 1, 1);
      const lunch = currentCity?.restaurants?.[lunchIdx] || currentCity?.restaurants?.[0];
      activities.push({
        time: "12:30 - 13:45",
        description: "Ručak u " + (lunch ? "restoranu " + lunch.name + (lunch.address ? " (" + lunch.address + ")" : "") + ". " + getRestaurantDescription(lunch, tier.type, cityName) : "lokalnom restoranu s raznovrsnim menijem."),
        type: "meal",
        location: lunch?.name || "Lokalni restoran",
        lat: lunch?.lat || currentCity?.lat, lng: lunch?.lng || currentCity?.lng,
        notes: lunch?.phone ? "Rezervacija: " + lunch.phone : undefined
      });

      // Afternoon educational visit
      const eduIdx = (day - 1) % Math.max(currentCity?.educational?.length || 1, 1);
      const edu = currentCity?.educational?.[eduIdx];
      if (edu && !usedPOIs.has(edu.name)) {
        usedPOIs.add(edu.name);
        activities.push({
          time: "14:00 - 15:45",
          description: "Edukativna posjeta: " + edu.name + (edu.address ? " (" + edu.address + ")" : "") + ". " + getEducationalDescription(edu, educationalFocus, cityName, tier.type),
          type: "activity",
          location: edu.name,
          lat: edu.lat, lng: edu.lng,
          notes: edu.website ? "Web: " + edu.website : undefined
        });
      }

      // Afternoon second attraction
      const pm_monIdx = (day + 1) % Math.max(currentCity?.monuments?.length || 1, 1);
      const pmPOI = currentCity?.monuments?.[pm_monIdx] || currentCity?.educational?.[(day + 1) % Math.max(currentCity?.educational?.length || 1, 1)];
      if (pmPOI && !usedPOIs.has(pmPOI.name)) {
        usedPOIs.add(pmPOI.name);
        activities.push({
          time: "16:00 - 17:15",
          description: "Posjeta: " + pmPOI.name + (pmPOI.address ? " (" + pmPOI.address + ")" : "") + ". " + getAttractionDescription(pmPOI, educationalFocus, cityName) + " Grupno fotografisanje.",
          type: "activity",
          location: pmPOI.name,
          lat: pmPOI.lat, lng: pmPOI.lng
        });
      }

      // Park / free time
      const parkIdx = day % Math.max(currentCity?.parks?.length || 1, 1);
      const park = currentCity?.parks?.[parkIdx];
      activities.push({
        time: "17:15 - 18:30",
        description: "Slobodno vrijeme" + (park ? " — odmor u parku " + park.name + ". Učenici mogu istražiti zelene površine, fotografisati i odmarati se nakon intenzivnog dana razgledanja." : " — šetnja centrom grada. Učenici u grupama istražuju lokalne trgovine, kupuju suvenire ili jednostavno uživaju u gradskom ambijentu."),
        type: "free_time",
        location: park?.name || cityName + " centar",
        lat: park?.lat || currentCity?.lat, lng: park?.lng || currentCity?.lng,
        notes: "Učenici se kreću u grupama od min. 3 osobe. Dogovorena tačka okupljanja."
      });

      // Dinner
      const dinnerIdx = (day + tier.id + 3) % Math.max(currentCity?.restaurants?.length || 1, 1);
      const dinner = currentCity?.restaurants?.[dinnerIdx] || currentCity?.restaurants?.[1];
      activities.push({
        time: "19:00 - 20:30",
        description: "Večera u " + (dinner ? "restoranu " + dinner.name + (dinner.address ? " (" + dinner.address + ")" : "") + ". " + getRestaurantDescription(dinner, tier.type, cityName) : "lokalnom restoranu. Večernji obrok uz mogućnost probanja lokalnih specijaliteta."),
        type: "meal",
        location: dinner?.name || "Lokalni restoran",
        lat: dinner?.lat || currentCity?.lat, lng: dinner?.lng || currentCity?.lng
      });

      // Evening program
      activities.push({
        time: "20:30 - 21:30",
        description: "Večernji program: " + getEveningDescription(cityName, tier.type) + " " + (parseInt(tripData.gradeLevel) <= 6 ? "Povratak u smještaj najkasnije do 20:30." : "Povratak u smještaj najkasnije do 21:30. Noćni mir od 22:00."),
        type: "free_time",
        location: cityName + " centar",
        lat: currentCity?.lat, lng: currentCity?.lng,
        notes: parseInt(tripData.gradeLevel) <= 6 ? "Strogi nadzor — mlađi učenici." : "Učenici se kreću u grupama."
      });

      const visitedNames = [...usedPOIs].slice(0, 5);
      itinerary.push({
        day,
        date: dateStr,
        title: isTransitDay ? "Transfer i istraživanje — " + cityName : "Istraživanje — " + cityName,
        summary: (isTransitDay ? "Putovanje do " + cityName + " i " : "") + "Posjete: " + (visitedNames.length > 0 ? visitedNames.join(", ") : "kulturne i historijske znamenitosti " + cityName) + ". Ručak i večera u lokalnim restoranima.",
        activities
      });
    }
  }

  return itinerary;
}

// =====================================================================
// RICH DESCRIPTION GENERATORS
// =====================================================================

function getRestaurantDescription(r: POI | null | undefined, tier: string, city: string): string {
  if (!r) return "Učenici biraju između raznovrsnih jela lokalne kuhinje.";
  const descriptions: string[] = [];
  if (tier === 'Budget') {
    descriptions.push(
      "Popularan i pristupačan restoran poznat po kvalitetnim obrocima po povoljnim cijenama, idealan za školske grupe.",
      "Omiljeno mjesto lokalnog stanovništva koje nudi ukusna jela po studentskim cijenama — autentičan kulinarski doživljaj.",
      "Jednostavan ali kvalitetan restoran koji nudi dnevne menije po povoljnim cijenama, savršen za grupu učenika.",
    );
  } else if (tier === 'Balanced') {
    descriptions.push(
      "Cijenjeni restoran koji nudi autentičnu lokalnu kuhinju po umjerenim cijenama. Prijatna atmosfera i kvalitetna hrana čine ga odličnim izborom za školske grupe.",
      "Poznati restoran među lokalcima i turistima, koji nudi raznovrsna jela lokalne kuhinje u ugodnom ambijentu.",
      "Restoran s odličnim omjerom cijene i kvaliteta, nudi klasična jela regije pripremljena od svježih lokalnih namirnica.",
    );
  } else {
    descriptions.push(
      "Vrhunski restoran poznat po izvanrednoj kuhinji i elegantnom ambijentu. Premium kulinarski doživljaj uz selekciju najboljih jela regije.",
      "Ekskluzivni restoran s reputacijom za izvrsnost — sofisticirani meni s modernim interpretacijama klasičnih jela. Premium gastronomsko iskustvo.",
      "Prepoznat kao jedan od najboljih restorana u " + city + ". Vrhunski meni, profesionalna usluga i nezaboravan kulinarni doživljaj.",
    );
  }
  return descriptions[Math.abs(hashStr(r.name)) % descriptions.length];
}

function getMuseumDescription(m: POI, focus: string, city: string, tier: string): string {
  const descriptions = [
    "Učenici će imati priliku upoznati se s bogatom kulturnom baštinom " + city + " kroz stalne i privremene izložbe. " + (tier !== 'Budget' ? "Vođena tura na engleskom jeziku s posebnim fokusom na " + focus + "." : "Samostalno razgledanje uz informativne panele na engleskom jeziku."),
    "Važna kulturna institucija koja čuva i prezentira bogatu historiju regije. Učenici će vidjeti originalne artefakte, historijske dokumente i interaktivne izložbe vezane za " + focus + ".",
    "Edukativni obilazak koji pruža dubinski uvid u historiju i kulturu " + city + ". " + (tier !== 'Budget' ? "Organizirana radionica za učenike s praktičnim aktivnostima." : "Učenici dobivaju radne listove za samostalno istraživanje eksponata."),
  ];
  return descriptions[Math.abs(hashStr(m.name)) % descriptions.length];
}

function getAttractionDescription(poi: POI, focus: string, city: string): string {
  const descriptions = [
    "Jedna od najvažnijih znamenitosti " + city + " koja pruža uvid u bogatu historiju i kulturno nasljeđe grada. Učenici će naučiti o historijskom značaju ove lokacije i njenoj ulozi u oblikovanju identiteta regije.",
    "Impresivna znamenitost koja svjedoči o bogatoj prošlosti " + city + ". Edukativni fokus na arhitektonskim stilovima, historijskim događajima i kulturnom značaju, povezujući s temom " + focus + ".",
    "Značajna kulturno-historijska lokacija u " + city + ". Učenici istražuju arhitekturu, historiju i lokalne legende vezane za ovo mjesto, razvijajući kritičko mišljenje i kulturnu svijest.",
  ];
  return descriptions[Math.abs(hashStr(poi.name)) % descriptions.length];
}

function getEducationalDescription(poi: POI, focus: string, city: string, tier: string): string {
  const descriptions = [
    "Edukativni program posebno prilagođen školskim grupama. Učenici učestvuju u " + (tier === 'Premium' ? "ekskluzivnoj privatnoj radionici" : "grupnim aktivnostima") + " vezanim za " + focus + ". Interaktivan pristup osigurava dublje razumijevanje teme i aktivno učešće svih učenika.",
    "Institucija poznata po kvalitetnim edukativnim programima. Fokus na " + focus + " kroz " + (tier === 'Premium' ? "privatne vođene ture i praktične radionice" : "vođene ture i diskusije") + ". Učenici dobivaju materijale za daljnje istraživanje.",
    "Važan edukativni centar u " + city + " koji nudi raznovrsne programe za mlade. Posjeta uključuje " + (tier === 'Premium' ? "personalizirani program i susret sa stručnjacima" : "grupni obilazak i edukativne aktivnosti") + " s fokusom na " + focus + ".",
  ];
  return descriptions[Math.abs(hashStr(poi.name)) % descriptions.length];
}

function getEveningDescription(city: string, tier: string): string {
  if (tier === 'Premium') {
    return "Organizirani večernji program — opcije uključuju noćno razgledanje grada uz profesionalnog vodiča, krstarenje rijekom uz historijski komentar, ili posjeta kulturnom događaju/predstavi. Nezaboravan način za doživjeti " + city + " u večernjem izdanju.";
  } else if (tier === 'Balanced') {
    return "Organizirana šetnja centrom " + city + " uz vodiča koji predstavlja noćni život grada, osvijetljene znamenitosti i lokalne priče. Mogućnost posjete kulturnom događaju ako je dostupan u terminu ekskurzije.";
  } else {
    return "Slobodna šetnja centrom " + city + " u grupama s pratiteljima. Učenici mogu razgledati osvijetljene ulice, probati lokalne grickalice ili jednostavno uživati u gradskom ambijentu. Fotografisanje večernjih panorama.";
  }
}

function hashStr(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function pad(n: number): string {
  return String(Math.min(Math.max(n, 0), 23)).padStart(2, '0');
}

// =====================================================================
// PACKING LIST & RULES GENERATORS
// =====================================================================

function generatePackingList(tripDays: number, tier: string, tripData: TripRequest): string[] {
  const baseItems = [
    "Osobna iskaznica ili pasoš (original + kopija)",
    "Zdravstvena iskaznica (EHIC kartica za EU)",
    "Potpisana saglasnost roditelja",
    "Kopija putnog rasporeda",
    "Mobilni telefon + punjač",
    "Mala ruksak/torba za dnevne izlete",
    "Boca za vodu (min. 0.5L)",
    "Lijekovi (ako su potrebni) s uputstvima",
    "Novac za troškove — preporučeno: " + (tier === 'Budget' ? '20-30' : tier === 'Balanced' ? '40-60' : '60-100') + " EUR džeparac",
    "Sredstvo za sunčanje i kapa/šešir",
    "Kišobran ili lagana jakna za kišu",
    "Udobna obuća za hodanje",
  ];

  if (tripDays > 1) {
    baseItems.push(
      "Odjeća za " + tripDays + " dana (uključujući rezervnu)",
      "Pidžama i toaletne potrepštine",
      "Ručnik (ako hostel/hotel ne osigurava)",
      "Plastična vrećica za prljavu odjeću",
    );
  }

  if (tripData.transport === 'bus') {
    baseItems.push("Jastuk za vrat i deka za vožnju (opcionalno)");
    baseItems.push("Sredstvo protiv mučnine (ako je potrebno)");
  }

  baseItems.push(
    "Bilježnica i olovka za bilješke",
    "Fotoaparat ili mobitel za fotografije",
  );

  return baseItems;
}

function generateTripRules(gradeLevel: string, tier: string): string[] {
  const gradeNum = parseInt(gradeLevel, 10);
  const isYounger = !isNaN(gradeNum) && gradeNum <= 6;
  
  const rules = [
    "Učenici se UVIJEK kreću u grupama od najmanje 3 osobe",
    "Obavezno nositi identifikacijsku karticu/narukvicu tokom cijelog putovanja",
    "Mobilni telefoni na tihi način tokom posjeta muzejima i kulturnim institucijama",
    "Zabranjeno napuštanje grupe bez dozvole pratitelja",
    "Obavezno vezivanje sigurnosnog pojasa u autobusu",
    "Tačka okupljanja se dogovara na početku svakog dana",
    "U slučaju odvajanja od grupe — ostati na mjestu i kontaktirati pratitelja",
    "Poštovanje lokalnih pravila, kulture i običaja u svim destinacijama",
    "Zabranjeno konzumiranje alkohola i duhana",
    "Fotografisanje samo uz poštovanje privatnosti drugih osoba",
  ];

  if (isYounger) {
    rules.push("Noćni mir od 21:00 — učenici moraju biti u sobama");
    rules.push("Obavezan nadzor pratitelja tokom svih aktivnosti");
  } else {
    rules.push("Noćni mir od 22:00 — učenici moraju biti u sobama");
    rules.push("Večernje slobodno vrijeme u grupama od min. 4 osobe uz dozvolu pratitelja");
  }

  rules.push("Hitni kontakt škole: +387 33 560 520");
  rules.push("Europski broj za hitne slučajeve: 112");

  return rules;
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
    console.log("IDSS TRIP PLANNER v2.0 - Generating world-class trip plans");
    console.log("============================================================");

    // Validate input
    if (!tripData.departureCity || !tripData.destinations || tripData.destinations.length === 0) {
      return new Response(JSON.stringify({ error: "Polazište i najmanje jedna destinacija su obavezni." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!tripData.departureDate || !tripData.returnDate) {
      return new Response(JSON.stringify({ error: "Datum polaska i povratka su obavezni." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startDate = new Date(tripData.departureDate);
    const endDate = new Date(tripData.returnDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return new Response(JSON.stringify({ error: "Neispravni datumi." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const tripDays = Math.max(Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1, 1);

    const allCities = [tripData.departureCity, ...tripData.destinations, tripData.departureCity];
    const fullRoute = allCities.join(' → ');

    // Step 1: Fetch POIs
    console.log("Step 1: Fetching real POI data from Overpass/Nominatim APIs...");
    const uniqueCities = [...new Set([tripData.departureCity, ...tripData.destinations])];
    
    const cityPOIs: CityPOIs[] = [];
    for (const city of uniqueCities) {
      const result = await fetchCityPOIs(city);
      if (result) cityPOIs.push(result);
      if (uniqueCities.length > 2) await new Promise(r => setTimeout(r, 200));
    }

    const totalPOIs = cityPOIs.reduce((sum, c) =>
      sum + c.museums.length + c.monuments.length + c.restaurants.length +
      c.hotels.length + c.parks.length + c.educational.length, 0
    );
    console.log("Step 2: Fetched POIs for " + cityPOIs.length + "/" + uniqueCities.length + " cities (" + totalPOIs + " total POIs)");

    // Step 2: Build route coordinates
    const routeCoordinates = buildRouteCoordinates(tripData.departureCity, tripData.destinations, cityPOIs);
    console.log("Step 2b: Route coordinates built for " + routeCoordinates.length + " points (including return)");

    // Step 3: Calculate route distance
    const routeInfo = await calculateRouteDistance(routeCoordinates.map(c => ({ lat: c.lat, lng: c.lng })));
    console.log("Step 3: Route calculated - " + routeInfo.distance_km + "km, " + routeInfo.duration_hours + "h");

    // Step 3b: Find rest stops
    const restStops: POI[] = [];
    for (let i = 0; i < Math.min(routeCoordinates.length - 1, 3); i++) {
      const stops = await findRestStops(routeCoordinates[i], routeCoordinates[i + 1]);
      restStops.push(...stops.slice(0, 2));
    }
    console.log("Found " + restStops.length + " rest stops along route");

    // Step 4: Try AI Gateway first, fallback to local generation
    let plans: any = null;
    let usedFallback = false;

    if (LOVABLE_API_KEY) {
      try {
        console.log("Step 4a: Attempting AI Gateway for itinerary generation...");
        
        const poisByCity = cityPOIs.map(city => {
          const formatPOIs = (pois: POI[], label: string) => {
            if (pois.length === 0) return "**" + label + ":** Nema lokacija";
            return "**" + label + " (" + pois.length + "):**\n" + pois.slice(0, 10).map((p, i) => {
              let line = (i + 1) + ". " + p.name + " (" + p.lat.toFixed(5) + ", " + p.lng.toFixed(5) + ")";
              if (p.address) line += " — Adresa: " + p.address;
              if (p.openingHours) line += " — Radno vrijeme: " + p.openingHours;
              if (p.phone) line += " — Tel: " + p.phone;
              return line;
            }).join('\n');
          };
          return "\n### " + city.city.toUpperCase() + " (lat:" + city.lat.toFixed(4) + ", lng:" + city.lng.toFixed(4) + ")\n\n" +
            formatPOIs(city.museums, 'MUZEJI') + "\n\n" +
            formatPOIs(city.monuments, 'ZNAMENITOSTI') + "\n\n" +
            formatPOIs(city.restaurants, 'RESTORANI') + "\n\n" +
            formatPOIs(city.hotels, 'HOTELI') + "\n\n" +
            formatPOIs(city.educational, 'EDUKATIVNE LOKACIJE') + "\n\n" +
            formatPOIs(city.parks, 'PARKOVI');
        }).join('\n');

        const chaperonesToShow = tripData.chaperones.length > 0 ? tripData.chaperones.join(', ') : Math.ceil(tripData.studentCount / 15) + ' pratitelja';
        const totalPersons = tripData.studentCount + Math.max(tripData.chaperones.length, Math.ceil(tripData.studentCount / 15));

        const systemPrompt = `Ti si PREMIUM stručni planer školskih ekskurzija za Internationale Deutsche Schule Sarajevo (IDSS).

# VERIFICIRANI POI PODACI:
${poisByCity}

# RUTA: ${routeInfo.distance_km}km, ${routeInfo.duration_hours}h
# POLAZIŠTE: Internationale Deutsche Schule Sarajevo, Buka 13, 71000 Sarajevo (43.8612, 18.4028)
# PRATITELJI: ${chaperonesToShow}
# UKUPNO OSOBA: ${totalPersons} (${tripData.studentCount} učenika + pratitelji)

# PRAVILA ZA GENERIRANJE:
1. Generiraj TAČNO 3 varijante: Budget, Balanced, Premium
2. Koristi STVARNE nazive restorana, hotela i atrakcija IZ GORE NAVEDENE BAZE
3. Uključi ADRESE gdjegod su dostupne
4. Svaka aktivnost MORA imati bogat narativni opis (2-3 rečenice min) koji objašnjava edukativnu vrijednost
5. Obroci: navedi TAČAN naziv restorana, adresu i kratki opis hrane
6. REALISTIČNE CIJENE:
   - Autobus: 1.10 EUR/km za bus, 0.30 EUR/km za auto
   - Smještaj: Budget 28 EUR/noć/os, Balanced 48 EUR, Premium 85 EUR
   - Obroci: Budget 25 EUR/dan/os, Balanced 40 EUR, Premium 65 EUR
   - Ulaznice: Budget 7 EUR/dan/os, Balanced 15 EUR, Premium 28 EUR
7. Itinerar mora biti SAT-PO-SAT (npr. "08:00 AM - 10:00 AM")
8. Uključi: okupljanje, vožnju, odmorišta, check-in, ručak, razgledanja, večeru, večernji program
9. Zadnji dan: check-out, posljednja razgledanja, povratak

Odgovori ISKLJUČIVO validnim JSON objektom bez markdown oznaka:
{"plans":[{"id":1,"type":"Budget","route":"${fullRoute}","reliability":85,"days":${tripDays},"distance_km":${routeInfo.distance_km},"travel_hours":${routeInfo.duration_hours},"cost_per_student":0,"costs":{"transport":0,"accommodation":0,"meals":0,"entry_fees":0,"activity_fees":0,"local_transport":0,"contingency":0,"total":0},"why_this_fits":"...","accommodation_info":"...","chaperones":"${chaperonesToShow}","meeting_point":{"name":"Internationale Deutsche Schule Sarajevo","address":"Buka 13, 71000 Sarajevo","lat":43.8612,"lng":18.4028,"time":"07:00"},"itinerary":[{"day":1,"date":"${tripData.departureDate}","title":"...","summary":"...","activities":[{"time":"HH:MM - HH:MM","description":"Detaljan opis aktivnosti (2-3 rečenice)","type":"travel|meal|activity|accommodation|free_time","location":"Naziv lokacije","lat":0,"lng":0,"notes":"..."}]}]}]}`;

        const userPrompt = "Ekskurzija: " + tripData.departureCity + " → " + tripData.destinations.join(' → ') +
          "\nRazred: " + tripData.gradeLevel + ", Učenika: " + tripData.studentCount +
          ", Pratitelji: " + chaperonesToShow +
          "\nPeriod: " + tripData.departureDate + " do " + tripData.returnDate + " (" + tripDays + " dana)" +
          "\nPrevoz: " + tripData.transport + ", Budget: " + (tripData.budget || 500) + " EUR/učenik" +
          (tripData.educationalFocus ? "\nEdukativni fokus: " + tripData.educationalFocus : "") +
          (tripData.specialNeeds ? "\nPosebne napomene: " + tripData.specialNeeds : "") +
          "\n\nGeneriraj 3 IZUZETNO DETALJNE varijante s bogatim opisima, stvarnim imenima lokacija i realističnim cijenama. Samo čisti JSON.";

        const aiAbortController = new AbortController();
        const aiTimeout = setTimeout(() => aiAbortController.abort(), 30000);
        
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

    // Step 4b: Fallback
    if (!plans) {
      console.log("Step 4b: Generating plans using FALLBACK engine with real POI data...");
      usedFallback = true;
      plans = generateFallbackPlans(tripData, cityPOIs, routeInfo, routeCoordinates, restStops, tripDays, fullRoute);
      console.log("Fallback generated " + plans.plans.length + " detailed plan variants");
    }

    // Enrich with route coordinates and educational resources
    plans.route_coordinates = routeCoordinates;

    plans.verification = {
      data_source: "OpenStreetMap (Overpass API) + Nominatim + OSRM" + (usedFallback ? " + Local Fallback Engine v2.0" : " + AI Gateway"),
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
          ...city.museums.slice(0, 4).map(m => m.name),
          ...city.monuments.slice(0, 4).map(m => m.name),
          ...city.educational.slice(0, 3).map(e => e.name)
        ].filter(Boolean),
        curriculum_links: tripData.educationalFocus ? [tripData.educationalFocus] : ["historija", "kultura", "geografija"]
      }));
    }

    // Ensure proper structure for UI
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
        transport_detail: p.costs?.transport_detail,
        accommodation_detail: p.costs?.accommodation_detail,
        meals_detail: p.costs?.meals_detail,
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
    console.log("USPJESNO GENERIRANO" + (usedFallback ? " (FALLBACK ENGINE v2.0)" : " (AI GATEWAY)") + ":");
    console.log("   - " + plans.plans.length + " varijanti plana");
    console.log("   - " + cityPOIs.length + " gradova sa " + totalPOIs + " verificiranih POI-a");
    console.log("   - " + routeCoordinates.length + " tačaka na ruti");
    console.log("   - Ruta: " + routeInfo.distance_km + "km, " + routeInfo.duration_hours + "h");
    plans.plans.forEach((p: any) => {
      console.log("   - " + p.type + ": " + p.cost_per_student + " EUR/učenik, " + (p.itinerary?.length || 0) + " dana, " + 
        (p.itinerary?.reduce((sum: number, d: any) => sum + (d.activities?.length || 0), 0) || 0) + " aktivnosti");
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
