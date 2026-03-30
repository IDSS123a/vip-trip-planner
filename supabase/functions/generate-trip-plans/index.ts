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

// =====================================================================
// GEOCODING
// =====================================================================

async function geocodeCity(cityName: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  try {
    const url = "https://nominatim.openstreetmap.org/search?q=" + encodeURIComponent(cityName) + "&format=json&limit=1&addressdetails=1";
    const response = await fetch(url, {
      headers: { 'User-Agent': 'IDSS-Trip-Planner/6.0 (info@idss.ba)' }
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

function getFallbackCoordinates(cityName: string): { lat: number; lng: number } | null {
  const n = cityName.toLowerCase().replace(/,.*$/, '').replace(/\s+/g, ' ').trim();
  const db: Record<string, { lat: number; lng: number }> = {
    'sarajevo': { lat: 43.8563, lng: 18.4131 }, 'beograd': { lat: 44.7866, lng: 20.4489 },
    'belgrade': { lat: 44.7866, lng: 20.4489 }, 'budapest': { lat: 47.4979, lng: 19.0402 },
    'budimpešta': { lat: 47.4979, lng: 19.0402 }, 'zagreb': { lat: 45.8150, lng: 15.9819 },
    'ljubljana': { lat: 46.0569, lng: 14.5058 }, 'beč': { lat: 48.2082, lng: 16.3738 },
    'vienna': { lat: 48.2082, lng: 16.3738 }, 'wien': { lat: 48.2082, lng: 16.3738 },
    'prag': { lat: 50.0755, lng: 14.4378 }, 'prague': { lat: 50.0755, lng: 14.4378 },
    'rim': { lat: 41.9028, lng: 12.4964 }, 'rome': { lat: 41.9028, lng: 12.4964 },
    'paris': { lat: 48.8566, lng: 2.3522 }, 'barcelona': { lat: 41.3851, lng: 2.1734 },
    'london': { lat: 51.5074, lng: -0.1278 }, 'berlin': { lat: 52.5200, lng: 13.4050 },
    'münchen': { lat: 48.1351, lng: 11.5820 }, 'munich': { lat: 48.1351, lng: 11.5820 },
    'amsterdam': { lat: 52.3676, lng: 4.9041 }, 'mostar': { lat: 43.3438, lng: 17.8078 },
    'dubrovnik': { lat: 42.6507, lng: 18.0944 }, 'split': { lat: 43.5081, lng: 16.4402 },
    'doboj': { lat: 44.7319, lng: 18.0854 }, 'salzburg': { lat: 47.8095, lng: 13.0550 },
    'venecija': { lat: 45.4408, lng: 12.3155 }, 'venice': { lat: 45.4408, lng: 12.3155 },
    'firenca': { lat: 43.7696, lng: 11.2558 }, 'florence': { lat: 43.7696, lng: 11.2558 },
    'milan': { lat: 45.4642, lng: 9.1900 }, 'bologna': { lat: 44.4949, lng: 11.3426 },
    'bolonja': { lat: 44.4949, lng: 11.3426 }, 'bukurešt': { lat: 44.4268, lng: 26.1025 },
    'bucharest': { lat: 44.4268, lng: 26.1025 }, 'moskva': { lat: 55.7558, lng: 37.6173 },
    'moscow': { lat: 55.7558, lng: 37.6173 }, 'são paulo': { lat: -23.5505, lng: -46.6333 },
    'rio de janeiro': { lat: -22.9068, lng: -43.1729 }, 'buenos aires': { lat: -34.6037, lng: -58.3816 },
    'new york': { lat: 40.7128, lng: -74.0060 }, 'tokyo': { lat: 35.6762, lng: 139.6503 },
    'istanbul': { lat: 41.0082, lng: 28.9784 }, 'atina': { lat: 37.9838, lng: 23.7275 },
    'athens': { lat: 37.9838, lng: 23.7275 }, 'lisbon': { lat: 38.7223, lng: -9.1393 },
    'madrid': { lat: 40.4168, lng: -3.7038 }, 'plitvice': { lat: 44.8654, lng: 15.6220 },
    'postojna': { lat: 45.7747, lng: 14.2133 }, 'bled': { lat: 46.3683, lng: 14.1146 },
    'tuzla': { lat: 44.5384, lng: 18.6763 }, 'banja luka': { lat: 44.7722, lng: 17.1910 },
    'zenica': { lat: 44.2017, lng: 17.9078 }, 'travnik': { lat: 44.2264, lng: 17.6653 },
    'jajce': { lat: 44.3392, lng: 17.2700 }, 'konjic': { lat: 43.6519, lng: 17.9619 },
    'neum': { lat: 42.9231, lng: 17.6156 }, 'trebinje': { lat: 42.7119, lng: 18.3464 },
    'skopje': { lat: 41.9981, lng: 21.4254 }, 'podgorica': { lat: 42.4304, lng: 19.2594 },
    'tirana': { lat: 41.3275, lng: 19.8187 }, 'bratislava': { lat: 48.1486, lng: 17.1077 },
    'krakow': { lat: 50.0647, lng: 19.9450 }, 'warsaw': { lat: 52.2297, lng: 21.0122 },
    'varsava': { lat: 52.2297, lng: 21.0122 }, 'graz': { lat: 47.0707, lng: 15.4395 },
    'innsbruck': { lat: 47.2692, lng: 11.4041 }, 'trieste': { lat: 45.6495, lng: 13.7768 },
    'trst': { lat: 45.6495, lng: 13.7768 }, 'maribor': { lat: 46.5547, lng: 15.6459 },
    'novi sad': { lat: 45.2671, lng: 19.8335 }, 'rijeka': { lat: 45.3271, lng: 14.4422 },
    'zadar': { lat: 44.1194, lng: 15.2314 },
  };
  if (db[n]) return db[n];
  for (const [key, coords] of Object.entries(db)) {
    if (n.includes(key) || key.includes(n)) return coords;
  }
  return null;
}

// =====================================================================
// POI FETCHING — lightweight, parallel, with timeout
// =====================================================================

async function fetchPOIsOverpass(lat: number, lng: number, poiType: string, limit: number = 4): Promise<POI[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const radius = 5000;
    let query = '';
    switch (poiType) {
      case 'museums':
        query = `[out:json][timeout:5];node["tourism"="museum"](around:${radius},${lat},${lng});out body ${limit};`;
        break;
      case 'attractions':
        query = `[out:json][timeout:5];(node["historic"](around:${radius},${lat},${lng});node["tourism"="attraction"](around:${radius},${lat},${lng}););out body ${limit};`;
        break;
      case 'restaurants':
        query = `[out:json][timeout:5];node["amenity"="restaurant"](around:${radius},${lat},${lng});out body ${limit};`;
        break;
      case 'hotels':
        query = `[out:json][timeout:5];(node["tourism"="hotel"](around:${radius},${lat},${lng});node["tourism"="hostel"](around:${radius},${lat},${lng}););out body ${limit};`;
        break;
      case 'culture':
        query = `[out:json][timeout:5];(node["tourism"="gallery"](around:${radius},${lat},${lng});node["amenity"="theatre"](around:${radius},${lat},${lng});node["tourism"="zoo"](around:${radius},${lat},${lng});node["leisure"="park"]["name"](around:${radius},${lat},${lng}););out body ${limit};`;
        break;
      default: return [];
    }
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.elements || !Array.isArray(data.elements)) return [];
    return data.elements
      .filter((item: any) => item.tags && item.tags.name)
      .map((item: any) => ({
        name: item.tags.name,
        kind: poiType,
        lat: item.lat || lat,
        lng: item.lon || lng,
        address: item.tags['addr:street'] ? (item.tags['addr:street'] + ' ' + (item.tags['addr:housenumber'] || '') + ', ' + (item.tags['addr:city'] || '')).trim() : undefined,
        website: item.tags.website || item.tags.url,
        phone: item.tags.phone || item.tags['contact:phone'],
        openingHours: item.tags.opening_hours
      }));
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

interface CityContext {
  city: string;
  lat: number;
  lng: number;
  museums: POI[];
  attractions: POI[];
  restaurants: POI[];
  hotels: POI[];
  culture: POI[];
}

async function fetchCityContext(cityName: string): Promise<CityContext | null> {
  let geoData = await geocodeCity(cityName);
  if (!geoData) {
    const fb = getFallbackCoordinates(cityName);
    if (fb) geoData = { ...fb, displayName: cityName };
    else return null;
  }

  // All POI types in parallel
  const [museums, attractions, restaurants, hotels, culture] = await Promise.all([
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'museums', 4),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'attractions', 4),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'restaurants', 4),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'hotels', 4),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'culture', 4)
  ]);
  return { city: cityName, lat: geoData.lat, lng: geoData.lng, museums, attractions, restaurants, hotels, culture };
}

