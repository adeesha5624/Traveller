export interface CampingPlace {
  id: string;
  name: string;
  district: string;
  category: 'Camping' | 'Hiking' | 'Viewpoint';
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  image: string;
  waterAvailable: boolean;
  campfireAllowed: boolean;
  vehicleAccess: boolean;
  permitRequired: boolean;
  description: string;
  highlights: string[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export const SAMPLE_PLACES: CampingPlace[] = [
  {
    id: '1',
    name: 'Ohiya Camping Grounds',
    district: 'Badulla',
    category: 'Camping',
    difficulty: 'Moderate',
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80',
    waterAvailable: true,
    campfireAllowed: true,
    vehicleAccess: true,
    permitRequired: true,
    description: 'A secluded camping area with panoramic views of the Ohiya valley and surrounding hills.',
    
    highlights: [
    'Beautiful mountain views',
    'Popular hiking trails nearby',
    'Cool highland climate',
    ],
    coordinates: { latitude: 6.8183, longitude: 80.8389 },
  },
  {
    id: '2',
    name: 'Knuckles Mountain Range Trail',
    district: 'Matale',
    category: 'Hiking',
    difficulty: 'Hard',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    waterAvailable: true,
    campfireAllowed: false,
    vehicleAccess: false,
    permitRequired: true,
    description: 'Breathtaking biodiversity and cloud forests. Requires high fitness level.',
    
    highlights: [
    'Beautiful mountain views',
    'Popular hiking trails nearby',
    'Cool highland climate',
    ],
    coordinates: { latitude: 7.4608, longitude: 80.7608 },
  },
  {
    id: '3',
    name: 'Narangala Mountain',
    district: 'Badulla',
    category: 'Camping',
    difficulty: 'Moderate',
    image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80',
    waterAvailable: false,
    campfireAllowed: true,
    vehicleAccess: false,
    permitRequired: false,
    description: 'Famous golden grassy summit with 360-degree views.',
    
    highlights: [
    'Beautiful mountain views',
    'Popular hiking trails nearby',
    'Cool highland climate',
    ],
    coordinates: { latitude: 7.0422, longitude: 81.0125 },
  }
];