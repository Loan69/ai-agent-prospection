type GooglePlace = {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  types: string[];
};

type FetchPlacesParams = {
  location: string; // "Lyon 7, France"
  radius: number; // en mètres (ex: 2000 pour 2km)
  keyword?: string; // Mot-clé de recherche
  maxResults?: number; // Limite pour rester dans quota gratuit
};

/**
 * Récupère les entreprises depuis Google Places API
 */
export async function fetchGooglePlaces({
  location,
  radius,
  keyword,
  maxResults = 30,
}: FetchPlacesParams): Promise<GooglePlace[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY manquante dans .env.local");
  }

  // 1️⃣ Geocoder l'adresse pour obtenir lat/lng
  const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    location
  )}&key=${apiKey}`;

  const geoRes = await fetch(geocodeUrl);
  const geoData = await geoRes.json();

  if (geoData.status !== "OK" || !geoData.results[0]) {
    throw new Error(`Impossible de géocoder: ${location}`);
  }

  const { lat, lng } = geoData.results[0].geometry.location;
  console.log(`📍 Coordonnées: ${lat}, ${lng}`);

  // 2️⃣ Chercher les entreprises par catégories spécifiques
  // On va faire plusieurs recherches ciblées pour éviter les hôtels
  const targetKeywords = [
    "restaurant",
    "boutique",
    "magasin",
    "salon de coiffure",
    "cabinet avocat",
    "agence immobilière",
    "pharmacie",
    "boulangerie",
    "fleuriste",
    "garage",
    "institut beauté",
  ];

  const allPlaces = new Map<string, GooglePlace>(); // Map pour éviter doublons

  // Faire plusieurs recherches avec différents mots-clés
  for (const kw of targetKeywords.slice(0, 5)) { // Limiter à 5 pour ne pas exploser les quotas
    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(
      kw
    )}&key=${apiKey}`;

    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (searchData.status === "OK" && searchData.results) {
      searchData.results.forEach((place: any) => {
        // Exclure explicitement les hôtels et hébergements
        const isHotel = place.types.some((type: string) =>
          ["lodging", "hotel", "motel", "hostel", "guest_house"].includes(type)
        );
        
        if (!isHotel && !allPlaces.has(place.place_id)) {
          allPlaces.set(place.place_id, place);
        }
      });
    }

    // Petite pause entre chaque recherche
    await new Promise((resolve) => setTimeout(resolve, 200));
    
    // Si on a assez de résultats, on arrête
    if (allPlaces.size >= maxResults) break;
  }

  const places = Array.from(allPlaces.values()).slice(0, maxResults);
  console.log(`🏢 ${places.length} entreprises trouvées (après filtrage hôtels)`);

  // 3️⃣ Récupérer les détails de chaque entreprise
  const detailedPlaces: GooglePlace[] = [];

  for (const place of places) {
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=place_id,name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types&key=${apiKey}`;

    const detailRes = await fetch(detailsUrl);
    const detailData = await detailRes.json();

    if (detailData.status === "OK") {
      detailedPlaces.push(detailData.result);
    }

    // Pause pour respecter les quotas
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return detailedPlaces;
}

/**
 * Filtre les entreprises pertinentes selon nos critères
 */
export function filterRelevantBusinesses(
  places: GooglePlace[]
): GooglePlace[] {
  return places.filter((place) => {
    // Critère 0: Exclure ABSOLUMENT les hôtels et hébergements
    const isHotel = place.types.some((type) =>
      [
        "lodging",
        "hotel",
        "motel",
        "hostel",
        "guest_house",
        "campground",
        "rv_park",
      ].includes(type)
    );

    if (isHotel) {
      console.log(`🚫 Exclu (hébergement): ${place.name}`);
      return false;
    }

    // Critère 1: Au moins 10 avis (signe d'activité)
    if (!place.user_ratings_total || place.user_ratings_total < 10) {
      return false;
    }

    // Critère 2: Note >= 3.5 (entreprise pas trop mal notée)
    if (!place.rating || place.rating < 3.5) {
      return false;
    }

    // Critère 3: Types d'entreprises qui ont VRAIMENT besoin du web
    const highValueTypes = [
      "restaurant",
      "cafe",
      "bar",
      "bakery",
      "meal_takeaway",
      "food",
      "store",
      "clothing_store",
      "shoe_store",
      "jewelry_store",
      "furniture_store",
      "home_goods_store",
      "electronics_store",
      "book_store",
      "beauty_salon",
      "hair_care",
      "spa",
      "gym",
      "fitness_center",
      "lawyer",
      "accounting",
      "insurance_agency",
      "real_estate_agency",
      "car_dealer",
      "car_repair",
      "dentist",
      "doctor",
      "physiotherapist",
      "veterinary_care",
      "pharmacy",
      "florist",
      "pet_store",
      "shopping_mall",
      "department_store",
      "supermarket",
    ];

    const hasRelevantType = place.types.some((type) =>
      highValueTypes.includes(type)
    );

    if (!hasRelevantType) {
      console.log(`⏭️  Skip (type non pertinent): ${place.name} - ${place.types.join(", ")}`);
    }

    return hasRelevantType;
  });
}