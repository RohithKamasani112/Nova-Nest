# PremiumEstate - Modern Real Estate Platform

A premium, full-featured real estate web application built with React, TypeScript, Tailwind CSS, AWS Amplify, and S3. Features an Airbnb-inspired UI with advanced property search, filtering, authentication, and admin capabilities.

## Features

### User Features
- 🏠 **Property Listings**: Browse beautiful properties with high-quality images
- 🔍 **Advanced Search**: Filter by location, price, bedrooms, amenities, and more
- ⭐ **Favorites**: Save properties for later viewing
- 📱 **Responsive Design**: Perfect experience on all devices
- 🎨 **Premium UI**: Airbnb/Zillow-inspired modern interface
- 🔐 **Authentication**: Secure login with AWS Cognito
- 📧 **Contact Forms**: Inquire about properties and schedule visits
- 🎥 **Video Walkthroughs**: YouTube integration for property tours
- 📄 **Brochure Downloads**: Download property details as PDF

### Admin Features
- ➕ **Add Properties**: Create new listings with ease
- ✏️ **Edit Properties**: Update existing property information
- 🗑️ **Delete Properties**: Remove outdated listings
- 📸 **Image Upload**: Drag & drop multiple images
- ✅ **Property Verification**: Mark properties as verified
- ⭐ **Featured Listings**: Highlight premium properties

### Technical Features
- 🌐 **Dual Storage**: Local development + AWS S3 production
- 🔄 **Auto-switching**: Environment-based storage selection
- 🚀 **AWS Amplify**: Easy deployment and hosting
- 🔒 **AWS Cognito**: Enterprise-grade authentication
- 💾 **JSON Storage**: Simple, flexible data management
- 🎬 **Smooth Animations**: Framer Motion for premium feel

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS v4
- **Build Tool**: Vite
- **Animations**: Framer Motion
- **Authentication**: AWS Amplify + Cognito
- **Storage**: AWS S3 (production) + Local JSON (development)
- **UI Components**: Custom components + Lucide icons
- **Forms**: React Hook Form + React Dropzone
- **Notifications**: React Hot Toast

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── PropertyCard.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Navbar.tsx
│   │   └── App.tsx              # Main app component
│   ├── pages/                   # Page components
│   │   ├── HomePage.tsx
│   │   ├── PropertiesPage.tsx
│   │   ├── PropertyDetailsPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   └── AdminPage.tsx
│   ├── contexts/                # React contexts
│   │   └── AuthContext.tsx
│   ├── services/                # Business logic
│   │   ├── storageService.ts   # Unified storage API
│   │   └── authService.ts      # Authentication logic
│   ├── utils/                   # Utility functions
│   │   ├── config.ts            # Environment config
│   │   ├── s3Helper.ts          # S3 operations
│   │   └── localStorageHelper.ts
│   └── types/                   # TypeScript types
│       └── index.ts
├── public/
│   └── storage/                 # Local JSON storage
│       ├── properties.json
│       └── users.json
└── .env                         # Environment variables
```

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- AWS Account (for production deployment)
- AWS Amplify CLI (optional, for Cognito setup)

### Local Development

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd code
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Configure environment**
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_PRODUCTION=false
# Leave AWS credentials empty for local development
```

4. **Start development server**
```bash
pnpm dev
```

5. **Open your browser**
Navigate to `http://localhost:5173`

### Demo Credentials

For testing authentication:
- **Email**: demo@realestate.com
- **Password**: Demo123!

OR

- **Email**: admin@realestate.com
- **Password**: Admin123!

## Environment Configuration

### Local Development (VITE_PRODUCTION=false)
- Uses localStorage for data persistence
- Uses mock authentication
- Images stored as base64 in localStorage
- No AWS credentials required

### Production (VITE_PRODUCTION=true)
- Uses AWS S3 for storage
- Uses AWS Cognito for authentication
- Requires AWS credentials
- Production-ready scalability

## AWS Setup

### 1. Create S3 Bucket

```bash
aws s3 mb s3://your-bucket-name --region us-east-1
```

Configure CORS:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

### 2. Set up AWS Cognito

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Add authentication
amplify add auth

# Push to AWS
amplify push
```

Or manually create a Cognito User Pool:
1. Go to AWS Cognito Console
2. Create a new User Pool
3. Configure sign-in options (Email)
4. Create an App Client
5. Copy User Pool ID and Client ID

### 3. Configure Environment Variables

Update `.env`:
```env
VITE_PRODUCTION=true

# S3 Configuration
VITE_AWS_ACCESS_KEY_ID=your_access_key
VITE_AWS_SECRET_ACCESS_KEY=your_secret_key
VITE_AWS_REGION=us-east-1
VITE_S3_BUCKET_NAME=your-bucket-name
VITE_S3_FOLDER_NAME=properties

