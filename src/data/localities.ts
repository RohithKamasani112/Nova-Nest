// Locality landing-page data.
//
// Each entry drives one hyper-local landing page rendered by
// src/pages/LocalityPage.tsx at /property-for-rent-in/<slug>. Content is
// original and Bangalore-specific, written for Nova Nest Rentals and Property
// Management's focus on premium 2/3/4 BHK gated-community homes.
//
// ⚠️ VERIFY BEFORE PUBLISH: the rent/sale ranges below are realistic 2026
// estimates drafted from general Bangalore market knowledge — they are NOT a
// live feed. Confirm each figure against current listings before relying on it
// publicly. Every range is marked so it is easy to grep: search "VERIFY".

export type Zone =
  | 'East Bangalore (IT Corridor)'
  | 'South Bangalore'
  | 'North Bangalore'
  | 'Central Bangalore';

export interface BhkRange {
  /** e.g. "₹28,000 – ₹42,000/mo" */
  bhk2: string;
  bhk3: string;
  bhk4: string;
}

export interface Locality {
  slug: string;
  name: string;
  zone: Zone;
  /** <title> — unique per page, keywords woven where natural. */
  metaTitle: string;
  /** meta description — 150-160 chars ideal. */
  metaDescription: string;
  /** Original 2-3 sentence intro describing the area for renters/buyers. */
  intro: string;
  /** Monthly rent ranges. VERIFY. */
  rent: BhkRange;
  /** Sale/resale price ranges. VERIFY. */
  sale: BhkRange;
  /** Notable gated-community amenities common to the area. */
  amenities: string[];
  /** Connectivity / commute bullet points. */
  connectivity: string[];
  /** 2-3 short "why live here" highlights. */
  highlights: string[];
  /** Related blog post slugs (two-way internal linking). */
  relatedBlog: string[];
  /** Descriptive alt text for the hero band. */
  heroAlt: string;
}

