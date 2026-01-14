import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      headers: {
        'User-Agent': 'IDSS-Trip-Planner/1.0 (info@idss.ba)'
      }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
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
    const radius = 3000; // 3km radius
    
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
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'data=' + encodeURIComponent(query)
    });
    
    if (!response.ok) {
      console.log("Overpass API response status: " + response.status + " for " + poiType);
      return [];
    }
    
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

// Fetch all POIs for a city using Overpass API
async function fetchCityPOIs(cityName: string): Promise<CityPOIs | null> {
  console.log("Fetching POIs for " + cityName + " using Overpass API...");
  
  let geoData = await geocodeCity(cityName);
  
  if (!geoData) {
    console.log("Could not geocode " + cityName + ", trying fallback...");
    const fallbackCoords = getFallbackCoordinates(cityName);
    if (fallbackCoords) {
      geoData = { ...fallbackCoords, displayName: cityName };
    } else {
      console.log("No fallback coordinates for " + cityName);
      return null;
    }
  }
  
  console.log("Geocoded " + cityName + ": " + geoData.lat + ", " + geoData.lng);
  
  const [museums, monuments, restaurants, hotels, parks, educational] = await Promise.all([
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'museums', 12),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'monuments', 15),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'restaurants', 20),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'hotels', 10),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'parks', 8),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'educational', 12)
  ]);
  
  console.log("Found for " + cityName + ": " + museums.length + " museums, " + monuments.length + " monuments, " + restaurants.length + " restaurants, " + hotels.length + " hotels, " + parks.length + " parks, " + educational.length + " educational sites");
  
  return {
    city: cityName,
    lat: geoData.lat,
    lng: geoData.lng,
    museums,
    monuments,
    restaurants,
    hotels,
    parks,
    educational
  };
}

// Calculate route distance using OSRM (completely free, no API key needed)
async function calculateRouteDistance(coordinates: Array<{lat: number; lng: number}>): Promise<{distance_km: number; duration_hours: number}> {
  if (coordinates.length < 2) {
    return { distance_km: 0, duration_hours: 0 };
  }
  
  try {
    const coordString = coordinates.map(c => c.lng + ',' + c.lat).join(';');
    const url = "https://router.project-osrm.org/route/v1/driving/" + coordString + "?overview=false";
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log('OSRM error, using estimation');
      return estimateDistance(coordinates);
    }
    
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        distance_km: Math.round(route.distance / 1000),
        duration_hours: Math.round(route.duration / 3600 * 10) / 10
      };
    }
    
    return estimateDistance(coordinates);
  } catch (error) {
    console.error('Route calculation error:', error);
    return estimateDistance(coordinates);
  }
}

// Estimate distance using Haversine formula
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
  
  return {
    distance_km: Math.round(totalDistance),
    duration_hours: Math.round(totalDistance / 70 * 10) / 10
  };
}

