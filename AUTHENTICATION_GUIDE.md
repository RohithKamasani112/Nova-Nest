# Authentication & Dummy Data Guide

## Overview

This application uses a simplified authentication system with environment-based dummy data toggling. No AWS Cognito setup required!

---

## 🔐 Authentication System

### How It Works

1. **No AWS Cognito**: Removed all Cognito dependencies
2. **Hardcoded Credentials**: Single admin user built directly into the code
3. **Local Storage**: Session persists across page refreshes
4. **Zero Configuration**: Just login and go!

### Admin Credentials

```
Email: demo@realestate.com
Password: Admin123!
```

### Login Flow

```
User enters credentials
    ↓
authService.ts validates against hardcoded values
    ↓
If valid → creates AuthUser object & stores in localStorage
    ↓
AuthContext updates & displays dashboard
    ↓
If invalid → shows error toast with helpful message
```

### Key Files

**`src/services/authService.ts`** - Authentication logic
- `login()`: Validates credentials
- `logout()`: Clears localStorage
- `getCurrentAuthUser()`: Retrieves stored session
- Hardcoded admin: `demo@realestate.com` / `Admin123!`

**`src/contexts/AuthContext.tsx`** - React context provider
- Wraps entire app with auth state
- Provides `useAuth()` hook for components
- Handles login/logout/session management

**`src/pages/LoginPage.tsx`** - Admin login UI
- Email and password inputs
- "Show password" toggle
- Desktop and mobile responsive
- Success/error notifications

---

## 🌱 Dummy Data System

### What Is Dummy Data?

8 pre-configured property listings with realistic details:
- Luxury apartments, villas, houses, land, studios
- Various Indian locations (Mumbai, Bangalore, Goa, Delhi, etc.)
- High-quality Unsplash images
- Complete amenities and details
- Mix of buy and rent properties

### Why Dummy Data?

- **Demo purposes**: Show clients what the app looks like with data
- **Testing**: Test filters, search, and property details
- **Showcase**: Populate the app instantly without manual entry
- **Toggle on/off**: Easy to hide before production

### How Dummy Data Works

**1. Definition** (`src/services/seedService.ts`)
```typescript
const dummyProperties: Property[] = [
  {
    id: 'dummy_1',
    title: 'Luxury Apartment in Downtown Mumbai',
    price: 25000000,
    images: [...],
    // ... full property details
    isDummy: true  // ← marked as dummy
  },
  // ... 7 more properties
]
```

**2. Seeding** (`seed.mjs`)
```bash
npm run seed
# Uploads 8 properties to S3
```

**3. Filtering** (`src/services/storageService.ts`)
```typescript
if (!DUMMY_DATA_ENABLED) {
  return properties.filter(p => !p.isDummy)
}
// Returns all properties if DUMMY_DATA_ENABLED = true
```

**4. Control** (`.env`)
```env
VITE_DUMMY_DATA=true   # Show dummy properties
VITE_DUMMY_DATA=false  # Hide dummy properties
```

### The 8 Dummy Properties

| # | Title | Category | Status | Price | Location |
|---|-------|----------|--------|-------|----------|
| 1 | Luxury Apartment in Downtown Mumbai | Apartment | Buy | ₹2.5Cr | Bandra |
| 2 | Modern Villa in Bangalore | Villa | Buy | ₹3.5Cr | Whitefield |
| 3 | Cozy 1 BHK Apartment - Delhi NCR | Apartment | Rent | ₹45K | Noida |
| 4 | Beachfront House in Goa | House | Buy | ₹5.5Cr | Calangute |
| 5 | Commercial Plot in Pune | Land | Buy | ₹50L | Hinjewadi |
| 6 | Spacious Penthouse in Delhi | Apartment | Buy | ₹4.5Cr | Lutyens |
| 7 | Affordable Studio in Chennai | Apartment | Rent | ₹30K | T. Nagar |
| 8 | Resort-style Villa in Hyderabad | Villa | Buy | ₹2.8Cr | Jubilee Hills |