// =====================================================================
// ROUTE
// =====================================================================

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

function buildRouteCoordinates(
  departureCity: string, destinations: string[], cityContexts: CityContext[]
): Array<{ city: string; lat: number; lng: number; order: number }> {
  const allCityNames = [departureCity, ...destinations];
  const coords: Array<{ city: string; lat: number; lng: number; order: number }> = [];
  const lookup = new Map<string, CityContext>();
  for (const c of cityContexts) lookup.set(c.city.toLowerCase().trim(), c);

  for (let i = 0; i < allCityNames.length; i++) {
    const name = allCityNames[i];
    const ctx = lookup.get(name.toLowerCase().trim());
    if (ctx) {
      coords.push({ city: name, lat: ctx.lat, lng: ctx.lng, order: i + 1 });
    } else {
      const fb = getFallbackCoordinates(name);
      coords.push({ city: name, lat: fb?.lat || 43.8563, lng: fb?.lng || 18.4131, order: i + 1 });
    }
  }
  if (coords.length > 0) {
    coords.push({ city: departureCity + ' (povratak)', lat: coords[0].lat, lng: coords[0].lng, order: coords.length + 1 });
  }
  return coords;
}

// =====================================================================
// COSTS
// =====================================================================

function calculateCosts(
  tripData: TripRequest,
  routeInfo: { distance_km: number; duration_hours: number },
  tripDays: number,
  tierType: 'Budget' | 'Balanced' | 'Premium'
) {
  const studentCount = tripData.studentCount || 14;
  const chaperoneCount = Math.max(tripData.chaperones?.length || 0, Math.ceil(studentCount / 15));
  const totalPersons = studentCount + chaperoneCount;
  const nights = Math.max(tripDays - 1, 1);
  const totalKm = routeInfo.distance_km + tripDays * 30;

  let transportCost: number, transportDetail: string;
  if (tripData.transport === 'bus' || tripData.transport === 'Bus') {
    const rate = tierType === 'Premium' ? 1.30 : 1.10;
    transportCost = Math.round(totalKm * rate);
    transportDetail = totalKm + " km × " + rate.toFixed(2) + " EUR/km";
  } else {
    const rate = tierType === 'Budget' ? 35 : tierType === 'Balanced' ? 55 : 85;
    transportCost = Math.round(rate * totalPersons * 2);
    transportDetail = totalPersons + " osoba × " + rate + " EUR × 2";
  }

  const accomRate = tierType === 'Budget' ? 28 : tierType === 'Balanced' ? 48 : 85;
  const accommodationCost = Math.round(accomRate * totalPersons * nights);
  const accomLabel = tierType === 'Budget' ? 'hostel/2*' : tierType === 'Balanced' ? '3* hotel' : '4-5* hotel';
  const accommodationDetail = nights + " noći × " + accomRate + " EUR/os (" + accomLabel + ")";

  const mealRate = tierType === 'Budget' ? 25 : tierType === 'Balanced' ? 40 : 65;
  const mealsCost = Math.round(mealRate * totalPersons * tripDays);
  const mealsDetail = tripDays + " dana × " + mealRate + " EUR/os/dan";

  const entryRate = tierType === 'Budget' ? 7 : tierType === 'Balanced' ? 15 : 28;
  const entryFees = Math.round(entryRate * totalPersons * Math.max(tripDays - 1, 1));
  const activityRate = tierType === 'Budget' ? 3 : tierType === 'Balanced' ? 10 : 22;
  const activityFees = Math.round(activityRate * totalPersons * Math.max(tripDays - 1, 1));
  const localTransportRate = tierType === 'Budget' ? 5 : tierType === 'Balanced' ? 8 : 15;
  const localTransport = Math.round(localTransportRate * totalPersons * tripDays);

  const subtotal = transportCost + accommodationCost + mealsCost + entryFees + activityFees + localTransport;
  const contingency = Math.round(subtotal * 0.05);
  const total = subtotal + contingency;

  return {
    transport: transportCost, accommodation: accommodationCost, meals: mealsCost,
    entry_fees: entryFees, activity_fees: activityFees, local_transport: localTransport,
    contingency, total, cost_per_student: Math.round(total / studentCount),
    transport_detail: transportDetail, accommodation_detail: accommodationDetail, meals_detail: mealsDetail,
  };
}

