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
      headers: { 'User-Agent': 'IDSS-Trip-Planner/3.0 (info@idss.ba)' }
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

async function fetchPOIsOverpass(lat: number, lng: number, poiType: string, limit: number = 15): Promise<POI[]> {
  try {
    let query = '';
    const radius = 8000;
    switch (poiType) {
      case 'museums':
        query = '[out:json][timeout:15];(node["tourism"="museum"](around:' + radius + ',' + lat + ',' + lng + ');way["tourism"="museum"](around:' + radius + ',' + lat + ',' + lng + '););out body ' + limit + ';';
        break;
      case 'monuments':
        query = '[out:json][timeout:15];(node["historic"](around:' + radius + ',' + lat + ',' + lng + ');node["tourism"="attraction"](around:' + radius + ',' + lat + ',' + lng + ');node["memorial"](around:' + radius + ',' + lat + ',' + lng + '););out body ' + limit + ';';
        break;
      case 'restaurants':
        query = '[out:json][timeout:15];(node["amenity"="restaurant"](around:' + radius + ',' + lat + ',' + lng + ');node["amenity"="cafe"](around:' + radius + ',' + lat + ',' + lng + '););out body ' + limit + ';';
        break;
      case 'hotels':
        query = '[out:json][timeout:15];(node["tourism"="hotel"](around:' + radius + ',' + lat + ',' + lng + ');node["tourism"="hostel"](around:' + radius + ',' + lat + ',' + lng + ');node["tourism"="guest_house"](around:' + radius + ',' + lat + ',' + lng + '););out body ' + limit + ';';
        break;
      case 'parks':
        query = '[out:json][timeout:15];(node["leisure"="park"](around:' + radius + ',' + lat + ',' + lng + ');way["leisure"="park"](around:' + radius + ',' + lat + ',' + lng + '););out body ' + limit + ';';
        break;
      case 'educational':
        query = '[out:json][timeout:15];(node["tourism"="gallery"](around:' + radius + ',' + lat + ',' + lng + ');node["amenity"="theatre"](around:' + radius + ',' + lat + ',' + lng + ');node["amenity"="library"](around:' + radius + ',' + lat + ',' + lng + ');node["historic"="castle"](around:' + radius + ',' + lat + ',' + lng + ');node["tourism"="zoo"](around:' + radius + ',' + lat + ',' + lng + '););out body ' + limit + ';';
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
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'museums', 15),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'monuments', 15),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'restaurants', 15),
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

// =====================================================================
// FALLBACK COORDINATES DATABASE
// =====================================================================

function getFallbackCoordinates(cityName: string): { lat: number; lng: number } | null {
  const normalizedName = cityName.toLowerCase().replace(/,.*$/, '').replace(/\s+/g, ' ').trim();
  const cityCoords: Record<string, { lat: number; lng: number }> = {
    'sarajevo': { lat: 43.8563, lng: 18.4131 }, 'beograd': { lat: 44.7866, lng: 20.4489 },
    'belgrade': { lat: 44.7866, lng: 20.4489 }, 'budimpesta': { lat: 47.4979, lng: 19.0402 },
    'budapest': { lat: 47.4979, lng: 19.0402 }, 'budimpešta': { lat: 47.4979, lng: 19.0402 },
    'zagreb': { lat: 45.8150, lng: 15.9819 }, 'doboj': { lat: 44.7319, lng: 18.0854 },
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
    'postojna': { lat: 45.7747, lng: 14.2133 },
    'bled': { lat: 46.3683, lng: 14.1146 },
    'zadar': { lat: 44.1194, lng: 15.2314 },
    'rijeka': { lat: 45.3271, lng: 14.4422 },
    'maribor': { lat: 46.5547, lng: 15.6459 },
    'novi sad': { lat: 45.2671, lng: 19.8335 },
    'nis': { lat: 43.3209, lng: 21.8954 }, 'niš': { lat: 43.3209, lng: 21.8954 },
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
    const query = '[out:json][timeout:10];(node["amenity"="fuel"](around:15000,' + midLat + ',' + midLng + ');node["highway"="services"](around:15000,' + midLat + ',' + midLng + ');node["amenity"="restaurant"](around:8000,' + midLat + ',' + midLng + '););out body 8;';
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
        kind: 'rest_stop',
        lat: item.lat,
        lng: item.lon,
        address: item.tags['addr:street'] ? (item.tags['addr:street'] + ' ' + (item.tags['addr:housenumber'] || '')).trim() : undefined,
        phone: item.tags.phone,
      }));
  } catch {
    return [];
  }
}

// =====================================================================
// BUILD ROUTE COORDINATES
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
// =====================================================================

function calculateRealisticCosts(
  tripData: TripRequest,
  routeInfo: { distance_km: number; duration_hours: number },
  tripDays: number,
  tierType: 'Budget' | 'Balanced' | 'Premium'
): {
  transport: number; accommodation: number; meals: number;
  entry_fees: number; activity_fees: number; local_transport: number;
  contingency: number; total: number; cost_per_student: number;
  transport_detail: string; accommodation_detail: string; meals_detail: string;
} {
  const studentCount = tripData.studentCount || 14;
  const chaperoneCount = Math.max(tripData.chaperones?.length || 0, Math.ceil(studentCount / 15));
  const totalPersons = studentCount + chaperoneCount;
  const nights = Math.max(tripDays - 1, 1);
  const roundTripKm = routeInfo.distance_km;
  const localKm = tripDays * 30;
  const totalKm = roundTripKm + localKm;

  let transportCost: number;
  let transportDetail: string;
  if (tripData.transport === 'bus' || tripData.transport === 'Bus') {
    const busCount = Math.ceil(totalPersons / 50);
    const ratePerKm = tierType === 'Premium' ? 1.30 : 1.10;
    transportCost = Math.round(busCount * totalKm * ratePerKm);
    transportDetail = busCount + " bus × " + totalKm + " km × " + ratePerKm.toFixed(2) + " EUR/km";
  } else if (tripData.transport === 'Private Car' || tripData.transport === 'private_car') {
    const carCount = Math.ceil(totalPersons / 4);
    transportCost = Math.round(totalKm * 0.30 * carCount);
    transportDetail = carCount + " auto × " + totalKm + " km × 0.30 EUR/km";
  } else {
    const perPersonRate = tierType === 'Budget' ? 35 : tierType === 'Balanced' ? 55 : 85;
    transportCost = Math.round(perPersonRate * totalPersons * 2);
    transportDetail = totalPersons + " osoba × " + perPersonRate + " EUR × 2 (povratna)";
  }

  const accomRate = tierType === 'Budget' ? 28 : tierType === 'Balanced' ? 48 : 85;
  const accommodationCost = Math.round(accomRate * totalPersons * nights);
  const accomLabel = tierType === 'Budget' ? 'hostel/2*' : tierType === 'Balanced' ? '3* hotel' : '4-5* hotel';
  const accommodationDetail = nights + " noći × " + accomRate + " EUR/osoba (" + accomLabel + ")";

  const mealRate = tierType === 'Budget' ? 25 : tierType === 'Balanced' ? 40 : 65;
  const mealsCost = Math.round(mealRate * totalPersons * tripDays);
  const mealsDetail = tripDays + " dana × " + mealRate + " EUR/osoba/dan";

  const entryRate = tierType === 'Budget' ? 7 : tierType === 'Balanced' ? 15 : 28;
  const entryFees = Math.round(entryRate * totalPersons * Math.max(tripDays - 1, 1));
  const activityRate = tierType === 'Budget' ? 3 : tierType === 'Balanced' ? 10 : 22;
  const activityFees = Math.round(activityRate * totalPersons * Math.max(tripDays - 1, 1));
  const localTransportRate = tierType === 'Budget' ? 5 : tierType === 'Balanced' ? 8 : 15;
  const localTransport = Math.round(localTransportRate * totalPersons * tripDays);

  const subtotal = transportCost + accommodationCost + mealsCost + entryFees + activityFees + localTransport;
  const contingency = Math.round(subtotal * 0.05);
  const total = subtotal + contingency;
  const costPerStudent = Math.round(total / studentCount);

  return {
    transport: transportCost, accommodation: accommodationCost, meals: mealsCost,
    entry_fees: entryFees, activity_fees: activityFees, local_transport: localTransport,
    contingency, total, cost_per_student: costPerStudent,
    transport_detail: transportDetail, accommodation_detail: accommodationDetail, meals_detail: mealsDetail,
  };
}