---

## 🚀 Quick Setup

### Step 1: Configure `.env`

```env
# AWS S3 (Required)
VITE_AWS_ACCESS_KEY_ID=your_key
VITE_AWS_SECRET_ACCESS_KEY=your_secret
VITE_S3_BUCKET_NAME=your_bucket

# Dummy Data (Optional)
VITE_DUMMY_DATA=true
```

### Step 2: Install & Run

```bash
npm install
npm run dev
```

### Step 3: Login

```
Email: demo@realestate.com
Password: Admin123!
```

### Step 4: Seed Dummy Data (Optional)

```bash
npm run seed
```

---

## 📋 Authentication Types Implemented

### Type: AuthUser
```typescript
interface AuthUser {
  id: string;           // 'admin_001'
  email: string;        // 'demo@realestate.com'
  name: string;         // 'Admin User'
  accessToken?: string; // Optional for future use
}
```

### Type: LoginCredentials
```typescript
interface LoginCredentials {
  email: string;
  password: string;
}
```

### Type: SignupCredentials
```typescript
interface SignupCredentials {
  email: string;
  password: string;
  name: string;
  phone?: string;
}
```

---

## 🔄 Session Management

### Persistence

```typescript
// On successful login
localStorage.setItem('estate_auth_user', JSON.stringify(authUser))

// On logout
localStorage.removeItem('estate_auth_user')

// On app start
const stored = localStorage.getItem('estate_auth_user')
if (stored) restore session
```

### Session Flow

```
App Starts
    ↓
AuthProvider checks localStorage
    ↓
Found stored user? → Auto-login, show dashboard
    ↓
No stored user? → Show login page
```

---

## 🎯 Use Cases

### Scenario 1: Viewing Dummy Properties
```
1. Set VITE_DUMMY_DATA=true
2. npm run dev
3. Visit http://localhost:5173
4. See 8 properties on homepage
5. Click any property for details
```

### Scenario 2: Adding Real Properties
```
1. Login (demo@realestate.com / Admin123!)
2. Go to Admin → Add Property
3. Fill 6-step form
4. Upload images (stored in S3)
5. Property stored in S3 (not marked as dummy)
6. Shows on homepage alongside dummy properties
```

### Scenario 3: Before Production Deploy
```
1. Set VITE_DUMMY_DATA=false
2. Dummy properties hidden
3. Only real properties visible
4. Deploy to production
```

---

## 🔐 Security Considerations

### Current Implementation
- ✅ Single hardcoded admin user
- ✅ localStorage for session
- ✅ Basic validation
- ✅ AWS credentials in .env (git-ignored)

### For Production
- ❌ Don't use hardcoded credentials
- ❌ Don't store passwords in code
- ⚠️ Consider implementing:
  - JWT tokens
  - Refresh token rotation
  - HTTPS only
  - Secure HTTP-only cookies
  - Multi-factor authentication
  - OAuth2/OpenID Connect

---

## 🐛 Troubleshooting

### Login fails with "Invalid email or password"
- Check exact credentials:
  - Email: `demo@realestate.com` (lowercase)
  - Password: `Admin123!` (exact case)

### Dummy properties don't show
1. Check `.env` has `VITE_DUMMY_DATA=true`
2. Restart dev server: `npm run dev`
3. Hard refresh browser: `Ctrl+Shift+R`

### Session lost after refresh
1. Check browser localStorage not disabled
2. Check `.env` saved correctly
3. Check no errors in browser console

### Seed script fails
1. Verify AWS credentials in `.env`
2. Check S3 bucket exists
3. Check S3 bucket CORS configuration
4. Run: `npm install` (ensure dotenv installed)

---

## 📚 Related Documentation

- `SETUP_GUIDE.md` - Complete setup instructions
- `QUICK_START.md` - 3-minute quick start
- `INSTALLATION_GUIDE.md` - Detailed installation
- `.env.example` - Environment template

---

**Happy building! 🚀**