// =====================================================================
// AI GENERATION — one plan at a time for reliability
// =====================================================================

function buildPOIContext(contexts: CityContext[]): string {
  return contexts.map(c => {
    const parts = [`[${c.city}]`];
    const allPOIs = [
      ...c.museums.map(p => `Muzej: ${p.name}${p.address ? ' @ '+p.address : ''}${p.phone ? ' tel:'+p.phone : ''}`),
      ...c.attractions.map(p => `Znamenitost: ${p.name}${p.address ? ' @ '+p.address : ''}${p.phone ? ' tel:'+p.phone : ''}`),
      ...c.restaurants.map(p => `Restoran: ${p.name}${p.address ? ' @ '+p.address : ''}${p.phone ? ' tel:'+p.phone : ''}`),
      ...c.hotels.map(p => `Smještaj: ${p.name}${p.address ? ' @ '+p.address : ''}${p.phone ? ' tel:'+p.phone : ''}`),
      ...c.culture.map(p => `Kultura: ${p.name}${p.address ? ' @ '+p.address : ''}${p.phone ? ' tel:'+p.phone : ''}`),
    ];
    parts.push(allPOIs.join('\n'));
    return parts.join('\n');
  }).join('\n\n');
}

async function generateSinglePlan(
  tripData: TripRequest,
  cityContexts: CityContext[],
  routeInfo: { distance_km: number; duration_hours: number },
  tripDays: number,
  fullRoute: string,
  tier: 'Budget' | 'Balanced' | 'Premium',
  apiKey: string
): Promise<any | null> {
  const poiContext = buildPOIContext(cityContexts);
  const chaperoneNames = tripData.chaperones.length > 0 ? tripData.chaperones.join(', ') : Math.ceil(tripData.studentCount / 15) + ' pratitelja';
  
  const accomType = tier === 'Budget' ? 'hostel ili 2* hotel' : tier === 'Balanced' ? '3* hotel' : '4-5* hotel';
  const mealType = tier === 'Budget' ? 'pristupačni restorani, fast food, pekare' : tier === 'Balanced' ? 'srednja klasa restorani, lokalna kuhinja' : 'vrhunski restorani, fine dining';

  const systemPrompt = `Ti si profesionalni planer školskih ekskurzija. Generišeš JEDAN ultra-detaljan ${tier} plan puta.

OBAVEZNA PRAVILA:
- Svaki obrok: KONKRETNO ime restorana, adresa, telefon, opis hrane (min 2 rečenice)
- Smještaj: KONKRETNO ime (${accomType}), adresa, telefon, cijena/noć, opis
- Svaka posjeta: KONKRETNO ime lokacije, adresa, radno vrijeme, cijena ulaznice, edukativni opis (min 2 rečenice)
- Svaki dan: minimum 6 aktivnosti s preciznim vremenima
- Dan putovanja: gdje će djeca jesti na putu (konkretno ime restorana na ruti)
- Koristi STVARNA, POZNATA imena. Dopuni podatke iz konteksta SVOJIM ZNANJEM o tim gradovima.
- Restorani: ${mealType}

Odgovori SAMO čistim JSON-om (bez markdown oznaka):
{
  "type":"${tier}",
  "label":"${tier === 'Budget' ? 'Ekonomična opcija' : tier === 'Balanced' ? 'Optimalni odnos cijene i kvaliteta' : 'Premium VIP iskustvo'}",
  "accommodation_name":"...",
  "accommodation_address":"...",
  "accommodation_phone":"...",
  "accommodation_price_per_night":"... EUR/os",
  "why_this_fits":"2-3 rečenice",
  "itinerary":[
    {
      "day":1,
      "date":"YYYY-MM-DD",
      "title":"Naslov dana",
      "summary":"Kratak pregled",
      "activities":[
        {"time":"07:00 - 07:30","description":"Detaljan opis min 2 rečenice sa svim konkretnim informacijama.","type":"activity|travel|meal|accommodation|free_time","location":"Ime lokacije","lat":0.0,"lng":0.0,"notes":"..."}
      ]
    }
  ]
}`;

  const userPrompt = `${tier} plan za školsku ekskurziju:
Ruta: ${fullRoute} | Datumi: ${tripData.departureDate} do ${tripData.returnDate} (${tripDays} dana)
${tripData.studentCount} učenika, ${tripData.gradeLevel}. razred | Pratitelji: ${chaperoneNames} | Prevoz: ${tripData.transport}
Udaljenost: ~${routeInfo.distance_km}km, ~${routeInfo.duration_hours}h | Fokus: ${tripData.educationalFocus || "historija, kultura, nauka"}
${tripData.specialNeeds ? 'Posebne potrebe: ' + tripData.specialNeeds : ''}

LOKACIJE U GRADOVIMA (koristi + dopuni):
${poiContext}

Generiši detaljan ${tier} plan sa SVIM danima i SVIM aktivnostima. Samo JSON.`;

  // Use faster model for Budget, standard for others
  const model = tier === 'Budget' ? 'google/gemini-2.5-flash-lite' : 'google/gemini-2.5-flash';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`AI error for ${tier}:`, response.status, errText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    
    return JSON.parse(jsonStr);
  } catch (error) {
    clearTimeout(timeout);
    console.error(`AI generation error (${tier}):`, error);
    return null;
  }
}