// VERIFY: all rent/sale figures below are estimates pending confirmation.
export const LOCALITIES: Locality[] = [
  {
    slug: 'whitefield',
    name: 'Whitefield',
    zone: 'East Bangalore (IT Corridor)',
    metaTitle:
      'Property for Rent & Sale in Whitefield, Bangalore | 2, 3 & 4 BHK Gated Flats — Nova Nest',
    metaDescription:
      'Find premium 2, 3 & 4 BHK flats for rent and houses for sale in Whitefield gated communities. Nova Nest Rentals and Property Management — your local real estate agent in East Bangalore.',
    intro:
      'Whitefield is East Bangalore’s flagship IT address, anchored by ITPL, EPIP Zone and the extended tech parks along Whitefield Main Road. Its premium gated communities draw professionals who want walk-to-work convenience alongside international schools, malls and hospitals. Nova Nest Rentals and Property Management helps tenants and buyers navigate Whitefield’s fast-moving market for 2, 3 and 4 BHK homes.',
    rent: { bhk2: '₹28,000 – ₹42,000/mo', bhk3: '₹40,000 – ₹68,000/mo', bhk4: '₹65,000 – ₹1,20,000/mo' }, // VERIFY
    sale: { bhk2: '₹75 L – ₹1.1 Cr', bhk3: '₹1.1 Cr – ₹2.2 Cr', bhk4: '₹2.2 Cr – ₹4 Cr+' }, // VERIFY
    amenities: ['Clubhouse & gym', 'Swimming pool', '24×7 security', 'Children’s play area', 'Power backup', 'Landscaped gardens'],
    connectivity: ['Whitefield (Kadugodi) Purple Line metro', 'ITPL & EPIP tech parks', 'Close to Phoenix Marketcity & VR Bengaluru', 'Well linked to Outer Ring Road via Varthur'],
    highlights: ['Largest concentration of premium gated communities in East Bangalore', 'Strong rental demand from IT professionals', 'Mature social infrastructure — schools, hospitals, malls'],
    relatedBlog: ['2-bhk-vs-3-bhk-renting-whitefield', 'whitefield-vs-sarjapur-road-where-to-rent-2026'],
    heroAlt: '3 BHK apartment in a Whitefield gated community, East Bangalore',
  },
  {
    slug: 'sarjapur-road',
    name: 'Sarjapur Road',
    zone: 'East Bangalore (IT Corridor)',
    metaTitle:
      'Property for Rent & Sale on Sarjapur Road, Bangalore | 2, 3 & 4 BHK Gated Flats — Nova Nest',
    metaDescription:
      'Premium 2, 3 & 4 BHK flats for rent and homes for sale on Sarjapur Road, Bangalore. Nova Nest Rentals and Property Management guides renters and buyers across its gated communities.',
    intro:
      'Sarjapur Road connects the Outer Ring Road tech belt to Wipro Corporate Office and the emerging IT clusters toward Attibele. Its newer gated communities offer larger floor plans and greener surroundings than the older core, making it a favourite for families upgrading from 2 BHK to 3 and 4 BHK homes. Nova Nest Rentals and Property Management tracks Sarjapur Road’s rapidly expanding real estate inventory.',
    rent: { bhk2: '₹26,000 – ₹40,000/mo', bhk3: '₹38,000 – ₹62,000/mo', bhk4: '₹60,000 – ₹1,10,000/mo' }, // VERIFY
    sale: { bhk2: '₹70 L – ₹1 Cr', bhk3: '₹1 Cr – ₹2 Cr', bhk4: '₹2 Cr – ₹3.6 Cr+' }, // VERIFY
    amenities: ['Resort-style clubhouse', 'Swimming pool', 'Sports courts', '24×7 security', 'Power backup', 'Jogging tracks'],
    connectivity: ['Direct access to Outer Ring Road & Marathahalli', 'Close to Wipro, RGA Tech Park & Sarjapur tech clusters', 'Reputed international schools nearby', 'Upcoming metro & road-widening corridors'],
    highlights: ['Newer, larger gated-community stock', 'Popular with families wanting space and greenery', 'Strong long-term appreciation corridor'],
    relatedBlog: ['whitefield-vs-sarjapur-road-where-to-rent-2026', 'buying-vs-renting-3-bhk-bangalore-it-corridors-2026'],
    heroAlt: '3 BHK flat for rent in a Sarjapur Road gated community, Bangalore',
  },
  {
    slug: 'marathahalli',
    name: 'Marathahalli',
    zone: 'East Bangalore (IT Corridor)',
    metaTitle:
      'Property for Rent & Sale in Marathahalli, Bangalore | 2, 3 & 4 BHK Flats — Nova Nest',
    metaDescription:
      'Looking for a real estate agent in Marathahalli? Nova Nest Rentals and Property Management lists premium 2, 3 & 4 BHK flats for rent and sale near the Outer Ring Road IT corridor.',
    intro:
      'Marathahalli sits at the crossroads of the Outer Ring Road and Old Airport Road, putting it within minutes of the Bellandur–Sarjapur tech belt and Whitefield alike. Its mix of established gated communities and value-priced apartments makes it one of East Bangalore’s most rented micro-markets. Nova Nest Rentals and Property Management helps tenants find well-connected 2 and 3 BHK homes here.',
    rent: { bhk2: '₹24,000 – ₹38,000/mo', bhk3: '₹36,000 – ₹58,000/mo', bhk4: '₹55,000 – ₹95,000/mo' }, // VERIFY
    sale: { bhk2: '₹65 L – ₹95 L', bhk3: '₹95 L – ₹1.8 Cr', bhk4: '₹1.8 Cr – ₹3 Cr+' }, // VERIFY
    amenities: ['Gym & clubhouse', 'Swimming pool', '24×7 security', 'Covered parking', 'Power backup', 'Community hall'],
    connectivity: ['Outer Ring Road & Old Airport Road junction', 'Close to Bellandur & Kadubeesanahalli tech parks', 'Marathahalli bus terminal', 'Quick access to Whitefield and HSR Layout'],
    highlights: ['Central to the entire East Bangalore IT corridor', 'Deep rental demand and quick tenant turnaround', 'Everyday retail, dining and healthcare on the doorstep'],
    relatedBlog: ['best-real-estate-agents-near-me-bangalore-it-corridors', 'rental-agreement-checklist-gated-community-bangalore'],
    heroAlt: '2 BHK apartment for rent in a Marathahalli gated community near Outer Ring Road',
  },
  {
    slug: 'electronic-city',
    name: 'Electronic City',
    zone: 'South Bangalore',
    metaTitle:
      'Property for Rent & Sale in Electronic City, Bangalore | 2, 3 & 4 BHK Gated Flats — Nova Nest',
    metaDescription:
      'Premium 2, 3 & 4 BHK flats for rent and new homes for sale in Electronic City gated communities. Nova Nest Rentals and Property Management serves South Bangalore’s biggest IT hub.',
    intro:
      'Electronic City is South Bangalore’s original IT township, home to Infosys, Wipro and hundreds of technology firms across Phase 1 and Phase 2. The elevated expressway and self-contained gated communities make it a top choice for families who want everything — work, schools and amenities — within a short radius. Nova Nest Rentals and Property Management helps families settle into Electronic City’s premium 2, 3 and 4 BHK homes.',
    rent: { bhk2: '₹20,000 – ₹32,000/mo', bhk3: '₹30,000 – ₹50,000/mo', bhk4: '₹48,000 – ₹85,000/mo' }, // VERIFY
    sale: { bhk2: '₹55 L – ₹85 L', bhk3: '₹85 L – ₹1.6 Cr', bhk4: '₹1.6 Cr – ₹2.8 Cr+' }, // VERIFY
    amenities: ['Large clubhouse', 'Swimming pool', 'Sports & fitness zones', '24×7 security', 'Power backup', 'Kids’ play areas'],
    connectivity: ['Electronic City elevated expressway', 'Upcoming Yellow Line metro', 'Infosys, Wipro & tech parks within Phase 1/2', 'NICE Road access to South & West Bangalore'],
    highlights: ['Self-contained township living', 'Excellent value per square foot', 'Family-friendly with schools inside communities'],
    relatedBlog: ['best-gated-communities-families-electronic-city', 'buying-vs-renting-3-bhk-bangalore-it-corridors-2026'],
    heroAlt: '3 BHK family apartment in an Electronic City gated community, South Bangalore',
  },
  {
    slug: 'bellandur',
    name: 'Bellandur',
    zone: 'East Bangalore (IT Corridor)',
    metaTitle:
      'Property for Rent & Sale in Bellandur, Bangalore | 2, 3 & 4 BHK Gated Flats — Nova Nest',
    metaDescription:
      'Find premium 2, 3 & 4 BHK flats for rent and homes for sale in Bellandur, on Bangalore’s Outer Ring Road. Nova Nest Rentals and Property Management — local real estate experts.',
    intro:
      'Bellandur is the beating heart of the Outer Ring Road tech corridor, surrounded by Ecospace, Cessna Business Park and the offices of the world’s largest technology firms. Its high-rise gated communities are built for professionals who prize a short commute and premium amenities. Nova Nest Rentals and Property Management helps renters and buyers secure well-appointed 2, 3 and 4 BHK homes in Bellandur.',
    rent: { bhk2: '₹30,000 – ₹45,000/mo', bhk3: '₹45,000 – ₹75,000/mo', bhk4: '₹72,000 – ₹1,30,000/mo' }, // VERIFY
    sale: { bhk2: '₹80 L – ₹1.2 Cr', bhk3: '₹1.2 Cr – ₹2.4 Cr', bhk4: '₹2.4 Cr – ₹4.2 Cr+' }, // VERIFY
    amenities: ['Premium clubhouse', 'Infinity/lap pool', 'Concierge & 24×7 security', 'Gym & spa', 'Power backup', 'Sky lounges'],
    connectivity: ['On the Outer Ring Road tech belt', 'Walk to Ecospace & Cessna Business Park', 'Close to Marathahalli & Sarjapur Road', 'Well served by feeder buses & cabs'],
    highlights: ['Shortest commutes on the ORR corridor', 'Premium high-rise inventory', 'Strong rental yields for investors'],
    relatedBlog: ['buying-vs-renting-3-bhk-bangalore-it-corridors-2026', 'security-deposit-premium-apartments-bangalore'],
    heroAlt: '4 BHK high-rise apartment in a Bellandur gated community on Outer Ring Road',
  },
  {
    slug: 'hsr-layout',
    name: 'HSR Layout',
    zone: 'South Bangalore',
    metaTitle:
      'Property for Rent & Sale in HSR Layout, Bangalore | 2, 3 & 4 BHK Flats — Nova Nest',
    metaDescription:
      'Premium 2, 3 & 4 BHK flats for rent and houses for sale in HSR Layout, Bangalore. Nova Nest Rentals and Property Management — your real estate agent for South Bangalore’s startup hub.',
    intro:
      'HSR Layout is the planned, sector-based neighbourhood that has become Bangalore’s startup and design hub, prized for its wide roads, parks and cafés. It bridges Sarjapur Road, the Outer Ring Road and Koramangala, giving residents access to several tech clusters. Nova Nest Rentals and Property Management helps professionals and families find premium 2, 3 and 4 BHK homes across HSR’s sectors.',
    rent: { bhk2: '₹28,000 – ₹44,000/mo', bhk3: '₹42,000 – ₹70,000/mo', bhk4: '₹65,000 – ₹1,15,000/mo' }, // VERIFY
    sale: { bhk2: '₹80 L – ₹1.2 Cr', bhk3: '₹1.2 Cr – ₹2.3 Cr', bhk4: '₹2.3 Cr – ₹4 Cr+' }, // VERIFY
    amenities: ['Clubhouse & gym', 'Swimming pool', '24×7 security', 'Landscaped parks', 'Power backup', 'Community spaces'],
    connectivity: ['Central to Sarjapur Road, ORR & Koramangala', 'Close to Agara & Bellandur tech parks', 'Excellent café, retail & healthcare scene', 'Upcoming metro connectivity nearby'],
    highlights: ['Planned layout with parks and wide roads', 'Vibrant lifestyle and social scene', 'Consistently strong resale demand'],
    relatedBlog: ['security-deposit-premium-apartments-bangalore', 'rental-agreement-checklist-gated-community-bangalore'],
    heroAlt: '3 BHK apartment for sale in an HSR Layout gated community, South Bangalore',
  },
  {
    slug: 'hebbal',
    name: 'Hebbal',
    zone: 'North Bangalore',
    metaTitle:
      'Property for Rent & Sale in Hebbal, Bangalore | 2, 3 & 4 BHK Gated Flats — Nova Nest',
    metaDescription:
      'Premium 2, 3 & 4 BHK flats for rent and new homes for sale in Hebbal, North Bangalore. Nova Nest Rentals and Property Management — airport-corridor real estate specialists.',
    intro:
      'Hebbal anchors North Bangalore’s growth story, with its landmark flyover linking the city to Kempegowda International Airport via the Bellary Road corridor. Lakeside gated communities and premium towers here attract executives who value airport access and Manyata Tech Park proximity. Nova Nest Rentals and Property Management helps buyers and tenants find standout 2, 3 and 4 BHK homes in Hebbal.',
    rent: { bhk2: '₹26,000 – ₹42,000/mo', bhk3: '₹40,000 – ₹68,000/mo', bhk4: '₹62,000 – ₹1,15,000/mo' }, // VERIFY
    sale: { bhk2: '₹75 L – ₹1.1 Cr', bhk3: '₹1.1 Cr – ₹2.2 Cr', bhk4: '₹2.2 Cr – ₹4 Cr+' }, // VERIFY
    amenities: ['Lakeview clubhouse', 'Swimming pool', '24×7 security', 'Gym & sports courts', 'Power backup', 'Landscaped gardens'],
    connectivity: ['Hebbal flyover & Bellary Road to the airport', 'Close to Manyata Tech Park', 'Upcoming metro & suburban rail links', 'Quick access to the ORR north'],
    highlights: ['Best airport connectivity in the city', 'Scenic lakeside communities', 'Strong appeal for senior executives'],
    relatedBlog: ['new-homes-for-sale-bangalore-gated-communities-2026', 'buying-vs-renting-3-bhk-bangalore-it-corridors-2026'],
    heroAlt: '3 BHK lakeview apartment in a Hebbal gated community, North Bangalore',
  },
  {
    slug: 'mahadevapura',
    name: 'Mahadevapura',
    zone: 'East Bangalore (IT Corridor)',
    metaTitle:
      'Property for Rent & Sale in Mahadevapura, Bangalore | 2, 3 & 4 BHK Flats — Nova Nest',
    metaDescription:
      'Premium 2, 3 & 4 BHK flats for rent and homes for sale in Mahadevapura, Bangalore. Nova Nest Rentals and Property Management — real estate agents near the Whitefield ORR belt.',
    intro:
      'Mahadevapura sits between Whitefield and the Outer Ring Road, making it one of the most commute-friendly addresses on the East Bangalore tech belt. Its gated communities range from established mid-rises to newer premium towers, serving a steady stream of IT professionals. As a Mahadevapura-headquartered firm, Nova Nest Rentals and Property Management knows this micro-market intimately.',
    rent: { bhk2: '₹26,000 – ₹40,000/mo', bhk3: '₹38,000 – ₹62,000/mo', bhk4: '₹58,000 – ₹1,05,000/mo' }, // VERIFY
    sale: { bhk2: '₹70 L – ₹1 Cr', bhk3: '₹1 Cr – ₹2 Cr', bhk4: '₹2 Cr – ₹3.5 Cr+' }, // VERIFY
    amenities: ['Clubhouse & gym', 'Swimming pool', '24×7 security', 'Kids’ play area', 'Power backup', 'Indoor games'],
    connectivity: ['Minutes from Whitefield & ITPL', 'Direct Outer Ring Road access', 'Close to Phoenix Marketcity', 'Well linked to KR Puram & metro'],
    highlights: ['Our home turf — deepest local knowledge', 'Balanced pricing between Whitefield and ORR', 'Excellent everyday connectivity'],
    relatedBlog: ['nova-nest-rentals-property-management-who-we-are', 'best-real-estate-agents-near-me-bangalore-it-corridors'],
    heroAlt: '2 BHK apartment for rent in a Mahadevapura gated community near Whitefield',
  },
  {
    slug: 'koramangala',
    name: 'Koramangala',
    zone: 'South Bangalore',
    metaTitle:
      'Property for Rent & Sale in Koramangala, Bangalore | 2, 3 & 4 BHK Flats — Nova Nest',
    metaDescription:
      'Premium 2, 3 & 4 BHK flats for rent and houses for sale in Koramangala, Bangalore. Nova Nest Rentals and Property Management — real estate agents for the city’s startup capital.',
    intro:
      'Koramangala is Bangalore’s cosmopolitan core — a leafy, block-planned neighbourhood that doubles as the country’s startup capital. Premium apartments and boutique gated communities here command a lifestyle premium for their cafés, retail and central location. Nova Nest Rentals and Property Management helps discerning tenants and buyers secure 2, 3 and 4 BHK homes in Koramangala.',
    rent: { bhk2: '₹32,000 – ₹52,000/mo', bhk3: '₹50,000 – ₹85,000/mo', bhk4: '₹80,000 – ₹1,50,000/mo' }, // VERIFY
    sale: { bhk2: '₹1 Cr – ₹1.6 Cr', bhk3: '₹1.6 Cr – ₹3 Cr', bhk4: '₹3 Cr – ₹5.5 Cr+' }, // VERIFY
    amenities: ['Boutique clubhouse', 'Swimming pool', '24×7 security', 'Gym', 'Power backup', 'Concierge in premium towers'],
    connectivity: ['Central access to ORR, Sarjapur Road & MG Road', 'Walkable café, retail & nightlife', 'Close to Forum Mall & startup offices', 'Well connected by bus & upcoming metro'],
    highlights: ['Most central premium address in South Bangalore', 'Unmatched lifestyle and dining scene', 'Blue-chip resale value'],
    relatedBlog: ['new-homes-for-sale-bangalore-gated-communities-2026', 'security-deposit-premium-apartments-bangalore'],
    heroAlt: '3 BHK premium apartment in a Koramangala gated community, South Bangalore',
  },
  {
    slug: 'indiranagar',
    name: 'Indiranagar',
    zone: 'Central Bangalore',
    metaTitle:
      'Property for Rent & Sale in Indiranagar, Bangalore | 2, 3 & 4 BHK Flats — Nova Nest',
    metaDescription:
      'Premium 2, 3 & 4 BHK flats for rent and homes for sale in Indiranagar, Central Bangalore. Nova Nest Rentals and Property Management — real estate agents for a prime metro-linked address.',
    intro:
      'Indiranagar is one of Bangalore’s most sought-after central neighbourhoods, blending tree-lined residential streets with the buzz of 100 Feet Road’s restaurants and boutiques. Purple Line metro access and proximity to MG Road and the CBD make it a perennial favourite. Nova Nest Rentals and Property Management helps clients find premium 2, 3 and 4 BHK homes in Indiranagar’s prized pockets.',
    rent: { bhk2: '₹34,000 – ₹55,000/mo', bhk3: '₹52,000 – ₹90,000/mo', bhk4: '₹85,000 – ₹1,60,000/mo' }, // VERIFY
    sale: { bhk2: '₹1.1 Cr – ₹1.8 Cr', bhk3: '₹1.8 Cr – ₹3.4 Cr', bhk4: '₹3.4 Cr – ₹6 Cr+' }, // VERIFY
    amenities: ['Clubhouse', 'Swimming pool', '24×7 security', 'Gym', 'Power backup', 'Covered parking'],
    connectivity: ['Indiranagar Purple Line metro', 'Minutes to MG Road & CBD', '100 Feet Road dining & retail', 'Easy access to Old Airport Road & ORR'],
    highlights: ['Prime central location with metro on the doorstep', 'Vibrant lifestyle and heritage charm', 'Consistently high resale demand'],
    relatedBlog: ['new-homes-for-sale-bangalore-gated-communities-2026', 'how-to-sell-flat-fast-bangalore-gated-communities'],
    heroAlt: '3 BHK apartment for sale in an Indiranagar gated community, Central Bangalore',
  },
  {
    slug: 'jp-nagar',
    name: 'JP Nagar',
    zone: 'South Bangalore',
    metaTitle:
      'Property for Rent & Sale in JP Nagar, Bangalore | 2, 3 & 4 BHK Flats — Nova Nest',
    metaDescription:
      'Premium 2, 3 & 4 BHK flats for rent and houses for sale in JP Nagar, South Bangalore. Nova Nest Rentals and Property Management — trusted local real estate agents.',
    intro:
      'JP Nagar is a well-established South Bangalore neighbourhood known for its orderly phases, parks and strong sense of community. It offers a calmer, family-oriented alternative to the tech corridors while staying well connected to Bannerghatta Road and the ORR. Nova Nest Rentals and Property Management helps families find spacious 2, 3 and 4 BHK homes in JP Nagar’s gated communities.',
    rent: { bhk2: '₹24,000 – ₹38,000/mo', bhk3: '₹36,000 – ₹58,000/mo', bhk4: '₹55,000 – ₹95,000/mo' }, // VERIFY
    sale: { bhk2: '₹70 L – ₹1.1 Cr', bhk3: '₹1.1 Cr – ₹2 Cr', bhk4: '₹2 Cr – ₹3.4 Cr+' }, // VERIFY
    amenities: ['Clubhouse & gym', 'Swimming pool', '24×7 security', 'Parks & play areas', 'Power backup', 'Community hall'],
    connectivity: ['Green Line metro (JP Nagar)', 'Close to Bannerghatta Road & ORR', 'Established schools & hospitals', 'Quick access to Jayanagar & BTM'],
    highlights: ['Mature, family-friendly neighbourhood', 'Green and well-planned phases', 'Reliable long-term value'],
    relatedBlog: ['rental-agreement-checklist-gated-community-bangalore', 'new-homes-for-sale-bangalore-gated-communities-2026'],
    heroAlt: '3 BHK family apartment in a JP Nagar gated community, South Bangalore',
  },
  {
    slug: 'bannerghatta-road',
    name: 'Bannerghatta Road',
    zone: 'South Bangalore',
    metaTitle:
      'Property for Rent & Sale on Bannerghatta Road, Bangalore | 2, 3 & 4 BHK Flats — Nova Nest',
    metaDescription:
      'Premium 2, 3 & 4 BHK flats for rent and new homes for sale on Bannerghatta Road, Bangalore. Nova Nest Rentals and Property Management — South Bangalore real estate specialists.',
    intro:
      'Bannerghatta Road runs south from the city through a corridor of hospitals, tech parks and IIM Bangalore, ending near the national park. Its gated communities appeal to healthcare and IT professionals who want space and greenery within reach of the core. Nova Nest Rentals and Property Management helps buyers and tenants find well-located 2, 3 and 4 BHK homes along Bannerghatta Road.',
    rent: { bhk2: '₹22,000 – ₹36,000/mo', bhk3: '₹34,000 – ₹55,000/mo', bhk4: '₹52,000 – ₹90,000/mo' }, // VERIFY
    sale: { bhk2: '₹60 L – ₹90 L', bhk3: '₹90 L – ₹1.7 Cr', bhk4: '₹1.7 Cr – ₹2.9 Cr+' }, // VERIFY
    amenities: ['Clubhouse & gym', 'Swimming pool', '24×7 security', 'Landscaped gardens', 'Power backup', 'Sports courts'],
    connectivity: ['Upcoming Pink Line metro', 'Close to IIM Bangalore & Apollo/Fortis hospitals', 'Tech parks toward Hulimavu & Arekere', 'NICE Road & ORR access'],
    highlights: ['Healthcare and education hub', 'Green corridor toward the national park', 'Strong value for larger homes'],
    relatedBlog: ['best-gated-communities-families-electronic-city', 'buying-vs-renting-3-bhk-bangalore-it-corridors-2026'],
    heroAlt: '3 BHK apartment for rent in a Bannerghatta Road gated community, South Bangalore',
  },
  {
    slug: 'yelahanka',
    name: 'Yelahanka',
    zone: 'North Bangalore',
    metaTitle:
      'Property for Rent & Sale in Yelahanka, Bangalore | 2, 3 & 4 BHK Flats — Nova Nest',
    metaDescription:
      'Premium 2, 3 & 4 BHK flats for rent and new homes for sale in Yelahanka, North Bangalore. Nova Nest Rentals and Property Management — airport-corridor real estate agents.',
    intro:
      'Yelahanka is a spacious, planned satellite town on the northern airport corridor, prized for its wide roads, lakes and cleaner air. Premium villa communities and gated apartments here attract families and NRIs drawn to airport proximity and long-term growth. Nova Nest Rentals and Property Management helps clients navigate Yelahanka’s expanding 2, 3 and 4 BHK inventory.',
    rent: { bhk2: '₹20,000 – ₹34,000/mo', bhk3: '₹32,000 – ₹52,000/mo', bhk4: '₹50,000 – ₹90,000/mo' }, // VERIFY
    sale: { bhk2: '₹55 L – ₹85 L', bhk3: '₹85 L – ₹1.6 Cr', bhk4: '₹1.6 Cr – ₹3 Cr+' }, // VERIFY
    amenities: ['Clubhouse & gym', 'Swimming pool', '24×7 security', 'Villa & apartment options', 'Power backup', 'Open green spaces'],
    connectivity: ['On the Kempegowda Airport corridor', 'Upcoming metro & suburban rail', 'Close to Manyata & aerospace SEZs', 'NH-44 & ORR north access'],
    highlights: ['Airport-side growth corridor', 'Spacious, planned township feel', 'Popular for premium villas'],
    relatedBlog: ['new-homes-for-sale-bangalore-gated-communities-2026', 'nova-nest-rentals-property-management-who-we-are'],
    heroAlt: '4 BHK villa in a Yelahanka gated community on the Bangalore airport corridor',
  },
  {
    slug: 'hennur',
    name: 'Hennur',
    zone: 'North Bangalore',
    metaTitle:
      'Property for Rent & Sale in Hennur, Bangalore | 2, 3 & 4 BHK Gated Flats — Nova Nest',
    metaDescription:
      'Premium 2, 3 & 4 BHK flats for rent and homes for sale in Hennur, North Bangalore. Nova Nest Rentals and Property Management — real estate agents for the airport-belt corridor.',
    intro:
      'Hennur has emerged as a fast-growing North Bangalore corridor, offering newer gated communities at attractive prices with quick links to Manyata Tech Park and the airport road. It suits professionals and young families who want modern amenities without central-city pricing. Nova Nest Rentals and Property Management helps renters and buyers find value-rich 2, 3 and 4 BHK homes in Hennur.',
    rent: { bhk2: '₹20,000 – ₹33,000/mo', bhk3: '₹30,000 – ₹50,000/mo', bhk4: '₹48,000 – ₹85,000/mo' }, // VERIFY
    sale: { bhk2: '₹52 L – ₹82 L', bhk3: '₹82 L – ₹1.5 Cr', bhk4: '₹1.5 Cr – ₹2.7 Cr+' }, // VERIFY
    amenities: ['Clubhouse & gym', 'Swimming pool', '24×7 security', 'Kids’ play area', 'Power backup', 'Jogging tracks'],
    connectivity: ['Hennur Road to the airport & ORR', 'Close to Manyata Tech Park', 'Upcoming metro links north', 'Growing retail & school infrastructure'],
    highlights: ['Value pricing with modern amenities', 'Fast-appreciating airport corridor', 'Good for first-time premium buyers'],
    relatedBlog: ['buying-vs-renting-3-bhk-bangalore-it-corridors-2026', 'new-homes-for-sale-bangalore-gated-communities-2026'],
    heroAlt: '2 BHK apartment for sale in a Hennur gated community, North Bangalore',
  },
  {
    slug: 'thanisandra',
    name: 'Thanisandra',
    zone: 'North Bangalore',
    metaTitle:
      'Property for Rent & Sale in Thanisandra, Bangalore | 2, 3 & 4 BHK Flats — Nova Nest',
    metaDescription:
      'Premium 2, 3 & 4 BHK flats for rent and new homes for sale in Thanisandra, North Bangalore. Nova Nest Rentals and Property Management — Manyata-belt real estate specialists.',
    intro:
      'Thanisandra runs alongside Manyata Tech Park, making it one of North Bangalore’s most convenient addresses for the tech workforce. A wave of new high-rise gated communities has made it a hotspot for both renters and investors. Nova Nest Rentals and Property Management helps clients secure modern 2, 3 and 4 BHK homes in Thanisandra.',
    rent: { bhk2: '₹22,000 – ₹36,000/mo', bhk3: '₹34,000 – ₹56,000/mo', bhk4: '₹52,000 – ₹95,000/mo' }, // VERIFY
    sale: { bhk2: '₹58 L – ₹88 L', bhk3: '₹88 L – ₹1.7 Cr', bhk4: '₹1.7 Cr – ₹3 Cr+' }, // VERIFY
    amenities: ['Modern clubhouse', 'Swimming pool', '24×7 security', 'Gym & sports courts', 'Power backup', 'Landscaped decks'],
    connectivity: ['Walk/short drive to Manyata Tech Park', 'Thanisandra Main Road to ORR & airport', 'Upcoming metro connectivity', 'Growing malls, schools & hospitals'],
    highlights: ['Manyata-adjacent convenience', 'Newest high-rise inventory in the north', 'Strong rental demand and yields'],
    relatedBlog: ['best-real-estate-agents-near-me-bangalore-it-corridors', 'security-deposit-premium-apartments-bangalore'],
    heroAlt: '3 BHK high-rise apartment in a Thanisandra gated community near Manyata Tech Park',
  },
  {
    slug: 'devanahalli',
    name: 'Devanahalli',
    zone: 'North Bangalore',
    metaTitle:
      'Property for Rent & Sale in Devanahalli, Bangalore | 2, 3 & 4 BHK Homes — Nova Nest',
    metaDescription:
      'Premium 2, 3 & 4 BHK homes for sale and rent in Devanahalli, near Bangalore airport. Nova Nest Rentals and Property Management — real estate agents for the northern growth corridor.',
    intro:
      'Devanahalli surrounds Kempegowda International Airport and is the epicentre of North Bangalore’s long-term growth, with the Aerospace Park, Business Park and townships driving demand. Villa communities and integrated gated developments here appeal to investors and end-users with a long horizon. Nova Nest Rentals and Property Management helps buyers evaluate Devanahalli’s premium 2, 3 and 4 BHK options.',
    rent: { bhk2: '₹18,000 – ₹30,000/mo', bhk3: '₹28,000 – ₹48,000/mo', bhk4: '₹45,000 – ₹85,000/mo' }, // VERIFY
    sale: { bhk2: '₹50 L – ₹80 L', bhk3: '₹80 L – ₹1.5 Cr', bhk4: '₹1.5 Cr – ₹3.2 Cr+' }, // VERIFY
    amenities: ['Township clubhouse', 'Swimming pool', '24×7 security', 'Villa & plotted options', 'Power backup', 'Large green spaces'],
    connectivity: ['Adjacent to Kempegowda International Airport', 'NH-44 & upcoming metro/rail', 'Aerospace & Business Park SEZs', 'Satellite Town Ring Road (STRR)'],
    highlights: ['Highest long-term growth potential', 'Airport-side townships & villas', 'Favoured by investors and NRIs'],
    relatedBlog: ['new-homes-for-sale-bangalore-gated-communities-2026', 'how-to-sell-flat-fast-bangalore-gated-communities'],
    heroAlt: '4 BHK villa in a Devanahalli gated township near Bangalore airport',
  },
  {
    slug: 'btm-layout',
    name: 'BTM Layout',
    zone: 'South Bangalore',
    metaTitle:
      'Property for Rent & Sale in BTM Layout, Bangalore | 2, 3 & 4 BHK Flats — Nova Nest',
    metaDescription:
      'Premium 2, 3 & 4 BHK flats for rent and houses for sale in BTM Layout, South Bangalore. Nova Nest Rentals and Property Management — real estate agents near the ORR and Silk Board.',
    intro:
      'BTM Layout is one of South Bangalore’s most centrally connected residential hubs, popular with young professionals for its access to the Outer Ring Road, Koramangala and Electronic City via Silk Board. Its mix of gated apartments and independent builder floors keeps demand high year-round. Nova Nest Rentals and Property Management helps tenants and buyers find well-connected 2, 3 and 4 BHK homes in BTM Layout.',
    rent: { bhk2: '₹24,000 – ₹38,000/mo', bhk3: '₹36,000 – ₹58,000/mo', bhk4: '₹55,000 – ₹92,000/mo' }, // VERIFY
    sale: { bhk2: '₹68 L – ₹1 Cr', bhk3: '₹1 Cr – ₹1.9 Cr', bhk4: '₹1.9 Cr – ₹3.2 Cr+' }, // VERIFY
    amenities: ['Clubhouse & gym', 'Swimming pool', '24×7 security', 'Covered parking', 'Power backup', 'Community spaces'],
    connectivity: ['Close to Silk Board & ORR junction', 'Quick links to Koramangala & Electronic City', 'Upcoming metro connectivity', 'Dense retail, dining & healthcare'],
    highlights: ['Highly central and well connected', 'Steady rental demand', 'Wide range of price points'],
    relatedBlog: ['rental-agreement-checklist-gated-community-bangalore', 'best-real-estate-agents-near-me-bangalore-it-corridors'],
    heroAlt: '2 BHK apartment for rent in a BTM Layout gated community, South Bangalore',
  },
  {
    slug: 'kanakapura-road',
    name: 'Kanakapura Road',
    zone: 'South Bangalore',
    metaTitle:
      'Property for Rent & Sale on Kanakapura Road, Bangalore | 2, 3 & 4 BHK Flats — Nova Nest',
    metaDescription:
      'Premium 2, 3 & 4 BHK flats for rent and new homes for sale on Kanakapura Road, Bangalore. Nova Nest Rentals and Property Management — metro-linked South Bangalore specialists.',
    intro:
      'Kanakapura Road has transformed into a premium South Bangalore corridor thanks to the Green Line metro extension and a wave of large gated communities toward Konanakunte and Vajarahalli. Its greener, low-density character appeals to families seeking space and calm. Nova Nest Rentals and Property Management helps buyers and tenants find spacious 2, 3 and 4 BHK homes along Kanakapura Road.',
    rent: { bhk2: '₹20,000 – ₹34,000/mo', bhk3: '₹32,000 – ₹52,000/mo', bhk4: '₹50,000 – ₹88,000/mo' }, // VERIFY
    sale: { bhk2: '₹55 L – ₹88 L', bhk3: '₹88 L – ₹1.7 Cr', bhk4: '₹1.7 Cr – ₹3 Cr+' }, // VERIFY
    amenities: ['Large clubhouse', 'Swimming pool', '24×7 security', 'Sports facilities', 'Power backup', 'Landscaped greens'],
    connectivity: ['Green Line metro along the corridor', 'NICE Road & ORR access', 'Close to Art of Living & Turahalli forest', 'Growing school & retail base'],
    highlights: ['Metro-connected and green', 'Spacious communities at good value', 'Rapidly improving infrastructure'],
    relatedBlog: ['new-homes-for-sale-bangalore-gated-communities-2026', 'best-gated-communities-families-electronic-city'],
    heroAlt: '3 BHK apartment for sale in a Kanakapura Road gated community, South Bangalore',
  },
  {
    slug: 'jayanagar',
    name: 'Jayanagar',
    zone: 'South Bangalore',
    metaTitle:
      'Property for Rent & Sale in Jayanagar, Bangalore | 2, 3 & 4 BHK Homes — Nova Nest',
    metaDescription:
      'Premium 2, 3 & 4 BHK homes for rent and houses for sale in Jayanagar, South Bangalore. Nova Nest Rentals and Property Management — real estate agents for one of the city’s best-planned areas.',
    intro:
      'Jayanagar is among Bangalore’s oldest and best-planned neighbourhoods, known for its tree-lined blocks, parks and thriving shopping district. It offers a rare mix of heritage charm, premium gated apartments and elegant independent homes, all with excellent metro access. Nova Nest Rentals and Property Management helps clients find sought-after 2, 3 and 4 BHK homes in Jayanagar.',
    rent: { bhk2: '₹26,000 – ₹42,000/mo', bhk3: '₹40,000 – ₹65,000/mo', bhk4: '₹62,000 – ₹1,10,000/mo' }, // VERIFY
    sale: { bhk2: '₹85 L – ₹1.3 Cr', bhk3: '₹1.3 Cr – ₹2.4 Cr', bhk4: '₹2.4 Cr – ₹4.2 Cr+' }, // VERIFY
    amenities: ['Clubhouse', 'Swimming pool', '24×7 security', 'Gym', 'Power backup', 'Covered parking'],
    connectivity: ['Green Line metro (Jayanagar)', 'Close to South End Circle & JP Nagar', 'Renowned shopping & dining', 'Well linked to BTM & Bannerghatta Road'],
    highlights: ['Iconic planned neighbourhood', 'Blend of heritage homes and premium flats', 'Enduring, blue-chip resale value'],
    relatedBlog: ['how-to-sell-flat-fast-bangalore-gated-communities', 'new-homes-for-sale-bangalore-gated-communities-2026'],
    heroAlt: '3 BHK home for sale in a Jayanagar gated community, South Bangalore',
  },
];

// Zones in display order for the homepage "Explore by Location" grouping.
export const ZONES_IN_ORDER: Zone[] = [
  'East Bangalore (IT Corridor)',
  'South Bangalore',
  'North Bangalore',
  'Central Bangalore',
];

export const getLocalityBySlug = (slug: string): Locality | undefined =>
  LOCALITIES.find((l) => l.slug === slug);

export const localitiesByZone = (zone: Zone): Locality[] =>
  LOCALITIES.filter((l) => l.zone === zone);

// Flat list of known Bangalore locality/area names for the admin property
// form's editable "Locality / Area" field — the predefined options an admin
// picks from or corrects Google's auto-detected value against. Sourced from
// the landing-page localities above, plus areas (like Hoodi) that appear in
// the homepage's popular-location chips but don't have a dedicated page yet.
export const ADMIN_LOCALITY_OPTIONS: string[] = Array.from(
  new Set([...LOCALITIES.map((l) => l.name), 'Hoodi'])
).sort((a, b) => a.localeCompare(b));