# Cognito Configuration
VITE_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxx
VITE_AWS_COGNITO_REGION=us-east-1
```

### 4. Initialize S3 Data

Upload initial data files to S3:
```bash
aws s3 cp public/storage/properties.json s3://your-bucket-name/properties/properties.json
aws s3 cp public/storage/users.json s3://your-bucket-name/properties/users.json
```

## Deployment to AWS Amplify

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

2. **Create Amplify App**
- Go to AWS Amplify Console
- Click "New app" → "Host web app"
- Connect your GitHub repository
- Select the repository and branch

3. **Configure Build Settings**

Amplify will auto-detect Vite. Verify build settings:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install -g pnpm
        - pnpm install
    build:
      commands:
        - pnpm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

4. **Add Environment Variables**

In Amplify Console → App settings → Environment variables:
```
VITE_PRODUCTION=true
VITE_AWS_ACCESS_KEY_ID=<your-key>
VITE_AWS_SECRET_ACCESS_KEY=<your-secret>
VITE_AWS_REGION=us-east-1
VITE_S3_BUCKET_NAME=<your-bucket>
VITE_S3_FOLDER_NAME=properties
VITE_USER_POOL_ID=<your-pool-id>
VITE_USER_POOL_CLIENT_ID=<your-client-id>
VITE_AWS_COGNITO_REGION=us-east-1
```

5. **Deploy**
- Click "Save and deploy"
- Amplify will build and deploy your app
- Access via the provided URL

### Method 2: Manual Deployment

1. **Build the app**
```bash
pnpm run build
```

2. **Deploy to Amplify**
```bash
amplify init
amplify add hosting
amplify publish
```

## Admin Access

To access the admin panel:
1. Create a user account
2. Manually update the user's role in `users.json`:
```json
{
  "id": "user_xxx",
  "role": "admin"  // Change from "user" to "admin"
}
```
3. Log out and log back in
4. Admin panel button will appear in navbar

## Features Breakdown

### Property Management
- Full CRUD operations
- Multi-image upload with preview
- Drag & drop interface
- Auto-save capabilities
- Real-time updates

### Search & Filters
- Text search across title, location, description
- Price range filter
- Bedrooms/bathrooms filter
- Property type filter
- Amenities filter
- Area (sqft) filter
- Sort by price, date, area
- Featured/verified toggles

### Authentication
- Email/password authentication
- Mock auth for development
- AWS Cognito for production
- Protected routes
- Session persistence
- User profile management

### Property Details
- Image gallery with fullscreen mode
- Property information
- Amenities list
- Location display
- Contact owner form
- Schedule visit form
- YouTube video integration
- Brochure download

## Customization

### Adding New Amenities
Edit `src/app/components/FilterBar.tsx`:
```typescript
const amenities = [
  'Pool', 'Gym', 'Parking', 'Garden',
  'Your New Amenity' // Add here
];
```

### Changing Color Scheme
Update Tailwind classes:
- Primary: `blue-600` → `your-color`
- Gradients: `from-blue-600 to-blue-500`
- Accents: Update in components

### Adding Property Fields
1. Update `src/types/index.ts`
2. Update `src/pages/AdminPage.tsx` form
3. Update `PropertyCard` and `PropertyDetailsPage`
4. Update sample data in `public/storage/properties.json`

## Performance Optimization

- ✅ Lazy loading images
- ✅ Optimized bundle with Vite
- ✅ Minimal re-renders with React
- ✅ Efficient state management
- ✅ Cached AWS credentials
- ✅ Compressed images on upload

## Security

- ✅ Environment variables for secrets
- ✅ AWS IAM for access control
- ✅ HTTPS enforced
- ✅ Input validation
- ✅ XSS protection
- ✅ CORS configuration

## Troubleshooting

### Images not loading
- Check S3 bucket permissions
- Verify CORS configuration
- Check AWS credentials

### Authentication fails
- Verify Cognito pool IDs
- Check environment variables
- Ensure user pool is active

### Build errors
- Clear node_modules: `rm -rf node_modules && pnpm install`
- Clear cache: `pnpm store prune`
- Check Node.js version: `node -v` (should be 18+)

### Storage not working
- Verify `VITE_PRODUCTION` setting
- Check browser localStorage (dev mode)
- Verify S3 bucket access (prod mode)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use for personal or commercial projects.

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review AWS documentation for Amplify/S3/Cognito

## Roadmap

- [ ] Map integration for property locations
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] Saved searches
- [ ] Property comparisons
- [ ] Virtual tours (360°)
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Dark mode

---

Built with ❤️ using React, TypeScript, and AWS