// =====================================================================
// FALLBACK PLAN GENERATOR — ULTRA-DETAILED
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
    const itinerary = buildDetailedItinerary(tripData, cityPOIs, routeInfo, restStops, tripDays, tier, meetingPoint);

    const accomCity = cityPOIs.length > 1 ? cityPOIs[1] : cityPOIs[0];
    const hotelOptions = accomCity ? accomCity.hotels.slice(0, 3) : [];
    const accomTypeName = tier.type === 'Budget' ? 'Hostel / 2* hotel' : tier.type === 'Balanced' ? '3* hotel' : '4-5* hotel';
    const accomInfo = hotelOptions.length > 0
      ? accomTypeName + " — Preporučeno: " + hotelOptions.map(h => h.name + (h.address ? " (" + h.address + ")" : "") + (h.phone ? " Tel: " + h.phone : "")).join("; ")
      : accomTypeName + " u centru grada";

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
        transport: costs.transport, accommodation: costs.accommodation, meals: costs.meals,
        entry_fees: costs.entry_fees, activity_fees: costs.activity_fees,
        local_transport: costs.local_transport, contingency: costs.contingency, total: costs.total,
        transport_detail: costs.transport_detail, accommodation_detail: costs.accommodation_detail, meals_detail: costs.meals_detail,
      },
      why_this_fits: getWhyThisFits(tier.type),
      accommodation_info: accomInfo,
      meeting_point: { name: meetingPoint.name, address: meetingPoint.address, lat: meetingPoint.lat, lng: meetingPoint.lng, time: "07:00" },
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

function getWhyThisFits(tier: string): string {
  if (tier === 'Budget') return "Ekonomična opcija koja pokriva sve ključne kulturne i historijske atrakcije uz optimalne troškove. Smještaj u hostelu/2* hotelu, ishrana u popularnim lokalnim pekarnama i budget restoranima. Idealna za škole s ograničenim budžetom.";
  if (tier === 'Balanced') return "Uravnotežen odnos cijene i kvaliteta s 3* hotelskim smještajem u centru grada. Obroci u provjerenim lokalnim restoranima. Uključuje vođene ture i grupne ulaznice. Najpopularnija opcija među školama.";
  return "Premium VIP iskustvo s 4-5* hotelskim smještajem, vrhunskim restoranima i privatnim vodičima. VIP pristup atrakcijama, posebne radionice i premium autobus s Wi-Fi-jem.";
}

