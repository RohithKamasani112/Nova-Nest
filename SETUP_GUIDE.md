# Real Estate Platform - Complete Setup & Usage Guide

## ✅ What's Included

This premium real estate application is now fully configured with:

- **Simplified Authentication**: Single hardcoded admin login
- **Dummy Data Seeding**: 8 pre-built property listings with optional visibility toggle
- **S3-Only Storage**: All data persists in AWS S3
- **Environment-Based Control**: Toggle dummy data on/off via `.env` flag

---

## 🔐 Admin Credentials

Default admin login (hardcoded for simplicity):

```
Email: demo@realestate.com
Password: Admin123!
```

No need for AWS Cognito setup!

---

## 📝 Environment Configuration

### Setting Up Your `.env` File

The `.env` file contains all configuration. Key variables:

```env
# AWS S3 Configuration (REQUIRED)
VITE_AWS_ACCESS_KEY_ID=your_actual_access_key
VITE_AWS_SECRET_ACCESS_KEY=your_actual_secret_key
VITE_AWS_REGION=us-east-1
VITE_S3_BUCKET_NAME=your-bucket-name
VITE_S3_FOLDER_NAME=properties

# Dummy Data Toggle
VITE_DUMMY_DATA=true    # Set to false to hide dummy data
```

⚠️ **Important**: Never commit your `.env` file with real AWS credentials!

---

## 🌱 Seeding Dummy Data

### Option 1: Via CLI Script (Recommended)

Run the seed script to upload 8 dummy properties to your S3 bucket:

```bash
npm run seed
```

This will:
1. Connect to your S3 bucket using `.env` credentials
2. Upload 8 realistic property listings
3. Confirm successful upload

**Output:**
```
🌱 Starting dummy data seed...

📤 Uploading 8 dummy properties to S3...

✅ Successfully seeded dummy data!

📋 Properties uploaded:
   1. Luxury Apartment in Downtown Mumbai (apartment)
   2. Modern Villa in Bangalore (villa)
   3. Cozy 1 BHK Apartment - Delhi NCR (apartment)
   4. Beachfront House in Goa (house)
   5. Commercial Plot in Pune (land)
   6. Spacious Penthouse in Delhi (apartment)
   7. Affordable Studio in Chennai (apartment)
   8. Resort-style Villa in Hyderabad (villa)

📝 Next steps:
   1. Set VITE_DUMMY_DATA=true in your .env file
   2. Restart your development server (npm run dev)
   3. Dummy properties will now be visible in the app
```

### Option 2: Automatic on App Startup

The app automatically seeds dummy data when starting up if:
1. `VITE_DUMMY_DATA=true` in `.env`
2. S3 bucket is accessible

---

## 🎯 Toggle Dummy Data Visibility

### Show Dummy Data:
```env
VITE_DUMMY_DATA=true
```

### Hide Dummy Data (Show Only Real Properties):
```env
VITE_DUMMY_DATA=false
```

After changing this flag:
1. Restart your dev server: `npm run dev`
2. Refresh the browser
3. Dummy properties will appear/disappear accordingly

---

## 🚀 Running the Application

### Development Mode:
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at: `http://localhost:5173/`

### Build for Production:
```bash
npm run build
```

---

## 🔄 Complete Workflow Example