// Get fallback coordinates for common cities
function getFallbackCoordinates(cityName: string): { lat: number; lng: number } | null {
  const normalizedName = cityName.toLowerCase()
    .replace(/,.*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
    
  const cityCoords: Record<string, { lat: number; lng: number }> = {
    'sarajevo': { lat: 43.8563, lng: 18.4131 },
    'beograd': { lat: 44.7866, lng: 20.4489 },
    'belgrade': { lat: 44.7866, lng: 20.4489 },
    'budimpesta': { lat: 47.4979, lng: 19.0402 },
    'budapest': { lat: 47.4979, lng: 19.0402 },
    'zagreb': { lat: 45.8150, lng: 15.9819 },
    'ljubljana': { lat: 46.0569, lng: 14.5058 },
    'bec': { lat: 48.2082, lng: 16.3738 },
    'vienna': { lat: 48.2082, lng: 16.3738 },
    'wien': { lat: 48.2082, lng: 16.3738 },
    'prag': { lat: 50.0755, lng: 14.4378 },
    'prague': { lat: 50.0755, lng: 14.4378 },
    'praha': { lat: 50.0755, lng: 14.4378 },
    'rim': { lat: 41.9028, lng: 12.4964 },
    'rome': { lat: 41.9028, lng: 12.4964 },
    'roma': { lat: 41.9028, lng: 12.4964 },
    'bologna': { lat: 44.4949, lng: 11.3426 },
    'padova': { lat: 45.4064, lng: 11.8768 },
    'venecija': { lat: 45.4408, lng: 12.3155 },
    'venice': { lat: 45.4408, lng: 12.3155 },
    'venezia': { lat: 45.4408, lng: 12.3155 },
    'firenca': { lat: 43.7696, lng: 11.2558 },
    'florence': { lat: 43.7696, lng: 11.2558 },
    'firenze': { lat: 43.7696, lng: 11.2558 },
    'mostar': { lat: 43.3438, lng: 17.8078 },
    'dubrovnik': { lat: 42.6507, lng: 18.0944 },
    'split': { lat: 43.5081, lng: 16.4402 },
    'munchen': { lat: 48.1351, lng: 11.5820 },
    'munich': { lat: 48.1351, lng: 11.5820 },
    'berlin': { lat: 52.5200, lng: 13.4050 },
    'pariz': { lat: 48.8566, lng: 2.3522 },
    'paris': { lat: 48.8566, lng: 2.3522 },
    'amsterdam': { lat: 52.3676, lng: 4.9041 },
    'barcelona': { lat: 41.3851, lng: 2.1734 },
    'madrid': { lat: 40.4168, lng: -3.7038 },
    'london': { lat: 51.5074, lng: -0.1278 },
    'atena': { lat: 37.9838, lng: 23.7275 },
    'athens': { lat: 37.9838, lng: 23.7275 },
    'skopje': { lat: 41.9981, lng: 21.4254 },
    'podgorica': { lat: 42.4304, lng: 19.2594 },
    'tirana': { lat: 41.3275, lng: 19.8187 },
    'bratislava': { lat: 48.1486, lng: 17.1077 },
    'krakow': { lat: 50.0647, lng: 19.9450 },
    'varsava': { lat: 52.2297, lng: 21.0122 },
    'warsaw': { lat: 52.2297, lng: 21.0122 },
    'warszawa': { lat: 52.2297, lng: 21.0122 },
    'banja luka': { lat: 44.7722, lng: 17.1910 },
    'tuzla': { lat: 44.5384, lng: 18.6763 },
    'zenica': { lat: 44.2017, lng: 17.9078 },
    'trebinje': { lat: 42.7119, lng: 18.3464 },
    'neum': { lat: 42.9231, lng: 17.6156 },
    'jajce': { lat: 44.3392, lng: 17.2700 },
    'travnik': { lat: 44.2264, lng: 17.6653 },
    'konjic': { lat: 43.6519, lng: 17.9619 },
    'visoko': { lat: 43.9889, lng: 18.1781 },
  };
  
  if (cityCoords[normalizedName]) {
    return cityCoords[normalizedName];
  }
  
  for (const [key, coords] of Object.entries(cityCoords)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return coords;
    }
  }
  
  return null;
}

