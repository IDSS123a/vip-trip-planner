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

    console.log("Generating trip plans for:", tripData);

    // Calculate trip duration
    const startDate = new Date(tripData.departureDate);
    const endDate = new Date(tripData.returnDate);
    const tripDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Build full route string
    const fullRoute = [tripData.departureCity, ...tripData.destinations, tripData.departureCity].join(' → ');

    const systemPrompt = `Ti si stručni planer školskih ekskurzija sa 20+ godina iskustva u organizaciji putovanja po Evropi. 
Tvoj zadatak je kreirati 3 DETALJNE opcije plana putovanja (Budget, Balanced, Premium).

PRAVILA ZA FORMAT ODGOVORA:
1. Odgovori ISKLJUČIVO sa validnim JSON objektom
2. NIKAKO ne koristi markdown (bez \`\`\`json ili \`\`\`)
3. NIKAKO ne dodaj tekst prije ili poslije JSON-a
4. JSON mora biti kompletno zatvoren

ZAHTJEVI ZA KVALITET PLANOVA:
- Svaki plan mora imati TAČNO ${tripDays} dana (${tripData.departureDate} do ${tripData.returnDate})
- Svaki dan mora imati 4-6 detaljnih aktivnosti sa PRECIZNIM vremenima
- Koristi STVARNE nazive lokacija, ulica, hotela, restorana
- Cijene moraju biti REALISTIČNE za 2026. godinu u EUR
- Udaljenosti i vremena putovanja moraju biti TAČNE
- Uključi SVE gradove iz rute: ${fullRoute}

STRUKTURA AKTIVNOSTI:
- type može biti: "travel", "meal", "sightseeing", "education", "accommodation", "leisure", "activity", "arrival"
- time format: "HH:MM-HH:MM" (npr. "08:00-12:00")
- Svaka aktivnost mora imati preciznu lokaciju

KOORDINATE:
- Obavezno uključi koordinate za SVE gradove iz rute
- Koristi tačne GPS koordinate (npr. Sarajevo: 43.8563, 18.4131)

${tripData.specialNeeds ? `POSEBNE NAPOMENE: ${tripData.specialNeeds} - Ovo MORA biti uključeno u notes polje relevantnih aktivnosti!` : ''}

JSON STRUKTURA:
{
  "plans": [
    {
      "id": 1,
      "type": "Budget",
      "route": "${fullRoute}",
      "reliability": 75,
      "days": ${tripDays},
      "distance_km": 0,
      "travel_hours": 0,
      "cost_per_student": 0,
      "costs": {
        "transport": 0,
        "accommodation": 0,
        "meals": 0,
        "entry_fees": 0,
        "activity_fees": 0,
        "local_transport": 0,
        "contingency": 0,
        "total": 0
      },
      "why_this_fits": "obrazloženje",
      "accommodation_info": "tip smještaja",
      "itinerary": [
        {
          "day": 1,
          "date": "${tripData.departureDate}",
          "title": "naslov dana",
          "activities": [
            {
              "time": "08:00-12:00",
              "description": "detaljan opis",
              "type": "travel",
              "location": "precizna lokacija",
              "notes": ""
            }
          ]
        }
      ]
    }
  ],
  "route_coordinates": [
    {"city": "Grad", "lat": 43.8563, "lng": 18.4131, "order": 1}
  ],
  "educational_resources": [
    {"city": "Grad", "sites": ["lokacija1", "lokacija2"]}
  ]
}`;

    const userPrompt = `Generiraj 3 KOMPLETNE opcije plana putovanja:

PODACI O PUTOVANJU:
- Polazište: ${tripData.departureCity}
- Ruta: ${fullRoute}
- Razred: ${tripData.gradeLevel}
- Broj učenika: ${tripData.studentCount}
- Pratitelji: ${tripData.chaperones.length > 0 ? tripData.chaperones.join(', ') : 'Nastavnici TBD'}
- Prevoz: ${tripData.transport}
- Period: ${tripData.departureDate} do ${tripData.returnDate} (${tripDays} dana)
${tripData.educationalFocus ? `- Edukativni fokus: ${tripData.educationalFocus}` : ''}
${tripData.specialNeeds ? `- Posebne napomene: ${tripData.specialNeeds}` : ''}

ZAHTJEVI:
1. Budget opcija: hosteli, osnovna ishrana, besplatne atrakcije
2. Balanced opcija: 3* hoteli, pansion, glavne atrakcije
3. Premium opcija: 4* hoteli, puni pansion, VIP ture, sve atrakcije

Odgovori SAMO validnim JSON objektom bez markdown formatiranja.`;

    console.log("Calling AI Gateway with gemini-2.5-pro...");
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
        temperature: 0.4,
        // No max_tokens limit - allow full detailed response
      }),
    });

    const responseTime = Date.now() - startTime;
    console.log(`AI Gateway response time: ${responseTime}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
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
      throw new Error("No content in AI response");
    }

    console.log("AI response received, length:", content.length, "chars");

    // Parse the JSON from the response - robust extraction
    let plans;
    try {
      let jsonString = content.trim();
      
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1].trim();
        console.log("Extracted JSON from markdown block");
      }
      
      // Find the JSON object boundaries
      const jsonStart = jsonString.indexOf('{');
      const jsonEnd = jsonString.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
      }
      
      console.log("Parsing JSON string of length:", jsonString.length);
      plans = JSON.parse(jsonString);
      
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw content (first 2000 chars):", content.substring(0, 2000));
      console.error("Raw content (last 500 chars):", content.substring(content.length - 500));
      throw new Error("Failed to parse AI response as JSON");
    }

    // Validate the response structure
    if (!plans.plans || !Array.isArray(plans.plans) || plans.plans.length === 0) {
      console.error("Invalid plans structure:", JSON.stringify(plans).substring(0, 500));
      throw new Error("Invalid response structure - no plans array");
    }

    // Ensure route_coordinates exists
    if (!plans.route_coordinates || !Array.isArray(plans.route_coordinates)) {
      // Generate default coordinates based on destinations
      plans.route_coordinates = generateDefaultCoordinates(tripData.departureCity, tripData.destinations);
    }

    // Ensure educational_resources exists
    if (!plans.educational_resources) {
      plans.educational_resources = [];
    }

    console.log(`Successfully generated ${plans.plans.length} trip plans in ${responseTime}ms`);
    console.log(`Plan details: Budget=${plans.plans[0]?.cost_per_student}EUR, Balanced=${plans.plans[1]?.cost_per_student}EUR, Premium=${plans.plans[2]?.cost_per_student}EUR`);

    return new Response(JSON.stringify(plans), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-trip-plans:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Fallback function to generate coordinates
function generateDefaultCoordinates(departureCity: string, destinations: string[]) {
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
    'prag': { lat: 50.0755, lng: 14.4378 },
    'prague': { lat: 50.0755, lng: 14.4378 },
    'rim': { lat: 41.9028, lng: 12.4964 },
    'rome': { lat: 41.9028, lng: 12.4964 },
    'bologna': { lat: 44.4949, lng: 11.3426 },
    'padova': { lat: 45.4064, lng: 11.8768 },
    'venecija': { lat: 45.4408, lng: 12.3155 },
    'venice': { lat: 45.4408, lng: 12.3155 },
    'firenca': { lat: 43.7696, lng: 11.2558 },
    'florence': { lat: 43.7696, lng: 11.2558 },
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
    'krakiv': { lat: 50.0647, lng: 19.9450 },
    'varšava': { lat: 52.2297, lng: 21.0122 },
    'warsaw': { lat: 52.2297, lng: 21.0122 },
  };

  const allCities = [departureCity, ...destinations, departureCity];
  const coordinates = [];
  
  for (let i = 0; i < allCities.length; i++) {
    const city = allCities[i].toLowerCase().trim();
    const coords = cityCoords[city];
    if (coords) {
      coordinates.push({
        city: allCities[i],
        lat: coords.lat,
        lng: coords.lng,
        order: i + 1
      });
    }
  }

  return coordinates;
}
