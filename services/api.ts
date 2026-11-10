const API_URL = 'http://172.20.10.2:5050';

export interface DatabasePlace {
  id: string;
  name: string;
  district: string;
  category: 'Camping' | 'Hiking' | 'Viewpoint';
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  image: string | null;
  description: string;
  waterAvailable: boolean | null;
  campfireAllowed: boolean | null;
  vehicleAccess: boolean | null;
  permitRequired: boolean | null;
  highlights: string[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export async function fetchPlaces(): Promise<DatabasePlace[]> {
  const response = await fetch(`${API_URL}/api/places`);

  if (!response.ok) {
    throw new Error('Failed to fetch places');
  }

  return response.json();
}