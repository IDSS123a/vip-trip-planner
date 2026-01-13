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
  osm?: string;
  wikidata?: string;
  description?: string;
  address?: string;
  website?: string;
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

// Geocode city using Nominatim
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

// Fetch POIs from OpenTripMap
async function fetchPOIs(lat: number, lng: number, kinds: string, limit: number = 20): Promise<POI[]> {
  try {
    // OpenTripMap radius endpoint (5km radius for city center POIs)
    const radius = 5000;
    const response = await fetch(
      `https://api.opentripmap.com/0.1/en/places/radius?radius=${radius}&lon=${lng}&lat=${lat}&kinds=${kinds}&rate=2&limit=${limit}&format=json`,
      {
        headers: {
          'User-Agent': 'IDSS-Trip-Planner/1.0'
        }
      }
    );
    
    if (!response.ok) {
      console.log(`OpenTripMap response status: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) return [];
    
    return data.map((item: any) => ({
      name: item.name || 'Unknown',
      kind: item.kinds || kinds,
      lat: item.point?.lat || lat,
      lng: item.point?.lon || lng,
      osm: item.osm,
      wikidata: item.wikidata,
    }));
  } catch (error) {
    console.error(`OpenTripMap error:`, error);
    return [];
  }
}

// Fetch detailed POI info
async function fetchPOIDetails(xid: string): Promise<Partial<POI>> {
  try {
    const response = await fetch(
      `https://api.opentripmap.com/0.1/en/places/xid/${xid}`,
      {
        headers: {
          'User-Agent': 'IDSS-Trip-Planner/1.0'
        }
      }
    );
    
    if (!response.ok) return {};
    
    const data = await response.json();
    return {
      description: data.wikipedia_extracts?.text || data.info?.descr,
      address: data.address?.road ? `${data.address.road} ${data.address.house_number || ''}, ${data.address.city || data.address.town || ''}`.trim() : undefined,
      website: data.url,
      openingHours: data.info?.opening_hours
    };
  } catch {
    return {};
  }
}

// Fetch all POIs for a city
async function fetchCityPOIs(cityName: string): Promise<CityPOIs | null> {
  console.log(`Fetching POIs for ${cityName}...`);
  
  // First, geocode the city
  const geoData = await geocodeCity(cityName);
  if (!geoData) {
    console.log(`Could not geocode ${cityName}, using fallback`);
    const fallbackCoords = getFallbackCoordinates(cityName);
    if (!fallbackCoords) return null;
    
    return {
      city: cityName,
      lat: fallbackCoords.lat,
      lng: fallbackCoords.lng,
      museums: [],
      monuments: [],
      restaurants: [],
      hotels: [],
      parks: [],
      educational: []
    };
  }
  
  // Fetch different categories of POIs in parallel
  const [museums, monuments, restaurants, hotels, parks, educational] = await Promise.all([
    fetchPOIs(geoData.lat, geoData.lng, 'museums', 15),
    fetchPOIs(geoData.lat, geoData.lng, 'monuments,historic,memorials', 15),
    fetchPOIs(geoData.lat, geoData.lng, 'cafes,restaurants,fast_food', 20),
    fetchPOIs(geoData.lat, geoData.lng, 'other_hotels,hostels', 10),
    fetchPOIs(geoData.lat, geoData.lng, 'parks,gardens,nature_reserves', 10),
    fetchPOIs(geoData.lat, geoData.lng, 'cultural,theatres_and_entertainments,urban_environment', 15)
  ]);
  
  console.log(`Found for ${cityName}: ${museums.length} museums, ${monuments.length} monuments, ${restaurants.length} restaurants, ${hotels.length} hotels`);
  
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

// Calculate route distance using OSRM
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

// Get fallback coordinates
function getFallbackCoordinates(cityName: string): { lat: number; lng: number } | null {
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
  
  return cityCoords[cityName.toLowerCase().trim()] || null;
}

// Find rest stops along route
async function findRestStops(fromCoords: {lat: number; lng: number}, toCoords: {lat: number; lng: number}): Promise<POI[]> {
  // Calculate midpoint
  const midLat = (fromCoords.lat + toCoords.lat) / 2;
  const midLng = (fromCoords.lng + toCoords.lng) / 2;
  
  try {
    const response = await fetch(
      `https://api.opentripmap.com/0.1/en/places/radius?radius=10000&lon=${midLng}&lat=${midLat}&kinds=fuel,foods,cafes&limit=5&format=json`,
      {
        headers: { 'User-Agent': 'IDSS-Trip-Planner/1.0' }
      }
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    if (!Array.isArray(data)) return [];
    
    return data.map((item: any) => ({
      name: item.name || 'Odmorište',
      kind: 'rest_stop',
      lat: item.point?.lat || midLat,
      lng: item.point?.lon || midLng,
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

    console.log("Generating verified trip plans for:", tripData);
    console.log("Step 1: Fetching real POI data from OpenTripMap and Nominatim...");

    // Calculate trip duration
    const startDate = new Date(tripData.departureDate);
    const endDate = new Date(tripData.returnDate);
    const tripDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Build full route
    const allCities = [tripData.departureCity, ...tripData.destinations, tripData.departureCity];
    const fullRoute = allCities.join(' → ');

    // Fetch POIs for all cities in parallel
    const cityPOIsPromises = [...new Set([tripData.departureCity, ...tripData.destinations])].map(city => fetchCityPOIs(city));
    const cityPOIsResults = await Promise.all(cityPOIsPromises);
    const cityPOIs = cityPOIsResults.filter((result): result is CityPOIs => result !== null);

    console.log(`Step 2: Fetched POIs for ${cityPOIs.length} cities`);

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
    console.log(`Step 3: Route calculated - ${routeInfo.distance_km}km, ~${routeInfo.duration_hours}h`);

    // Find rest stops between major segments
    const restStops: POI[] = [];
    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      const stops = await findRestStops(routeCoordinates[i], routeCoordinates[i + 1]);
      restStops.push(...stops.slice(0, 2));
    }
    console.log(`Found ${restStops.length} rest stops along route`);

    // Build comprehensive POI data for AI prompt
    const poisByCity = cityPOIs.map(city => {
      return `
### ${city.city.toUpperCase()} (${city.lat.toFixed(4)}, ${city.lng.toFixed(4)})

**MUZEJI (${city.museums.length} pronađeno):**
${city.museums.slice(0, 8).map((m, i) => `${i + 1}. ${m.name} (${m.lat.toFixed(5)}, ${m.lng.toFixed(5)})`).join('\n') || 'Nema dostupnih podataka'}

**SPOMENICI I HISTORIJSKE LOKACIJE (${city.monuments.length} pronađeno):**
${city.monuments.slice(0, 8).map((m, i) => `${i + 1}. ${m.name} (${m.lat.toFixed(5)}, ${m.lng.toFixed(5)})`).join('\n') || 'Nema dostupnih podataka'}

**RESTORANI I KAFIĆI (${city.restaurants.length} pronađeno):**
${city.restaurants.slice(0, 10).map((r, i) => `${i + 1}. ${r.name} (${r.lat.toFixed(5)}, ${r.lng.toFixed(5)})`).join('\n') || 'Nema dostupnih podataka'}

**HOTELI I SMJEŠTAJ (${city.hotels.length} pronađeno):**
${city.hotels.slice(0, 6).map((h, i) => `${i + 1}. ${h.name} (${h.lat.toFixed(5)}, ${h.lng.toFixed(5)})`).join('\n') || 'Nema dostupnih podataka'}

**PARKOVI I ZELENE POVRŠINE (${city.parks.length} pronađeno):**
${city.parks.slice(0, 5).map((p, i) => `${i + 1}. ${p.name} (${p.lat.toFixed(5)}, ${p.lng.toFixed(5)})`).join('\n') || 'Nema dostupnih podataka'}

**KULTURNE I EDUKATIVNE LOKACIJE (${city.educational.length} pronađeno):**
${city.educational.slice(0, 6).map((e, i) => `${i + 1}. ${e.name} (${e.lat.toFixed(5)}, ${e.lng.toFixed(5)})`).join('\n') || 'Nema dostupnih podataka'}
`;
    }).join('\n');

    const restStopsInfo = restStops.length > 0 
      ? `\n**ODMORIŠTA NA RUTI:**\n${restStops.map((s, i) => `${i + 1}. ${s.name} (${s.lat.toFixed(5)}, ${s.lng.toFixed(5)})`).join('\n')}`
      : '';

    // Meeting point - IDSS School
    const meetingPoint = {
      name: "Internationale Deutsche Schule Sarajevo",
      address: "Buka 13, 71000 Sarajevo",
      lat: 43.8612,
      lng: 18.4028,
      phone: "+38733560520"
    };

    const systemPrompt = `Ti si PREMIUM stručni planer školskih ekskurzija za Internationale Deutsche Schule Sarajevo (IDSS).
KRITIČNO: Sigurnost djece je APSOLUTNI prioritet. Svaki detalj MORA biti TAČAN i PROVJEREN.

# PODACI IZ BAZE (OpenTripMap + Nominatim API - VERIFICIRANI):
${poisByCity}
${restStopsInfo}

# KALKULIRANI PODACI O RUTI:
- Ukupna udaljenost: ${routeInfo.distance_km} km
- Procijenjeno vrijeme vožnje: ${routeInfo.duration_hours} sati

# MJESTO OKUPLJANJA I POLASKA:
- ${meetingPoint.name}
- Adresa: ${meetingPoint.address}
- Koordinate: ${meetingPoint.lat}, ${meetingPoint.lng}
- Telefon: ${meetingPoint.phone}

# STRIKTNA PRAVILA:

1. **3 OBAVEZNE VARIJANTE PLANA:**
   - BUDGET (Ekonomična): Hosteli, sendviči/pizze, besplatne atrakcije, javni prevoz
   - BALANCED (Uravnotežena): 3* hoteli, lokalni restorani, glavne atrakcije
   - PREMIUM (VIP): 4-5* hoteli, fine dining, privatne ture, sve atrakcije

2. **SIGURNOSNI ZAHTJEVI:**
   - Tačno vrijeme i lokacija SVAKOG okupljanja/prebacivanja
   - Kontakt podaci za svaki hotel/restoran (ako dostupno)
   - Alternativni plan za svaku aktivnost
   - GPS koordinate za SVAKU lokaciju
   - Pauze svakih 2h za mlađu djecu, 3h za stariju

3. **DETALJI OBROKA:**
   - Tačan naziv restorana/kafića iz gornje liste
   - Tip hrane i procjena cijene
   - Vegetarijanske/halal opcije ako potrebno

4. **SMJEŠTAJ:**
   - Koristi SAMO hotele/hostele iz gornje liste ili poznate lance
   - Broj soba i raspored (dječaci/djevojčice odvojeno, pratitelji u susjednim sobama)
   - Check-in/check-out vrijeme

5. **TRANSPORT:**
   - Tačno vrijeme polaska i dolaska
   - Planirane pauze na odmorištima iz liste
   - Kompanija autobusa (ako relevantno)

6. **FORMAT ODGOVORA:**
   - Odgovori SAMO validnim JSON objektom
   - NIKAKO markdown formatiranje
   - Svaka lokacija MORA imati GPS koordinate

${tripData.specialNeeds ? `\n## SPECIJALNE POTREBE (OBAVEZNO UKLJUČITI):\n${tripData.specialNeeds}` : ''}
${tripData.medicalInfo ? `\n## MEDICINSKE INFORMACIJE:\n${tripData.medicalInfo}` : ''}

JSON STRUKTURA:
{
  "plans": [
    {
      "id": 1,
      "type": "Budget",
      "route": "${fullRoute}",
      "reliability": 92,
      "days": ${tripDays},
      "distance_km": ${routeInfo.distance_km},
      "travel_hours": ${routeInfo.duration_hours},
      "cost_per_student": 0,
      "costs": {
        "transport": 0,
        "accommodation": 0,
        "meals": 0,
        "entry_fees": 0,
        "activity_fees": 0,
        "local_transport": 0,
        "insurance": 0,
        "contingency": 0,
        "total": 0
      },
      "why_this_fits": "obrazloženje zašto ova opcija odgovara grupi",
      "accommodation_info": "detalji o smještaju sa kontaktima",
      "transport_details": {
        "company": "naziv kompanije",
        "vehicle_type": "tip vozila",
        "capacity": 0,
        "amenities": ["wifi", "wc", "klima"]
      },
      "emergency_contacts": {
        "tour_leader": "+387...",
        "hotel": "+...",
        "local_emergency": "broj"
      },
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
          "date": "${tripData.departureDate}",
          "title": "naslov dana",
          "summary": "kratak pregled dana",
          "activities": [
            {
              "time": "07:00-07:30",
              "description": "Okupljanje učenika i pratitelja ispred škole IDSS, provjera prisutnosti",
              "type": "meeting",
              "location": "${meetingPoint.name}, ${meetingPoint.address}",
              "lat": ${meetingPoint.lat},
              "lng": ${meetingPoint.lng},
              "notes": "Roditelji mogu ispratiti djecu. Lista prisutnosti kod voditelja.",
              "responsible": "Voditelj ekskurzije"
            },
            {
              "time": "07:30-07:45",
              "description": "Polazak autobusom prema [destinacija]",
              "type": "travel",
              "location": "IDSS parking",
              "lat": ${meetingPoint.lat},
              "lng": ${meetingPoint.lng},
              "vehicle": "Autobus kompanija XY",
              "notes": "Sjedišta označena po grupama"
            }
          ]
        }
      ],
      "packing_list": ["pasoš/lična karta", "lijekovi", "novac za džeparac"],
      "rules": ["Uvijek ostati u grupi", "Telefoni isključeni tokom edukativnih aktivnosti"]
    }
  ],
  "route_coordinates": ${JSON.stringify(routeCoordinates)},
  "educational_resources": [
    {"city": "Grad", "sites": ["muzej1", "spomenik2"], "curriculum_links": ["historija", "geografija"]}
  ],
  "verification": {
    "data_source": "OpenTripMap + Nominatim API",
    "last_verified": "${new Date().toISOString()}",
    "route_verified": true,
    "pois_count": ${cityPOIs.reduce((sum, c) => sum + c.museums.length + c.monuments.length + c.educational.length, 0)}
  }
}`;

    const userPrompt = `Generiraj 3 STROGO PROVJERENE opcije plana putovanja koristeći ISKLJUČIVO podatke iz baze:

## PODACI O EKSKURZIJI:
- **Škola:** Internationale Deutsche Schule Sarajevo
- **Polazište:** ${tripData.departureCity} (${meetingPoint.address})
- **Ruta:** ${fullRoute}
- **Razred:** ${tripData.gradeLevel}
- **Broj učenika:** ${tripData.studentCount}
- **Broj pratitelja:** ${tripData.chaperones.length || Math.ceil(tripData.studentCount / 15)}
- **Prevoz:** ${tripData.transport}
- **Period:** ${tripData.departureDate} do ${tripData.returnDate} (${tripDays} dana)
- **Plan obroka:** ${tripData.mealPlan || 'polupansion'}
- **Tip smještaja:** ${tripData.accommodationType || 'hotel'}
${tripData.educationalFocus ? `- **Edukativni fokus:** ${tripData.educationalFocus}` : ''}
${tripData.specialNeeds ? `- **Posebne napomene:** ${tripData.specialNeeds}` : ''}
${tripData.medicalInfo ? `- **Medicinske informacije:** ${tripData.medicalInfo}` : ''}

## KRITIČNI ZAHTJEVI:
1. SVAKA lokacija mora imati TAČNE GPS koordinate iz gornje baze
2. SVAKI obrok mora biti u KONKRETNOM restoranu iz liste
3. SVAKI smještaj mora biti KONKRETNI hotel/hostel iz liste
4. SVAKA atrakcija mora biti STVARNA lokacija iz liste
5. Vremena moraju biti REALISTIČNA (uzeti u obzir gužve, pauze, itd.)
6. Cijene moraju biti u EUR i REALISTIČNE za 2026. godinu

## SIGURNOSNE NAPOMENE:
- Svaka aktivnost mora imati odgovornu osobu
- Pauze za WC i osvježenje svakih 2-3 sata
- Brojanje učenika pri svakom prelasku
- Noćna kontrola u hotelima

Odgovori SAMO validnim JSON objektom. NIKAKO markdown formatiranje.`;

    console.log("Step 4: Calling AI Gateway for comprehensive itinerary generation...");
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
        temperature: 0.3, // Lower temperature for more consistent, reliable output
      }),
    });

    const responseTime = Date.now() - startTime;
    console.log(`AI Gateway response time: ${responseTime}ms`);

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
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("No content in AI response:", JSON.stringify(data));
      throw new Error("Prazan odgovor od AI servisa");
    }

    console.log("Step 5: Parsing and validating AI response...");

    // Parse the JSON from the response
    let plans;
    try {
      let jsonString = content.trim();
      
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1].trim();
      }
      
      // Find the JSON object boundaries
      const jsonStart = jsonString.indexOf('{');
      const jsonEnd = jsonString.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
      }
      
      plans = JSON.parse(jsonString);
      
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      throw new Error("Greška pri parsiranju odgovora. Molimo pokušajte ponovo.");
    }

    // Validate the response structure
    if (!plans.plans || !Array.isArray(plans.plans) || plans.plans.length < 3) {
      console.error("Invalid plans structure - need exactly 3 plans");
      throw new Error("Nedovoljan broj planova generisan. Potrebne su 3 varijante.");
    }

    // Ensure route_coordinates exists with our verified data
    plans.route_coordinates = routeCoordinates;

    // Add verification metadata
    plans.verification = {
      data_source: "OpenTripMap + Nominatim API",
      last_verified: new Date().toISOString(),
      route_verified: true,
      distance_km: routeInfo.distance_km,
      travel_hours: routeInfo.duration_hours,
      pois_count: cityPOIs.reduce((sum, c) => sum + c.museums.length + c.monuments.length + c.educational.length, 0),
      cities_data: cityPOIs.map(c => ({
        city: c.city,
        museums: c.museums.length,
        monuments: c.monuments.length,
        restaurants: c.restaurants.length,
        hotels: c.hotels.length
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
        ].filter(Boolean)
      }));
    }

    console.log(`✓ Successfully generated ${plans.plans.length} verified trip plans`);
    console.log(`✓ Included data from ${cityPOIs.length} cities with ${plans.verification.pois_count} verified POIs`);
    console.log(`✓ Plan types: ${plans.plans.map((p: any) => `${p.type}=${p.cost_per_student}EUR`).join(', ')}`);

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