// =====================================================================
// DETAILED ITINERARY BUILDER — ULTRA-RICH WITH CONCRETE VENUES
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
  const educationalFocus = tripData.educationalFocus || "kulturno nasljeđe, historija, geografija";

  const destinationCities = cityPOIs.filter(c =>
    c.city.toLowerCase() !== tripData.departureCity.toLowerCase()
  );

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
        description: "Okupljanje učenika i roditelja ispred školske zgrade. Provjera prisutnosti svih " + tripData.studentCount + " učenika prema listi. Podjela identifikacijskih narukvica, kopija putnog rasporeda i hitnih kontakata. " + chaperoneNames + " obavljaju finalnu kontrolu dokumenata (osobne iskaznice/pasoši) i prtljaga. Roditelji potpisuju evidenciju predaje djece na recepciji škole.",
        type: "activity",
        location: meetingPoint.name + ", " + meetingPoint.address,
        lat: meetingPoint.lat, lng: meetingPoint.lng,
        notes: "Obavezno: osobna iskaznica/pasoš, potvrda roditelja, zdravstvena iskaznica, kopija rasporeda"
      });

      activities.push({
        time: "07:30 - 08:00",
        description: "Ukrcavanje u " + (tier.type === 'Premium' ? "premium autobus opremljen Wi-Fi-jem, USB punjačima i klima uređajem" : "autobus s klima uređajem") + ". Sigurnosne upute: obavezno vezivanje pojaseva, zabrana stajanja tokom vožnje, lokacije hitnih izlaza. Raspored sjedenja prema paru/grupi. " + chaperoneNames + " zauzimaju pozicije na početku i kraju autobusa.",
        type: "travel",
        location: meetingPoint.name,
        lat: meetingPoint.lat, lng: meetingPoint.lng,
        notes: "Pratitelji na početku i kraju autobusa. Svaki učenik dobiva printanu kopiju rasporeda."
      });

      activities.push({
        time: "08:00",
        description: "Polazak prema " + destName + ". Ukupna udaljenost: ~" + Math.round(routeInfo.distance_km / Math.max(destinationCities.length, 1)) + " km. Procijenjeno vrijeme vožnje do " + destName + ": " + segmentHours.toFixed(1) + " sati. Tokom vožnje pratitelji održavaju kratko edukativno predavanje o historiji i geografiji regija kroz koje se prolazi — poseban fokus na " + educationalFocus + ". Učenici dobivaju radni list s pitanjima o destinacijama koje će posjetiti.",
        type: "travel",
        location: tripData.departureCity,
        notes: "Pauza svakih 2 sata. Obavezno vezivanje pojaseva."
      });

      // Rest stop with concrete name
      const restStop = restStops.length > 0 ? restStops[0] : null;
      const restStopTime = Math.min(10, 8 + Math.ceil(segmentHours / 2));
      activities.push({
        time: pad(restStopTime) + ":00 - " + pad(restStopTime) + ":30",
        description: "Pauza na " + (restStop ? "lokaciji \"" + restStop.name + "\"" + (restStop.address ? " (" + restStop.address + ")" : "") : "autoputnom odmorištu na pola puta") + ". Toalet, osvježenje, mogućnost kupovine lagane užine i vode. Učenici ne smiju napuštati označeni prostor bez pratitelja. Skupljanje kod autobusa 5 minuta prije polaska.",
        type: "free_time",
        location: restStop?.name || "Odmorište na autoputu",
        lat: restStop?.lat, lng: restStop?.lng,
        notes: "30 minuta pauze. Okupljanje kod autobusa 5 min prije."
      });

      // Brunch/lunch on the road - use a real restaurant from mid-route rest stops
      const roadRestaurant = restStops.find(s => s.kind === 'rest_stop' && s.name) || restStops[1];
      if (segmentHours > 3) {
        activities.push({
          time: pad(restStopTime + 1) + ":00 - " + pad(restStopTime + 2) + ":00",
          description: "Brunch/ručak " + (roadRestaurant ? "u restoranu \"" + roadRestaurant.name + "\"" + (roadRestaurant.address ? " (" + roadRestaurant.address + ")" : "") + " na ruti prema " + destName : "na usputnoj lokaciji — topli obrok za cijelu grupu") + ". " + (tier.type === 'Premium' ? "Rezervirani stolovi za grupu, raznovrstan meni s toplim i hladnim jelima." : "Brzi topli obrok — raznovrsna ponuda prilagođena mladima."),
          type: "meal",
          location: roadRestaurant?.name || "Restoran na ruti",
          lat: roadRestaurant?.lat, lng: roadRestaurant?.lng,
          notes: "Grupni obrok. Alergije i dijete prijavljene unaprijed."
        });
      }

      // Arrival & check-in with SPECIFIC hotel name
      const arrivalH = Math.min(8 + Math.ceil(segmentHours) + (segmentHours > 3 ? 2 : 1), 15);
      const hotel = firstDest?.hotels?.[tier.id - 1] || firstDest?.hotels?.[0];
      const hotelName = hotel?.name || (tier.type === 'Budget' ? 'Hostel u centru grada' : tier.type === 'Balanced' ? 'Hotel 3* u centru grada' : 'Hotel 4-5* u centru grada');

      activities.push({
        time: pad(arrivalH) + ":00 - " + pad(arrivalH + 1) + ":00",
        description: "Dolazak u " + destName + ". Check-in u smještaj: " + hotelName + (hotel?.address ? ", adresa: " + hotel.address : "") + (hotel?.phone ? ", tel: " + hotel.phone : "") + ". Raspodjela soba: dječaci i djevojčice u odvojenim sobama, pratitelji u susjednim sobama. Učenici ostavljaju prtljag, dobivaju ključeve/kartice i upoznaju se s pravilima smještaja (noćni mir, okupljanje, požarni izlazi).",
        type: "accommodation",
        location: hotelName,
        lat: hotel?.lat || firstDest?.lat, lng: hotel?.lng || firstDest?.lng,
        notes: hotel?.website ? "Web: " + hotel.website : "Grupni check-in. Pravila smještaja."
      });

      // First walk with SPECIFIC locations
      const firstPark = firstDest?.parks?.[0];
      const firstMonument = firstDest?.monuments?.[0];
      const walkLocations = [firstMonument, firstPark, firstDest?.monuments?.[1]].filter(Boolean);
      activities.push({
        time: pad(arrivalH + 1) + ":00 - " + pad(arrivalH + 3) + ":00",
        description: "Prva orijentacijska šetnja centrom " + destName + ". " + 
          (walkLocations.length > 0 
            ? "Obilazak: " + walkLocations.map(w => w!.name + (w!.address ? " (" + w!.address + ")" : "")).join(", ") + ". "
            : "Upoznavanje s glavnim trgovima, ulicama i značajnim zgradama. ") +
          "Upoznavanje s lokacijama ljekarna, hitne pomoći i javnog prevoza. " +
          (tier.type !== 'Budget' ? "Lokalni vodič upoznaje grupu s historijom i značajnim lokacijama grada." : "Pratitelji dijele informacije o gradu iz pripremljenih materijala."),
        type: "activity",
        location: walkLocations[0]?.name || destName + " centar",
        lat: walkLocations[0]?.lat || firstDest?.lat, lng: walkLocations[0]?.lng || firstDest?.lng,
        notes: "Učenici se kreću u grupama od min. 3 osobe."
      });

      // Dinner with SPECIFIC restaurant
      const dinnerR = firstDest?.restaurants?.[tier.id] || firstDest?.restaurants?.[0];
      activities.push({
        time: "19:00 - 20:30",
        description: "Večera u restoranu " + (dinnerR ? "\"" + dinnerR.name + "\"" + (dinnerR.address ? ", " + dinnerR.address : "") + ". " + getConcreteRestaurantDesc(dinnerR, tier.type, destName) : "u centru grada — tradicionalna kuhinja regije.") + (dinnerR?.phone ? " Rezervacija: " + dinnerR.phone + "." : ""),
        type: "meal",
        location: dinnerR?.name || "Restoran u centru",
        lat: dinnerR?.lat || firstDest?.lat, lng: dinnerR?.lng || firstDest?.lng,
        notes: dinnerR?.openingHours ? "Radno vrijeme: " + dinnerR.openingHours : "Grupna rezervacija unaprijed"
      });

      // Evening walk
      activities.push({
        time: "20:30 - 21:30",
        description: "Večernja šetnja " + destName + " — " + getConcreteEveningDesc(destName, tier.type, firstDest) + " Povratak u smještaj do " + (parseInt(tripData.gradeLevel) <= 6 ? "20:30" : "21:30") + ". Noćni mir od " + (parseInt(tripData.gradeLevel) <= 6 ? "21:00" : "22:00") + ".",
        type: "free_time",
        location: destName + " centar",
        lat: firstDest?.lat, lng: firstDest?.lng,
        notes: parseInt(tripData.gradeLevel) <= 6 ? "Strogi nadzor — mlađi učenici." : "Učenici u grupama od min. 3 osobe."
      });

      itinerary.push({
        day, date: dateStr,
        title: "Putovanje i dolazak u " + destName,
        summary: "Polazak iz " + tripData.departureCity + " u " + destName + " (~" + Math.round(routeInfo.distance_km / Math.max(destinationCities.length, 1)) + " km). Smještaj u " + hotelName + ". Orijentacijska šetnja i večera u " + (dinnerR?.name || "lokalnom restoranu") + ".",
        activities
      });

    } else if (day === tripDays) {
      // ====================== LAST DAY: RETURN ======================
      const lastDest = destinationCities[destinationCities.length - 1] || cityPOIs[cityPOIs.length - 1];
      const lastCity = lastDest?.city || tripData.destinations[tripData.destinations.length - 1];

      activities.push({
        time: "07:00 - 08:00",
        description: "Buđenje i doručak u smještaju. Posljednji obrok u " + lastCity + " — " + (tier.type === 'Premium' ? "bogat švedski stol s lokalnim specijalitetima, svježe voće, peciva, topla jela." : "kontinentalni doručak: peciva, voće, čaj/kafa/sok."),
        type: "meal",
        location: lastCity,
        lat: lastDest?.lat, lng: lastDest?.lng
      });

      activities.push({
        time: "08:00 - 09:00",
        description: "Pakovanje i check-out. Pratitelji provjeravaju svaku sobu — kupatilo, ormare, ispod kreveta — da ništa nije zaboravljeno. Prtljag se utovara u autobus. Predaja ključeva/kartica na recepciji.",
        type: "accommodation",
        location: lastCity,
        lat: lastDest?.lat, lng: lastDest?.lng,
        notes: "Obavezna kontrola soba prije predaje ključeva."
      });

      // Morning activity with concrete venue
      if (tripDays > 2) {
        const morningPOI = lastDest?.monuments?.[2] || lastDest?.educational?.[1] || lastDest?.museums?.[1];
        if (morningPOI) {
          activities.push({
            time: "09:00 - 10:30",
            description: "Posljednja posjeta: " + morningPOI.name + (morningPOI.address ? " (" + morningPOI.address + ")" : "") + ". " + getConcreteAttractionDesc(morningPOI, educationalFocus, lastCity) + " Posljednje fotografije i bilješke za školski projekt." + (morningPOI.openingHours ? " Radno vrijeme: " + morningPOI.openingHours + "." : ""),
            type: "activity",
            location: morningPOI.name,
            lat: morningPOI.lat, lng: morningPOI.lng,
            notes: morningPOI.website ? "Web: " + morningPOI.website : undefined
          });
        }
      }

      // Souvenir shopping
      activities.push({
        time: tripDays > 2 ? "10:30 - 11:30" : "09:00 - 10:00",
        description: "Slobodno vrijeme za kupovinu suvenira i poklona za porodicu. Učenici se kreću u grupama uz dogovorenu tačku okupljanja na glavnom trgu. Mogućnost kupovine lokalnih specijaliteta (čokolada, med, ručni radovi).",
        type: "free_time",
        location: lastCity + " centar",
        lat: lastDest?.lat, lng: lastDest?.lng,
        notes: "Dogovorena tačka okupljanja. Učenici u grupama od min. 3."
      });

      // Departure
      const departH = tripDays > 2 ? 12 : 11;
      activities.push({
        time: pad(departH) + ":00",
        description: "Polazak prema " + tripData.departureCity + ". Procijenjeno vrijeme vožnje: " + routeInfo.duration_hours.toFixed(1) + " sati. Provjera prisutnosti svih učenika prije polaska. Tokom vožnje, refleksija o putovanju — učenici dijele najdraže uspomene i pišu kratke osvrte za školski magazin.",
        type: "travel",
        location: lastCity,
        lat: lastDest?.lat, lng: lastDest?.lng
      });

      // Lunch stop on return
      const returnRestaurant = restStops.length > 1 ? restStops[restStops.length - 1] : restStops[0];
      activities.push({
        time: pad(departH + 2) + ":00 - " + pad(departH + 3) + ":00",
        description: "Pauza za ručak " + (returnRestaurant ? "u restoranu \"" + returnRestaurant.name + "\"" + (returnRestaurant.address ? " (" + returnRestaurant.address + ")" : "") : "na autoputnom odmorištu") + ". Topli obrok za cijelu grupu. Toalet i osvježenje prije nastavka puta.",
        type: "meal",
        location: returnRestaurant?.name || "Odmorište na autoputu",
        lat: returnRestaurant?.lat, lng: returnRestaurant?.lng
      });

      // Arrival
      const arriveH = Math.min(departH + Math.ceil(routeInfo.duration_hours / Math.max(destinationCities.length, 1)) + 2, 21);
      activities.push({
        time: pad(arriveH) + ":00 - " + pad(arriveH) + ":30",
        description: "Dolazak u " + tripData.departureCity + ". Autobus se zaustavlja ispred " + meetingPoint.name + ", " + meetingPoint.address + ". Roditelji preuzimaju djecu uz potpis na evidenciji. Prtljag se istovaruje i dijeli. Pratitelji se zahvaljuju roditeljima i učenicima. Sretno i sigurno završen put!",
        type: "activity",
        location: meetingPoint.name,
        lat: meetingPoint.lat, lng: meetingPoint.lng,
        notes: "Roditelji kontaktirani 1h prije dolaska."
      });

      itinerary.push({
        day, date: dateStr,
        title: "Povratak u " + tripData.departureCity,
        summary: (tripDays > 2 ? "Posljednja razgledanja, " : "") + "kupovina suvenira i povratak u " + tripData.departureCity + ". Dolazak u večernjim satima.",
        activities
      });

    } else {
      // ====================== MIDDLE DAYS: EXPLORATION ======================
      const cityIdx = Math.min(Math.floor((day - 2) * destinationCities.length / Math.max(tripDays - 2, 1)), destinationCities.length - 1);
      const currentCity = destinationCities[cityIdx] || destinationCities[0] || cityPOIs[0];
      const cityName = currentCity?.city || tripData.destinations[0];

      const prevCityIndex = cityIdx > 0 ? cityIdx - 1 : -1;
      const isTransitDay = day > 2 && cityIdx !== Math.min(Math.floor((day - 3) * destinationCities.length / Math.max(tripDays - 2, 1)), destinationCities.length - 1);

      // Breakfast
      activities.push({
        time: "07:30 - 08:30",
        description: "Doručak u smještaju — " + (tier.type === 'Premium' ? "bogat švedski stol: svježi croissanti, lokalni sirevi, voće, jaja, šunka, svježe cijeđeni sokovi, čaj/kafa." : tier.type === 'Balanced' ? "kontinentalni doručak s toplim i hladnim opcijama: peciva, šunka, sir, voće, jaja, čaj/kafa/sok." : "jednostavan ali hranjiv doručak: peciva, maslac, džem, čaj/kafa, voće."),
        type: "meal",
        location: cityName + " — smještaj",
        lat: currentCity?.lat, lng: currentCity?.lng
      });

      let morningStart = "09:00";

      if (isTransitDay && prevCityIndex >= 0) {
        const prevCity = destinationCities[prevCityIndex];
        const transitDist = estimateDistance([
          { lat: prevCity?.lat || 0, lng: prevCity?.lng || 0 },
          { lat: currentCity?.lat || 0, lng: currentCity?.lng || 0 }
        ]);
        activities.push({
          time: "08:30 - 09:00",
          description: "Check-out iz smještaja u " + (prevCity?.city || '') + ". Kontrola soba, utovara prtljaga u autobus.",
          type: "accommodation",
          location: prevCity?.city || '',
          lat: prevCity?.lat, lng: prevCity?.lng
        });
        activities.push({
          time: "09:00 - " + pad(9 + Math.ceil(transitDist.duration_hours)) + ":00",
          description: "Putovanje iz " + (prevCity?.city || '') + " u " + cityName + " (~" + transitDist.distance_km + " km, " + transitDist.duration_hours.toFixed(1) + "h). " + (tier.id >= 2 ? "Tokom vožnje lokalni vodič priprema grupu — prezentacija o " + cityName + ": historija grada, najvažnije znamenitosti, lokalna kuhinja i običaji." : "Učenici koriste vrijeme za bilješke o dosadašnjim posjetama i pripremu za novu destinaciju."),
          type: "travel",
          location: cityName,
          lat: currentCity?.lat, lng: currentCity?.lng
        });
        const checkInH = 9 + Math.ceil(transitDist.duration_hours);
        const newHotel = currentCity?.hotels?.[tier.id - 1] || currentCity?.hotels?.[0];
        const newHotelName = newHotel?.name || (tier.type === 'Budget' ? 'hostel' : 'hotel');
        activities.push({
          time: pad(checkInH) + ":00 - " + pad(checkInH) + ":30",
          description: "Check-in u " + newHotelName + (newHotel?.address ? " (" + newHotel.address + ")" : "") + (newHotel?.phone ? ", tel: " + newHotel.phone : "") + " u " + cityName + ". Raspodjela soba, ostavljanje prtljaga, kratko osvježenje.",
          type: "accommodation",
          location: newHotelName,
          lat: newHotel?.lat || currentCity?.lat, lng: newHotel?.lng || currentCity?.lng,
          notes: newHotel?.website ? "Web: " + newHotel.website : undefined
        });
        morningStart = pad(checkInH + 1) + ":00";
      }

      // Morning: Museum visit with SPECIFIC name, address, description
      const usedPOIs = new Set<string>();
      const museumIdx = (day - 2) % Math.max(currentCity?.museums?.length || 1, 1);
      const museum = currentCity?.museums?.[museumIdx];
      if (museum) {
        usedPOIs.add(museum.name);
        const endTime = isTransitDay ? pad(parseInt(morningStart) + 2) + ":00" : "11:30";
        activities.push({
          time: morningStart + " - " + endTime,
          description: "Posjeta: " + museum.name + (museum.address ? ", adresa: " + museum.address : "") + ". " + getConcreteMuseumDesc(museum, educationalFocus, cityName, tier.type) + (museum.openingHours ? " Radno vrijeme: " + museum.openingHours + "." : "") + (museum.website ? " Web: " + museum.website + "." : "") + (tier.type !== 'Budget' ? " Vođena tura na engleskom/njemačkom jeziku." : " Samostalno razgledanje uz informativne table."),
          type: "activity",
          location: museum.name,
          lat: museum.lat, lng: museum.lng,
          notes: museum.phone ? "Tel: " + museum.phone : (tier.id >= 2 ? "Grupna ulaznica po povlaštenoj cijeni." : "Ulaz besplatan ili po grupnoj cijeni.")
        });
      }

      // Late morning: Monument/attraction with SPECIFIC details
      if (!isTransitDay) {
        const monIdx = (day - 1) % Math.max(currentCity?.monuments?.length || 1, 1);
        const monument = currentCity?.monuments?.[monIdx];
        if (monument && !usedPOIs.has(monument.name)) {
          usedPOIs.add(monument.name);
          activities.push({
            time: "11:30 - 12:30",
            description: "Razgledanje: " + monument.name + (monument.address ? " (" + monument.address + ")" : "") + ". " + getConcreteAttractionDesc(monument, educationalFocus, cityName) + " Grupno fotografisanje i bilješke za školski dnevnik putovanja." + (monument.openingHours ? " Radno vrijeme: " + monument.openingHours + "." : ""),
            type: "activity",
            location: monument.name,
            lat: monument.lat, lng: monument.lng,
            notes: monument.website ? "Web: " + monument.website : undefined
          });
        }
      }

      // Lunch with SPECIFIC restaurant name, address, phone
      const lunchIdx = (day + tier.id) % Math.max(currentCity?.restaurants?.length || 1, 1);
      const lunch = currentCity?.restaurants?.[lunchIdx] || currentCity?.restaurants?.[0];
      activities.push({
        time: "12:30 - 14:00",
        description: "Ručak u restoranu " + (lunch ? "\"" + lunch.name + "\"" + (lunch.address ? ", " + lunch.address : "") + ". " + getConcreteRestaurantDesc(lunch, tier.type, cityName) + (lunch.phone ? " Rezervacija: " + lunch.phone + "." : "") : "u centru grada — lokalna kuhinja s raznovrsnim menijem prilagođenim za grupu."),
        type: "meal",
        location: lunch?.name || "Restoran u centru",
        lat: lunch?.lat || currentCity?.lat, lng: lunch?.lng || currentCity?.lng,
        notes: lunch?.openingHours ? "Radno vrijeme: " + lunch.openingHours : "Grupna rezervacija."
      });

      // Afternoon: Educational visit with SPECIFIC venue
      const eduIdx = (day - 1) % Math.max(currentCity?.educational?.length || 1, 1);
      const edu = currentCity?.educational?.[eduIdx];
      if (edu && !usedPOIs.has(edu.name)) {
        usedPOIs.add(edu.name);
        activities.push({
          time: "14:30 - 16:00",
          description: "Edukativna posjeta: " + edu.name + (edu.address ? ", " + edu.address : "") + ". " + getConcreteEducationalDesc(edu, educationalFocus, cityName, tier.type) + (edu.openingHours ? " Radno vrijeme: " + edu.openingHours + "." : "") + (edu.website ? " Web: " + edu.website + "." : ""),
          type: "activity",
          location: edu.name,
          lat: edu.lat, lng: edu.lng,
          notes: edu.phone ? "Tel: " + edu.phone : undefined
        });
      }

      // Second afternoon attraction
      const pmMonIdx = (day + 1) % Math.max(currentCity?.monuments?.length || 1, 1);
      const pmPOI = currentCity?.monuments?.[pmMonIdx] || currentCity?.educational?.[(day + 1) % Math.max(currentCity?.educational?.length || 1, 1)];
      if (pmPOI && !usedPOIs.has(pmPOI.name)) {
        usedPOIs.add(pmPOI.name);
        activities.push({
          time: "16:00 - 17:15",
          description: "Posjeta: " + pmPOI.name + (pmPOI.address ? " (" + pmPOI.address + ")" : "") + ". " + getConcreteAttractionDesc(pmPOI, educationalFocus, cityName) + " Foto pauza i bilješke." + (pmPOI.openingHours ? " Radno vrijeme: " + pmPOI.openingHours + "." : ""),
          type: "activity",
          location: pmPOI.name,
          lat: pmPOI.lat, lng: pmPOI.lng,
          notes: pmPOI.website ? "Web: " + pmPOI.website : undefined
        });
      }

      // Free time / park with SPECIFIC park name
      const parkIdx = day % Math.max(currentCity?.parks?.length || 1, 1);
      const park = currentCity?.parks?.[parkIdx];
      activities.push({
        time: "17:15 - 18:30",
        description: "Slobodno vrijeme" + (park ? " — odmor u parku \"" + park.name + "\"" + (park.address ? " (" + park.address + ")" : "") + ". Prekrasne zelene površine, klupe za odmor, mogućnost fotografisanja i opuštanja nakon intenzivnog dana." : " — šetnja centrom " + cityName + ". Učenici u grupama istražuju lokalne trgovine, kupuju suvenire ili uživaju u atmosferi grada.") + " Dogovorena tačka okupljanja na glavnom trgu.",
        type: "free_time",
        location: park?.name || cityName + " centar",
        lat: park?.lat || currentCity?.lat, lng: park?.lng || currentCity?.lng,
        notes: "Učenici u grupama od min. 3 osobe. Tačka okupljanja dogovorena."
      });

      // Dinner with SPECIFIC restaurant
      const dinnerIdx = (day + tier.id + 3) % Math.max(currentCity?.restaurants?.length || 1, 1);
      const dinner = currentCity?.restaurants?.[dinnerIdx] || currentCity?.restaurants?.[1];
      activities.push({
        time: "19:00 - 20:30",
        description: "Večera u restoranu " + (dinner ? "\"" + dinner.name + "\"" + (dinner.address ? ", " + dinner.address : "") + ". " + getConcreteRestaurantDesc(dinner, tier.type, cityName) + (dinner.phone ? " Rezervacija: " + dinner.phone + "." : "") : "u centru grada — večernji obrok uz tradicionalnu kuhinju regije."),
        type: "meal",
        location: dinner?.name || "Restoran",
        lat: dinner?.lat || currentCity?.lat, lng: dinner?.lng || currentCity?.lng,
        notes: dinner?.openingHours ? "Radno vrijeme: " + dinner.openingHours : undefined
      });

      // Evening
      activities.push({
        time: "20:30 - 21:30",
        description: "Večernji program: " + getConcreteEveningDesc(cityName, tier.type, currentCity) + " Povratak u smještaj do " + (parseInt(tripData.gradeLevel) <= 6 ? "20:30" : "21:30") + ". Noćni mir od " + (parseInt(tripData.gradeLevel) <= 6 ? "21:00" : "22:00") + ".",
        type: "free_time",
        location: cityName + " centar",
        lat: currentCity?.lat, lng: currentCity?.lng,
        notes: parseInt(tripData.gradeLevel) <= 6 ? "Strogi nadzor — mlađi učenici." : "Učenici u grupama od min. 3."
      });

      const visitedNames = [...usedPOIs].slice(0, 6);
      itinerary.push({
        day, date: dateStr,
        title: isTransitDay ? "Transfer i istraživanje — " + cityName : "Istraživanje — " + cityName,
        summary: (isTransitDay ? "Putovanje u " + cityName + ". " : "") + "Posjete: " + (visitedNames.length > 0 ? visitedNames.join(", ") : "kulturne i historijske znamenitosti") + ". Ručak u " + (lunch?.name || "lokalnom restoranu") + ", večera u " + (dinner?.name || "restoranu u centru") + ".",
        activities
      });
    }
  }

  return itinerary;
}

