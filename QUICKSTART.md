# Quick Start Guide

Get your PremiumEstate application running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)

## Development Setup (Local Mode)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Development Server

```bash
pnpm dev
```

The app will open at `http://localhost:5173`

### 3. Login with Demo Account

**Email**: demo@realestate.com  
**Password**: Demo123!

OR

**Email**: demo@realestate.com  
**Password**: Admin123!

That's it! 🎉

## What You Get

### As a Regular User:
- ✅ Browse 8 sample properties
- ✅ Search and filter properties
- ✅ View property details with image galleries
- ✅ Contact property owners
- ✅ Schedule property visits
- ✅ Save favorites

### As an Admin User (demo@realestate.com):
- ✅ All user features
- ✅ Access to Admin Panel
- ✅ Add new properties
- ✅ Edit existing properties
- ✅ Delete properties
- ✅ Upload images with drag & drop

## Key Features to Test

### 1. Browse Properties
- Click "Properties" in navbar
- Try the search bar
- Use filters (bedrooms, price, amenities)
- Sort by price or date

### 2. View Property Details
- Click any property card
- Browse image gallery
- Click images for fullscreen view
- Try "Contact Owner" and "Schedule Visit"

### 3. Admin Panel (admin account only)
- Click "Admin Panel" in navbar
- Click "Add Property" button
- Drag & drop images
- Fill in property details
- Submit to create a new listing
- Edit or delete existing properties

### 4. Search & Filter
- Use the hero search bar on home page
- Toggle between "Buy" and "Rent"
- Enter a location (e.g., "New York", "Miami")
- Set max price
- Click "Search"

### 5. Authentication
- Click "Sign In" to see login page
- Try creating a new account
- Log out and log back in

## Sample Data

The app comes with 8 pre-loaded properties:
1. Luxury Modern Villa - Malibu ($2.5M)
2. Downtown Penthouse - Manhattan ($4.5K/mo)
3. Charming Suburban House - Austin ($850K)
4. Modern Loft - Los Angeles ($3.2K/mo)
5. Beachfront Condo - Miami Beach ($1.25M)
6. Cozy Studio - Boston ($1.8K/mo)
7. Mediterranean Estate - Napa Valley ($5.5M)
8. Contemporary Townhouse - Charlotte ($675K)

## Project Structure

```
src/
├── app/
│   ├── components/      # Reusable components
│   └── App.tsx          # Main app
├── pages/               # Page components
│   ├── HomePage.tsx
│   ├── PropertiesPage.tsx
│   ├── PropertyDetailsPage.tsx
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   └── AdminPage.tsx
├── services/            # Business logic
├── utils/               # Helper functions
└── types/               # TypeScript types
```

## Local Development Features

In local development mode (`VITE_PRODUCTION=false`):
- ✅ Data stored in browser localStorage
- ✅ No AWS setup required
- ✅ Mock authentication (no Cognito needed)
- ✅ Images stored as base64
- ✅ Fast and easy to test

## Common Actions

### Create a New User
1. Click "Sign In"
2. Click "Create Account"
3. Fill in details
4. Click "Create Account"
5. You're logged in!

### Add a Property (Admin)
1. Login as admin
2. Click "Admin Panel"
3. Click "Add Property"
4. Upload images (drag & drop)
5. Fill in all required fields
6. Click "Create Property"

### Make a User an Admin
1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Find key starting with `estate_users.json`
4. Edit the JSON and change `"role": "user"` to `"role": "admin"`
5. Refresh the page
6. Log out and log back in

### Clear All Data
```javascript
// In browser console
localStorage.clear();
location.reload();
```

## Environment Variables

For local development, these are already set in `.env`:

```env
VITE_PRODUCTION=false
```

For production deployment, see `DEPLOYMENT.md`

## Next Steps

### Want to Deploy?
Read `DEPLOYMENT.md` for complete AWS Amplify deployment guide.

### Want to Customize?
Read `README.md` for:
- Adding new amenities
- Changing color scheme
- Adding property fields
- Customization options

### Want AWS Integration?
1. Set up AWS S3 bucket
2. Set up AWS Cognito user pool
3. Update `.env` with AWS credentials
4. Set `VITE_PRODUCTION=true`
5. Restart dev server

## Troubleshooting

### Port 5173 already in use?
```bash
# Kill the process
lsof -ti:5173 | xargs kill -9

# Or use a different port
pnpm dev --port 3000
```

### Can't login?
- Use exact credentials: `demo@realestate.com` / `Demo123!`
- Check browser console for errors
- Clear localStorage and try again

### Properties not showing?
- Check `public/storage/properties.json` exists
- Check browser console for errors
- Clear cache and reload

### Images not loading?
- Images use Unsplash URLs (requires internet)
- Check internet connection
- Try different images when adding properties

## Tips & Tricks

1. **Quick Admin Access**: Bookmark the admin panel for easy access
2. **Test Data**: The sample properties cover different scenarios (buy/rent, different price ranges)
3. **Reset Data**: Clear localStorage to reset to initial state
4. **Browser Tools**: Use React DevTools to inspect components
5. **Hot Reload**: Save files and see changes instantly

## Support

- Check `README.md` for detailed documentation
- Check `DEPLOYMENT.md` for deployment help
- Open an issue on GitHub for bugs
- Review code comments for implementation details

## What's Next?

After playing with the local version:
1. ⭐ Star the repository
2. 🚀 Deploy to AWS Amplify
3. 🎨 Customize the design
4. 📱 Add new features
5. 🌍 Share with others

---

Happy coding! 🏠✨