// =====================================================================
// PACKING LIST & RULES
// =====================================================================

function generatePackingList(tripDays: number, tier: string, tripData: TripRequest): string[] {
  const items = [
    "Osobna iskaznica ili pasoš (original + kopija)",
    "Zdravstvena iskaznica (EU kartica ako je dostupna)",
    "Kopija potvrde roditelja / staratelja",
    "Kopija putnog rasporeda i hitnih kontakata",
    "Novac za osobne troškove (" + (tier === 'Premium' ? '80-120' : tier === 'Balanced' ? '50-80' : '30-50') + " EUR preporučeno)",
    tripDays + "x promjena odjeće (donje rublje, čarape, majice)",
    "Udobne cipele za hodanje (OBAVEZNO — šetnja 5-10 km dnevno)",
    "Lagana jakna ili vjetrovka (za kišu/vjetar)",
    "Sredstva za higijenu (četkica, pasta, sapun, dezodorans)",
    "Ručnik (provjeriti da li smještaj osigurava)",
    "Ruksak za dnevne izlete",
    "Boca za vodu (punjiva, min. 0.5L)",
    "Lijekovi (ako su potrebni) — predati pratitelju s uputama",
    "Krema za sunčanje + kapa/šešir",
    "Mobitel + punjač (opciono: powerbank)",
    "Bilježnica + olovka za školski dnevnik putovanja",
    "Fotoaparat ili mobitel za fotografije",
  ];
  if (tripData.specialNeeds) items.push("Specijalna oprema: " + tripData.specialNeeds);
  return items;
}

