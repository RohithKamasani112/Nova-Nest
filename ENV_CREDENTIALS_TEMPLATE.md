# Development Environment - Sample Credentials

This file shows example values for environment variables. 
**DO NOT use these in production!**

## Development Setup

Create a `.env` file in the project root with the following format:

```env
# ==========================================
# AWS S3 Configuration (REQUIRED)
# ==========================================
# Your AWS Access Key ID
# Get from: AWS Console → IAM → Users → Your User → Security Credentials
VITE_AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE

# Your AWS Secret Access Key
# Get from: AWS Console → IAM → Users → Your User → Security Credentials
VITE_AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# AWS Region
# Common values: us-east-1, us-west-2, eu-west-1, ap-south-1
VITE_AWS_REGION=us-east-1

# S3 Bucket Name
# Create in AWS Console → S3 → Create Bucket
# Use lowercase with hyphens: my-property-app-dev
VITE_S3_BUCKET_NAME=my-property-app-dev

# S3 Folder Prefix (optional, defaults to 'properties')
# Data will be stored at: s3://bucket/folder/properties.json
VITE_S3_FOLDER_NAME=properties


# ==========================================
# AWS Cognito Configuration (OPTIONAL)
# ==========================================
# Only needed if using real AWS Cognito auth
# If not set, app will use mock authentication

# Cognito User Pool ID
# Get from: AWS Console → Cognito → User Pools → Your Pool → General Settings
VITE_USER_POOL_ID=us-east-1_xxxxxxxxx

# Cognito App Client ID
# Get from: AWS Console → Cognito → User Pools → Your Pool → App Integration → App Clients
VITE_USER_POOL_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j

# Cognito Region (optional, defaults to us-east-1)
VITE_AWS_COGNITO_REGION=us-east-1


# ==========================================
# Environment Mode
# ==========================================
# Set to 'true' for production (validates all credentials)
# Set to 'false' for development (allows mock data)
VITE_PRODUCTION=false


# ==========================================
# Optional: Branding & URLs
# ==========================================
# Application name for branding
VITE_APP_NAME=My-Properties

# Backend API endpoint (for future use)
VITE_API_BASE_URL=https://api.yourdomain.com

# CDN URL for images (for future use)
VITE_IMAGE_CDN_URL=https://cdn.yourdomain.com
```

## Getting Your AWS Credentials

### Step 1: Create IAM User
1. Go to [AWS Console](https://console.aws.amazon.com)
2. Navigate to **IAM** → **Users**
3. Click **Create user**
4. Enter username: `property-app-dev`
5. Check: **Access key - Programmatic access**
6. Click **Next**

### Step 2: Set Permissions
1. Select **Attach existing policies directly**
2. Search and select: `AmazonS3FullAccess`
3. Click **Next** → **Create user**

### Step 3: Save Credentials
You'll see:
- **Access Key ID** → Copy to `VITE_AWS_ACCESS_KEY_ID`
- **Secret Access Key** → Copy to `VITE_AWS_SECRET_ACCESS_KEY`

⚠️ **Important**: Save these immediately! You won't be able to see the secret key again.

### Step 4: Create S3 Bucket
1. Go to **S3** → **Create bucket**
2. Name: `property-app-dev` (must be unique)
3. Region: `us-east-1` (or your preferred region)
4. Copy bucket name to `VITE_S3_BUCKET_NAME`
5. Copy region to `VITE_AWS_REGION`

### Step 5: Enable CORS on Bucket
1. Go to **S3** → Your bucket → **Permissions** → **CORS**
2. Add this configuration:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE"
        ],
        "AllowedOrigins": [
            "http://localhost:5173",
            "http://localhost:3000"
        ],
        "ExposeHeaders": [],
        "MaxAgeSeconds": 3000
    }
]
```

## Mock Authentication (Default)

If you don't set `VITE_USER_POOL_ID` and `VITE_USER_POOL_CLIENT_ID`, the app uses mock auth:

```
Email:    demo@example.com
Password: password
```

This is perfect for local development!

## Testing Your Setup

### Test 1: S3 Connection
```bash
# Run dev server
npm run dev

# Open browser → Admin Login
# Use: demo@example.com / password

# Go to: Add Property
# Upload an image

# Check AWS Console → S3 → Your bucket
# You should see the image in images/ folder
```

### Test 2: Data Persistence
```bash
# Create a property in admin panel
# Refresh the page
# Property should still be there (persisted to S3)
```

### Test 3: Lead Creation
```bash
# Go to any property
# Click "Schedule Visit"
# Fill form and submit
# Check S3 → leads.json should exist
```

## Troubleshooting

### Error: "Access Denied"
- Check AWS credentials are copied correctly
- Verify IAM user has `AmazonS3FullAccess` policy
- Wait 5 minutes after creating IAM user (takes time to propagate)

### Error: "NoSuchBucket"
- Verify bucket name in `.env` matches exactly
- Check bucket exists in AWS S3 console
- Bucket names are case-sensitive and global

### Error: "CORS policy error"
- Verify CORS configuration is set on bucket (see Step 5 above)
- Restart dev server after setting CORS
- Clear browser cache (Ctrl+Shift+Delete)

### Images Not Uploading
- Check browser console for specific error
- Verify bucket CORS is configured correctly
- Check IAM user has `s3:PutObject` permission

## Important Notes

### Development
- Use development AWS account
- Use test bucket (`property-app-dev`)
- Use mock authentication
- No restrictions on bucket/permissions

### Production
- Use production AWS account
- Use production bucket (`property-app-prod`)
- Use real AWS Cognito authentication
- Restrict bucket access and permissions
- Enable encryption and versioning
- Set up CloudTrail for audit logging
- Use separate IAM user per environment

### Security
- Never commit `.env` file to git
- Never share AWS credentials via email/chat
- Rotate access keys annually
- Use MFA on console login
- Delete unused access keys
- Grant minimum necessary permissions

---

**For complete setup instructions, see `ENV_SETUP.md`**