// =====================================================================
// CONCRETE DESCRIPTION GENERATORS (venue-specific, detailed)
// =====================================================================

function getConcreteRestaurantDesc(r: POI | null | undefined, tier: string, city: string): string {
  if (!r) return "Lokalna kuhinja s raznovrsnim menijem.";
  if (tier === 'Budget') return "Popularan i pristupačan restoran poznat među lokalnim stanovništvom. Kvalitetna hrana po povoljnim cijenama — idealan za školske grupe. Meni uključuje tradicionalna jela regije, salate i dnevne specijale. Kapacitet za grupne rezervacije.";
  if (tier === 'Balanced') return "Cijenjeni restoran koji nudi autentičnu kuhinju " + city + " po umjerenim cijenama. Ugodna atmosfera, profesionalna usluga i raznovrstan meni s lokalnim specijalitetima. Preporučuju ga lokalni vodiči za školske grupe. Mogućnost prilagodbe menija za posebne dijete.";
  return "Vrhunski restoran prepoznat po izvanrednoj kuhinji i elegantnom ambijentu. Sofisticirani meni s modernim interpretacijama klasičnih jela " + city + ". Selekcija najfinijih lokalnih namirnica, profesionalna usluga, idealan za posebnu večeru s grupom. Premium gastronomski doživljaj.";
}