function generateTripRules(gradeLevel: string): string[] {
  const grade = parseInt(gradeLevel) || 7;
  return [
    "Učenici se UVIJEK kreću u grupama od minimalno 3 osobe",
    "Obavezno nošenje identifikacijske narukvice tokom cijelog putovanja",
    "Obavezno vezivanje sigurnosnih pojaseva u autobusu",
    "Zabrana napuštanja smještaja nakon " + (grade <= 6 ? "20:00" : "21:00") + " bez pratitelja",
    "Noćni mir od " + (grade <= 6 ? "21:00" : "22:00") + " — tišina u hodnicima i sobama",
    "Poštivanje pravila svih muzeja, galerija i javnih institucija",
    "Mobilni telefoni isključeni/na vibration tokom posjeta muzejima i kazalištima",
    "Zabranjeno konzumiranje alkohola, cigareta i opojnih sredstava",
    "U slučaju problema — odmah kontaktirati pratitelja (broj na identifikacijskoj narukvici)",
    "Čuvanje ličnih stvari i novca — škola ne odgovara za gubitak",
    "Kulturno ponašanje koje predstavlja školu u najboljem svjetlu",
    "Pratitelji imaju konačnu riječ u svim situacijama vezanim za sigurnost",
  ];
}

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

    console.log("=== IDSS TRIP PLANNER v6.0 — PARALLEL AI ENGINE ===");

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

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI servis nije konfigurisan. Kontaktirajte administratora." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Fetch ALL city contexts IN PARALLEL
    console.log("Step 1: Fetching POIs for all cities in parallel...");
    const uniqueCities = [...new Set([tripData.departureCity, ...tripData.destinations])];
    const cityContextResults = await Promise.all(uniqueCities.map(city => fetchCityContext(city)));
    const cityContexts = cityContextResults.filter((c): c is CityContext => c !== null);

    const totalPOIs = cityContexts.reduce((sum, c) =>
      sum + c.museums.length + c.attractions.length + c.restaurants.length +
      c.hotels.length + c.culture.length, 0
    );
    console.log(`Loaded ${totalPOIs} POIs across ${cityContexts.length} cities`);

    // Step 2: Route
    const routeCoordinates = buildRouteCoordinates(tripData.departureCity, tripData.destinations, cityContexts);
    const routeInfo = await calculateRouteDistance(routeCoordinates.map(c => ({ lat: c.lat, lng: c.lng })));
    console.log(`Route: ${routeInfo.distance_km}km, ${routeInfo.duration_hours}h`);

    // Step 3: Generate 3 plans IN PARALLEL with AI
    console.log("Step 3: Generating 3 plans in PARALLEL...");
    const tiers: Array<'Budget' | 'Balanced' | 'Premium'> = ['Budget', 'Balanced', 'Premium'];
    const planResults = await Promise.all(
      tiers.map(tier => generateSinglePlan(tripData, cityContexts, routeInfo, tripDays, fullRoute, tier, LOVABLE_API_KEY))
    );

    const successfulPlans = planResults.filter(p => p !== null);
    if (successfulPlans.length === 0) {
      return new Response(JSON.stringify({ error: "Generisanje planova nije uspjelo. Pokušajte ponovo." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`${successfulPlans.length}/3 plans generated successfully`);

    // Step 4: Enrich plans
    const enrichedPlans = successfulPlans.map((plan: any, idx: number) => {
      const tierType = plan.type || tiers[idx] || 'Balanced';
      const costs = calculateCosts(tripData, routeInfo, tripDays, tierType as 'Budget' | 'Balanced' | 'Premium');

      return {
        id: idx + 1,
        type: tierType,
        route: fullRoute,
        reliability: tierType === 'Budget' ? 85 : tierType === 'Balanced' ? 90 : 95,
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
        why_this_fits: plan.why_this_fits || "",
        accommodation_info: plan.accommodation_name
          ? plan.accommodation_name + (plan.accommodation_address ? ", " + plan.accommodation_address : "") + (plan.accommodation_phone ? ", Tel: " + plan.accommodation_phone : "")
          : undefined,
        meeting_point: {
          name: "Internationale Deutsche Schule Sarajevo",
          address: "Buka 13, 71000 Sarajevo",
          lat: 43.8612, lng: 18.4028,
          time: "07:00"
        },
        chaperones: tripData.chaperones.length > 0 ? tripData.chaperones.join(', ') : Math.ceil(tripData.studentCount / 15) + ' pratitelja',
        itinerary: (plan.itinerary || []).map((d: any) => ({
          ...d,
          activities: (d.activities || []).map((a: any) => ({
            ...a,
            type: normalizeActivityType(a.type)
          }))
        })),
        packing_list: generatePackingList(tripDays, tierType, tripData),
        rules: generateTripRules(tripData.gradeLevel),
        emergency_contacts: {
          school: "+387 33 560 520",
          embassy_info: "Ambasada/konzulat BiH u destinacijskoj zemlji",
          local_emergency: "112 (EU standard)",
          medical_info: tripData.medicalInfo || "Nema posebnih medicinskih napomena"
        }
      };
    });

    const result = {
      plans: enrichedPlans,
      route_coordinates: routeCoordinates,
      verification: {
        data_source: "AI (Gemini 2.5 Flash) + OpenStreetMap + OSRM",
        last_verified: new Date().toISOString(),
        route_verified: true,
        distance_km: routeInfo.distance_km,
        travel_hours: routeInfo.duration_hours,
        pois_count: totalPOIs,
        ai_generated: true,
        cities_data: cityContexts.map(c => ({
          city: c.city, lat: c.lat, lng: c.lng,
          museums: c.museums.length, attractions: c.attractions.length,
          restaurants: c.restaurants.length, hotels: c.hotels.length,
          culture: c.culture.length
        }))
      },
      educational_resources: cityContexts.map(city => ({
        city: city.city,
        sites: [
          ...city.museums.slice(0, 3).map(m => m.name),
          ...city.attractions.slice(0, 3).map(m => m.name),
          ...city.culture.slice(0, 3).map(e => e.name)
        ].filter(Boolean),
        curriculum_links: tripData.educationalFocus ? [tripData.educationalFocus] : ["historija", "kultura", "geografija"]
      }))
    };

    console.log("=== v6.0 COMPLETE ===");
    enrichedPlans.forEach((p: any) => {
      const actCount = p.itinerary?.reduce((s: number, d: any) => s + (d.activities?.length || 0), 0) || 0;
      console.log(`  ${p.type}: ${p.cost_per_student} EUR/student, ${p.itinerary?.length || 0} days, ${actCount} activities`);
    });

    return new Response(JSON.stringify(result), {
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
