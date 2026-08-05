IMPORTANT:
Analyze the ENTIRE existing project carefully before making ANY changes.

DO NOT partially redesign.
DO NOT create generic sections.
DO NOT create AI-looking layouts.
DO NOT create placeholder-style components.

The goal is to COMPLETELY transform the existing application into a premium, production-grade real estate platform with modern UX, premium UI density, proper architecture, and deploy-ready AWS integration.

The final product should feel:
- Human designed
- Investor ready
- Luxury
- Premium
- Modern
- Dense but clean
- Production quality

The UI quality should feel inspired by:
- Airbnb
- Zillow
- Apple
- Stripe
- Linear

========================================================
APPLICATION PURPOSE
========================================================

This application is ONLY for:
- Buying properties
- Renting properties

Focus heavily on:
- Fast browsing
- Property discovery
- Filtering UX
- Lead generation
- Mobile-first experience
- Premium property presentation

========================================================
CURRENT PROBLEMS TO FIX
========================================================

The current application looks:
- AI generated
- Empty
- Generic
- Weak visually
- Too much whitespace
- Weak hierarchy
- Weak mobile UX
- Fake-looking cards
- Generic filters
- Low trust
- Low visual density

Fix ALL of these completely.

========================================================
COMPLETE UI/UX REDESIGN
========================================================

========================================================
1. HOMEPAGE REDESIGN
========================================================

Completely redesign homepage.

Current hero section is oversized and generic.

Create:
- Compact premium hero section
- Luxury real estate background
- Better typography hierarchy
- Better spacing rhythm
- Glass overlay
- Premium search experience
- Better alignment
- Strong visual hierarchy

Headline example:
“Find Exceptional Homes Across India”

Subheading:
Professional and concise.

========================================================
2. SEARCH EXPERIENCE
========================================================

The search and filters MUST heavily resemble Airbnb UX.

Search bar should:
- Float elegantly
- Have premium shadows
- Sticky behavior on scroll
- Compact modern layout
- Better spacing
- Better interactions

Include:
- Buy / Rent toggle
- Location
- Budget
- Property type
- Bedrooms
- Search CTA

Experience should feel:
- Fast
- Premium
- Smooth
- Mobile optimized

========================================================
3. PROPERTY LISTING PAGE
========================================================

Completely redesign listing page.

Take heavy inspiration from:
- Airbnb
- Zillow

Create:
- Sticky floating filters
- Horizontal filter chips
- Floating advanced filter modal
- Smooth transitions
- Real-time filtering
- Better visual density
- Better alignment

Filters:
- Buy
- Rent
- Apartment
- Villa
- Plot
- Commercial
- Luxury
- Verified
- Budget slider
- Bedrooms
- Bathrooms
- Furnishing
- Amenities
- Ready to move
- Nearby schools
- Nearby hospitals
- Gated community
- Pet friendly

========================================================
4. PROPERTY CARDS (VERY IMPORTANT)
========================================================

Current cards look fake and AI generated.

Redesign completely.

Cards should feel:
- Premium
- Dense
- Rich
- Realistic
- Interactive
- High-end

Each property card should include:
- Large image carousel
- Hover zoom effect
- Verified badge
- Property type
- Price
- Monthly rent
- Beds/Baths
- Property size
- Agent info
- Save/favorite icon
- Property status
- Short description
- CTA buttons

Add:
- Micro animations
- Hover elevation
- Better shadows
- Better image presentation
- Smooth transitions

========================================================
5. PROPERTY DETAILS PAGE
========================================================

Create premium property detail experience.

Include:
- Large gallery
- Fullscreen image viewer
- Sticky contact section
- Property overview
- Amenities
- Description
- Nearby places
- Google Maps integration
- Similar properties
- YouTube walkthrough section

CTA:
- Contact owner
- Schedule visit
- Download brochure
- Get more details

When brochure clicked:
Open lead capture modal:
- Name
- Mobile
- Email

