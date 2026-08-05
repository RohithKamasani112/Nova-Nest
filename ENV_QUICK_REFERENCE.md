# 🔐 Environment Setup - Quick Reference Card

## Files Created

✅ `.env.example` - Template (safe to commit, share with team)
✅ `.gitignore` - Protection (prevents .env being committed)
✅ `ENV_SETUP.md` - Complete setup guide (read this first!)
✅ `ENV_CREDENTIALS_TEMPLATE.md` - Variable reference guide
✅ `ENV_CONFIGURATION_SUMMARY.md` - Overview of all env files

---

## Getting Started (5 Minutes)

### 1. Copy Template
```bash
cp .env.example .env
```

### 2. Create AWS IAM User
Go to AWS Console → IAM → Users → Create user
- Username: `property-app-dev`
- Access type: Programmatic access
- Policy: AmazonS3FullAccess
- Save: Access Key ID + Secret Key

### 3. Create S3 Bucket
Go to AWS Console → S3 → Create bucket
- Name: `property-app-dev`
- Region: `us-east-1` (or your choice)
- Enable CORS (see ENV_SETUP.md)

### 4. Fill `.env` File
```env
VITE_AWS_ACCESS_KEY_ID=your-access-key
VITE_AWS_SECRET_ACCESS_KEY=your-secret-key
VITE_AWS_REGION=us-east-1
VITE_S3_BUCKET_NAME=property-app-dev
VITE_PRODUCTION=false
```

### 5. Test It
```bash
npm run dev
# Login: demo@example.com / password
# Upload image in admin panel
# Verify it appears in S3 console
```

---

## ⚠️ Important Rules

❌ **DO NOT commit `.env` file** (already protected in .gitignore)
❌ **DO NOT share credentials** via email or chat
❌ **DO NOT hardcode credentials** in code
❌ **DO NOT use production keys** for development

✅ **DO save credentials** in password manager (1Password, LastPass)
✅ **DO use separate buckets** for dev and production
✅ **DO rotate keys** annually
✅ **DO enable CORS** on S3 bucket (see ENV_SETUP.md)

---

## Environment Variables

### Required (S3)
```
VITE_AWS_ACCESS_KEY_ID       AWS access key
VITE_AWS_SECRET_ACCESS_KEY   AWS secret key
VITE_AWS_REGION              AWS region (default: us-east-1)
VITE_S3_BUCKET_NAME          S3 bucket name
```

### Optional (Cognito Auth)
```
VITE_USER_POOL_ID            Cognito user pool ID
VITE_USER_POOL_CLIENT_ID     Cognito client ID
```
If not set, uses mock auth: `demo@example.com` / `password`

### Optional (Branding)
```
VITE_APP_NAME                App name
VITE_PRODUCTION              'true' or 'false'
```

---

## Troubleshooting

### Error: "Access Denied"
→ Check credentials are copied correctly
→ Wait 5 minutes after creating IAM user

### Error: "NoSuchBucket"  
→ Check bucket name matches exactly
→ Bucket names are case-sensitive

### Error: "CORS policy error"
→ Enable CORS on bucket (ENV_SETUP.md Step 5)
→ Restart dev server
→ Clear browser cache

### Images not uploading
→ Check CORS configuration
→ Verify S3 permissions
→ Check browser console for errors

---

## Files to Read

| File | When | Purpose |
|------|------|---------|
| `.env.example` | Always | Reference template |
| `ENV_SETUP.md` | First time | Step-by-step setup |
| `ENV_CREDENTIALS_TEMPLATE.md` | When filling .env | Variable reference |
| `DEPLOYMENT_GUIDE.md` | Before deploying | Production setup |
| `ENV_CONFIGURATION_SUMMARY.md` | For overview | Summary of all files |

---

## Quick Commands

```bash
# Copy template
cp .env.example .env

# Start dev server
npm run dev

# Build for production
npm run build

# Test S3 access with AWS CLI
aws s3 ls --profile default

# Check credentials
echo $VITE_AWS_ACCESS_KEY_ID
echo $VITE_S3_BUCKET_NAME
```

---

## Next Step

👉 **Read `ENV_SETUP.md` for detailed step-by-step instructions**

---

**Your project is ready! Just fill in your AWS credentials. 🚀**