function getConcreteMuseumDesc(m: POI, focus: string, city: string, tier: string): string {
  return "Značajna kulturna institucija u " + city + " koja čuva bogatu zbirku artefakata, umjetnina i historijskih dokumenata. Stalne i privremene izložbe pružaju uvid u historiju, kulturu i umjetnost regije s posebnim fokusom na " + focus + ". Učenici će imati priliku vidjeti originalne eksponate, interaktivne displeje i edukativne panele. " + (tier === 'Premium' ? "Organizirana privatna vođena tura s kustosom muzeja i posebna radionica za učenike." : tier === 'Balanced' ? "Vođena tura na engleskom/njemačkom jeziku s posebnim naglaskom na edukativne elemente." : "Samostalno razgledanje uz informativne panele i radne listove pripremljene od strane pratitelja.");
}

function getConcreteAttractionDesc(poi: POI, focus: string, city: string): string {
  return "Jedna od najvažnijih znamenitosti " + city + " koja svjedoči o bogatoj historiji i kulturnom nasljeđu grada. Impresivna arhitektura i historijski značaj ove lokacije pružaju učenicima direktan uvid u razvoj grada kroz stoljeća. Edukativni fokus na arhitektonskim stilovima, historijskim događajima i kulturnom značaju, s poveznicama na " + focus + ". Idealna lokacija za grupno fotografisanje i diskusiju o viđenom.";
}

