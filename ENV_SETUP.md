# Environment Setup Guide

This guide will help you set up your environment variables for local development and production.

## ⚠️ IMPORTANT: Security First

**NEVER commit `.env` files to git!** They contain sensitive credentials.

The `.gitignore` file already prevents this, but always verify before committing:
```bash
git status  # Check no .env files are staged
```

## 📋 Quick Setup

### Step 1: Copy the Template
```bash
cp .env.example .env
```

### Step 2: Get Your AWS Credentials

#### For S3 Access:
1. Go to AWS Console → IAM → Users
2. Click "Create user"
3. Select "Access key - Programmatic access"
4. Attach policy: `AmazonS3FullAccess`
5. Save the Access Key ID and Secret Key

#### For S3 Bucket:
1. Go to AWS Console → S3
2. Create new bucket (e.g., `property-app-dev`)
3. Enable CORS (see below)
4. Note the bucket name

#### Enable S3 CORS:
```bash
# Create cors.json file with:
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000", "http://localhost:5173"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}

# Apply to bucket:
aws s3api put-bucket-cors \
  --bucket your-bucket-name \
  --cors-configuration file://cors.json
```

### Step 3: Fill in Your .env File

```env
# AWS S3 (REQUIRED)
VITE_AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
VITE_AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
VITE_AWS_REGION=us-east-1
VITE_S3_BUCKET_NAME=property-app-dev
VITE_S3_FOLDER_NAME=dev

# AWS Cognito (OPTIONAL - uses mock auth if not set)
VITE_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx

# Development Mode
VITE_PRODUCTION=false
```

### Step 4: Verify Setup

```bash
# Start development server
npm run dev

# Test S3 connection by:
# 1. Upload an image in admin property creation
# 2. Check S3 console for uploaded file
```

## 🔐 Environment Variables Explained

### Required for S3 Storage
- **VITE_AWS_ACCESS_KEY_ID**: Your AWS access key
- **VITE_AWS_SECRET_ACCESS_KEY**: Your AWS secret key
- **VITE_AWS_REGION**: AWS region (default: us-east-1)
- **VITE_S3_BUCKET_NAME**: S3 bucket name
- **VITE_S3_FOLDER_NAME**: Folder prefix in bucket (optional, default: properties)

### Optional (Auth)
- **VITE_USER_POOL_ID**: AWS Cognito user pool ID
- **VITE_USER_POOL_CLIENT_ID**: AWS Cognito app client ID

If not set, app uses mock authentication:
```
Email: demo@example.com
Password: password
```

### Optional (Branding)
- **VITE_APP_NAME**: Application name
- **VITE_API_BASE_URL**: Backend API endpoint (future use)
- **VITE_IMAGE_CDN_URL**: CDN for images (future use)

### Mode Flag
- **VITE_PRODUCTION**: Set to "true" for production (validates all credentials)

## 🚀 Development Workflow

### Local Development (.env)
```env
VITE_AWS_ACCESS_KEY_ID=dev_key
VITE_AWS_SECRET_ACCESS_KEY=dev_secret
VITE_S3_BUCKET_NAME=property-app-dev
VITE_PRODUCTION=false
```

### Production Deployment
Create separate `.env.production` (in your deploy environment):
```env
VITE_AWS_ACCESS_KEY_ID=prod_key
VITE_AWS_SECRET_ACCESS_KEY=prod_secret
VITE_S3_BUCKET_NAME=property-app-prod
VITE_PRODUCTION=true
```

## 🐛 Troubleshooting

### "Access Denied" When Uploading Images
```bash
# Check IAM permissions:
aws iam get-user-policy \
  --user-name your-user \
  --policy-name your-policy

# Policy should have s3:PutObject permission
```

### "NoSuchBucket" Error
```bash
# Verify bucket exists and name is correct:
aws s3 ls

# Bucket name must match exactly: property-app-dev (case-sensitive)
```

### "CORS Error" In Browser
```bash
# Verify CORS is set on bucket:
aws s3api get-bucket-cors --bucket your-bucket-name

# If not set, apply cors.json as shown above
```

### ".env Not Loading"
```bash
# Restart dev server:
Ctrl+C

# Then:
npm run dev

# Vite loads .env at startup only
```

## 📝 For Team Members

When onboarding new developers:

1. **Never share .env file** - each dev has their own
2. **Use .env.example** as template
3. **Document in team wiki** any custom credentials needed
4. **Use 1Password/LastPass** for secure credential sharing
5. **Rotate keys quarterly** for security

## 🔑 AWS Best Practices

1. ✅ Use separate AWS accounts for dev/prod
2. ✅ Rotate access keys annually
3. ✅ Use MFA on console login
4. ✅ Limit IAM permissions to minimum needed
5. ✅ Never hardcode credentials in code
6. ✅ Use separate S3 bucket per environment
7. ✅ Enable S3 versioning for safety
8. ✅ Set up CloudTrail for audit logging

## 🛡️ Security Checklist

- [ ] .env file is in .gitignore
- [ ] No .env committed to git
- [ ] AWS credentials are not shared
- [ ] Access keys rotated recently
- [ ] IAM user has minimal permissions
- [ ] S3 bucket has CORS configured
- [ ] Bucket is not publicly accessible
- [ ] Different credentials for dev/prod
- [ ] Team uses secure credential sharing
- [ ] Regular security audits performed

## 📞 Support

If you have issues:
1. Check error message in browser console
2. Review AWS credentials are correct
3. Verify S3 bucket exists and CORS is set
4. Check IAM permissions include s3:*
5. Restart dev server after changing .env

See `DEPLOYMENT_GUIDE.md` for more detailed troubleshooting.

---

**Happy developing! 🚀**