========================================================
6. MOBILE EXPERIENCE
========================================================

The mobile UX must feel:
- Native app quality
- Airbnb inspired
- Premium
- Smooth

Add:
- Bottom navigation
- Sticky mobile filters
- Swipeable property cards
- Better responsive layouts
- Better spacing
- Better touch interactions

========================================================
7. VISUAL DESIGN IMPROVEMENTS
========================================================

Improve:
- Typography hierarchy
- Spacing rhythm
- Visual density
- Layout alignment
- Hover effects
- Shadows
- Contrast
- Responsiveness
- Section transitions

Use:
- Premium typography
- Better photography
- Better UI hierarchy
- Realistic layouts
- Better visual polish

Avoid:
- Huge empty spaces
- Overused gradients
- Generic templates
- Cartoonish UI
- Excessive rounded corners
- Placeholder sections

========================================================
ADMIN PANEL (MISSING — MUST CREATE COMPLETELY)
========================================================

Create FULL ADMIN PANEL from scratch.

The current application is missing proper admin management.

Create professional admin experience similar to modern SaaS dashboards.

========================================================
ADMIN FEATURES
========================================================

Admin can:
- Add property
- Edit property
- Delete property
- View all properties
- Search properties
- Filter properties
- View leads
- Manage uploads
- View analytics overview

========================================================
ADMIN LAYOUT
========================================================

Create:
- Sidebar navigation
- Top navigation bar
- Dashboard overview cards
- Modern SaaS layout
- Mobile responsive admin panel

Sidebar:
- Dashboard
- Add Property
- Manage Properties
- Leads
- Uploads
- Settings

========================================================
ADMIN DASHBOARD
========================================================

Create dashboard cards:
- Total properties
- Total rentals
- Total sales
- Active listings
- Total leads
- Most viewed properties

Add:
- Charts
- Recent activity
- Recent uploads
- Recent leads

Dashboard should feel:
- Premium
- Modern SaaS
- Professional
- Dense but clean

========================================================
ADD PROPERTY PAGE
========================================================

VERY IMPORTANT PAGE.

Admin first selects:
- Sell
OR
- Rent

========================================================
IF SELL SELECTED
========================================================

Show:
- Sale price
- Ownership details
- Registration details
- Plot size
- Facing direction
- Amenities
- Photos upload
- Videos upload
- Brochure upload
- YouTube walkthrough URL
- Description
- Property location
- Property type
- Bedrooms
- Bathrooms

========================================================
IF RENT SELECTED
========================================================

Show:
- Monthly rent
- Security deposit
- Lease duration
- Furnishing
- Maintenance charges
- Tenant preferences
- Available from
- Photos upload
- Videos upload
- Brochure upload
- YouTube walkthrough URL
- Description

========================================================
UPLOAD SYSTEM
========================================================

Uploads should support:
- Drag/drop upload
- Multi-image upload
- Image previews
- Progress bars
- Mobile responsive upload UI

========================================================
PROPERTY MANAGEMENT PAGE
========================================================

Admin can:
- Search properties
- Edit property
- Delete property
- View property
- Filter properties
- Sort properties

Display:
- Table view
- Grid view
- Property status
- Property type
- Date added
- Views count

========================================================
LEADS MANAGEMENT PAGE
========================================================

Create leads management page.

When users:
- Download brochure
- Request details
- Contact owner

Store lead data.

Admin can:
- View leads
- Search leads
- Filter leads
- Export leads

========================================================
AWS AMPLIFY DEPLOYMENT REQUIREMENTS
========================================================

The ENTIRE application must deploy directly into AWS Amplify.

NO traditional database.

Use ONLY:
- AWS Amplify
- AWS S3
- JSON file storage

========================================================
DATA STORAGE ARCHITECTURE
========================================================

========================================================
DEV MODE
========================================================

If:
```js
env === "dev"