// Find rest stops along route using Overpass API
async function findRestStops(fromCoords: {lat: number; lng: number}, toCoords: {lat: number; lng: number}): Promise<POI[]> {
  const midLat = (fromCoords.lat + toCoords.lat) / 2;
  const midLng = (fromCoords.lng + toCoords.lng) / 2;
  
  try {
    const query = '[out:json][timeout:10];(node["amenity"="fuel"](around:15000,' + midLat + ',' + midLng + ');node["highway"="services"](around:15000,' + midLat + ',' + midLng + ');node["highway"="rest_area"](around:15000,' + midLat + ',' + midLng + '););out body 5;';
    
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const tripData: TripRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("============================================================");
    console.log("IDSS TRIP PLANNER - Generating verified trip plans");
    console.log("============================================================");
    console.log("Request:", JSON.stringify(tripData, null, 2));

    const startDate = new Date(tripData.departureDate);
    const endDate = new Date(tripData.returnDate);
    const tripDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const allCities = [tripData.departureCity, ...tripData.destinations, tripData.departureCity];
    const fullRoute = allCities.join(' -> ');

    console.log("\nStep 1: Fetching real POI data from Overpass/Nominatim APIs...");

    const uniqueCities = [...new Set([tripData.departureCity, ...tripData.destinations])];
    const cityPOIsPromises = uniqueCities.map(city => fetchCityPOIs(city));
    const cityPOIsResults = await Promise.all(cityPOIsPromises);
    const cityPOIs = cityPOIsResults.filter((result): result is CityPOIs => result !== null);

    const totalPOIs = cityPOIs.reduce((sum, c) => 
      sum + c.museums.length + c.monuments.length + c.restaurants.length + 
      c.hotels.length + c.parks.length + c.educational.length, 0
    );
    
    console.log("Step 2: Fetched POIs for " + cityPOIs.length + "/" + uniqueCities.length + " cities (" + totalPOIs + " total POIs)");

    const routeCoordinates = cityPOIs.map((city, index) => ({
      city: city.city,
      lat: city.lat,
      lng: city.lng,
      order: index + 1
    }));

    if (cityPOIs.length > 0) {
      const departure = cityPOIs[0];
      routeCoordinates.push({
        city: tripData.departureCity + ' (povratak)',
        lat: departure.lat,
        lng: departure.lng,
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

    // Build POI data for AI prompt
    const poisByCity = cityPOIs.map(city => {
      const formatPOIs = (pois: POI[], label: string) => {
        if (pois.length === 0) return "**" + label + ":** Nema pronadjenih lokacija u bazi";
        const poiList = pois.slice(0, 8).map((p, i) => {
          let line = (i + 1) + ". " + p.name + " (" + p.lat.toFixed(5) + ", " + p.lng.toFixed(5) + ")";
          if (p.address) line += " - " + p.address;
          if (p.phone) line += " Tel: " + p.phone;
          return line;
        }).join('\n');
        return "**" + label + " (" + pois.length + "):**\n" + poiList;
      };
      
      return "\n### " + city.city.toUpperCase() + " (GPS: " + city.lat.toFixed(4) + ", " + city.lng.toFixed(4) + ")\n\n" +
        formatPOIs(city.museums, 'MUZEJI') + "\n\n" +
        formatPOIs(city.monuments, 'SPOMENICI I HISTORIJSKE LOKACIJE') + "\n\n" +
        formatPOIs(city.restaurants, 'RESTORANI I KAFICI') + "\n\n" +
        formatPOIs(city.hotels, 'HOTELI I SMJESTAJ') + "\n\n" +
        formatPOIs(city.parks, 'PARKOVI') + "\n\n" +
        formatPOIs(city.educational, 'KULTURNE I EDUKATIVNE LOKACIJE');
    }).join('\n');

    let restStopsInfo = '\n**ODMORISTA:** Koristite standardna odmorista na autoputu svaka 2 sata voznje';
    if (restStops.length > 0) {
      const stopsList = restStops.map((s, i) => (i + 1) + ". " + s.name + " (" + s.lat.toFixed(5) + ", " + s.lng.toFixed(5) + ")").join('\n');
      restStopsInfo = '\n**ODMORISTA NA RUTI:**\n' + stopsList;
    }

    const meetingPoint = {
      name: "Internationale Deutsche Schule Sarajevo",
      address: "Buka 13, 71000 Sarajevo",
      lat: 43.8612,
      lng: 18.4028,
      phone: "+38733560520"
    };

    const chaperonesToShow = tripData.chaperones.length > 0 ? tripData.chaperones.join(', ') : Math.ceil(tripData.studentCount / 15) + ' pratitelja';

    const systemPrompt = "Ti si PREMIUM strucni planer skolskih ekskurzija za Internationale Deutsche Schule Sarajevo (IDSS).\n\n" +
      "# KRITICNO - SIGURNOST DJECE JE APSOLUTNI PRIORITET!\n" +
      "Svaki detalj MORA biti TACAN, PROVJEREN i SIGURAN za djecu.\n\n" +
      "# VERIFICIRANI PODACI IZ OPENSTREETMAP BAZE:\n" + poisByCity + "\n" + restStopsInfo + "\n\n" +
      "# KALKULIRANI PODACI O RUTI (OSRM API):\n" +
      "- Ukupna udaljenost: " + routeInfo.distance_km + " km\n" +
      "- Procijenjeno vrijeme voznje: " + routeInfo.duration_hours + " sati\n" +
      "- Ruta: " + fullRoute + "\n\n" +
      "# MJESTO OKUPLJANJA I POLASKA:\n" +
      "- " + meetingPoint.name + "\n" +
      "- Adresa: " + meetingPoint.address + "\n" +
      "- Koordinate: " + meetingPoint.lat + ", " + meetingPoint.lng + "\n" +
      "- Telefon: " + meetingPoint.phone + "\n\n" +
      "# OBAVEZNA PRAVILA ZA PLAN:\n\n" +
      "1. **GENERIRAJ TACNO 3 VARIJANTE PLANA:**\n" +
      '   - "Budget" (Ekonomicna): Hosteli, jednostavni obroci, besplatne atrakcije\n' +
      '   - "Balanced" (Uravnotezena): 3* hoteli, lokalni restorani, glavne atrakcije\n' +
      '   - "Premium" (VIP): 4-5* hoteli, kvalitetna hrana, sve atrakcije\n\n' +
      "2. **SIGURNOSNI ZAHTJEVI (OBAVEZNO):**\n" +
      "   - GPS koordinate za SVAKU lokaciju (iz gornje baze)\n" +
      "   - Pauze svakih 2h za mladju djecu (do 10 god), 3h za stariju\n" +
      "   - Odgovorna osoba za svaku aktivnost\n" +
      "   - Alternativni plan za kisne dane\n\n" +
      "3. **SMJESTAJ I OBROCI:**\n" +
      "   - Koristi hotele/restorane IZ GORNJE LISTE ili poznate medjunarodne lance\n" +
      "   - Sobe: djecaci i djevojcice odvojeno, pratitelji u susjednim sobama\n\n" +
      "4. **VREMENSKA ORGANIZACIJA:**\n" +
      "   - Realisticna vremena (guzve, pauze, prelasci)\n" +
      "   - Budjenje najranije 06:30, spavanje najkasnije 22:00 za mladje\n" +
      "   - Slobodno vrijeme za kupovinu/odmor\n\n" +
      "5. **CIJENE (EUR, 2025/2026):**\n" +
      "   - Realisticne procjene po kategorijama\n" +
      "   - Ukljuciti: transport, smjestaj, obroke, ulaznice, osiguranje\n" +
      (tripData.specialNeeds ? "\n## SPECIJALNE POTREBE (OBAVEZNO UKLJUCITI):\n" + tripData.specialNeeds : '') +
      (tripData.medicalInfo ? "\n## MEDICINSKE INFORMACIJE:\n" + tripData.medicalInfo : '') +
      "\n\n# FORMAT ODGOVORA:\n" +
      "Odgovori ISKLJUCIVO validnim JSON objektom. NIKAKO markdown formatiranje, samo cisti JSON.\n\n" +
      '{\n  "plans": [\n    {\n      "id": 1,\n      "type": "Budget",\n      "route": "' + fullRoute + '",\n' +
      '      "reliability": 90,\n      "days": ' + tripDays + ',\n      "distance_km": ' + routeInfo.distance_km + ',\n' +
      '      "travel_hours": ' + routeInfo.duration_hours + ',\n      "cost_per_student": 150,\n' +
      '      "costs": {\n        "transport": 50,\n        "accommodation": 40,\n        "meals": 30,\n' +
      '        "entry_fees": 15,\n        "insurance": 10,\n        "contingency": 5,\n        "total": 150\n      },\n' +
      '      "why_this_fits": "kratko obrazlozenje",\n      "accommodation_info": "naziv hotela, adresa, kontakt",\n' +
      '      "meeting_point": {\n        "name": "' + meetingPoint.name + '",\n        "address": "' + meetingPoint.address + '",\n' +
      '        "lat": ' + meetingPoint.lat + ',\n        "lng": ' + meetingPoint.lng + ',\n        "time": "07:00"\n      },\n' +
      '      "itinerary": [\n        {\n          "day": 1,\n          "date": "YYYY-MM-DD",\n          "title": "Naslov dana",\n' +
      '          "summary": "Kratak opis",\n          "activities": [\n            {\n' +
      '              "time": "HH:MM-HH:MM",\n              "description": "Opis aktivnosti",\n' +
      '              "type": "meeting",\n              "location": "Naziv lokacije",\n' +
      '              "lat": 43.86,\n              "lng": 18.40,\n              "notes": "Dodatne napomene"\n            }\n          ]\n        }\n      ],\n' +
      '      "packing_list": ["stavka1", "stavka2"],\n      "rules": ["pravilo1", "pravilo2"]\n    }\n  ]\n}';

    const userPrompt = "Generiraj 3 DETALJNE opcije plana putovanja:\n\n" +
      "## PODACI O EKSKURZIJI:\n" +
      "- **Skola:** Internationale Deutsche Schule Sarajevo\n" +
      "- **Polaziste:** " + tripData.departureCity + "\n" +
      "- **Destinacije:** " + tripData.destinations.join(', ') + "\n" +
      "- **Razred:** " + tripData.gradeLevel + "\n" +
      "- **Broj ucenika:** " + tripData.studentCount + "\n" +
      "- **Pratitelji:** " + chaperonesToShow + "\n" +
      "- **Prevoz:** " + tripData.transport + "\n" +
      "- **Period:** " + tripData.departureDate + " do " + tripData.returnDate + " (" + tripDays + " dana)\n" +
      "- **Plan obroka:** " + (tripData.mealPlan || 'polupansion') + "\n" +
      "- **Smjestaj:** " + (tripData.accommodationType || 'hotel') + "\n" +
      "- **Budzet po uceniku:** " + (tripData.budget || 300) + " EUR\n" +
      (tripData.educationalFocus ? "- **Edukativni fokus:** " + tripData.educationalFocus + "\n" : '') +
      (tripData.specialNeeds ? "- **Posebne napomene:** " + tripData.specialNeeds + "\n" : '') +
      "\n## KRITICNI ZAHTJEVI:\n" +
      "1. Koristi SAMO lokacije iz OpenStreetMap baze iznad\n" +
      "2. Svaka lokacija MORA imati GPS koordinate\n" +
      "3. Vremena moraju biti REALISTICNA\n" +
      "4. Cijene u EUR za 2025/2026\n\n" +
      "Odgovori SAMO cistim JSON objektom, bez markdown oznaka.";

    console.log("\nStep 4: Calling AI Gateway for itinerary generation...");
    const startTime = Date.now();

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + LOVABLE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    const responseTime = Date.now() - startTime;
    console.log("AI Gateway response time: " + responseTime + "ms");

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Previse zahtjeva. Molimo pokusajte ponovo za nekoliko minuta." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Potrebna nadoplata kredita." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI Gateway error: " + response.status);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("No content in AI response");
      throw new Error("Prazan odgovor od AI servisa");
    }

    console.log("\nStep 5: Parsing and validating AI response...");

    let plans;
    try {
      let jsonString = content.trim();
      
      // Remove markdown code blocks if present
      if (jsonString.includes("json")) {
        const startIdx = jsonString.indexOf("{");
        const endIdx = jsonString.lastIndexOf("}");
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          jsonString = jsonString.substring(startIdx, endIdx + 1);
        }
      }
      
      // Find the JSON object boundaries
      const jsonStart = jsonString.indexOf("{");
      const jsonEnd = jsonString.lastIndexOf("}");
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
      }
      
      plans = JSON.parse(jsonString);
      
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw content:", content.substring(0, 500));
      throw new Error("Greska pri parsiranju odgovora. Molimo pokusajte ponovo.");
    }

    if (!plans.plans || !Array.isArray(plans.plans)) {
      console.error("Invalid plans structure");
      throw new Error("Neispravan format planova.");
    }

    if (plans.plans.length < 3) {
      console.warn("Only " + plans.plans.length + " plans generated, expected 3");
    }

    plans.route_coordinates = routeCoordinates;

    plans.verification = {
      data_source: "OpenStreetMap (Overpass API) + Nominatim + OSRM",
      last_verified: new Date().toISOString(),
      route_verified: true,
      distance_km: routeInfo.distance_km,
      travel_hours: routeInfo.duration_hours,
      pois_count: totalPOIs,
      cities_data: cityPOIs.map(c => ({
        city: c.city,
        lat: c.lat,
        lng: c.lng,
        museums: c.museums.length,
        monuments: c.monuments.length,
        restaurants: c.restaurants.length,
        hotels: c.hotels.length,
        parks: c.parks.length,
        educational: c.educational.length
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

    console.log("============================================================");
    console.log("USPJESNO GENERIRANO:");
    console.log("   - " + plans.plans.length + " varijanti plana");
    console.log("   - " + cityPOIs.length + " gradova sa " + totalPOIs + " verificiranih POI-a");
    console.log("   - Ruta: " + routeInfo.distance_km + "km, " + routeInfo.duration_hours + "h");
    plans.plans.forEach((p: any) => {
      console.log("   - " + p.type + ": " + p.cost_per_student + " EUR po uceniku");
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
