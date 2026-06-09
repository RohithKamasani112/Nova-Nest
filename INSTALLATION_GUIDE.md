# 🚀 Complete Installation & Run Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation Steps](#installation-steps)
3. [Environment Setup](#environment-setup)
4. [Running the Application](#running-the-application)
5. [Building for Production](#building-for-production)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **Node.js**: Version 16.0 or higher (recommend 18+)
- **npm**: Version 8.0 or higher
- **Git**: For version control
- **AWS Account**: For S3 storage (free tier available)

### Check Your System

```bash
# Check Node.js version
node --version
# Should show: v18.x.x or higher

# Check npm version
npm --version
# Should show: 8.x.x or higher

# Check Git version
git --version
# Should show: git version 2.x.x or higher
```

### If You Need to Install Node.js

**Windows**:
```bash
# Download from: https://nodejs.org/
# Choose LTS version (recommended)
# Run installer and follow prompts
```

**macOS** (using Homebrew):
```bash
brew install node
```

**Linux** (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install nodejs npm
```

---

## Installation Steps

### Step 1: Navigate to Project Directory

```bash
# Windows
cd C:\Users\YourName\Downloads\Real\ Estate\ Web\ Application

# macOS/Linux
cd ~/Downloads/Real\ Estate\ Web\ Application

# Or use quotes
cd "Real Estate Web Application"
```

### Step 2: Install Dependencies

```bash
# Install all project dependencies
npm install

# This will download and install:
# - React 18
# - TypeScript
# - Tailwind CSS
# - AWS SDK
# - All other packages listed in package.json
# 
# Takes 2-5 minutes depending on internet speed
```

### Step 3: Verify Installation

```bash
# Check if node_modules folder was created
ls node_modules
# or on Windows: dir node_modules

# Check installed packages
npm list

# You should see React, Vite, TypeScript, etc.
```

---

## Environment Setup

### Step 1: Copy Environment Template

```bash
# Copy the template file
cp .env.example .env

# On Windows (PowerShell):
# Copy-Item .env.example .env
```

### Step 2: Get AWS Credentials

**Create AWS IAM User**:
1. Go to [AWS Console](https://console.aws.amazon.com)
2. Search for "IAM"
3. Click "Users" → "Create user"
4. Enter name: `property-app-dev`
5. Check: "Programmatic access"
6. Click "Next: Permissions"
7. Select "Attach existing policies directly"
8. Search and select: `AmazonS3FullAccess`
9. Click "Create user"
10. **SAVE your credentials!**:
    - Access Key ID
    - Secret Access Key

**Create S3 Bucket**:
1. Go to AWS Console → S3
2. Click "Create bucket"
3. Name: `property-app-dev` (must be unique)
4. Region: `us-east-1` (or your region)
5. Click "Create bucket"

### Step 3: Fill .env File

Open `.env` file and replace the values:

```env
# AWS S3 Configuration (REQUIRED)
VITE_AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
VITE_AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENGbPxRfiCYEXAMPLEKEY
VITE_AWS_REGION=us-east-1
VITE_S3_BUCKET_NAME=property-app-dev
VITE_S3_FOLDER_NAME=properties

# AWS Cognito (Optional - leave blank to use mock auth)
VITE_USER_POOL_ID=
VITE_USER_POOL_CLIENT_ID=

# Environment Mode
VITE_PRODUCTION=false
```

### Step 4: Enable CORS on S3 Bucket

```bash
# Create cors.json file
cat > cors.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:5173", "http://localhost:3000"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

# Apply CORS to your bucket
aws s3api put-bucket-cors \
  --bucket property-app-dev \
  --cors-configuration file://cors.json

# Verify CORS was set
aws s3api get-bucket-cors --bucket property-app-dev
```

**If you don't have AWS CLI installed**:

Use AWS Console instead:
1. Go to S3 → Your bucket → "Permissions" → "CORS"
2. Click "Edit"
3. Paste the JSON above
4. Click "Save"

### Step 5: Initialize S3 Data Files

```bash
# Create initial data files in S3 bucket

# Create properties.json (empty array)
echo "[]" > properties.json

# Create leads.json (empty array)
echo "[]" > leads.json

# Upload to S3 using AWS CLI
aws s3 cp properties.json s3://property-app-dev/properties.json
aws s3 cp leads.json s3://property-app-dev/leads.json

# Or use AWS Console:
# S3 → Your bucket → "Upload" → Select files → Upload
```

---

## Running the Application

### Option 1: Development Server (Recommended for Development)

```bash
# Start the development server
npm run dev

# Output:
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help

# Open browser and go to: http://localhost:5173
```

**What you'll see**:
- Homepage with hero section and property filters
- Property grid with featured properties
- Admin login option in top-right

### Option 2: With TypeScript Type Checking

```bash
# Check for TypeScript errors (optional)
npm run type-check

# Then start dev server
npm run dev
```

### Option 3: With Live Reload

```bash
# Vite automatically reloads on file changes
npm run dev

# Make a change to any file and save
# Browser will auto-refresh with changes
```

---

## Testing the Application

### Test 1: User Discovery Flow

1. **Open browser**: http://localhost:5173
2. **See homepage**:
   - Hero section with search bar
   - Filter chips (Apartment, Villa, House, etc.)
   - Property grid below
3. **Try filtering**:
   - Click "Buy" → see properties
   - Click "Rent" → see rental properties
   - Click "Explore" → see all properties
4. **Click a property card** → see full details
5. **Try lead capture**:
   - Click "Schedule Visit"
   - Fill form (name, email, phone)
   - Submit
   - See success message

### Test 2: Admin Panel

1. **Go to**: http://localhost:5173
2. **Click "Admin Login"** (top-right)
3. **Use demo credentials**:
   - Email: `demo@example.com`
   - Password: `password`
4. **You'll see Dashboard**:
   - Stats cards (Total Properties, For Sale, For Rent, Total Leads)
   - Recent properties table
   - Recent leads card
5. **Try adding property**:
   - Click "Add Property"
   - Follow 6-step wizard
   - Upload an image
   - Set price, bedrooms, amenities
   - Click "Publish"
6. **Check S3 Console**:
   - Go to AWS S3 → Your bucket
   - Verify `properties.json` was updated
   - Verify image was uploaded to `images/` folder

### Test 3: Mobile Responsive

```bash
# In Chrome DevTools:
# 1. Open browser
# 2. Press: Ctrl + Shift + M (or Cmd + Shift + M on Mac)
# 3. Choose different device sizes
# 4. Verify layout works on all sizes
```

---

## Building for Production

### Step 1: Build the Application

```bash
# Create optimized production build
npm run build

# Output:
# dist/
#   ├── index.html
#   ├── main.[hash].js
#   └── other files...
#
# Build size: ~350KB gzipped
```

### Step 2: Preview Build Locally

```bash
# Preview production build locally
npm run preview

# Opens on: http://localhost:4173
# Shows exactly what users will see
```

### Step 3: Deploy to Production

**Choose your platform**:

#### Option A: Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod

# Set environment variables in Netlify Dashboard:
# - VITE_AWS_ACCESS_KEY_ID
# - VITE_AWS_SECRET_ACCESS_KEY
# - VITE_S3_BUCKET_NAME
# - etc.
```

#### Option B: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Vercel will ask for environment variables during deployment
```

#### Option C: AWS Amplify
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

#### Option D: Docker (Self-hosted)
```bash
# Create Dockerfile (see DEPLOYMENT_GUIDE.md)

# Build Docker image
docker build -t property-app .

# Run container
docker run -p 80:80 property-app

# Opens on: http://localhost
```

---

## Complete Command Sequence

Here's the entire process from start to finish:

```bash
# ===== INSTALLATION =====

# 1. Navigate to project
cd "Real Estate Web Application"

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env

# ===== AWS SETUP (Manual) =====
# 1. Go to AWS Console
# 2. Create IAM user (get access key + secret)
# 3. Create S3 bucket
# 4. Enable CORS on bucket
# 5. Edit .env file with your credentials

# ===== INITIAL DATA SETUP =====

# Create data files
echo "[]" > properties.json
echo "[]" > leads.json

# Upload to S3 (using AWS CLI)
aws s3 cp properties.json s3://property-app-dev/
aws s3 cp leads.json s3://property-app-dev/

# ===== DEVELOPMENT =====

# Start dev server
npm run dev

# Open browser: http://localhost:5173

# ===== TESTING =====

# Test login: demo@example.com / password
# Test property creation: Add Property → Follow wizard
# Test image upload: Upload image → Check S3
# Test lead capture: Schedule Visit → Fill form

# ===== PRODUCTION BUILD =====

# Type check
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to your platform (Netlify/Vercel/AWS/Docker)
```

---

## Troubleshooting

### Problem: "npm: command not found"
**Solution**:
```bash
# Install Node.js from https://nodejs.org/
# Then restart terminal and try again
```

### Problem: "Cannot find module" errors
**Solution**:
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Problem: "Port 5173 already in use"
**Solution**:
```bash
# Use different port
npm run dev -- --port 3000

# Or kill process using port 5173
# Windows: netstat -ano | findstr :5173
# macOS: lsof -i :5173
# Linux: lsof -i :5173
```

### Problem: "S3 credentials error"
**Solution**:
```bash
# Check .env file
cat .env

# Verify credentials are copied exactly (no spaces)
# Restart dev server after editing .env
npm run dev

# Test S3 access
aws s3 ls --profile default
```

### Problem: "CORS error when uploading images"
**Solution**:
```bash
# Verify CORS is set on bucket
aws s3api get-bucket-cors --bucket property-app-dev

# If not set, apply CORS
aws s3api put-bucket-cors \
  --bucket property-app-dev \
  --cors-configuration file://cors.json

# Restart dev server and clear browser cache
```

### Problem: "Images not displaying"
**Solution**:
```bash
# Check S3 URL format: https://bucket.s3.region.amazonaws.com/key
# Verify image exists in S3 console
# Check bucket permissions allow public read (if needed)
```

### Problem: "Build fails with TypeScript errors"
**Solution**:
```bash
# Check for type errors
npm run type-check

# Fix errors shown
npm run build
```

---

## Useful Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run type-check      # Check TypeScript errors
npm run lint            # Run linter (if configured)

# Production
npm run build           # Build for production
npm run preview         # Preview production build

# Cleanup
npm run clean           # Remove node_modules and dist
npm install             # Reinstall dependencies

# Git
git status              # Check git status
git add .               # Stage all changes
git commit -m "message" # Commit changes
git push                # Push to remote

# AWS CLI
aws s3 ls              # List S3 buckets
aws s3 cp file.txt s3://bucket/  # Upload file
aws s3 sync . s3://bucket/        # Sync directory
```

---

## Environment Variables Quick Reference

```env
# Required for S3
VITE_AWS_ACCESS_KEY_ID=your-access-key
VITE_AWS_SECRET_ACCESS_KEY=your-secret-key
VITE_AWS_REGION=us-east-1
VITE_S3_BUCKET_NAME=property-app-dev

# Optional for Auth
VITE_USER_POOL_ID=cognito-pool-id
VITE_USER_POOL_CLIENT_ID=client-id

# Optional Mode
VITE_PRODUCTION=false
```

---

## Summary Checklist

- [ ] Node.js installed (v16+)
- [ ] Project folder opened in terminal
- [ ] `npm install` completed
- [ ] `.env.example` copied to `.env`
- [ ] AWS credentials added to `.env`
- [ ] S3 bucket created and CORS enabled
- [ ] Initial data files uploaded to S3
- [ ] `npm run dev` started successfully
- [ ] Browser opened to http://localhost:5173
- [ ] Admin login tested with demo credentials
- [ ] Property creation tested
- [ ] Image upload verified in S3

---

## Next Steps

1. ✅ Complete all steps above
2. ✅ Test application locally
3. ✅ Create real property listings
4. ✅ Test admin features
5. ✅ Read DEPLOYMENT_GUIDE.md for production
6. ✅ Deploy to your platform

---

**Your application is ready to run! 🚀**

Run `npm run dev` and open http://localhost:5173 in your browser.