### Step 1: Setup Environment
```bash
# Copy template
cp .env.example .env

# Edit .env with your AWS credentials
# VITE_AWS_ACCESS_KEY_ID=your_key
# VITE_AWS_SECRET_ACCESS_KEY=your_secret
# VITE_S3_BUCKET_NAME=your_bucket
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Seed Dummy Data
```bash
npm run seed
```

### Step 4: Start Development Server
```bash
npm run dev
```

### Step 5: Login to Admin Panel
1. Click "Admin Login" in the navbar
2. Enter credentials:
   - Email: `demo@realestate.com`
   - Password: `Admin123!`
3. Access the admin dashboard

### Step 6: View Dummy Data
1. Go to HomePage (click logo)
2. You'll see 8 dummy properties
3. To hide them, set `VITE_DUMMY_DATA=false` and restart

---

## 📊 Dummy Data Properties

8 pre-configured properties included:

| # | Title | Category | Status | Location |
|---|-------|----------|--------|----------|
| 1 | Luxury Apartment in Downtown Mumbai | Apartment | Buy | Mumbai |
| 2 | Modern Villa in Bangalore | Villa | Buy | Bangalore |
| 3 | Cozy 1 BHK Apartment - Delhi NCR | Apartment | Rent | Noida |
| 4 | Beachfront House in Goa | House | Buy | Goa |
| 5 | Commercial Plot in Pune | Land | Buy | Pune |
| 6 | Spacious Penthouse in Delhi | Apartment | Buy | Delhi |
| 7 | Affordable Studio in Chennai | Apartment | Rent | Chennai |
| 8 | Resort-style Villa in Hyderabad | Villa | Buy | Hyderabad |

All include:
- High-quality Unsplash images
- Detailed descriptions
- Complete amenities lists
- Realistic pricing
- Full property details

---

## 🛠️ Admin Features

### After Login:

**Dashboard**
- Total properties count
- Buy vs Rent breakdown
- Total leads received
- Recent activity

**Add Property**
- 6-step wizard interface
- Image upload to S3
- Full property details
- Amenities management

**Manage Properties**
- View all properties in table
- Search and filter
- Edit existing properties
- Delete properties with confirmation

**Leads Management**
- View all inquiries
- Filter by status and type
- Update inquiry status
- Export to CSV
- Real-time notifications

---

## 🔍 Data Architecture

### S3 Bucket Structure:
```
your-bucket/
├── data/
│   ├── properties.json      # All properties (real + dummy)
│   ├── leads.json           # All inquiries
│   └── images/              # Property images
│       ├── prop_1.jpg
│       ├── prop_2.jpg
│       └── ...
```

### Data Filtering Logic:
- **Properties**: If `VITE_DUMMY_DATA=true`, both real and dummy show. If `false`, only real properties show
- **Dummy Flag**: Each property has optional `isDummy: true` field
- **Visibility**: Controlled by `storageService.ts` - filters at retrieval time

---

## ⚡ Key Implementation Details

### Authentication (`authService.ts`)
- No AWS Cognito needed
- Hardcoded single admin user
- localStorage for session persistence
- Instant login (no API calls)

### Dummy Data (`seedService.ts`)
- 8 pre-configured property objects
- Environment flag toggles visibility
- Called via `npm run seed` CLI or app startup
- Stored in S3 like real properties

### Storage (`storageService.ts`)
- All data persists to S3
- No local JSON fallback
- Automatic dummy data filtering
- Lead tracking and management

### Seeding (`seed.mjs`)
- Standalone Node.js script
- Reads credentials from `.env`
- Uploads properties to S3
- Validates S3 connectivity

---

## 🐛 Troubleshooting

### "Cannot find package dotenv"
```bash
npm install
```

### "AWS credentials not found"
Make sure `.env` has:
- `VITE_AWS_ACCESS_KEY_ID`
- `VITE_AWS_SECRET_ACCESS_KEY`

### "S3 bucket not found"
Check `.env` for correct:
- `VITE_S3_BUCKET_NAME`
- `VITE_AWS_REGION`

### "Dummy data not visible"
1. Check `VITE_DUMMY_DATA=true` in `.env`
2. Restart dev server: `npm run dev`
3. Refresh browser: `Ctrl+Shift+R` (hard refresh)

### "Login fails"
Use exact credentials:
- Email: `demo@realestate.com` (case-sensitive)
- Password: `Admin123!` (exact match)

---

## 📱 User Workflows

### User Discovery Journey:
1. Land on homepage → see 8 dummy properties
2. Use filters (Buy/Rent, Price, Bedrooms)
3. Click property card → view full details
4. Submit inquiry → lead stored in S3
5. Receive confirmation toast

### Admin Management:
1. Login → dashboard overview
2. Add property → 6-step wizard
3. Manage properties → edit/delete
4. View leads → track inquiries
5. Export data → CSV download

---

## 🔒 Security Notes

- Admin credentials are hardcoded (for demo only)
- For production: implement proper auth
- `.env` file contains AWS credentials (never commit!)
- S3 CORS must be configured correctly
- All data stored server-side in S3

---

## 📦 File Structure

```
Real Estate Web Application/
├── src/
│   ├── services/
│   │   ├── authService.ts         # Simple hardcoded auth
│   │   ├── storageService.ts      # S3 storage + dummy filtering
│   │   └── seedService.ts         # Dummy data management
│   ├── pages/
│   │   ├── LoginPage.tsx          # Admin login
│   │   ├── HomePage.tsx           # Property discovery
│   │   ├── AdminPage.tsx          # Property creation
│   │   ├── AdminDashboardPage.tsx # Admin overview
│   │   └── ...
│   └── ...
├── seed.mjs                        # CLI seeding script
├── .env                            # Your configuration (git ignored)
├── .env.example                    # Template for .env
└── package.json
```

---

## 🎓 What You Can Do

✅ Login with hardcoded credentials
✅ View 8 dummy properties
✅ Add new properties (stored in S3)
✅ Edit/delete properties
✅ Track leads and inquiries
✅ Export leads to CSV
✅ Toggle dummy data visibility
✅ Upload property images to S3
✅ Search and filter properties
✅ View detailed property info

❌ Multiple users (single admin only)
❌ User registration
❌ Wishlist/favorites
❌ Real-time notifications
❌ Advanced analytics

---

## 📞 Support

For issues:
1. Check `.env` configuration
2. Verify AWS S3 access
3. Check browser console for errors
4. Ensure Vite dev server is running
5. Hard refresh browser (Ctrl+Shift+R)

---

**Happy Property Management! 🏠**
