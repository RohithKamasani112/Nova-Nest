import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Property } from '../types/index';

// AWS S3 Configuration
const s3Client = new S3Client({
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
  },
});

const isProd = import.meta.env.VITE_IS_PRODUCTION === 'true';
const BUCKET_NAME = import.meta.env.VITE_S3_BUCKET_NAME;
const FOLDER_NAME = isProd
  ? import.meta.env.VITE_S3_FOLDER_PROD
  : import.meta.env.VITE_S3_FOLDER_DUMMY;

// Dummy property data
const dummyProperties: Omit<Property, 'id' | 'createdAt'>[] = [
  {
    title: 'Luxury Apartment in Downtown Mumbai',
    price: 25000000,
    location: 'Bandra, Mumbai, Maharashtra',
    description: 'Stunning 3 BHK apartment with panoramic views of the Arabian Sea. Features include modern kitchen, home theater, swimming pool access, and 24/7 security. Located in a premium building with world-class amenities.',
    images: [
      'https://images.unsplash.com/photo-1540932239986-310128078f3f?w=800',
      'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800',
    ],
    videos: [],
    category: 'apartment',
    status: 'buy',
    bedrooms: 3,
    bathrooms: 2,
    areaSqft: 2500,
    amenities: ['Swimming Pool', 'Gym', 'Covered Parking', '24/7 Security', 'Lift'],
    featured: true,
    verified: true,
    yearBuilt: 2022,
    parking: 2,
    floors: 28,
    furnished: true,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  {
    title: 'Modern Villa in Bangalore',
    price: 35000000,
    location: 'Whitefield, Bangalore, Karnataka',
    description: 'Spacious 4 BHK villa with private garden, infinity pool, and smart home automation. Built on 1.5 acres with lush landscaping. Perfect for families seeking luxury and privacy.',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9b274b5ce486?w=800',
      'https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=800',
    ],
    videos: [],
    category: 'villa',
    status: 'buy',
    bedrooms: 4,
    bathrooms: 3,
    areaSqft: 4500,
    amenities: ['Swimming Pool', 'Garden', 'Covered Parking', 'Power Backup', 'Gated Community'],
    featured: true,
    verified: true,
    yearBuilt: 2021,
    parking: 4,
    floors: 2,
    furnished: true,
  },
  {
    title: 'Cozy 1 BHK Apartment - Delhi NCR',
    price: 45000,
    location: 'Sector 62, Noida, Uttar Pradesh',
    description: 'Well-maintained 1 BHK apartment with modern amenities in a family-friendly society. Close to metro station, shopping mall, and schools. Available for immediate possession.',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    ],
    videos: [],
    category: 'apartment',
    status: 'rent',
    bedrooms: 1,
    bathrooms: 1,
    areaSqft: 650,
    amenities: ['Gym', 'Covered Parking', '24/7 Security', 'Lift'],
    featured: false,
    verified: true,
    parking: 1,
    furnished: false,
  },
  {
    title: 'Beachfront House in Goa',
    price: 55000000,
    location: 'Calangute Beach, Goa',
    description: 'Breathtaking beachfront property with direct beach access. 5 bedrooms, infinity pool overlooking the Arabian Sea, modern amenities, and private gate. Ideal for vacation home or investment.',
    images: [
      'https://images.unsplash.com/photo-1499416479640-13c922b81b18?w=800',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    ],
    videos: [],
    category: 'house',
    status: 'buy',
    bedrooms: 5,
    bathrooms: 4,
    areaSqft: 6000,
    amenities: ['Swimming Pool', 'Garden', 'Covered Parking', '24/7 Security', 'Gated Community'],
    featured: true,
    verified: true,
    yearBuilt: 2020,
    parking: 3,
    floors: 2,
    furnished: true,
  },
  {
    title: 'Commercial Plot in Pune',
    price: 5000000,
    location: 'Hinjewadi, Pune, Maharashtra',
    description: 'Prime commercial plot in high-growth IT corridor. Perfect for setting up office, restaurant, or retail business. Good connectivity and high foot traffic.',
    images: [
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800',
    ],
    videos: [],
    category: 'land',
    status: 'buy',
    bedrooms: 0,
    bathrooms: 0,
    areaSqft: 5000,
    amenities: [],
    featured: false,
    verified: true,
    parking: 0,
  },
  {
    title: 'Spacious Penthouse in Delhi',
    price: 45000000,
    location: 'Lutyens Delhi, New Delhi',
    description: 'Ultra-luxury 4 BHK penthouse with private terrace spanning 2000 sqft. High ceilings, smart home features, wine cellar, and concierge service. Iconic building with celebrity residents.',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    ],
    videos: [],
    category: 'apartment',
    status: 'buy',
    bedrooms: 4,
    bathrooms: 3,
    areaSqft: 4200,
    amenities: ['Swimming Pool', 'Gym', 'Covered Parking', '24/7 Security', 'Club House', 'Lift'],
    featured: true,
    verified: true,
    yearBuilt: 2023,
    parking: 3,
    floors: 35,
    furnished: true,
  },
  {
    title: 'Affordable Studio in Chennai',
    price: 30000,
    location: 'T. Nagar, Chennai, Tamil Nadu',
    description: 'Compact studio apartment perfect for working professionals. Well-equipped with essential amenities, security, and proximity to IT hubs.',
    images: [
      'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800',
    ],
    videos: [],
    category: 'apartment',
    status: 'rent',
    bedrooms: 0,
    bathrooms: 1,
    areaSqft: 400,
    amenities: ['Lift', '24/7 Security', 'Parking'],
    featured: false,
    verified: true,
    parking: 0,
    furnished: true,
  },
  {
    title: 'Resort-style Villa in Hyderabad',
    price: 28000000,
    location: 'Jubilee Hills, Hyderabad, Telangana',
    description: 'Stunning 3 BHK villa with resort-style living. Features include private pool, home gym, smart kitchen, and landscaped garden. Perfect for modern lifestyle.',
    images: [
      'https://images.unsplash.com/photo-1571508601155-9500e5f5f3bc?w=800',
    ],
    videos: [],
    category: 'villa',
    status: 'buy',
    bedrooms: 3,
    bathrooms: 3,
    areaSqft: 3500,
    amenities: ['Swimming Pool', 'Gym', 'Garden', 'Power Backup', 'Gated Community'],
    featured: true,
    verified: true,
    yearBuilt: 2022,
    parking: 2,
    floors: 1,
    furnished: true,
  },
];

// Upload dummy data to S3
export const seedDummyData = async () => {
  if (isProd) {
    console.log('Dummy data seeding is only available when VITE_IS_PRODUCTION=false.');
    return;
  }

  try {
    console.log('Seeding dummy data to S3...');

    // Create property objects with IDs and timestamps
    const propertiesWithMetadata: Property[] = dummyProperties.map((prop, index) => ({
      ...prop,
      id: `dummy_${index + 1}_${Date.now()}`,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    }));

    // Upload to S3
    const propertiesKey = `${FOLDER_NAME}/properties.json`;
    const uploadParams = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: propertiesKey,
      Body: JSON.stringify(propertiesWithMetadata, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(uploadParams);
    console.log(`✅ Successfully seeded ${propertiesWithMetadata.length} dummy properties to S3`);
    console.log('Properties:', propertiesWithMetadata.map(p => p.title));
  } catch (error) {
    console.error('❌ Error seeding dummy data:', error);
    throw error;
  }
};

// Export for CLI usage
if (typeof window === 'undefined') {
  // Running in Node.js environment (build script)
  seedDummyData().catch(err => {
    console.error('Seed script failed:', err);
    process.exit(1);
  });
}