function getConcreteEducationalDesc(poi: POI, focus: string, city: string, tier: string): string {
  return "Važna edukativna institucija u " + city + " koja nudi raznovrsne programe za školske grupe. Posjeta uključuje " + (tier === 'Premium' ? "ekskluzivnu privatnu radionicu, susret sa stručnjacima i personalizirani program prilagođen uzrastu učenika" : tier === 'Balanced' ? "organiziranu vođenu turu, grupne aktivnosti i diskusiju sa stručnim vodičem" : "samostalno razgledanje uz informativne materijale i radne listove") + " s fokusom na " + focus + ". Učenici aktivno sudjeluju kroz pitanja, bilješke i praktične aktivnosti koje produbljuju razumijevanje teme.";
}

function getConcreteEveningDesc(city: string, tier: string, cityData: CityPOIs | null): string {
  const monument = cityData?.monuments?.[3] || cityData?.monuments?.[0];
  const park = cityData?.parks?.[1] || cityData?.parks?.[0];
  
  if (tier === 'Premium') {
    return "organizirano noćno razgledanje " + city + " uz profesionalnog vodiča — osvijetljene fasade, historijske priče, panoramski vidikovci." + (monument ? " Prolazak pored " + monument.name + " u večernjem ambijentu." : "") + " Opcija: posjet kulturnom događaju ili kazališnoj predstavi ako je dostupno u terminu.";
  } else if (tier === 'Balanced') {
    return "organizirana šetnja centrom " + city + " uz vodiča" + (monument ? " — obilazak " + monument.name + " i okolnih ulica u večernjem osvjetljenju" : " — noćne panorame, osvijetljeni trgovi i lokalne priče") + "." + (park ? " Kratka pauza u parku " + park.name + "." : "");
  }
  return "slobodna šetnja centrom " + city + " u grupama s pratiteljima" + (monument ? " — mogućnost ponovnog obilaska " + monument.name : " — razgledanje osvijetljenih ulica i trgova") + ". Učenici fotografišu večernje panorame i uživaju u gradskom ambijentu." + (park ? " Opcionalno: kratki odmor u parku " + park.name + "." : "");
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
// PACKING LIST & RULES
// =====================================================================

function generatePackingList(tripDays: number, tier: string, tripData: TripRequest): string[] {
  const items = [
    "Osobna iskaznica ili pasoš (original + kopija)",
    "Zdravstvena iskaznica (EHIC kartica za EU zemlje)",
    "Potpisana saglasnost roditelja (2 kopije)",
    "Kopija putnog rasporeda s kontaktima pratitelja",
    "Mobilni telefon + punjač + power bank",
    "Mala ruksak/torba za dnevne izlete",
    "Boca za vodu (min. 0.5L, dopunjiva)",
    "Lijekovi (ako su potrebni) s uputstvima na engleskom",
    "Novac/džeparac: preporučeno " + (tier === 'Budget' ? '20-30' : tier === 'Balanced' ? '40-60' : '60-100') + " EUR",
    "Sredstvo za sunčanje SPF 30+ i kapa/šešir",
    "Kišobran ili lagana vodootporna jakna",
    "Udobna obuća za hodanje (razgažena, ne nova!)",
    "Odjeća za " + tripDays + " dana (uključujući 1 rezervnu garnituru)",
    "Pidžama i toaletne potrepštine (četkica, pasta, šampon, sapun)",
    "Ručnik (provjeriti da li smještaj osigurava)",
    "Plastična vrećica za prljavu odjeću",
    "Bilježnica i olovka za dnevnik putovanja",
    "Fotoaparat ili mobitel za fotografije",
  ];

  if (tripData.transport === 'bus' || tripData.transport === 'Bus') {
    items.push("Jastuk za vrat i lagana deka za vožnju (opcionalno)");
    items.push("Sredstvo protiv mučnine (ako je potrebno)");
    items.push("Slušalice za muziku/film tokom vožnje");
  }

  items.push("Maske za lice (opcija, za zatvorene prostore)");
  items.push("Mali rječnik / translator app na telefonu");

  return items;
}

function generateTripRules(gradeLevel: string, tier: string): string[] {
  const gradeNum = parseInt(gradeLevel, 10);
  const isYounger = !isNaN(gradeNum) && gradeNum <= 6;

  return [
    "Učenici se UVIJEK kreću u grupama od najmanje 3 osobe — NIKO ne smije biti sam",
    "Obavezno nositi identifikacijsku narukvicu/karticu s brojem telefona pratitelja",
    "Mobilni telefoni na tihi način tokom posjeta muzejima, galerijama i kulturnim institucijama",
    "Zabranjeno napuštanje grupe ili smještaja bez izričite dozvole pratitelja",
    "Obavezno vezivanje sigurnosnog pojasa u autobusu — nema izuzetaka",
    "Tačka okupljanja se dogovara na početku SVAKOG dana i ponovnom sastanku nakon slobodnog vremena",
    "U slučaju odvajanja od grupe: 1) Ostati na mjestu 2) Kontaktirati pratitelja 3) Pozvati hitni broj škole",
    "Poštovanje lokalnih pravila, kulture, običaja i drugih posjetilaca u svim destinacijama",
    "STROGO zabranjeno konzumiranje alkohola i duhana — nulta tolerancija",
    "Fotografisanje samo uz poštovanje privatnosti drugih osoba i pravila institucija",
    "Zabranjeno kupanje/plivanje bez nadzora pratitelja i bez odobrenja",
    isYounger ? "Noćni mir od 21:00 — učenici MORAJU biti u sobama, vrata otključana za kontrolu pratitelja" : "Noćni mir od 22:00 — učenici moraju biti u sobama, tišina obavezna",
    isYounger ? "Obavezan nadzor pratitelja tokom SVIH aktivnosti — nema izuzetaka" : "Večernje slobodno vrijeme u grupama od min. 4 osobe uz prethodnu dozvolu pratitelja",
    "U slučaju bolesti ili povrede — ODMAH obavijestiti pratitelja, ne čekati",
    "Hitni kontakt škole: +387 33 560 520 | Europski hitni broj: 112",
  ];
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
    console.log("IDSS TRIP PLANNER v3.0 — PLATINUM STANDARD");
    console.log("============================================================");

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

    // Step 1: Fetch POIs with increased limits
    console.log("Step 1: Fetching comprehensive POI data...");
    const uniqueCities = [...new Set([tripData.departureCity, ...tripData.destinations])];

    const cityPOIs: CityPOIs[] = [];
    for (const city of uniqueCities) {
      const result = await fetchCityPOIs(city);
      if (result) cityPOIs.push(result);
      if (uniqueCities.length > 2) await new Promise(r => setTimeout(r, 300));
    }

    const totalPOIs = cityPOIs.reduce((sum, c) =>
      sum + c.museums.length + c.monuments.length + c.restaurants.length +
      c.hotels.length + c.parks.length + c.educational.length, 0
    );
    console.log("Fetched " + totalPOIs + " POIs across " + cityPOIs.length + " cities");

    // Step 2: Build route
    const routeCoordinates = buildRouteCoordinates(tripData.departureCity, tripData.destinations, cityPOIs);

    // Step 3: Calculate distance
    const routeInfo = await calculateRouteDistance(routeCoordinates.map(c => ({ lat: c.lat, lng: c.lng })));
    console.log("Route: " + routeInfo.distance_km + "km, " + routeInfo.duration_hours + "h");

    // Step 3b: Rest stops
    const restStops: POI[] = [];
    for (let i = 0; i < Math.min(routeCoordinates.length - 1, 4); i++) {
      const stops = await findRestStops(routeCoordinates[i], routeCoordinates[i + 1]);
      restStops.push(...stops.slice(0, 3));
    }
    console.log("Found " + restStops.length + " rest stops/restaurants along route");

    // Step 4: AI Gateway with ULTRA-DETAILED prompt
    let plans: any = null;
    let usedFallback = false;

    if (LOVABLE_API_KEY) {
      try {
        console.log("Step 4: AI Gateway — ultra-detailed generation...");

        const poisByCity = cityPOIs.map(city => {
          const fmt = (pois: POI[], label: string) => {
            if (pois.length === 0) return label + ": nema podataka";
            return label + ":\n" + pois.map((p, i) => {
              let l = "  " + (i + 1) + ". " + p.name;
              if (p.address) l += " | Adresa: " + p.address;
              if (p.openingHours) l += " | Radno vrijeme: " + p.openingHours;
              if (p.phone) l += " | Tel: " + p.phone;
              if (p.website) l += " | Web: " + p.website;
              return l;
            }).join('\n');
          };
          return "\n=== " + city.city.toUpperCase() + " ===\n" +
            fmt(city.museums, 'MUZEJI') + "\n" +
            fmt(city.monuments, 'ZNAMENITOSTI') + "\n" +
            fmt(city.restaurants, 'RESTORANI') + "\n" +
            fmt(city.hotels, 'HOTELI') + "\n" +
            fmt(city.educational, 'EDUKATIVNE INSTITUCIJE') + "\n" +
            fmt(city.parks, 'PARKOVI');
        }).join('\n');

        const chaperonesToShow = tripData.chaperones.length > 0 ? tripData.chaperones.join(', ') : Math.ceil(tripData.studentCount / 15) + ' pratitelja';
        const totalPersons = tripData.studentCount + Math.max(tripData.chaperones.length, Math.ceil(tripData.studentCount / 15));

        const systemPrompt = `Ti si PLATINUM STANDARD stručni planer školskih ekskurzija za Internationale Deutsche Schule Sarajevo (IDSS). Tvoj zadatak je kreirati IZUZETNO DETALJNE planove puta koji uključuju KONKRETNE nazive hotela, restorana, muzeja, galerija i svih znamenitosti.

# BAZA PODATAKA LOKACIJA (VERIFICIRANI PODACI):
${poisByCity}

# PODACI O RUTI:
- Ukupna udaljenost: ${routeInfo.distance_km} km (round-trip)
- Ukupno vrijeme vožnje: ${routeInfo.duration_hours} sati
- Polazište: Internationale Deutsche Schule Sarajevo, Buka 13, 71000 Sarajevo
- Ruta: ${fullRoute}

# PRAVILA ZA KREIRANJE PLANA (OBAVEZNO):

## FORMAT PLANA — SVAKI DAN MORA SADRŽAVATI:
1. **TAČNO VRIJEME** svake aktivnosti (npr. "07:00 - 08:00", "09:30 - 11:30")
2. **KONKRETNE NAZIVE** hotela, restorana, muzeja — NE generičke opise
3. **ADRESE** gdjegod su dostupne iz baze podataka
4. **TELEFONE i WEB STRANICE** kada su dostupni
5. **RADNO VRIJEME** atrakcija kada je poznato
6. **DETALJAN OPIS** svake aktivnosti (minimum 3 rečenice):
   - ŠTA se konkretno radi na lokaciji
   - ZAŠTO je to edukativno relevantno
   - ŠTA će učenici vidjeti/naučiti
7. **PRAKTIČNE NAPOMENE**: cijene ulaznica, potrebne rezervacije, posebna pravila

## PRIMJER KVALITETE (ovako mora izgledati svaki dan):
"08:00 - Polazak iz Sarajeva. 11:00-12:00 Brunch u Doboju u restoranu Dallas. 14:00-15:00 Check-in u hotel. 15:00-17:00 Šetnja centralnim Trgom bana Jelačića i Tkalčićevom ulicom, posjet parku Zrinjevac. Večera u restoranu Nokturno. 18:00-19:00 Posjet Muzeju čokolade (~12km od centra). Večernja šetnja Zagrebom."

## STRUKTURA:
- Dan 1: Putovanje + dolazak + smještaj + prva šetnja + večera u KONKRETNOM restoranu
- Srednji dani: Doručak + jutarnji obilazak (muzej/galerija s IMENOM) + ručak u KONKRETNOM restoranu + popodnevni obilazak (park/znamenitost s IMENOM) + večera u KONKRETNOM restoranu + večernji program
- Zadnji dan: Doručak + check-out + posljednje razgledanje + kupovina suvenira + povratak

## REALISTIČNE CIJENE (EUR, 2025/2026):
- Bus: 1.10 EUR/km, Premium: 1.30 EUR/km
- Smještaj: Budget 28€/noć/os (hostel), Balanced 48€ (3*), Premium 85€ (4-5*)
- Obroci: Budget 25€/dan/os, Balanced 40€, Premium 65€
- Ulaznice: Budget 7€/dan/os, Balanced 15€, Premium 28€

## OBAVEZNO GENERIŠI 3 VARIJANTE: Budget, Balanced, Premium

Odgovori ISKLJUČIVO validnim JSON objektom (bez markdown):
{"plans":[{"id":1,"type":"Budget","route":"...","reliability":85,"days":${tripDays},"distance_km":${routeInfo.distance_km},"travel_hours":${routeInfo.duration_hours},"cost_per_student":0,"costs":{"transport":0,"accommodation":0,"meals":0,"entry_fees":0,"activity_fees":0,"local_transport":0,"contingency":0,"total":0,"transport_detail":"...","accommodation_detail":"...","meals_detail":"..."},"why_this_fits":"...","accommodation_info":"Konkretno ime hotela, adresa, tel","chaperones":"${chaperonesToShow}","meeting_point":{"name":"Internationale Deutsche Schule Sarajevo","address":"Buka 13, 71000 Sarajevo","lat":43.8612,"lng":18.4028,"time":"07:00"},"itinerary":[{"day":1,"date":"${tripData.departureDate}","title":"...","summary":"...","activities":[{"time":"HH:MM - HH:MM","description":"Detaljan opis (3+ rečenice) s konkretnim imenima lokacija","type":"travel|meal|activity|accommodation|free_time","location":"Tačan naziv lokacije","lat":0.0,"lng":0.0,"notes":"Praktične napomene, cijene, rezervacije"}]}],"packing_list":["..."],"rules":["..."],"emergency_contacts":{"school":"+387 33 560 520","embassy_info":"...","local_emergency":"112","medical_info":"..."}}]}`;

        const userPrompt = `Kreiraj ULTRA-DETALJAN plan ekskurzije:
- Ruta: ${tripData.departureCity} → ${tripData.destinations.join(' → ')} → ${tripData.departureCity}
- Razred: ${tripData.gradeLevel}, Učenika: ${tripData.studentCount}, Pratitelji: ${chaperonesToShow}
- Period: ${tripData.departureDate} do ${tripData.returnDate} (${tripDays} dana)
- Prevoz: ${tripData.transport}
- Budget orijentacija: ${tripData.budget || 500} EUR/učenik
${tripData.educationalFocus ? '- Edukativni fokus: ' + tripData.educationalFocus : ''}
${tripData.specialNeeds ? '- Posebne napomene: ' + tripData.specialNeeds : ''}

VAŽNO: Svaka aktivnost MORA sadržavati KONKRETNO ime lokacije (restoran, muzej, hotel) iz gore navedene baze podataka, adresu, i detaljan opis od minimum 3 rečenice. Plan mora biti na nivou profesionalnog turističkog vodiča — kao da ga piše iskusni planer ekskurzija.

Samo čisti JSON, bez markdown.`;

        const aiAbortController = new AbortController();
        const aiTimeout = setTimeout(() => aiAbortController.abort(), 55000);

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
            temperature: 0.25,
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
              console.log("AI Gateway success: " + plans.plans.length + " ultra-detailed plans");
            }
          }
        } else {
          const errText = await aiResponse.text().catch(() => "");
          console.log("AI Gateway status " + aiResponse.status + ": " + errText.slice(0, 200));
        }
      } catch (aiError) {
        console.log("AI Gateway error, falling back:", aiError);
      }
    }

    // Step 4b: Fallback with ultra-detail
    if (!plans) {
      console.log("Using FALLBACK engine v3.0 with ultra-detailed POI data...");
      usedFallback = true;
      plans = generateFallbackPlans(tripData, cityPOIs, routeInfo, routeCoordinates, restStops, tripDays, fullRoute);
    }

    // Enrich
    plans.route_coordinates = routeCoordinates;
    plans.verification = {
      data_source: "OpenStreetMap (Overpass API) + Nominatim + OSRM" + (usedFallback ? " + Fallback Engine v3.0" : " + AI Gateway (Gemini 2.5 Flash)"),
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
          ...city.museums.slice(0, 5).map(m => m.name),
          ...city.monuments.slice(0, 5).map(m => m.name),
          ...city.educational.slice(0, 4).map(e => e.name)
        ].filter(Boolean),
        curriculum_links: tripData.educationalFocus ? [tripData.educationalFocus] : ["historija", "kultura", "geografija"]
      }));
    }

    // Normalize structure
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
    console.log("PLATINUM PLAN GENERATED" + (usedFallback ? " (FALLBACK v3.0)" : " (AI GATEWAY)"));
    plans.plans.forEach((p: any) => {
      const actCount = p.itinerary?.reduce((s: number, d: any) => s + (d.activities?.length || 0), 0) || 0;
      console.log("  " + p.type + ": " + p.cost_per_student + " EUR/student, " + (p.itinerary?.length || 0) + " days, " + actCount + " activities");
    });
    console.log("============================================================");

    return new Response(JSON.stringify(plans), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-trip-plans:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Došlo je do neočekivane greške"
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
