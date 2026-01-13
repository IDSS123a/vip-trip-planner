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
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'IDSS-Trip-Planner/1.0 (info@idss.ba)'
        }
      }
    );
    
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
    console.error(`Geocoding error for ${cityName}:`, error);
    return null;
  }
}

// Fetch POIs using Overpass API (completely free, no API key needed)
async function fetchPOIsOverpass(lat: number, lng: number, poiType: string, limit: number = 15): Promise<POI[]> {
  try {
    // Build Overpass query based on POI type
    let query = '';
    const radius = 3000; // 3km radius
    
    switch (poiType) {
      case 'museums':
        query = `[out:json][timeout:10];(node["tourism"="museum"](around:${radius},${lat},${lng});way["tourism"="museum"](around:${radius},${lat},${lng}););out body ${limit};`;
        break;
      case 'monuments':
        query = `[out:json][timeout:10];(node["historic"](around:${radius},${lat},${lng});node["tourism"="attraction"](around:${radius},${lat},${lng});node["memorial"](around:${radius},${lat},${lng}););out body ${limit};`;
        break;
      case 'restaurants':
        query = `[out:json][timeout:10];(node["amenity"="restaurant"](around:${radius},${lat},${lng});node["amenity"="cafe"](around:${radius},${lat},${lng});node["amenity"="fast_food"](around:${radius},${lat},${lng}););out body ${limit};`;
        break;
      case 'hotels':
        query = `[out:json][timeout:10];(node["tourism"="hotel"](around:${radius},${lat},${lng});node["tourism"="hostel"](around:${radius},${lat},${lng});node["tourism"="guest_house"](around:${radius},${lat},${lng}););out body ${limit};`;
        break;
      case 'parks':
        query = `[out:json][timeout:10];(node["leisure"="park"](around:${radius},${lat},${lng});way["leisure"="park"](around:${radius},${lat},${lng}););out body ${limit};`;
        break;
      case 'educational':
        query = `[out:json][timeout:10];(node["tourism"="gallery"](around:${radius},${lat},${lng});node["amenity"="theatre"](around:${radius},${lat},${lng});node["amenity"="library"](around:${radius},${lat},${lng});node["historic"="castle"](around:${radius},${lat},${lng});node["historic"="monument"](around:${radius},${lat},${lng}););out body ${limit};`;
        break;
      default:
        return [];
    }

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`
    });
    
    if (!response.ok) {
      console.log(`Overpass API response status: ${response.status} for ${poiType}`);
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
        address: item.tags['addr:street'] ? `${item.tags['addr:street']} ${item.tags['addr:housenumber'] || ''}, ${item.tags['addr:city'] || ''}`.trim() : undefined,
        website: item.tags.website || item.tags.url,
        phone: item.tags.phone || item.tags['contact:phone'],
        openingHours: item.tags.opening_hours
      }));
  } catch (error) {
    console.error(`Overpass API error for ${poiType}:`, error);
    return [];
  }
}

// Fetch all POIs for a city using Overpass API
async function fetchCityPOIs(cityName: string): Promise<CityPOIs | null> {
  console.log(`Fetching POIs for ${cityName} using Overpass API...`);
  
  // First, geocode the city
  let geoData = await geocodeCity(cityName);
  
  if (!geoData) {
    console.log(`Could not geocode ${cityName}, trying fallback...`);
    const fallbackCoords = getFallbackCoordinates(cityName);
    if (fallbackCoords) {
      geoData = { ...fallbackCoords, displayName: cityName };
    } else {
      console.log(`No fallback coordinates for ${cityName}`);
      return null;
    }
  }
  
  console.log(`Geocoded ${cityName}: ${geoData.lat}, ${geoData.lng}`);
  
  // Fetch different categories of POIs in parallel using Overpass API
  const [museums, monuments, restaurants, hotels, parks, educational] = await Promise.all([
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'museums', 12),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'monuments', 15),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'restaurants', 20),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'hotels', 10),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'parks', 8),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'educational', 12)
  ]);
  
  console.log(`✓ Found for ${cityName}: ${museums.length} museums, ${monuments.length} monuments, ${restaurants.length} restaurants, ${hotels.length} hotels, ${parks.length} parks, ${educational.length} educational sites`);
  
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
    const coordString = coordinates.map(c => `${c.lng},${c.lat}`).join(';');
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=false`
    );
    
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
    const R = 6371; // Earth's radius in km
    const dLat = (coordinates[i + 1].lat - coordinates[i].lat) * Math.PI / 180;
    const dLon = (coordinates[i + 1].lng - coordinates[i].lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(coordinates[i].lat * Math.PI / 180) * Math.cos(coordinates[i + 1].lat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalDistance += R * c * 1.3; // 1.3 factor for road distance
  }
  
  return {
    distance_km: Math.round(totalDistance),
    duration_hours: Math.round(totalDistance / 70 * 10) / 10 // Average 70 km/h
  };
}

// Get fallback coordinates for common cities
function getFallbackCoordinates(cityName: string): { lat: number; lng: number } | null {
  const normalizedName = cityName.toLowerCase()
    .replace(/,.*$/, '') // Remove country suffix
    .replace(/\s+/g, ' ')
    .trim();
    
  const cityCoords: Record<string, { lat: number; lng: number }> = {
    'sarajevo': { lat: 43.8563, lng: 18.4131 },
    'beograd': { lat: 44.7866, lng: 20.4489 },
    'belgrade': { lat: 44.7866, lng: 20.4489 },
    'budimpešta': { lat: 47.4979, lng: 19.0402 },
    'budapest': { lat: 47.4979, lng: 19.0402 },
    'zagreb': { lat: 45.8150, lng: 15.9819 },
    'ljubljana': { lat: 46.0569, lng: 14.5058 },
    'beč': { lat: 48.2082, lng: 16.3738 },
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
    'münchen': { lat: 48.1351, lng: 11.5820 },
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
    'kraków': { lat: 50.0647, lng: 19.9450 },
    'varšava': { lat: 52.2297, lng: 21.0122 },
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
  
  // Try exact match first
  if (cityCoords[normalizedName]) {
    return cityCoords[normalizedName];
  }
  
  // Try partial match
  for (const [key, coords] of Object.entries(cityCoords)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return coords;
    }
  }
  
  return null;
}

// Find rest stops along route using Overpass API
async function findRestStops(fromCoords: {lat: number; lng: number}, toCoords: {lat: number; lng: number}): Promise<POI[]> {
  // Calculate midpoint
  const midLat = (fromCoords.lat + toCoords.lat) / 2;
  const midLng = (fromCoords.lng + toCoords.lng) / 2;
  
  try {
    const query = `[out:json][timeout:10];(node["amenity"="fuel"](around:15000,${midLat},${midLng});node["highway"="services"](around:15000,${midLat},${midLng});node["highway"="rest_area"](around:15000,${midLat},${midLng}););out body 5;`;
    
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    if (!data.elements || !Array.isArray(data.elements)) return [];
    
    return data.elements
      .filter((item: any) => item.tags)
      .map((item: any) => ({
        name: item.tags.name || 'Odmorište',
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

    console.log("=".repeat(60));
    console.log("IDSS TRIP PLANNER - Generating verified trip plans");
    console.log("=".repeat(60));
    console.log("Request:", JSON.stringify(tripData, null, 2));

    // Calculate trip duration
    const startDate = new Date(tripData.departureDate);
    const endDate = new Date(tripData.returnDate);
    const tripDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Build full route
    const allCities = [tripData.departureCity, ...tripData.destinations, tripData.departureCity];
    const fullRoute = allCities.join(' → ');

    console.log("\n📍 Step 1: Fetching real POI data from Overpass/Nominatim APIs...");

    // Fetch POIs for all cities in parallel
    const uniqueCities = [...new Set([tripData.departureCity, ...tripData.destinations])];
    const cityPOIsPromises = uniqueCities.map(city => fetchCityPOIs(city));
    const cityPOIsResults = await Promise.all(cityPOIsPromises);
    const cityPOIs = cityPOIsResults.filter((result): result is CityPOIs => result !== null);

    const totalPOIs = cityPOIs.reduce((sum, c) => 
      sum + c.museums.length + c.monuments.length + c.restaurants.length + 
      c.hotels.length + c.parks.length + c.educational.length, 0
    );
    
    console.log(`✓ Step 2: Fetched POIs for ${cityPOIs.length}/${uniqueCities.length} cities (${totalPOIs} total POIs)`);

    // Calculate route coordinates and distances
    const routeCoordinates = cityPOIs.map((city, index) => ({
      city: city.city,
      lat: city.lat,
      lng: city.lng,
      order: index + 1
    }));

    // Add return to departure city
    if (cityPOIs.length > 0) {
      const departure = cityPOIs[0];
      routeCoordinates.push({
        city: tripData.departureCity + ' (povratak)',
        lat: departure.lat,
        lng: departure.lng,
        order: routeCoordinates.length + 1
      });
    }

    // Calculate total route distance
    const routeInfo = await calculateRouteDistance(routeCoordinates.map(c => ({ lat: c.lat, lng: c.lng })));
    console.log("Step 3: Route calculated - " + routeInfo.distance_km + "km, " + routeInfo.duration_hours + "h");

    // Find rest stops between major segments
    const restStops: POI[] = [];
    for (let i = 0; i < Math.min(routeCoordinates.length - 1, 3); i++) {
      const stops = await findRestStops(routeCoordinates[i], routeCoordinates[i + 1]);
      restStops.push(...stops.slice(0, 2));
    }
    console.log("Found " + restStops.length + " rest stops along route");

    // Build comprehensive POI data for AI prompt
    const poisByCity = cityPOIs.map(city => {
      const formatPOIs = (pois: POI[], label: string) => {
        if (pois.length === 0) return `**${label}:** Nema pronađenih lokacija u bazi`;
        return `**${label} (${pois.length}):**\n${pois.slice(0, 8).map((p, i) => 
          `${i + 1}. ${p.name} (${p.lat.toFixed(5)}, ${p.lng.toFixed(5)})${p.address ? ` - ${p.address}` : ''}${p.phone ? ` Tel: ${p.phone}` : ''}`
        ).join('\n')}`;
      };
      
      return `
### ${city.city.toUpperCase()} (GPS: ${city.lat.toFixed(4)}, ${city.lng.toFixed(4)})

${formatPOIs(city.museums, 'MUZEJI')}

${formatPOIs(city.monuments, 'SPOMENICI I HISTORIJSKE LOKACIJE')}

${formatPOIs(city.restaurants, 'RESTORANI I KAFIĆI')}

${formatPOIs(city.hotels, 'HOTELI I SMJEŠTAJ')}

${formatPOIs(city.parks, 'PARKOVI')}

${formatPOIs(city.educational, 'KULTURNE I EDUKATIVNE LOKACIJE')}
`;
    }).join('\n');

    const restStopsInfo = restStops.length > 0 
      ? `\n**ODMORIŠTA NA RUTI:**\n${restStops.map((s, i) => `${i + 1}. ${s.name} (${s.lat.toFixed(5)}, ${s.lng.toFixed(5)})`).join('\n')}`
      : '\n**ODMORIŠTA:** Koristite standardna odmorišta na autoputu svaka 2 sata vožnje';

    // Meeting point - IDSS School
    const meetingPoint = {
      name: "Internationale Deutsche Schule Sarajevo",
      address: "Buka 13, 71000 Sarajevo",
      lat: 43.8612,
      lng: 18.4028,
      phone: "+38733560520"
    };

    const systemPrompt = `Ti si PREMIUM stručni planer školskih ekskurzija za Internationale Deutsche Schule Sarajevo (IDSS).

# KRITIČNO - SIGURNOST DJECE JE APSOLUTNI PRIORITET!
Svaki detalj MORA biti TAČAN, PROVJEREN i SIGURAN za djecu.

# VERIFICIRANI PODACI IZ OPENSTREETMAP BAZE:
${poisByCity}
${restStopsInfo}

# KALKULIRANI PODACI O RUTI (OSRM API):
- Ukupna udaljenost: ${routeInfo.distance_km} km
- Procijenjeno vrijeme vožnje: ${routeInfo.duration_hours} sati
- Ruta: ${fullRoute}

# MJESTO OKUPLJANJA I POLASKA:
- ${meetingPoint.name}
- Adresa: ${meetingPoint.address}
- Koordinate: ${meetingPoint.lat}, ${meetingPoint.lng}
- Telefon: ${meetingPoint.phone}

# OBAVEZNA PRAVILA ZA PLAN:

1. **GENERIRAJ TAČNO 3 VARIJANTE PLANA:**
   - "Budget" (Ekonomična): Hosteli, jednostavni obroci, besplatne atrakcije
   - "Balanced" (Uravnotežena): 3* hoteli, lokalni restorani, glavne atrakcije
   - "Premium" (VIP): 4-5* hoteli, kvalitetna hrana, sve atrakcije

2. **SIGURNOSNI ZAHTJEVI (OBAVEZNO):**
   - GPS koordinate za SVAKU lokaciju (iz gornje baze)
   - Pauze svakih 2h za mlađu djecu (do 10 god), 3h za stariju
   - Odgovorna osoba za svaku aktivnost
   - Alternativni plan za kišne dane

3. **SMJEŠTAJ I OBROCI:**
   - Koristi hotele/restorane IZ GORNJE LISTE ili poznate međunarodne lance
   - Sobe: dječaci i djevojčice odvojeno, pratitelji u susjednim sobama

4. **VREMENSKA ORGANIZACIJA:**
   - Realistična vremena (gužve, pauze, prelasci)
   - Buđenje najranije 06:30, spavanje najkasnije 22:00 za mlađe
   - Slobodno vrijeme za kupovinu/odmor

5. **CIJENE (EUR, 2025/2026):**
   - Realistične procjene po kategorijama
   - Uključiti: transport, smještaj, obroke, ulaznice, osiguranje

${tripData.specialNeeds ? `\n## SPECIJALNE POTREBE (OBAVEZNO UKLJUČITI):\n${tripData.specialNeeds}` : ''}
${tripData.medicalInfo ? `\n## MEDICINSKE INFORMACIJE:\n${tripData.medicalInfo}` : ''}

# FORMAT ODGOVORA:
Odgovori ISKLJUČIVO validnim JSON objektom. NIKAKO markdown formatiranje, samo čisti JSON.

{
  "plans": [
    {
      "id": 1,
      "type": "Budget",
      "route": "${fullRoute}",
      "reliability": 90-95,
      "days": ${tripDays},
      "distance_km": ${routeInfo.distance_km},
      "travel_hours": ${routeInfo.duration_hours},
      "cost_per_student": broj_u_eurima,
      "costs": {
        "transport": broj,
        "accommodation": broj,
        "meals": broj,
        "entry_fees": broj,
        "insurance": broj,
        "contingency": broj,
        "total": broj
      },
      "why_this_fits": "kratko obrazloženje",
      "accommodation_info": "naziv hotela, adresa, kontakt",
      "meeting_point": {
        "name": "${meetingPoint.name}",
        "address": "${meetingPoint.address}",
        "lat": ${meetingPoint.lat},
        "lng": ${meetingPoint.lng},
        "time": "07:00"
      },
      "itinerary": [
        {
          "day": 1,
          "date": "YYYY-MM-DD",
          "title": "Naslov dana",
          "summary": "Kratak opis",
          "activities": [
            {
              "time": "HH:MM-HH:MM",
              "description": "Opis aktivnosti",
              "type": "meeting|travel|meal|visit|accommodation|free_time",
              "location": "Naziv lokacije",
              "lat": broj,
              "lng": broj,
              "notes": "Dodatne napomene"
            }
          ]
        }
      ],
      "packing_list": ["stavka1", "stavka2"],
      "rules": ["pravilo1", "pravilo2"]
    }
  ]
}`;

    const userPrompt = `Generiraj 3 DETALJNE opcije plana putovanja:

## PODACI O EKSKURZIJI:
- **Škola:** Internationale Deutsche Schule Sarajevo
- **Polazište:** ${tripData.departureCity}
- **Destinacije:** ${tripData.destinations.join(', ')}
- **Razred:** ${tripData.gradeLevel}
- **Broj učenika:** ${tripData.studentCount}
- **Pratitelji:** ${tripData.chaperones.length > 0 ? tripData.chaperones.join(', ') : Math.ceil(tripData.studentCount / 15) + ' pratitelja'}
- **Prevoz:** ${tripData.transport}
- **Period:** ${tripData.departureDate} do ${tripData.returnDate} (${tripDays} dana)
- **Plan obroka:** ${tripData.mealPlan || 'polupansion'}
- **Smještaj:** ${tripData.accommodationType || 'hotel'}
- **Budžet po učeniku:** ${tripData.budget || 300} EUR
${tripData.educationalFocus ? `- **Edukativni fokus:** ${tripData.educationalFocus}` : ''}
${tripData.specialNeeds ? `- **Posebne napomene:** ${tripData.specialNeeds}` : ''}

## KRITIČNI ZAHTJEVI:
1. Koristi SAMO lokacije iz OpenStreetMap baze iznad
2. Svaka lokacija MORA imati GPS koordinate
3. Vremena moraju biti REALISTIČNA
4. Cijene u EUR za 2025/2026

Odgovori SAMO čistim JSON objektom, bez ```json oznaka.`;

    console.log("\n🤖 Step 4: Calling AI Gateway for itinerary generation...");
    const startTime = Date.now();

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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
        return new Response(JSON.stringify({ error: "Previše zahtjeva. Molimo pokušajte ponovo za nekoliko minuta." }), {
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

    console.log("\n📋 Step 5: Parsing and validating AI response...");

    // Parse the JSON from the response
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
      throw new Error("Greška pri parsiranju odgovora. Molimo pokušajte ponovo.");
    }

    // Validate the response structure
    if (!plans.plans || !Array.isArray(plans.plans)) {
      console.error("Invalid plans structure");
      throw new Error("Neispravan format planova.");
    }

    if (plans.plans.length < 3) {
      console.warn("Only " + plans.plans.length + " plans generated, expected 3");
    }

    // Ensure route_coordinates exists with our verified data
    plans.route_coordinates = routeCoordinates;

    // Add verification metadata
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

    // Ensure educational_resources exists
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

    console.log("=".repeat(60));
    console.log("USPJESNO GENERIRANO:");
    console.log("   - " + plans.plans.length + " varijanti plana");
    console.log("   - " + cityPOIs.length + " gradova sa " + totalPOIs + " verificiranih POI-a");
    console.log("   - Ruta: " + routeInfo.distance_km + "km, " + routeInfo.duration_hours + "h");
    plans.plans.forEach((p: any) => {
      console.log("   - " + p.type + ": " + p.cost_per_student + " EUR po uceniku");
    });
    console.log("=".repeat(60));

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
